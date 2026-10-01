// 체험 모드: .env 가 없을 때 홍대 시드 데이터(sql/2, sql/3과 같은 내용)로 화면을 띄움.
// 개인 기록은 local-records.ts를 통해 브라우저에 저장.
import type { Session } from "@supabase/supabase-js";
import catalog from "./demo-catalog.json";
import type { Badge, Store, Theme } from "./types";

export const demoStores = catalog.stores as Store[];
export const demoThemes = catalog.themes as Theme[];
export const demoBadges = catalog.badges as Badge[];

export const demoSession = { user: { id: "local" } } as unknown as Session;

