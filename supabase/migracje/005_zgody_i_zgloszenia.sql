-- Pocket Mystery: zgoda na przetwarzanie rozmów przez AI i zgłoszenia odpowiedzi mistrza gry.
-- Wklej całość w Supabase: SQL Editor -> New query -> Run. Uruchom PRZED wdrożeniem kodu.
-- Do tabel ma dostęp wyłącznie serwer (klucz sekretny).

-- Zgoda gracza na przekazanie treści rozgrywki dostawcy AI (wymóg sklepów z aplikacjami).
create table public.zgody_ai (
  user_id uuid primary key references auth.users (id) on delete cascade,
  wersja text not null,
  zgoda timestamptz not null default now()
);

-- Zgłoszenia nieodpowiednich lub błędnych odpowiedzi mistrza gry.
create table public.zgloszenia (
  id bigint generated always as identity primary key,
  utworzono timestamptz not null default now(),
  user_id uuid not null references auth.users (id) on delete cascade,
  gra_id uuid references public.gry (id) on delete cascade,
  sprawa_id text,
  indeks integer,
  powod text not null check (powod in ('nieodpowiednia', 'bledna', 'inne')),
  komentarz text check (char_length(komentarz) <= 1000),
  tekst text check (char_length(tekst) <= 6000),
  status text not null default 'nowe' check (status in ('nowe', 'przejrzane'))
);
create index zgloszenia_czas on public.zgloszenia (utworzono desc);

alter table public.zgody_ai enable row level security;
alter table public.zgloszenia enable row level security;
revoke all on public.zgody_ai, public.zgloszenia from anon, authenticated;

-- Obecni testerzy: zakładamy zgodę dopiero po zalogowaniu i akceptacji ekranu, więc nic tu nie wstawiamy.
