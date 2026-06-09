# Paso 20: Resultados De Busquedas Pequenas

## Pruebas ejecutadas

Se ejecutaron 5 busquedas pequenas con Apollo:

```text
Consultoria Colombia
Consultoria Mexico
Inversionistas USA venture capital
Inversionistas LATAM venture capital
Inversionistas Europa venture capital
```

Cada busqueda pidio 3 resultados.

## Resultados

```text
Consultoria Colombia: total 13884, returned 3, saved 3
Consultoria Mexico: total 34032, returned 3, saved 3
Inversionistas USA: total 701, returned 3, saved 3
Inversionistas LATAM: total 52, returned 3, saved 3
Inversionistas Europa: total 277, returned 3, saved 3
```

## Ajustes realizados

Las plantillas de inversionistas se ajustaron para usar:

```text
venture capital
```

Motivo:

Las expresiones largas con `OR` fueron demasiado restrictivas o no funcionaron bien como se esperaba en Apollo.

Tambien se ajusto el scoring de inversionistas para reconocer:

```text
Venture Capital Investor
```

como cargo senior de inversion.

## Observaciones

Consultoria:

- Colombia y Mexico tienen volumen alto.
- Los resultados iniciales traen cargos muy relevantes.
- Apollo Search no siempre trae datos suficientes de empresa, por eso el score depende mucho del cargo hasta aplicar enrichment.

Inversionistas:

- USA y Europa devuelven buenos resultados con `venture capital`.
- LATAM devuelve menos volumen, pero puede ser mas enfocado.
- El scoring mejora cuando la empresa/firma tiene contexto claro de venture, fund o capital.

## Reporte JSON

El reporte estructurado quedo en:

```text
search-quality-report.json
```
