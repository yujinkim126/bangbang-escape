// 매장 공식 사이트(source_url)에서 테마 포스터 이미지 주소를 찾는다.
// 이미지 파일은 저장하지 않고 주소만 data/poster-candidates.json에 남긴다.
// robots.txt에서 막힌 경로, 크롤링 금지 문구가 있는 사이트는 건너뛴다.
import { readFile, writeFile } from 'node:fs/promises';

const catalog = JSON.parse(await readFile(new URL('../src/lib/demo-catalog.json', import.meta.url), 'utf8'));
const UA = 'bangbang-poster-check/1.0 (+https://bangbang-escape.vercel.app)';
const SITE = 'https://bangbang-escape.vercel.app/';
const BAN = /크롤링\s*금지|무단\s*(수집|크롤링|복제)|스크래핑\s*금지|자동화된\s*(수집|프로그램)/;

const norm = (s) => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/g, '').replace(/[^\p{L}\p{N}]/gu, '');

async function get(url, opts = {}) {
  const ctl = AbortSignal.timeout(15000);
  return fetch(url, { headers: { 'user-agent': UA, ...opts.headers }, signal: ctl, redirect: 'follow' });
}

const robotsCache = new Map();
async function allowed(url) {
  const u = new URL(url);
  if (!robotsCache.has(u.origin)) {
    let rules = [];
    try {
      const r = await get(`${u.origin}/robots.txt`);
      if (r.ok) {
        let applies = false;
        for (const line of (await r.text()).split(/\r?\n/)) {
          const [k, ...rest] = line.split(':'); const v = rest.join(':').trim();
          if (/^user-agent$/i.test(k.trim())) applies = v === '*' || /bangbang/i.test(v);
          else if (applies && /^disallow$/i.test(k.trim()) && v) rules.push(v);
        }
      }
    } catch {}
    robotsCache.set(u.origin, rules);
  }
  const path = u.pathname + u.search;
  return !robotsCache.get(u.origin).some((r) => path.startsWith(r.replace(/\*.*$/, '')));
}

// 지연 로딩 속성을 먼저 보고, data: 자리표시 이미지는 건너뛴다
function attr(tag) {
  for (const a of ['data-src', 'data-original', 'data-lazy-src', 'src']) {
    const v = (tag.match(new RegExp(`\\b${a}\\s*=\\s*["']([^"']+)["']`, 'i')) || [])[1];
    if (v && !v.startsWith('data:')) return v;
  }
}

async function decode(r) {
  const buf = Buffer.from(await r.arrayBuffer());
  const head = buf.subarray(0, 4000).toString('latin1');
  const cs = ((r.headers.get('content-type') || '').match(/charset=([\w-]+)/i) || head.match(/charset=["']?([\w-]+)/i) || [])[1] || 'utf-8';
  try { return new TextDecoder(/euc-kr|ks_c_5601|cp949/i.test(cs) ? 'euc-kr' : cs).decode(buf); } catch { return buf.toString('utf8'); }
}

// 이미지 태그 + 주변 텍스트에서 테마 이름을 찾아 짝짓기
function match(html, base, themes) {
  const found = new Map();
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)];
  const bgs = [...html.matchAll(/background(?:-image)?\s*:\s*url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)];
  const cands = [
    ...imgs.map((m) => ({ tag: m[0], at: m.index, src: attr(m[0]) })),
    ...bgs.map((m) => ({ tag: m[0], at: m.index, src: m[1] })),
    // 스크립트·JSON 안에 들어 있는 이미지 주소 (Next.js 등)
    ...[...html.matchAll(/(?:https?:)?(?:\\?\/)[^\s"'()<>\\]*?\.(?:jpe?g|png|webp)(?:\?[^\s"'()<>\\]*)?/gi)].map((m) => ({ tag: '', at: m.index, src: m[0].replace(/\\\//g, '/') })),
  ].filter((c) => c.src && !c.src.startsWith('data:') && !/logo|icon|btn|button|arrow|banner|sns|kakao|naver|insta|blank|spacer|\.svg|\.gif|(^|\/)ico?[_-]/i.test(c.src));
  // 페이지에 여러 번 반복되는 이미지는 별점·아이콘 같은 장식
  const seen = {};
  for (const c of cands) if (c.tag) seen[c.src] = (seen[c.src] || 0) + 1;
  for (let i = cands.length - 1; i >= 0; i--) if (seen[cands[i].src] >= 3) cands.splice(i, 1);
  // 같은 이미지가 태그와 원문 주소로 두 번 잡힌 것 정리
  const imgsAt = [];
  for (const c of cands.sort((a, b) => a.at - b.at)) {
    let src; try { src = new URL(c.src.replace(/&amp;/g, '&'), base).href; } catch { continue; }
    const prev = imgsAt.at(-1);
    if (prev && prev.src === src && c.at - prev.at < 400) continue;
    imgsAt.push({ ...c, src, alt: norm((c.tag.match(/\balt\s*=\s*["']([^"']*)["']/i) || [])[1] || '') });
  }
  const names = themes.map((t) => ({ t, n: norm(t.name) })).filter((x) => x.n.length >= 2).sort((a, b) => b.n.length - a.n.length);

  // 1) alt에 테마 이름이 들어 있으면 바로 확정
  for (const im of imgsAt) {
    const hit = names.find(({ t, n }) => !found.has(t.id) && im.alt.includes(n));
    if (hit) { found.set(hit.t.id, { theme_id: hit.t.id, name: hit.t.name, poster_url: im.src, how: 'alt' }); im.used = true; }
  }

  // 2) 원문에서 이름이 나오는 위치 (긴 이름부터, 겹치는 자리는 건너뜀)
  const sep = '(?:<[^>]*>|&[#\\w]+;|[^\\p{L}\\p{N}<]){0,6}';
  const taken = [], occ = [];
  for (const { t } of names) {
    const chars = [...t.name.replace(/[^\p{L}\p{N}]/gu, '')].map((ch) => ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const re = new RegExp(chars.join(sep), 'giu');
    for (const m of html.matchAll(re)) {
      const a = m.index, b = a + m[0].length;
      if (taken.some(([x, y]) => a < y && b > x)) continue;
      taken.push([a, b]); occ.push({ t, at: a, end: b });
    }
  }

  // 3) 이미지와 이름이 서로 가장 가까울 때만 짝짓기
  const dist = (im, o) => (im.at < o.at ? o.at - im.at : im.at - o.end);
  const free = imgsAt.filter((im) => !im.used);
  for (const o of occ) {
    if (found.has(o.t.id) || !free.length) continue;
    const im = free.reduce((a, b) => (dist(b, o) < dist(a, o) ? b : a));
    if (dist(im, o) > 1500) continue;
    const back = occ.reduce((a, b) => (dist(im, b) < dist(im, a) ? b : a));
    if (back !== o) continue;
    found.set(o.t.id, { theme_id: o.t.id, name: o.t.name, poster_url: im.src, how: 'nearest' });
  }
  return [...found.values()];
}

async function imageOk(url) {
  try {
    const r = await get(url, { headers: { referer: SITE } });
    if (!r.ok) { await r.body?.cancel(); return false; }
    // content-type이 octet-stream인 CDN도 있어서 파일 앞부분으로 판별
    const buf = Buffer.from(await r.arrayBuffer());
    const sig = buf.subarray(0, 4).toString('hex');
    const isImg = sig.startsWith('ffd8ff') || sig === '89504e47' || sig === '47494638' || (sig === '52494646' && buf.subarray(8, 12).toString() === 'WEBP');
    return isImg && buf.length > 9000; // 더 작은 건 로고·실루엣 자리표시였음
  } catch { return false; }
}

const bySource = new Map();
for (const t of catalog.themes) (bySource.get(t.source_url) ?? bySource.set(t.source_url, []).get(t.source_url)).push(t);

const out = { checked_at: new Date().toISOString(), skipped: [], posters: [] };
for (const [url, themes] of bySource) {
  const host = new URL(url).host;
  if (!(await allowed(url))) { out.skipped.push({ url, reason: 'robots.txt' }); continue; }
  let html;
  try { const r = await get(url); if (!r.ok) throw new Error(`HTTP ${r.status}`); html = await decode(r); }
  catch (e) { out.skipped.push({ url, reason: String(e.message || e) }); continue; }
  if (BAN.test(html.replace(/<[^>]+>/g, ' '))) { out.skipped.push({ url, reason: '크롤링 금지 문구' }); continue; }
  const hits = match(html, url, themes);
  let ok = 0;
  for (const h of hits) if (await imageOk(h.poster_url)) { out.posters.push({ ...h, host, source_url: url }); ok++; }
  console.log(`${host.padEnd(32)} ${String(ok).padStart(3)}/${themes.length}  (${hits.length} matched)`);
}
await writeFile(new URL('./poster-candidates.json', import.meta.url), JSON.stringify(out, null, 2));
console.log(`\n총 ${out.posters.length}/${catalog.themes.length}개, 건너뜀 ${out.skipped.length}곳`);
for (const s of out.skipped) console.log('  skip', s.reason, s.url);
