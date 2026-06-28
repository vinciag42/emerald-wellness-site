-- Emerald Wellness Specialty Module Marketplace schema + seed data
-- Public website, member dashboard, and mobile app all read module metadata from these same tables.

create extension if not exists pgcrypto;

create table if not exists public.module_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
alter table public.specialty_modules add column if not exists best_for text;
alter table public.specialty_modules add column if not exists marketing_copy text;
alter table public.specialty_modules add column if not exists features jsonb not null default '[]'::jsonb;
alter table public.specialty_modules add column if not exists price_cents integer not null default 3500;
alter table public.specialty_modules add column if not exists price_teaser text not null default 'Included by tier. Extra modules $35/month; 3-module bundle $89/month.';
alter table public.specialty_modules add column if not exists scoring_weights jsonb not null default '{"symptoms":0.20,"labs":0.20,"protocol_adherence":0.20,"lifestyle_tasks":0.15,"bodyscan":0.10,"goals":0.15}'::jsonb;
alter table public.specialty_modules add column if not exists featured boolean not null default false;
alter table public.specialty_modules add column if not exists coming_soon boolean not null default false;
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
  user_id uuid not null references auth.users(id) on delete cascade,
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

-- Compatibility for the earlier build.
create table if not exists public.module_protocol_links (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.specialty_modules(id) on delete cascade,
  protocol_slug text not null,
  protocol_title text not null,
  relationship text not null default 'educational_reference',
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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

create table if not exists public.module_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null references public.specialty_modules(id) on delete cascade,
  progress_type text not null,
  value numeric,
  metadata jsonb not null default '{}'::jsonb,
  tracked_on date not null default current_date,
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

create table if not exists public.module_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid references public.specialty_modules(id) on delete set null,
  purchase_type text not null check (purchase_type in ('extra_module','three_module_bundle','concierge_upgrade')),
  stripe_customer_id text,
  stripe_checkout_session_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  status text not null default 'pending',
  amount_cents integer,
  currency text not null default 'usd',
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

create table if not exists public.module_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid references public.specialty_modules(id) on delete cascade,
  title text not null,
  message text not null,
  channel text not null default 'in_app',
  scheduled_for timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.module_rewards (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.specialty_modules(id) on delete cascade,
  reward_name text not null,
  reward_type text not null default 'milestone',
  criteria jsonb not null default '{}'::jsonb,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.module_categories (slug,name,sort_order) values
('hormones','Hormones',1),('weight-loss','Weight Loss',2),('brain-performance','Brain Performance',3),('gut-health','Gut Health',4),('sleep','Sleep',5),('longevity','Longevity',6),('pain-inflammation','Pain & Inflammation',7),('skin-hair','Skin & Hair',8),('mens-health','Men''s Health',9),('womens-health','Women''s Health',10),('athletic-performance','Athletic Performance',11),('sexual-wellness','Sexual Wellness',12),('metabolic-health','Metabolic Health',13),('stress-cortisol','Stress & Cortisol',14),('immune-health','Immune Health',15)
on conflict (slug) do update set name=excluded.name, sort_order=excluded.sort_order, updated_at=now();

insert into public.specialty_modules (slug,name,category,icon,description,best_for,marketing_copy,features,price_cents,price_teaser,featured,coming_soon,published,sort_order)
values
('hormone-optimization','Hormone Optimization','Hormones','⚖️','Organize hormone-support education, labs, symptoms, lifestyle patterns, and provider discussion points.','Adults tracking energy, sleep, libido, mood, cycle changes, or hormone lab conversations.','A focused hormone education track with scoring, lab prompts, symptoms, and Protocol Vault links.','["Module score","Hormone lab checklist","Cycle and symptom tracker","Protocol Vault links"]'::jsonb,3500,'Included by tier. Extra modules $35/month; 3-module bundle $89/month.',true,false,true,1),
('weight-loss-metabolism','Weight Loss & Metabolism','Weight Loss','⚡','Track metabolic education, appetite patterns, body composition goals, GLP-1 discussion points, and nutrition consistency.','Members focused on body composition, appetite awareness, glucose education, or metabolic habits.','Metabolic education, BodyScan progress, daily actions, and lab prompts in one module.','["Appetite tracker","BodyScan progress","Protein and hydration checklist","Metabolic lab prompts"]'::jsonb,3500,'Included by tier. Extra modules $35/month; 3-module bundle $89/month.',true,false,true,2),
('brain-fog-focus','Brain Fog & Focus','Brain Performance','🧠','Support focus education through sleep, stress, nutrient, wearable, and daily cognitive pattern tracking.','Members tracking focus, clarity, memory, workload strain, or recovery routines.','A focused dashboard for clarity patterns, sleep/stress inputs, and learning resources.','["Focus score","Sleep/stress questions","Learning center","Daily clarity checklist"]'::jsonb,3500,'Included by tier. Extra modules $35/month; 3-module bundle $89/month.',true,false,true,3),
('gut-reset','Gut Reset','Gut Health','🌿','Organize digestive education, symptom patterns, food timing, microbiome support, and provider-review questions.','Members tracking bloating, digestion, bowel patterns, food response, or gut-support routines.','Digestive education with symptom tracking, food-response notes, and protocol references.','["Gut symptom tracker","Food response notes","Protocol Vault links","Digestive lab prompts"]'::jsonb,3500,'Included by tier. Extra modules $35/month; 3-module bundle $89/month.',true,false,true,4),
('womens-health','Women''s Health','Women''s Health','🌸','Track cycle-aware education, energy patterns, mood, recovery, nutrients, and provider discussion points.','Women organizing monthly patterns, cycle changes, wellness goals, and lab-review notes.','Cycle-aware wellness education with monthly reporting and concierge questions.','["Cycle-aware tracker","Hormone lab prompts","Monthly report","Concierge questions"]'::jsonb,3500,'Included by tier. Extra modules $35/month; 3-module bundle $89/month.',true,false,true,5),
('menopause-support','Menopause Support','Women''s Health','🌙','Organize menopause-transition education, sleep, temperature shifts, mood, strength, and provider-review planning.','Women tracking perimenopause or menopause patterns and quarterly wellness reviews.','Supportive education for transition patterns, sleep, strength, and provider review.','["Sleep and hot-flash tracking","Strength checklist","Provider questions","Learning center"]'::jsonb,3500,'Included by tier. Extra modules $35/month; 3-module bundle $89/month.',true,false,true,6),
('mens-performance','Men''s Performance','Men''s Health','🏋️','Track men''s wellness education around strength, recovery, cardiovascular habits, hormones, and performance goals.','Men focused on energy, training, recovery, libido, or metabolic markers.','A performance education track for men with labs, recovery, and daily actions.','["Performance score","Training recovery tracker","Lab prompts","Daily action checklist"]'::jsonb,3500,'Included by tier. Extra modules $35/month; 3-module bundle $89/month.',false,false,true,7),
('testosterone-optimization','Testosterone Optimization','Men''s Health','🔥','Organize testosterone-support education, sleep, resistance training, nutrition, and provider lab-review questions.','Men tracking testosterone conversations, strength, libido, mood, or recovery habits.','Education-first tracking for testosterone-support habits and lab-review conversations.','["Hormone lab checklist","Strength rhythm","Sleep tracker","Provider review notes"]'::jsonb,3500,'Included by tier. Extra modules $35/month; 3-module bundle $89/month.',false,false,true,8),
('longevity-healthy-aging','Longevity & Healthy Aging','Longevity','🧬','Track healthy-aging education, biomarkers, inflammation, mitochondrial support, and quarterly progress reviews.','Members focused on long-range healthspan, recovery, biomarkers, and sustainable routines.','Longevity education with quarterly biomarkers, reports, and milestone tracking.','["Longevity score","Quarterly lab prompts","Biology Intelligence insights","Milestone report"]'::jsonb,3500,'Included by tier. Extra modules $35/month; 3-module bundle $89/month.',false,false,true,9),
('sleep-repair','Sleep Repair','Sleep','🌙','Track sleep education, evening routines, wearable trends, recovery patterns, and sleep-support consistency.','Members tracking sleep quality, nighttime waking, morning fatigue, HRV, or recovery.','Sleep education, wearable notes, recovery graph, and daily sleep actions.','["Sleep checklist","Wearable notes","Recovery graph","Learning center"]'::jsonb,3500,'Included by tier. Extra modules $35/month; 3-module bundle $89/month.',false,false,true,10),
('pain-inflammation','Pain & Inflammation','Pain & Inflammation','🔥','Organize inflammation education, discomfort patterns, mobility, recovery habits, and provider-review questions.','Members tracking soreness, stiffness, recovery patterns, or inflammation-related labs.','Inflammation education with pain-scale tracking, mobility actions, and lab prompts.','["Pain scale tracker","Mobility checklist","Inflammation labs","Protocol Vault links"]'::jsonb,3500,'Included by tier. Extra modules $35/month; 3-module bundle $89/month.',false,false,true,11),
('skin-optimization','Skin Optimization','Skin & Hair','✨','Track skin-support education, hydration, collagen routines, nutrients, hormones, and lifestyle patterns.','Members focused on skin quality, texture, recovery, glow, or aesthetic wellness tracking.','Skin wellness education with nutrient prompts, progress notes, and monthly reports.','["Skin tracker","Nutrient prompts","GHK-Cu education link","Monthly progress report"]'::jsonb,3500,'Included by tier. Extra modules $35/month; 3-module bundle $89/month.',false,false,true,12),
('hair-growth','Hair Growth','Skin & Hair','🌱','Organize hair-wellness education, nutrient status, stress, hormones, thyroid markers, and progress notes.','Members tracking shedding, growth cycles, nutrient questions, or thyroid/hormone review notes.','Hair wellness education with ferritin, thyroid, stress, and progress prompts.','["Hair photo notes","Ferritin and thyroid prompts","Stress checklist","Learning center"]'::jsonb,3500,'Included by tier. Extra modules $35/month; 3-module bundle $89/month.',false,false,true,13),
('athletic-recovery','Athletic Recovery','Athletic Performance','🏃','Track training readiness, soreness, HRV, mobility, protein habits, and performance recovery education.','Athletes and active members focused on recovery, adaptation, consistency, and injury-prevention questions.','Recovery education with training logs, HRV notes, BodyScan, and mobility actions.','["Recovery score","Training log","Mobility checklist","BodyScan progress"]'::jsonb,3500,'Included by tier. Extra modules $35/month; 3-module bundle $89/month.',false,false,true,14),
('stress-cortisol','Stress & Cortisol','Stress & Cortisol','🫧','Track stress education, nervous-system routines, sleep, caffeine timing, symptoms, and cortisol discussion points.','Members managing heavy workload, poor recovery, sleep disruption, cravings, or resilience goals.','Stress-pattern education with sleep, stimulant timing, breathwork, and lab prompts.','["Stress score","Breathwork checklist","Sleep/stimulant tracker","Cortisol lab prompts"]'::jsonb,3500,'Included by tier. Extra modules $35/month; 3-module bundle $89/month.',false,false,true,15),
('sexual-wellness','Sexual Wellness','Sexual Wellness','❤️','Organize sexual-wellness education around hormones, circulation, stress, sleep, and provider-safe questions.','Members tracking libido, confidence, stress impact, medication-review questions, or relationship context.','Sexual wellness education with hormone, circulation, stress, and concierge notes.','["Wellness tracker","Hormone/circulation prompts","Concierge notes","Learning center"]'::jsonb,3500,'Included by tier. Extra modules $35/month; 3-module bundle $89/month.',false,false,true,16),
('thyroid-optimization','Thyroid Optimization','Hormones','🦋','Track thyroid education, energy, temperature, hair, digestion, labs, and provider-review notes.','Members organizing thyroid lab conversations, energy patterns, metabolism, and symptom trends.','Thyroid education with lab prompts, energy notes, and progress analytics.','["Thyroid lab checklist","Temperature/energy notes","Nutrition prompts","Progress analytics"]'::jsonb,3500,'Included by tier. Extra modules $35/month; 3-module bundle $89/month.',false,false,true,17),
('glp1-support','GLP-1 Support','Weight Loss','💧','Support GLP-1 education with hydration, protein, digestion, muscle preservation, and provider-review tracking.','Members using or discussing GLP-1 medication plans with qualified providers.','GLP-1 education with protein, hydration, digestion, and BodyScan progress.','["Protein checklist","Digestive tracker","Muscle-preservation prompts","BodyScan progress"]'::jsonb,3500,'Included by tier. Extra modules $35/month; 3-module bundle $89/month.',false,false,true,18),
('heart-metabolic-health','Heart & Metabolic Health','Metabolic Health','🫀','Organize cardiovascular and metabolic education around lipids, glucose, movement, sleep, and inflammation.','Members tracking cholesterol, glucose, blood pressure notes, body composition, or prevention goals.','Heart and metabolic education with lipid, glucose, movement, and quarterly reviews.','["Lipid/glucose prompts","Movement checklist","Quarterly review","Progress report"]'::jsonb,3500,'Included by tier. Extra modules $35/month; 3-module bundle $89/month.',false,false,true,19),
('immune-health','Immune Health','Immune Health','🛡️','Track immune-support education, sleep, stress, nutrients, recovery patterns, and provider discussion points.','Members focused on resilience, nutrient status, recovery, and immune-support routines.','Immune health education with nutrient prompts, recovery tracking, and learning center.','["Immune score","Vitamin D/zinc prompts","Recovery checklist","Learning center"]'::jsonb,3500,'Included by tier. Extra modules $35/month; 3-module bundle $89/month.',false,false,true,20),
('detox-liver-support','Detox & Liver Support','Metabolic Health','🍃','Organize liver-support education, hydration, digestion, nutrients, medication/supplement spacing, and lab-review notes.','Members tracking liver enzymes, environmental exposure questions, digestion, or supplement stacks.','Liver-support education with CMP prompts, hydration, fiber, and stack-spacing notes.','["CMP prompts","Hydration/fiber checklist","Stack spacing notes","Provider questions"]'::jsonb,3500,'Included by tier. Extra modules $35/month; 3-module bundle $89/month.',false,false,true,21),
('muscle-building','Muscle Building','Athletic Performance','💪','Track muscle-building education, protein, strength training, recovery, creatine habits, and body-composition progress.','Members focused on strength, lean mass, training consistency, and recovery.','Muscle-building education with training, protein, BodyScan, and milestone reports.','["Training checklist","Protein tracker","BodyScan lean-mass notes","Milestone report"]'::jsonb,3500,'Included by tier. Extra modules $35/month; 3-module bundle $89/month.',false,false,true,22),
('mood-emotional-balance','Mood & Emotional Balance','Brain Performance','🌤️','Organize mood-support education through sleep, stress, nutrients, routines, and provider-safe discussion points.','Members tracking mood patterns, stress, sleep disruption, focus, or lifestyle consistency.','Mood education with daily tracking, sleep/stress prompts, and learning resources.','["Mood tracker","Sleep/stress prompts","Daily support checklist","Learning center"]'::jsonb,3500,'Included by tier. Extra modules $35/month; 3-module bundle $89/month.',false,false,true,23),
('fertility-support','Fertility Support','Women''s Health','🌷','Track fertility-support education, cycle timing, nutrients, lifestyle factors, and provider-review questions.','Members organizing preconception wellness, cycle tracking, lab questions, and partner-support routines.','Fertility-support education with cycle tracking, nutrient prompts, and provider questions.','["Cycle tracker","Nutrient prompts","Provider questions","Monthly report"]'::jsonb,3500,'Included by tier. Extra modules $35/month; 3-module bundle $89/month.',false,false,true,24),
('peptide-education','Peptide Education','Longevity','💉','Organize peptide education, vocabulary, safety questions, protocol references, and provider discussion notes.','Members who want safer, organized peptide education before speaking with qualified professionals.','Peptide education with Protocol Vault links, question builder, and safety checklist.','["Peptide learning center","Protocol Vault links","Question builder","Safety checklist"]'::jsonb,3500,'Included by tier. Extra modules $35/month; 3-module bundle $89/month.',false,false,true,25)
on conflict (slug) do update set name=excluded.name, category=excluded.category, icon=excluded.icon, description=excluded.description, best_for=excluded.best_for, marketing_copy=excluded.marketing_copy, features=excluded.features, price_cents=excluded.price_cents, price_teaser=excluded.price_teaser, featured=excluded.featured, coming_soon=excluded.coming_soon, published=excluded.published, sort_order=excluded.sort_order, updated_at=now();

update public.specialty_modules m
set category_id = c.id
from public.module_categories c
where m.category = c.name and m.category_id is null;

insert into public.module_settings (module_id,key,value)
select null,'stripe_price_placeholders','{"STRIPE_EXTRA_MODULE_PRICE_ID":"price_replace_extra_module_35_month","STRIPE_THREE_MODULE_BUNDLE_PRICE_ID":"price_replace_three_module_bundle_89_month"}'::jsonb
where not exists (select 1 from public.module_settings where module_id is null and key='stripe_price_placeholders');

insert into public.module_settings (module_id,key,value)
select null,'score_formula','{"symptoms":0.20,"labs":0.20,"protocol_adherence":0.20,"lifestyle_tasks":0.15,"bodyscan":0.10,"goals":0.15}'::jsonb
where not exists (select 1 from public.module_settings where module_id is null and key='score_formula');

alter table public.module_categories enable row level security;
alter table public.specialty_modules enable row level security;
alter table public.user_specialty_modules enable row level security;
alter table public.module_questions enable row level security;
alter table public.module_answers enable row level security;
alter table public.module_symptoms enable row level security;
alter table public.module_labs enable row level security;
alter table public.module_protocol_templates enable row level security;
alter table public.module_protocol_links enable row level security;
alter table public.module_tasks enable row level security;
alter table public.module_scores enable row level security;
alter table public.module_progress enable row level security;
alter table public.module_resources enable row level security;
alter table public.module_reports enable row level security;
alter table public.module_recommendations enable row level security;
alter table public.module_purchases enable row level security;
alter table public.module_settings enable row level security;
alter table public.module_notifications enable row level security;
alter table public.module_rewards enable row level security;

drop policy if exists "Public can read module categories" on public.module_categories;
drop policy if exists "Public can read published modules" on public.specialty_modules;
drop policy if exists "Public can read active questions" on public.module_questions;
drop policy if exists "Public can read module labs" on public.module_labs;
drop policy if exists "Public can read module protocol templates" on public.module_protocol_templates;
drop policy if exists "Public can read module protocols" on public.module_protocol_links;
drop policy if exists "Public can read active tasks" on public.module_tasks;
drop policy if exists "Public can read active resources" on public.module_resources;
drop policy if exists "Admin can manage module categories" on public.module_categories;
drop policy if exists "Admin can manage modules" on public.specialty_modules;
drop policy if exists "Admin can manage module content" on public.module_questions;
drop policy if exists "Users manage own module access" on public.user_specialty_modules;
drop policy if exists "Users manage own answers" on public.module_answers;
drop policy if exists "Users manage own symptoms" on public.module_symptoms;
drop policy if exists "Users read own scores" on public.module_scores;
drop policy if exists "Users manage own progress" on public.module_progress;
drop policy if exists "Users read own reports" on public.module_reports;
drop policy if exists "Users read own recommendations" on public.module_recommendations;
drop policy if exists "Users read own purchases" on public.module_purchases;
drop policy if exists "Users manage own notifications" on public.module_notifications;

create policy "Public can read module categories" on public.module_categories for select using (true);
create policy "Public can read published modules" on public.specialty_modules for select using (published = true and is_active = true);
create policy "Public can read active questions" on public.module_questions for select using (is_active = true);
create policy "Public can read module labs" on public.module_labs for select using (true);
create policy "Public can read module protocol templates" on public.module_protocol_templates for select using (true);
create policy "Public can read module protocols" on public.module_protocol_links for select using (true);
create policy "Public can read active tasks" on public.module_tasks for select using (is_active = true);
create policy "Public can read active resources" on public.module_resources for select using (is_active = true);

create policy "Admin can manage module categories" on public.module_categories for all using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "Admin can manage modules" on public.specialty_modules for all using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "Admin can manage module content" on public.module_questions for all using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Users manage own module access" on public.user_specialty_modules for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own answers" on public.module_answers for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own symptoms" on public.module_symptoms for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users read own scores" on public.module_scores for select using (auth.uid() = user_id);
create policy "Users manage own progress" on public.module_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users read own reports" on public.module_reports for select using (auth.uid() = user_id);
create policy "Users read own recommendations" on public.module_recommendations for select using (auth.uid() = user_id);
create policy "Users read own purchases" on public.module_purchases for select using (auth.uid() = user_id);
create policy "Users manage own notifications" on public.module_notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
