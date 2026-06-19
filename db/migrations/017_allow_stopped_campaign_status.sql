alter table public.email_campaigns drop constraint if exists email_campaigns_status_check;

alter table public.email_campaigns
  add constraint email_campaigns_status_check
  check (status = any (array['draft'::text, 'active'::text, 'paused'::text, 'stopped'::text, 'completed'::text]));
