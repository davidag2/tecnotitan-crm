const templates = {
  "consulting_client:latam": {
    key: "consulting_client:latam",
    name: "Clientes consultoria LATAM",
    description: "Decisores y lideres tecnologicos en empresas medianas de America Latina.",
    lead_type: "consulting_client",
    target_region: "latam",
    default_per_page: 10,
    editable_filters: ["person_locations", "organization_num_employees_ranges", "person_titles", "q_keywords"],
    apollo_payload: {
      person_locations: ["Colombia", "Mexico", "Chile", "Peru", "Ecuador", "Panama", "Costa Rica", "Argentina", "Uruguay"],
      organization_num_employees_ranges: ["20,200", "201,500", "501,1000"],
      person_titles: [
        "CEO",
        "Founder",
        "Co-Founder",
        "CTO",
        "CIO",
        "Head of Technology",
        "IT Director",
        "Technology Director",
        "Operations Director",
        "COO",
        "Technology Manager",
        "Operations Manager",
        "Digital Transformation Manager",
      ],
    },
  },
  "investor:usa": {
    key: "investor:usa",
    name: "Inversionistas USA",
    description: "Angels, partners y operadores de inversion en Estados Unidos.",
    lead_type: "investor",
    target_region: "usa",
    default_per_page: 10,
    editable_filters: ["person_locations", "person_titles", "q_keywords"],
    apollo_payload: {
      person_locations: ["United States"],
      person_titles: ["Angel Investor", "Managing Partner", "General Partner", "Founding Partner", "Venture Partner", "Partner", "Principal"],
      q_keywords: "venture capital",
    },
  },
  "investor:latam": {
    key: "investor:latam",
    name: "Inversionistas LATAM",
    description: "Inversionistas y fondos con presencia en ecosistemas startup de America Latina.",
    lead_type: "investor",
    target_region: "latam",
    default_per_page: 10,
    editable_filters: ["person_locations", "person_titles", "q_keywords"],
    apollo_payload: {
      person_locations: ["Colombia", "Mexico", "Brazil", "Chile", "Argentina", "Peru", "Uruguay", "Panama"],
      person_titles: ["Angel Investor", "Investor", "Managing Partner", "Partner", "Principal", "Investment Manager"],
      q_keywords: "venture capital",
    },
  },
  "investor:europe": {
    key: "investor:europe",
    name: "Inversionistas Europa",
    description: "Inversionistas europeos con posible interes en software, AI, B2B y LatAm.",
    lead_type: "investor",
    target_region: "europe",
    default_per_page: 10,
    editable_filters: ["person_locations", "person_titles", "q_keywords"],
    apollo_payload: {
      person_locations: ["Spain", "United Kingdom", "Germany", "France", "Netherlands", "Switzerland", "Portugal"],
      person_titles: ["Angel Investor", "Managing Partner", "General Partner", "Venture Partner", "Principal", "Investment Manager"],
      q_keywords: "venture capital",
    },
  },
};

function listTemplates() {
  return Object.values(templates);
}

function getTemplate(key) {
  const template = templates[key];
  if (!template) throw new Error("No existe esa plantilla de busqueda.");
  return template;
}

function buildApolloPayload(template, extraFilters = {}) {
  const payload = JSON.parse(JSON.stringify(template.apollo_payload));
  for (const [key, value] of Object.entries(extraFilters || {})) {
    if (template.editable_filters.includes(key)) payload[key] = value;
  }
  return payload;
}

module.exports = { buildApolloPayload, getTemplate, listTemplates };
