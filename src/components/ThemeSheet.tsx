import { Link } from "react-router-dom";
import { useApp } from "../lib/data";
import { difficultyText, fearText, formatDate, formatRemaining, playersText } from "../lib/format";
import type { Theme } from "../lib/types";
import ThemePoster from "./ThemePoster";
import Icon from "./Icon";
import { openLogin } from "./Login";
import { Dots, Seal } from "./Bits";

export default function ThemeSheet({ theme, onClose }: { theme: Theme; onClose: () => void }) {
  const { catalog, records, session } = useApp();
  const store = catalog.stores.get(theme.store_id);
  const mine = records.filter((r) => r.theme_id === theme.id);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet card" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
        <button className="sheet-close" onClick={onClose} aria-label="닫기"><Icon name="close" size={18} /></button>
        {(
          <>
            <div className="theme-store"><Icon name="pin" size={13} />{store?.name}</div>
            <ThemePoster theme={theme} />
            <h2 className="sheet-title">{theme.name}</h2>
            <dl className="facts">
              <div><dt>난이도</dt><dd><Dots value={theme.difficulty} />{difficultyText(theme.difficulty)}</dd></div>
              <div><dt>공포도</dt><dd>{fearText(theme.fear) ?? "미확인"}</dd></div>
              {theme.duration_min && <div><dt>시간</dt><dd>{theme.duration_min}분</dd></div>}
              {playersText(theme.players_min, theme.players_max) && <div><dt>추천 인원</dt><dd>{playersText(theme.players_min, theme.players_max)}</dd></div>}
              {theme.genres.length > 0 && <div><dt>장르</dt><dd>{theme.genres.join(", ")}</dd></div>}
            </dl>
            <p className="source-note">
              {theme.verified ? "검수된 정보예요." : "매장 공식 사이트에서 모은 정보예요."}{" "}
              <a href={theme.source_url} target="_blank" rel="noreferrer">공식 페이지에서 확인 →</a>
            </p>

            {mine.length > 0 && (
              <div className="mine">
                <div className="mine-title">내 기록</div>
                {mine.map((r) => (
                  <div key={r.id} className="mine-row">
                    <Seal success={r.success} />
                    <span>{formatDate(r.played_at)}</span>
                    {r.success && formatRemaining(r.remaining_sec) && <span className="muted">{formatRemaining(r.remaining_sec)}</span>}
                  </div>
                ))}
              </div>
            )}

            {session ? (
              <Link className="btn wide" to={`/records/new?theme=${encodeURIComponent(theme.id)}`}><Icon name="plus" />{mine.length ? "한 번 더 기록하기" : "기록하기"}</Link>
            ) : (
              <button type="button" className="btn wide" onClick={openLogin}>로그인하고 기록하기</button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

