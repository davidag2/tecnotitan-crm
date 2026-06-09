import json
import os
import subprocess
from typing import Any
from urllib.parse import urlparse

from .config import database_url, psql_path


class DatabaseError(Exception):
    pass


def _connection_args() -> tuple[list[str], dict[str, str]]:
    parsed = urlparse(database_url())
    if parsed.scheme not in {"postgres", "postgresql"}:
        raise DatabaseError("DATABASE_URL no esta configurada como PostgreSQL.")

    database_name = parsed.path.lstrip("/")
    if database_name == "copiloto_pyme":
        raise DatabaseError("DATABASE_URL apunta a copiloto_pyme. No se permite tocar esa base.")

    env = os.environ.copy()
    env["PGPASSWORD"] = parsed.password or ""
    env["PGCLIENTENCODING"] = "UTF8"
    args = [
        psql_path(),
        "-h",
        parsed.hostname or "127.0.0.1",
        "-p",
        str(parsed.port or 5432),
        "-U",
        parsed.username or "postgres",
        "-d",
        database_name,
        "-v",
        "ON_ERROR_STOP=1",
        "-q",
        "-t",
        "-A",
    ]
    return args, env


def _run_psql(sql: str, variables: dict[str, Any] | None = None) -> str:
    args, env = _connection_args()
    sql = _render_sql(sql, variables or {})

    completed = subprocess.run(
        args,
        input=sql,
        capture_output=True,
        encoding="utf-8",
        env=env,
        check=False,
    )

    if completed.returncode != 0:
        raise DatabaseError(completed.stderr.strip() or completed.stdout.strip())

    return completed.stdout.strip()


def _render_sql(sql: str, variables: dict[str, Any]) -> str:
    rendered = sql
    for key in sorted(variables.keys(), key=len, reverse=True):
        rendered = rendered.replace(f":'{key}'", _sql_literal(variables[key]))
    return rendered


def _sql_literal(value: Any) -> str:
    if value is None:
        return "NULL"

    if not isinstance(value, str):
        value = json.dumps(value, ensure_ascii=True)

    value = value.replace("\x00", "")
    value = value.replace("'", "''")
    return f"'{value}'"


def query_json(sql: str, variables: dict[str, Any] | None = None) -> Any:
    output = _run_psql(sql, variables)
    if not output:
        return None
    return json.loads(output)


def health_check() -> dict[str, Any]:
    return query_json(
        """
        SELECT json_build_object(
          'database', current_database(),
          'app_user', current_user,
          'tables', (
            SELECT count(*)
            FROM information_schema.tables
            WHERE table_schema = 'public'
          )
        );
        """
    )
