import { Link } from "react-router-dom";
import type { Recommendation } from "../lib/badges";
import { useApp } from "../lib/data";
import { difficultyText } from "../lib/format";

export default function Recommendations({ recs }: { recs: Recommendation[] }) {
  const { catalog } = useApp();
  if (!recs.length) return null;
  return (
    <section>
      <h2 className="section-title">다음에 해볼 테마 <span className="muted">내 기록 기준</span></h2>
      <div className="recs">
        {recs.map(({ state, themes }) => {
          const left = state.target - state.progress;
          return (
            <div key={state.badge.code} className="rec card">
              <div className="rec-head">
                <span className="rec-seal" aria-hidden>{state.badge.emoji}</span>
                <div>
                  <div className="rec-title">
                    {state.badge.name} 뱃지까지 <span className="rec-left">{left}{state.badge.rule.type === "distinct_stores" ? "곳" : "개"}</span> 남았어요
                  </div>
                  <div className="muted small">{state.detail ?? state.badge.description}</div>
                </div>
              </div>
              <div className="bar"><div className="bar-fill" style={{ width: `${Math.round((state.progress / state.target) * 100)}%` }} /></div>
              <div className="rec-themes">
                {themes.map((t) => (
                  <Link key={t.id} to={`/themes?theme=${t.id}`} className="rec-theme">
                    <span className="rec-theme-name">{t.name}</span>
                    <span className="muted small">{catalog.stores.get(t.store_id)?.name} · {difficultyText(t.difficulty)}</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
