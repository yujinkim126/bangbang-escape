import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../lib/data";
import { supabase } from "../lib/supabase";
import Icon, { Logo } from "./Icon";

// 어디서든 openLogin()을 부르면 지금 화면 위에 로그인 창이 뜬다 (Toast와 같은 방식)
let setOpen: ((open: boolean) => void) | null = null;
export function openLogin() {
  setOpen?.(true);
}

export function LoginPanel({ onDone }: { onDone?: () => void }) {
  const { demo } = useApp();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signInWithKakao() {
    setBusy(true);
    setErr(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        // 로그인 후 보던 화면으로 돌아오기. Supabase Redirect URLs에 없는 주소면 Site URL로 돌아간다
        options: { redirectTo: window.location.origin + window.location.pathname + window.location.search },
      });
      if (error) setErr(error.message);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "카카오 로그인을 시작하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <Logo size={112} bounce />
      <h1>방방</h1>
      <p className="tagline">방탈출 기록하고, 테마 찾고, 뱃지 모으기</p>
      {demo ? (
        <>
          <p className="muted small">이 화면은 브라우저에만 기록을 저장해요. 카카오 로그인은 계정 연결 후에 쓸 수 있어요.</p>
          <Link to="/records/new" className="btn wide" onClick={onDone}>기록하기</Link>
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
  );
}

export function LoginHost() {
  const { session, demo } = useApp();
  const [open, setOpenState] = useState(false);
  useEffect(() => {
    setOpen = setOpenState;
    return () => { setOpen = null; };
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenState(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  // 로그인되면 자동으로 닫기
  useEffect(() => { if (session && !demo) setOpenState(false); }, [session, demo]);

  if (!open) return null;
  const close = () => setOpenState(false);
  return (
    <div className="sheet-backdrop login-backdrop" onClick={close}>
      <div className="sheet card login-sheet" role="dialog" aria-modal aria-label="로그인" onClick={(e) => e.stopPropagation()}>
        <button className="sheet-close" onClick={close} aria-label="닫기"><Icon name="close" size={18} /></button>
        <LoginPanel onDone={close} />
      </div>
    </div>
  );
}
