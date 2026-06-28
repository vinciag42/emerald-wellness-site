-- Emerald Wellness Specialty Modules schema
-- Apply in Supabase SQL editor after auth/users and profile tables are ready.
-- This schema supports reusable modules, module-specific content, access, scores,
-- symptoms, labs, protocol links, tasks, progress, reports, notifications,
-- rewards, resources and settings.

create extension if not exists pgcrypto;

create table if not exists public.specialty_modules (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null,
  icon text,
  description text not null,
  safety_disclaimer text not null default 'Emerald Wellness provides educational wellness intelligence and tracking tools. It does not diagnose, treat, cure, or replace medical care. Always consult a qualified healthcare provider.',
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_specialty_modules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null references public.specialty_modules(id) on delete cascade,
  membership_tier text not null default 'free',
  status text not null default 'active' check (status in ('preview','active','paused','graduated','locked')),
  activated_at timestamptz,
  paused_at timestamptz,
  graduated_at timestamptz,
  concierge_level text,
  unique(user_id,module_id)
);

create table if not exists public.module_questions (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.specialty_modules(id) on delete cascade,
  question_text text not null,
  question_type text not null default 'textarea',
  options jsonb not null default '[]'::jsonb,
  weight numeric not null default 1,
  sort_order integer not null default 100,
  is_active boolean not null default true
);

create table if not exists public.module_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null references public.specialty_modules(id) on delete cascade,
  question_id uuid references public.module_questions(id) on delete set null,
  answer jsonb not null default '{}'::jsonb,
  answered_at timestamptz not null default now()
);

create table if not exists public.module_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null references public.specialty_modules(id) on delete cascade,
  score integer not null check (score between 0 and 100),
  symptoms_score integer check (symptoms_score between 0 and 100),
  labs_score integer check (labs_score between 0 and 100),
  protocol_adherence_score integer check (protocol_adherence_score between 0 and 100),
  lifestyle_tasks_score integer check (lifestyle_tasks_score between 0 and 100),
  bodyscan_score integer check (bodyscan_score between 0 and 100),
  goals_score integer check (goals_score between 0 and 100),
  formula_version text not null default 'v1_symptoms20_labs20_protocol20_tasks15_bodyscan10_goals15',
  calculated_at timestamptz not null default now()
);

create table if not exists public.module_symptoms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null references public.specialty_modules(id) on delete cascade,
  symptom_name text not null,
  severity integer check (severity between 0 and 100),
  notes text,
  tracked_on date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.module_labs (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.specialty_modules(id) on delete cascade,
  lab_name text not null,
  lab_category text,
  educational_reason text,
  sort_order integer not null default 100,
  is_required boolean not null default false
);

create table if not exists public.module_protocol_links (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.specialty_modules(id) on delete cascade,
  protocol_slug text not null,
  protocol_title text not null,
  relationship text not null default 'educational_reference',
  sort_order integer not null default 100
);

create table if not exists public.module_tasks (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.specialty_modules(id) on delete cascade,
  task_title text not null,
  task_description text,
  cadence text not null default 'daily',
  sort_order integer not null default 100,
  is_active boolean not null default true
);

create table if not exists public.module_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null references public.specialty_modules(id) on delete cascade,
  progress_type text not null,
  value numeric,
  metadata jsonb not null default '{}'::jsonb,
  tracked_on date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.module_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null references public.specialty_modules(id) on delete cascade,
  report_type text not null check (report_type in ('monthly','milestone','graduation')),
  title text not null,
  body text not null,
  score_snapshot integer check (score_snapshot between 0 and 100),
  disclaimer text not null default 'Emerald Wellness provides educational wellness intelligence and tracking tools. It does not diagnose, treat, cure, or replace medical care. Always consult a qualified healthcare provider.',
  generated_at timestamptz not null default now()
);

create table if not exists public.module_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid references public.specialty_modules(id) on delete cascade,
  title text not null,
  message text not null,
  channel text not null default 'in_app',
  scheduled_for timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.module_rewards (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.specialty_modules(id) on delete cascade,
  reward_name text not null,
  reward_type text not null default 'milestone',
  criteria jsonb not null default '{}'::jsonb,
  sort_order integer not null default 100
);

create table if not exists public.module_resources (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.specialty_modules(id) on delete cascade,
  title text not null,
  resource_type text not null default 'article',
  url text,
  body text,
  sort_order integer not null default 100,
  is_active boolean not null default true
);

create table if not exists public.module_settings (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references public.specialty_modules(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique(module_id,key)
);

alter table public.specialty_modules enable row level security;
alter table public.user_specialty_modules enable row level security;
alter table public.module_questions enable row level security;
alter table public.module_answers enable row level security;
alter table public.module_scores enable row level security;
alter table public.module_symptoms enable row level security;
alter table public.module_labs enable row level security;
alter table public.module_protocol_links enable row level security;
alter table public.module_tasks enable row level security;
alter table public.module_progress enable row level security;
alter table public.module_reports enable row level security;
alter table public.module_notifications enable row level security;
alter table public.module_rewards enable row level security;
alter table public.module_resources enable row level security;
alter table public.module_settings enable row level security;

drop policy if exists "Public can read active module definitions" on public.specialty_modules;
drop policy if exists "Public can read active questions" on public.module_questions;
drop policy if exists "Public can read module labs" on public.module_labs;
drop policy if exists "Public can read module protocols" on public.module_protocol_links;
drop policy if exists "Public can read active tasks" on public.module_tasks;
drop policy if exists "Public can read active resources" on public.module_resources;
drop policy if exists "Users manage own module access" on public.user_specialty_modules;
drop policy if exists "Users manage own answers" on public.module_answers;
drop policy if exists "Users read own scores" on public.module_scores;
drop policy if exists "Users manage own symptoms" on public.module_symptoms;
drop policy if exists "Users manage own progress" on public.module_progress;
drop policy if exists "Users read own reports" on public.module_reports;
drop policy if exists "Users manage own notifications" on public.module_notifications;

create policy "Public can read active module definitions" on public.specialty_modules for select using (is_active = true);
create policy "Public can read active questions" on public.module_questions for select using (is_active = true);
create policy "Public can read module labs" on public.module_labs for select using (true);
create policy "Public can read module protocols" on public.module_protocol_links for select using (true);
create policy "Public can read active tasks" on public.module_tasks for select using (is_active = true);
create policy "Public can read active resources" on public.module_resources for select using (is_active = true);

create policy "Users manage own module access" on public.user_specialty_modules for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own answers" on public.module_answers for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users read own scores" on public.module_scores for select using (auth.uid() = user_id);
create policy "Users manage own symptoms" on public.module_symptoms for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own progress" on public.module_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users read own reports" on public.module_reports for select using (auth.uid() = user_id);
create policy "Users manage own notifications" on public.module_notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into public.module_settings (key,value)
values ('score_formula','{"symptoms":0.20,"labs":0.20,"protocol_adherence":0.20,"lifestyle_tasks":0.15,"bodyscan":0.10,"goals":0.15}'::jsonb)
on conflict (module_id,key) do nothing;
