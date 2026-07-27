-- profiles.id had no default, so any insert that didn't explicitly supply
-- a uuid (like the sync-progress edge function's upsert) failed with a
-- not-null violation. This has silently blocked every new profile row
-- since auth moved from Supabase to Clerk.
alter table profiles alter column id set default gen_random_uuid();
