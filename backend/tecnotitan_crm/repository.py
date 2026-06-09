import json
from typing import Any

from .db import query_json
from .scoring import score_lead


def create_lead_search(
    name: str,
    lead_type: str,
    target_region: str,
    search_template: str,
    filters: dict[str, Any],
    total_entries: int | None,
    page: int,
) -> str:
    return query_json(
        """
        INSERT INTO lead_searches (
          name,
          lead_type,
          target_region,
          search_template,
          filters,
          status,
          total_entries,
          pages_requested
        )
        VALUES (
          :'name',
          :'lead_type'::lead_type,
          :'target_region'::target_region,
          :'search_template',
          :'filters'::jsonb,
          'completed',
          NULLIF(:'total_entries', '')::integer,
          :'page'::integer
        )
        RETURNING to_json(id);
        """,
        {
            "name": name,
            "lead_type": lead_type,
            "target_region": target_region,
            "search_template": search_template,
            "filters": filters,
            "total_entries": total_entries,
            "page": page,
        },
    )


def save_people_from_apollo(
    people: list[dict[str, Any]],
    lead_type: str,
    target_region: str,
    lead_search_id: str,
    page: int,
) -> list[dict[str, Any]]:
    saved: list[dict[str, Any]] = []

    for position, person in enumerate(people, start=1):
        saved.append(
            upsert_person_opportunity(
                person=person,
                lead_type=lead_type,
                target_region=target_region,
                lead_search_id=lead_search_id,
                page=page,
                position=position,
            )
        )

    query_json(
        """
        UPDATE lead_searches
        SET results_saved = :'results_saved'::integer,
            updated_at = now()
        WHERE id = :'lead_search_id'::uuid
        RETURNING to_json(id);
        """,
        {"results_saved": len(saved), "lead_search_id": lead_search_id},
    )
    return saved


def upsert_person_opportunity(
    person: dict[str, Any],
    lead_type: str,
    target_region: str,
    lead_search_id: str,
    page: int,
    position: int,
) -> dict[str, Any]:
    organization = person.get("organization") or {}
    first_name = person.get("first_name")
    last_name = person.get("last_name") or person.get("last_name_obfuscated")
    full_name = " ".join(value for value in [first_name, last_name] if value)
    country = person.get("country") or organization.get("country")
    scoring = score_lead(lead_type, person.get("title"), country, person.get("linkedin_url"), organization)
    pipeline_status = "new" if lead_type == "consulting_client" else "identified"

    company_id = upsert_company(organization)
    contact_id = upsert_contact(person, company_id, first_name, last_name, full_name)
    opportunity_id = upsert_opportunity(
        contact_id=contact_id,
        company_id=company_id,
        lead_type=lead_type,
        target_region=target_region,
        pipeline_status=pipeline_status,
        scoring=scoring,
    )
    insert_search_result(
        lead_search_id=lead_search_id,
        contact_id=contact_id,
        company_id=company_id,
        opportunity_id=opportunity_id,
        apollo_person_id=person.get("id"),
        apollo_organization_id=organization.get("id"),
        page=page,
        position=position,
    )

    return {
        "contact_id": contact_id,
        "company_id": company_id,
        "opportunity_id": opportunity_id,
        "apollo_person_id": person.get("id"),
        "full_name": full_name,
        "title": person.get("title"),
        "company_name": organization.get("name"),
        "lead_type": lead_type,
        "target_region": target_region,
        "pipeline_status": pipeline_status,
        "score": scoring["score"],
        "score_label": scoring["score_label"],
        "score_reasons": scoring["score_reasons"],
    }


def upsert_company(organization: dict[str, Any]) -> str:
    company_domain = organization.get("primary_domain") or organization.get("website_url")

    return query_json(
        """
        WITH existing AS (
          SELECT id
          FROM companies
          WHERE deleted_at IS NULL
            AND (
              (
                NULLIF(:'apollo_organization_id', '') IS NOT NULL
                AND apollo_organization_id = NULLIF(:'apollo_organization_id', '')
              )
              OR (
                NULLIF(:'company_domain', '') IS NOT NULL
                AND lower(trim(domain)) = lower(trim(NULLIF(:'company_domain', '')))
              )
              OR (
                NULLIF(:'company_domain', '') IS NULL
                AND NULLIF(:'company_name', '') IS NOT NULL
                AND lower(trim(name)) = lower(trim(NULLIF(:'company_name', '')))
                AND coalesce(lower(trim(country)), '') = coalesce(lower(trim(NULLIF(:'company_country', ''))), '')
              )
            )
          ORDER BY
            CASE
              WHEN apollo_organization_id = NULLIF(:'apollo_organization_id', '') THEN 1
              WHEN lower(trim(domain)) = lower(trim(NULLIF(:'company_domain', ''))) THEN 2
              ELSE 3
            END,
            created_at
          LIMIT 1
        ),
        updated AS (
          UPDATE companies
          SET
            apollo_organization_id = COALESCE(companies.apollo_organization_id, NULLIF(:'apollo_organization_id', '')),
            name = COALESCE(NULLIF(:'company_name', ''), companies.name),
            domain = COALESCE(NULLIF(:'company_domain', ''), companies.domain),
            website_url = COALESCE(NULLIF(:'company_website_url', ''), companies.website_url),
            linkedin_url = COALESCE(NULLIF(:'company_linkedin_url', ''), companies.linkedin_url),
            industry = COALESCE(NULLIF(:'company_industry', ''), companies.industry),
            country = COALESCE(NULLIF(:'company_country', ''), companies.country),
            city = COALESCE(NULLIF(:'company_city', ''), companies.city),
            state = COALESCE(NULLIF(:'company_state', ''), companies.state),
            employee_count = COALESCE(NULLIF(:'company_employee_count', '')::integer, companies.employee_count),
            employee_range = COALESCE(NULLIF(:'company_employee_range', ''), companies.employee_range),
            phone = COALESCE(NULLIF(:'company_phone', ''), companies.phone),
            raw_payload = :'organization_payload'::jsonb,
            updated_at = now()
          WHERE id = (SELECT id FROM existing)
          RETURNING id
        ),
        inserted AS (
          INSERT INTO companies (
            apollo_organization_id, name, domain, website_url, linkedin_url, industry,
            country, city, state, employee_count, employee_range, phone, raw_payload, updated_at
          )
          SELECT
            NULLIF(:'apollo_organization_id', ''),
            COALESCE(NULLIF(:'company_name', ''), 'Unknown company'),
            NULLIF(:'company_domain', ''),
            NULLIF(:'company_website_url', ''),
            NULLIF(:'company_linkedin_url', ''),
            NULLIF(:'company_industry', ''),
            NULLIF(:'company_country', ''),
            NULLIF(:'company_city', ''),
            NULLIF(:'company_state', ''),
            NULLIF(:'company_employee_count', '')::integer,
            NULLIF(:'company_employee_range', ''),
            NULLIF(:'company_phone', ''),
            :'organization_payload'::jsonb,
            now()
          WHERE NOT EXISTS (SELECT 1 FROM updated)
          RETURNING id
        )
        SELECT to_json(id) FROM updated
        UNION ALL
        SELECT to_json(id) FROM inserted
        LIMIT 1;
        """,
        {
            "apollo_organization_id": organization.get("id"),
            "company_name": organization.get("name"),
            "company_domain": company_domain,
            "company_website_url": organization.get("website_url"),
            "company_linkedin_url": organization.get("linkedin_url"),
            "company_industry": organization.get("industry"),
            "company_country": organization.get("country"),
            "company_city": organization.get("city"),
            "company_state": organization.get("state"),
            "company_employee_count": organization.get("estimated_num_employees"),
            "company_employee_range": organization.get("estimated_num_employees"),
            "company_phone": organization.get("phone"),
            "organization_payload": organization,
        },
    )


def upsert_contact(
    person: dict[str, Any],
    company_id: str,
    first_name: str | None,
    last_name: str | None,
    full_name: str,
) -> str:
    return query_json(
        """
        WITH existing AS (
          SELECT id
          FROM contacts
          WHERE deleted_at IS NULL
            AND (
              (
                NULLIF(:'apollo_person_id', '') IS NOT NULL
                AND apollo_person_id = NULLIF(:'apollo_person_id', '')
              )
              OR (
                NULLIF(:'email', '') IS NOT NULL
                AND lower(trim(email)) = lower(trim(NULLIF(:'email', '')))
              )
              OR (
                NULLIF(:'linkedin_url', '') IS NOT NULL
                AND lower(trim(linkedin_url)) = lower(trim(NULLIF(:'linkedin_url', '')))
              )
              OR (
                NULLIF(:'apollo_person_id', '') IS NULL
                AND NULLIF(:'email', '') IS NULL
                AND NULLIF(:'linkedin_url', '') IS NULL
                AND NULLIF(:'full_name', '') IS NOT NULL
                AND company_id = :'company_id'::uuid
                AND lower(trim(full_name)) = lower(trim(NULLIF(:'full_name', '')))
              )
            )
          ORDER BY
            CASE
              WHEN apollo_person_id = NULLIF(:'apollo_person_id', '') THEN 1
              WHEN lower(trim(email)) = lower(trim(NULLIF(:'email', ''))) THEN 2
              WHEN lower(trim(linkedin_url)) = lower(trim(NULLIF(:'linkedin_url', ''))) THEN 3
              ELSE 4
            END,
            created_at
          LIMIT 1
        ),
        updated AS (
          UPDATE contacts
          SET
            company_id = COALESCE(contacts.company_id, :'company_id'::uuid),
            apollo_person_id = COALESCE(contacts.apollo_person_id, NULLIF(:'apollo_person_id', '')),
            first_name = COALESCE(NULLIF(:'first_name', ''), contacts.first_name),
            last_name = COALESCE(NULLIF(:'last_name', ''), contacts.last_name),
            full_name = COALESCE(NULLIF(:'full_name', ''), contacts.full_name),
            title = COALESCE(NULLIF(:'title', ''), contacts.title),
            seniority = COALESCE(NULLIF(:'seniority', ''), contacts.seniority),
            email = COALESCE(NULLIF(:'email', ''), contacts.email),
            email_status = COALESCE(NULLIF(:'email_status', ''), contacts.email_status),
            phone = COALESCE(NULLIF(:'phone', ''), contacts.phone),
            linkedin_url = COALESCE(NULLIF(:'linkedin_url', ''), contacts.linkedin_url),
            photo_url = COALESCE(NULLIF(:'photo_url', ''), contacts.photo_url),
            country = COALESCE(NULLIF(:'person_country', ''), contacts.country),
            city = COALESCE(NULLIF(:'person_city', ''), contacts.city),
            state = COALESCE(NULLIF(:'person_state', ''), contacts.state),
            apollo_raw_payload = :'person_payload'::jsonb,
            apollo_last_synced_at = now(),
            updated_at = now()
          WHERE id = (SELECT id FROM existing)
          RETURNING id
        ),
        inserted AS (
          INSERT INTO contacts (
            company_id, apollo_person_id, first_name, last_name, full_name, title,
            seniority, email, email_status, phone, linkedin_url, photo_url,
            country, city, state, lead_source, apollo_raw_payload,
            apollo_last_synced_at, updated_at
          )
          SELECT
            :'company_id'::uuid,
            NULLIF(:'apollo_person_id', ''),
            NULLIF(:'first_name', ''),
            NULLIF(:'last_name', ''),
            NULLIF(:'full_name', ''),
            NULLIF(:'title', ''),
            NULLIF(:'seniority', ''),
            NULLIF(:'email', ''),
            NULLIF(:'email_status', ''),
            NULLIF(:'phone', ''),
            NULLIF(:'linkedin_url', ''),
            NULLIF(:'photo_url', ''),
            NULLIF(:'person_country', ''),
            NULLIF(:'person_city', ''),
            NULLIF(:'person_state', ''),
            'apollo',
            :'person_payload'::jsonb,
            now(),
            now()
          WHERE NOT EXISTS (SELECT 1 FROM updated)
          RETURNING id
        )
        SELECT to_json(id) FROM updated
        UNION ALL
        SELECT to_json(id) FROM inserted
        LIMIT 1;
        """,
        {
            "company_id": company_id,
            "apollo_person_id": person.get("id"),
            "first_name": first_name,
            "last_name": last_name,
            "full_name": full_name,
            "title": person.get("title"),
            "seniority": person.get("seniority"),
            "email": person.get("email"),
            "email_status": person.get("email_status"),
            "phone": json.dumps(person.get("phone_numbers") or [], ensure_ascii=False),
            "linkedin_url": person.get("linkedin_url"),
            "photo_url": person.get("photo_url"),
            "person_country": person.get("country"),
            "person_city": person.get("city"),
            "person_state": person.get("state"),
            "person_payload": person,
        },
    )


def upsert_opportunity(
    contact_id: str,
    company_id: str,
    lead_type: str,
    target_region: str,
    pipeline_status: str,
    scoring: dict[str, object],
) -> str:
    return query_json(
        """
        INSERT INTO opportunities (
          contact_id,
          company_id,
          lead_type,
          target_region,
          pipeline_status,
          score,
          score_label,
          score_reasons,
          updated_at
        )
        VALUES (
          :'contact_id'::uuid,
          :'company_id'::uuid,
          :'lead_type'::lead_type,
          :'target_region'::target_region,
          :'pipeline_status',
          :'score'::integer,
          :'score_label'::score_label,
          :'score_reasons'::jsonb,
          now()
        )
        ON CONFLICT (contact_id, lead_type, target_region)
        DO UPDATE SET
          company_id = COALESCE(EXCLUDED.company_id, opportunities.company_id),
          score = GREATEST(opportunities.score, EXCLUDED.score),
          score_label = EXCLUDED.score_label,
          score_reasons = EXCLUDED.score_reasons,
          updated_at = now()
        RETURNING to_json(id);
        """,
        {
            "contact_id": contact_id,
            "company_id": company_id,
            "lead_type": lead_type,
            "target_region": target_region,
            "pipeline_status": pipeline_status,
            "score": scoring["score"],
            "score_label": scoring["score_label"],
            "score_reasons": scoring["score_reasons"],
        },
    )


def insert_search_result(
    lead_search_id: str,
    contact_id: str,
    company_id: str,
    opportunity_id: str,
    apollo_person_id: str | None,
    apollo_organization_id: str | None,
    page: int,
    position: int,
) -> None:
    query_json(
        """
        INSERT INTO lead_search_results (
          lead_search_id,
          contact_id,
          company_id,
          opportunity_id,
          apollo_person_id,
          apollo_organization_id,
          page,
          position
        )
        VALUES (
          :'lead_search_id'::uuid,
          :'contact_id'::uuid,
          :'company_id'::uuid,
          :'opportunity_id'::uuid,
          NULLIF(:'apollo_person_id', ''),
          NULLIF(:'apollo_organization_id', ''),
          :'page'::integer,
          :'position'::integer
        )
        ON CONFLICT (lead_search_id, apollo_person_id) DO NOTHING
        RETURNING to_json(id);
        """,
        {
            "lead_search_id": lead_search_id,
            "contact_id": contact_id,
            "company_id": company_id,
            "opportunity_id": opportunity_id,
            "apollo_person_id": apollo_person_id,
            "apollo_organization_id": apollo_organization_id,
            "page": page,
            "position": position,
        },
    )


def list_recent_leads(limit: int = 50) -> list[dict[str, Any]]:
    return query_json(
        """
        SELECT COALESCE(json_agg(row_to_json(rows)), '[]'::json)
        FROM (
          SELECT
            contacts.id AS contact_id,
            companies.id AS company_id,
            opportunities.id AS opportunity_id,
            contacts.full_name,
            contacts.title,
            companies.name AS company_name,
            contacts.country AS person_country,
            companies.country AS company_country,
            opportunities.lead_type,
            opportunities.target_region,
            opportunities.pipeline_status,
            opportunities.score,
            opportunities.score_label,
            opportunities.score_reasons,
            opportunities.created_at
          FROM opportunities
          JOIN contacts ON contacts.id = opportunities.contact_id
          LEFT JOIN companies ON companies.id = opportunities.company_id
          WHERE opportunities.deleted_at IS NULL
          ORDER BY opportunities.created_at DESC
          LIMIT :'limit'::integer
        ) rows;
        """,
        {"limit": limit},
    )


def dashboard_summary() -> dict[str, Any]:
    return query_json(
        """
        SELECT json_build_object(
          'total_opportunities', (SELECT count(*) FROM opportunities WHERE deleted_at IS NULL),
          'consulting_opportunities', (
            SELECT count(*) FROM opportunities
            WHERE deleted_at IS NULL AND lead_type = 'consulting_client'
          ),
          'investor_opportunities', (
            SELECT count(*) FROM opportunities
            WHERE deleted_at IS NULL AND lead_type = 'investor'
          ),
          'hot_leads', (
            SELECT count(*) FROM opportunities
            WHERE deleted_at IS NULL AND score_label = 'hot'
          ),
          'warm_leads', (
            SELECT count(*) FROM opportunities
            WHERE deleted_at IS NULL AND score_label = 'warm'
          ),
          'searches', (SELECT count(*) FROM lead_searches),
          'by_pipeline', (
            SELECT COALESCE(json_agg(row_to_json(rows)), '[]'::json)
            FROM (
              SELECT lead_type, pipeline_status, count(*) AS count
              FROM opportunities
              WHERE deleted_at IS NULL
              GROUP BY lead_type, pipeline_status
              ORDER BY lead_type, pipeline_status
            ) rows
          )
        );
        """
    )
