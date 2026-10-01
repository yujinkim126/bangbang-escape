import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Supabase 로그인 링크의 기본 주소가 http://localhost:3000 이라 개발 서버도 3000번으로 맞춤
export default defineConfig({
  plugins: [react()],
  server: { port: 3000 },
});
