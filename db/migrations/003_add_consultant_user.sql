INSERT INTO users (name, email, role)
VALUES
  ('David Arias', 'david@tecnotitan.com', 'admin'),
  ('Consultor Tecnotitan', 'consultor@tecnotitan.com', 'sales')
ON CONFLICT (email) DO UPDATE
SET name = EXCLUDED.name,
    role = EXCLUDED.role,
    is_active = TRUE,
    updated_at = now();
