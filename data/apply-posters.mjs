// data/poster-candidates.json → demo-catalog.json의 poster_url + sql/11-theme-posters.sql
import { readFile, writeFile } from 'node:fs/promises';

const catPath = new URL('../src/lib/demo-catalog.json', import.meta.url);
const catalog = JSON.parse(await readFile(catPath, 'utf8'));
const { posters, checked_at } = JSON.parse(await readFile(new URL('./poster-candidates.json', import.meta.url), 'utf8'));
const byTheme = new Map(posters.map((p) => [p.theme_id, p.poster_url]));

// http 주소는 https로 열리면 바꾸고, 아니면 /api/poster 중계 허용 목록에 넣는다
const httpsOk = new Map();
for (const [id, url] of byTheme) {
  if (!url.startsWith('http:')) continue;
  const host = new URL(url).host;
  if (!httpsOk.has(host)) {
    try { httpsOk.set(host, (await fetch(url.replace(/^http:/, 'https:'), { signal: AbortSignal.timeout(12000) })).ok); }
    catch { httpsOk.set(host, false); }
  }
  if (httpsOk.get(host)) byTheme.set(id, url.replace(/^http:/, 'https:'));
}
const proxied = [...new Set([...byTheme.values()].filter((u) => u.startsWith('http:')))].sort();
await writeFile(new URL('../api/_poster-allow.js', import.meta.url),
  `// data/apply-posters.mjs가 생성. https가 안 되는 매장 포스터 주소 (중계 허용 목록)\nexport const ALLOW = ${JSON.stringify(proxied, null, 1)};\n`);

const q = (s) => `'${s.replace(/'/g, "''")}'`;
const storeRef = (id) => (/^s\d+$/.test(id) ? `(select id from stores where kakao_id=${q(id.slice(1))})` : q(id));

const lines = [
  `-- 매장 공식 사이트의 포스터 이미지 주소 (파일은 저장하지 않고 링크만). 확인: ${checked_at.slice(0, 10)}`,
  '-- data/find-posters.mjs → data/apply-posters.mjs 로 생성. 매장이 요청하면 해당 행을 null로 되돌릴 것',
  'begin;',
];
for (const t of catalog.themes) {
  const url = byTheme.get(t.id) ?? null;
  t.poster_url = url;
  if (url) lines.push(`update themes set poster_url=${q(url)} where store_id=${storeRef(t.store_id)} and name=${q(t.name)};`);
}
lines.push('commit;', '');

await writeFile(catPath, JSON.stringify(catalog, null, 2) + '\n');
await writeFile(new URL('../sql/11-theme-posters.sql', import.meta.url), lines.join('\n'));
console.log(`poster_url ${byTheme.size}/${catalog.themes.length} (중계 ${proxied.length})`);
