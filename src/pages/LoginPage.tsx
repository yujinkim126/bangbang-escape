import { Navigate } from "react-router-dom";
import { useApp } from "../lib/data";
import { LoginPanel } from "../components/Login";

// 주소로 직접 들어온 경우용. 앱 안에서는 openLogin() 팝업을 쓴다
export default function LoginPage() {
  const { session, demo } = useApp();
  if (session && !demo) return <Navigate to="/" replace />;
  return (
    <div className="page narrow">
      <div className="card"><LoginPanel /></div>
    </div>
  );
}
