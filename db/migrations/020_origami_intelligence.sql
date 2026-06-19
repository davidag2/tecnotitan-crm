alter table public.opportunities
  add column if not exists origami_status text not null default 'not_requested',
  add column if not exists origami_agent_id text,
  add column if not exists origami_run_id text,
  add column if not exists origami_table_id text,
  add column if not exists origami_profile jsonb not null default '{}'::jsonb,
  add column if not exists origami_email_draft jsonb not null default '{}'::jsonb,
  add column if not exists origami_analyzed_at timestamptz,
  add column if not exists origami_error text;
