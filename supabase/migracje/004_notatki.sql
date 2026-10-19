-- Pocket Mystery: notatnik gracza w osobnym panelu.
-- Wklej całość w Supabase: SQL Editor -> New query -> Run.
-- Mistrz gry dopisuje wpisy do odpowiedzi (znacznik NOTATKA), a serwis zbiera je tutaj,
-- więc otwarcie notatnika nie kosztuje osobnego wywołania modelu.

alter table public.gry
  add column notatki jsonb not null default '[]'::jsonb;
