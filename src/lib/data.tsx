import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "./supabase";
import type { Badge, EscapeRecord, Store, Theme } from "./types";
import { evaluateBadges, type BadgeState, type Catalog } from "./badges";
import { demoBadges, demoSession, demoStores, demoThemes } from "./demo";

import { readRecords, saveRecords, RECORDS_KEY } from "./local-records";

/** 서버 미연결 시 브라우저에 개인 기록 저장 */
export const DEMO = !supabaseConfigured;

export type NewRecord = Omit<EscapeRecord, "id" | "user_id" | "created_at">;

interface AppData {
  ready: boolean;
  demo: boolean;
  error: string | null;
  session: Session | null;
  catalog: Catalog;
  stores: Store[];
  themes: Theme[];
  badges: Badge[];
  records: EscapeRecord[];
  badgeStates: BadgeState[];
  addRecord: (r: NewRecord) => Promise<{ newlyEarned: BadgeState[] }>;
  deleteRecord: (id: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AppData | null>(null);

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside <AppProvider>");
  return v;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [records, setRecords] = useState<EscapeRecord[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 로그인 상태
  useEffect(() => {
    if (DEMO) { setSession(demoSession); return; }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  // 매장·테마·뱃지 (누구나 읽기 가능)
  useEffect(() => {
    if (DEMO) {
      setStores(demoStores); setThemes(demoThemes); setBadges(demoBadges);
      setReady(true);
      return;
    }
    (async () => {
      const [s, t, b] = await Promise.all([
        supabase.from("stores").select("id,kakao_id,name,address,lat,lng,phone,kakao_url,status,brand:brands(name)"),
        supabase.from("themes").select("*"),
        supabase.from("badges").select("*"),
      ]);
      const err = s.error ?? t.error ?? b.error;
      if (err) setError(err.message);
      setStores((s.data ?? []) as unknown as Store[]);
      setThemes(((t.data ?? []) as Theme[]).map((x) => ({ ...x, difficulty: x.difficulty == null ? null : Number(x.difficulty) })));
      setBadges((b.data ?? []) as Badge[]);
      setReady(true);
    })();
  }, []);

  // 내 기록 (로그인했을 때만)
  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) { setRecords([]); return; }
    if (DEMO) {
      const load = () => { try { setRecords(readRecords(localStorage)); setError(null); } catch { setError('저장된 기록을 읽지 못했어요. 기존 데이터는 보존되어 있어요.'); } };
      load();
      const sync = (e: StorageEvent) => { if (e.key === RECORDS_KEY || e.key === null) load(); };
      window.addEventListener('storage', sync);
      return () => window.removeEventListener('storage', sync);
    }
    supabase.from("records").select("*").order("played_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setRecords(((data ?? []) as EscapeRecord[]).map((r) => ({ ...r, rating: r.rating == null ? null : Number(r.rating) })));
      });
  }, [userId]);

  const catalog = useMemo<Catalog>(() => ({
    stores: new Map(stores.map((s) => [s.id, s])),
    themes: new Map(themes.map((t) => [t.id, t])),
  }), [stores, themes]);

  const badgeStates = useMemo(() => evaluateBadges(badges, records, catalog), [badges, records, catalog]);

  const addRecord = useCallback(async (r: NewRecord) => {
    if (!userId) throw new Error("로그인이 필요해요");
    let saved: EscapeRecord;
    if (DEMO) {
      saved = { ...r, id: crypto.randomUUID(), user_id: userId, created_at: new Date().toISOString() };
    } else {
      const { data, error } = await supabase.from("records").insert({ ...r, user_id: userId }).select().single();
      if (error) throw new Error(error.message);
      saved = { ...(data as EscapeRecord), rating: data.rating == null ? null : Number(data.rating) };
    }
    const next = [saved, ...(DEMO ? readRecords(localStorage) : records)].sort((a,b) => Date.parse(b.played_at) - Date.parse(a.played_at));
    if (DEMO) saveRecords(localStorage, next);
    setRecords(next);
    const before = new Set(badgeStates.filter((s) => s.earned).map((s) => s.badge.code));
    const newlyEarned = evaluateBadges(badges, next, catalog).filter((s) => s.earned && !before.has(s.badge.code));
    if (newlyEarned.length && !DEMO) {
      await supabase.from("user_badges").upsert(
        newlyEarned.map((s) => ({ user_id: userId, badge_code: s.badge.code, record_id: s.earnedBy?.id ?? saved.id })),
        { onConflict: "user_id,badge_code", ignoreDuplicates: true },
      );
    }
    return { newlyEarned };
  }, [userId, records, badges, badgeStates, catalog]);

  const deleteRecord = useCallback(async (id: string) => {
    if (DEMO) { const next = readRecords(localStorage).filter(r => r.id !== id); saveRecords(localStorage, next); setRecords(next); return; }
    const { error } = await supabase.from("records").delete().eq("id", id);
    if (error) throw new Error(error.message);
    setRecords((rs) => rs.filter((r) => r.id !== id));
  }, []);

  const signOut = useCallback(async () => {
    if (DEMO) return;
    await supabase.auth.signOut();
  }, []);

  const value: AppData = {
    ready, demo: DEMO, error, session, catalog, stores, themes, badges, records, badgeStates,
    addRecord, deleteRecord, signOut,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
