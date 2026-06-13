CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE,
  provider TEXT NOT NULL DEFAULT 'resend',
  event_type TEXT NOT NULL,
  provider_message_id TEXT,
  message_id UUID REFERENCES email_messages(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES email_campaign_recipients(id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  email TEXT,
  url TEXT,
  raw_payload JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE email_messages
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS complained_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suppressed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_event_type TEXT,
  ADD COLUMN IF NOT EXISTS last_event_at TIMESTAMPTZ;

ALTER TABLE email_campaign_recipients
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS complained_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suppressed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_event_type TEXT,
  ADD COLUMN IF NOT EXISTS last_event_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_email_events_provider_message_id ON email_events(provider_message_id);
CREATE INDEX IF NOT EXISTS idx_email_events_campaign_id ON email_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_events_recipient_id ON email_events(recipient_id);
CREATE INDEX IF NOT EXISTS idx_email_events_event_type ON email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_occurred_at ON email_events(occurred_at DESC);
