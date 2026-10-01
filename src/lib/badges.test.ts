import { describe, expect, it } from "vitest";
import { evaluateBadges, recommend, type Catalog } from "./badges";
import type { Badge, EscapeRecord, Store, Theme } from "./types";

const store = (id: string, brand: string | null, district = "마포구"): Store => ({
  id, kakao_id: id, name: `매장${id}`, address: `서울 ${district} 어딘가`, lat: 0, lng: 0,
  phone: null, kakao_url: null, status: "open", brand: brand ? { name: brand } : null,
});
const theme = (id: string, store_id: string, extra: Partial<Theme> = {}): Theme => ({
  id, store_id, name: `테마${id}`, genres: [], difficulty: 3, fear: null, activity: null,
  duration_min: 60, players_min: 2, players_max: 6, source_url: "x", status: "open", verified: false, ...extra,
});
let n = 0;
const rec = (theme_id: string, extra: Partial<EscapeRecord> = {}): EscapeRecord => ({
  id: `r${++n}`, user_id: "u", theme_id, played_at: `2026-09-${String(10 + n).padStart(2, "0")}T14:00:00+09:00`,
  success: true, remaining_sec: 300, hints_used: 2, rating: null, felt_difficulty: null, felt_fear: null,
  companions: [], memo: null, created_at: "", ...extra,
});

const stores = [store("s1", "A"), store("s2", "A"), store("s3", "B"), store("s4", null, "강남구")];
const themes = [
  theme("t1", "s1", { genres: ["공포"], fear: 3 }), theme("t2", "s1", { genres: ["추리"] }), theme("t3", "s2", { genres: ["공포"] }),
  theme("t4", "s3", { genres: ["감성"], difficulty: 4.5 }), theme("t5", "s3"), theme("t6", "s4", { genres: ["공포"] }),
  theme("t7", "s2", { status: "closed" }),
];
const cat: Catalog = { stores: new Map(stores.map((s) => [s.id, s])), themes: new Map(themes.map((t) => [t.id, t])) };
const B = (code: string, rule: Badge["rule"]): Badge => ({ code, name: code, description: "", emoji: "🏅", category: "collect", rule });

describe("evaluateBadges", () => {
  it("count with district/genre filters and records the badge-earning record", () => {
    const recs = [rec("t1"), rec("t3"), rec("t6"), rec("t2", { success: false })];
    const [all, horrorMapo] = evaluateBadges([
      B("all3", { type: "count", target: 3 }),
      B("h", { type: "count", target: 2, filter: { district: "마포구", genre: "공포", success: true } }),
    ], recs, cat);
    expect(all).toMatchObject({ earned: true, progress: 3 });
    expect(all.earnedBy?.theme_id).toBe("t6");
    expect(horrorMapo).toMatchObject({ earned: true, progress: 2 });
  });

  it("distinct_stores counts each store once and suggests only unvisited stores", () => {
    const [s] = evaluateBadges([B("s", { type: "distinct_stores", target: 3 })], [rec("t1"), rec("t2"), rec("t3")], cat);
    expect(s).toMatchObject({ earned: false, progress: 2 });
    expect(s.candidates.map((t) => t.store_id).sort()).toEqual(["s3", "s3", "s4"]);
  });

  it("single: record-level filters (no hint, remaining time, late night)", () => {
    const recs = [rec("t1", { hints_used: 0, remaining_sec: 30, played_at: "2026-09-01T23:10:00" })];
    const out = evaluateBadges([
      B("nohint", { type: "single", filter: { success: true, hints_used: 0 } }),
      B("close", { type: "single", filter: { success: true, remaining_lte: 60 } }),
      B("fast", { type: "single", filter: { success: true, remaining_gte: 1200 } }),
      B("owl", { type: "single", filter: { hour_gte: 22 } }),
    ], recs, cat);
    expect(out.map((s) => s.earned)).toEqual([true, true, false, true]);
    expect(out[0].candidates).toEqual([]); // 기록 조건만 있는 뱃지는 테마 추천 없음
  });

  it("single with theme-level filter suggests matching unsucceeded themes", () => {
    const [hard] = evaluateBadges([B("hard", { type: "single", filter: { success: true, difficulty_gte: 4.5 } })], [], cat);
    expect(hard.candidates.map((t) => t.id)).toEqual(["t4"]);
  });

  it("brand_complete ignores closed themes and brands below min size", () => {
    // 브랜드 A: 운영 중 t1,t2,t3 (t7은 종료) / B: t4,t5 (2개라 min 3 미만)
    const s1 = evaluateBadges([B("b", { type: "brand_complete", min_themes: 3 })], [rec("t1"), rec("t2")], cat)[0];
    expect(s1).toMatchObject({ earned: false, progress: 2, target: 3, detail: "A 2/3" });
    expect(s1.candidates.map((t) => t.id)).toEqual(["t3"]);
    const s2 = evaluateBadges([B("b", { type: "brand_complete", min_themes: 3 })], [rec("t1"), rec("t2"), rec("t3")], cat)[0];
    expect(s2.earned).toBe(true);
    const failed = evaluateBadges([B("b", { type: "brand_complete", min_themes: 3 })], [rec("t1"), rec("t2"), rec("t3", { success: false })], cat)[0];
    expect(failed.earned).toBe(false);
  });

  it("companion counts the most frequent partner", () => {
    const recs = [rec("t1", { companions: ["민지", "준호"] }), rec("t2", { companions: ["민지"] }), rec("t3", { companions: ["준호"] }), rec("t4", { companions: ["민지"] })];
    const [c] = evaluateBadges([B("duo", { type: "companion", target: 3 })], recs, cat);
    expect(c).toMatchObject({ earned: true, progress: 3, detail: "민지님과 3번" });
  });
});

describe("recommend", () => {
  it("puts started badges closest to completion first and skips earned ones", () => {
    const badges = [
      B("far", { type: "count", target: 10 }),
      B("near", { type: "count", target: 2, filter: { genre: "공포" } }),
      B("done", { type: "count", target: 1 }),
    ];
    const recs = [rec("t1")];
    const out = recommend(evaluateBadges(badges, recs, cat), recs, cat);
    expect(out.map((r) => r.state.badge.code)).toEqual(["near", "far"]);
    expect(out[0].themes.every((t) => t.genres.includes("공포") && t.id !== "t1")).toBe(true);
  });
});
