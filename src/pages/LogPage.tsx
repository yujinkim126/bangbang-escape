import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../lib/data";
import { recommend } from "../lib/badges";
import { formatRemaining } from "../lib/format";
import Recommendations from "../components/Recommendations";
import Icon from "../components/Icon";
import { toast } from "../components/Toast";
import { Seal, Thumb } from "../components/Bits";

const monthKey = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}년 ${d.getMonth() + 1}월`; };
const dayText = (iso: string) => { const d = new Date(iso); return `${d.getMonth() + 1}.${d.getDate()}`; };

export default function LogPage() {
  const { demo, session, records, catalog, badgeStates, deleteRecord } = useApp();

  const stats = useMemo(() => {
    const themesPlayed = new Set(records.map((r) => r.theme_id)).size;
    const ok = records.filter((r) => r.success).length;
    const rate = records.length ? Math.round((ok / records.length) * 100) : 0;
    const earned = badgeStates.filter((s) => s.earned).length;
    const now = new Date();
    const thisMonth = records.filter((r) => {
      const d = new Date(r.played_at);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
    return { themesPlayed, rate, earned, thisMonth };
  }, [records, badgeStates]);

  const recs = useMemo(() => recommend(badgeStates, records, catalog, 2), [badgeStates, records, catalog]);

  // 기록은 최신순으로 오니까 월별로 묶기만 함
  const groups = useMemo(() => {
    const m = new Map<string, typeof records>();
    for (const r of records) m.set(monthKey(r.played_at), [...(m.get(monthKey(r.played_at)) ?? []), r]);
    return [...m.entries()];
  }, [records]);

  if (!session) {
    return (
      <div className="page narrow">
        <div className="page-head"><div><h1>방탈출 기록장</h1><p>로그인하면 플레이한 테마를 기록하고 뱃지를 모을 수 있어요.</p></div></div>
        <Link to="/login" className="btn wide">로그인</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1>
          {stats.thisMonth > 0
            ? <>이번 달에 테마<br /><span className="hl">{stats.thisMonth}개</span>를 했어요</>
            : <>이번 달엔 아직<br />기록이 없어요</>}
        </h1>
        <Link to="/records/new" className="btn sm"><Icon name="plus" size={16} />기록하기</Link>
      </div>

      {demo && <p className="source-note">기록은 이 브라우저에 저장돼요. 다른 기기와 동기화되지 않으며, 브라우저 데이터를 지우면 기록도 삭제돼요.</p>}
      <div className="stats">
        <div className="stat card hero"><div className="stat-num">{stats.themesPlayed}</div><div className="stat-label">플레이한 테마</div></div>
        <div className="stat card"><div className="stat-num">{stats.rate}<small>%</small></div><div className="stat-label">탈출률</div></div>
        <div className="stat card"><div className="stat-num">{stats.earned}</div><div className="stat-label">모은 뱃지</div></div>
      </div>

      <Recommendations recs={recs} />

      <section>
        <h2 className="section-title">내 기록 <span className="muted">{records.length}개</span></h2>
        {records.length === 0 && (
          <div className="empty card">
            아직 기록이 없어요.<br /><Link to="/records/new" className="hl">해본 테마를 찾아서</Link> 첫 기록을 남겨보세요.
          </div>
        )}
        <div className="log-list">
          {groups.map(([month, rs]) => (
            <div key={month} className="log-list">
              <div className="month">{month}</div>
              {rs.map((r) => {
                const t = catalog.themes.get(r.theme_id);
                const s = t && catalog.stores.get(t.store_id);
                return (
                  <div key={r.id} className="log-row card">
                    <Thumb genres={t?.genres ?? []} />
                    <div className="log-main">
                      <Link to={`/themes?theme=${r.theme_id}`} className="log-title">{t?.name ?? "(삭제된 테마)"}</Link>
                      <div className="log-meta">
                        {dayText(r.played_at)} · {s?.name}
                        {r.success && formatRemaining(r.remaining_sec) ? ` · ${formatRemaining(r.remaining_sec)}` : ""}
                        {r.hints_used != null ? ` · 힌트 ${r.hints_used}` : ""}
                        {r.rating ? ` · ★ ${r.rating.toFixed(1)}` : ""}
                      </div>
                      {r.companions.length > 0 && (
                        <div className="log-with">{r.companions.map((c) => <span key={c} className="person">{c}</span>)}</div>
                      )}
                      {r.felt_activity != null && <div className="log-meta">활동성 · {["거의 없음", "가벼움", "보통", "많음"][r.felt_activity]}</div>}
                      {r.memo && <div className="memo">{r.memo}</div>}
                    </div>
                    <div className="log-side">
                      <Seal success={r.success} />
                      <button className="link-btn danger" onClick={async () => { if (confirm("이 기록을 지울까요?")) { try { await deleteRecord(r.id); } catch (e) { toast({emoji:"⚠️",title:"삭제하지 못했어요",body:(e as Error).message}); } } }}>삭제</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
