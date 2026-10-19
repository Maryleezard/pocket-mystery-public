-- Pocket Mystery: tabele na etap 2 (testy z zaproszonymi graczami).
-- Wklej całość w Supabase: SQL Editor -> New query -> Run.
-- Do tabel ma dostęp wyłącznie serwer (klucz sekretny); przeglądarka nie czyta ich bezpośrednio.

-- Lista osób, które mogą grać w wersji testowej. Adresy małymi literami.
create table public.testerzy (
  email text primary key check (email = lower(email)),
  notatka text,
  dodano timestamptz not null default now()
);

-- Rozgrywki. Historia zawiera pełną rozmowę z mistrzem gry (także jego notatki robocze),
-- widoczne to wiadomości pokazywane graczowi.
create table public.gry (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  sprawa_id text not null,
  historia jsonb not null default '[]'::jsonb,
  widoczne jsonb not null default '[]'::jsonb,
  ruchy integer not null default 0,
  koszt jsonb not null default '{"wejscie":0,"zapisCache":0,"odczytCache":0,"wyjscie":0,"usd":0}'::jsonb,
  zajeta_do timestamptz,
  utworzono timestamptz not null default now(),
  zaktualizowano timestamptz not null default now()
);
create index gry_gracz_sprawa on public.gry (user_id, sprawa_id, utworzono desc);

-- Koszt każdego ruchu, do statystyk i ustalania cen.
create table public.koszty_ruchow (
  id bigint generated always as identity primary key,
  czas timestamptz not null default now(),
  gra_id uuid references public.gry (id) on delete cascade,
  user_id uuid,
  sprawa_id text,
  ruch integer,
  model text,
  stop text,
  zmiany_historii jsonb,
  wejscie integer,
  zapis_cache integer,
  odczyt_cache integer,
  wyjscie integer,
  usd numeric(10, 5)
);
create index koszty_ruchow_czas on public.koszty_ruchow (czas desc);

-- Blokada dostępu z przeglądarki: RLS bez żadnych reguł = nikt poza serwerem.
alter table public.testerzy enable row level security;
alter table public.gry enable row level security;
alter table public.koszty_ruchow enable row level security;
revoke all on public.testerzy, public.gry, public.koszty_ruchow from anon, authenticated;

-- Pierwsza testerka. Zmień adres, jeśli logujesz się innym.
insert into public.testerzy (email, notatka) values ('maryleezard@gmail.com', 'autorka');
