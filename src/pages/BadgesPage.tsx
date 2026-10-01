import type { CSSProperties } from "react";
import { useApp } from "../lib/data";
import type { BadgeState } from "../lib/badges";
import { formatDate } from "../lib/format";

const GROUPS: { key: BadgeState["badge"]["category"]; title: string }[] = [
  { key: "collect", title: "수집" },
  { key: "style", title: "플레이 스타일" },
  { key: "relation", title: "함께한 사람" },
];

export default function BadgesPage() {
  const { badgeStates, session } = useApp();
  const earned = badgeStates.filter((s) => s.earned).length;

  const total = badgeStates.length;
  const pct = total ? Math.round((earned / total) * 100) : 0;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>뱃지</h1>
          <p>{session ? "기록할 때마다 조건에 맞는 뱃지를 받아요" : "로그인하면 기록에 따라 뱃지가 쌓여요"}</p>
        </div>
      </div>

      {session && (
        <div className="board-summary card">
          <div className="row">
            <span className="big">{earned}<small> / {total}개</small></span>
            <span className="muted small">{pct}% 모았어요</span>
          </div>
          <div className="bar"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
        </div>
      )}

      {GROUPS.map((g) => (
        <section key={g.key}>
          <h2 className="section-title">{g.title}</h2>
          <div className="badge-grid">
            {badgeStates.filter((s) => s.badge.category === g.key).map((s) => {
              const p = Math.round((s.progress / s.target) * 100);
              return (
                <div key={s.badge.code} className={`badge-cell card ${s.earned ? "earned" : ""}`}>
                  <div className="badge-ring" style={{ "--pct": `${p}%` } as CSSProperties}>
                    <div className="badge-face"><span>{s.badge.emoji}</span></div>
                  </div>
                  <div className="badge-name">{s.badge.name}</div>
                  <div className="badge-desc">{s.badge.description}</div>
                  {s.earned ? (
                    <div className="badge-date">{s.earnedBy ? `${formatDate(s.earnedBy.played_at)} 획득` : "획득"}</div>
                  ) : s.target > 1 ? (
                    <div className="badge-progress">{s.detail ?? `${s.progress} / ${s.target}`}</div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
