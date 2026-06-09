# Reglas De Deduplicacion

## Objetivo

Evitar que el CRM cree contactos, empresas u oportunidades duplicadas cuando Apollo devuelve el mismo lead en busquedas diferentes o cuando faltan IDs externos.

## Empresas

Orden de deduplicacion:

1. `apollo_organization_id`
2. `domain`
3. `name + country`, solo cuando no hay dominio ni Apollo ID

Indices agregados:

```text
uniq_companies_domain_active
uniq_companies_name_country_without_domain_active
```

## Contactos

Orden de deduplicacion:

1. `apollo_person_id`
2. `email`
3. `linkedin_url`
4. `full_name + company_id`, solo cuando no hay Apollo ID, email ni LinkedIn

Indices agregados:

```text
uniq_contacts_email_active
uniq_contacts_linkedin_active
uniq_contacts_name_company_without_external_ids_active
```

## Oportunidades

Una oportunidad es unica por:

```text
contact_id + lead_type + target_region
```

Esto permite que el mismo contacto pueda existir en contextos diferentes si realmente aplica.

## Busquedas

Cada ejecucion de busqueda se guarda en `lead_searches`.

Aunque un contacto ya exista, la nueva busqueda queda registrada para medir que plantillas y filtros encuentran buenos leads.

## Resultado validado

Antes de repetir busqueda:

```text
active_companies: 2
contacts: 2
opportunities: 2
```

Despues de repetir una busqueda que devolvio el mismo lead:

```text
active_companies: 2
contacts: 2
opportunities: 2
lead_searches: 5
```

Conclusion:

El CRM registra la nueva busqueda, pero reutiliza contacto, empresa y oportunidad existentes.
