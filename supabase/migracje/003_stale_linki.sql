-- Pocket Mystery: stałe osobiste linki dla testerów.
-- Wklej całość w Supabase: SQL Editor -> New query -> Run.
-- Każdy tester dostaje losowy klucz; link z kluczem loguje go za każdym razem, bez daty ważności.

alter table public.testerzy
  add column klucz text not null unique default replace(gen_random_uuid()::text, '-', '');
