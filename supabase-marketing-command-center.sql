-- Emerald Wellness marketing consent + Command Center persistence
-- Safe to run more than once in Supabase SQL Editor.

alter table public.profiles
  add column if not exists marketing_consent boolean not null default true,
  add column if not exists sms_consent boolean not null default false,
  add column if not exists email_consent_at timestamptz,
  add column if not exists sms_consent_at timestamptz,
  add column if not exists marketing_consent_source text,
  add column if not exists marketing_consent_text text,
  add column if not exists preferred_contact_channel text default 'email',
  add column if not exists lifecycle_stage text default 'member';

alter table public.waitlist
  add column if not exists last_name text,
  add column if not exists phone text,
  add column if not exists goal text,
  add column if not exists tier text,
  add column if not exists marketing_consent boolean not null default true,
  add column if not exists sms_consent boolean not null default false,
  add column if not exists email_consent_at timestamptz,
  add column if not exists sms_consent_at timestamptz,
  add column if not exists marketing_consent_source text,
  add column if not exists marketing_consent_text text,
  add column if not exists user_agent text;

create table if not exists public.command_center_data (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  plan_key text,
  active_modules text[] not null default '{}',
  current_module_id text,
  selected_modules text[] not null default '{}',
  module_state jsonb not null default '{}'::jsonb,
  answers jsonb not null default '{}'::jsonb,
  symptoms jsonb not null default '{}'::jsonb,
  labs jsonb not null default '{}'::jsonb,
  tasks jsonb not null default '{}'::jsonb,
  progress jsonb not null default '{}'::jsonb,
  reports jsonb not null default '[]'::jsonb,
  reminders jsonb not null default '{"email":true,"sms":false,"weekly_check_in":true}'::jsonb,
  last_check_in_at timestamptz,
  last_saved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  email text,
  phone text,
  event_name text not null,
  source text not null default 'website',
  properties jsonb not null default '{}'::jsonb,
  sent_to_klaviyo boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.command_center_data enable row level security;
alter table public.marketing_events enable row level security;

drop policy if exists "Users can view own command center data" on public.command_center_data;
create policy "Users can view own command center data"
  on public.command_center_data for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update own command center data" on public.command_center_data;
create policy "Users can update own command center data"
  on public.command_center_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can insert own command center data" on public.command_center_data;
create policy "Users can insert own command center data"
  on public.command_center_data for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can view own marketing events" on public.marketing_events;
create policy "Users can view own marketing events"
  on public.marketing_events for select
  using (auth.uid() = user_id);

create index if not exists idx_command_center_plan_key on public.command_center_data(plan_key);
create index if not exists idx_command_center_last_saved on public.command_center_data(last_saved_at);
create index if not exists idx_marketing_events_email on public.marketing_events(email);
create index if not exists idx_marketing_events_name on public.marketing_events(event_name);

comment on table public.command_center_data is 'Persistent member Command Center activity for modules, check-ins, labs, tasks, reminders, and reports.';
comment on table public.marketing_events is 'Audit trail of marketing lifecycle events sent or prepared for Klaviyo/email/SMS.';
