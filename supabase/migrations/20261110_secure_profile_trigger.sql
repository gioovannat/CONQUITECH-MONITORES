create or replace function public.is_coordinator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and perfil = 'coordenador'
      and ativo
  );
$$;

create or replace function public.create_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nome)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'nome'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Usuário'
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.create_profile() from public, anon, authenticated;
revoke all on function public.is_coordinator() from public, anon;
grant execute on function public.is_coordinator() to authenticated;

insert into public.profiles (id, nome)
select
  users.id,
  coalesce(
    nullif(btrim(users.raw_user_meta_data ->> 'nome'), ''),
    nullif(split_part(coalesce(users.email, ''), '@', 1), ''),
    'Usuário'
  )
from auth.users as users
on conflict (id) do nothing;
