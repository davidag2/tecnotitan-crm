alter table public.email_campaigns
  add column if not exists segment_key text,
  add column if not exists segment_label text,
  add column if not exists search_templates jsonb not null default '[]'::jsonb;

create index if not exists idx_email_campaigns_segment_key
  on public.email_campaigns(segment_key);
