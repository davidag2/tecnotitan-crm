$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $ProjectRoot

Write-Host ""
Write-Host "Tecnotitan CRM Desktop"
Write-Host "Iniciando aplicacion local de escritorio..."
Write-Host ""

npm run desktop
