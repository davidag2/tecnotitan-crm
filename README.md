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
- Proyecto Supabase cloud separado de Copiloto Pyme.
- API serverless en Vercel para dashboard, leads y busqueda Apollo.

## Seguridad

No subir credenciales reales.

Usa `.env.example` como plantilla:

```text
APOLLO_API_KEY=pon_tu_api_key_aqui
APOLLO_BASE_URL=https://api.apollo.io
DATABASE_URL=postgresql://usuario:password@127.0.0.1:5432/tecnotitan_crm
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=solo_en_backend_o_vercel
CRM_ADMIN_TOKEN=token_privado_para_uso_interno
CRM_USERNAME=usuario_autorizado
CRM_PASSWORD_HASH=hash_pbkdf2_generado
CRM_SESSION_SECRET=secreto_para_firmar_sesiones
```

La base `copiloto_pyme` no debe tocarse.

## Vercel Pro cron jobs

El proyecto usa tres tareas programadas en Vercel Pro:

- `/api/emails?cron=campaigns`: procesa campanas de correo cada 5 minutos.
- `/api/status-monitor?target=tecnotitan`: revisa el status de Tecnotitan en los minutos 2, 17, 32 y 47.
- `/api/status-monitor?target=copiloto`: revisa el status de Copiloto Pyme en los minutos 7, 22, 37 y 52.

URLs configurables por variables de entorno:

- `STATUS_TECNOTITAN_URL`
- `STATUS_COPILOTO_PYME_URL`

Para Vercel, `SUPABASE_SERVICE_ROLE_KEY`, `APOLLO_API_KEY`, `CRM_PASSWORD_HASH` y `CRM_SESSION_SECRET` deben configurarse como variables privadas. No deben aparecer en `public/`, ni en codigo frontend, ni en commits.

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

El proyecto ahora evoluciona hacia CRM web cloud:

- Vercel sirve la interfaz desde `public/`.
- Vercel Functions vive en `api/`.
- Supabase guarda empresas, contactos, oportunidades y busquedas.
- Apollo Search se ejecuta desde backend serverless para proteger la API key.
