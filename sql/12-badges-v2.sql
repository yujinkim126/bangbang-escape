-- escape-log 12: 뱃지 v2. data/badges-v2.mjs로 생성 (특정 동네 전용 뱃지 없음, 지역은 서로 다른 지역 수로만)
-- 새 rule 타입: distinct_cities, distinct_genres / 새 filter: hour_lte, companions_lte, duration_gte
begin;
delete from user_badges where badge_code in ('mapo_10', 'mapo_stores_20');
delete from badges where code in ('mapo_10', 'mapo_stores_20');
insert into badges (code, name, description, emoji, category, rule) values
('first_flag', '첫 깃발', '첫 번째 기록을 남겼어요', '🚩', 'collect', '{"type":"count","target":1}'),
('themes_5', '다섯 번째 문', '테마 5개 플레이', '🚪', 'collect', '{"type":"count","target":5}'),
('themes_10', '열 개의 문', '테마 10개 플레이', '🗝️', 'collect', '{"type":"count","target":10}'),
('themes_30', '문지기', '테마 30개 플레이', '🏰', 'collect', '{"type":"count","target":30}'),
('themes_50', '반백 개의 문', '테마 50개 플레이', '🎖️', 'collect', '{"type":"count","target":50}'),
('themes_100', '백 개의 문', '테마 100개 플레이', '👑', 'collect', '{"type":"count","target":100}'),
('escapes_10', '탈출 10회', '탈출 성공 10번', '🔓', 'collect', '{"type":"count","target":10,"filter":{"success":true}}'),
('escapes_50', '탈출 50회', '탈출 성공 50번', '🏆', 'collect', '{"type":"count","target":50,"filter":{"success":true}}'),
('stores_5', '길잡이', '서로 다른 매장 5곳 방문', '🧭', 'collect', '{"type":"distinct_stores","target":5}'),
('stores_15', '방탈출 산책', '서로 다른 매장 15곳 방문', '👟', 'collect', '{"type":"distinct_stores","target":15}'),
('stores_30', '방탈출 지도', '서로 다른 매장 30곳 방문', '🗺️', 'collect', '{"type":"distinct_stores","target":30}'),
('cities_2', '원정 탈출', '서로 다른 지역 2곳에서 플레이 (서울·부산·경기…)', '🚄', 'collect', '{"type":"distinct_cities","target":2}'),
('cities_4', '전국구', '서로 다른 지역 4곳에서 플레이', '🧳', 'collect', '{"type":"distinct_cities","target":4}'),
('cities_7', '팔도 유람', '서로 다른 지역 7곳에서 플레이', '✈️', 'collect', '{"type":"distinct_cities","target":7}'),
('genre_horror', '공포 마스터', '공포 테마 5개 탈출', '👻', 'collect', '{"type":"count","target":5,"filter":{"genre":"공포","success":true}}'),
('genre_mystery', '명탐정', '추리 테마 5개 탈출', '🔍', 'collect', '{"type":"count","target":5,"filter":{"genre":"추리","success":true}}'),
('genre_emotion', '눈물 한 방울', '감성 테마 5개 탈출', '💧', 'collect', '{"type":"count","target":5,"filter":{"genre":"감성","success":true}}'),
('genre_thriller', '심장이 쫄깃', '스릴러 테마 5개 탈출', '🕯️', 'collect', '{"type":"count","target":5,"filter":{"genre":"스릴러","success":true}}'),
('genre_fantasy', '이세계 여행자', '판타지 테마 5개 탈출', '🔮', 'collect', '{"type":"count","target":5,"filter":{"genre":"판타지","success":true}}'),
('genre_comic', '웃음 사냥꾼', '코믹 테마 5개 탈출', '🎈', 'collect', '{"type":"count","target":5,"filter":{"genre":"코믹","success":true}}'),
('genre_stealth', '그림자 요원', '잠입 테마 5개 탈출', '🕶️', 'collect', '{"type":"count","target":5,"filter":{"genre":"잠입","success":true}}'),
('genre_adventure', '모험가', '어드벤처 테마 3개 탈출', '🧗', 'collect', '{"type":"count","target":3,"filter":{"genre":"어드벤처","success":true}}'),
('genre_drama', '주인공', '드라마 테마 3개 탈출', '🎭', 'collect', '{"type":"count","target":3,"filter":{"genre":"드라마","success":true}}'),
('genre_mission', '미션 클리어', '미션 테마 3개 탈출', '🎯', 'collect', '{"type":"count","target":3,"filter":{"genre":"미션","success":true}}'),
('genre_romance', '설렘 주의', '로맨스 테마 3개 탈출', '💘', 'collect', '{"type":"count","target":3,"filter":{"genre":"로맨스","success":true}}'),
('genres_5', '잡식가', '서로 다른 장르 5가지 플레이', '🍱', 'collect', '{"type":"distinct_genres","target":5}'),
('genres_10', '장르 수집가', '서로 다른 장르 10가지 플레이', '📚', 'collect', '{"type":"distinct_genres","target":10}'),
('brand_complete', '브랜드 올클리어', '한 브랜드의 테마(3개 이상)를 모두 탈출', '🏢', 'collect', '{"type":"brand_complete","min_themes":3}'),
('no_hint', '노힌트', '힌트 없이 탈출 성공', '🙈', 'style', '{"type":"single","filter":{"success":true,"hints_used":0}}'),
('no_hint_5', '노힌트 장인', '힌트 없이 5번 탈출', '🧠', 'style', '{"type":"count","target":5,"filter":{"success":true,"hints_used":0}}'),
('lightning', '번개', '20분 이상 남기고 탈출', '⚡', 'style', '{"type":"single","filter":{"success":true,"remaining_gte":1200}}'),
('close_call', '간발의 차', '남은 시간 1분 이내로 탈출', '😮‍💨', 'style', '{"type":"single","filter":{"success":true,"remaining_lte":60}}'),
('night_owl', '올빼미', '밤 10시 이후에 플레이', '🌙', 'style', '{"type":"single","filter":{"hour_gte":22}}'),
('early_bird', '아침형 탈출러', '오전(12시 전)에 플레이', '🌅', 'style', '{"type":"single","filter":{"hour_lte":11}}'),
('brave', '쫄보 탈출', '공포도 높은 테마를 탈출', '😱', 'style', '{"type":"single","filter":{"success":true,"fear_gte":3}}'),
('brave_3', '강심장', '공포도 2 이상 테마 3개 탈출', '🫀', 'style', '{"type":"count","target":3,"filter":{"success":true,"fear_gte":2}}'),
('hardcore', '고수의 길', '난이도 4.5 이상 테마 탈출', '🔥', 'style', '{"type":"single","filter":{"success":true,"difficulty_gte":4.5}}'),
('hardcore_5', '고수', '난이도 4 이상 테마 5개 탈출', '🥋', 'style', '{"type":"count","target":5,"filter":{"success":true,"difficulty_gte":4}}'),
('marathon', '대장정', '90분 이상 테마 탈출', '⏳', 'style', '{"type":"single","filter":{"success":true,"duration_gte":90}}'),
('retry_3', '다음엔 꼭', '아쉽게 실패한 기록 3개', '🌱', 'style', '{"type":"count","target":3,"filter":{"success":false}}'),
('solo', '혼방 탈출', '혼자 플레이해서 탈출', '🦊', 'relation', '{"type":"single","filter":{"success":true,"companions_lte":0}}'),
('duo', '단짝', '같은 사람과 5번 함께 플레이', '👯', 'relation', '{"type":"companion","target":5}'),
('duo_10', '찐친', '같은 사람과 10번 함께 플레이', '🤝', 'relation', '{"type":"companion","target":10}'),
('squad', '대가족', '4명 이상과 함께 플레이', '🎉', 'relation', '{"type":"single","filter":{"companions_gte":4}}')
on conflict (code) do update set name = excluded.name, description = excluded.description,
  emoji = excluded.emoji, category = excluded.category, rule = excluded.rule;
commit;
select count(*) as badges from badges;
