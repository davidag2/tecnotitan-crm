import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def load_dotenv() -> None:
    env_path = ROOT / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def request_json(method: str, path: str, payload: dict | None = None) -> dict:
    api_key = os.getenv("APOLLO_API_KEY")
    base_url = os.getenv("APOLLO_BASE_URL", "https://api.apollo.io").rstrip("/")

    if not api_key or api_key == "pon_tu_api_key_aqui":
        print("Falta APOLLO_API_KEY. Crea un archivo .env basado en .env.example.")
        sys.exit(1)

    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")

    request = urllib.request.Request(
        f"{base_url}{path}",
        data=data,
        method=method,
        headers={
            "Accept": "application/json",
            "Cache-Control": "no-cache",
            "Content-Type": "application/json",
            "X-Api-Key": api_key,
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            body = response.read().decode("utf-8")
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        print(f"HTTP {error.code}: {body}")
        sys.exit(1)
    except urllib.error.URLError as error:
        print(f"No se pudo conectar con Apollo: {error.reason}")
        sys.exit(1)


def main() -> None:
    load_dotenv()

    print("1) Validando API key...")
    health = request_json("GET", "/v1/auth/health")
    print(json.dumps(health, indent=2, ensure_ascii=False))

    print("\n2) Buscando leads LATAM iniciales...")
    search_payload = {
        "person_titles": [
            "CTO",
            "Head of Technology",
            "IT Manager",
            "Digital Transformation Manager",
        ],
        "person_locations": ["Colombia", "Mexico", "Chile", "Peru"],
        "organization_num_employees_ranges": ["20,200", "201,500"],
        "page": 1,
        "per_page": 10,
    }

    results = request_json("POST", "/api/v1/mixed_people/api_search", search_payload)
    total = results.get("total_entries", 0)
    people = results.get("people", [])

    print(f"Total aproximado encontrado: {total}")
    print(f"Mostrando {len(people)} resultados:")

    for person in people:
        organization = person.get("organization") or {}
        name = " ".join(
            value
            for value in [
                person.get("first_name"),
                person.get("last_name") or person.get("last_name_obfuscated"),
            ]
            if value
        )
        print(
            "- "
            + " | ".join(
                value
                for value in [
                    name or "Sin nombre",
                    person.get("title") or "Sin cargo",
                    organization.get("name") or "Sin empresa",
                    person.get("country") or "Sin país",
                ]
                if value
            )
        )


if __name__ == "__main__":
    main()
