# Scoring Para Clientes De Consultoria

## Objetivo

Priorizar leads de consultoria que tengan mayor probabilidad de convertirse en clientes para Tecnotitan.

## Rango

```text
0-100 puntos
```

Etiquetas:

```text
hot: 75+
warm: 45-74
cold: 20-44
unqualified: 0-19
```

## Factores

### Cargo

```text
Cargo decisor para consultoria: +25
Cargo operativo o tecnico relevante: +15
Cargo de baja prioridad: -10
```

### Pais

```text
Pais prioritario para consultoria: +15
Pais secundario para consultoria: +8
Ubicacion disponible fuera de prioridad: +3
```

Paises prioritarios:

```text
Colombia, Mexico, Chile, Peru, Ecuador, Panama, Costa Rica
```

### Industria

```text
Industria prioritaria para consultoria: +15
```

Industrias prioritarias:

```text
Ecommerce, Retail, Logistics, Healthcare, Education, Financial Services,
Real Estate, Construction, Manufacturing, Professional Services, SaaS,
Technology, Hospitality, Insurance, Agriculture
```

### Tamano De Empresa

```text
20-200 empleados: +15
201-500 empleados: +12
501-1000 empleados: +8
Menos de 20 empleados: -8
```

### Disponibilidad De Datos

```text
LinkedIn de contacto disponible: +10
Sitio web o dominio disponible: +5
LinkedIn de empresa disponible: +5
```

### Senales Tecnologicas

```text
Senales tecnologicas o digitales: +10
```

Keywords:

```text
software, technology, digital, automation, data, systems, ecommerce, crm, ai, intelligence
```

## Nota

El score es una ayuda para priorizar. No reemplaza revision humana. Una oportunidad con score bajo puede ser valiosa si existe una relacion, referral o necesidad conocida.

## Limitacion Actual

Apollo Search no siempre entrega pais, industria, dominio, LinkedIn de empresa o tamano de empresa en cada resultado.

Cuando esos datos faltan, el score puede depender principalmente del cargo.

El score sera mas completo despues de implementar enrichment selectivo.
