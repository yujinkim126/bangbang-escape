import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useApp } from "../lib/data";
import { supabase } from "../lib/supabase";
import { Logo } from "../components/Icon";

export default function LoginPage() {
  const { session, demo } = useApp();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (session && !demo) return <Navigate to="/" replace />;

  async function signInWithKakao() {
    setBusy(true);
    setErr(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: { redirectTo: window.location.origin },
      });
      if (error) setErr(error.message);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "카카오 로그인을 시작하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page narrow">
      <div className="login card">
        <Logo size={128} bounce />
        <h1>방방</h1>
        <p className="tagline">방탈출 기록하고, 테마 찾고, 뱃지 모으기</p>
        {demo ? (
          <>
            <p className="muted small">이 화면은 브라우저에만 기록을 저장해요. 카카오 로그인은 계정 연결 후에 쓸 수 있어요.</p>
            <Link to="/records/new" className="btn wide">기록하기</Link>
          </>
        ) : (
          <>
            <p className="muted small">카카오 계정으로 로그인하면 기록이 계정에 저장돼요.</p>
            {err && <div className="banner error">{err}</div>}
            <button className="btn kakao wide" type="button" onClick={signInWithKakao} disabled={busy}>
              {busy ? "카카오로 이동 중…" : "카카오로 로그인"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
