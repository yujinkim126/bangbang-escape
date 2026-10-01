-- escape-log 3: 뱃지 정의
-- rule 형식 (앱의 src/lib/badges.ts 가 해석)
--   count           : 조건에 맞는 기록 수가 target 이상
--   distinct_stores : 조건에 맞는 서로 다른 매장 수가 target 이상
--   single          : 조건에 맞는 기록이 하나라도 있으면
--   brand_complete  : 운영 중 테마가 min_themes 개 이상인 브랜드의 테마를 전부 성공
--   companion       : 같은 사람과 target 번 이상
-- filter 키: district, genre, success, hints_used, remaining_gte, remaining_lte,
--            hour_gte, fear_gte, difficulty_gte, companions_gte
insert into badges (code, name, description, emoji, category, rule) values
('first_flag',     '첫 깃발',       '첫 번째 탈출 기록을 남겼어요',              '🚩', 'collect', '{"type":"count","target":1}'),
('themes_10',      '열 개의 문',     '테마 10개 플레이',                          '🗝️', 'collect', '{"type":"count","target":10}'),
('themes_30',      '문지기',         '테마 30개 플레이',                          '🏰', 'collect', '{"type":"count","target":30}'),
('stores_5',       '길잡이',         '서로 다른 매장 5곳 방문',                   '🧭', 'collect', '{"type":"distinct_stores","target":5}'),
('mapo_10',        '홍대 10테마',    '홍대(마포구)에서 테마 10개 플레이',         '🎸', 'collect', '{"type":"count","filter":{"district":"마포구"},"target":10}'),
('mapo_stores_20', '홍대 정복자',    '홍대(마포구) 매장 20곳에 깃발 꽂기',        '🏳️', 'collect', '{"type":"distinct_stores","filter":{"district":"마포구"},"target":20}'),
('genre_horror',   '공포 마스터',    '공포 테마 5개 성공',                        '👻', 'collect', '{"type":"count","filter":{"genre":"공포","success":true},"target":5}'),
('genre_mystery',  '명탐정',         '추리 테마 5개 성공',                        '🔍', 'collect', '{"type":"count","filter":{"genre":"추리","success":true},"target":5}'),
('genre_emotion',  '눈물 한 방울',   '감성 테마 5개 성공',                        '💧', 'collect', '{"type":"count","filter":{"genre":"감성","success":true},"target":5}'),
('brand_complete', '도장깨기',       '한 브랜드의 테마(3개 이상)를 모두 성공',    '🏢', 'collect', '{"type":"brand_complete","min_themes":3}'),
('no_hint',        '노힌트',         '힌트 없이 탈출 성공',                       '🙈', 'style',   '{"type":"single","filter":{"success":true,"hints_used":0}}'),
('lightning',      '번개',           '20분 이상 남기고 탈출',                     '⚡', 'style',   '{"type":"single","filter":{"success":true,"remaining_gte":1200}}'),
('close_call',     '간발의 차',      '남은 시간 1분 이내로 탈출',                 '😮‍💨', 'style', '{"type":"single","filter":{"success":true,"remaining_lte":60}}'),
('night_owl',      '올빼미',         '밤 10시 이후에 플레이',                     '🌙', 'style',   '{"type":"single","filter":{"hour_gte":22}}'),
('brave',          '쫄보 탈출',      '공포도 높은 테마를 성공',                   '😱', 'style',   '{"type":"single","filter":{"success":true,"fear_gte":3}}'),
('hardcore',       '고수의 길',      '난이도 4.5 이상 테마 성공',                 '🔥', 'style',   '{"type":"single","filter":{"success":true,"difficulty_gte":4.5}}'),
('duo',            '단짝',           '같은 사람과 5번 함께 플레이',               '👯', 'relation','{"type":"companion","target":5}'),
('squad',          '대가족',         '4명 이상과 함께 플레이',                    '🎉', 'relation','{"type":"single","filter":{"companions_gte":4}}')
on conflict (code) do update set name = excluded.name, description = excluded.description,
  emoji = excluded.emoji, category = excluded.category, rule = excluded.rule;

select count(*) as badges from badges;
