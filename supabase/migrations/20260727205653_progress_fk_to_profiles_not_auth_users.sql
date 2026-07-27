-- progress.id was still a foreign key to auth.users(id), a leftover from
-- before auth moved from Supabase to Clerk. Since Clerk-authenticated users
-- never get a row in auth.users, every insert into progress failed with a
-- foreign key violation. progress.id is really a 1:1 link to profiles.id,
-- so point the FK there instead.
alter table progress drop constraint progress_id_fkey;
alter table progress add constraint progress_id_fkey foreign key (id) references profiles(id) on delete cascade;
