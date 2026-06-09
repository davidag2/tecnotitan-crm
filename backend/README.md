# Tecnotitan CRM Backend

Backend inicial para el CRM interno de Tecnotitan.

Esta primera version no usa dependencias externas. Sirve para:

- Validar que el backend arranca.
- Exponer plantillas de busqueda.
- Consultar Apollo Search API.
- Guardar resultados en PostgreSQL.
- Listar leads guardados en la base `tecnotitan_crm`.

## Ejecutar

Desde la raiz del proyecto:

```powershell
C:\Users\david\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe -m backend.tecnotitan_crm.server
```

URL local:

```text
http://127.0.0.1:8000
```

La interfaz del CRM se sirve en esa misma URL.

## Endpoints

```text
GET /health
GET /
GET /api/dashboard
GET /api/db/health
GET /api/apollo/health
GET /api/search-templates
GET /api/leads
POST /api/apollo/search
```

## Ejemplo de busqueda

```powershell
$body = @{
  template_key = "consulting_client:latam"
  page = 1
  per_page = 10
} | ConvertTo-Json

Invoke-RestMethod `
  -Method POST `
  -Uri "http://127.0.0.1:8000/api/apollo/search" `
  -ContentType "application/json" `
  -Body $body
```

## Persistencia

El backend usa:

```text
DATABASE_URL=postgresql://usuario:password@127.0.0.1:5432/tecnotitan_crm
```

La base `copiloto_pyme` no debe usarse para este proyecto.
