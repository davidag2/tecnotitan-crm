# Seguridad De Secretos

## Regla principal

Las credenciales reales nunca deben guardarse en codigo fuente ni en archivos versionados.

Archivos permitidos:

```text
.env.example
```

Archivos no versionables:

```text
.env
.env.local
.env.production
```

## Apollo API Key

La API key de Apollo debe vivir solo en:

```text
APOLLO_API_KEY
```

Nunca debe:

- Enviarse al frontend.
- Imprimirse completa en logs.
- Guardarse en screenshots.
- Compartirse en chats publicos.
- Incluirse en URLs.
- Versionarse en git.

Apollo debe llamarse desde el backend usando header:

```text
X-Api-Key: <APOLLO_API_KEY>
```

## Rotacion recomendada

Como la key de desarrollo fue compartida durante la configuracion inicial, cuando el CRM pase a desarrollo formal conviene:

1. Crear una nueva API key en Apollo.
2. Reemplazar `APOLLO_API_KEY` en `.env`.
3. Revocar la key anterior en Apollo.
4. Probar `GET /api/apollo/health`.

## PostgreSQL

La base de Tecnotitan debe usar una base separada:

```text
tecnotitan_crm
```

No usar:

```text
copiloto_pyme
```

Regla:

```text
Nunca ejecutar migraciones de Tecnotitan sobre copiloto_pyme.
```

## Produccion

En produccion, las variables deben vivir en el proveedor de hosting o en un secret manager:

- Railway Variables.
- Render Environment Variables.
- Vercel Environment Variables.
- Fly.io Secrets.
- AWS Secrets Manager.
- GCP Secret Manager.

No subir `.env.production`.
