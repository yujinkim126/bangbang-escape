// 메뉴·버튼용 선 아이콘 (24px 기준, currentColor)
const PATHS = {
  map: <><path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4Z" /><path d="M9 4v14M15 6v14" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6" /><path d="m15 15 5 5" /></>,
  log: <><rect x="4.5" y="3.5" width="15" height="17" rx="2.5" /><path d="M8.5 8h7M8.5 12h7M8.5 16h4" /></>,
  badge: <><circle cx="12" cy="9" r="5.5" /><path d="m8.5 13.5-1.5 7 5-2.5 5 2.5-1.5-7" /></>,
  list: <><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="18" r="1" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  flag: <><path d="M6 21V4" /><path d="M6 4.5h11l-2.5 4 2.5 4H6" /></>,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  pin: <><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.3" /></>,
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
};

export type IconName = keyof typeof PATHS;

export default function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {PATHS[name]}
    </svg>
  );
}

/** 로고: 방방(트램펄린) 위에서 뛰는 자물쇠 캐릭터 (public/logo.webp). bounce면 계속 통통 튐 */
export function Logo({ size = 32, bounce = false }: { size?: number; bounce?: boolean }) {
  return <img className={`logo-mark ${bounce ? "bounce" : ""}`} src="/logo.webp" width={size} height={size} alt="" />;
}
