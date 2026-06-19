create table if not exists public.origami_people_searches (
  id uuid primary key default gen_random_uuid(),
  query_name text not null,
  query_company text,
  query_linkedin_url text,
  query_notes text,
  search_purpose text not null default 'lead_research',
  status text not null default 'running',
  agent_id text,
  run_id text,
  table_id text,
  result_profile jsonb not null default '{}'::jsonb,
  email_draft jsonb not null default '{}'::jsonb,
  raw_response text,
  error text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.origami_people_searches enable row level security;
