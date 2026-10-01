-- 방탈출 정복 지도 DB 구조 (PostgreSQL / Supabase 기준)

-- ── 매장·테마 (미리 채워두는 데이터) ─────────────────────────────

-- 체인 브랜드 (한 사이트에 여러 지점이 있는 경우가 많아서 따로 둠)
create table brands (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  homepage_url  text
);

create table stores (
  id              uuid primary key default gen_random_uuid(),
  kakao_id        text unique,                 -- 카카오 로컬 API의 장소 id
  brand_id        uuid references brands(id),
  name            text not null,               -- 예: "OO방탈출 강남점"
  address         text not null,
  lat             double precision not null,
  lng             double precision not null,
  phone           text,
  homepage_url    text,                        -- 공식 사이트
  booking_url     text,                        -- 예약 페이지 (테마 정보 출처인 경우가 많음)
  kakao_url       text,
  status          text not null default 'open' check (status in ('open', 'closed', 'unknown')),
  last_checked_at timestamptz
);

create table themes (
  id              uuid primary key default gen_random_uuid(),
  store_id        uuid not null references stores(id),
  name            text not null,
  genres          text[] not null default '{}',   -- 정해진 목록 중에서: 공포, 스릴러, 추리, 감성, 코믹, 판타지, SF, 모험, 잠입, 드라마
  -- 매장마다 표기가 달라서 원문과 정규화 값을 같이 저장
  difficulty_raw  text,                           -- 원문 그대로: "★★★☆☆", "7/10", "상"
  difficulty      numeric(2,1) check (difficulty between 1 and 5),  -- 1~5로 환산
  fear_raw        text,
  fear            smallint check (fear between 0 and 3),            -- 0 없음 ~ 3 강함
  activity_raw    text,
  activity        smallint check (activity between 0 and 3),        -- 0 거의 없음 ~ 3 많음
  duration_min    smallint,
  players_min     smallint,
  players_max     smallint,
  price_text      text,                           -- 원문: "2인 44,000원 / 3인 60,000원"
  price_per_person integer,                       -- 2인 기준 1인 가격 (비교·필터용)
  source_url      text not null,                  -- 정보를 가져온 공식 페이지
  status          text not null default 'open' check (status in ('open', 'closed', 'unknown')),
  verified        boolean not null default false, -- 사람이 검수했는지
  first_seen_at   timestamptz not null default now(),
  last_seen_at    timestamptz not null default now(),  -- 갱신 때 안 보이면 closed 후보
  unique (store_id, name)
);
-- 테마 소개글·포스터는 저장하지 않음 (저작물) → source_url로 연결

-- ── 사용자 기록 ──────────────────────────────────────────────────

create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nickname   text not null,
  created_at timestamptz not null default now()
);

create table records (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id),
  theme_id       uuid not null references themes(id),
  played_at      timestamptz not null,
  success        boolean not null,
  remaining_sec  integer,               -- 성공 시 남은 시간 (실패면 null)
  hints_used     smallint,
  rating         numeric(2,1) check (rating between 0.5 and 5),
  felt_difficulty smallint check (felt_difficulty between 1 and 5),  -- 내가 느낀 난이도 (추천용)
  felt_fear      smallint check (felt_fear between 0 and 3),
  companions     text[] not null default '{}',   -- 같이 간 사람 이름 (관계 뱃지용)
  memo           text,                            -- 스포 없이!
  created_at     timestamptz not null default now()
);
create index on records (user_id, played_at desc);

-- ── 뱃지 ────────────────────────────────────────────────────────

create table badges (
  code        text primary key,          -- 예: 'region_gangnam_10'
  name        text not null,             -- 예: "강남 10테마"
  description text not null,
  emoji       text,
  category    text not null check (category in ('collect', 'style', 'relation')),
  -- 조건을 데이터로 저장해서 뱃지 추가할 때 코드 수정이 필요 없게
  -- 예: {"type":"count","filter":{"district":"강남구"},"target":10}
  --     {"type":"count","filter":{"genre":"공포","success":true},"target":10}
  --     {"type":"brand_complete","brand":"OO방탈출"}
  --     {"type":"single","filter":{"hints_used":0,"success":true}}
  rule        jsonb not null
);

create table user_badges (
  user_id   uuid not null references profiles(id),
  badge_code text not null references badges(code),
  earned_at timestamptz not null default now(),
  record_id uuid references records(id),   -- 어떤 기록으로 땄는지 (결산 카드용)
  primary key (user_id, badge_code)
);
-- 진행률("공포 마스터 8/10")은 저장하지 않고 records에서 계산
-- → 이 진행률이 곧 "이 뱃지까지 남은 테마" 추천의 근거


-- ── Supabase: 권한과 보안 규칙(RLS) ──────────────────────────────
-- 매장·테마·뱃지: 누구나 읽기만 가능 (쓰기는 대시보드/관리자만)
-- 기록·프로필·획득 뱃지: 로그인한 본인 것만 읽고 쓸 수 있음

alter table brands      enable row level security;
alter table stores      enable row level security;
alter table themes      enable row level security;
alter table badges      enable row level security;
alter table profiles    enable row level security;
alter table records     enable row level security;
alter table user_badges enable row level security;

grant usage on schema public to anon, authenticated;
grant select on brands, stores, themes, badges to anon, authenticated;
grant select, insert, update on profiles to authenticated;
grant select, insert, update, delete on records to authenticated;
grant select, insert on user_badges to authenticated;

create policy "public read" on brands for select using (true);
create policy "public read" on stores for select using (true);
create policy "public read" on themes for select using (true);
create policy "public read" on badges for select using (true);

create policy "own profile read"   on profiles for select to authenticated using ((select auth.uid()) = id);
create policy "own profile insert" on profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "own profile update" on profiles for update to authenticated using ((select auth.uid()) = id);

create policy "own records read"   on records for select to authenticated using ((select auth.uid()) = user_id);
create policy "own records insert" on records for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own records update" on records for update to authenticated using ((select auth.uid()) = user_id);
create policy "own records delete" on records for delete to authenticated using ((select auth.uid()) = user_id);

create policy "own badges read"   on user_badges for select to authenticated using ((select auth.uid()) = user_id);
create policy "own badges insert" on user_badges for insert to authenticated with check ((select auth.uid()) = user_id);

-- 가입하면 프로필 자동 생성 (닉네임 기본값: 이메일 앞부분)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1), '방탈러'));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
