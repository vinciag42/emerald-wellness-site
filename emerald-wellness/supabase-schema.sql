-- ═══════════════════════════════════════════════════════════
-- EMERALD WELLNESS — SUPABASE DATABASE SCHEMA
-- Run this entire file in Supabase → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension (already enabled on Supabase by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── PROFILES TABLE ──────────────────────────────────────────
-- Extends Supabase auth.users with health & plan data
CREATE TABLE IF NOT EXISTS public.profiles (
  id                UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name        TEXT NOT NULL,
  last_name         TEXT,
  email             TEXT NOT NULL UNIQUE,
  plan              TEXT NOT NULL DEFAULT 'silver'
                    CHECK (plan IN ('silver','gold','elite','pro')),
  plan_name         TEXT,
  billing           TEXT NOT NULL DEFAULT 'monthly'
                    CHECK (billing IN ('monthly','annual')),
  trial_ends_at     TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  first_month_price NUMERIC(10,2),
  monthly_price     NUMERIC(10,2),
  status            TEXT NOT NULL DEFAULT 'trial'
                    CHECK (status IN ('trial','active','cancelled','past_due')),
  goals             TEXT[],
  experience_level  TEXT,
  sms_consent       BOOLEAN DEFAULT FALSE,
  marketing_consent BOOLEAN DEFAULT TRUE,
  referral_link     TEXT UNIQUE,
  referred_by       TEXT,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── REFERRALS TABLE ──────────────────────────────────────────
-- Tracks who referred whom and discount status
CREATE TABLE IF NOT EXISTS public.referrals (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  referrer_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_email  TEXT NOT NULL,
  referred_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','signed_up','paid','discount_applied')),
  discount_applied BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  converted_at    TIMESTAMPTZ
);

-- ── HEALTH GOALS TABLE ───────────────────────────────────────
-- Normalized goals per user (for future protocol matching)
CREATE TABLE IF NOT EXISTS public.health_goals (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal       TEXT NOT NULL,
  priority   INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── WAITLIST TABLE ────────────────────────────────────────────
-- For homepage waitlist signups (pre-account)
CREATE TABLE IF NOT EXISTS public.waitlist (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email        TEXT NOT NULL UNIQUE,
  first_name   TEXT,
  source       TEXT DEFAULT 'website',
  referral_link TEXT UNIQUE DEFAULT ('emeraldwellness.health/ref/WL' || upper(substring(md5(random()::text) from 1 for 6))),
  referred_by  TEXT,
  converted    BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── EMAIL LOG TABLE ───────────────────────────────────────────
-- Tracks every automated email/SMS sent
CREATE TABLE IF NOT EXISTS public.email_log (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  email      TEXT NOT NULL,
  type       TEXT NOT NULL, -- 'welcome', 'trial_ending', 'payment_failed', etc.
  channel    TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email','sms')),
  status     TEXT NOT NULL DEFAULT 'sent',
  sent_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) — users can only see their own data
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_log    ENABLE ROW LEVEL SECURITY;

-- Profiles: users read/update own row only
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Service role can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- Health goals: users read/write own goals
CREATE POLICY "Users can manage own goals"
  ON public.health_goals FOR ALL
  USING (auth.uid() = user_id);

-- Referrals: users can see referrals they made
CREATE POLICY "Users can view own referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id);

-- Waitlist: anyone can insert, service role reads all
CREATE POLICY "Anyone can join waitlist"
  ON public.waitlist FOR INSERT
  WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- FUNCTIONS & TRIGGERS
-- ═══════════════════════════════════════════════════════════

-- Auto-update updated_at on profiles
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-generate referral link on profile insert
CREATE OR REPLACE FUNCTION public.generate_referral_link()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_link IS NULL THEN
    NEW.referral_link := 'emeraldwellness.health/ref/EW' || upper(substring(md5(NEW.id::text) from 1 for 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_insert_referral
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.generate_referral_link();

-- Track referral activity for analytics only. No automatic referral discount is applied.
CREATE OR REPLACE FUNCTION public.check_referral_milestone()
RETURNS TRIGGER AS $$
DECLARE
  paid_count INTEGER;
BEGIN
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    SELECT COUNT(*) INTO paid_count
    FROM public.referrals
    WHERE referrer_id = NEW.referrer_id AND status = 'paid';

    UPDATE public.profiles
    SET updated_at = NOW()
    WHERE id = NEW.referrer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_referral_paid
  AFTER UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.check_referral_milestone();

-- ═══════════════════════════════════════════════════════════
-- INDEXES for performance
-- ═══════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_profiles_email        ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_plan         ON public.profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_status       ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer    ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_email       ON public.referrals(referred_email);
CREATE INDEX IF NOT EXISTS idx_waitlist_email        ON public.waitlist(email);
CREATE INDEX IF NOT EXISTS idx_health_goals_user     ON public.health_goals(user_id);

-- ═══════════════════════════════════════════════════════════
-- SEED: Plan pricing reference table
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.plans (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  monthly_price   NUMERIC(10,2) NOT NULL,
  annual_price    NUMERIC(10,2) NOT NULL,
  first_month     NUMERIC(10,2) NOT NULL,
  stripe_price_monthly TEXT,
  stripe_price_annual  TEXT
);

INSERT INTO public.plans (id, name, monthly_price, annual_price, first_month)
VALUES
  ('silver', 'Silver',          74.99,  59.99,  59.99),
  ('gold',   'Gold',           149.99, 119.99, 119.99),
  ('elite',  'Emerald Elite',  199.99, 159.99, 159.99),
  ('pro',    'Pro Practitioner', 299.99, 239.99, 239.99)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- DONE — Schema created successfully
-- Next step: Add your Supabase URL and anon key to signup.html
-- ═══════════════════════════════════════════════════════════
