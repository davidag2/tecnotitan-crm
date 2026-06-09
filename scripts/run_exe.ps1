$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$ExePath = Join-Path $ProjectRoot "dist\Tecnotitan CRM 0.1.0.exe"

if (-not (Test-Path -LiteralPath $ExePath)) {
  throw "No se encontro el ejecutable en $ExePath. Ejecuta npm run build:portable primero."
}

Start-Process -FilePath $ExePath
