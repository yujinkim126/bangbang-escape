export type Status = "open" | "closed" | "unknown";

export interface Store {
  id: string;
  kakao_id: string | null;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  kakao_url: string | null;
  status: Status;
  brand: { name: string } | null;
}

export interface Theme {
  poster_url?: string | null;
  id: string;
  store_id: string;
  name: string;
  genres: string[];
  difficulty: number | null;
  fear: number | null;
  activity: number | null;
  duration_min: number | null;
  players_min: number | null;
  players_max: number | null;
  source_url: string;
  status: Status;
  verified: boolean;
}

export interface EscapeRecord {
  id: string;
  user_id: string;
  theme_id: string;
  played_at: string;
  success: boolean;
  remaining_sec: number | null;
  hints_used: number | null;
  rating: number | null;
  felt_difficulty: number | null;
  felt_fear: number | null;
  felt_activity?: number | null;
  companions: string[];
  memo: string | null;
  created_at: string;
}

export type BadgeFilter = {
  district?: string;
  genre?: string;
  success?: boolean;
  hints_used?: number;
  remaining_gte?: number;
  remaining_lte?: number;
  hour_gte?: number;
  hour_lte?: number;
  fear_gte?: number;
  difficulty_gte?: number;
  duration_gte?: number;
  companions_gte?: number;
  companions_lte?: number;
};

export type BadgeRule =
  | { type: "count"; target: number; filter?: BadgeFilter }
  | { type: "distinct_stores"; target: number; filter?: BadgeFilter }
  | { type: "distinct_cities"; target: number; filter?: BadgeFilter }
  | { type: "distinct_genres"; target: number; filter?: BadgeFilter }
  | { type: "single"; filter: BadgeFilter }
  | { type: "brand_complete"; min_themes: number }
  | { type: "companion"; target: number };

export interface Badge {
  code: string;
  name: string;
  description: string;
  emoji: string | null;
  category: "collect" | "style" | "relation";
  rule: BadgeRule;
}
