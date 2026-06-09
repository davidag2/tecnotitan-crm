# Plantillas De Busqueda Apollo

## Objetivo

Las plantillas permiten ejecutar busquedas consistentes desde el CRM sin escribir filtros desde cero cada vez.

Cada plantilla define:

- `template_key`
- `lead_type`
- `target_region`
- nombre visible
- descripcion
- filtros Apollo por defecto
- filtros editables desde la interfaz

## Plantillas iniciales

```text
consulting_client:latam
investor:usa
investor:latam
investor:europe
```

## 1. consulting_client:latam

Uso:

Buscar clientes potenciales de consultoria en America Latina.

Paises:

```text
Colombia, Mexico, Chile, Peru, Ecuador, Panama, Costa Rica, Argentina, Uruguay, Dominican Republic
```

Cargos:

```text
CEO, Founder, Co-Founder, CTO, CIO, Head of Technology, Head of IT,
IT Director, Technology Director, Digital Transformation Director,
Operations Director, COO, IT Manager, Technology Manager,
Operations Manager, Digital Transformation Manager, Innovation Manager,
Product Manager, Ecommerce Manager, Data Manager, BI Manager, Systems Manager
```

Rango de empleados:

```text
20-200
201-500
501-1000
```

## 2. investor:usa

Uso:

Buscar inversionistas en Estados Unidos.

Keywords:

```text
venture capital
```

## 3. investor:latam

Uso:

Buscar inversionistas en America Latina.

Paises:

```text
Colombia, Mexico, Brazil, Chile, Argentina, Peru, Uruguay, Panama
```

Keywords:

```text
venture capital
```

## 4. investor:europe

Uso:

Buscar inversionistas en Europa con posible interes en software, AI, B2B y LatAm.

Paises:

```text
Spain, United Kingdom, Germany, France, Netherlands, Switzerland, Portugal
```

Keywords:

```text
venture capital
```

## Endpoint para listar plantillas

```text
GET /api/search-templates
```

## Endpoint para ejecutar busqueda

```text
POST /api/apollo/search
```

Ejemplo:

```json
{
  "template_key": "consulting_client:latam",
  "page": 1,
  "per_page": 10
}
```

Ejemplo con override seguro:

```json
{
  "template_key": "consulting_client:latam",
  "page": 1,
  "per_page": 10,
  "filters": {
    "person_locations": ["Colombia"],
    "organization_num_employees_ranges": ["20,200"]
  }
}
```

Solo se aceptan filtros incluidos en `editable_filters` para esa plantilla.
