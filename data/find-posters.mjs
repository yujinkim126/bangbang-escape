// 매장 공식 사이트(source_url)에서 테마 포스터 이미지 주소를 찾는다.
// 이미지 파일은 저장하지 않고 주소만 data/poster-candidates.json에 남긴다.
// robots.txt에서 막힌 경로, 크롤링 금지 문구가 있는 사이트는 건너뛴다.
import { readFile, writeFile } from 'node:fs/promises';
import { parseHTML } from 'linkedom';

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

// HTML을 문서 구조로 읽어 짝짓기.
// 1) 이미지 alt에 테마 이름이 있으면 확정
// 2) 테마 이름이 적힌 가장 안쪽 요소에서 위로 올라가며, 포스터 후보 이미지가 처음 나오는 조상이
//    이미지를 딱 하나(같은 주소) 품고 있으면 그 카드의 포스터로 본다. 둘 이상이면 애매해서 버린다
const SKIP = /logo|icon|btn|button|arrow|banner|sns|kakao|naver|insta|blank|spacer|\.svg|(^|\/)ico?[_-]/i;
function match(html, base, themes) {
  const { document } = parseHTML(html);
  const abs = (s) => { try { return new URL(s.replace(/&amp;/g, '&'), base).href; } catch { return null; } };
  const imgSrc = (el) => {
    if (el.tagName === 'IMG') return attr(el.outerHTML);
    const m = (el.getAttribute('style') || '').match(/background(?:-image)?\s*:\s*url\(\s*['"]?([^'")]+)/i);
    return m?.[1];
  };
  const cands = [...document.querySelectorAll('img, [style*="url("]')]
    .map((el) => ({ el, src: imgSrc(el) }))
    .filter((c) => c.src && !c.src.startsWith('data:') && !SKIP.test(c.src))
    .map((c) => ({ ...c, src: abs(c.src) }))
    .filter((c) => c.src);
  // 페이지에 여러 번 나오는 이미지(별점·아이콘)는 제외. 같은 포스터가 두 지점 탭에 나오는 경우는 남긴다
  const count = {};
  for (const c of cands) count[c.src] = (count[c.src] || 0) + 1;
  const posters = cands.filter((c) => count[c.src] < 3);
  const isPoster = new Set(posters.map((c) => c.el));
  const srcOf = new Map(posters.map((c) => [c.el, c.src]));

  const found = new Map();
  const names = themes.map((t) => ({ t, n: norm(t.name) })).filter((x) => x.n.length >= 1).sort((a, b) => b.n.length - a.n.length);

  for (const c of posters) {
    const alt = norm(c.el.getAttribute('alt') || '');
    if (!alt) continue;
    const hit = names.find(({ t, n }) => !found.has(t.id) && n.length >= 2 && alt.includes(n));
    if (hit) found.set(hit.t.id, { theme_id: hit.t.id, name: hit.t.name, poster_url: c.src, how: 'alt' });
  }

  // 파일 이름에 테마 이름이 들어 있으면 확정 (예: /upload_file/room/구둣방손님(1).jpg)
  for (const c of posters) {
    let file; try { file = norm(decodeURIComponent(new URL(c.src).pathname.split('/').pop().replace(/\.\w+$/, ''))); } catch { continue; }
    const hit = names.find(({ t, n }) => !found.has(t.id) && n.length >= 2 && file.includes(n));
    if (hit) found.set(hit.t.id, { theme_id: hit.t.id, name: hit.t.name, poster_url: c.src, how: 'filename' });
  }

  // 텍스트가 정확히 테마 이름인(또는 이름을 포함하는 짧은) 가장 안쪽 요소
  const textEls = [...document.querySelectorAll('body *')].filter((el) => !['SCRIPT', 'STYLE', 'NOSCRIPT', 'OPTION', 'SELECT'].includes(el.tagName));
  for (const { t, n } of names) {
    if (found.has(t.id)) continue;
    const holders = textEls.filter((el) => {
      const own = norm(el.textContent || '');
      if (!own.includes(n) || own.length > n.length + 40) return false;
      return ![...el.children].some((ch) => norm(ch.textContent || '').includes(n));
    });
    for (const h of holders) {
      let el = h, srcs = null;
      for (let up = 0; up < 8 && el && el.tagName !== 'BODY'; up++, el = el.parentElement) {
        const inside = [...el.querySelectorAll('*')].filter((x) => isPoster.has(x)).map((x) => srcOf.get(x));
        if (isPoster.has(el)) inside.push(srcOf.get(el));
        if (inside.length) { srcs = new Set(inside); break; }
      }
      if (srcs?.size === 1) {
        found.set(t.id, { theme_id: t.id, name: t.name, poster_url: [...srcs][0], how: 'card' });
        break;
      }
    }
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
