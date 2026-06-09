# Base De Datos Tecnotitan CRM

PostgreSQL sera la base principal del CRM interno.

## Opcion Con Docker

Cuando Docker este disponible:

```powershell
docker compose up -d
```

Esto crea:

```text
Database: tecnotitan_crm
User: tecnotitan
Password: definido por `POSTGRES_PASSWORD`
Port: 5432
```

La migracion inicial esta en:

```text
db/migrations/001_initial_schema.sql
```

Migraciones adicionales:

```text
db/migrations/002_dedup_indexes.sql
```

## Opcion Con PostgreSQL Instalado Localmente

En esta maquina se detecto PostgreSQL 18 en:

```text
C:\Program Files\PostgreSQL\18\bin\psql.exe
```

Para configurar la base sin publicar la contrasena en el chat:

```powershell
.\scripts\setup_postgres.ps1
```

El script pedira la contrasena del usuario `postgres`, creara el usuario `tecnotitan`, creara la base `tecnotitan_crm` y aplicara la migracion inicial.

Manual, si prefieres hacerlo paso a paso:

```powershell
createdb tecnotitan_crm
psql -d tecnotitan_crm -f db/migrations/001_initial_schema.sql
```

## Variable De Conexion

```text
DATABASE_URL=postgresql://usuario:password@127.0.0.1:5432/tecnotitan_crm
```

## Nota

En esta terminal se detecto PostgreSQL 18 y el servicio `postgresql-x64-18` esta corriendo.

Bases detectadas antes de configurar Tecnotitan:

```text
copiloto_pyme
postgres
```

Importante:

- `copiloto_pyme` pertenece a otro proyecto y no debe tocarse.
- `tecnotitan_crm` se creo como base separada para este CRM.
- La migracion inicial se aplico solo sobre `tecnotitan_crm`.

Estado actual:

```text
Database: tecnotitan_crm
User: tecnotitan
Tables: 12
```

La migracion `002_dedup_indexes.sql` consolido duplicados iniciales de empresas y agrego indices unicos parciales para deduplicacion.
