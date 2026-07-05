-- Emerald Wellness Specialty Module entitlement/profile fields
-- Safe to run more than once in Supabase SQL Editor.

alter table public.profiles
  add column if not exists selected_modules text[] default '{}',
  add column if not exists included_module_count integer,
  add column if not exists unlimited_modules boolean not null default false,
  add column if not exists billable_module_count integer not null default 0,
  add column if not exists module_add_on_price_monthly numeric(10,2) not null default 49.99,
  add column if not exists module_add_on_monthly_total numeric(10,2) not null default 0,
  add column if not exists plan_key text,
  add column if not exists first_month_discount_percent integer,
  add column if not exists first_month_discount_coupon text,
  add column if not exists first_month_discount_applied boolean not null default false;

create index if not exists idx_profiles_plan_key on public.profiles(plan_key);

comment on column public.profiles.selected_modules is 'Selected Specialty Module keys for the member.';
comment on column public.profiles.included_module_count is 'Included Specialty Modules for the current plan. Null means unlimited.';
comment on column public.profiles.unlimited_modules is 'True when the plan includes unlimited Specialty Modules.';
comment on column public.profiles.billable_module_count is 'Number of selected modules billed as $49.99/month add-ons.';
comment on column public.profiles.module_add_on_price_monthly is 'Monthly price for each billable Specialty Module add-on.';
comment on column public.profiles.module_add_on_monthly_total is 'Calculated monthly module add-on total.';
comment on column public.profiles.plan_key is 'Normalized plan key used for module entitlement calculations.';
comment on column public.profiles.first_month_discount_percent is 'First paid subscription month discount percent, currently 20 when eligible.';
comment on column public.profiles.first_month_discount_coupon is 'Stripe coupon id used for the first paid subscription month discount.';
comment on column public.profiles.first_month_discount_applied is 'True when the webhook has attached the once-only first-month discount to the subscription.';
