create table if not exists public.origami_job_searches (
  id uuid primary key default gen_random_uuid(),
  target_person text not null default 'Oscar',
  target_role text not null,
  target_locations text,
  target_keywords text,
  seniority text,
  candidate_profile text,
  notes text,
  status text not null default 'running',
  agent_id text,
  run_id text,
  table_id text,
  result_summary jsonb not null default '{}'::jsonb,
  opportunities jsonb not null default '[]'::jsonb,
  message_templates jsonb not null default '{}'::jsonb,
  raw_response text,
  error text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.origami_job_searches enable row level security;
