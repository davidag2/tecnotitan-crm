UPDATE email_sender_warmups
SET
  stage = 4,
  daily_limit = 100,
  is_active = true,
  last_advanced_at = now(),
  updated_at = now()
WHERE sender_key = 'investors';
