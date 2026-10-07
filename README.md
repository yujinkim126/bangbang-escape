# 방방 — 방탈출 기록

방탈출 테마 기록 → 테마 찾기(목록·지도) → 뱃지 모으기, 그리고 "이 뱃지까지 N개 남았어요" 추천까지 도는 웹앱이에요.
React + Vite + TypeScript, 데이터는 Supabase(`escape-log` 프로젝트)를 씁니다.

## 처음 실행하기

```bash
npm install
cp .env.example .env      # 윈도우: copy .env.example .env
```

> `.env` 없이 `npm run dev`만 해도 **기기 저장 모드**(서울 테마 목록, 직접 입력한 기록은 브라우저에 저장)로 화면을 볼 수 있어요.

`.env`에 Supabase 값을 넣어요. 대시보드 상단 **Connect** 버튼(또는 Project Settings → API)에 있어요.

```
VITE_SUPABASE_URL=https://akgjspijniaudapdcjda.supabase.co
VITE_SUPABASE_ANON_KEY=여기에 anon(publishable) 키
```

> service_role(secret) 키는 절대 넣지 마세요. 브라우저 코드에 들어가면 누구나 DB를 마음대로 쓸 수 있어요.

```bash
npm run dev    # http://localhost:3000
```

로그인은 이메일로 받은 링크를 누르는 방식이에요. 개발 서버를 3000번 포트로 둔 이유는 Supabase의 기본 Site URL이 `http://localhost:3000`이라서예요.
나중에 배포하면 Supabase → Authentication → URL Configuration에서 Site URL을 배포 주소로 바꿔주세요.
(무료 플랜의 기본 메일 발송은 시간당 몇 통으로 제한돼 있어요. 테스트할 때 로그인 메일을 여러 번 보내면 잠깐 막힐 수 있어요.)

## 화면

| 경로 | 내용 |
| --- | --- |
| `/` | **기록** — 이번 달 기록 수, 통계, 다음에 해볼 테마, 월별 기록 목록 |
| `/records/new` | **기록하기** — 테마 선택, 탈출 결과, 평점, 난이도·공포도·활동성, 후기 입력 |
| `/themes` | **찾기(목록)** — 테마 검색·필터(장르, 난이도, 공포 빼고, 안 해본 것) → 상세 → 기록하기 |
| `/map` | **찾기(지도)** — 매장 핀, 내가 한 곳은 깃발(초록=탈출, 빨강=실패) |
| `/badges` | **뱃지** — 뱃지 18종 진행률 |

## 구조

```
src/
  lib/
    supabase.ts   Supabase 클라이언트
    data.tsx      앱 전체 데이터(매장·테마·뱃지·내 기록) + 기록 추가/삭제
    badges.ts     뱃지 판정·진행률·추천 로직 (DB의 badges.rule JSON을 해석)
    badges.test.ts
    format.ts     난이도/공포도 표기 통일 ("보통 3.0")
  pages/          지도, 테마, 내 일지, 뱃지, 로그인
  components/     테마 상세 시트, 기록 폼, 추천, 토스트
```

- **난이도 표기**: DB에는 매장 원문(`difficulty_raw`: EASY, 중상, ★★★☆☆…)과 1~5 환산값(`difficulty`)이 같이 있어요. 앱은 환산값만 써서 "쉬움 / 조금 쉬움 / 보통 / 어려움 / 매우 어려움 + 숫자"로 통일해 보여줘요.
- **뱃지 추가**: `badges` 테이블에 행만 추가하면 돼요. `rule` 형식은 `badges.ts` 상단 타입과 `supabase-badges.sql` 주석 참고. 코드 수정 없이 바로 반영돼요.
- **보안**: 매장·테마·뱃지는 누구나 읽기만, 기록·프로필·획득 뱃지는 본인 것만 읽고 쓸 수 있게 RLS가 걸려 있어요.

## 테스트

```bash
npm test        # 뱃지 판정·추천 로직
npm run build   # 타입체크 + 빌드
```

## 다음에 할 것

- 지도를 카카오맵으로 교체 (지금은 키 없이 뜨는 OpenStreetMap)
- 미수집 매장 22곳 테마 입력용 관리자 화면
- 연말 결산 카드 (인스타 공유용 이미지)

## CI/CD

- GitHub Actions: main 푸시와 PR마다 `npm ci` → `npm test` → `npm run build`. 성공한 빌드를 7일간 보관합니다.
- Vercel Git 연동: 브랜치·PR 변경은 미리보기, main 변경은 운영 배포입니다. `vercel.json`의 빌드 명령도 테스트를 먼저 실행하므로 실패한 코드는 배포되지 않습니다.
- GitHub Actions와 Vercel 검사는 각각 실행됩니다. Vercel이 Actions 결과를 기다리는 구조는 아닙니다.
- 첫 연결: Vercel에서 이 GitHub 저장소를 Import하고 배포합니다. 초기 폰 테스트에는 환경변수가 필요 없습니다.

## 개인 기록 저장

기본값은 localStorage입니다. 샘플 개인 기록은 없으며, 뱃지 획득은 실제 기록에서 계산합니다. 기록의 추가·삭제를 저장한 뒤 화면을 갱신하고, 저장 실패를 사용자에게 표시합니다. 같은 주소의 탭들은 저장 변경을 반영합니다. 브라우저 데이터 삭제 시 기록도 삭제됩니다. localhost, 배포 주소, 다른 기기의 기록은 각각 별개입니다.

계정 동기화를 켜려면 Supabase 환경변수와 SQL 1~10를 적용하고 로그인 리다이렉트 주소를 설정해야 합니다. 기존 로컬 기록을 계정으로 자동 이관하는 기능은 아직 없습니다. `felt_activity`는 0(거의 없음)~3(많음), 미입력은 null입니다.

## 테마와 포스터

현재 로컬 목록은 592개(검색 가능 591개), 매장 156곳입니다. 서울과 광역시 전체 수집 완료는 아닙니다. 부산·대구·대전·광주·인천과 일부 경기·경북·전북 지역을 추가했습니다. 도시/세부 지역 검색과 지도 지역 선택을 지원하며, 출처는 `data/metro-source-audit.json`, DB 반영은 `sql/10-metro-catalog.sql`을 참고하세요. 공식 사이트 사실 정보의 출처는 테마별 링크에 있습니다. 포스터는 매장 공식 사이트의 이미지 주소를 `poster_url`로 링크합니다(이미지 파일은 저장하지 않음). `data/find-posters.mjs`로 찾고 `data/apply-posters.mjs`로 `sql/11-theme-posters.sql`을 만듭니다. 매장 요청이 있으면 해당 포스터는 즉시 내립니다. 포스터가 없는 테마는 장르별 기본 표지가 표시됩니다.
