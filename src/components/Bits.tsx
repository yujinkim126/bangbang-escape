import { NavLink } from "react-router-dom";
import Icon from "./Icon";

// 여러 화면에서 같이 쓰는 작은 조각들

/** 탈출/실패 표시 */
export function Seal({ success, float }: { success: boolean; float?: boolean }) {
  return (
    <span className={`seal ${success ? "seal-ok" : "seal-fail"} ${float ? "float" : ""}`}>
      {success ? "탈출" : "실패"}
    </span>
  );
}

/** 난이도 1~5를 점 다섯 개로 (0.5 단위는 반쪽 점) */
export function Dots({ value }: { value: number | null }) {
  if (value == null) return null;
  return (
    <span className="dots" aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => (
        <i key={n} className={value >= n ? "on" : value >= n - 0.5 ? "half" : ""} />
      ))}
    </span>
  );
}

const GENRE_EMOJI: Record<string, string> = {
  공포: "👻", 스릴러: "🔪", 추리: "🔍", 감성: "💧", 코믹: "😂", 판타지: "🦄",
  SF: "🚀", 모험: "🧭", 잠입: "🥷", 문제방: "🧩", 야외: "🌳",
};
/** 테마 대표 장르 아이콘 */
export function Thumb({ genres }: { genres: string[] }) {
  const e = genres.map((g) => GENRE_EMOJI[g]).find(Boolean) ?? "🔐";
  return <span className="thumb" aria-hidden>{e}</span>;
}

/** 찾기 화면의 목록 | 지도 전환 */
export function ViewToggle({ className = "" }: { className?: string }) {
  return (
    <div className={`view-toggle ${className}`}>
      <NavLink to="/themes"><Icon name="list" size={16} />목록</NavLink>
      <NavLink to="/map"><Icon name="map" size={16} />지도</NavLink>
    </div>
  );
}
