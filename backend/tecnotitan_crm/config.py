import os
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


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


def apollo_api_key() -> str:
    load_dotenv()
    return os.getenv("APOLLO_API_KEY", "")


def apollo_base_url() -> str:
    load_dotenv()
    return os.getenv("APOLLO_BASE_URL", "https://api.apollo.io").rstrip("/")


def database_url() -> str:
    load_dotenv()
    return os.getenv("DATABASE_URL", "")


def psql_path() -> str:
    load_dotenv()
    return os.getenv("PSQL_PATH", r"C:\Program Files\PostgreSQL\18\bin\psql.exe")
