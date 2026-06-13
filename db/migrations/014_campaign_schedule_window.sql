ALTER TABLE email_campaigns
  ADD COLUMN IF NOT EXISTS start_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS max_recipients INTEGER NOT NULL DEFAULT 100 CHECK (max_recipients BETWEEN 1 AND 1000),
  ADD COLUMN IF NOT EXISTS schedule_timezone TEXT NOT NULL DEFAULT 'America/Bogota',
  ADD COLUMN IF NOT EXISTS send_window_start_minutes INTEGER NOT NULL DEFAULT 555 CHECK (send_window_start_minutes BETWEEN 0 AND 1439),
  ADD COLUMN IF NOT EXISTS send_window_end_minutes INTEGER NOT NULL DEFAULT 705 CHECK (send_window_end_minutes BETWEEN 0 AND 1439);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_start_at ON email_campaigns(start_at);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_end_at ON email_campaigns(end_at);
