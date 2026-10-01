import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && key);

// .env 가 비어 있어도 앱이 죽지 않도록 가짜 주소로 만들고, 화면에서 설정 안내를 띄움
export const supabase = createClient(url || "http://localhost", key || "missing-key");
