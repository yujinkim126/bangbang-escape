# 방방 (escape-log) — Claude Code용 프로젝트 메모

방탈출 기록 앱. 핵심은 **테마 기록 / 테마 찾기(목록·지도) / 뱃지** 세 가지.
기록하면 뱃지가 쌓이고, "이 뱃지까지 N개 남았어요" 식으로 다음 테마를 추천한다. 나중에 인스타 공유(결산 카드)로 퍼지는 구조가 목표.
"정복"·"도장" 같은 게임식 표현은 쓰지 않기로 함 (사용자 피드백). 앱 이름은 **방방**(트램펄린). 로고는 방방 위에서 뛰는 노란 자물쇠 캐릭터 이미지 (`public/logo.webp`, 사용자가 준 그림. `components/Icon.tsx`의 `Logo`가 씀. 파비콘도 같은 파일).

## 스택
- React 18 + Vite 5 + TypeScript, react-router-dom 6
- Supabase (프로젝트 `escape-log`, ref `akgjspijniaudapdcjda`, 리전 서울) — DB·로그인(이메일 매직링크)
- 지도: react-leaflet + OpenStreetMap 타일 (키 불필요, 원본 컬러 그대로). 카카오맵 교체 예정
  (CARTO 타일은 이제 API 키가 필요해서 안 씀)
- 테스트: vitest (`src/lib/badges.test.ts`)

## 명령
- `npm run dev` → http://localhost:3000 (Supabase 기본 Site URL이 localhost:3000이라 포트 고정)
- `npm test`, `npm run build` (tsc 타입체크 포함)
- `.env`에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 필요 (`.env.example` 참고).
  **`.env`가 없으면 체험 모드**: `src/lib/demo.ts` + `demo-catalog.json`(sql/2, sql/3에서 뽑은 홍대 데이터)으로 뜨고, 기록은 메모리에만 저장.
  시드 SQL을 바꾸면 demo-catalog.json도 다시 뽑을 것
  **service_role(secret) 키는 절대 코드·.env·커밋에 넣지 않는다.**

## DB (sql/ 폴더에 실제로 실행한 SQL 순서대로 있음)
- `brands`, `stores`(카카오 로컬 API로 수집한 매장, kakao_id), `themes`, `badges`
  → 누구나 읽기만 (RLS)
- `profiles`(가입 시 트리거로 자동 생성), `records`, `user_badges` → 본인 것만 읽기/쓰기 (RLS)
- 현재 데이터: 홍대(마포구) 매장 56곳, 테마 118개(전부 `verified=false`), 뱃지 18종
- 난이도: `difficulty_raw`는 매장 원문(EASY/중상/★★★☆☆ 등), `difficulty`는 1~5 환산값.
  **앱은 항상 `difficulty`만 쓰고** 표기는 `src/lib/format.ts`의 `difficultyText()`로 통일
  ("쉬움/조금 쉬움/보통/어려움/매우 어려움 + 숫자")
- 공포도 `fear` 0~3, 활동성 `activity` 0~3
- 스키마 변경은 Supabase 대시보드 SQL Editor에서 실행하고, 같은 SQL을 `sql/`에 번호 붙여 저장

## 뱃지
- 정의는 DB `badges.rule`(JSON). 해석은 `src/lib/badges.ts`의 `evaluateBadges()`
- rule 타입: `count`, `distinct_stores`, `single`, `brand_complete`, `companion`
- filter 키: district, genre, success, hints_used, remaining_gte, remaining_lte, hour_gte, fear_gte, difficulty_gte, companions_gte
- 새 rule 타입을 추가하면 `types.ts`의 `BadgeRule`과 테스트도 같이 추가
- 진행률은 저장하지 않고 records에서 매번 계산. 새로 딴 뱃지만 `user_badges`에 기록

## 테마 데이터 수집 원칙 (중요)
- 매장 **공식 사이트의 사실 정보만** (이름, 시간, 인원, 난이도, 장르). 시놉시스·포스터는 저작물이라 저장 안 함 → `source_url`로 링크
- 빠방·전국방탈출·잼핏 같은 **다른 방탈출 서비스 데이터는 긁지 않는다**
- 네이버 예약 페이지, 카카오맵 장소 상세 페이지도 긁지 않는다 (약관)
- 사이트에 크롤링 금지 문구가 있으면 수집 안 함 (예: 도어이스케이프)
- 크라임씬·마피아 게임 카페는 방탈출이 아니라서 제외 (예: 퍼즐팩토리)
- 못 채운 홍대 매장 22곳은 수동 입력/매장 등록 대상

## 디자인
- 방향: 토스처럼 깔끔하게. 연회색 바탕(#f2f4f6) + 테두리 없는 흰 카드(radius 20) + 파랑 포인트(#3182f6)
  (굵은 테두리·딱딱한 그림자·노랑 "스티커" 스타일은 사용자가 싫어해서 버림)
- 색은 `src/styles.css`의 CSS 변수(:root)로만 관리. 다크모드는 prefers-color-scheme로 같은 변수만 바꿈
- 성공=초록 "탈출", 실패=빨강 "실패"
- 폰트: Pretendard 하나만
- 메뉴(3탭): 기록(/) · 찾기(/themes 목록, /map 지도 — 상단 목록|지도 전환) · 뱃지(/badges). 아이콘은 `components/Icon.tsx`
- 모바일에선 하단 탭바. 폭 375~390px에서 확인할 것
- 헤더에 backdrop-filter 쓰지 말 것: 안에 있는 하단 탭바(position: fixed)가 헤더 기준으로 붙어버림

## 다음 할 일 (우선순위 순)
1. 지도를 카카오맵으로 교체 (카카오 앱 "bang!"에 JavaScript 키 + 사이트 도메인 등록 필요)
2. 관리자용 테마 입력 화면 (미수집 22곳)
3. 연말 결산 카드 (인스타 스토리 비율 이미지)
