-- 德國行程 2027：Supabase 資料庫結構
-- 在 Supabase 專案的 SQL Editor 執行一次即可。
--
-- 設計：
--   * 表格完全不開放給 anon 直接讀寫（RLS 開啟、沒有任何 policy）。
--   * 所有存取都透過下面的 RPC 函式：
--       - 讀取：只要有旅程連結（無法猜測的 UUID）就能讀
--       - 寫入：還需要正確的編輯 PIN（以 bcrypt 雜湊儲存）
--   * 每一筆資料（景點、交通、訂票…）是 items 表的一列，data 欄位是 JSON，
--     同一筆資料最後寫入者為準。
--   * 即時同步由前端透過 Supabase Realtime broadcast 通知其他裝置。

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  pin_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.items (
  trip_id uuid not null references public.trips(id) on delete cascade,
  id text not null,
  data jsonb not null,
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (trip_id, id)
);

create index if not exists items_trip_updated_idx on public.items (trip_id, updated_at);

alter table public.trips enable row level security;
alter table public.items enable row level security;
revoke all on public.trips from anon, authenticated;
revoke all on public.items from anon, authenticated;

-- 內部：驗證 PIN
create or replace function public._trip_pin_ok(p_trip uuid, p_pin text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.trips t
    where t.id = p_trip
      and t.pin_hash = extensions.crypt(p_pin, t.pin_hash)
  );
$$;
revoke all on function public._trip_pin_ok(uuid, text) from public, anon, authenticated;

-- 建立旅程（並一次寫入初始資料）
create or replace function public.create_trip(p_pin text, p_items jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_pin is null or length(p_pin) < 4 or length(p_pin) > 32 then
    raise exception 'PIN 需為 4 到 32 個字元';
  end if;
  insert into public.trips (pin_hash)
  values (extensions.crypt(p_pin, extensions.gen_salt('bf')))
  returning id into v_id;

  insert into public.items (trip_id, id, data)
  select v_id, e->>'id', e
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) e
  where e ? 'id';

  return v_id;
end;
$$;

-- 讀取整趟旅程（未刪除的資料）
create or replace function public.get_trip(p_trip uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when not exists (select 1 from public.trips where id = p_trip) then null
    else coalesce(
      (select jsonb_agg(i.data order by i.id) from public.items i
        where i.trip_id = p_trip and not i.deleted),
      '[]'::jsonb)
  end;
$$;

-- 檢查 PIN
create or replace function public.check_pin(p_trip uuid, p_pin text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public._trip_pin_ok(p_trip, p_pin);
$$;

-- 新增或更新多筆資料
create or replace function public.upsert_items(p_trip uuid, p_pin text, p_items jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public._trip_pin_ok(p_trip, p_pin) then
    raise exception 'PIN 錯誤' using errcode = '28000';
  end if;
  insert into public.items (trip_id, id, data, deleted, updated_at)
  select p_trip, e->>'id', e, false, now()
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) e
  where e ? 'id'
  on conflict (trip_id, id) do update
    set data = excluded.data, deleted = false, updated_at = now();
end;
$$;

-- 刪除多筆資料（軟刪除）
create or replace function public.delete_items(p_trip uuid, p_pin text, p_ids text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public._trip_pin_ok(p_trip, p_pin) then
    raise exception 'PIN 錯誤' using errcode = '28000';
  end if;
  update public.items
    set deleted = true, updated_at = now()
    where trip_id = p_trip and id = any(p_ids);
end;
$$;

grant execute on function public.create_trip(text, jsonb) to anon, authenticated;
grant execute on function public.get_trip(uuid) to anon, authenticated;
grant execute on function public.check_pin(uuid, text) to anon, authenticated;
grant execute on function public.upsert_items(uuid, text, jsonb) to anon, authenticated;
grant execute on function public.delete_items(uuid, text, text[]) to anon, authenticated;
