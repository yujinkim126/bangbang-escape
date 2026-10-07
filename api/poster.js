// http로만 열리는 매장 포스터를 https 페이지에서 보여주기 위한 중계.
// 카탈로그에 있는 포스터 주소(_poster-allow.js, apply-posters.mjs가 생성)만 허용한다.
import { ALLOW } from './_poster-allow.js';

const allowed = new Set(ALLOW);
const TYPES = { ffd8ff: 'image/jpeg', '89504e': 'image/png', '474946': 'image/gif', '524946': 'image/webp' };

export async function GET(request) {
  const url = new URL(request.url).searchParams.get('url') ?? '';
  if (!allowed.has(url)) return new Response('not allowed', { status: 403 });

  let upstream;
  try {
    upstream = await fetch(url, { headers: { 'user-agent': 'bangbang-poster-proxy/1.0 (+https://bangbang-escape.vercel.app)' }, signal: AbortSignal.timeout(15000) });
  } catch {
    return new Response('upstream unreachable', { status: 502 });
  }
  if (!upstream.ok) return new Response('upstream error', { status: 502 });

  const body = await upstream.arrayBuffer();
  const sig = Buffer.from(body.slice(0, 3)).toString('hex');
  const type = TYPES[sig];
  if (!type) return new Response('not an image', { status: 502 });

  return new Response(body, {
    headers: {
      'content-type': type,
      // 브라우저 1일, Vercel CDN 7일. 매장이 내리면 sql/11에서 지우고 재배포하면 허용 목록에서도 빠진다
      'cache-control': 'public, max-age=86400, s-maxage=604800',
    },
  });
}
