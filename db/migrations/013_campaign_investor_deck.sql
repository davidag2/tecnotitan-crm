ALTER TABLE email_campaigns
  ADD COLUMN IF NOT EXISTS attach_investor_deck BOOLEAN NOT NULL DEFAULT false;
