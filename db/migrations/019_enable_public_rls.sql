-- Enable Row Level Security on all CRM tables in the exposed public schema.
-- The application accesses data through Vercel API routes using the Supabase
-- service role key, so no broad anon/authenticated policies are created here.

alter table if exists public.activities enable row level security;
alter table if exists public.apollo_sync_logs enable row level security;
alter table if exists public.companies enable row level security;
alter table if exists public.contact_tags enable row level security;
alter table if exists public.contacts enable row level security;
alter table if exists public.email_campaign_recipients enable row level security;
alter table if exists public.email_campaigns enable row level security;
alter table if exists public.email_events enable row level security;
alter table if exists public.email_exclusions enable row level security;
alter table if exists public.email_messages enable row level security;
alter table if exists public.email_sender_warmups enable row level security;
alter table if exists public.email_threads enable row level security;
alter table if exists public.lead_search_results enable row level security;
alter table if exists public.lead_searches enable row level security;
alter table if exists public.notes enable row level security;
alter table if exists public.opportunities enable row level security;
alter table if exists public.pipeline_events enable row level security;
alter table if exists public.tags enable row level security;
alter table if exists public.users enable row level security;
