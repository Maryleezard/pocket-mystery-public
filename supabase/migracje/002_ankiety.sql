-- Pocket Mystery: wynik rozgrywki i ankiety testerów (krok 2c).
-- Wklej całość w Supabase: SQL Editor -> New query -> Run.

-- Wynik ustawia serwer, gdy mistrz gry zakończy sprawę: 'rozwiazana' albo 'porazka'.
alter table public.gry
  add column wynik text check (wynik in ('rozwiazana', 'porazka')),
  add column zakonczono timestamptz;

-- Jedna ankieta na rozgrywkę. Porównanie z inną sprawą jest opcjonalne.
create table public.ankiety (
  id bigint generated always as identity primary key,
  gra_id uuid not null unique references public.gry (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  sprawa_id text not null,
  ocena smallint not null check (ocena between 1 and 5),
  trudnosc text not null check (trudnosc in ('za-latwa', 'w-sam-raz', 'za-trudna')),
  uczciwosc smallint not null check (uczciwosc between 1 and 5),
  komentarz text check (char_length(komentarz) <= 2000),
  lepsza_sprawa text,
  dlaczego text check (char_length(dlaczego) <= 1000),
  utworzono timestamptz not null default now()
);
create index ankiety_sprawa on public.ankiety (sprawa_id, utworzono desc);

alter table public.ankiety enable row level security;
revoke all on public.ankiety from anon, authenticated;
