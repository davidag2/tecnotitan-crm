# Tecnotitan CRM

CRM interno para Tecnotitan orientado a:

- Buscar clientes de consultoria en America Latina.
- Buscar inversionistas en USA, America Latina y Europa.
- Usar Apollo.io como fuente de leads.
- Guardar contactos, empresas y oportunidades en PostgreSQL.
- Calificar leads con scoring propio.

## Estado actual

El proyecto incluye:

- Backend local en Python.
- Base PostgreSQL `tecnotitan_crm`.
- Integracion Apollo Search.
- Deduplicacion.
- Scoring para consultoria.
- Scoring para inversionistas.
- Interfaz web local.
- Prototipo desktop con Electron.

## Seguridad

No subir credenciales reales.

Usa `.env.example` como plantilla:

```text
APOLLO_API_KEY=pon_tu_api_key_aqui
APOLLO_BASE_URL=https://api.apollo.io
DATABASE_URL=postgresql://usuario:password@127.0.0.1:5432/tecnotitan_crm
```

La base `copiloto_pyme` no debe tocarse.

## Ejecutar Backend Web Local

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run_crm.ps1
```

Luego abrir:

```text
http://127.0.0.1:8000
```

## Ejecutar Desktop

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run_desktop.ps1
```

## Generar EXE

```powershell
npm install
npm run build:portable
```

El ejecutable se genera en:

```text
dist\Tecnotitan CRM 0.1.0.exe
```

## Siguiente Enfoque

El proyecto se va a evolucionar hacia software web desplegable, manteniendo la integracion con Apollo y PostgreSQL.
