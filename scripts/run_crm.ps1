$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$Python = "C:\Users\david\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"

if (-not (Test-Path -LiteralPath $Python)) {
  throw "No se encontro Python en $Python"
}

Set-Location $ProjectRoot

Write-Host ""
Write-Host "Tecnotitan CRM"
Write-Host "Servidor: http://127.0.0.1:8000"
Write-Host ""
Write-Host "Deja esta ventana abierta mientras usas el CRM."
Write-Host "Para detener el servidor: Ctrl + C"
Write-Host ""

& $Python -m backend.tecnotitan_crm.server
