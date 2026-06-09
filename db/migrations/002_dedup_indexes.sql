WITH ranked_companies AS (
  SELECT
    id,
    first_value(id) OVER (
      PARTITION BY lower(trim(name)), coalesce(lower(trim(country)), '')
      ORDER BY created_at, id
    ) AS canonical_id,
    row_number() OVER (
      PARTITION BY lower(trim(name)), coalesce(lower(trim(country)), '')
      ORDER BY created_at, id
    ) AS row_number
  FROM companies
  WHERE deleted_at IS NULL
    AND nullif(trim(name), '') IS NOT NULL
    AND nullif(trim(domain), '') IS NULL
    AND nullif(trim(coalesce(apollo_organization_id, '')), '') IS NULL
)
UPDATE contacts
SET company_id = ranked_companies.canonical_id,
    updated_at = now()
FROM ranked_companies
WHERE contacts.company_id = ranked_companies.id
  AND ranked_companies.row_number > 1;

WITH ranked_companies AS (
  SELECT
    id,
    first_value(id) OVER (
      PARTITION BY lower(trim(name)), coalesce(lower(trim(country)), '')
      ORDER BY created_at, id
    ) AS canonical_id,
    row_number() OVER (
      PARTITION BY lower(trim(name)), coalesce(lower(trim(country)), '')
      ORDER BY created_at, id
    ) AS row_number
  FROM companies
  WHERE deleted_at IS NULL
    AND nullif(trim(name), '') IS NOT NULL
    AND nullif(trim(domain), '') IS NULL
    AND nullif(trim(coalesce(apollo_organization_id, '')), '') IS NULL
)
UPDATE opportunities
SET company_id = ranked_companies.canonical_id,
    updated_at = now()
FROM ranked_companies
WHERE opportunities.company_id = ranked_companies.id
  AND ranked_companies.row_number > 1;

WITH ranked_companies AS (
  SELECT
    id,
    first_value(id) OVER (
      PARTITION BY lower(trim(name)), coalesce(lower(trim(country)), '')
      ORDER BY created_at, id
    ) AS canonical_id,
    row_number() OVER (
      PARTITION BY lower(trim(name)), coalesce(lower(trim(country)), '')
      ORDER BY created_at, id
    ) AS row_number
  FROM companies
  WHERE deleted_at IS NULL
    AND nullif(trim(name), '') IS NOT NULL
    AND nullif(trim(domain), '') IS NULL
    AND nullif(trim(coalesce(apollo_organization_id, '')), '') IS NULL
)
UPDATE lead_search_results
SET company_id = ranked_companies.canonical_id
FROM ranked_companies
WHERE lead_search_results.company_id = ranked_companies.id
  AND ranked_companies.row_number > 1;

WITH ranked_companies AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY lower(trim(name)), coalesce(lower(trim(country)), '')
      ORDER BY created_at, id
    ) AS row_number
  FROM companies
  WHERE deleted_at IS NULL
    AND nullif(trim(name), '') IS NOT NULL
    AND nullif(trim(domain), '') IS NULL
    AND nullif(trim(coalesce(apollo_organization_id, '')), '') IS NULL
)
UPDATE companies
SET deleted_at = now(),
    updated_at = now()
FROM ranked_companies
WHERE companies.id = ranked_companies.id
  AND ranked_companies.row_number > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_companies_domain_active
ON companies (lower(trim(domain)))
WHERE deleted_at IS NULL
  AND nullif(trim(domain), '') IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_companies_name_country_without_domain_active
ON companies (lower(trim(name)), coalesce(lower(trim(country)), ''))
WHERE deleted_at IS NULL
  AND nullif(trim(domain), '') IS NULL
  AND nullif(trim(coalesce(apollo_organization_id, '')), '') IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_contacts_email_active
ON contacts (lower(trim(email)))
WHERE deleted_at IS NULL
  AND nullif(trim(email), '') IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_contacts_linkedin_active
ON contacts (lower(trim(linkedin_url)))
WHERE deleted_at IS NULL
  AND nullif(trim(linkedin_url), '') IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_contacts_name_company_without_external_ids_active
ON contacts (lower(trim(full_name)), company_id)
WHERE deleted_at IS NULL
  AND nullif(trim(full_name), '') IS NOT NULL
  AND company_id IS NOT NULL
  AND nullif(trim(coalesce(apollo_person_id, '')), '') IS NULL
  AND nullif(trim(coalesce(email, '')), '') IS NULL
  AND nullif(trim(coalesce(linkedin_url, '')), '') IS NULL;
