CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE lead_type AS ENUM ('consulting_client', 'investor');
CREATE TYPE target_region AS ENUM ('latam', 'usa', 'europe');
CREATE TYPE lead_source AS ENUM ('apollo', 'manual', 'csv_import', 'referral', 'website', 'linkedin', 'other');
CREATE TYPE score_label AS ENUM ('hot', 'warm', 'cold', 'unqualified');
CREATE TYPE apollo_enrichment_status AS ENUM ('not_requested', 'requested', 'enriched', 'failed', 'not_available');
CREATE TYPE search_status AS ENUM ('draft', 'running', 'completed', 'failed', 'cancelled');
CREATE TYPE user_role AS ENUM ('admin', 'sales', 'fundraising', 'viewer');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'viewer',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apollo_organization_id TEXT UNIQUE,
  name TEXT NOT NULL,
  domain TEXT,
  website_url TEXT,
  linkedin_url TEXT,
  industry TEXT,
  country TEXT,
  city TEXT,
  state TEXT,
  employee_count INTEGER,
  employee_range TEXT,
  annual_revenue NUMERIC,
  phone TEXT,
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  apollo_person_id TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  title TEXT,
  seniority TEXT,
  email TEXT,
  email_status TEXT,
  phone TEXT,
  mobile_phone TEXT,
  linkedin_url TEXT,
  photo_url TEXT,
  country TEXT,
  city TEXT,
  state TEXT,
  lead_source lead_source NOT NULL DEFAULT 'apollo',
  apollo_raw_payload JSONB,
  apollo_last_synced_at TIMESTAMPTZ,
  apollo_enriched_at TIMESTAMPTZ,
  apollo_enrichment_status apollo_enrichment_status NOT NULL DEFAULT 'not_requested',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  lead_type lead_type NOT NULL,
  target_region target_region NOT NULL,
  pipeline_status TEXT NOT NULL,
  owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  score INTEGER NOT NULL DEFAULT 0,
  score_label score_label NOT NULL DEFAULT 'unqualified',
  score_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  service_interest TEXT,
  consulting_need TEXT,
  estimated_deal_value NUMERIC,
  expected_close_date DATE,
  investor_type TEXT,
  investment_stage TEXT,
  investment_thesis TEXT,
  commitment_amount NUMERIC,
  commitment_currency TEXT,
  intro_source TEXT,
  last_activity_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  next_follow_up_type TEXT,
  lost_reason TEXT,
  discard_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (contact_id, lead_type, target_region)
);

CREATE TABLE lead_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  lead_type lead_type NOT NULL,
  target_region target_region NOT NULL,
  search_template TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  status search_status NOT NULL DEFAULT 'draft',
  total_entries INTEGER,
  pages_requested INTEGER NOT NULL DEFAULT 0,
  results_saved INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE lead_search_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_search_id UUID NOT NULL REFERENCES lead_searches(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  apollo_person_id TEXT,
  apollo_organization_id TEXT,
  page INTEGER,
  position INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lead_search_id, apollo_person_id)
);

CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE contact_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (contact_id, tag_id)
);

CREATE TABLE apollo_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_payload JSONB,
  response_status INTEGER,
  response_payload JSONB,
  error_message TEXT,
  credits_used INTEGER,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  lead_search_id UUID REFERENCES lead_searches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pipeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note TEXT
);

CREATE INDEX idx_companies_domain ON companies(domain);
CREATE INDEX idx_companies_country ON companies(country);
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_linkedin_url ON contacts(linkedin_url);
CREATE INDEX idx_contacts_company_id ON contacts(company_id);
CREATE INDEX idx_contacts_country ON contacts(country);
CREATE INDEX idx_opportunities_lead_type ON opportunities(lead_type);
CREATE INDEX idx_opportunities_pipeline_status ON opportunities(pipeline_status);
CREATE INDEX idx_opportunities_target_region ON opportunities(target_region);
CREATE INDEX idx_opportunities_owner_user_id ON opportunities(owner_user_id);
CREATE INDEX idx_opportunities_score ON opportunities(score DESC);
CREATE INDEX idx_opportunities_next_follow_up_at ON opportunities(next_follow_up_at);
CREATE INDEX idx_lead_searches_lead_type ON lead_searches(lead_type);
CREATE INDEX idx_lead_searches_status ON lead_searches(status);
CREATE INDEX idx_activities_opportunity_id ON activities(opportunity_id);
CREATE INDEX idx_notes_opportunity_id ON notes(opportunity_id);
CREATE INDEX idx_apollo_sync_logs_operation ON apollo_sync_logs(operation);
CREATE INDEX idx_pipeline_events_opportunity_id ON pipeline_events(opportunity_id);

INSERT INTO users (name, email, role)
VALUES ('Tecnotitan Admin', 'admin@tecnotitan.com', 'admin')
ON CONFLICT (email) DO NOTHING;
