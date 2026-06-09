import json
import urllib.error
import urllib.request
from typing import Any

from .config import apollo_api_key, apollo_base_url


class ApolloError(Exception):
    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code


def request_json(method: str, path: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    api_key = apollo_api_key()
    if not api_key:
        raise ApolloError("APOLLO_API_KEY no esta configurada.")

    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")

    request = urllib.request.Request(
        f"{apollo_base_url()}{path}",
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
        raise ApolloError(body, error.code) from error
    except urllib.error.URLError as error:
        raise ApolloError(f"No se pudo conectar con Apollo: {error.reason}") from error


def health_check() -> dict[str, Any]:
    return request_json("GET", "/v1/auth/health")


def people_search(payload: dict[str, Any]) -> dict[str, Any]:
    return request_json("POST", "/api/v1/mixed_people/api_search", payload)
