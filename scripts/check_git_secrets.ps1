$ErrorActionPreference = "Stop"

$SensitiveFiles = @(
  ".env",
  ".env.local",
  ".env.production"
)

Write-Host "Revisando archivos sensibles..."

foreach ($file in $SensitiveFiles) {
  if (Test-Path -LiteralPath $file) {
    Write-Host "Existe $file y debe permanecer fuera de git."
  }
}

if (Test-Path -LiteralPath ".git") {
  $tracked = git ls-files
  foreach ($file in $SensitiveFiles) {
    if ($tracked -contains $file) {
      throw "$file esta versionado. Debe removerse del indice de git."
    }
  }

  Write-Host "OK: no hay archivos .env sensibles versionados."
}
else {
  Write-Host "No hay repositorio git inicializado en esta carpeta. .gitignore ya esta preparado."
}
