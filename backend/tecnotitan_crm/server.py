import json
import mimetypes
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from .apollo_client import ApolloError, health_check, people_search
from .db import DatabaseError
from .db import health_check as db_health_check
from .repository import create_lead_search, dashboard_summary, list_recent_leads, save_people_from_apollo
from .search_templates import SEARCH_TEMPLATES, build_apollo_payload, get_template, get_template_by_key, list_templates


HOST = "127.0.0.1"
PORT = 8000
ROOT = Path(__file__).resolve().parents[2]
FRONTEND_ROOT = ROOT / "frontend"


class CRMHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self) -> None:
        self.send_json({"ok": True})

    def do_GET(self) -> None:
        path = urlparse(self.path).path

        if path == "/" or path.startswith("/frontend/"):
            self.serve_static(path)
            return

        if path == "/health":
            self.send_json({"status": "ok", "service": "tecnotitan-crm-backend"})
            return

        if path == "/api/search-templates":
            self.send_json({"templates": list_templates(), "count": len(SEARCH_TEMPLATES)})
            return

        if path == "/api/leads":
            try:
                leads = list_recent_leads()
                self.send_json({"leads": leads, "count": len(leads)})
            except DatabaseError as error:
                self.send_json({"error": str(error)}, status=500)
            return

        if path == "/api/dashboard":
            try:
                self.send_json(dashboard_summary())
            except DatabaseError as error:
                self.send_json({"error": str(error)}, status=500)
            return

        if path == "/api/db/health":
            try:
                self.send_json(db_health_check())
            except DatabaseError as error:
                self.send_json({"error": str(error)}, status=500)
            return

        if path == "/api/apollo/health":
            try:
                self.send_json(health_check())
            except ApolloError as error:
                self.send_json({"error": str(error)}, status=error.status_code or 502)
            return

        self.send_json({"error": "Ruta no encontrada."}, status=404)

    def do_POST(self) -> None:
        path = urlparse(self.path).path

        if path == "/api/apollo/search":
            self.handle_apollo_search()
            return

        self.send_json({"error": "Ruta no encontrada."}, status=404)

    def handle_apollo_search(self) -> None:
        body = self.read_json_body()
        template_key = body.get("template_key")
        lead_type = body.get("lead_type")
        target_region = body.get("target_region")
        page = int(body.get("page", 1))
        extra_filters = body.get("filters") or {}

        try:
            if template_key:
                template = get_template_by_key(template_key)
            else:
                if lead_type not in {"consulting_client", "investor"}:
                    self.send_json({"error": "lead_type debe ser consulting_client o investor."}, status=400)
                    return

                if target_region not in {"latam", "usa", "europe"}:
                    self.send_json({"error": "target_region debe ser latam, usa o europe."}, status=400)
                    return

                template = get_template(lead_type, target_region)
        except ValueError as error:
            self.send_json({"error": str(error)}, status=400)
            return

        lead_type = template["lead_type"]
        target_region = template["target_region"]
        template_key = template["key"]
        per_page = min(int(body.get("per_page", template["default_per_page"])), 100)
        payload = build_apollo_payload(template, extra_filters)
        payload["page"] = page
        payload["per_page"] = per_page

        try:
            results = people_search(payload)
        except ApolloError as error:
            self.send_json({"error": str(error)}, status=error.status_code or 502)
            return

        people = results.get("people", [])
        try:
            lead_search_id = create_lead_search(
                name=body.get("name") or f"{template_key} page {page}",
                lead_type=lead_type,
                target_region=target_region,
                search_template=template_key,
                filters=payload,
                total_entries=results.get("total_entries"),
                page=page,
            )
            saved = save_people_from_apollo(people, lead_type, target_region, lead_search_id, page)
        except DatabaseError as error:
            self.send_json({"error": str(error)}, status=500)
            return

        self.send_json(
            {
                "lead_search_id": lead_search_id,
                "total_entries": results.get("total_entries"),
                "returned": len(people),
                "saved": len(saved),
                "leads": saved,
            }
        )

    def read_json_body(self) -> dict[str, Any]:
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length == 0:
            return {}

        raw_body = self.rfile.read(content_length).decode("utf-8")
        try:
            return json.loads(raw_body)
        except json.JSONDecodeError:
            return {}

    def send_json(self, payload: dict[str, Any], status: int = 200) -> None:
        body = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def serve_static(self, path: str) -> None:
        if path == "/":
            file_path = FRONTEND_ROOT / "index.html"
        else:
            relative_path = path.removeprefix("/frontend/")
            file_path = FRONTEND_ROOT / relative_path

        try:
            resolved = file_path.resolve()
            if FRONTEND_ROOT.resolve() not in resolved.parents and resolved != FRONTEND_ROOT.resolve():
                self.send_json({"error": "Ruta estatica no permitida."}, status=403)
                return
            if not resolved.exists() or not resolved.is_file():
                self.send_json({"error": "Archivo no encontrado."}, status=404)
                return

            content = resolved.read_bytes()
            mime_type = mimetypes.guess_type(str(resolved))[0] or "application/octet-stream"
            self.send_response(200)
            self.send_header("Content-Type", f"{mime_type}; charset=utf-8")
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        except OSError as error:
            self.send_json({"error": str(error)}, status=500)

    def log_message(self, format: str, *args: object) -> None:
        return


def main() -> None:
    server = ThreadingHTTPServer((HOST, PORT), CRMHandler)
    print(f"Tecnotitan CRM backend running at http://{HOST}:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
