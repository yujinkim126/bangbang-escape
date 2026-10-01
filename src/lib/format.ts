// 화면에 보여줄 때 쓰는 통일된 표기. DB에는 원문(difficulty_raw)도 있지만 앱은 1~5 환산값만 씀.

export function difficultyLabel(d: number | null): string {
  if (d == null) return "난이도 미상";
  if (d < 2) return "쉬움";
  if (d < 3) return "조금 쉬움";
  if (d <= 3.5) return "보통";
  if (d < 4.5) return "어려움";
  return "매우 어려움";
}

export function difficultyText(d: number | null): string {
  return d == null ? "난이도 미상" : `${difficultyLabel(d)} ${d.toFixed(1)}`;
}

const FEAR = ["공포 없음", "공포 약함", "공포 보통", "공포 강함"];
export function fearText(f: number | null): string | null {
  return f == null ? null : FEAR[f];
}

export function playersText(min: number | null, max: number | null): string | null {
  if (min && max) return `${min}~${max}인`;
  if (max) return `최대 ${max}인`;
  if (min) return `${min}인 이상`;
  return null;
}

export function districtOf(address: string): string {
  return address.split(" ")[1] ?? "";
}

export const DISTRICT_NICK: Record<string, string> = { 마포구: "홍대" };
export const districtName = (d: string) => DISTRICT_NICK[d] ?? d;

export function formatRemaining(sec: number | null): string | null {
  if (sec == null) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}분 ${String(s).padStart(2, "0")}초 남김`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
