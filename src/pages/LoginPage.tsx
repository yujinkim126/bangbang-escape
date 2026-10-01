import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useApp } from "../lib/data";
import { supabase } from "../lib/supabase";
import { Logo } from "../components/Icon";

export default function LoginPage() {
  const { session, demo } = useApp();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // 체험 모드는 늘 로그인된 상태라, 화면 확인용으로 리다이렉트하지 않음
  if (session && !demo) return <Navigate to="/" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (demo) { setSent(true); return; } // 체험 모드: 메일은 안 보내고 완료 화면만
    setBusy(true);
    setErr(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      // Supabase의 Site URL(기본 http://localhost:3000)과 정확히 같아야 해서 경로 없이 보냄
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) setErr(error.message);
    else setSent(true);
  }

  return (
    <div className="page narrow">
      <div className="login card">
        <Logo size={128} bounce />
        <h1>방방</h1>
        <p className="tagline">방탈출 기록하고, 테마 찾고, 뱃지 모으기</p>
        {sent ? (
          <p><b>{email}</b>로 로그인 링크를 보냈어요. 메일함에서 링크를 누르면 바로 들어와져요.{demo && <><br /><span className="muted small">(체험 모드라 실제로 보내진 않았어요)</span></>}</p>
        ) : (
          <form onSubmit={submit} className="login-form">
            <p className="muted small">비밀번호 없이, 이메일로 받은 링크를 누르면 로그인돼요.</p>
            <input className="input" type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            {err && <div className="banner error">{err}</div>}
            <button className="btn wide" disabled={busy}>{busy ? "보내는 중…" : "로그인 링크 받기"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
