# Acceso a la API de Apollo.io para Tecnotitan

## 1. Crear API key

En Apollo:

1. Ir a `Settings > Integrations`.
2. Buscar `Apollo API` y hacer clic en `Connect`.
3. Entrar a `API Keys`.
4. Crear una nueva key.
5. Para el MVP interno de leads LATAM, crearla como `master key` o habilitar al menos:
   - People API Search
   - People Enrichment
   - Bulk People Enrichment
   - Organization Search
   - Organization Enrichment

Nombre sugerido:

```text
Tecnotitan Lead Finder - Dev
```

## 2. Probar que la key funciona

Endpoint de salud:

```bash
curl --request GET "https://api.apollo.io/v1/auth/health" \
  --header "Content-Type: application/json" \
  --header "Cache-Control: no-cache" \
  --header "X-Api-Key: TU_API_KEY"
```

Si la respuesta indica autenticacion valida, ya podemos integrar.

## 3. Primer endpoint para leads

Endpoint:

```text
POST https://api.apollo.io/api/v1/mixed_people/api_search
```

Uso:

- Buscar personas nuevas en la base de Apollo.
- No devuelve emails ni telefonos directamente.
- No consume creditos segun la documentacion actual.
- Requiere master API key.
- En la prueba del 2026-06-08, Apollo devolvio `403 API_INACCESSIBLE` para este endpoint en plan Free.
- Despues de cambiar a plan Basic el 2026-06-08, el endpoint respondio correctamente y encontro 7.217 leads aproximados para la busqueda inicial LATAM.

Ejemplo para LATAM:

```bash
curl --request POST "https://api.apollo.io/api/v1/mixed_people/api_search" \
  --header "Content-Type: application/json" \
  --header "Cache-Control: no-cache" \
  --header "X-Api-Key: TU_API_KEY" \
  --data '{
    "person_titles": [
      "CTO",
      "Head of Technology",
      "IT Manager",
      "Digital Transformation Manager"
    ],
    "person_locations": [
      "Colombia",
      "Mexico",
      "Chile",
      "Peru"
    ],
    "organization_num_employees_ranges": [
      "20,200",
      "201,500"
    ],
    "page": 1,
    "per_page": 25
  }'
```

## 4. Enriquecimiento

Despues de buscar candidatos, el sistema debe enriquecer solo los leads con mejor fit.

Motivo:

- People Search encuentra candidatos.
- People Enrichment/Bulk People Enrichment obtiene datos como email o telefono si estan disponibles.
- El enriquecimiento puede consumir creditos segun plan y tipo de dato.

## 5. Variables de entorno sugeridas

```text
APOLLO_API_KEY=
APOLLO_BASE_URL=https://api.apollo.io
```

## 6. Prueba local

1. Copiar `.env.example` a `.env`.
2. Pegar la API key en `APOLLO_API_KEY`.
3. Ejecutar:

```bash
python scripts/test_apollo_api.py
```

El script hace 2 cosas:

- Valida la API key contra `/v1/auth/health`.
- Ejecuta una busqueda inicial de leads LATAM con `People API Search`.

Resultado actual:

- La API key funciona si `/v1/auth/health` responde `healthy: true` e `is_logged_in: true`.
- Para buscar leads nuevos con `/api/v1/mixed_people/api_search`, Apollo requiere un plan con acceso a Search API.
- Con plan Basic, la busqueda inicial de prueba ya responde resultados reales.

## 7. Flujo MVP

```text
Crear busqueda LATAM
  -> llamar People API Search
  -> guardar candidatos sin enriquecer
  -> calcular score Tecnotitan
  -> enriquecer solo leads priorizados
  -> exportar/contactar
```
