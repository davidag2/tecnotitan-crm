param(
  [string]$PostgresUser = "postgres",
  [string]$HostName = "127.0.0.1",
  [int]$Port = 5432,
  [string]$AppDatabase = "tecnotitan_crm",
  [string]$AppUser = "tecnotitan",
  [string]$AppPassword = "change_me_local_password"
)

$ErrorActionPreference = "Stop"

$PsqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

if (-not (Test-Path -LiteralPath $PsqlPath)) {
  throw "No se encontro psql.exe en $PsqlPath"
}

$MigrationPath = Join-Path $PSScriptRoot "..\db\migrations\001_initial_schema.sql"
$MigrationPath = (Resolve-Path $MigrationPath).Path

$SecurePassword = Read-Host "Password del usuario PostgreSQL '$PostgresUser'" -AsSecureString
$PlainPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
  [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
)

try {
  $env:PGPASSWORD = $PlainPassword

  Write-Host "Validando conexion con PostgreSQL..."
  & $PsqlPath -h $HostName -p $Port -U $PostgresUser -d postgres -v ON_ERROR_STOP=1 -c "SELECT version();"

  Write-Host "Creando usuario de aplicacion si no existe..."
  & $PsqlPath -h $HostName -p $Port -U $PostgresUser -d postgres -v ON_ERROR_STOP=1 -c "SELECT 'CREATE USER $AppUser WITH PASSWORD ''$AppPassword''' WHERE NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$AppUser')\gexec"

  Write-Host "Creando base de datos si no existe..."
  & $PsqlPath -h $HostName -p $Port -U $PostgresUser -d postgres -v ON_ERROR_STOP=1 -c "SELECT 'CREATE DATABASE $AppDatabase OWNER $AppUser' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$AppDatabase')\gexec"

  Write-Host "Aplicando migracion inicial..."
  & $PsqlPath -h $HostName -p $Port -U $PostgresUser -d $AppDatabase -v ON_ERROR_STOP=1 -f $MigrationPath

  Write-Host "Otorgando permisos..."
  & $PsqlPath -h $HostName -p $Port -U $PostgresUser -d $AppDatabase -v ON_ERROR_STOP=1 -c "GRANT ALL PRIVILEGES ON DATABASE $AppDatabase TO $AppUser;"
  & $PsqlPath -h $HostName -p $Port -U $PostgresUser -d $AppDatabase -v ON_ERROR_STOP=1 -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $AppUser;"
  & $PsqlPath -h $HostName -p $Port -U $PostgresUser -d $AppDatabase -v ON_ERROR_STOP=1 -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $AppUser;"

  Write-Host "Listo. Base configurada: postgresql://$AppUser:$AppPassword@$HostName`:$Port/$AppDatabase"
}
finally {
  Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}
