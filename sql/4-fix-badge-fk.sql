-- escape-log 4: 기록을 지울 때, 그 기록으로 딴 뱃지는 남기고 연결만 끊음
alter table user_badges drop constraint if exists user_badges_record_id_fkey;
alter table user_badges add constraint user_badges_record_id_fkey
  foreign key (record_id) references records(id) on delete set null;
select 'ok' as result;
