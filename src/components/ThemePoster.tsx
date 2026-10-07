import { useState, type CSSProperties } from 'react';
import type { Theme } from '../lib/types';

// 포스터가 없을 때 쓰는 장르 커버. 장르 키워드 → 색(hue)과 아이콘
const COVERS: { keys: string[]; emoji: string; hue: number }[] = [
  { keys: ['공포', '호러', '괴담', '오컬트', '으스스'], emoji: '👻', hue: 265 },
  { keys: ['스릴러', '서스펜스', '범죄', '추적', '추격', '탈옥', '생존', '재난'], emoji: '🕯️', hue: 8 },
  { keys: ['추리', '미스터리', '수사', '탐문', '문제'], emoji: '🔍', hue: 212 },
  { keys: ['잠입', '탈취', '절도', '첩보', '해킹'], emoji: '🕶️', hue: 232 },
  { keys: ['판타지', '동화', '요정', '환상', '꿈', '드림', '설화'], emoji: '🔮', hue: 288 },
  { keys: ['코믹', '병맛', '아케이드', '게임', '머니'], emoji: '🎈', hue: 42 },
  { keys: ['드라마', '감성', '스토리', '로맨스', '연애', '힐링', '일상'], emoji: '🌙', hue: 335 },
  { keys: ['어드벤', '모험', '미션', '액션', '히어로', '도전', '야외', '여행'], emoji: '🧭', hue: 148 },
  { keys: ['SF', '시간', '공상'], emoji: '🚀', hue: 190 },
  { keys: ['큐트', '고양이'], emoji: '🐾', hue: 22 },
];
const FALLBACK = { emoji: '🔐', hue: 172 };

function coverOf(genres: string[]) {
  for (const g of genres) {
    const hit = COVERS.find(c => c.keys.some(k => g.includes(k)));
    if (hit) return hit;
  }
  return FALLBACK;
}

// https 페이지에선 http 이미지가 막히므로 /api/poster(api/poster.js)로 중계
function posterSrc(url: string) {
  return url.startsWith('http:') && location.protocol === 'https:' ? `/api/poster?url=${encodeURIComponent(url)}` : url;
}

export default function ThemePoster({ theme }: { theme: Theme }) {
  const [failed, setFailed] = useState(false);
  if (theme.poster_url && !failed) return <img className="theme-poster" src={posterSrc(theme.poster_url)} alt={`${theme.name} 포스터`} loading="lazy" onError={() => setFailed(true)} />;
  const { emoji, hue } = coverOf(theme.genres);
  return <div className="theme-poster poster-placeholder" style={{ '--h': hue } as CSSProperties} aria-hidden="true">
    <span className="poster-genre">{theme.genres[0] || '방탈출'}</span>
    <span className="poster-emoji">{emoji}</span>
  </div>;
}
