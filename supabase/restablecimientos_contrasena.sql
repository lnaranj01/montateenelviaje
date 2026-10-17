begin;

create table if not exists public.restablecimientos_contrasena (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  token_hash text not null unique,
  expira_en timestamptz not null,
  usado_en timestamptz,
  creado_en timestamptz not null default now()
);

create index if not exists restablecimientos_contrasena_usuario_id_idx
  on public.restablecimientos_contrasena (usuario_id);

alter table public.restablecimientos_contrasena enable row level security;
revoke all on table public.restablecimientos_contrasena from public, anon, authenticated;
grant all on table public.restablecimientos_contrasena to service_role;

create or replace function public.contar_solicitudes_restablecimiento(p_usuario_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.restablecimientos_contrasena
  where usuario_id = p_usuario_id
    and creado_en > pg_catalog.now() - interval '15 minutes';
$$;

create or replace function public.invalidar_solicitudes_restablecimiento(p_usuario_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  cantidad_actualizada integer;
begin
  update public.restablecimientos_contrasena
  set usado_en = pg_catalog.now()
  where usuario_id = p_usuario_id
    and usado_en is null;

  get diagnostics cantidad_actualizada = row_count;
  return cantidad_actualizada;
end;
$$;

create or replace function public.crear_solicitud_restablecimiento(
  p_usuario_id uuid,
  p_token_hash text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  cantidad_solicitudes integer;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_usuario_id::text, 0)
  );

  select count(*)::integer
  into cantidad_solicitudes
  from public.restablecimientos_contrasena
  where usuario_id = p_usuario_id
    and creado_en > pg_catalog.now() - interval '15 minutes';

  if cantidad_solicitudes >= 3 then
    return false;
  end if;

  perform public.invalidar_solicitudes_restablecimiento(p_usuario_id);

  insert into public.restablecimientos_contrasena (usuario_id, token_hash, expira_en)
  values (p_usuario_id, p_token_hash, pg_catalog.now() + interval '30 minutes');

  return true;
end;
$$;

create or replace function public.buscar_restablecimiento_vigente(p_token_hash text)
returns table (token_id uuid, usuario_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  select restablecimiento.id, restablecimiento.usuario_id
  from public.restablecimientos_contrasena as restablecimiento
  where restablecimiento.token_hash = p_token_hash
    and restablecimiento.usado_en is null
    and restablecimiento.expira_en > pg_catalog.now()
  limit 1;
$$;

create or replace function public.marcar_restablecimiento_usado(p_token_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with actualizado as (
    update public.restablecimientos_contrasena
    set usado_en = pg_catalog.now()
    where id = p_token_id
      and usado_en is null
      and expira_en > pg_catalog.now()
    returning id
  )
  select exists (select 1 from actualizado);
$$;

revoke all on function public.contar_solicitudes_restablecimiento(uuid) from public, anon, authenticated;
revoke all on function public.invalidar_solicitudes_restablecimiento(uuid) from public, anon, authenticated;
revoke all on function public.crear_solicitud_restablecimiento(uuid, text) from public, anon, authenticated;
revoke all on function public.buscar_restablecimiento_vigente(text) from public, anon, authenticated;
revoke all on function public.marcar_restablecimiento_usado(uuid) from public, anon, authenticated;

grant execute on function public.contar_solicitudes_restablecimiento(uuid) to service_role;
grant execute on function public.invalidar_solicitudes_restablecimiento(uuid) to service_role;
grant execute on function public.crear_solicitud_restablecimiento(uuid, text) to service_role;
grant execute on function public.buscar_restablecimiento_vigente(text) to service_role;
grant execute on function public.marcar_restablecimiento_usado(uuid) to service_role;

commit;