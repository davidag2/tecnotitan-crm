CREATE TABLE IF NOT EXISTS email_sender_warmups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_key TEXT NOT NULL UNIQUE CHECK (sender_key IN ('consulting', 'investors')),
  domain TEXT NOT NULL,
  stage INTEGER NOT NULL DEFAULT 1 CHECK (stage BETWEEN 1 AND 4),
  daily_limit INTEGER NOT NULL DEFAULT 20 CHECK (daily_limit IN (20, 40, 60, 100)),
  stage_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_advanced_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_sender_warmups_sender_key
  ON email_sender_warmups(sender_key);

INSERT INTO email_sender_warmups (sender_key, domain, stage, daily_limit)
VALUES
  ('consulting', 'tecnotitanconsultoria.com', 1, 20),
  ('investors', 'tecnotitaninvestors.com', 1, 20)
ON CONFLICT (sender_key) DO UPDATE
SET
  domain = EXCLUDED.domain,
  updated_at = NOW();
