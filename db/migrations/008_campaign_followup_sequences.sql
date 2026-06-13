ALTER TABLE email_campaigns
  ADD COLUMN IF NOT EXISTS followup_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS followup_delays_days INTEGER[] NOT NULL DEFAULT ARRAY[3,7,14],
  ADD COLUMN IF NOT EXISTS followup_subject_template TEXT NOT NULL DEFAULT 'Re: {{empresa}}',
  ADD COLUMN IF NOT EXISTS followup_body_template TEXT NOT NULL DEFAULT 'Hola {{primer_nombre}},

Te escribo para hacer seguimiento a mi mensaje anterior.

Si este tema no es prioridad ahora, lo entiendo. Si tiene sentido revisarlo, puedo enviarte una idea concreta para {{empresa}}.

Saludos,
David Arias
Fundador, Tecnotitan';

ALTER TABLE email_campaign_recipients
  ADD COLUMN IF NOT EXISTS reply_received_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS followup_step INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_followup_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_followup_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_next_followup_at
  ON email_campaign_recipients(next_followup_at)
  WHERE reply_received_at IS NULL;
