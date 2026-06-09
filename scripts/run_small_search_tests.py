import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.tecnotitan_crm.apollo_client import ApolloError, people_search  # noqa: E402
from backend.tecnotitan_crm.repository import create_lead_search, save_people_from_apollo  # noqa: E402
from backend.tecnotitan_crm.search_templates import build_apollo_payload, get_template_by_key  # noqa: E402


TESTS = [
    {
        "name": "Consultoria Colombia",
        "template_key": "consulting_client:latam",
        "filters": {"person_locations": ["Colombia"]},
        "per_page": 3,
    },
    {
        "name": "Consultoria Mexico",
        "template_key": "consulting_client:latam",
        "filters": {"person_locations": ["Mexico"]},
        "per_page": 3,
    },
    {
        "name": "Inversionistas USA venture capital",
        "template_key": "investor:usa",
        "filters": {"q_keywords": "venture capital"},
        "per_page": 3,
    },
    {
        "name": "Inversionistas LATAM venture capital",
        "template_key": "investor:latam",
        "filters": {"q_keywords": "venture capital"},
        "per_page": 3,
    },
    {
        "name": "Inversionistas Europa venture capital",
        "template_key": "investor:europe",
        "filters": {"q_keywords": "venture capital"},
        "per_page": 3,
    },
]


def run_test(test: dict[str, object]) -> dict[str, object]:
    template = get_template_by_key(str(test["template_key"]))
    page = 1
    payload = build_apollo_payload(template, test.get("filters") or {})
    payload["page"] = page
    payload["per_page"] = test.get("per_page", 3)

    results = people_search(payload)
    people = results.get("people", [])

    lead_search_id = create_lead_search(
        name=f"Paso 20 - {test['name']}",
        lead_type=str(template["lead_type"]),
        target_region=str(template["target_region"]),
        search_template=str(template["key"]),
        filters=payload,
        total_entries=results.get("total_entries"),
        page=page,
    )
    saved = save_people_from_apollo(
        people=people,
        lead_type=str(template["lead_type"]),
        target_region=str(template["target_region"]),
        lead_search_id=lead_search_id,
        page=page,
    )

    return {
        "name": test["name"],
        "template_key": template["key"],
        "total_entries": results.get("total_entries") or 0,
        "returned": len(people),
        "saved": len(saved),
        "lead_search_id": lead_search_id,
        "sample": [
            {
                "name": lead.get("full_name"),
                "title": lead.get("title"),
                "company": lead.get("company_name"),
                "score": lead.get("score"),
                "score_label": lead.get("score_label"),
            }
            for lead in saved[:3]
        ],
    }


def main() -> None:
    report = []
    for test in TESTS:
        print(f"Ejecutando: {test['name']}")
        try:
            result = run_test(test)
            report.append(result)
            print(json.dumps(result, ensure_ascii=False, indent=2))
        except ApolloError as error:
            result = {
                "name": test["name"],
                "template_key": test["template_key"],
                "error": str(error),
                "status_code": error.status_code,
            }
            report.append(result)
            print(json.dumps(result, ensure_ascii=False, indent=2))

    report_path = ROOT / "search-quality-report.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Reporte guardado en {report_path}")


if __name__ == "__main__":
    main()
