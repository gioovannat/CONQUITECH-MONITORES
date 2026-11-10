create type public.user_role as enum ('coordenador', 'equipe');
create type public.monitor_group as enum ('LAQI', 'EXTERNO');
create type public.shift as enum ('MANHA', 'TARDE');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null check (char_length(nome) between 2 and 160),
  perfil public.user_role not null default 'equipe',
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table public.monitores (
  id text primary key check (id ~ '^[a-zA-Z0-9_-]{1,128}$'),
  nome text not null check (char_length(nome) between 2 and 160),
  grupo public.monitor_group not null,
  turno public.shift,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint externo_tem_turno check ((grupo = 'EXTERNO' and turno is not null) or (grupo = 'LAQI' and turno is null))
);

create table public.presencas (
  id text primary key check (id ~ '^[a-zA-Z0-9_-]{1,180}$'),
  monitor_id text not null references public.monitores(id) on delete cascade,
  dia smallint not null check (dia between 0 and 4),
  turno public.shift not null,
  registrado_por uuid not null references public.profiles(id),
  registrado_por_nome text not null,
  registrado_por_email text,
  registrado_por_perfil public.user_role not null,
  registrado_em timestamptz not null default now(),
  unique (monitor_id, dia, turno),
  constraint sexta_sem_tarde check (not (dia = 4 and turno = 'TARDE'))
);

create table public.logs (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references public.profiles(id) on delete set null,
  usuario_nome text not null,
  tipo text not null,
  detalhes text not null,
  criado_em timestamptz not null default now()
);

create or replace function public.is_coordinator()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and perfil = 'coordenador' and ativo) $$;

create or replace function public.create_profile()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  insert into public.profiles (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)));
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.create_profile();

alter table public.profiles enable row level security;
alter table public.monitores enable row level security;
alter table public.presencas enable row level security;
alter table public.logs enable row level security;

create policy "users read own profile or coordinators read all" on public.profiles for select to authenticated using (id = auth.uid() or public.is_coordinator());
create policy "coordinators manage profiles" on public.profiles for update to authenticated using (public.is_coordinator()) with check (public.is_coordinator());
create policy "authenticated users read monitors" on public.monitores for select to authenticated using (true);
create policy "coordinators manage monitors" on public.monitores for all to authenticated using (public.is_coordinator()) with check (public.is_coordinator());
create policy "active users read presences" on public.presencas for select to authenticated using (true);
create policy "active users insert presences" on public.presencas for insert to authenticated with check (
  exists (select 1 from public.profiles where id = auth.uid() and ativo)
  and registrado_por = auth.uid()
);
create policy "active users delete presences" on public.presencas for delete to authenticated using (
  exists (select 1 from public.profiles where id = auth.uid() and ativo)
);
create policy "authenticated users read logs" on public.logs for select to authenticated using (true);
create policy "active users write logs" on public.logs for insert to authenticated with check (
  exists (select 1 from public.profiles where id = auth.uid() and ativo) and usuario_id = auth.uid()
);

create index presencas_monitor_id_idx on public.presencas (monitor_id);
create index logs_criado_em_idx on public.logs (criado_em desc);

-- Após criar a primeira conta, promova-a uma única vez no SQL Editor:
-- update public.profiles set perfil = 'coordenador' where id = '<UUID_DO_COORDENADOR>';
