import { useState, type FormEvent } from "react";
import { useApp } from "../lib/data";
import type { Theme } from "../lib/types";
import { toast } from "./Toast";

function nowLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function RecordForm({ theme, onDone }: { theme: Theme; onDone: () => void }) {
  const { addRecord } = useApp();
  const [playedAt, setPlayedAt] = useState(nowLocal());
  const [success, setSuccess] = useState(true);
  const [min, setMin] = useState("");
  const [sec, setSec] = useState("");
  const [hints, setHints] = useState("");
  const [rating, setRating] = useState(0);
  const [feltDiff, setFeltDiff] = useState<number | null>(null);
  const [feltFear, setFeltFear] = useState<number | null>(null);
  const [feltActivity, setFeltActivity] = useState<number | null>(null);
  const [companions, setCompanions] = useState("");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const remaining = success && (min || sec) ? Number(min || 0) * 60 + Number(sec || 0) : null;
      const { newlyEarned } = await addRecord({
        theme_id: theme.id,
        played_at: new Date(playedAt).toISOString(),
        success,
        remaining_sec: remaining,
        hints_used: hints === "" ? null : Number(hints),
        rating: rating || null,
        felt_difficulty: feltDiff,
        felt_fear: feltFear,
        felt_activity: feltActivity,
        companions: companions.split(",").map((c) => c.trim()).filter(Boolean),
        memo: memo.trim() || null,
      });
      toast({ emoji: success ? "🔓" : "🔒", title: success ? "탈출 기록을 남겼어요" : "기록했어요. 다음엔 탈출!", body: theme.name });
      newlyEarned.forEach((s) => toast({ emoji: s.badge.emoji ?? "🏅", title: `뱃지 획득! ${s.badge.name}`, body: s.badge.description }));
      onDone();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="record-form" onSubmit={submit}>
      <div><span className="kicker">기록하기</span></div>
      <h2 className="sheet-title">{theme.name}</h2>

      <div className="seg">
        <button type="button" className={success ? "on ok" : ""} onClick={() => setSuccess(true)}>🔓 탈출</button>
        <button type="button" className={!success ? "on fail" : ""} onClick={() => setSuccess(false)}>🔒 실패</button>
      </div>

      <label className="field">언제 했나요
        <input className="input" type="datetime-local" value={playedAt} onChange={(e) => setPlayedAt(e.target.value)} required />
      </label>

      <div className="field-row">
        {success && (
          <label className="field">남은 시간
            <span className="time-input">
              <input className="input" inputMode="numeric" placeholder="분" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} />
              <span>:</span>
              <input className="input" inputMode="numeric" placeholder="초" value={sec} onChange={(e) => setSec(e.target.value.replace(/\D/g, "").slice(0, 2))} />
            </span>
          </label>
        )}
        <label className="field">힌트 수
          <input className="input" inputMode="numeric" placeholder="0" value={hints} onChange={(e) => setHints(e.target.value.replace(/\D/g, ""))} />
        </label>
      </div>

      <div className="field">별점
        <div className="stars" role="radiogroup">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" className={`star ${rating >= n ? "on" : rating >= n - 0.5 ? "half" : ""}`}
              onClick={() => setRating(rating === n ? n - 0.5 : n)} aria-label={`${n}점`}>★</button>
          ))}
          <span className="num">{rating ? rating.toFixed(1) : ""}</span>
        </div>
      </div>

      <div className="field">내가 느낀 난이도
        <div className="chips">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" className={`chip ${feltDiff === n ? "on" : ""}`} onClick={() => setFeltDiff(feltDiff === n ? null : n)}>{n}</button>
          ))}
        </div>
      </div>

      <div className="field">내가 느낀 공포도
        <div className="chips">
          {["없음", "약함", "보통", "강함"].map((l, i) => (
            <button key={l} type="button" className={`chip ${feltFear === i ? "on" : ""}`} onClick={() => setFeltFear(feltFear === i ? null : i)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="field">내가 느낀 활동성
        <div className="chips" role="group" aria-label="활동성">
          {["거의 없음", "가벼움", "보통", "많음"].map((label, i) => <button key={label} type="button" aria-pressed={feltActivity === i} className={`chip ${feltActivity === i ? "on" : ""}`} onClick={() => setFeltActivity(feltActivity === i ? null : i)}>{label}</button>)}
        </div>
        <span className="hint">이동하거나 몸을 쓰는 정도를 남겨주세요. 선택하지 않아도 돼요.</span>
      </div>

      <label className="field"><span>같이 간 사람 <span className="hint">쉼표로 구분</span></span>
        <input className="input" placeholder="민지, 현준" value={companions} onChange={(e) => setCompanions(e.target.value)} />
      </label>

      <label className="field"><span>한 줄 메모 <span className="hint">스포일러는 쓰지 말아주세요</span></span>
        <textarea className="input" rows={2} value={memo} onChange={(e) => setMemo(e.target.value)} />
      </label>

      {err && <div className="banner error">{err}</div>}
      <div className="form-actions">
        <button type="button" className="btn-ghost" onClick={onDone}>취소</button>
        <button className="btn" disabled={saving}>{saving ? "저장 중…" : "저장"}</button>
      </div>
    </form>
  );
}
