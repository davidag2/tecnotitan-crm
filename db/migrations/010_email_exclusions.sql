CREATE TABLE IF NOT EXISTS email_exclusions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL DEFAULT 'manual',
  source TEXT NOT NULL DEFAULT 'crm',
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  note TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_exclusions_email_active ON email_exclusions(email, active);
CREATE INDEX IF NOT EXISTS idx_email_exclusions_reason ON email_exclusions(reason);
