import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import { useApp } from "./lib/data";
import MapPage from "./pages/MapPage";
import ThemesPage from "./pages/ThemesPage";
import LogPage from "./pages/LogPage";
import BadgesPage from "./pages/BadgesPage";
import LoginPage from "./pages/LoginPage";
import { ToastHost } from "./components/Toast";
import Icon, { Logo, type IconName } from "./components/Icon";

import RecordPage from "./pages/RecordPage";

const NAV: { to: string; label: string; icon: IconName; also?: string }[] = [
  { to: "/", label: "내 기록", icon: "log" },
  { to: "/records/new", label: "기록하기", icon: "plus" },
  { to: "/themes", label: "찾기", icon: "search", also: "/map" },
  { to: "/badges", label: "뱃지", icon: "badge" },
];

export default function App() {
  const { session, signOut, error, ready, demo } = useApp();
  const { pathname } = useLocation();

  return (
    <div className="shell">
      <header className="topbar">
        <NavLink to="/" className="brand" aria-label="방방 홈">
          <Logo />
          <span className="brand-name">방방</span>
        </NavLink>
        <nav className="nav" aria-label="메뉴">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === "/"}
              className={({ isActive }) => `nav-link ${isActive || (n.also && pathname.startsWith(n.also)) ? "active" : ""}`}>
              <Icon name={n.icon} />
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="account">
          {demo ? (
            <span className="demo-chip" title="기록은 이 브라우저에 저장돼요. 브라우저 데이터를 지우면 기록도 삭제돼요.">이 기기에 저장</span>
          ) : session ? (
            <button className="btn-ghost sm" onClick={signOut} title={session.user.email ?? ""}>로그아웃</button>
          ) : (
            <NavLink to="/login" className="btn sm">로그인</NavLink>
          )}
        </div>
      </header>

      {error && <div className="banner error">데이터를 불러오지 못했어요: {error}</div>}

      <main className="main">
        {!ready ? (
          <div className="loading">불러오는 중…</div>
        ) : (
          <Routes>
            <Route path="/" element={<LogPage />} />
            <Route path="/records/new" element={<RecordPage />} />
            <Route path="/themes" element={<ThemesPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/badges" element={<BadgesPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        )}
      </main>
      <ToastHost />
    </div>
  );
}
