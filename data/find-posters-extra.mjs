// find-posters.mjs로 못 찾은 사이트용 추가 수집. 결과를 poster-candidates.json에 더한다.
// - 셜록홈즈: 전체 테마 목록(/theme?start=N)
// - 룸즈에이: 사이트 스크립트 안의 { title, url } 포스터 목록
// - data/poster-browser-pairs.json: 브라우저로 화면을 띄워 읽은 { host, title, url } (JS로 그리는 사이트)
import { readFile, writeFile } from 'node:fs/promises';

const catalog = JSON.parse(await readFile(new URL('../src/lib/demo-catalog.json', import.meta.url), 'utf8'));
const candPath = new URL('./poster-candidates.json', import.meta.url);
const cand = JSON.parse(await readFile(candPath, 'utf8'));
const UA = 'bangbang-poster-check/1.0 (+https://bangbang-escape.vercel.app)';
const norm = (s) => s.toLowerCase().replace(/&[a-z#0-9]+;/g, '').replace(/\(\d+분\)|\[[^\]]*\]/g, '').replace(/[^\p{L}\p{N}]/gu, '');
const get = (u) => fetch(u, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000) });

const hostOf = (u) => new URL(u).host;
const have = new Set(cand.posters.map((p) => p.theme_id));

// 카탈로그 매장 이름에 지점명이 없는 곳 (주소로 확인: 동일로 112 = 건대1호점, 아차산로 191 = 건대3호점)
const BRANCH_ALIAS = { '엑스케이프': '엑스케이프 건대1호점', '방탈출 뉴케이스': '엑스케이프 건대3호점' };
const storeName = new Map(catalog.stores.map((s) => [s.id, BRANCH_ALIAS[s.name] ?? s.name]));

// 이름 대조: 같거나, 한쪽이 다른 쪽을 포함(3글자 이상). "이름 / 지점"이면 지점도 맞춘다
function pick(title, themes) {
  const [name, branch] = title.split(' / ');
  const n = norm(name);
  if (!n) return [];
  let hits = themes.filter((t) => norm(t.name) === n);
  if (!hits.length && n.length >= 3) hits = themes.filter((t) => { const m = norm(t.name); return m.length >= 3 && (n.includes(m) || m.includes(n)); });
  if (branch) hits = hits.filter((t) => norm(storeName.get(t.store_id) ?? '').includes(norm(branch)));
  return hits;
}

async function imageOk(url) {
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA, referer: 'https://bangbang-escape.vercel.app/' }, signal: AbortSignal.timeout(20000) });
    if (!r.ok) return false;
    const buf = Buffer.from(await r.arrayBuffer());
    const sig = buf.subarray(0, 4).toString('hex');
    return (sig.startsWith('ffd8ff') || sig === '89504e47' || sig === '47494638' || (sig === '52494646' && buf.subarray(8, 12).toString() === 'WEBP')) && buf.length > 9000;
  } catch { return false; }
}

const pairs = []; // { host, title, url, via }

// 셜록홈즈 전체 테마 목록: <img src="/attach/theme/..."> 다음 <div class="tit">이름</div>
for (let start = 0; start < 600; start += 12) {
  const html = await (await get(`https://sherlock-holmes.co.kr/theme?start=${start}`)).text();
  const items = [...html.matchAll(/<img src="(\/attach\/theme\/[^"]+)"[\s\S]{0,400}?<div class="tit">([^<]+)<\/div>/g)];
  if (!items.length) break;
  for (const m of items) pairs.push({ host: 'sherlock-holmes.co.kr', title: m[2].trim(), url: `https://sherlock-holmes.co.kr${m[1]}`, via: 'sherlock /theme' });
}

// 룸즈에이: 페이지가 불러오는 스크립트 안의 {title:`..`,url:`..`}
{
  const html = await (await get('https://roomsa.co.kr/reservation')).text();
  for (const src of new Set([...html.matchAll(/"(\/assets\/[^"]+\.js)"/g)].map((m) => m[1]))) {
    const js = await (await get(`https://roomsa.co.kr${src}`)).text();
    for (const m of js.matchAll(/title:`([^`]+)`,url:`(https:\/\/[^`]+\.(?:jpe?g|png|webp))`/g)) pairs.push({ host: 'roomsa.co.kr', title: m[1].replace(/^\d+:\s*/, ''), url: m[2], via: 'roomsa bundle' });
  }
}

// 브라우저로 읽은 목록
try {
  for (const p of JSON.parse(await readFile(new URL('./poster-browser-pairs.json', import.meta.url), 'utf8'))) pairs.push({ ...p, via: 'browser' });
} catch {}

// 이름이 명시된 목록이 1차 자동 매칭(alt/nearest)보다 정확하므로, 겹치면 덮어쓴다
let added = 0, fixed = 0;
const byHost = {};
for (const t of catalog.themes) (byHost[hostOf(t.source_url)] ??= []).push(t);
const explicit = new Set();
const checked = new Map();
for (const p of pairs) {
  for (const t of pick(p.title, byHost[p.host] ?? [])) {
    if (explicit.has(t.id)) continue;
    if (!checked.has(p.url)) checked.set(p.url, await imageOk(p.url));
    if (!checked.get(p.url)) continue;
    const row = { theme_id: t.id, name: t.name, poster_url: p.url, how: p.via, host: p.host, source_url: t.source_url };
    const i = cand.posters.findIndex((x) => x.theme_id === t.id);
    if (i < 0) { cand.posters.push(row); added++; }
    else if (cand.posters[i].poster_url !== p.url) { cand.posters[i] = row; fixed++; }
    explicit.add(t.id); have.add(t.id);
  }
}
console.log(`1차 매칭 수정 ${fixed}개`);
await writeFile(candPath, JSON.stringify(cand, null, 2));
console.log(`목록 ${pairs.length}개에서 ${added}개 추가 → 총 ${cand.posters.length}/${catalog.themes.length}`);
const left = {};
for (const t of catalog.themes) if (!have.has(t.id)) left[hostOf(t.source_url)] = (left[hostOf(t.source_url)] || 0) + 1;
console.log('남은 곳:', Object.entries(left).sort((a, b) => b[1] - a[1]).map(([h, n]) => `${h} ${n}`).join(', '));
