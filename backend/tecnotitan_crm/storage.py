from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from .scoring import score_lead


LEADS: list[dict[str, Any]] = []


def now_iso() -> str:
    return datetime.now(UTC).isoformat()


def person_to_lead(person: dict[str, Any], lead_type: str, target_region: str) -> dict[str, Any]:
    organization = person.get("organization") or {}
    first_name = person.get("first_name")
    last_name = person.get("last_name") or person.get("last_name_obfuscated")
    full_name = " ".join(value for value in [first_name, last_name] if value)
    country = person.get("country") or organization.get("country")
    scoring = score_lead(lead_type, person.get("title"), country, person.get("linkedin_url"))

    return {
        "id": str(uuid4()),
        "apollo_person_id": person.get("id"),
        "apollo_organization_id": organization.get("id"),
        "first_name": first_name,
        "last_name": last_name,
        "full_name": full_name or None,
        "title": person.get("title"),
        "seniority": person.get("seniority"),
        "linkedin_url": person.get("linkedin_url"),
        "email": person.get("email"),
        "email_status": person.get("email_status"),
        "phone": person.get("phone_numbers"),
        "company_name": organization.get("name"),
        "company_domain": organization.get("primary_domain") or organization.get("website_url"),
        "company_industry": organization.get("industry"),
        "company_employee_range": organization.get("estimated_num_employees"),
        "person_country": person.get("country"),
        "company_country": organization.get("country"),
        "lead_type": lead_type,
        "target_region": target_region,
        "lead_source": "apollo",
        "pipeline_status": "new" if lead_type == "consulting_client" else "identified",
        "score": scoring["score"],
        "score_label": scoring["score_label"],
        "score_reasons": scoring["score_reasons"],
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }


def save_apollo_people(people: list[dict[str, Any]], lead_type: str, target_region: str) -> list[dict[str, Any]]:
    saved: list[dict[str, Any]] = []
    existing_apollo_ids = {lead.get("apollo_person_id") for lead in LEADS if lead.get("apollo_person_id")}

    for person in people:
        apollo_person_id = person.get("id")
        if apollo_person_id and apollo_person_id in existing_apollo_ids:
            continue

        lead = person_to_lead(person, lead_type, target_region)
        LEADS.append(lead)
        saved.append(lead)

    return saved


def list_leads() -> list[dict[str, Any]]:
    return LEADS
