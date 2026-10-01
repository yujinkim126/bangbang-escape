import { useState } from 'react';
import type { Theme } from '../lib/types';

export default function ThemePoster({ theme }: { theme: Theme }) {
  const [failed, setFailed] = useState(false);
  return theme.poster_url && !failed
    ? <img className="theme-poster" src={theme.poster_url} alt={`${theme.name} 포스터`} loading="lazy" onError={() => setFailed(true)} />
    : <div className="theme-poster poster-placeholder" aria-hidden="true"><span>{theme.genres[0] || 'ESCAPE ROOM'}</span><strong>{theme.name}</strong><span>방방 · 다음 이야기</span></div>;
}
