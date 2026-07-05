-- Emerald Wellness Operating System — Phase 1 Supabase proposal
-- Review and run manually in Supabase only after Vincia approval.
-- This migration avoids renaming existing user_id/customer_id fields.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
      or coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false)
      or lower(coalesce(auth.jwt() ->> 'email', '')) in (
        'vincia@emeraldwellness.health',
        'vinciafontaine@gmail.com'
      );
$$;

create table if not exists public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  goal text,
  category text,
  persona text,
  start_date date,
  end_date date,
  cta text,
  offer text,
  status text not null default 'Draft',
  approval_status text not null default 'Draft',
  created_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketing_campaigns_status_check check (status in ('Draft','Ready for Review','Approved by CEO','Rejected','Scheduled','Published','Archived')),
  constraint marketing_campaigns_approval_check check (approval_status in ('Draft','Ready for Review','Approved by CEO','Rejected','Scheduled','Published','Archived')),
  constraint marketing_campaigns_publish_guard check (status not in ('Scheduled','Published') or approval_status = 'Approved by CEO')
);

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.marketing_campaigns(id) on delete set null,
  title text not null,
  platform text,
  content_type text,
  body text,
  seo_keyword text,
  cta text,
  asset_url text,
  publish_date timestamptz,
  status text not null default 'Draft',
  approval_status text not null default 'Draft',
  created_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_items_status_check check (status in ('Draft','Ready for Review','Approved by CEO','Rejected','Scheduled','Published','Archived')),
  constraint content_items_approval_check check (approval_status in ('Draft','Ready for Review','Approved by CEO','Rejected','Scheduled','Published','Archived')),
  constraint content_items_publish_guard check (status not in ('Scheduled','Published') or approval_status = 'Approved by CEO')
);

create table if not exists public.asset_library (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  asset_type text,
  file_url text,
  alt_text text,
  campaign_id uuid references public.marketing_campaigns(id) on delete set null,
  platform text,
  tags text[],
  usage_rights text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.approval_queue (
  id uuid primary key default gen_random_uuid(),
  item_type text not null,
  item_id uuid,
  title text not null,
  status text not null default 'Draft',
  submitted_by uuid references auth.users(id),
  reviewed_by uuid references auth.users(id),
  review_notes text,
  submitted_at timestamptz default now(),
  reviewed_at timestamptz,
  constraint approval_queue_status_check check (status in ('Draft','Ready for Review','Approved by CEO','Rejected','Scheduled','Published','Archived'))
);

create table if not exists public.ai_agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  purpose text,
  responsibilities text,
  permissions text,
  approval_required boolean not null default true,
  kpis text,
  status text not null default 'Draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_agents_status_check check (status in ('Draft','Ready for Review','Approved by CEO','Rejected','Scheduled','Published','Archived'))
);

create table if not exists public.analytics_connections (
  id uuid primary key default gen_random_uuid(),
  platform text not null unique,
  connection_status text not null default 'Not connected',
  last_synced_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint analytics_connections_status_check check (connection_status in ('Not connected','Pending','Connected','Error','Disabled'))
);

create trigger marketing_campaigns_updated_at before update on public.marketing_campaigns for each row execute function public.set_updated_at();
create trigger content_items_updated_at before update on public.content_items for each row execute function public.set_updated_at();
create trigger asset_library_updated_at before update on public.asset_library for each row execute function public.set_updated_at();
create trigger ai_agents_updated_at before update on public.ai_agents for each row execute function public.set_updated_at();
create trigger analytics_connections_updated_at before update on public.analytics_connections for each row execute function public.set_updated_at();

alter table public.marketing_campaigns enable row level security;
alter table public.content_items enable row level security;
alter table public.asset_library enable row level security;
alter table public.approval_queue enable row level security;
alter table public.ai_agents enable row level security;
alter table public.analytics_connections enable row level security;

create policy "Admins manage marketing campaigns" on public.marketing_campaigns for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage content items" on public.content_items for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage asset library" on public.asset_library for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage approval queue" on public.approval_queue for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage ai agents" on public.ai_agents for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage analytics connections" on public.analytics_connections for all using (public.is_admin()) with check (public.is_admin());

-- Optional seed rows for frontend placeholders.
insert into public.analytics_connections (platform, connection_status, notes)
values
  ('Google Analytics','Not connected','Connect GA4 to display website visitor data.'),
  ('Search Console','Not connected','Connect Search Console to display organic search data.'),
  ('Klaviyo','Not connected','Connect Klaviyo after credentials and send approval workflow are ready.'),
  ('Shopify/shop','Not connected','Connect shop data source.'),
  ('Stripe','Not connected','Connect Stripe reporting with least-privilege access.'),
  ('Meta','Not connected','Connect Meta after ad account approval.'),
  ('TikTok','Not connected','Connect TikTok after channel approval.'),
  ('Pinterest','Not connected','Connect Pinterest after channel approval.'),
  ('YouTube','Not connected','Connect YouTube after channel approval.')
on conflict (platform) do nothing;
