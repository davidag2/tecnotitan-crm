import os
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]


def load_dotenv() -> None:
    env_path = ROOT / ".env"
    if not env_path.exists():
        print("ERROR: No existe .env")
        raise SystemExit(1)

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def mask(value: str, visible: int = 4) -> str:
    if not value:
        return "missing"
    if len(value) <= visible * 2:
        return "*" * len(value)
    return f"{value[:visible]}...{value[-visible:]}"


def main() -> None:
    load_dotenv()

    apollo_key = os.getenv("APOLLO_API_KEY", "")
    apollo_base_url = os.getenv("APOLLO_BASE_URL", "")
    database_url = os.getenv("DATABASE_URL", "")

    errors: list[str] = []

    if not apollo_key or apollo_key == "pon_tu_api_key_aqui":
        errors.append("APOLLO_API_KEY no esta configurada.")

    if not apollo_base_url.startswith("https://api.apollo.io"):
        errors.append("APOLLO_BASE_URL debe apuntar a https://api.apollo.io")

    parsed_database = urlparse(database_url)
    if parsed_database.scheme not in {"postgresql", "postgres"}:
        errors.append("DATABASE_URL debe ser una URL de PostgreSQL.")

    if parsed_database.path.lstrip("/") == "copiloto_pyme":
        errors.append("DATABASE_URL apunta a copiloto_pyme. No tocar esa base.")

    print("Configuracion local:")
    print(f"- APOLLO_API_KEY: {mask(apollo_key)}")
    print(f"- APOLLO_BASE_URL: {apollo_base_url or 'missing'}")
    print(f"- DATABASE_HOST: {parsed_database.hostname or 'missing'}")
    print(f"- DATABASE_NAME: {parsed_database.path.lstrip('/') or 'missing'}")
    print(f"- DATABASE_USER: {parsed_database.username or 'missing'}")

    if errors:
        print("\nErrores:")
        for error in errors:
            print(f"- {error}")
        raise SystemExit(1)

    print("\nOK: secretos y configuracion base se ven correctos.")


if __name__ == "__main__":
    main()
