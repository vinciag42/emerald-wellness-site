create type public.marketing_campaign_approval_status as enum ('drafting','internal_review','ceo_review','approved','rejected','scheduled','sent','cancelled');
create table public.marketing_campaign_approvals (
  id uuid primary key default gen_random_uuid(), campaign_name text not null, channel text not null check (channel in ('email','sms','email_and_sms')),
  audience text not null, objective text not null, draft_version text not null, klaviyo_campaign_id text,
  created_by uuid not null default auth.uid() references auth.users(id), created_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id), reviewed_at timestamptz, approval_status public.marketing_campaign_approval_status not null default 'drafting',
  approval_notes text, scheduled_at timestamptz, sent_at timestamptz,
  constraint approval_reviewer_required check (approval_status not in ('approved','rejected') or (reviewed_by is not null and reviewed_at is not null)),
  constraint schedule_requires_approval check (scheduled_at is null or approval_status in ('approved','scheduled','sent'))
);
alter table public.marketing_campaign_approvals enable row level security;
create policy "marketing admins read approvals" on public.marketing_campaign_approvals for select using ((auth.jwt()->'app_metadata'->>'marketing_admin')::boolean is true);
create policy "marketing admins create drafts" on public.marketing_campaign_approvals for insert with check ((auth.jwt()->'app_metadata'->>'marketing_admin')::boolean is true and approval_status in ('drafting','internal_review','ceo_review'));
create policy "marketing admins update non-decision fields" on public.marketing_campaign_approvals for update using ((auth.jwt()->'app_metadata'->>'marketing_admin')::boolean is true) with check ((auth.jwt()->'app_metadata'->>'marketing_admin')::boolean is true);
create or replace function public.guard_campaign_approval() returns trigger language plpgsql security definer set search_path=public as $$ begin
  if new.approval_status in ('approved','rejected') and coalesce((auth.jwt()->'app_metadata'->>'campaign_approver')::boolean,false) is not true then raise exception 'campaign approver role required'; end if;
  if new.approval_status in ('scheduled','sent') and old.approval_status not in ('approved','scheduled') then raise exception 'campaign must be approved first'; end if;
  return new; end $$;
create trigger guard_campaign_approval before update on public.marketing_campaign_approvals for each row execute function public.guard_campaign_approval();
comment on table public.marketing_campaign_approvals is 'Administrative metadata only. Do not store customer data or healthcare information.';
