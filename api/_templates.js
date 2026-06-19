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
  "investor:usa_vc": {
    key: "investor:usa_vc",
    name: "USA Venture Capital",
    description: "Partners y principals en fondos VC de Estados Unidos.",
    lead_type: "investor",
    target_region: "usa",
    default_per_page: 10,
    editable_filters: ["person_locations", "person_titles", "q_keywords"],
    apollo_payload: {
      person_locations: ["United States"],
      person_titles: ["Managing Partner", "General Partner", "Founding Partner", "Venture Partner", "Partner", "Principal", "Investment Partner"],
      q_keywords: "venture capital SaaS AI B2B",
    },
  },
  "investor:usa_angels": {
    key: "investor:usa_angels",
    name: "USA Angel Investors",
    description: "Angels, syndicates y operadores con tesis startup en USA.",
    lead_type: "investor",
    target_region: "usa",
    default_per_page: 10,
    editable_filters: ["person_locations", "person_titles", "q_keywords"],
    apollo_payload: {
      person_locations: ["United States"],
      person_titles: ["Angel Investor", "Investor", "Advisor", "Founder", "Operator", "Syndicate Lead"],
      q_keywords: "angel investor startup SaaS AI",
    },
  },
  "investor:usa_family_offices": {
    key: "investor:usa_family_offices",
    name: "USA Family Offices",
    description: "Family offices y private investors con potencial interes en software.",
    lead_type: "investor",
    target_region: "usa",
    default_per_page: 10,
    editable_filters: ["person_locations", "person_titles", "q_keywords"],
    apollo_payload: {
      person_locations: ["United States"],
      person_titles: ["Managing Director", "Investment Director", "Investment Manager", "Principal", "Partner", "Family Office Investor"],
      q_keywords: "family office private investor technology",
    },
  },
  "investor:usa_accelerators": {
    key: "investor:usa_accelerators",
    name: "USA Accelerators",
    description: "Aceleradoras, venture studios y programas de startups en USA.",
    lead_type: "investor",
    target_region: "usa",
    default_per_page: 10,
    editable_filters: ["person_locations", "person_titles", "q_keywords"],
    apollo_payload: {
      person_locations: ["United States"],
      person_titles: ["Managing Director", "Program Director", "Accelerator Director", "Venture Partner", "Partner", "Startup Program Manager"],
      q_keywords: "startup accelerator venture studio AI SaaS",
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
  "investor:latam_angels": {
    key: "investor:latam_angels",
    name: "LATAM Angels",
    description: "Angels y operadores inversionistas en America Latina.",
    lead_type: "investor",
    target_region: "latam",
    default_per_page: 10,
    editable_filters: ["person_locations", "person_titles", "q_keywords"],
    apollo_payload: {
      person_locations: ["Colombia", "Mexico", "Brazil", "Chile", "Argentina", "Peru", "Uruguay", "Panama"],
      person_titles: ["Angel Investor", "Investor", "Advisor", "Founder", "Co-Founder", "Partner"],
      q_keywords: "angel investor startup technology SaaS",
    },
  },
  "investor:latam_accelerators": {
    key: "investor:latam_accelerators",
    name: "LATAM Accelerators",
    description: "Aceleradoras, venture builders y hubs startup en America Latina.",
    lead_type: "investor",
    target_region: "latam",
    default_per_page: 10,
    editable_filters: ["person_locations", "person_titles", "q_keywords"],
    apollo_payload: {
      person_locations: ["Colombia", "Mexico", "Brazil", "Chile", "Argentina", "Peru", "Uruguay", "Panama"],
      person_titles: ["Managing Director", "Program Director", "Accelerator Director", "Venture Partner", "Startup Program Manager"],
      q_keywords: "startup accelerator venture builder venture studio",
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
  "investor:europe_angels": {
    key: "investor:europe_angels",
    name: "Europa Angels",
    description: "Angels y operadores europeos con interes en software, AI y LatAm.",
    lead_type: "investor",
    target_region: "europe",
    default_per_page: 10,
    editable_filters: ["person_locations", "person_titles", "q_keywords"],
    apollo_payload: {
      person_locations: ["Spain", "United Kingdom", "Germany", "France", "Netherlands", "Switzerland", "Portugal"],
      person_titles: ["Angel Investor", "Investor", "Advisor", "Founder", "Co-Founder", "Partner"],
      q_keywords: "angel investor SaaS AI B2B",
    },
  },
  "investor:europe_family_offices": {
    key: "investor:europe_family_offices",
    name: "Europa Family Offices",
    description: "Family offices y private investors europeos con tesis tecnologica.",
    lead_type: "investor",
    target_region: "europe",
    default_per_page: 10,
    editable_filters: ["person_locations", "person_titles", "q_keywords"],
    apollo_payload: {
      person_locations: ["Spain", "United Kingdom", "Germany", "France", "Netherlands", "Switzerland", "Portugal"],
      person_titles: ["Managing Director", "Investment Director", "Investment Manager", "Principal", "Partner", "Family Office Investor"],
      q_keywords: "family office private investor technology SaaS",
    },
  },
  "investor:europe_accelerators": {
    key: "investor:europe_accelerators",
    name: "Europa Accelerators",
    description: "Aceleradoras y venture studios europeos.",
    lead_type: "investor",
    target_region: "europe",
    default_per_page: 10,
    editable_filters: ["person_locations", "person_titles", "q_keywords"],
    apollo_payload: {
      person_locations: ["Spain", "United Kingdom", "Germany", "France", "Netherlands", "Switzerland", "Portugal"],
      person_titles: ["Managing Director", "Program Director", "Accelerator Director", "Venture Partner", "Startup Program Manager"],
      q_keywords: "startup accelerator venture studio AI SaaS",
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
