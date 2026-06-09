import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.tecnotitan_crm.db import query_json  # noqa: E402
from backend.tecnotitan_crm.scoring import score_lead  # noqa: E402


def load_consulting_opportunities() -> list[dict[str, object]]:
    return query_json(
        """
        SELECT COALESCE(json_agg(row_to_json(rows)), '[]'::json)
        FROM (
          SELECT
            opportunities.id AS opportunity_id,
            contacts.title,
            contacts.country,
            contacts.linkedin_url,
            companies.raw_payload AS organization
          FROM opportunities
          JOIN contacts ON contacts.id = opportunities.contact_id
          LEFT JOIN companies ON companies.id = opportunities.company_id
          WHERE opportunities.lead_type = 'consulting_client'
            AND opportunities.deleted_at IS NULL
        ) rows;
        """
    )


def update_score(opportunity_id: str, scoring: dict[str, object]) -> None:
    query_json(
        """
        UPDATE opportunities
        SET score = :'score'::integer,
            score_label = :'score_label'::score_label,
            score_reasons = :'score_reasons'::jsonb,
            updated_at = now()
        WHERE id = :'opportunity_id'::uuid
        RETURNING to_json(id);
        """,
        {
            "opportunity_id": opportunity_id,
            "score": scoring["score"],
            "score_label": scoring["score_label"],
            "score_reasons": scoring["score_reasons"],
        },
    )


def main() -> None:
    opportunities = load_consulting_opportunities()
    print(f"Recalculando {len(opportunities)} oportunidades de consultoria...")

    for opportunity in opportunities:
        scoring = score_lead(
            lead_type="consulting_client",
            title=opportunity.get("title"),
            country=opportunity.get("country"),
            linkedin_url=opportunity.get("linkedin_url"),
            organization=opportunity.get("organization") or {},
        )
        update_score(str(opportunity["opportunity_id"]), scoring)
        print(
            json.dumps(
                {
                    "opportunity_id": opportunity["opportunity_id"],
                    "score": scoring["score"],
                    "score_label": scoring["score_label"],
                    "reasons": scoring["score_reasons"],
                },
                ensure_ascii=False,
            )
        )


if __name__ == "__main__":
    main()
