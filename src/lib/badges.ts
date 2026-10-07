import type { Badge, BadgeFilter, EscapeRecord, Store, Theme } from "./types";
import { districtOf } from "./format";
import { cityOf } from "./theme-search";

export interface Catalog {
  stores: Map<string, Store>;
  themes: Map<string, Theme>;
}

interface Enriched {
  r: EscapeRecord;
  theme: Theme;
  store: Store;
  district: string;
}

export interface BadgeState {
  badge: Badge;
  earned: boolean;
  progress: number;
  target: number;
  /** 이 뱃지 진행에 도움이 되는, 아직 안 해본 테마 */
  candidates: Theme[];
  /** brand_complete 처럼 대상이 정해지는 뱃지의 설명 (예: "비트포비아 5/12") */
  detail?: string;
  /** 달성한 경우, 달성하게 만든 기록 */
  earnedBy?: EscapeRecord;
}

const THEME_KEYS: (keyof BadgeFilter)[] = ["district", "genre", "fear_gte", "difficulty_gte", "duration_gte"];

function enrich(records: EscapeRecord[], cat: Catalog): Enriched[] {
  const out: Enriched[] = [];
  for (const r of records) {
    const theme = cat.themes.get(r.theme_id);
    const store = theme && cat.stores.get(theme.store_id);
    if (theme && store) out.push({ r, theme, store, district: districtOf(store.address) });
  }
  return out.sort((a, b) => a.r.played_at.localeCompare(b.r.played_at));
}

function themeMatches(theme: Theme, store: Store, f: BadgeFilter = {}): boolean {
  if (f.district && districtOf(store.address) !== f.district) return false;
  if (f.genre && !theme.genres.includes(f.genre)) return false;
  if (f.fear_gte != null && (theme.fear ?? -1) < f.fear_gte) return false;
  if (f.difficulty_gte != null && (theme.difficulty ?? 0) < f.difficulty_gte) return false;
  if (f.duration_gte != null && (theme.duration_min ?? 0) < f.duration_gte) return false;
  return true;
}

export function recordMatches(e: Enriched, f: BadgeFilter = {}): boolean {
  if (!themeMatches(e.theme, e.store, f)) return false;
  const r = e.r;
  if (f.success != null && r.success !== f.success) return false;
  if (f.hints_used != null && r.hints_used !== f.hints_used) return false;
  if (f.remaining_gte != null && (r.remaining_sec ?? -1) < f.remaining_gte) return false;
  if (f.remaining_lte != null && (r.remaining_sec == null || r.remaining_sec > f.remaining_lte)) return false;
  if (f.hour_gte != null && new Date(r.played_at).getHours() < f.hour_gte) return false;
  if (f.hour_lte != null && new Date(r.played_at).getHours() > f.hour_lte) return false;
  if (f.companions_gte != null && r.companions.length < f.companions_gte) return false;
  if (f.companions_lte != null && r.companions.length > f.companions_lte) return false;
  return true;
}

function hasThemeLevelFilter(f: BadgeFilter = {}) {
  return THEME_KEYS.some((k) => f[k] != null);
}

export function evaluateBadges(badges: Badge[], records: EscapeRecord[], cat: Catalog): BadgeState[] {
  const list = enrich(records, cat);
  const played = new Set(records.map((r) => r.theme_id));
  const succeeded = new Set(records.filter((r) => r.success).map((r) => r.theme_id));
  const openThemes = [...cat.themes.values()].filter((t) => t.status === "open");
  const storeOf = (t: Theme) => cat.stores.get(t.store_id)!;

  return badges.map((badge): BadgeState => {
    const rule = badge.rule;
    switch (rule.type) {
      case "count": {
        const hits = list.filter((e) => recordMatches(e, rule.filter));
        const earned = hits.length >= rule.target;
        return {
          badge, earned, target: rule.target, progress: Math.min(hits.length, rule.target),
          earnedBy: earned ? hits[rule.target - 1].r : undefined,
          candidates: openThemes.filter((t) => !played.has(t.id) && themeMatches(t, storeOf(t), rule.filter)),
        };
      }
      case "distinct_stores": {
        const visited: string[] = [];
        let earnedBy: EscapeRecord | undefined;
        for (const e of list) {
          if (!recordMatches(e, rule.filter) || visited.includes(e.store.id)) continue;
          visited.push(e.store.id);
          if (visited.length === rule.target) earnedBy = e.r;
        }
        return {
          badge, earned: visited.length >= rule.target, target: rule.target,
          progress: Math.min(visited.length, rule.target), earnedBy,
          candidates: openThemes.filter((t) => !visited.includes(t.store_id) && themeMatches(t, storeOf(t), rule.filter)),
        };
      }
      case "distinct_cities":
      case "distinct_genres": {
        // 서로 다른 지역(서울·부산·경기…) 또는 장르 수. 어느 지역이든 같은 조건이라 특정 동네를 밀지 않는다
        const keysOf = (t: Theme) => (rule.type === "distinct_cities" ? [cityOf(storeOf(t))] : t.genres).filter((k) => k !== "지역 미확인");
        const seen = new Set<string>();
        let earnedBy: EscapeRecord | undefined;
        for (const e of list) {
          if (!recordMatches(e, rule.filter)) continue;
          for (const k of keysOf(e.theme)) seen.add(k);
          if (!earnedBy && seen.size >= rule.target) earnedBy = e.r;
        }
        return {
          badge, earned: seen.size >= rule.target, target: rule.target, progress: Math.min(seen.size, rule.target), earnedBy,
          candidates: openThemes.filter((t) => !played.has(t.id) && keysOf(t).some((k) => !seen.has(k)) && themeMatches(t, storeOf(t), rule.filter)),
        };
      }
      case "single": {
        const hit = list.find((e) => recordMatches(e, rule.filter));
        return {
          badge, earned: Boolean(hit), target: 1, progress: hit ? 1 : 0, earnedBy: hit?.r,
          candidates: hasThemeLevelFilter(rule.filter)
            ? openThemes.filter((t) => !succeeded.has(t.id) && themeMatches(t, storeOf(t), rule.filter))
            : [],
        };
      }
      case "brand_complete": {
        const byBrand = new Map<string, Theme[]>();
        for (const t of openThemes) {
          const b = storeOf(t).brand?.name;
          if (b) byBrand.set(b, [...(byBrand.get(b) ?? []), t]);
        }
        let best: { brand: string; done: number; total: number; left: Theme[] } | null = null;
        for (const [brand, ts] of byBrand) {
          if (ts.length < rule.min_themes) continue;
          const done = ts.filter((t) => succeeded.has(t.id)).length;
          const cand = { brand, done, total: ts.length, left: ts.filter((t) => !succeeded.has(t.id)) };
          const ratio = (x: typeof cand) => x.done / x.total;
          if (!best || ratio(cand) > ratio(best) || (ratio(cand) === ratio(best) && cand.total < best.total)) best = cand;
        }
        if (!best) return { badge, earned: false, target: rule.min_themes, progress: 0, candidates: [] };
        const earned = best.done === best.total;
        return {
          badge, earned, target: best.total, progress: best.done,
          detail: best.done > 0 ? `${best.brand} ${best.done}/${best.total}` : undefined,
          candidates: best.done > 0 ? best.left : [],
        };
      }
      case "companion": {
        const counts = new Map<string, number>();
        let top = 0, name = "";
        let earnedBy: EscapeRecord | undefined;
        for (const e of list) {
          for (const c of e.r.companions) {
            const n = (counts.get(c) ?? 0) + 1;
            counts.set(c, n);
            if (n > top) { top = n; name = c; }
            if (n === rule.target && !earnedBy) earnedBy = e.r;
          }
        }
        return {
          badge, earned: top >= rule.target, target: rule.target, progress: Math.min(top, rule.target),
          detail: top > 0 ? `${name}님과 ${top}번` : undefined, earnedBy, candidates: [],
        };
      }
    }
  });
}

/** 기록 기반 취향 점수: 좋게 평가한 테마들의 장르와 느낀 난이도에 가까울수록 높음 */
export function tasteScorer(records: EscapeRecord[], cat: Catalog) {
  const genreWeight = new Map<string, number>();
  const diffs: number[] = [];
  for (const r of records) {
    const t = cat.themes.get(r.theme_id);
    if (!t) continue;
    const w = r.rating != null ? r.rating - 2.5 : r.success ? 0.5 : 0;
    for (const g of t.genres) genreWeight.set(g, (genreWeight.get(g) ?? 0) + w);
    const d = r.felt_difficulty ?? t.difficulty;
    if (d != null && (r.rating ?? 3) >= 3) diffs.push(d);
  }
  const avgDiff = diffs.length ? diffs.reduce((a, b) => a + b, 0) / diffs.length : 3;
  return (t: Theme) => {
    const g = t.genres.reduce((s, x) => s + (genreWeight.get(x) ?? 0), 0);
    const d = t.difficulty == null ? -1.5 : -Math.abs(t.difficulty - avgDiff); // 정보 없는 테마는 뒤로
    return g + d;
  };
}

export interface Recommendation {
  state: BadgeState;
  themes: Theme[];
}

/** "이 뱃지까지 N개 남았어요" 추천: 달성에 가까운 뱃지 순으로, 취향에 맞는 테마를 붙여줌 */
export function recommend(states: BadgeState[], records: EscapeRecord[], cat: Catalog, limit = 3): Recommendation[] {
  const score = tasteScorer(records, cat);
  const shown = new Set<string>();
  const out: Recommendation[] = [];
  const sorted = states
    .filter((s) => !s.earned && s.candidates.length > 0)
    .sort((a, b) => {
      const left = (s: BadgeState) => s.target - s.progress;
      const started = (s: BadgeState) => (s.progress > 0 ? 0 : 1);
      return started(a) - started(b) || left(a) - left(b);
    });
  for (const state of sorted) {
    if (out.length >= limit) break;
    // 앞에서 이미 추천한 테마는 빼고, 새로 보여줄 게 없으면 그 뱃지는 건너뜀 (같은 묶음 반복 방지)
    const themes = [...state.candidates].filter((t) => !shown.has(t.id)).sort((a, b) => score(b) - score(a)).slice(0, 3);
    if (!themes.length) continue;
    themes.forEach((t) => shown.add(t.id));
    out.push({ state, themes });
  }
  return out;
}
