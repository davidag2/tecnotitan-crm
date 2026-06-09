# Tecnotitan CRM Interno

## Paso 1 de 20: Definir el objetivo del CRM

### Objetivo principal

Construir un CRM interno para Tecnotitan que centralice la busqueda, administracion y seguimiento de oportunidades comerciales, usando Apollo.io como fuente principal para descubrir y enriquecer leads.

El CRM tendra dos lineas de trabajo:

1. Conseguir clientes de consultoria en America Latina.
2. Conseguir inversionistas para Tecnotitan en USA, America Latina y Europa.

### Problema que debe resolver

Tecnotitan necesita una herramienta propia para:

- Encontrar leads B2B relevantes.
- Separar oportunidades comerciales de oportunidades de inversion.
- Guardar contactos y empresas en una base propia.
- Calificar leads segun el fit con Tecnotitan.
- Hacer seguimiento comercial sin depender completamente de Apollo.
- Registrar notas, actividades, estados y proximos pasos.
- Medir que busquedas, paises, cargos e industrias generan mejores resultados.

### Que papel cumple Apollo

Apollo no sera el CRM principal. Apollo sera el motor externo para:

- Buscar contactos y empresas.
- Enriquecer contactos seleccionados.
- Obtener datos profesionales y empresariales.
- Alimentar el CRM interno con leads nuevos.

El CRM de Tecnotitan sera donde se administran las relaciones, estados, notas, tareas, scoring y decisiones comerciales.

### Alcance inicial del MVP

La primera version debe permitir:

- Crear busquedas de leads desde filtros internos.
- Buscar leads en Apollo.
- Guardar resultados en base de datos propia.
- Clasificar cada lead como `consulting_client` o `investor`.
- Calcular un score basico.
- Ver leads en una tabla interna.
- Cambiar estado del lead.
- Agregar notas.
- Exportar leads a CSV.

### Fuera del alcance inicial

Para no inflar el MVP, inicialmente no construiremos:

- Automatizacion completa de emails.
- Sincronizacion bidireccional con Apollo.
- Integracion profunda con LinkedIn.
- Integracion con WhatsApp.
- Automatizacion avanzada con IA.
- Reportes financieros complejos.
- Multiempresa o modo SaaS.

Estas funciones pueden agregarse despues de validar que el CRM interno realmente ayuda a Tecnotitan a conseguir clientes e inversionistas.

### Usuarios internos esperados

Inicialmente:

- Fundador / direccion de Tecnotitan.
- Equipo comercial o de crecimiento, si existe.
- Equipo encargado de fundraising, si existe.

### Resultado esperado del CRM

El CRM debe ayudar a Tecnotitan a responder preguntas como:

- Que empresas en America Latina tienen mayor fit para consultoria?
- Que decisores debemos contactar primero?
- Que inversionistas parecen mas alineados con Tecnotitan?
- En que estado esta cada oportunidad?
- Que leads necesitan seguimiento?
- Que paises, cargos o industrias estan funcionando mejor?

### Decision del paso 1

El CRM interno de Tecnotitan sera una herramienta de prospeccion y seguimiento con dos tipos de oportunidades:

- Clientes de consultoria en America Latina.
- Inversionistas en USA, America Latina y Europa.

Apollo sera usado como fuente de datos y enriquecimiento, mientras que la gestion comercial vivira en el CRM propio.

## Paso 2 de 20: Separar los dos tipos de leads

### Decision principal

El CRM manejara dos tipos principales de lead:

```text
consulting_client
investor
```

Estos tipos viviran en el mismo sistema, pero tendran reglas, filtros, pipelines y scoring diferentes.

### Tipo 1: consulting_client

Representa una empresa o contacto que podria contratar servicios de consultoria de Tecnotitan.

Ejemplos:

- Una empresa de ecommerce que necesita automatizacion.
- Una compania logistica que necesita software interno.
- Una empresa de salud que necesita integraciones o sistemas.
- Una pyme o empresa mediana que necesita transformacion digital.

Contactos objetivo:

- CEO
- Founder
- CTO
- CIO
- IT Manager
- Operations Manager
- Digital Transformation Manager
- Ecommerce Manager

Objetivo comercial:

Convertir el lead en una oportunidad de consultoria, diagnostico, propuesta y contrato.

### Tipo 2: investor

Representa una persona, fondo o firma que podria invertir en Tecnotitan.

Ejemplos:

- Angel investor.
- Venture capital partner.
- Family office.
- Startup advisor con red de inversion.
- Fondo early-stage.
- Venture studio.

Contactos objetivo:

- Angel Investor
- Investor
- Managing Partner
- General Partner
- Venture Partner
- Principal
- Investment Manager
- Fund Manager
- Startup Advisor

Objetivo comercial:

Convertir el lead en una conversacion de inversion, intro, envio de deck, reunion y posible compromiso.

### Por que no mezclar ambos tipos

Aunque ambos son leads, no deben tratarse igual:

- Un cliente de consultoria compra servicios.
- Un inversionista evalua riesgo, vision, traccion y potencial.
- Los mensajes de contacto son distintos.
- Los estados del pipeline son distintos.
- Los criterios de scoring son distintos.
- Las metricas de exito son distintas.

Separarlos desde el inicio evita que el CRM se vuelva confuso.

### Campo principal en la base de datos

Cada contacto o oportunidad tendra un campo obligatorio:

```text
lead_type
```

Valores permitidos:

```text
consulting_client
investor
```

### Reglas iniciales

- Todo lead debe tener un `lead_type`.
- Una misma persona podria aparecer en ambos contextos, pero el CRM debe tratarlo como oportunidades separadas si los objetivos son diferentes.
- Una empresa puede ser cliente potencial y tambien tener un brazo de inversion, pero se debe diferenciar el contexto comercial.
- Las busquedas en Apollo deben crearse desde una plantilla asociada a un `lead_type`.
- El pipeline visible debe depender del `lead_type`.
- El scoring debe depender del `lead_type`.

### Implicacion para la interfaz

El CRM tendra vistas separadas:

- Leads de consultoria.
- Leads de inversionistas.
- Todas las oportunidades.

Tambien podra tener filtros por:

- Tipo de lead.
- Pais.
- Estado.
- Score.
- Fuente.
- Responsable.

### Decision del paso 2

Tecnotitan CRM usara `lead_type` como campo central para diferenciar clientes de consultoria e inversionistas. Esta separacion guiara las busquedas en Apollo, los pipelines, el scoring, las pantallas y los reportes.

## Paso 3 de 20: Definir los paises objetivo

### Decision principal

El CRM manejara paises objetivo diferentes segun el tipo de lead:

- Clientes de consultoria: America Latina.
- Inversionistas: USA, America Latina y Europa.

### Paises objetivo para clientes de consultoria

Para el MVP, Tecnotitan priorizara paises de America Latina donde sea razonable vender consultoria tecnologica en espanol y operar comercialmente con menor friccion.

Paises prioritarios:

```text
Colombia
Mexico
Chile
Peru
Ecuador
Panama
Costa Rica
Argentina
Uruguay
Dominican Republic
```

Paises secundarios:

```text
Brazil
Guatemala
El Salvador
Honduras
Paraguay
Bolivia
```

Notas:

- Brazil se considera secundario inicialmente por idioma.
- Colombia puede ser el primer mercado natural por cercania operativa.
- Mexico, Chile y Peru deben ser mercados fuertes para busquedas tempranas.
- Panama, Costa Rica y Uruguay pueden ser interesantes por concentracion de empresas regionales.

### Paises objetivo para inversionistas

Para inversionistas, Tecnotitan buscara contactos en tres regiones:

1. USA.
2. America Latina.
3. Europa.

Paises prioritarios USA:

```text
United States
```

Paises prioritarios America Latina:

```text
Colombia
Mexico
Brazil
Chile
Argentina
Peru
Uruguay
Panama
```

Paises prioritarios Europa:

```text
Spain
United Kingdom
Germany
France
Netherlands
Switzerland
Portugal
```

Notas:

- USA sera clave para inversionistas con experiencia en software, B2B, SaaS, AI y mercados emergentes.
- Spain y Portugal pueden ser utiles por cercania cultural e interes en LatAm.
- United Kingdom, Germany, France, Netherlands y Switzerland pueden aportar fondos europeos con tesis internacional.
- Brazil se incluye para inversionistas aunque sea secundario en consultoria, porque tiene ecosistema fuerte de venture capital.

### Como se usaran estos paises en Apollo

Las busquedas en Apollo usaran filtros de ubicacion como:

```text
person_locations
organization_locations
```

Para consultoria, las busquedas deben enfocarse principalmente en ubicacion de la empresa y/o persona dentro de America Latina.

Para inversionistas, las busquedas deben enfocarse en personas y firmas ubicadas en USA, America Latina y Europa.

### Como se usaran estos paises en el CRM

El CRM debera guardar:

- `person_country`
- `person_city`
- `company_country`
- `company_city`
- `target_region`

Valores sugeridos para `target_region`:

```text
latam
usa
europe
```

### Reglas iniciales

- Todo lead debe tener pais si Apollo lo entrega.
- Si el pais no viene claro, el CRM debe permitir clasificarlo manualmente.
- El score debe dar mas peso a paises prioritarios.
- Las busquedas deben empezar por paises prioritarios antes de expandirse a secundarios.
- Los reportes deben permitir comparar resultados por pais y region.

### Decision del paso 3

Tecnotitan priorizara America Latina para clientes de consultoria, y buscara inversionistas en USA, America Latina y Europa. El CRM guardara pais, ciudad y region objetivo para permitir filtros, scoring y reportes por mercado.

## Paso 4 de 20: Definir el ICP para clientes de consultoria

### Decision principal

El ICP inicial de consultoria para Tecnotitan sera:

Empresas en America Latina, preferiblemente medianas o en crecimiento, que tengan necesidades de software, automatizacion, integracion de sistemas, inteligencia artificial, transformacion digital o mejora de procesos.

### Tipo de cliente ideal

Tecnotitan buscara empresas que:

- Tengan procesos operativos que puedan automatizarse.
- Usen herramientas desconectadas entre si.
- Necesiten software interno o sistemas a medida.
- Tengan crecimiento, expansion o complejidad operativa.
- Vendan por canales digitales o quieran digitalizar ventas.
- Manejen datos, clientes, inventario, operaciones o reportes manualmente.
- Tengan presupuesto para consultoria o desarrollo tecnologico.

### Tamano de empresa objetivo

Rangos iniciales:

```text
20-200 empleados
201-500 empleados
501-1000 empleados
```

Prioridad:

1. 20-200 empleados: buena oportunidad para soluciones practicas y relacion cercana.
2. 201-500 empleados: mayor presupuesto y mas necesidades internas.
3. 501-1000 empleados: procesos mas complejos, ciclo comercial posiblemente mas largo.

Empresas muy pequenas pueden ser descartadas inicialmente si no muestran alto potencial.

### Industrias prioritarias

Industrias iniciales para consultoria:

```text
Ecommerce
Retail
Logistics
Healthcare
Education
Financial Services
Real Estate
Construction
Manufacturing
Professional Services
SaaS
Technology
Hospitality
Insurance
Agriculture
```

### Industrias especialmente atractivas

Estas industrias pueden recibir mayor score porque suelen tener procesos, datos o integraciones que Tecnotitan podria mejorar:

- Ecommerce y retail: automatizacion de ventas, inventario, CRM, datos y operaciones.
- Logistica: trazabilidad, optimizacion, integraciones y software operativo.
- Salud: sistemas internos, agendamiento, datos, automatizacion y cumplimiento.
- Educacion: plataformas, CRM academico, automatizacion y analitica.
- Servicios financieros e insurance: flujos internos, datos, integraciones y reportes.
- Construccion y real estate: CRM, operaciones, documentos, seguimiento y automatizacion.
- Manufactura: operaciones, inventario, reportes y control de procesos.

### Senales de buen fit

Un lead de consultoria tendra buen fit si Apollo o la revision manual muestran:

- Crecimiento reciente.
- Presencia digital activa.
- Equipo tecnologico pequeno o mediano.
- Uso de varias herramientas SaaS.
- Operacion regional o multi-sede.
- Procesos comerciales o logisticos complejos.
- Cargo decisor disponible.
- Empresa con 20 a 1000 empleados.
- Sitio web profesional.
- LinkedIn de empresa activo.

### Senales de bajo fit

Un lead puede recibir bajo score si:

- Es una empresa muy pequena sin presupuesto aparente.
- No tiene sitio web claro.
- No hay contacto decisor.
- Opera en un sector poco alineado con tecnologia.
- Parece una entidad gubernamental compleja para vender en MVP.
- Tiene datos incompletos o baja trazabilidad.

### Filtros Apollo sugeridos para este ICP

Filtros base:

```json
{
  "person_locations": ["Colombia", "Mexico", "Chile", "Peru"],
  "organization_num_employees_ranges": ["20,200", "201,500", "501,1000"],
  "person_titles": [
    "CEO",
    "Founder",
    "CTO",
    "CIO",
    "IT Manager",
    "Operations Manager",
    "Digital Transformation Manager",
    "Ecommerce Manager"
  ]
}
```

Estos filtros se ajustaran segun calidad de resultados.

### Campos relevantes para scoring

Para clientes de consultoria, el CRM debe evaluar:

- Pais.
- Industria.
- Tamano de empresa.
- Cargo del contacto.
- Seniority.
- Disponibilidad de LinkedIn.
- Disponibilidad de email enriquecido.
- Empresa con sitio web.
- Empresa con senales de tecnologia o transformacion digital.

### Decision del paso 4

El ICP inicial de consultoria se enfocara en empresas medianas o en crecimiento en America Latina, con necesidades claras de software, automatizacion, integracion, datos o transformacion digital. El CRM usara este ICP para construir busquedas Apollo, calcular score y priorizar contactos.

## Paso 5 de 20: Definir el ICP para inversionistas

### Decision principal

El ICP inicial de inversionistas para Tecnotitan sera:

Personas, fondos y firmas de inversion ubicadas en USA, America Latina y Europa, con interes potencial en tecnologia, software, B2B, inteligencia artificial, automatizacion, mercados emergentes o startups con operacion en America Latina.

### Tipo de inversionista ideal

Tecnotitan buscara inversionistas que:

- Inviertan en software, SaaS, AI, automatizacion, B2B o tecnologia aplicada.
- Tengan experiencia con startups en etapa temprana o crecimiento.
- Conozcan o tengan interes en America Latina.
- Tengan capacidad de escribir cheques o abrir puertas relevantes.
- Sean decision-makers dentro de fondos o redes de inversion.
- Tengan historial de inversion, advisory o participacion en startups.
- Puedan aportar capital, red comercial, estrategia o expansion internacional.

### Categorias de inversionista

Categorias iniciales:

```text
Angel Investor
Venture Capital
Micro VC
Family Office
Corporate Venture Capital
Venture Studio
Startup Accelerator
Startup Advisor
Investment Firm
Private Investor
```

### Etapas de inversion objetivo

Etapas relevantes para Tecnotitan:

```text
Pre-seed
Seed
Early-stage
Series A
```

Prioridad:

1. Angels y micro VCs: mayor probabilidad de conversaciones tempranas.
2. Fondos seed y early-stage: buen fit si Tecnotitan tiene traccion clara.
3. Family offices: utiles si tienen tesis flexible o interes regional.
4. Corporate VC: interesante, pero ciclo posiblemente mas largo.

### Regiones objetivo

Regiones iniciales:

```text
usa
latam
europe
```

Paises prioritarios:

- USA: United States.
- LATAM: Colombia, Mexico, Brazil, Chile, Argentina, Peru, Uruguay, Panama.
- Europa: Spain, United Kingdom, Germany, France, Netherlands, Switzerland, Portugal.

### Cargos objetivo

Cargos iniciales para Apollo:

```text
Angel Investor
Investor
Managing Partner
General Partner
Venture Partner
Partner
Principal
Investment Manager
Fund Manager
Startup Advisor
Investment Director
Head of Investments
Founder
Co-Founder
```

Notas:

- `Founder` y `Co-Founder` solo deben usarse en busquedas de personas con contexto de inversion, fondos, venture studios o startups relevantes.
- `Managing Partner`, `General Partner` y `Partner` deben recibir mayor score.
- `Principal` e `Investment Manager` pueden ser buenos para iniciar conversaciones, aunque no siempre deciden solos.

### Sectores o tesis de interes

Palabras clave y tesis que pueden indicar buen fit:

```text
Software
SaaS
B2B
Artificial Intelligence
AI
Automation
Data
Developer Tools
Enterprise Software
Emerging Markets
Latin America
Fintech
Productivity
Digital Transformation
```

### Senales de buen fit

Un inversionista tendra buen fit si:

- Tiene cargo senior en fondo o firma.
- Menciona SaaS, AI, B2B, software o LatAm.
- Ha invertido o trabajado con startups.
- Tiene LinkedIn disponible.
- Pertenece a una firma reconocible.
- Esta ubicado en una region objetivo.
- Tiene experiencia en mercados emergentes.
- Puede aportar red comercial o expansion internacional.

### Senales de bajo fit

Un inversionista puede recibir bajo score si:

- No tiene relacion clara con inversion.
- Esta enfocado en etapas muy tardias.
- Invierte solo en sectores no relacionados.
- No tiene firma, fondo o historial verificable.
- Su ubicacion no coincide con las regiones objetivo.
- Su rol parece operativo y no relacionado con inversion.

### Filtros Apollo sugeridos para inversionistas

Busqueda inicial USA:

```json
{
  "person_locations": ["United States"],
  "person_titles": [
    "Angel Investor",
    "Managing Partner",
    "General Partner",
    "Venture Partner",
    "Principal",
    "Investment Manager"
  ],
  "q_keywords": "SaaS OR AI OR B2B OR Software OR Latin America"
}
```

Busqueda inicial LATAM:

```json
{
  "person_locations": ["Colombia", "Mexico", "Brazil", "Chile", "Argentina", "Peru"],
  "person_titles": [
    "Angel Investor",
    "Investor",
    "Managing Partner",
    "Partner",
    "Principal",
    "Investment Manager"
  ],
  "q_keywords": "startup OR venture capital OR SaaS OR AI OR software"
}
```

Busqueda inicial Europa:

```json
{
  "person_locations": ["Spain", "United Kingdom", "Germany", "France", "Netherlands", "Switzerland", "Portugal"],
  "person_titles": [
    "Angel Investor",
    "Managing Partner",
    "General Partner",
    "Venture Partner",
    "Principal",
    "Investment Manager"
  ],
  "q_keywords": "SaaS OR AI OR B2B OR Software OR emerging markets OR Latin America"
}
```

### Campos relevantes para scoring

Para inversionistas, el CRM debe evaluar:

- Region.
- Pais.
- Cargo.
- Seniority.
- Firma o fondo.
- Keywords relacionadas con inversion.
- Keywords relacionadas con tecnologia.
- Interes potencial en LatAm.
- LinkedIn disponible.
- Email enriquecido disponible.

### Decision del paso 5

El ICP inicial de inversionistas se enfocara en angels, partners, principals, investment managers, fondos y firmas con interes potencial en software, AI, B2B, automatizacion, mercados emergentes o America Latina. El CRM usara este ICP para crear busquedas Apollo, calcular score y separar inversionistas por region.

## Paso 6 de 20: Definir cargos objetivo para consultoria

### Decision principal

Para clientes de consultoria, Tecnotitan buscara contactos con capacidad de decision, influencia tecnica u ownership operativo sobre problemas que puedan resolverse con software, automatizacion, datos o inteligencia artificial.

### Cargos prioridad alta

Estos cargos deben recibir mayor score porque suelen tener poder de decision o influencia directa sobre presupuestos tecnologicos.

```text
CEO
Founder
Co-Founder
CTO
CIO
Chief Technology Officer
Chief Information Officer
Head of Technology
Head of IT
IT Director
Technology Director
Digital Transformation Director
Operations Director
Chief Operating Officer
COO
```

Motivo:

- Pueden aprobar proyectos.
- Entienden dolor operativo o tecnologico.
- Tienen visibilidad de presupuesto.
- Pueden iniciar una conversacion estrategica.

### Cargos prioridad media

Estos cargos pueden no aprobar solos, pero suelen conocer problemas concretos y pueden abrir puertas internas.

```text
IT Manager
Technology Manager
Operations Manager
Digital Transformation Manager
Innovation Manager
Product Manager
Project Manager
Ecommerce Manager
CRM Manager
Data Manager
Business Intelligence Manager
Systems Manager
Software Development Manager
Engineering Manager
```

Motivo:

- Conocen necesidades reales.
- Pueden impulsar proyectos internamente.
- Pueden conectar con directores o gerencia.
- Son buenos para discovery tecnico y operativo.

### Cargos prioridad exploratoria

Estos cargos pueden ser utiles dependiendo de industria, pero deben recibir menor score inicial hasta validar calidad.

```text
Marketing Manager
Sales Manager
Customer Success Manager
Finance Manager
HR Manager
Supply Chain Manager
Logistics Manager
Procurement Manager
Administrative Manager
```

Motivo:

- Pueden tener procesos manuales o dolores especificos.
- Pueden necesitar automatizaciones o dashboards.
- No siempre compran tecnologia, pero pueden ser usuarios clave.

### Cargos a evitar inicialmente

Para el MVP, estos cargos no deben ser prioridad salvo que aparezcan en una empresa con muy buen fit.

```text
Intern
Assistant
Junior Analyst
Student
Consultant
Freelancer
Administrative Assistant
Recruiter
Account Executive
Sales Representative
```

Motivo:

- Baja probabilidad de decision.
- Menor acceso a presupuesto.
- Menor capacidad para mover una oportunidad comercial.

### Variantes en espanol y portugues

Apollo puede devolver cargos en ingles, espanol o portugues. El CRM debe reconocer variantes.

Variantes en espanol:

```text
Gerente de Tecnologia
Gerente de TI
Director de Tecnologia
Director de TI
Jefe de Tecnologia
Jefe de Sistemas
Gerente de Sistemas
Director de Operaciones
Gerente de Operaciones
Director de Transformacion Digital
Gerente de Transformacion Digital
Gerente de Innovacion
Gerente de Ecommerce
Gerente de Producto
```

Variantes en portugues:

```text
Gerente de Tecnologia
Diretor de Tecnologia
Diretor de TI
Gerente de TI
Head de Tecnologia
Gerente de Operacoes
Diretor de Operacoes
Gerente de Transformacao Digital
```

### Filtros Apollo iniciales

Primer bloque de busqueda recomendado:

```json
{
  "person_titles": [
    "CEO",
    "Founder",
    "Co-Founder",
    "CTO",
    "CIO",
    "Head of Technology",
    "Head of IT",
    "IT Director",
    "Technology Director",
    "Digital Transformation Director",
    "Operations Director",
    "COO"
  ]
}
```

Segundo bloque de busqueda recomendado:

```json
{
  "person_titles": [
    "IT Manager",
    "Technology Manager",
    "Operations Manager",
    "Digital Transformation Manager",
    "Innovation Manager",
    "Product Manager",
    "Ecommerce Manager",
    "Data Manager",
    "Business Intelligence Manager",
    "Systems Manager"
  ]
}
```

### Reglas de scoring por cargo

Puntaje sugerido:

```text
Prioridad alta: +25
Prioridad media: +15
Prioridad exploratoria: +5
Cargos a evitar: -10
```

Reglas adicionales:

- Si el cargo contiene `Founder`, `CEO`, `CTO`, `CIO`, `Director`, `Head`, sumar prioridad alta.
- Si el cargo contiene `Manager`, sumar prioridad media salvo que sea cargo no relevante.
- Si el cargo contiene `Intern`, `Assistant`, `Junior` o `Student`, penalizar.

### Decision del paso 6

Tecnotitan priorizara cargos ejecutivos, tecnologicos, operativos y de transformacion digital para clientes de consultoria. Estos cargos seran usados en Apollo Search, scoring, filtros del CRM y recomendaciones de contacto.

## Paso 7 de 20: Definir cargos objetivo para inversionistas

### Decision principal

Para inversionistas, Tecnotitan buscara contactos con capacidad de decision, influencia en comites de inversion, acceso a redes de capital o experiencia en startups de tecnologia.

### Cargos prioridad alta

Estos cargos deben recibir mayor score porque suelen tener capacidad de decision o influencia fuerte en inversiones.

```text
Angel Investor
Managing Partner
General Partner
Founding Partner
Venture Partner
Partner
Investment Partner
Fund Manager
Founder
Co-Founder
CEO
Chairman
Board Member
```

Motivo:

- Pueden decidir o influir directamente en una inversion.
- Suelen tener red de inversionistas.
- Pueden hacer intros a otros fondos o angels.
- Pueden evaluar vision, mercado y equipo.

### Cargos prioridad media

Estos cargos pueden abrir conversaciones, hacer screening o llevar oportunidades hacia partners.

```text
Principal
Investment Principal
Investment Director
Investment Manager
Venture Associate
Investment Associate
Senior Associate
Startup Advisor
Venture Builder
Portfolio Manager
Head of Investments
Head of Venture
Director of Investments
```

Motivo:

- Suelen revisar oportunidades.
- Pueden recomendar startups internamente.
- Pueden coordinar reuniones con decision-makers.
- Son utiles para primera validacion.

### Cargos prioridad exploratoria

Estos cargos pueden ser utiles si tienen contexto de startups, fondos o tecnologia, pero deben validarse mejor.

```text
Advisor
Mentor
Accelerator Manager
Program Manager
Innovation Manager
Corporate Venture Manager
Business Development Manager
Startup Program Lead
Ecosystem Manager
Community Manager
```

Motivo:

- Pueden conectar con redes de inversion.
- Pueden dar acceso a aceleradoras o programas.
- No siempre invierten directamente.

### Cargos a evitar inicialmente

Estos cargos deben recibir bajo score salvo que haya senales claras de inversion.

```text
Analyst
Junior Analyst
Intern
Assistant
Recruiter
Sales Representative
Marketing Specialist
Student
Administrative Assistant
Account Executive
```

Motivo:

- Baja capacidad de decision.
- Poca influencia en inversion.
- Probabilidad menor de conversacion util para fundraising.

### Firmas y contextos relevantes

El cargo debe interpretarse junto con la organizacion. Un `Partner` puede ser muy valioso si trabaja en:

```text
Venture Capital
Investment Firm
Family Office
Angel Network
Venture Studio
Startup Accelerator
Corporate Venture Capital
Private Equity
Startup Ecosystem
```

Pero puede ser menos relevante si trabaja en una empresa sin relacion con inversion.

### Variantes en espanol

Apollo puede devolver cargos en espanol para LATAM y Espana.

```text
Inversionista Angel
Inversionista
Socio Director
Socio Fundador
Socio
Director de Inversiones
Gerente de Inversiones
Responsable de Inversiones
Director de Venture Capital
Asesor de Startups
Mentor de Startups
Miembro de Junta
```

### Variantes en portugues

Para Brasil y Portugal:

```text
Investidor Anjo
Investidor
Socio Diretor
Socio Fundador
Socio
Diretor de Investimentos
Gerente de Investimentos
Head de Investimentos
Consultor de Startups
Mentor de Startups
Membro do Conselho
```

### Filtros Apollo iniciales

Bloque de busqueda para decision-makers:

```json
{
  "person_titles": [
    "Angel Investor",
    "Managing Partner",
    "General Partner",
    "Founding Partner",
    "Venture Partner",
    "Partner",
    "Investment Partner",
    "Fund Manager"
  ]
}
```

Bloque de busqueda para operadores de inversion:

```json
{
  "person_titles": [
    "Principal",
    "Investment Principal",
    "Investment Director",
    "Investment Manager",
    "Venture Associate",
    "Investment Associate",
    "Startup Advisor",
    "Head of Investments"
  ]
}
```

Bloque exploratorio:

```json
{
  "person_titles": [
    "Advisor",
    "Mentor",
    "Accelerator Manager",
    "Program Manager",
    "Corporate Venture Manager",
    "Startup Program Lead",
    "Ecosystem Manager"
  ]
}
```

### Reglas de scoring por cargo

Puntaje sugerido:

```text
Prioridad alta: +30
Prioridad media: +18
Prioridad exploratoria: +8
Cargos a evitar: -10
```

Reglas adicionales:

- Si el cargo contiene `Managing Partner`, `General Partner`, `Angel Investor`, `Founding Partner` o `Fund Manager`, sumar prioridad alta.
- Si el cargo contiene `Principal`, `Investment Manager`, `Investment Director` o `Associate`, sumar prioridad media.
- Si el cargo contiene `Analyst`, `Intern`, `Assistant` o `Student`, penalizar.
- Si el cargo es generico como `Founder` o `CEO`, solo sumar alto si la empresa/firma tiene contexto de inversion, venture, startup studio, angel network o family office.

### Decision del paso 7

Tecnotitan priorizara inversionistas con cargos senior en fondos, firmas, redes angel, family offices, venture studios y aceleradoras. El CRM evaluara cargo y contexto de organizacion juntos para evitar falsos positivos.

## Paso 8 de 20: Disenar los pipelines

### Decision principal

El CRM tendra dos pipelines separados:

```text
consulting_pipeline
investor_pipeline
```

Cada pipeline tendra estados propios porque vender consultoria y levantar inversion son procesos diferentes.

### Pipeline para clientes de consultoria

Estados:

```text
new
qualified
to_contact
contacted
discovery_scheduled
discovery_completed
proposal_sent
negotiation
won
lost
discarded
```

### Descripcion de estados de consultoria

`new`

Lead recien encontrado o importado. Aun no ha sido revisado.

`qualified`

Lead revisado y considerado con fit para Tecnotitan.

`to_contact`

Lead listo para contactar. Tiene suficiente informacion para iniciar outreach.

`contacted`

Ya se hizo primer contacto por email, LinkedIn, WhatsApp, llamada u otro canal.

`discovery_scheduled`

El lead agendo una llamada de diagnostico o discovery.

`discovery_completed`

La llamada ocurrio y se identificaron necesidades, dolores, presupuesto o siguiente paso.

`proposal_sent`

Tecnotitan envio propuesta comercial, diagnostico, cotizacion o alcance inicial.

`negotiation`

Hay conversacion activa sobre precio, alcance, tiempos o condiciones.

`won`

Oportunidad ganada. El cliente acepto iniciar trabajo.

`lost`

Oportunidad perdida. No se cerro, pero fue una oportunidad real.

`discarded`

Lead descartado antes de convertirse en oportunidad real.

### Pipeline para inversionistas

Estados:

```text
identified
qualified
intro_needed
to_contact
contacted
responded
deck_sent
meeting_scheduled
meeting_completed
due_diligence
committed
passed
discarded
```

### Descripcion de estados de inversionistas

`identified`

Inversionista encontrado por Apollo u otra fuente. Aun no ha sido revisado.

`qualified`

Inversionista revisado y considerado con fit potencial.

`intro_needed`

Seria mejor llegar por introduccion que por contacto frio.

`to_contact`

Listo para contactar directamente.

`contacted`

Ya se envio primer mensaje.

`responded`

El inversionista respondio o mostro algun nivel de interes.

`deck_sent`

Se envio deck, resumen ejecutivo o informacion inicial de Tecnotitan.

`meeting_scheduled`

Hay reunion agendada.

`meeting_completed`

La reunion ocurrio y se registraron notas.

`due_diligence`

El inversionista esta revisando informacion adicional, traccion, numeros, mercado o documentos.

`committed`

El inversionista manifesto compromiso o intencion concreta de invertir.

`passed`

El inversionista decidio no participar.

`discarded`

Lead descartado antes de convertirse en oportunidad real.

### Estados finales

Estados finales para consultoria:

```text
won
lost
discarded
```

Estados finales para inversionistas:

```text
committed
passed
discarded
```

### Reglas de uso

- Cada lead debe tener un pipeline segun su `lead_type`.
- Un `consulting_client` no debe usar estados de inversionistas.
- Un `investor` no debe usar estados de consultoria.
- Todo cambio de estado debe registrar fecha y usuario.
- El CRM debe guardar historial de cambios de estado.
- Las notas y actividades deben asociarse al lead y al estado actual.
- Los estados finales no deben avanzar automaticamente.

### Campos necesarios para pipeline

Campos sugeridos:

```text
lead_type
pipeline_status
pipeline_stage_changed_at
pipeline_stage_changed_by
last_activity_at
next_follow_up_at
owner_user_id
lost_reason
discard_reason
```

Para inversionistas:

```text
intro_source
deck_sent_at
meeting_date
commitment_amount
```

Para consultoria:

```text
discovery_date
proposal_sent_at
estimated_deal_value
expected_close_date
```

### Razones de perdida o descarte

Consultoria:

```text
No budget
No need
Too small
Wrong industry
No response
Competitor selected
Timing not right
Bad data
```

Inversionistas:

```text
No fit
Wrong stage
Wrong sector
No LatAm interest
No response
Passed after review
Intro unavailable
Bad data
```

### Decision del paso 8

Tecnotitan CRM tendra pipelines separados para consultoria e inversionistas. Cada lead usara estados segun su `lead_type`, y el sistema guardara historial, responsable, fechas clave, proximo seguimiento y razones de perdida o descarte.

## Paso 9 de 20: Definir los campos principales del CRM

### Decision principal

El CRM debe guardar suficiente informacion para buscar, calificar, contactar y hacer seguimiento de leads, sin depender de Apollo como base principal.

Los campos se organizaran por:

- Identidad del contacto.
- Empresa o firma.
- Clasificacion comercial.
- Datos de contacto.
- Fuente Apollo.
- Pipeline.
- Scoring.
- Actividad y seguimiento.
- Campos especificos por tipo de lead.

### Campos de identidad del contacto

```text
id
apollo_person_id
first_name
last_name
full_name
title
seniority
linkedin_url
photo_url
person_country
person_city
person_state
```

Uso:

- Identificar a la persona.
- Evitar duplicados.
- Mostrar informacion principal en la tabla y detalle.
- Alimentar scoring por cargo, seniority y ubicacion.

### Campos de empresa o firma

```text
company_id
apollo_organization_id
company_name
company_domain
company_website_url
company_linkedin_url
company_industry
company_country
company_city
company_state
company_employee_count
company_employee_range
company_annual_revenue
company_phone
```

Uso:

- Agrupar contactos por empresa o fondo.
- Filtrar por industria, tamano y pais.
- Evaluar fit comercial.
- Evitar duplicados por dominio.

### Campos de clasificacion comercial

```text
lead_type
target_region
lead_source
lead_status
pipeline_status
owner_user_id
tags
```

Valores de `lead_type`:

```text
consulting_client
investor
```

Valores de `target_region`:

```text
latam
usa
europe
```

Valores de `lead_source`:

```text
apollo
manual
csv_import
referral
website
linkedin
other
```

### Campos de contacto

```text
email
email_status
phone
mobile_phone
contact_channels
preferred_contact_channel
```

Valores sugeridos para `email_status`:

```text
unknown
available
verified
guessed
unavailable
```

Valores sugeridos para `preferred_contact_channel`:

```text
email
linkedin
phone
whatsapp
intro
unknown
```

### Campos Apollo

```text
apollo_raw_payload
apollo_last_synced_at
apollo_enriched_at
apollo_enrichment_status
apollo_search_id
apollo_page
```

Valores sugeridos para `apollo_enrichment_status`:

```text
not_requested
requested
enriched
failed
not_available
```

Uso:

- Saber de que busqueda vino el lead.
- Guardar la respuesta original para auditoria.
- Evitar enriquecer dos veces sin necesidad.
- Registrar errores o datos faltantes.

### Campos de pipeline y seguimiento

```text
pipeline_stage_changed_at
pipeline_stage_changed_by
last_activity_at
next_follow_up_at
next_follow_up_type
lost_reason
discard_reason
```

Valores sugeridos para `next_follow_up_type`:

```text
email
linkedin
call
meeting
intro
proposal
deck
other
```

### Campos de scoring

```text
score
score_label
score_reasons
score_updated_at
```

Valores sugeridos para `score_label`:

```text
hot
warm
cold
unqualified
```

Uso:

- Priorizar leads.
- Explicar por que un lead tiene cierto puntaje.
- Comparar busquedas, paises, cargos e industrias.

### Campos especificos para consultoria

```text
consulting_need
estimated_deal_value
discovery_date
proposal_sent_at
expected_close_date
service_interest
```

Valores sugeridos para `service_interest`:

```text
software_development
automation
ai_consulting
data_dashboards
crm_implementation
systems_integration
digital_transformation
unknown
```

### Campos especificos para inversionistas

```text
investor_type
investment_stage
investment_thesis
intro_source
deck_sent_at
meeting_date
commitment_amount
commitment_currency
```

Valores sugeridos para `investor_type`:

```text
angel
vc
micro_vc
family_office
corporate_vc
venture_studio
accelerator
advisor
unknown
```

Valores sugeridos para `investment_stage`:

```text
pre_seed
seed
early_stage
series_a
growth
unknown
```

### Campos de auditoria

```text
created_at
updated_at
created_by
updated_by
deleted_at
```

Uso:

- Mantener trazabilidad.
- Permitir borrado logico.
- Saber quien creo o modifico un lead.

### Campos minimos para el MVP

Para no construir demasiado al inicio, el MVP debe empezar con:

```text
id
apollo_person_id
apollo_organization_id
first_name
last_name
full_name
title
linkedin_url
email
phone
company_name
company_domain
company_industry
company_employee_range
person_country
company_country
lead_type
target_region
lead_source
pipeline_status
score
score_label
owner_user_id
last_activity_at
next_follow_up_at
created_at
updated_at
```

### Decision del paso 9

Tecnotitan CRM guardara datos de contacto, empresa, clasificacion comercial, Apollo, pipeline, scoring y seguimiento. El MVP iniciara con un subconjunto minimo de campos, pero el modelo estara preparado para crecer hacia enriquecimiento, actividades, reportes y automatizaciones.

## Paso 10 de 20: Disenar la base de datos

### Decision principal

La base de datos inicial sera PostgreSQL. El CRM usara tablas separadas para contactos, empresas, busquedas Apollo, actividades, notas, oportunidades y logs de sincronizacion.

La estructura debe permitir:

- Guardar leads encontrados en Apollo.
- Separar clientes de consultoria e inversionistas.
- Evitar duplicados.
- Gestionar pipeline.
- Registrar notas y actividades.
- Medir busquedas y conversiones.
- Enriquecer datos sin perder trazabilidad.

### Tablas iniciales

```text
users
companies
contacts
opportunities
lead_searches
lead_search_results
activities
notes
tags
contact_tags
apollo_sync_logs
pipeline_events
```

### Tabla users

Guarda usuarios internos de Tecnotitan.

Campos:

```text
id
name
email
role
is_active
created_at
updated_at
```

Roles sugeridos:

```text
admin
sales
fundraising
viewer
```

### Tabla companies

Guarda empresas, fondos, firmas o instituciones.

Campos:

```text
id
apollo_organization_id
name
domain
website_url
linkedin_url
industry
country
city
state
employee_count
employee_range
annual_revenue
phone
raw_payload
created_at
updated_at
deleted_at
```

Indices sugeridos:

```text
apollo_organization_id
domain
name
country
industry
employee_range
```

### Tabla contacts

Guarda personas/contactos.

Campos:

```text
id
company_id
apollo_person_id
first_name
last_name
full_name
title
seniority
email
email_status
phone
mobile_phone
linkedin_url
photo_url
country
city
state
lead_source
apollo_raw_payload
apollo_last_synced_at
apollo_enriched_at
apollo_enrichment_status
created_at
updated_at
deleted_at
```

Indices sugeridos:

```text
apollo_person_id
email
linkedin_url
company_id
full_name
title
country
```

### Tabla opportunities

Representa la oportunidad comercial asociada a un contacto. Esta tabla permite que una persona pueda ser cliente potencial, inversionista o ambas cosas en contextos distintos.

Campos:

```text
id
contact_id
company_id
lead_type
target_region
pipeline_status
owner_user_id
score
score_label
score_reasons
service_interest
consulting_need
estimated_deal_value
expected_close_date
investor_type
investment_stage
investment_thesis
commitment_amount
commitment_currency
intro_source
last_activity_at
next_follow_up_at
next_follow_up_type
lost_reason
discard_reason
created_at
updated_at
deleted_at
```

Indices sugeridos:

```text
lead_type
pipeline_status
target_region
owner_user_id
score
next_follow_up_at
contact_id
company_id
```

### Tabla lead_searches

Guarda cada busqueda ejecutada en Apollo.

Campos:

```text
id
name
lead_type
target_region
search_template
filters
status
total_entries
pages_requested
results_saved
created_by
created_at
updated_at
```

Valores sugeridos para `status`:

```text
draft
running
completed
failed
cancelled
```

### Tabla lead_search_results

Relaciona una busqueda con contactos encontrados.

Campos:

```text
id
lead_search_id
contact_id
company_id
opportunity_id
apollo_person_id
apollo_organization_id
page
position
created_at
```

Uso:

- Saber de que busqueda vino un lead.
- Medir que busquedas producen mejores oportunidades.
- Evitar procesar resultados duplicados.

### Tabla activities

Guarda actividades de seguimiento.

Campos:

```text
id
opportunity_id
contact_id
company_id
user_id
activity_type
subject
body
activity_at
created_at
updated_at
```

Tipos sugeridos:

```text
email
linkedin
call
meeting
whatsapp
intro
proposal
deck
task
other
```

### Tabla notes

Guarda notas internas.

Campos:

```text
id
opportunity_id
contact_id
company_id
user_id
body
created_at
updated_at
deleted_at
```

### Tabla tags y contact_tags

Permite clasificar leads sin inflar columnas.

`tags`:

```text
id
name
color
created_at
```

`contact_tags`:

```text
id
contact_id
tag_id
created_at
```

### Tabla apollo_sync_logs

Guarda eventos de integracion con Apollo.

Campos:

```text
id
operation
endpoint
request_payload
response_status
response_payload
error_message
credits_used
contact_id
company_id
lead_search_id
created_at
```

Operaciones sugeridas:

```text
health_check
people_search
people_enrichment
bulk_people_enrichment
organization_search
organization_enrichment
```

### Tabla pipeline_events

Guarda historial de cambios de estado.

Campos:

```text
id
opportunity_id
from_status
to_status
changed_by
changed_at
note
```

Uso:

- Auditar cambios.
- Medir tiempo en cada etapa.
- Construir reportes de conversion.

### Relaciones principales

```text
companies 1 -> many contacts
contacts 1 -> many opportunities
companies 1 -> many opportunities
lead_searches 1 -> many lead_search_results
opportunities 1 -> many activities
opportunities 1 -> many notes
opportunities 1 -> many pipeline_events
users 1 -> many opportunities
users 1 -> many activities
users 1 -> many notes
```

### Deduplicacion

Reglas iniciales:

- Si `apollo_person_id` existe, usarlo como identificador principal.
- Si no existe, buscar por `email`.
- Si no hay email, buscar por `linkedin_url`.
- Si no hay LinkedIn, usar combinacion `full_name + company_id`.
- Empresas se deduplican por `apollo_organization_id`, luego `domain`, luego `name + country`.

### MVP de base de datos

Para la primera implementacion real, podemos empezar con:

```text
users
companies
contacts
opportunities
lead_searches
lead_search_results
apollo_sync_logs
```

Y agregar despues:

```text
activities
notes
tags
contact_tags
pipeline_events
```

### Decision del paso 10

Tecnotitan CRM usara PostgreSQL con una estructura centrada en `contacts`, `companies` y `opportunities`. Las oportunidades tendran `lead_type`, pipeline, score y owner, permitiendo que el mismo contacto pueda tener distintos contextos comerciales sin duplicar datos personales.

## Paso 11 de 20: Crear el backend

### Decision principal

Se creo un backend inicial para Tecnotitan CRM en Python, sin dependencias externas, para validar rapidamente los flujos base antes de conectar PostgreSQL o adoptar un framework como FastAPI.

Ubicacion:

```text
backend/
```

### Capacidades actuales

El backend inicial permite:

- Levantar un servidor local.
- Validar health check propio.
- Validar health check de Apollo.
- Exponer plantillas de busqueda.
- Ejecutar busquedas Apollo segun `lead_type` y `target_region`.
- Guardar leads temporalmente en memoria.
- Calcular score inicial.
- Listar leads encontrados durante la sesion.

### Endpoints iniciales

```text
GET /health
GET /api/apollo/health
GET /api/search-templates
GET /api/leads
POST /api/apollo/search
```

### Plantillas iniciales

```text
consulting_client:latam
investor:usa
investor:latam
investor:europe
```

### Ejecucion local

```powershell
C:\Users\david\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe -m backend.tecnotitan_crm.server
```

URL:

```text
http://127.0.0.1:8000
```

### Nota tecnica

Esta version usa almacenamiento en memoria. Eso significa que los leads se pierden al reiniciar el servidor.

La persistencia real se agregara cuando conectemos PostgreSQL.

### Decision del paso 11

El backend inicial quedo creado como una base ejecutable, simple y sin dependencias externas. Su objetivo es validar la integracion con Apollo, las plantillas de busqueda y el scoring antes de pasar a una base de datos persistente.

## Paso 12 de 20: Configurar PostgreSQL

### Decision principal

PostgreSQL sera la base persistente del CRM interno de Tecnotitan.

Se preparo la configuracion necesaria para correr PostgreSQL con Docker o con una instalacion local.

### Archivos creados

```text
docker-compose.yml
db/README.md
db/migrations/001_initial_schema.sql
```

### Variable de entorno agregada

```text
DATABASE_URL=postgresql://usuario:password@127.0.0.1:5432/tecnotitan_crm
```

### Tablas incluidas en la migracion inicial

```text
users
companies
contacts
opportunities
lead_searches
lead_search_results
activities
notes
tags
contact_tags
apollo_sync_logs
pipeline_events
```

### Tipos enum incluidos

```text
lead_type
target_region
lead_source
score_label
apollo_enrichment_status
search_status
user_role
```

### Indices principales

Se agregaron indices para:

- Deduplicacion por Apollo ID, email, LinkedIn y dominio.
- Filtros por pais, industria y region.
- Busqueda por pipeline.
- Ordenamiento por score.
- Seguimientos por `next_follow_up_at`.
- Logs de Apollo.
- Historial de pipeline.

### Estado local

Se detecto PostgreSQL instalado localmente:

```text
C:\Program Files\PostgreSQL\18\bin\psql.exe
```

Tambien se detecto el servicio activo:

```text
postgresql-x64-18
```

La conexion local requiere la contrasena del usuario `postgres`, por eso se creo un script que la solicita de forma local sin publicarla en el chat.

Tambien se detecto una base existente de otro proyecto:

```text
copiloto_pyme
```

Regla de seguridad:

```text
No ejecutar migraciones de Tecnotitan sobre copiloto_pyme.
```

La base de Tecnotitan se creo separada:

```text
tecnotitan_crm
```

Validacion realizada:

```text
database: tecnotitan_crm
app_user: tecnotitan
tables: 12
```

### Comando con Docker

```powershell
docker compose up -d
```

### Comando con PostgreSQL local

```powershell
.\scripts\setup_postgres.ps1
```

### Decision del paso 12

Tecnotitan CRM usara PostgreSQL como base persistente. La migracion inicial, variables de entorno y configuracion Docker quedaron preparadas. En esta maquina existe PostgreSQL 18 y se dejo un script para crear usuario, base de datos y aplicar la migracion con la contrasena local del usuario `postgres`.

## Paso 13 de 20: Guardar la API key de Apollo de forma segura

### Decision principal

La API key de Apollo se guardara solo en variables de entorno y sera usada exclusivamente desde el backend.

El frontend nunca debe recibir ni conocer la API key de Apollo.

### Archivos creados o actualizados

```text
SECURITY.md
.gitignore
scripts/check_config.py
scripts/check_git_secrets.ps1
```

### Variables seguras

```text
APOLLO_API_KEY
APOLLO_BASE_URL
DATABASE_URL
```

Estas variables viven en `.env`, que no debe versionarse.

### Regla de uso de Apollo

La API key debe enviarse con header:

```text
X-Api-Key
```

No debe enviarse como query parameter en la URL.

### Reglas de seguridad

- No imprimir la API key completa en logs.
- No enviar la API key al frontend.
- No guardar `.env` en git.
- No usar la API key dentro de codigo fuente.
- No usar `copiloto_pyme` como base de este proyecto.
- Rotar la API key cuando el CRM pase a desarrollo formal.

### Chequeos agregados

Validar configuracion:

```powershell
C:\Users\david\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe scripts/check_config.py
```

Validar secretos frente a git:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\check_git_secrets.ps1
```

### Resultado de validacion

La validacion local confirmo:

```text
APOLLO_API_KEY: enmascarada
APOLLO_BASE_URL: https://api.apollo.io
DATABASE_HOST: 127.0.0.1
DATABASE_NAME: tecnotitan_crm
DATABASE_USER: tecnotitan
```

### Decision del paso 13

La configuracion de secretos queda centralizada en `.env`, con `.env.example` como plantilla segura. Se agregaron validadores para evitar exponer la API key y para confirmar que el CRM apunta a `tecnotitan_crm` en lugar de `copiloto_pyme`.

## Paso 14 de 20: Crear integracion Apollo Search

### Decision principal

La integracion Apollo Search quedo conectada al backend y a PostgreSQL.

Antes, el backend consultaba Apollo y guardaba resultados en memoria. Ahora:

- Crea un registro en `lead_searches`.
- Consulta Apollo `People API Search`.
- Guarda empresas en `companies`.
- Guarda contactos en `contacts`.
- Crea oportunidades en `opportunities`.
- Relaciona resultados en `lead_search_results`.
- Calcula score inicial.
- Lista leads desde PostgreSQL.

### Archivos modificados

```text
backend/tecnotitan_crm/config.py
backend/tecnotitan_crm/db.py
backend/tecnotitan_crm/repository.py
backend/tecnotitan_crm/server.py
backend/README.md
```

### Endpoints relevantes

```text
GET /api/db/health
GET /api/leads
POST /api/apollo/search
```

### Flujo de `POST /api/apollo/search`

Entrada minima:

```json
{
  "lead_type": "consulting_client",
  "target_region": "latam",
  "page": 1,
  "per_page": 10
}
```

Flujo:

```text
Recibir filtros internos
  -> seleccionar plantilla Apollo
  -> llamar People API Search
  -> crear lead_search
  -> upsert company
  -> upsert contact
  -> upsert opportunity
  -> crear lead_search_result
  -> devolver leads guardados
```

### Validaciones realizadas

Health de base de datos:

```text
database: tecnotitan_crm
app_user: tecnotitan
tables: 12
```

Busqueda Apollo real:

```text
lead_type: consulting_client
target_region: latam
per_page: 2
total_entries: 72225
returned: 2
saved: 2
```

Conteo en PostgreSQL despues de la prueba:

```text
lead_searches: 3
contacts: 2
companies: 4
opportunities: 2
```

Nota:

Durante la implementacion hubo dos intentos fallidos que alcanzaron a crear registros de busqueda antes de completar el guardado de leads. No se eliminaron para evitar acciones destructivas innecesarias.

### Decision del paso 14

Apollo Search ya esta integrado como fuente real del CRM. Las busquedas quedan registradas y los leads encontrados se guardan como contactos, empresas y oportunidades persistentes en PostgreSQL.

## Paso 15 de 20: Crear plantillas de busqueda

### Decision principal

Se crearon plantillas formales de busqueda para ejecutar Apollo Search desde el CRM de forma consistente.

Las plantillas permiten que la interfaz use un `template_key` en lugar de construir filtros desde cero.

### Plantillas iniciales

```text
consulting_client:latam
investor:usa
investor:latam
investor:europe
```

### Archivos creados o modificados

```text
backend/tecnotitan_crm/search_templates.py
backend/tecnotitan_crm/server.py
backend/README.md
search-templates.md
```

### Estructura de cada plantilla

Cada plantilla define:

```text
key
name
description
lead_type
target_region
default_per_page
editable_filters
apollo_payload
```

### Filtros editables

El CRM solo permite modificar filtros declarados en `editable_filters`.

Esto evita enviar filtros accidentales o inseguros a Apollo.

Ejemplos:

```text
person_locations
person_titles
organization_num_employees_ranges
q_keywords
```

### Endpoint para listar plantillas

```text
GET /api/search-templates
```

Resultado validado:

```text
count: 4
consulting_client:latam
investor:usa
investor:latam
investor:europe
```

### Endpoint para ejecutar una plantilla

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

Ejemplo con override:

```json
{
  "template_key": "consulting_client:latam",
  "page": 1,
  "per_page": 10,
  "filters": {
    "person_locations": ["Colombia"]
  }
}
```

### Validacion realizada

Se probo una busqueda real:

```text
template_key: consulting_client:latam
filter: person_locations = Colombia
per_page: 1
total_entries: 13884
returned: 1
saved: 1
```

### Decision del paso 15

El CRM ya cuenta con plantillas de busqueda reutilizables para consultoria LATAM e inversionistas en USA, LATAM y Europa. Estas plantillas seran la base de la pantalla de busquedas Apollo en la interfaz.

## Paso 16 de 20: Crear logica de deduplicacion

### Decision principal

Se fortalecio la deduplicacion para evitar que Apollo Search cree registros repetidos cuando el mismo lead aparece en varias busquedas o cuando Apollo no entrega todos los IDs externos.

### Archivos creados o modificados

```text
db/migrations/002_dedup_indexes.sql
backend/tecnotitan_crm/repository.py
db/README.md
deduplication-rules.md
```

### Deduplicacion de empresas

Orden de comparacion:

```text
apollo_organization_id
domain
name + country
```

La regla `name + country` se usa solo cuando no hay dominio ni Apollo organization ID.

### Deduplicacion de contactos

Orden de comparacion:

```text
apollo_person_id
email
linkedin_url
full_name + company_id
```

La regla `full_name + company_id` se usa solo cuando no hay Apollo person ID, email ni LinkedIn.

### Deduplicacion de oportunidades

Una oportunidad es unica por:

```text
contact_id + lead_type + target_region
```

Esto permite que un contacto pueda tener contextos comerciales distintos sin duplicar su informacion personal.

### Migracion aplicada

Se aplico:

```text
db/migrations/002_dedup_indexes.sql
```

La migracion:

- Consolido empresas duplicadas existentes.
- Actualizo referencias en contactos, oportunidades y resultados de busqueda.
- Marco duplicados de empresa con `deleted_at`.
- Creo indices unicos parciales para empresas y contactos.

### Resultado de limpieza

Antes habia duplicados activos de `MINEX CI SAS`.

Despues:

```text
active_companies: 2
soft_deleted_companies: 3
duplicados activos: 0
```

### Validacion realizada

Se repitio una busqueda Apollo que devolvio el mismo lead.

Antes de repetir:

```text
active_companies: 2
contacts: 2
opportunities: 2
```

Despues de repetir:

```text
active_companies: 2
contacts: 2
opportunities: 2
lead_searches: 5
```

Conclusion:

El CRM registra nuevas busquedas en `lead_searches`, pero reutiliza empresa, contacto y oportunidad cuando ya existen.

### Decision del paso 16

La deduplicacion queda implementada en base de datos y backend. El CRM ahora evita duplicados por Apollo ID, dominio, email, LinkedIn y nombre + empresa, manteniendo historial de busquedas separado.

## Paso 17 de 20: Crear scoring para consultoria

### Decision principal

Se implemento un scoring mas completo para oportunidades de consultoria.

El score ayuda a priorizar leads de consultoria para Tecnotitan segun cargo, pais, industria, tamano de empresa, disponibilidad de datos y senales tecnologicas.

### Archivos creados o modificados

```text
backend/tecnotitan_crm/scoring.py
backend/tecnotitan_crm/repository.py
scripts/recalculate_consulting_scores.py
consulting-scoring.md
tecnotitan-crm-plan.md
```

### Rango y etiquetas

```text
0-100 puntos
hot: 75+
warm: 45-74
cold: 20-44
unqualified: 0-19
```

### Factores del scoring

Cargo:

```text
Cargo decisor para consultoria: +25
Cargo operativo o tecnico relevante: +15
Cargo de baja prioridad: -10
```

Pais:

```text
Pais prioritario para consultoria: +15
Pais secundario para consultoria: +8
Ubicacion disponible fuera de prioridad: +3
```

Industria:

```text
Industria prioritaria para consultoria: +15
```

Tamano de empresa:

```text
20-200 empleados: +15
201-500 empleados: +12
501-1000 empleados: +8
Menos de 20 empleados: -8
```

Disponibilidad de datos:

```text
LinkedIn de contacto disponible: +10
Sitio web o dominio disponible: +5
LinkedIn de empresa disponible: +5
```

Senales tecnologicas:

```text
Senales tecnologicas o digitales: +10
```

### Script de recalculo

Se creo:

```powershell
C:\Users\david\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe scripts\recalculate_consulting_scores.py
```

Este script recalcula oportunidades existentes de consultoria sin llamar Apollo.

### Validacion realizada

Se recalcularon oportunidades existentes:

```text
Recalculando 2 oportunidades de consultoria
```

Luego se ejecuto una busqueda nueva:

```text
template_key: consulting_client:latam
filter: Mexico
per_page: 2
returned: 2
saved: 2
```

Resultado observado:

```text
score: 25
score_label: cold
reason: Cargo decisor para consultoria
```

### Limitacion actual

Apollo Search no siempre entrega pais, industria, dominio, LinkedIn de empresa o tamano de empresa en cada resultado.

Cuando esos datos faltan, el score depende principalmente del cargo.

El scoring sera mas potente cuando implementemos enriquecimiento selectivo.

### Decision del paso 17

El scoring de consultoria quedo implementado y documentado. Ya calcula puntajes estructurados y guarda razones en JSON, pero la calidad del score aumentara cuando el CRM use enriquecimiento de Apollo para completar datos de empresa y contacto.

## Paso 18 de 20: Crear scoring para inversionistas

### Decision principal

Se implemento scoring especifico para inversionistas.

El score ayuda a priorizar contactos de fundraising segun cargo, pais, contexto de firma/fondo, tesis potencial, LinkedIn y senales de venture/startups.

### Archivos creados o modificados

```text
backend/tecnotitan_crm/scoring.py
scripts/recalculate_investor_scores.py
investor-scoring.md
tecnotitan-crm-plan.md
```

### Rango y etiquetas

```text
0-100 puntos
hot: 75+
warm: 45-74
cold: 20-44
unqualified: 0-19
```

### Factores del scoring

Cargo:

```text
Cargo senior de inversion: +30
Cargo de screening o gestion de inversion: +18
Cargo exploratorio con acceso potencial a red: +8
Cargo de baja prioridad: -10
```

Pais:

```text
Pais objetivo para inversionistas: +12
Ubicacion disponible fuera de prioridad: +3
```

Contexto de organizacion:

```text
Contexto de fondo, venture, startup o inversion: +18
Tesis potencial alineada con Tecnotitan: +15
Sitio web o dominio disponible: +5
LinkedIn de firma disponible: +5
```

### Keywords de contexto

```text
venture
capital
vc
investment
investor
angel
fund
family office
accelerator
startup
ventures
studio
```

### Keywords de tesis

```text
software
saas
b2b
ai
artificial intelligence
automation
data
enterprise
emerging markets
latin america
latam
fintech
productivity
digital transformation
```

### Script de recalculo

Se creo:

```powershell
C:\Users\david\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe scripts\recalculate_investor_scores.py
```

Este script recalcula oportunidades existentes de inversionistas sin llamar Apollo.

### Validacion realizada

Primero se intento la plantilla `investor:usa` con keywords estrictas:

```text
total_entries: 0
returned: 0
saved: 0
```

Luego se uso override seguro:

```json
{
  "template_key": "investor:usa",
  "filters": {
    "q_keywords": "venture capital"
  },
  "per_page": 2
}
```

Resultado:

```text
total_entries: 701
returned: 2
saved: 2
score: 48
score_label: warm
```

Razones guardadas:

```json
[
  {"points": 30, "reason": "Cargo senior de inversion"},
  {"points": 18, "reason": "Contexto de fondo, venture, startup o inversion"}
]
```

### Decision del paso 18

El scoring de inversionistas quedo implementado y validado con leads reales. Tambien se detecto que la plantilla USA inicial puede ser demasiado restrictiva, por lo que conviene ajustar keywords por plantilla o permitir busquedas exploratorias desde la interfaz.

## Paso 19 de 20: Construir la interfaz

### Decision principal

Se construyo una primera interfaz usable del CRM interno de Tecnotitan.

La interfaz se sirve desde el mismo backend:

```text
http://127.0.0.1:8000
```

### Archivos creados o modificados

```text
frontend/index.html
frontend/styles.css
frontend/app.js
backend/tecnotitan_crm/server.py
backend/tecnotitan_crm/repository.py
backend/README.md
tecnotitan-crm-plan.md
```

### Pantallas incluidas

```text
Dashboard
Apollo Search
Leads recientes
```

### Capacidades actuales

La interfaz permite:

- Ver metricas generales.
- Ver estado de conexion a PostgreSQL.
- Listar plantillas Apollo.
- Ejecutar busquedas Apollo desde el navegador.
- Usar filtros editables de pais/ubicacion y keywords.
- Guardar resultados en PostgreSQL.
- Ver leads recientes.
- Filtrar por todos, consultoria o inversionistas.
- Ver score, tipo de lead y estado de pipeline.

### Endpoints usados por la interfaz

```text
GET /api/db/health
GET /api/dashboard
GET /api/search-templates
GET /api/leads
POST /api/apollo/search
```

### Validacion realizada

Se probo el backend sirviendo la interfaz:

```text
GET / -> 200
dashboard total opportunities: 6
templates: 4
```

### Decision del paso 19

El CRM ya tiene una primera interfaz interna funcional. No es una landing: abre directamente como herramienta operativa para buscar leads en Apollo y administrar oportunidades guardadas.

## Paso 20 de 20: Probar con busquedas reales pequenas

### Decision principal

Se ejecutaron busquedas pequenas reales en Apollo para validar calidad, volumen, persistencia, deduplicacion y scoring.

### Archivos creados o modificados

```text
scripts/run_small_search_tests.py
search-quality-report.json
step-20-search-results.md
backend/tecnotitan_crm/search_templates.py
backend/tecnotitan_crm/scoring.py
search-templates.md
tecnotitan-crm-plan.md
```

### Busquedas ejecutadas

```text
Consultoria Colombia
Consultoria Mexico
Inversionistas USA venture capital
Inversionistas LATAM venture capital
Inversionistas Europa venture capital
```

Cada busqueda pidio:

```text
per_page: 3
```

### Resultados

```text
Consultoria Colombia: total 13884, returned 3, saved 3
Consultoria Mexico: total 34032, returned 3, saved 3
Inversionistas USA: total 701, returned 3, saved 3
Inversionistas LATAM: total 52, returned 3, saved 3
Inversionistas Europa: total 277, returned 3, saved 3
```

### Ajustes aplicados

Las plantillas de inversionistas se ajustaron para usar keywords mas simples:

```text
venture capital
```

Motivo:

Las expresiones largas con `OR` devolvieron 0 resultados o fueron demasiado estrictas en Apollo.

Tambien se ajusto el scoring de inversionistas para reconocer:

```text
Venture Capital Investor
```

como cargo senior de inversion.

### Validacion de scoring

Consultoria:

```text
score comun observado: 25
label: cold
motivo: Cargo decisor para consultoria
```

Inversionistas:

```text
score frecuente observado: 48
label: warm
motivos:
- Cargo senior de inversion
- Contexto de fondo, venture, startup o inversion
```

### Decision del paso 20

El MVP queda validado con busquedas reales pequenas. Apollo Search funciona, PostgreSQL persiste resultados, deduplicacion evita duplicados, scoring clasifica oportunidades y la interfaz ya puede operar con datos reales.

## Cierre Del MVP Inicial

Los 20 pasos iniciales quedaron completados.

El CRM interno de Tecnotitan ya tiene:

- Plan funcional.
- API key Apollo configurada.
- PostgreSQL separado de `copiloto_pyme`.
- Backend local.
- Apollo Search integrado.
- Plantillas de busqueda.
- Deduplicacion.
- Scoring para consultoria.
- Scoring para inversionistas.
- Interfaz web inicial.
- Pruebas reales pequenas con resultados guardados.

## Mejora 1: Convertirlo en software local de escritorio

### Decision

Se inicio la conversion del CRM a una aplicacion local de escritorio usando Electron + JavaScript.

Objetivo:

```text
Abrir Tecnotitan CRM como app de Windows, sin depender de abrir http://127.0.0.1:8000 en Edge ni mantener un servidor web escuchando.
```

### Archivos creados

```text
package.json
package-lock.json
desktop/main.js
desktop/preload.js
desktop/index.html
desktop/styles.css
desktop/renderer.js
desktop/README.md
scripts/run_desktop.ps1
```

### Seguridad

La API key de Apollo se mantiene en el proceso principal de Electron.

El renderer solo llama funciones expuestas por `preload.js`:

```text
dashboard
templates
leads
apolloSearch
```

No se expone `APOLLO_API_KEY` a la interfaz.

### Base de datos

La app desktop usa:

```text
tecnotitan_crm
```

Y mantiene la regla:

```text
No tocar copiloto_pyme.
```

### Ejecucion

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run_desktop.ps1
```

### Validacion

Se instalo Electron con `npm install`.

Se validaron archivos JavaScript con:

```text
node --check
```

Se inicio la aplicacion y se detectaron procesos `electron` activos.

### Estado

La primera version desktop ya abre una ventana local con dashboard, tabla de leads y busqueda Apollo por plantilla.

### Ejecutable Windows

Se agrego empaquetado con Electron Builder.

Comando:

```powershell
npm run build:portable
```

Ejecutable generado:

```text
dist\Tecnotitan CRM 0.1.0.exe
```

Archivo de configuracion junto al ejecutable:

```text
dist\.env
```

La API key de Apollo no queda incrustada en el `.exe`; se lee desde `.env`.
