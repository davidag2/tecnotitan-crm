ALTER TABLE email_campaigns
  ADD COLUMN IF NOT EXISTS reputation_checks_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS reputation_last_checked_at TIMESTAMPTZ;

ALTER TABLE email_campaign_recipients
  ADD COLUMN IF NOT EXISTS reputation_status TEXT NOT NULL DEFAULT 'pending' CHECK (reputation_status IN ('pending', 'passed', 'blocked')),
  ADD COLUMN IF NOT EXISTS reputation_issues TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS message_fingerprint TEXT;

CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_reputation_status
  ON email_campaign_recipients(reputation_status);

CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_message_fingerprint
  ON email_campaign_recipients(message_fingerprint);
