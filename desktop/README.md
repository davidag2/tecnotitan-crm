# Tecnotitan CRM Desktop

Aplicacion local de escritorio para Tecnotitan CRM.

## Ejecutar

Desde la raiz del proyecto:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run_desktop.ps1
```

O directamente:

```powershell
npm run desktop
```

## Ejecutable Portable

Se puede generar un `.exe` normal de Windows con:

```powershell
npm run build:portable
```

Ejecutable generado:

```text
dist\Tecnotitan CRM 0.1.0.exe
```

Para abrirlo:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run_exe.ps1
```

La configuracion local `.env` debe estar junto al ejecutable:

```text
dist\.env
```

No se incrusta la API key dentro del `.exe`.

## Que cambia frente a la version navegador

- No necesitas abrir `http://127.0.0.1:8000`.
- No necesitas mantener un servidor web local escuchando en un puerto.
- La ventana de Electron lee datos mediante IPC seguro.
- La API key de Apollo queda en el proceso principal, no en la interfaz.
- PostgreSQL sigue usando la base separada `tecnotitan_crm`.

## Funciones actuales

- Dashboard.
- Leads recientes.
- Filtros por consultoria o inversionistas.
- Busqueda Apollo por plantilla.
- Guardado en PostgreSQL.
- Scoring basico.

## Seguridad

La app lee:

```text
.env
```

Pero no expone `APOLLO_API_KEY` al renderer/frontend.

La base prohibida sigue siendo:

```text
copiloto_pyme
```
