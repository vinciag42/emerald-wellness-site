-- Emerald Wellness Specialty Module Marketplace
-- Expanded 10-category / 96-module architecture.

create extension if not exists pgcrypto;

create table if not exists public.module_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.module_categories add column if not exists is_active boolean not null default true;

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

alter table public.specialty_modules add column if not exists category_id uuid references public.module_categories(id);
alter table public.specialty_modules add column if not exists short_description text;
alter table public.specialty_modules add column if not exists long_description text;
alter table public.specialty_modules add column if not exists best_for text;
alter table public.specialty_modules add column if not exists status text not null default 'active' check (status in ('active','coming_soon','archived'));
alter table public.specialty_modules add column if not exists price_monthly numeric not null default 49.99;
alter table public.specialty_modules add column if not exists included_plan_level text not null default 'Gold+';
alter table public.specialty_modules add column if not exists is_featured boolean not null default false;
alter table public.specialty_modules add column if not exists is_public_preview_enabled boolean not null default true;
alter table public.specialty_modules add column if not exists marketing_copy text;
alter table public.specialty_modules add column if not exists features jsonb not null default '[]'::jsonb;
alter table public.specialty_modules add column if not exists scoring_weights jsonb not null default '{"symptoms":0.20,"labs":0.20,"protocol_adherence":0.20,"lifestyle_tasks":0.15,"bodyscan":0.10,"goals":0.15}'::jsonb;
alter table public.specialty_modules add column if not exists recommendation_keywords text;
alter table public.specialty_modules add column if not exists published boolean not null default true;

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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,module_id)
);

create table if not exists public.module_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null references public.specialty_modules(id) on delete cascade,
  reason text,
  source text not null default 'goals_symptoms_labs_bodyscan_onboarding',
  score numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.module_questions (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.specialty_modules(id) on delete cascade,
  question_text text not null,
  question_type text not null default 'textarea',
  options jsonb not null default '[]'::jsonb,
  weight numeric not null default 1,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.module_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null references public.specialty_modules(id) on delete cascade,
  question_id uuid references public.module_questions(id) on delete set null,
  answer jsonb not null default '{}'::jsonb,
  answered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.module_symptoms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  module_id uuid not null references public.specialty_modules(id) on delete cascade,
  symptom_name text not null,
  severity integer check (severity between 0 and 100),
  notes text,
  tracked_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.module_labs (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.specialty_modules(id) on delete cascade,
  lab_name text not null,
  lab_category text,
  educational_reason text,
  sort_order integer not null default 100,
  is_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.module_protocol_templates (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.specialty_modules(id) on delete cascade,
  protocol_slug text not null,
  protocol_title text not null,
  relationship text not null default 'educational_reference',
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(module_id, protocol_slug)
);

create table if not exists public.module_tasks (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.specialty_modules(id) on delete cascade,
  task_title text not null,
  task_description text,
  cadence text not null default 'daily',
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.module_resources (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.specialty_modules(id) on delete cascade,
  title text not null,
  resource_type text not null default 'article',
  url text,
  body text,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.module_settings (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references public.specialty_modules(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(module_id,key)
);

insert into public.module_categories (slug,name,sort_order) values
('foundational-health','Foundational Health',1),
('hormones-metabolism','Hormones & Metabolism',2),
('brain-mental-performance','Brain & Mental Performance',3),
('digestive-immune-health','Digestive & Immune Health',4),
('cardiovascular-longevity','Cardiovascular & Longevity',5),
('performance-recovery','Performance & Recovery',6),
('appearance-vitality','Appearance & Vitality',7),
('environmental-health','Environmental Health',8),
('specialized-wellness','Specialized Wellness',9),
('advanced-bio-optimization','Advanced Bio-Optimization',10)
on conflict (slug) do update set name=excluded.name, sort_order=excluded.sort_order, updated_at=now();

update public.module_categories
set is_active = true, updated_at = now()
where slug in ('foundational-health','hormones-metabolism','brain-mental-performance','digestive-immune-health','cardiovascular-longevity','performance-recovery','appearance-vitality','environmental-health','specialized-wellness','advanced-bio-optimization');

update public.module_categories
set is_active = false, updated_at = now()
where slug not in ('foundational-health','hormones-metabolism','brain-mental-performance','digestive-immune-health','cardiovascular-longevity','performance-recovery','appearance-vitality','environmental-health','specialized-wellness','advanced-bio-optimization');

with raw(category, names) as (
  values
  ('Foundational Health', array['Health Optimization Fundamentals','Healthy Habits & Lifestyle','Nutrition Foundations','Hydration Optimization','Exercise & Movement','Recovery & Resilience','Sleep Repair','Stress Management','Mindfulness & Meditation','Healthy Aging']),
  ('Hormones & Metabolism', array['Hormone Optimization','Menopause Support','Perimenopause Support','Women''s Health','Men''s Performance','Testosterone Optimization','Thyroid Optimization','Adrenal Health','Cortisol & Stress','Blood Sugar Optimization','Weight Loss & Metabolism','GLP-1 Companion Program','Metabolic Flexibility']),
  ('Brain & Mental Performance', array['Brain Fog & Focus','Memory Optimization','Mood & Emotional Wellness','Executive Performance','Cognitive Longevity','ADHD Support','Burnout Recovery','Mental Resilience']),
  ('Digestive & Immune Health', array['Gut Reset','Digestive Health','Food Sensitivity & Elimination','Microbiome Health','Immune Health','Allergies & Seasonal Wellness','Histamine & Mast Cell Support','Autoimmune Wellness Support','Long COVID Recovery Support','Chronic Fatigue Support','Fibromyalgia Wellness Support']),
  ('Cardiovascular & Longevity', array['Longevity & Healthy Aging','Heart Health','Cholesterol Optimization','Blood Pressure Support','Inflammation Reduction','Mitochondrial Health','Cellular Longevity','Healthy Aging for Women','Healthy Aging for Men']),
  ('Performance & Recovery', array['Energy & Vitality','Athletic Performance','Muscle Building','Recovery Optimization','Mobility & Flexibility','Joint Health','Bone Health','Injury Recovery']),
  ('Appearance & Vitality', array['Skin Optimization','Hair Growth','Healthy Nails','Collagen & Connective Tissue','Healthy Weight Maintenance','Healthy Body Composition']),
  ('Environmental Health', array['Environmental Toxin Awareness','Mold Exposure Education','Heavy Metal Awareness','Air Quality & Respiratory Wellness','Water Quality Awareness','Household Chemical Exposure','Endocrine Disruptor Education','Plastic & Microplastic Exposure']),
  ('Specialized Wellness', array['Sexual Wellness','Fertility Support','Healthy Pregnancy Education','Postpartum Recovery','Healthy Family Wellness','Healthy Travel & Jet Lag','Shift Worker Wellness','Migraine & Headache Wellness','Healthy Vision','Hearing Wellness','Oral Health','Kidney Wellness','Liver Health','Respiratory Wellness']),
  ('Advanced Bio-Optimization', array['Biomarker Mastery','Advanced Lab Interpretation','Peptide Education','Supplement Optimization','Protocol Builder','Recovery Technologies','Red Light Therapy','Sauna Optimization','Cold Exposure','Wearable Device Integration'])
),
expanded as (
  select c.id as category_id, raw.category, module_name as name, row_number() over () as sort_order,
  trim(both '-' from regexp_replace(replace(lower(module_name),'&','and'),'[^a-z0-9]+','-','g')) as slug
  from raw
  join public.module_categories c on c.name = raw.category
  cross join lateral unnest(raw.names) as module_name
),
launch as (
  select unnest(array['hormone-optimization','weight-loss-and-metabolism','sleep-repair','brain-fog-and-focus','gut-reset','menopause-support','men-s-performance','inflammation-reduction','energy-and-vitality','longevity-and-healthy-aging','skin-optimization','allergies-and-seasonal-wellness','autoimmune-wellness-support','environmental-toxin-awareness','mold-exposure-education','heavy-metal-awareness']) as slug
)
insert into public.specialty_modules (
  slug,name,category,category_id,icon,description,short_description,long_description,best_for,status,
  price_monthly,included_plan_level,is_featured,is_public_preview_enabled,marketing_copy,features,
  recommendation_keywords,published,is_active,sort_order
)
select
  e.slug,
  e.name,
  e.category,
  e.category_id,
  '◇',
  'Educational wellness module for awareness, tracking, labs, daily check-ins, Protocol Vault links, BodyScan notes, progress reports, and provider-safe discussion prompts.',
  'Educational wellness module for awareness, tracking, and progress organization.',
  'This module organizes educational wellness intelligence, symptom patterns, goals, labs, BodyScan notes, progress reports, and questions to discuss with a qualified healthcare provider.',
  'Members focused on ' || lower(e.name) || ' education, tracking, and wellness insights.',
  case when l.slug is null then 'coming_soon' else 'active' end,
  49.99,
  'Gold+',
  e.slug in ('hormone-optimization','weight-loss-and-metabolism','sleep-repair','brain-fog-and-focus','energy-and-vitality','gut-reset','allergies-and-seasonal-wellness','autoimmune-wellness-support','environmental-toxin-awareness','mold-exposure-education','heavy-metal-awareness'),
  true,
  'Public preview card for ' || e.name || '.',
  '["Module score","Assessment","Symptom tracker","Recommended labs","Daily check-ins","Learning center"]'::jsonb,
  lower(e.name || ' ' || e.category),
  true,
  true,
  e.sort_order
from expanded e
left join launch l on l.slug = e.slug
on conflict (slug) do update set
  name=excluded.name,
  category=excluded.category,
  category_id=excluded.category_id,
  description=excluded.description,
  short_description=excluded.short_description,
  long_description=excluded.long_description,
  best_for=excluded.best_for,
  status=excluded.status,
  price_monthly=excluded.price_monthly,
  included_plan_level=excluded.included_plan_level,
  is_featured=excluded.is_featured,
  is_public_preview_enabled=excluded.is_public_preview_enabled,
  marketing_copy=excluded.marketing_copy,
  features=excluded.features,
  recommendation_keywords=excluded.recommendation_keywords,
  published=excluded.published,
  is_active=excluded.is_active,
  sort_order=excluded.sort_order,
  updated_at=now();

with keep(slug) as (
  select trim(both '-' from regexp_replace(replace(lower(name),'&','and'),'[^a-z0-9]+','-','g'))
  from (
    values
    ('Health Optimization Fundamentals'),('Healthy Habits & Lifestyle'),('Nutrition Foundations'),('Hydration Optimization'),('Exercise & Movement'),('Recovery & Resilience'),('Sleep Repair'),('Stress Management'),('Mindfulness & Meditation'),('Healthy Aging'),
    ('Hormone Optimization'),('Menopause Support'),('Perimenopause Support'),('Women''s Health'),('Men''s Performance'),('Testosterone Optimization'),('Thyroid Optimization'),('Adrenal Health'),('Cortisol & Stress'),('Blood Sugar Optimization'),('Weight Loss & Metabolism'),('GLP-1 Companion Program'),('Metabolic Flexibility'),
    ('Brain Fog & Focus'),('Memory Optimization'),('Mood & Emotional Wellness'),('Executive Performance'),('Cognitive Longevity'),('ADHD Support'),('Burnout Recovery'),('Mental Resilience'),
    ('Gut Reset'),('Digestive Health'),('Food Sensitivity & Elimination'),('Microbiome Health'),('Immune Health'),('Allergies & Seasonal Wellness'),('Histamine & Mast Cell Support'),('Autoimmune Wellness Support'),('Long COVID Recovery Support'),('Chronic Fatigue Support'),('Fibromyalgia Wellness Support'),
    ('Longevity & Healthy Aging'),('Heart Health'),('Cholesterol Optimization'),('Blood Pressure Support'),('Inflammation Reduction'),('Mitochondrial Health'),('Cellular Longevity'),('Healthy Aging for Women'),('Healthy Aging for Men'),
    ('Energy & Vitality'),('Athletic Performance'),('Muscle Building'),('Recovery Optimization'),('Mobility & Flexibility'),('Joint Health'),('Bone Health'),('Injury Recovery'),
    ('Skin Optimization'),('Hair Growth'),('Healthy Nails'),('Collagen & Connective Tissue'),('Healthy Weight Maintenance'),('Healthy Body Composition'),
    ('Environmental Toxin Awareness'),('Mold Exposure Education'),('Heavy Metal Awareness'),('Air Quality & Respiratory Wellness'),('Water Quality Awareness'),('Household Chemical Exposure'),('Endocrine Disruptor Education'),('Plastic & Microplastic Exposure'),
    ('Sexual Wellness'),('Fertility Support'),('Healthy Pregnancy Education'),('Postpartum Recovery'),('Healthy Family Wellness'),('Healthy Travel & Jet Lag'),('Shift Worker Wellness'),('Migraine & Headache Wellness'),('Healthy Vision'),('Hearing Wellness'),('Oral Health'),('Kidney Wellness'),('Liver Health'),('Respiratory Wellness'),
    ('Biomarker Mastery'),('Advanced Lab Interpretation'),('Peptide Education'),('Supplement Optimization'),('Protocol Builder'),('Recovery Technologies'),('Red Light Therapy'),('Sauna Optimization'),('Cold Exposure'),('Wearable Device Integration')
  ) as x(name)
)
update public.specialty_modules
set published=false, is_active=false, status='archived', updated_at=now()
where slug not in (select slug from keep);

insert into public.module_settings (module_id,key,value)
select null,'recommendation_rules','[
  {"if":"low energy, fatigue, stamina, motivation, or mitochondrial health support","recommend":["Energy & Vitality","Sleep Repair","Hormone Optimization"]},
  {"if":"fatigue + brain fog + poor sleep","recommend":["Energy & Vitality","Sleep Repair","Brain Fog & Focus","Hormone Optimization"]},
  {"if":"joint discomfort + inflammation + fatigue","recommend":["Inflammation Reduction","Autoimmune Wellness Support","Joint Health"]},
  {"if":"seasonal allergy symptoms","recommend":["Allergies & Seasonal Wellness","Histamine & Mast Cell Support","Immune Health"]},
  {"if":"mold exposure concern","recommend":["Mold Exposure Education","Environmental Toxin Awareness","Respiratory Wellness"]},
  {"if":"toxin exposure, heavy metals, plastics, or chemical sensitivity","recommend":["Environmental Toxin Awareness","Heavy Metal Awareness","Endocrine Disruptor Education","Household Chemical Exposure"]},
  {"if":"menopause symptoms","recommend":["Menopause Support","Sleep Repair","Bone Health","Heart Health"]},
  {"if":"weight gain + blood sugar concerns","recommend":["Weight Loss & Metabolism","Blood Sugar Optimization","GLP-1 Companion Program"]},
  {"if":"stress + burnout","recommend":["Cortisol & Stress","Burnout Recovery","Mental Resilience","Sleep Repair"]}
]'::jsonb
where not exists (select 1 from public.module_settings where module_id is null and key='recommendation_rules');

insert into public.module_settings (module_id,key,value)
select null,'score_formula','{"symptoms":0.20,"labs":0.20,"protocol_adherence":0.20,"lifestyle_tasks":0.15,"bodyscan":0.10,"goals":0.15}'::jsonb
where not exists (select 1 from public.module_settings where module_id is null and key='score_formula');

alter table public.module_categories enable row level security;
alter table public.specialty_modules enable row level security;
alter table public.user_specialty_modules enable row level security;
alter table public.module_recommendations enable row level security;
alter table public.module_questions enable row level security;
alter table public.module_answers enable row level security;
alter table public.module_symptoms enable row level security;
alter table public.module_labs enable row level security;
alter table public.module_protocol_templates enable row level security;
alter table public.module_tasks enable row level security;
alter table public.module_scores enable row level security;
alter table public.module_resources enable row level security;
alter table public.module_reports enable row level security;
alter table public.module_settings enable row level security;

drop policy if exists "Public can read module categories" on public.module_categories;
drop policy if exists "Public can read published modules" on public.specialty_modules;
drop policy if exists "Users manage own module access" on public.user_specialty_modules;
drop policy if exists "Users read own recommendations" on public.module_recommendations;
drop policy if exists "Users manage own answers" on public.module_answers;
drop policy if exists "Users manage own symptoms" on public.module_symptoms;
drop policy if exists "Users read own scores" on public.module_scores;
drop policy if exists "Users read own reports" on public.module_reports;

create policy "Public can read module categories" on public.module_categories for select using (is_active = true);
create policy "Public can read published modules" on public.specialty_modules for select using (published = true and is_active = true and status <> 'archived');
create policy "Users manage own module access" on public.user_specialty_modules for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users read own recommendations" on public.module_recommendations for select using (auth.uid() = user_id);
create policy "Users manage own answers" on public.module_answers for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own symptoms" on public.module_symptoms for all using (auth.uid() = user_id or user_id is null) with check (auth.uid() = user_id or user_id is null);
create policy "Users read own scores" on public.module_scores for select using (auth.uid() = user_id);
create policy "Users read own reports" on public.module_reports for select using (auth.uid() = user_id);
