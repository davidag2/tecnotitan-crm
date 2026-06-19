const state = {
  token: sessionStorage.getItem("tecnotitan_crm_session") || "",
  username: "",
  templates: [],
  users: [],
  searches: [],
  leadRows: [],
  emailMessages: [],
  emailCampaigns: [],
  emailExclusions: [],
  emailWarmups: [],
  leadInventory: null,
  emailStatus: null,
  origamiConfigured: false,
  origamiPollTimer: null,
  origamiPollAttempts: 0,
  origamiPeopleSearches: [],
  origamiSearchPollTimer: null,
  origamiJobSearches: [],
  origamiJobPollTimer: null,
  emailMailbox: "compose",
  emailSearch: "",
  selectedEmailId: "",
  emailPage: 1,
  leadPage: 1,
  assignmentWorkload: null,
  currentUser: null,
  selectedTemplate: "consulting_client:latam",
  clientSearch: "",
  clientContactFilter: "all",
  clientCountryFilter: "all",
  clientCategoryFilter: "all",
  clientTagFilter: "all",
  clientPage: 1,
  kanbanSearch: "",
  kanbanPage: 1,
  messageTemplateFilter: "all",
};

const elements = {
  appShell: document.querySelector("#app-shell"),
  loginScreen: document.querySelector("#login-screen"),
  loginStatus: document.querySelector("#login-status"),
  tabs: document.querySelectorAll("[data-tab]"),
  tabPanels: document.querySelectorAll("[data-tab-panel]"),
  status: document.querySelector("#system-status"),
  metrics: document.querySelector("#metrics"),
  executiveSummary: document.querySelector("#executive-summary"),
  executiveWeekly: document.querySelector("#executive-weekly"),
  apolloPerformance: document.querySelector("#apollo-performance"),
  assignmentWorkload: document.querySelector("#assignment-workload"),
  origamiConfigStatus: document.querySelector("#origami-config-status"),
  origamiPersonName: document.querySelector("#origami-person-name"),
  origamiPersonCompany: document.querySelector("#origami-person-company"),
  origamiPersonLinkedin: document.querySelector("#origami-person-linkedin"),
  origamiPersonPurpose: document.querySelector("#origami-person-purpose"),
  origamiPersonNotes: document.querySelector("#origami-person-notes"),
  origamiPersonSearchButton: document.querySelector("#origami-person-search-button"),
  origamiPersonSearchStatus: document.querySelector("#origami-person-search-status"),
  origamiPersonSearchResults: document.querySelector("#origami-person-search-results"),
  origamiJobRole: document.querySelector("#origami-job-role"),
  origamiJobLocations: document.querySelector("#origami-job-locations"),
  origamiJobKeywords: document.querySelector("#origami-job-keywords"),
  origamiJobSeniority: document.querySelector("#origami-job-seniority"),
  origamiJobProfile: document.querySelector("#origami-job-profile"),
  origamiJobNotes: document.querySelector("#origami-job-notes"),
  origamiJobSearchButton: document.querySelector("#origami-job-search-button"),
  origamiJobSearchStatus: document.querySelector("#origami-job-search-status"),
  origamiJobSearchResults: document.querySelector("#origami-job-search-results"),
  messageTemplateFilter: document.querySelector("#message-template-filter"),
  messageTemplateCount: document.querySelector("#message-template-count"),
  messageTemplates: document.querySelector("#message-templates"),
  emailStatus: document.querySelector("#email-status"),
  emailList: document.querySelector("#email-list"),
  emailSearch: document.querySelector("#email-search"),
  emailOpportunity: document.querySelector("#email-opportunity"),
  emailSender: document.querySelector("#email-sender"),
  emailAttachDeck: document.querySelector("#email-attach-deck"),
  emailTo: document.querySelector("#email-to"),
  emailSubject: document.querySelector("#email-subject"),
  emailBody: document.querySelector("#email-body"),
  sendEmailButton: document.querySelector("#send-email-button"),
  emailComposeStatus: document.querySelector("#email-compose-status"),
  emailMailboxButtons: document.querySelectorAll("[data-email-mailbox]"),
  refreshEmailButton: document.querySelector("#refresh-email-button"),
  campaignName: document.querySelector("#campaign-name"),
  campaignType: document.querySelector("#campaign-type"),
  campaignSegment: document.querySelector("#campaign-segment"),
  campaignSender: document.querySelector("#campaign-sender"),
  campaignTargetRegion: document.querySelector("#campaign-target-region"),
  campaignTemplate: document.querySelector("#campaign-template"),
  campaignAttachDeck: document.querySelector("#campaign-attach-deck"),
  campaignDailyLimit: document.querySelector("#campaign-daily-limit"),
  campaignQueueSize: document.querySelector("#campaign-queue-size"),
  campaignStartAt: document.querySelector("#campaign-start-at"),
  campaignEndAt: document.querySelector("#campaign-end-at"),
  campaignTimezone: document.querySelector("#campaign-timezone"),
  campaignBatchSize: document.querySelector("#campaign-batch-size"),
  campaignMinDelay: document.querySelector("#campaign-min-delay"),
  campaignMaxDelay: document.querySelector("#campaign-max-delay"),
  campaignSubject: document.querySelector("#campaign-subject"),
  campaignBody: document.querySelector("#campaign-body"),
  createCampaignButton: document.querySelector("#create-campaign-button"),
  campaignStatus: document.querySelector("#campaign-status"),
  campaignSectionButtons: document.querySelectorAll("[data-campaign-section]"),
  campaignSectionPanels: document.querySelectorAll("[data-campaign-section-panel]"),
  campaignList: document.querySelector("#campaign-list"),
  campaignArchiveList: document.querySelector("#campaign-archive-list"),
  multiCampaignManager: document.querySelector("#multi-campaign-manager"),
  leadInventory: document.querySelector("#lead-inventory"),
  senderWarmupList: document.querySelector("#sender-warmup-list"),
  exclusionEmail: document.querySelector("#exclusion-email"),
  exclusionReason: document.querySelector("#exclusion-reason"),
  addExclusionButton: document.querySelector("#add-exclusion-button"),
  exclusionList: document.querySelector("#exclusion-list"),
  followupsOverdue: document.querySelector("#followups-overdue"),
  followupsToday: document.querySelector("#followups-today"),
  followupsUpcoming: document.querySelector("#followups-upcoming"),
  templates: document.querySelector("#templates"),
  searchHistory: document.querySelector("#search-history"),
  searchResults: document.querySelector("#search-results"),
  leads: document.querySelector("#leads"),
  clients: document.querySelector("#clients"),
  kanban: document.querySelector("#kanban-board"),
  clientSearch: document.querySelector("#client-search"),
  clientContactFilter: document.querySelector("#client-contact-filter"),
  clientCountryFilter: document.querySelector("#client-country-filter"),
  clientCategoryFilter: document.querySelector("#client-category-filter"),
  clientTagFilter: document.querySelector("#client-tag-filter"),
  clientFilterSummary: document.querySelector("#client-filter-summary"),
  archive: document.querySelector("#archive"),
  userList: document.querySelector("#user-list"),
  leadSearch: document.querySelector("#lead-search"),
  leadCountry: document.querySelector("#lead-country"),
  leadTypeFilter: document.querySelector("#lead-type-filter"),
  leadRegionFilter: document.querySelector("#lead-region-filter"),
  leadScoreFilter: document.querySelector("#lead-score-filter"),
  leadStatusFilter: document.querySelector("#lead-status-filter"),
  applyLeadFilters: document.querySelector("#apply-lead-filters"),
  clearLeadFilters: document.querySelector("#clear-lead-filters"),
  newUserName: document.querySelector("#new-user-name"),
  newUserEmail: document.querySelector("#new-user-email"),
  newUserUsername: document.querySelector("#new-user-username"),
  newUserPassword: document.querySelector("#new-user-password"),
  newUserRole: document.querySelector("#new-user-role"),
  createUser: document.querySelector("#create-user"),
  usernameInput: document.querySelector("#username-input"),
  passwordInput: document.querySelector("#password-input"),
  loginButton: document.querySelector("#login-button"),
  logoutButton: document.querySelector("#logout-button"),
  sessionUser: document.querySelector("#session-user"),
  getConsultingLeads: document.querySelector("#get-consulting-leads"),
  getInvestorLeads: document.querySelector("#get-investor-leads"),
  searchStatus: document.querySelector("#search-status"),
  csvImportFile: document.querySelector("#csv-import-file"),
  csvImportMode: document.querySelector("#csv-import-mode"),
  csvImportType: document.querySelector("#csv-import-type"),
  csvImportRegion: document.querySelector("#csv-import-region"),
  importCsvButton: document.querySelector("#import-csv-button"),
  csvImportStatus: document.querySelector("#csv-import-status"),
  detailModal: document.querySelector("#lead-detail-modal"),
  closeDetail: document.querySelector("#close-detail"),
  detailTitle: document.querySelector("#detail-title"),
  detailSubtitle: document.querySelector("#detail-subtitle"),
  detailContact: document.querySelector("#detail-contact"),
  detailCompany: document.querySelector("#detail-company"),
  detailScore: document.querySelector("#detail-score"),
  detailScoreInput: document.querySelector("#detail-score-input"),
  detailScoreLabel: document.querySelector("#detail-score-label"),
  detailTagOptions: document.querySelector("#detail-tag-options"),
  saveScoreTags: document.querySelector("#save-score-tags"),
  detailStatus: document.querySelector("#detail-status"),
  detailFollowupDate: document.querySelector("#detail-followup-date"),
  detailFollowupType: document.querySelector("#detail-followup-type"),
  saveDetail: document.querySelector("#save-detail"),
  detailNotesList: document.querySelector("#detail-notes-list"),
  detailPipelineEvents: document.querySelector("#detail-pipeline-events"),
  detailActivities: document.querySelector("#detail-activities"),
  detailOrigami: document.querySelector("#detail-origami"),
  analyzeOrigami: document.querySelector("#analyze-origami"),
  refreshOrigami: document.querySelector("#refresh-origami"),
  detailNoteInput: document.querySelector("#detail-note-input"),
  addDetailNote: document.querySelector("#add-detail-note"),
  companyDetailModal: document.querySelector("#company-detail-modal"),
  closeCompanyDetail: document.querySelector("#close-company-detail"),
  companyDetailTitle: document.querySelector("#company-detail-title"),
  companyDetailSubtitle: document.querySelector("#company-detail-subtitle"),
  companyDetailFacts: document.querySelector("#company-detail-facts"),
  companyDetailOpportunities: document.querySelector("#company-detail-opportunities"),
  companyDetailContacts: document.querySelector("#company-detail-contacts"),
  companyDetailNotes: document.querySelector("#company-detail-notes"),
  companyNoteInput: document.querySelector("#company-note-input"),
  addCompanyNote: document.querySelector("#add-company-note"),
};

let activeOpportunityId = "";
let activeCompanyId = "";
let activeTab = "dashboard";

const PIPELINE_STATUSES = [
  ["nuevo", "Nuevo"],
  ["calificado", "Calificado"],
  ["contactado", "Contactado"],
  ["reunion_agendada", "Reunion agendada"],
  ["propuesta_enviada", "Propuesta enviada"],
  ["ganado", "Ganado"],
  ["perdido", "Perdido"],
];

const ARCHIVE_STATUS = "archivado";
const LEADS_PER_PAGE = 25;
const CLIENTS_PER_PAGE = 25;
const KANBAN_CLIENTS_PER_PAGE = 10;
const EMAILS_PER_PAGE = 25;
const ORIGAMI_POLL_INTERVAL_MS = 8000;
const ORIGAMI_MAX_POLL_ATTEMPTS = 45;

const MESSAGE_TEMPLATES = [
  {
    id: "consultoria-latam-email-1",
    category: "consultoria",
    channel: "Email",
    title: "Consultoria LATAM - primer contacto ejecutivo",
    subject: "Oportunidad de automatizacion para {{empresa}}",
    body:
      "Hola {{primer_nombre}},\n\nSoy David Arias, fundador de Tecnotitan. Vi que {{empresa}} trabaja en {{industria}} en {{pais}} y creo que podria existir una oportunidad concreta para mejorar procesos comerciales u operativos con software, automatizacion e IA aplicada.\n\nTecnotitan ayuda a empresas en America Latina a convertir tareas repetitivas, flujos manuales y datos dispersos en sistemas internos mas claros, medibles y escalables.\n\nSi tiene sentido para ti, puedo compartirte 2 o 3 ideas especificas para {{empresa}} en una llamada breve de 15 minutos.\n\nSaludos,\nDavid Arias\nFundador, Tecnotitan\ntecnotitan.com",
  },
  {
    id: "consultoria-latam-linkedin-1",
    category: "consultoria",
    channel: "LinkedIn",
    title: "Consultoria LATAM - conexion LinkedIn",
    subject: "",
    body:
      "Hola {{nombre}}, vi tu rol en {{empresa}}. En Tecnotitan ayudamos a empresas en LATAM a mejorar procesos con software, automatizacion e IA practica. Me gustaria conectar.",
  },
  {
    id: "inversionistas-email-1",
    category: "inversionistas",
    channel: "Email",
    title: "Inversionistas - introduccion estrategica",
    subject: "Tecnotitan | software e IA para empresas en LATAM",
    body:
      "Hola {{primer_nombre}},\n\nSoy David Arias, fundador de Tecnotitan. Estamos construyendo una compania de software e inteligencia artificial enfocada en resolver problemas operativos reales de empresas en America Latina.\n\nNuestro punto de partida combina CRM interno, automatizacion comercial, prospeccion B2B, integraciones y herramientas de IA para pymes y equipos en crecimiento.\n\nVi tu relacion con {{industria}} en {{pais}} y tu perfil como {{tipo_lead}}; por eso pense que podria tener sentido presentarte la vision, el avance y la oportunidad de mercado.\n\nSi estas abierto, puedo enviarte un resumen ejecutivo o coordinar una llamada de 20 minutos.\n\nSaludos,\nDavid Arias\nFundador, Tecnotitan\ntecnotitan.com",
  },
  {
    id: "investors-english-email-1",
    category: "inversionistas",
    channel: "Email",
    title: "Investors - strategic intro EN",
    subject: "Tecnotitan | AI implementation platform for LATAM",
    body:
      "Hi {{primer_nombre}},\n\nI am David Arias, founder of Tecnotitan. We are building an applied technology company from Colombia for companies that need AI implementation, not more slideware.\n\nThe problem we see across Latin America is clear: manual workflows, scattered data, pressure to adopt AI and teams without the internal capacity to turn ideas into working products.\n\nTecnotitan enters through real operational pain. We diagnose, build, implement and then convert recurring use cases into reusable IP, sector knowledge and operating playbooks. The model is service revenue today, scalable SaaS and licensing tomorrow.\n\nOur roadmap is to validate paid cases and MVPs in 2026, compound product and IP in 2027, and scale as a regional technology platform by 2028.\n\nWe are raising a US$500K pre-seed to fund 18 months toward paid pilots, product engineering, AI delivery and a repeatable product platform.\n\nI noticed your connection to {{industria}} in {{pais}} and thought Tecnotitan could be relevant to your thesis around AI, software infrastructure and emerging markets.\n\nIf this is close to your investment focus, I would be glad to send the deck or schedule a 20-minute conversation.\n\nBest regards,\nDavid Arias\nFounder, Tecnotitan\ntecnotitan.com",
  },
  {
    id: "investors-spanish-email-1",
    category: "inversionistas",
    channel: "Email",
    title: "Inversionistas - intro por pais ES",
    subject: "Tecnotitan | plataforma de implementacion de IA para LATAM",
    body:
      "Hola {{primer_nombre}},\n\nSoy David Arias, fundador de Tecnotitan. Estamos construyendo una compania de tecnologia aplicada desde Colombia para empresas que necesitan implementacion real de IA, no mas presentaciones.\n\nEl problema que vemos en America Latina es claro: procesos manuales, datos dispersos, presion por adoptar IA y equipos sin capacidad interna para convertir ideas en productos funcionales.\n\nTecnotitan entra por dolores operativos concretos. Diagnosticamos, construimos, implementamos y luego convertimos casos de uso recurrentes en propiedad intelectual, conocimiento sectorial y playbooks operativos. El modelo combina ingresos por servicios hoy y software/licenciamiento escalable manana.\n\nEstamos levantando una ronda pre-seed de US$500K para financiar 18 meses de pilotos pagos, ingenieria de producto, delivery de IA y una plataforma repetible.\n\nVi tu relacion con {{industria}} en {{pais}} y pense que Tecnotitan podria ser relevante para tu tesis alrededor de IA, infraestructura de software y mercados emergentes.\n\nSi esta cerca de tu foco de inversion, con gusto puedo enviarte el deck o coordinar una conversacion de 20 minutos.\n\nSaludos,\nDavid Arias\nFundador, Tecnotitan\ntecnotitan.com",
  },
  {
    id: "investors-portuguese-email-1",
    category: "inversionistas",
    channel: "Email",
    title: "Investidores - intro por pais PT",
    subject: "Tecnotitan | plataforma de implementacao de IA para LATAM",
    body:
      "Ola {{primer_nombre}},\n\nSou David Arias, fundador da Tecnotitan. Estamos construindo uma empresa de tecnologia aplicada a partir da Colombia para companhias que precisam implementar IA de forma pratica, nao apenas discutir ideias.\n\nO problema que vemos na America Latina e claro: processos manuais, dados dispersos, pressao para adotar IA e equipes sem capacidade interna para transformar ideias em produtos funcionando.\n\nA Tecnotitan entra por dores operacionais reais. Diagnosticamos, construimos, implementamos e depois transformamos casos recorrentes em propriedade intelectual, conhecimento setorial e playbooks operacionais. O modelo combina receita de servicos hoje e software/licenciamento escalavel amanha.\n\nEstamos captando uma rodada pre-seed de US$500K para financiar 18 meses de pilotos pagos, engenharia de produto, delivery de IA e uma plataforma repetivel.\n\nVi sua conexao com {{industria}} em {{pais}} e pensei que a Tecnotitan poderia ser relevante para sua tese em IA, infraestrutura de software e mercados emergentes.\n\nSe isso estiver proximo do seu foco de investimento, ficarei feliz em enviar o deck ou agendar uma conversa de 20 minutos.\n\nAtenciosamente,\nDavid Arias\nFundador, Tecnotitan\ntecnotitan.com",
  },
  {
    id: "investors-vc-email-1",
    category: "inversionistas",
    channel: "Email",
    title: "Investors - VC thesis EN",
    subject: "Tecnotitan | AI implementation platform for LATAM",
    body:
      "Hi {{primer_nombre}},\n\nI am David Arias, founder of Tecnotitan. We are building an AI implementation platform from Colombia for Latin American companies that need working systems, not more strategy decks.\n\nFor venture funds looking at AI infrastructure, vertical SaaS or emerging markets, the wedge is practical: companies across LATAM have fragmented workflows, manual sales operations and pressure to adopt AI without internal product capacity.\n\nTecnotitan starts with paid implementation work, turns repeated use cases into reusable software/IP and compounds toward a regional product platform. That gives us service revenue today and SaaS/licensing upside as patterns repeat.\n\nWe are raising a US$500K pre-seed to fund 18 months of paid pilots, product engineering and a repeatable AI delivery platform.\n\nI noticed your connection to {{industria}} in {{pais}} and thought this could fit your view on AI adoption and software infrastructure in under-digitized markets.\n\nIf relevant, I would be glad to send the deck or schedule a 20-minute conversation.\n\nBest regards,\nDavid Arias\nFounder, Tecnotitan\ntecnotitan.com",
  },
  {
    id: "investors-angel-email-1",
    category: "inversionistas",
    channel: "Email",
    title: "Investors - angel angle EN",
    subject: "Tecnotitan | early AI implementation opportunity",
    body:
      "Hi {{primer_nombre}},\n\nI am David Arias, founder of Tecnotitan. We are building from Colombia at the intersection of practical AI, internal software and commercial automation for companies in Latin America.\n\nI am reaching out because angel investors often care about the founder-market fit and the early wedge. Ours is hands-on: we sell and implement real systems for companies now, learn from repeated operational pain and turn those patterns into reusable products.\n\nThe opportunity is to become the trusted AI implementation layer for businesses that cannot hire full product/AI teams but urgently need automation, integrations and better operating data.\n\nWe are raising a US$500K pre-seed to move from paid implementation work into a repeatable product platform.\n\nIf this is close to your interests, I would be glad to share the deck or have a short conversation.\n\nBest regards,\nDavid Arias\nFounder, Tecnotitan\ntecnotitan.com",
  },
  {
    id: "investors-strategic-email-1",
    category: "inversionistas",
    channel: "Email",
    title: "Investors - strategic angle EN",
    subject: "Tecnotitan | strategic AI implementation layer for LATAM",
    body:
      "Hi {{primer_nombre}},\n\nI am David Arias, founder of Tecnotitan. We are building an AI implementation and software platform for Latin American companies that need to modernize operations without building large internal product teams.\n\nFor a strategic investor, the angle is not only financial. Tecnotitan can become a regional implementation layer: CRM, sales automation, integrations, data workflows and AI tools that convert operational friction into measurable systems.\n\nWe start through paid projects, capture repeatable use cases and build reusable IP around sectors, workflows and AI delivery. That creates potential strategic value for partners with exposure to SMEs, B2B services, enterprise software or digital transformation.\n\nWe are raising a US$500K pre-seed to finance pilots, product engineering and a repeatable delivery platform.\n\nI noticed your connection to {{industria}} in {{pais}} and thought a strategic conversation could be useful.\n\nBest regards,\nDavid Arias\nFounder, Tecnotitan\ntecnotitan.com",
  },
  {
    id: "investors-english-followup-1",
    category: "seguimiento",
    channel: "Email",
    title: "Investors - follow-up EN",
    subject: "Re: Tecnotitan and the LATAM software opportunity",
    body:
      "Hi {{primer_nombre}},\n\nI wanted to follow up on my previous note about Tecnotitan.\n\nWe are building practical AI and software infrastructure for Latin American companies, starting with CRM, sales automation, integrations and internal tools that make business operations more measurable and scalable.\n\nIf this is within your investment focus, I can send a concise overview with traction, product direction and the market thesis.\n\nBest regards,\nDavid Arias\nFounder, Tecnotitan\ntecnotitan.com",
  },
  {
    id: "investors-english-deck-followup-1",
    category: "seguimiento",
    channel: "Email",
    title: "Investors - send deck after interest EN",
    subject: "Tecnotitan investor deck",
    body:
      "Hi {{primer_nombre}},\n\nThank you for your interest in Tecnotitan.\n\nI am attaching the investor deck with a concise overview of what we are building, the product direction, the market thesis and the opportunity we see around practical AI and software infrastructure for companies in Latin America.\n\nIf useful, I would be glad to schedule a 20-minute conversation to walk you through the strategy and answer any questions.\n\nBest regards,\nDavid Arias\nFounder, Tecnotitan\ntecnotitan.com",
  },
  {
    id: "investors-english-institutional-1",
    category: "institucional",
    channel: "Email",
    title: "Tecnotitan institutional intro EN",
    subject: "Introducing Tecnotitan",
    body:
      "Hi {{primer_nombre}},\n\nI am David Arias, founder of Tecnotitan.\n\nTecnotitan is a software, automation and artificial intelligence company building practical systems for Latin American businesses: CRM, commercial automation, integrations, internal tools and AI solutions for real operational workflows.\n\nOur approach is simple: understand the process, identify measurable friction and build software that helps teams sell better, operate with more clarity and reduce manual work.\n\nI would be glad to briefly introduce what we are building and explore whether there could be a strategic conversation with {{empresa}}.\n\nBest regards,\nDavid Arias\nFounder, Tecnotitan\ntecnotitan.com",
  },
  {
    id: "inversionistas-linkedin-1",
    category: "inversionistas",
    channel: "LinkedIn",
    title: "Inversionistas - conexion LinkedIn",
    subject: "",
    body:
      "Hola {{nombre}}, estoy construyendo Tecnotitan, una compania de software e IA enfocada en empresas de LATAM. Vi tu perfil de inversion y me gustaria conectar para compartirte el avance cuando tenga sentido.",
  },
  {
    id: "seguimiento-email-1",
    category: "seguimiento",
    channel: "Email",
    title: "Seguimiento - segundo contacto profesional",
    subject: "Re: oportunidad para {{empresa}}",
    body:
      "Hola {{primer_nombre}},\n\nTe escribo para hacer seguimiento a mi mensaje anterior.\n\nCreo que podria haber una oportunidad interesante para {{empresa}} en {{industria}}, especialmente en automatizacion, integracion de sistemas o uso practico de IA en procesos comerciales y operativos.\n\nSi no eres la persona correcta, con gusto me indicas quien podria revisar este tema internamente.\n\nSaludos,\nDavid Arias\nFundador, Tecnotitan",
  },
  {
    id: "seguimiento-linkedin-1",
    category: "seguimiento",
    channel: "LinkedIn",
    title: "Seguimiento - LinkedIn",
    subject: "",
    body:
      "Hola {{nombre}}, te dejo una nota corta de seguimiento. Si en {{empresa}} estan revisando automatizacion, software interno o IA aplicada a operaciones, puedo compartirte ideas concretas sin compromiso.",
  },
  {
    id: "reactivacion-email-1",
    category: "reactivacion",
    channel: "Email",
    title: "Reactivacion - retomar oportunidad",
    subject: "Retomamos la conversacion sobre {{empresa}}?",
    body:
      "Hola {{primer_nombre}},\n\nHace un tiempo dejamos pendiente conversar sobre posibles mejoras para {{empresa}} en {{pais}}.\n\nTe escribo porque en Tecnotitan hemos avanzado en soluciones de software, automatizacion e IA que pueden aplicar muy bien a equipos que buscan crecer sin aumentar friccion operativa.\n\nSi sigue siendo relevante, puedo enviarte una propuesta breve o agendar una llamada corta.\n\nSaludos,\nDavid Arias\nFundador, Tecnotitan",
  },
  {
    id: "reactivacion-linkedin-1",
    category: "reactivacion",
    channel: "LinkedIn",
    title: "Reactivacion - LinkedIn",
    subject: "",
    body:
      "Hola {{nombre}}, retomo contacto. Si en {{empresa}} siguen explorando mejoras con software, automatizacion o IA, puedo compartirte una idea concreta y breve para evaluar.",
  },
  {
    id: "institucional-email-1",
    category: "institucional",
    channel: "Email",
    title: "Presentacion institucional - Tecnotitan",
    subject: "Presentacion institucional de Tecnotitan",
    body:
      "Hola {{primer_nombre}},\n\nSoy David Arias, fundador de Tecnotitan.\n\nTecnotitan es una compania de software, automatizacion e inteligencia artificial enfocada en construir sistemas practicos para empresas en America Latina: CRM, automatizacion comercial, integraciones, herramientas internas y soluciones de IA aplicadas a operaciones reales.\n\nNuestro enfoque es simple: entender el proceso, identificar fricciones medibles y construir software que ayude a vender mejor, operar con mas claridad y reducir trabajo manual.\n\nMe gustaria presentarte brevemente lo que estamos construyendo y explorar si existe una oportunidad de colaboracion con {{empresa}} en {{industria}}.\n\nSaludos,\nDavid Arias\nFundador, Tecnotitan\ntecnotitan.com",
  },
];

function apiHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${state.token}`,
  };
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...apiHeaders(),
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Error ${response.status}`);
  return payload;
}

function setStatus(message, tone = "neutral") {
  elements.status.textContent = message;
  elements.status.dataset.tone = tone;
}

function setLoginStatus(message, tone = "neutral") {
  elements.loginStatus.textContent = message;
  elements.loginStatus.dataset.tone = tone;
}

function showApp() {
  elements.loginScreen.classList.add("hidden");
  elements.appShell.classList.remove("hidden");
  activateTab(activeTab);
}

function showLogin() {
  elements.appShell.classList.add("hidden");
  elements.loginScreen.classList.remove("hidden");
}

function roleLabel(role) {
  if (role === "admin") return "Maestro";
  if (role === "sales") return "Consultor";
  if (role === "consultant") return "Consultor";
  return "Usuario";
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderSessionUser() {
  const user = state.currentUser;
  if (!user) {
    elements.sessionUser.textContent = "Sesion";
    return;
  }

  elements.sessionUser.textContent = `${user.name || user.username} · ${roleLabel(user.role)}`;
}

function renderMetrics(data) {
  state.currentUser = data.user || state.currentUser;
  state.assignmentWorkload = data.assignmentWorkload || state.assignmentWorkload;
  elements.metrics.innerHTML = [
    ["Empresas", data.companies ?? "-"],
    ["Contactos", data.contacts ?? "-"],
    ["Leads", data.leadsInAirport ?? "-"],
    ["Clientes", data.clientsProcessed ?? "-"],
    ["Archivo", data.archived ?? "-"],
    ["Oportunidades", data.opportunities ?? "-"],
    ["Busquedas", data.searches ?? "-"],
    ["Hot", data.hot ?? "-"],
    ["Warm", data.warm ?? "-"],
    ["Vencidos", data.overdueFollowups ?? "-"],
    ["Hoy", data.todayFollowups ?? "-"],
  ]
    .map(
      ([label, value]) => `
        <article>
          <span>${label}</span>
          <strong>${value}</strong>
        </article>
      `
    )
    .join("");
  renderExecutiveDashboard(data.executiveWeekly || []);
  renderApolloPerformance(data.apolloPerformance);
  renderAssignmentWorkload(data.assignmentWorkload);
}

function sumWeekly(rows, field) {
  return (rows || []).reduce((sum, row) => sum + Number(row[field] || 0), 0);
}

function renderExecutiveDashboard(rows) {
  if (!elements.executiveSummary || !elements.executiveWeekly) return;
  if (state.currentUser?.role !== "admin") {
    elements.executiveSummary.innerHTML = "";
    elements.executiveWeekly.innerHTML = "";
    return;
  }
  if (!rows.length) {
    elements.executiveSummary.innerHTML = `<p class="empty">No hay metricas ejecutivas disponibles.</p>`;
    elements.executiveWeekly.innerHTML = "";
    return;
  }
  const leads = sumWeekly(rows, "leads_obtained");
  const details = sumWeekly(rows, "details_consumed");
  const clients = sumWeekly(rows, "clients_processed");
  const meetings = sumWeekly(rows, "meetings");
  const proposals = sumWeekly(rows, "proposals");
  const won = sumWeekly(rows, "won");
  const credits = sumWeekly(rows, "apollo_credits_used");
  const conversion = leads ? Math.round((won / leads) * 1000) / 10 : 0;
  elements.executiveSummary.innerHTML = [
    ["Leads obtenidos", leads],
    ["Detalles consumidos", details],
    ["Clientes procesados", clients],
    ["Reuniones", meetings],
    ["Propuestas", proposals],
    ["Ganados", won],
    ["Conversion", `${conversion}%`],
    ["Creditos Apollo", credits],
  ]
    .map(
      ([label, value]) => `
        <article>
          <span>${label}</span>
          <strong>${value}</strong>
        </article>
      `
    )
    .join("");
  elements.executiveWeekly.innerHTML = `
    <div class="executive-row executive-head">
      <span>Semana</span>
      <span>Leads</span>
      <span>Detalles</span>
      <span>Clientes</span>
      <span>Reuniones</span>
      <span>Propuestas</span>
      <span>Ganados</span>
      <span>Conv.</span>
      <span>Creditos</span>
    </div>
    ${rows
      .map(
        (row) => `
          <div class="executive-row">
            <span>${new Date(`${row.week}T00:00:00Z`).toLocaleDateString("es-CO", { month: "short", day: "numeric" })}</span>
            <span>${row.leads_obtained}</span>
            <span>${row.details_consumed}</span>
            <span>${row.clients_processed}</span>
            <span>${row.meetings}</span>
            <span>${row.proposals}</span>
            <span>${row.won}</span>
            <span>${row.conversion_rate}%</span>
            <span>${row.apollo_credits_used}</span>
          </div>
        `
      )
      .join("")}
  `;
}

function formatMetricNumber(value, suffix = "") {
  if (value === null || value === undefined || value === "") return "-";
  const number = Number(value);
  if (!Number.isFinite(number)) return `${value}${suffix}`;
  return `${number.toLocaleString("es-CO", { maximumFractionDigits: 2 })}${suffix}`;
}

function renderApolloPerformance(data) {
  if (!elements.apolloPerformance) return;
  if (state.currentUser?.role !== "admin") {
    elements.apolloPerformance.innerHTML = "";
    return;
  }
  if (!data) {
    elements.apolloPerformance.innerHTML = `<p class="empty">No hay datos de performance Apollo disponibles.</p>`;
    return;
  }

  const sinceLabel = data.since
    ? new Date(data.since).toLocaleDateString("es-CO", { month: "short", day: "numeric" })
    : "ultimos 30 dias";
  const bestSegment = data.best_segment?.label || "Sin ganador aun";
  const bestTemplate = data.best_template?.template || "Sin plantilla aun";
  const segmentRows = data.segments?.length
    ? data.segments
        .map(
          (row) => `
            <div class="performance-row">
              <span>${escapeHtml(row.label)}</span>
              <span>${formatMetricNumber(row.sent)}</span>
              <span>${formatMetricNumber(row.replies)} / ${formatMetricNumber(row.reply_rate, "%")}</span>
              <span>${formatMetricNumber(row.bounced)} / ${formatMetricNumber(row.bounce_rate, "%")}</span>
            </div>
          `
        )
        .join("")
    : `<p class="empty">Todavia no hay segmentos con envios.</p>`;
  const templateRows = data.templates?.length
    ? data.templates
        .map(
          (row) => `
            <div class="performance-row template-row">
              <span>${escapeHtml(row.template)}</span>
              <span>${formatMetricNumber(row.searches)}</span>
              <span>${formatMetricNumber(row.leads_saved)}</span>
            </div>
          `
        )
        .join("")
    : `<p class="empty">Todavia no hay plantillas Apollo medidas.</p>`;

  elements.apolloPerformance.innerHTML = `
    <div class="performance-title">
      <div>
        <h3>Apollo credits + performance</h3>
        <p>Lectura desde ${sinceLabel}: creditos consumidos, emails utiles y respuesta comercial.</p>
      </div>
      <span>30 dias</span>
    </div>
    <div class="executive-summary performance-kpis">
      <article>
        <span>Creditos Apollo usados</span>
        <strong>${formatMetricNumber(data.credits_used)}</strong>
      </article>
      <article>
        <span>Emails validos producidos</span>
        <strong>${formatMetricNumber(data.valid_emails)}</strong>
      </article>
      <article>
        <span>Creditos / lead usable</span>
        <strong>${formatMetricNumber(data.credits_per_usable_lead)}</strong>
      </article>
      <article>
        <span>Tasa de rebote</span>
        <strong>${formatMetricNumber(data.bounce_rate, "%")}</strong>
      </article>
      <article>
        <span>Tasa de respuesta</span>
        <strong>${formatMetricNumber(data.reply_rate, "%")}</strong>
      </article>
      <article>
        <span>Mejor segmento</span>
        <strong>${escapeHtml(bestSegment)}</strong>
      </article>
    </div>
    <div class="performance-grid">
      <article>
        <h4>Segmentos que mejor funcionan</h4>
        <div class="performance-table">
          <div class="performance-row performance-head">
            <span>Segmento</span>
            <span>Enviados</span>
            <span>Respuestas</span>
            <span>Rebotes</span>
          </div>
          ${segmentRows}
        </div>
      </article>
      <article>
        <h4>Plantillas Apollo por inventario</h4>
        <div class="performance-table">
          <div class="performance-row performance-head template-row">
            <span>Plantilla</span>
            <span>Busquedas</span>
            <span>Leads guardadas</span>
          </div>
          ${templateRows}
        </div>
        <p class="performance-note">Mejor plantilla actual: ${escapeHtml(bestTemplate)}.</p>
      </article>
    </div>
  `;
}

function workloadForUser(userId) {
  return state.assignmentWorkload?.rows?.find((row) => row.user_id === userId) || null;
}

function assignmentOptionLabel(user) {
  const workload = workloadForUser(user.id);
  if (!workload) return user.name;
  return `${user.name} (${workload.clients} clientes / ${workload.leads} leads)`;
}

function userWorkloadSummary(userId) {
  const workload = workloadForUser(userId);
  return workload ? ` | ${workload.total} oportunidades (${workload.clients} clientes / ${workload.leads} leads)` : "";
}

function assignmentOptions(currentOwnerId) {
  return `
    <option value="__unassigned__" ${!currentOwnerId ? "selected" : ""}>Sin asignar</option>
    ${state.users
      .filter((user) => user.is_active && user.role !== "admin")
      .map((user) => `<option value="${user.id}" ${currentOwnerId === user.id ? "selected" : ""}>${assignmentOptionLabel(user)}</option>`)
      .join("")}
  `;
}

function renderAssignmentWorkload(workload) {
  if (!elements.assignmentWorkload) return;
  if (state.currentUser?.role !== "admin") {
    elements.assignmentWorkload.innerHTML = "";
    return;
  }
  const rows = workload?.rows || [];
  const unassigned = workload?.unassigned || { total: 0, leads: 0, clients: 0 };
  if (!rows.length && !unassigned.total) {
    elements.assignmentWorkload.innerHTML = `<p class="empty">Todavia no hay carga asignada.</p>`;
    return;
  }
  elements.assignmentWorkload.innerHTML = `
    <article class="workload-card unassigned">
      <div>
        <strong>Sin asignar</strong>
        <span>${unassigned.total} oportunidades</span>
      </div>
      <small>${unassigned.leads} leads | ${unassigned.clients} clientes</small>
    </article>
    ${rows
      .map(
        (row) => `
          <article class="workload-card">
            <div>
              <strong>${row.name}</strong>
              <span>${row.total} oportunidades</span>
            </div>
            <div class="workload-stats">
              <span>${row.leads} leads</span>
              <span>${row.clients} clientes</span>
              <span>${row.hot} hot</span>
              <span>${row.overdue} vencidos</span>
              <span>${row.today} hoy</span>
            </div>
          </article>
        `
      )
      .join("")}
  `;
}

function renderOrigamiPeopleSearches(searches = state.origamiPeopleSearches) {
  if (!elements.origamiPersonSearchResults) return;
  if (!searches?.length) {
    elements.origamiPersonSearchResults.innerHTML = `<p class="empty">No hay busquedas personales todavia.</p>`;
    return;
  }
  elements.origamiPersonSearchResults.innerHTML = searches
    .map((search) => {
      const profile = search.result_profile || {};
      const draft = search.email_draft || {};
      const signals = Array.isArray(profile.signals) ? profile.signals : [];
      const risks = Array.isArray(profile.risks) ? profile.risks : [];
      return `
        <article class="origami-search-card">
          <header>
            <div>
              <strong>${escapeHtml(profile.person_name || search.query_name || "Persona sin nombre")}</strong>
              <span>${escapeHtml(profile.current_title || "")}${profile.company_name || search.query_company ? ` | ${escapeHtml(profile.company_name || search.query_company)}` : ""}</span>
            </div>
            <span class="status-badge">${escapeHtml(origamiStatusLabel(search.status))}</span>
          </header>
          ${
            profile.summary
              ? `
                <p>${escapeHtml(profile.summary)}</p>
                <div class="origami-search-meta">
                  <span>Fit: ${escapeHtml(profile.fit_for_tecnotitan || "unknown")}</span>
                  <span>Cold email: ${escapeHtml(profile.cold_email_fit || "unknown")}</span>
                  <span>Canal: ${escapeHtml(profile.recommended_channel || "manual_review")}</span>
                  <span>Confianza: ${escapeHtml(profile.confidence || "low")}</span>
                </div>
                <div class="origami-search-meta">
                  <span>Pitch email: ${escapeHtml(profile.official_pitch_email || "No encontrado")}</span>
                  <span>Alias: ${escapeHtml(profile.pitch_email_alias_type || "unknown")}</span>
                  <span>Canal pitch: ${escapeHtml(profile.official_pitch_channel || "unknown")}</span>
                  <span>Politica: ${escapeHtml(profile.pitch_policy || "unknown")}</span>
                </div>
                ${profile.official_pitch_url ? `<small>Fuente pitch: <a href="${attr(profile.official_pitch_url)}" target="_blank" rel="noopener">Abrir fuente oficial</a></small>` : ""}
                ${profile.pitch_detection_evidence ? `<small>Evidencia pitch: ${escapeHtml(profile.pitch_detection_evidence)}</small>` : ""}
                ${profile.personalization_angle ? `<small>Angulo: ${escapeHtml(profile.personalization_angle)}</small>` : ""}
                ${signals.length ? `<ul>${signals.slice(0, 4).map((signal) => `<li>${escapeHtml(signal)}</li>`).join("")}</ul>` : ""}
                ${risks.length ? `<small>Riesgos: ${risks.map(escapeHtml).join(" | ")}</small>` : ""}
              `
              : `<p class="empty">${search.status === "running" ? "Origami sigue investigando..." : escapeHtml(search.error || "Sin resultado todavia.")}</p>`
          }
          ${
            draft.email_body || draft.recommended_subject
              ? `
                <details>
                  <summary>Borrador sugerido</summary>
                  ${draft.recommended_subject ? `<small>Asunto: ${escapeHtml(draft.recommended_subject)}</small>` : ""}
                  ${draft.email_body ? `<pre>${escapeHtml(draft.email_body)}</pre>` : ""}
                </details>
              `
              : ""
          }
          <footer>
            <button class="secondary" type="button" data-refresh-origami-search="${attr(search.id)}" ${search.status === "running" ? "" : "disabled"}>Actualizar</button>
            <button class="secondary" type="button" data-copy-origami-search="${attr(search.id)}">Copiar inteligencia</button>
          </footer>
        </article>
      `;
    })
    .join("");

  elements.origamiPersonSearchResults.querySelectorAll("[data-refresh-origami-search]").forEach((button) => {
    if (button.disabled) return;
    button.addEventListener("click", () => refreshOrigamiPeopleSearch(button.dataset.refreshOrigamiSearch, true));
  });
  elements.origamiPersonSearchResults.querySelectorAll("[data-copy-origami-search]").forEach((button) => {
    button.addEventListener("click", () => copyOrigamiPeopleSearch(button.dataset.copyOrigamiSearch));
  });
}

function copyOrigamiPeopleSearch(id) {
  const search = state.origamiPeopleSearches.find((item) => item.id === id);
  if (!search) return;
  const profile = search.result_profile || {};
  const draft = search.email_draft || {};
  const text = [
    `Persona: ${profile.person_name || search.query_name}`,
    `Empresa: ${profile.company_name || search.query_company || ""}`,
    `Resumen: ${profile.summary || ""}`,
    `Fit: ${profile.fit_for_tecnotitan || "unknown"}`,
    `Cold email fit: ${profile.cold_email_fit || "unknown"}`,
    `Pitch email: ${profile.official_pitch_email || ""}`,
    `Canal pitch: ${profile.official_pitch_channel || "unknown"}`,
    `Politica pitch: ${profile.pitch_policy || "unknown"}`,
    `Alias pitch: ${profile.pitch_email_alias_type || "unknown"}`,
    `Fuente pitch: ${profile.official_pitch_url || ""}`,
    `Evidencia pitch: ${profile.pitch_detection_evidence || ""}`,
    `Canal recomendado: ${profile.recommended_channel || ""}`,
    `Angulo: ${profile.personalization_angle || ""}`,
    draft.recommended_subject ? `Asunto: ${draft.recommended_subject}` : "",
    draft.email_body || "",
  ]
    .filter(Boolean)
    .join("\n");
  copyValue(text, "Inteligencia Origami");
}

function scheduleOrigamiSearchPoll(id, attempt = 1) {
  if (!id) return;
  if (state.origamiSearchPollTimer) window.clearTimeout(state.origamiSearchPollTimer);
  state.origamiSearchPollTimer = window.setTimeout(async () => {
    try {
      const search = await refreshOrigamiPeopleSearch(id, false);
      if (search?.status === "running" && attempt < ORIGAMI_MAX_POLL_ATTEMPTS) {
        scheduleOrigamiSearchPoll(id, attempt + 1);
      }
    } catch (error) {
      if (elements.origamiPersonSearchStatus) elements.origamiPersonSearchStatus.textContent = error.message;
    }
  }, ORIGAMI_POLL_INTERVAL_MS);
}

async function refreshOrigamiPeopleSearch(id, manual = false) {
  const result = await api("/api/origami-search", {
    method: "POST",
    body: JSON.stringify({ action: "refresh", id }),
  });
  state.origamiPeopleSearches = result.searches || [];
  renderOrigamiPeopleSearches();
  if (elements.origamiPersonSearchStatus) {
    elements.origamiPersonSearchStatus.textContent = manual ? "Busqueda actualizada." : "Origami sigue trabajando...";
  }
  return result.search;
}

async function createOrigamiPeopleSearch() {
  if (!state.origamiConfigured) {
    elements.origamiPersonSearchStatus.textContent = "Origami no esta configurado.";
    return;
  }
  const name = elements.origamiPersonName.value.trim();
  if (!name) {
    elements.origamiPersonSearchStatus.textContent = "Escribe el nombre de la persona.";
    return;
  }
  const originalText = elements.origamiPersonSearchButton.textContent;
  elements.origamiPersonSearchButton.disabled = true;
  elements.origamiPersonSearchButton.textContent = "Buscando...";
  elements.origamiPersonSearchStatus.textContent = "Origami esta investigando...";
  try {
    const result = await api("/api/origami-search", {
      method: "POST",
      body: JSON.stringify({
        query_name: name,
        query_company: elements.origamiPersonCompany.value.trim(),
        query_linkedin_url: elements.origamiPersonLinkedin.value.trim(),
        query_notes: elements.origamiPersonNotes.value.trim(),
        search_purpose: elements.origamiPersonPurpose.value,
      }),
    });
    state.origamiPeopleSearches = result.searches || [];
    renderOrigamiPeopleSearches();
    if (result.search?.status === "running") {
      scheduleOrigamiSearchPoll(result.search.id);
      elements.origamiPersonSearchStatus.textContent = "Busqueda creada. El CRM actualizara automaticamente.";
    } else {
      elements.origamiPersonSearchStatus.textContent = "Busqueda Origami lista.";
    }
  } catch (error) {
    elements.origamiPersonSearchStatus.textContent = error.message;
  } finally {
    elements.origamiPersonSearchButton.disabled = false;
    elements.origamiPersonSearchButton.textContent = originalText;
  }
}

function renderOrigamiJobSearches(searches = state.origamiJobSearches) {
  if (!elements.origamiJobSearchResults) return;
  if (!searches?.length) {
    elements.origamiJobSearchResults.innerHTML = `<p class="empty">No hay busquedas laborales todavia.</p>`;
    return;
  }
  elements.origamiJobSearchResults.innerHTML = searches
    .map((search) => {
      const summary = search.result_summary || {};
      const opportunities = Array.isArray(search.opportunities) ? search.opportunities : [];
      const templates = search.message_templates || {};
      return `
        <article class="origami-search-card">
          <header>
            <div>
              <strong>${escapeHtml(search.target_person || "Oscar")} | ${escapeHtml(search.target_role || "Cargo objetivo")}</strong>
              <span>${escapeHtml(search.target_locations || "Ubicacion abierta")}${search.seniority ? ` | ${escapeHtml(search.seniority)}` : ""}</span>
            </div>
            <span class="status-badge">${escapeHtml(origamiStatusLabel(search.status))}</span>
          </header>
          ${
            summary.summary
              ? `
                <p>${escapeHtml(summary.summary)}</p>
                <div class="origami-search-meta">
                  <span>Angulo: ${escapeHtml(summary.best_search_angle || "Por definir")}</span>
                  <span>Confianza: ${escapeHtml(summary.confidence || "low")}</span>
                  <span>Oportunidades: ${opportunities.length}</span>
                </div>
                ${
                  opportunities.length
                    ? `
                      <div class="origami-job-opportunities">
                        ${opportunities
                          .slice(0, 8)
                          .map(
                            (item, index) => `
                              <section>
                                <strong>#${index + 1} ${escapeHtml(item.role || "Rol objetivo")} | ${escapeHtml(item.company || "Empresa")}</strong>
                                <span>${escapeHtml(item.location || "Ubicacion no confirmada")} | Fit: ${escapeHtml(item.fit_score || "unknown")} | Canal: ${escapeHtml(item.application_channel || "manual_review")}</span>
                                ${item.why_fit ? `<p>${escapeHtml(item.why_fit)}</p>` : ""}
                                <div class="origami-search-meta">
                                  ${item.hr_email ? `<span>HR: ${escapeHtml(item.hr_email)}</span>` : ""}
                                  ${item.recruiter_name ? `<span>Recruiter: ${escapeHtml(item.recruiter_name)}</span>` : ""}
                                  ${item.job_url ? `<span>Vacante oficial encontrada</span>` : ""}
                                  ${item.recruiter_linkedin ? `<span>LinkedIn recruiter</span>` : ""}
                                </div>
                                ${item.message_angle ? `<small>Mensaje: ${escapeHtml(item.message_angle)}</small>` : ""}
                              </section>
                            `
                          )
                          .join("")}
                      </div>
                    `
                    : `<p class="empty">Origami no encontro oportunidades concretas todavia.</p>`
                }
                ${
                  Array.isArray(summary.next_steps) && summary.next_steps.length
                    ? `<small>Proximos pasos: ${summary.next_steps.map(escapeHtml).join(" | ")}</small>`
                    : ""
                }
              `
              : `<p class="empty">${search.status === "running" ? "Origami sigue buscando oportunidades..." : escapeHtml(search.error || "Sin resultado todavia.")}</p>`
          }
          ${
            templates.recruiter_email_body || templates.linkedin_connection
              ? `
                <details>
                  <summary>Mensajes sugeridos</summary>
                  ${templates.linkedin_connection ? `<small>LinkedIn: ${escapeHtml(templates.linkedin_connection)}</small>` : ""}
                  ${templates.recruiter_email_subject ? `<small>Asunto: ${escapeHtml(templates.recruiter_email_subject)}</small>` : ""}
                  ${templates.recruiter_email_body ? `<pre>${escapeHtml(templates.recruiter_email_body)}</pre>` : ""}
                  ${templates.follow_up ? `<small>Follow-up: ${escapeHtml(templates.follow_up)}</small>` : ""}
                </details>
              `
              : ""
          }
          <footer>
            <button class="secondary" type="button" data-refresh-origami-job="${attr(search.id)}" ${search.status === "running" ? "" : "disabled"}>Actualizar</button>
            <button class="secondary" type="button" data-copy-origami-job="${attr(search.id)}">Copiar oportunidades</button>
          </footer>
        </article>
      `;
    })
    .join("");

  elements.origamiJobSearchResults.querySelectorAll("[data-refresh-origami-job]").forEach((button) => {
    if (button.disabled) return;
    button.addEventListener("click", () => refreshOrigamiJobSearch(button.dataset.refreshOrigamiJob, true));
  });
  elements.origamiJobSearchResults.querySelectorAll("[data-copy-origami-job]").forEach((button) => {
    button.addEventListener("click", () => copyOrigamiJobSearch(button.dataset.copyOrigamiJob));
  });
}

function copyOrigamiJobSearch(id) {
  const search = state.origamiJobSearches.find((item) => item.id === id);
  if (!search) return;
  const summary = search.result_summary || {};
  const opportunities = Array.isArray(search.opportunities) ? search.opportunities : [];
  const templates = search.message_templates || {};
  const text = [
    `Busqueda empleo: ${search.target_person || "Oscar"} - ${search.target_role || ""}`,
    `Resumen: ${summary.summary || ""}`,
    `Angulo: ${summary.best_search_angle || ""}`,
    "",
    ...opportunities.slice(0, 8).map((item, index) =>
      [
        `#${index + 1} ${item.company || ""} - ${item.role || ""}`,
        `Ubicacion: ${item.location || ""}`,
        `Fit: ${item.fit_score || "unknown"} | Canal: ${item.application_channel || ""}`,
        `Vacante: ${item.job_url || ""}`,
        `HR: ${item.hr_email || ""}`,
        `Recruiter: ${item.recruiter_name || ""} ${item.recruiter_linkedin || ""}`,
        `Por que: ${item.why_fit || ""}`,
      ]
        .filter(Boolean)
        .join("\n")
    ),
    "",
    templates.recruiter_email_subject ? `Asunto: ${templates.recruiter_email_subject}` : "",
    templates.recruiter_email_body || "",
    templates.linkedin_connection ? `LinkedIn: ${templates.linkedin_connection}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  copyValue(text, "Oportunidades para Oscar");
}

function scheduleOrigamiJobPoll(id, attempt = 1) {
  if (!id) return;
  if (state.origamiJobPollTimer) window.clearTimeout(state.origamiJobPollTimer);
  state.origamiJobPollTimer = window.setTimeout(async () => {
    try {
      const search = await refreshOrigamiJobSearch(id, false);
      if (search?.status === "running" && attempt < ORIGAMI_MAX_POLL_ATTEMPTS) {
        scheduleOrigamiJobPoll(id, attempt + 1);
      }
    } catch (error) {
      if (elements.origamiJobSearchStatus) elements.origamiJobSearchStatus.textContent = error.message;
    }
  }, ORIGAMI_POLL_INTERVAL_MS);
}

async function refreshOrigamiJobSearch(id, manual = false) {
  const result = await api("/api/origami-jobs", {
    method: "POST",
    body: JSON.stringify({ action: "refresh", id }),
  });
  state.origamiJobSearches = result.searches || [];
  renderOrigamiJobSearches();
  if (elements.origamiJobSearchStatus) {
    elements.origamiJobSearchStatus.textContent = manual ? "Busqueda laboral actualizada." : "Origami sigue buscando empleos...";
  }
  return result.search;
}

async function createOrigamiJobSearch() {
  if (!state.origamiConfigured) {
    elements.origamiJobSearchStatus.textContent = "Origami no esta configurado.";
    return;
  }
  const role = elements.origamiJobRole.value.trim();
  if (!role) {
    elements.origamiJobSearchStatus.textContent = "Escribe el cargo objetivo para Oscar.";
    return;
  }
  const originalText = elements.origamiJobSearchButton.textContent;
  elements.origamiJobSearchButton.disabled = true;
  elements.origamiJobSearchButton.textContent = "Buscando...";
  elements.origamiJobSearchStatus.textContent = "Origami esta buscando oportunidades para Oscar...";
  try {
    const result = await api("/api/origami-jobs", {
      method: "POST",
      body: JSON.stringify({
        target_person: "Oscar",
        target_role: role,
        target_locations: elements.origamiJobLocations.value.trim(),
        target_keywords: elements.origamiJobKeywords.value.trim(),
        seniority: elements.origamiJobSeniority.value,
        candidate_profile: elements.origamiJobProfile.value.trim(),
        notes: elements.origamiJobNotes.value.trim(),
      }),
    });
    state.origamiJobSearches = result.searches || [];
    renderOrigamiJobSearches();
    if (result.search?.status === "running") {
      scheduleOrigamiJobPoll(result.search.id);
      elements.origamiJobSearchStatus.textContent = "Busqueda laboral creada. El CRM actualizara automaticamente.";
    } else {
      elements.origamiJobSearchStatus.textContent = "Busqueda laboral lista.";
    }
  } catch (error) {
    elements.origamiJobSearchStatus.textContent = error.message;
  } finally {
    elements.origamiJobSearchButton.disabled = false;
    elements.origamiJobSearchButton.textContent = originalText;
  }
}

function renderFollowupList(container, rows) {
  if (!rows.length) {
    container.innerHTML = `<p class="empty">Sin seguimientos.</p>`;
    return;
  }

  container.innerHTML = rows
    .map((row) => {
      const contact = row.contacts || {};
      const company = row.companies || {};
      return `
        <button class="followup-row" type="button" data-open-detail="${row.id}">
          <strong>${contact.full_name || "Contacto sin nombre"}</strong>
          <span>${company.name || "Empresa no disponible"}</span>
          <small>${row.next_follow_up_at} · ${row.next_follow_up_type || "Seguimiento"}</small>
        </button>
      `;
    })
    .join("");

  container.querySelectorAll("[data-open-detail]").forEach((button) => {
    button.addEventListener("click", () => openLeadDetail(button.dataset.openDetail));
  });
}

function renderFollowups(data) {
  renderFollowupList(elements.followupsOverdue, data.overdue || []);
  renderFollowupList(elements.followupsToday, data.today || []);
  renderFollowupList(elements.followupsUpcoming, data.upcoming || []);
}

function canSeeTab(tab) {
  const tabLink = document.querySelector(`[data-tab="${tab}"]`);
  return Boolean(tabLink && !tabLink.classList.contains("role-hidden"));
}

function firstVisibleTab() {
  const tab = Array.from(elements.tabs).find((node) => !node.classList.contains("role-hidden"));
  return tab?.dataset.tab || "dashboard";
}

function activateTab(tab, updateHash = false) {
  const requestedTab = tab || "dashboard";
  activeTab = canSeeTab(requestedTab) ? requestedTab : firstVisibleTab();

  elements.tabs.forEach((node) => {
    const isActive = node.dataset.tab === activeTab;
    node.classList.toggle("active", isActive);
    if (isActive && updateHash) {
      history.replaceState(null, "", node.getAttribute("href"));
    }
    if (isActive) {
      node.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  });

  elements.tabPanels.forEach((panel) => {
    panel.classList.toggle("tab-hidden", panel.dataset.tabPanel !== activeTab);
  });
}

function tabFromHash() {
  return String(window.location.hash || "#dashboard").replace("#", "") || "dashboard";
}

function leadTypeLabel(type) {
  return type === "investor" ? "Inversionista" : "Consultoria";
}

function regionLabel(region) {
  const labels = { latam: "LATAM", usa: "USA", europe: "Europa" };
  return labels[region] || region || "Region";
}

function readableFilters(filters) {
  const data = filters || {};
  const pieces = [];
  if (Array.isArray(data.person_titles) && data.person_titles.length) {
    pieces.push(`Cargos: ${data.person_titles.slice(0, 4).join(", ")}`);
  }
  if (Array.isArray(data.organization_locations) && data.organization_locations.length) {
    pieces.push(`Ubicaciones: ${data.organization_locations.slice(0, 4).join(", ")}`);
  }
  if (Array.isArray(data.person_locations) && data.person_locations.length) {
    pieces.push(`Personas: ${data.person_locations.slice(0, 4).join(", ")}`);
  }
  if (Array.isArray(data.organization_num_employees_ranges) && data.organization_num_employees_ranges.length) {
    pieces.push(`Empleados: ${data.organization_num_employees_ranges.join(", ")}`);
  }
  return pieces.length ? pieces.join(" | ") : "Filtros base de la plantilla";
}

function companyField(company, ...keys) {
  const raw = company?.raw_payload || {};
  for (const key of keys) {
    const value = company?.[key] || raw[key];
    if (value !== null && value !== undefined && value !== "") return value;
  }
  return "";
}

function companyDomain(company) {
  return companyField(company, "domain", "primary_domain");
}

function companyWebsite(company) {
  return companyField(company, "website_url") || websiteUrl(company);
}

function companyEmployeeCount(company) {
  return company.employee_range || companyField(company, "employee_count", "estimated_num_employees");
}

function websiteUrl(company) {
  const raw = companyField(company, "website_url") || companyDomain(company) || "";
  if (!raw) return "";
  return raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
}

function attr(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function copyValue(value, label) {
  if (!value) {
    setStatus(`${label} no disponible.`, "warning");
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
    setStatus(`${label} copiado.`, "ok");
  } catch (error) {
    setStatus(`No pude copiar ${label.toLowerCase()}; puedes abrir el detalle y copiarlo manualmente.`, "warning");
  }
}

function openUrl(url, label) {
  if (!url) {
    setStatus(`${label} no disponible.`, "warning");
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

function renderSearchResults(results) {
  if (!elements.searchResults) return;
  if (!results.length) {
    elements.searchResults.classList.remove("hidden");
    elements.searchResults.innerHTML = `<p class="empty">Esta busqueda no tiene resultados guardados.</p>`;
    return;
  }

  elements.searchResults.classList.remove("hidden");
  elements.searchResults.innerHTML = `
    <div class="search-results-title">
      <h3>Leads de la busqueda seleccionada</h3>
      <span>${results.length} resultados</span>
    </div>
    <div class="search-result-list">
      ${results
        .map((row) => {
          const opportunity = row.opportunities || {};
          const contact = opportunity.contacts || {};
          const company = opportunity.companies || {};
          return `
            <article class="search-result-row">
              <div>
                <strong>${contact.full_name || "Contacto sin nombre"}</strong>
                <span>${contact.title || "Cargo no disponible"}</span>
                <small>${company.name || "Empresa no disponible"} | ${contact.country || company.country || "Sin pais"}</small>
              </div>
              <div>
                <strong>${leadTypeLabel(opportunity.lead_type)}</strong>
                <span>${regionLabel(opportunity.target_region)} | ${opportunity.pipeline_status || "nuevo"}</span>
                <small>Score ${opportunity.score ?? "-"} ${opportunity.score_label || ""}</small>
              </div>
              <button class="secondary" type="button" data-open-detail="${opportunity.id || ""}">Ver detalle</button>
            </article>
          `;
        })
        .join("")}
    </div>
  `;

  elements.searchResults.querySelectorAll("[data-open-detail]").forEach((button) => {
    if (!button.dataset.openDetail) {
      button.disabled = true;
      return;
    }
    button.addEventListener("click", () => openLeadDetail(button.dataset.openDetail));
  });
}

function renderSearchHistory(searches) {
  if (!elements.searchHistory) return;
  if (state.currentUser?.role !== "admin") {
    elements.searchHistory.innerHTML = "";
    if (elements.searchResults) elements.searchResults.classList.add("hidden");
    return;
  }

  if (!searches.length) {
    elements.searchHistory.innerHTML = `<p class="empty">Todavia no hay busquedas Apollo guardadas.</p>`;
    if (elements.searchResults) elements.searchResults.classList.add("hidden");
    return;
  }

  elements.searchHistory.innerHTML = searches
    .map(
      (search) => `
        <article class="search-card">
          <div>
            <strong>${search.name}</strong>
            <span>${leadTypeLabel(search.lead_type)} | ${regionLabel(search.target_region)} | ${search.search_template}</span>
            <small>${readableFilters(search.filters)}</small>
          </div>
          <div class="search-card-stats">
            <span>${search.results_saved || 0} guardados</span>
            <span>${search.total_entries || 0} posibles</span>
            <span>${new Date(search.created_at).toLocaleString("es-CO")}</span>
          </div>
          <button class="secondary" type="button" data-open-search="${search.id}">Ver leads</button>
        </article>
      `
    )
    .join("");

  elements.searchHistory.querySelectorAll("[data-open-search]").forEach((button) => {
    button.addEventListener("click", () => openSearchResults(button.dataset.openSearch));
  });
}

function applyRoleVisibility() {
  const isAdmin = state.currentUser?.role === "admin";
  document.querySelectorAll(".admin-only").forEach((node) => {
    node.classList.toggle("role-hidden", !isAdmin);
  });
  renderSessionUser();
  activateTab(tabFromHash() || activeTab);
}

function renderUsers() {
  if (!elements.userList) return;
  if (state.currentUser?.role !== "admin") {
    elements.userList.innerHTML = "";
    return;
  }

  elements.userList.innerHTML = state.users
    .map(
      (user) => `
        <article class="user-row">
          <div>
            <strong>${user.name}</strong>
            <span>${user.username || "sin usuario"} · ${user.email}</span>
            <small>${roleLabel(user.role)} · ${user.is_active ? "Activo" : "Inactivo"}${userWorkloadSummary(user.id)}</small>
          </div>
          <div class="user-actions">
            <select data-user-role="${user.id}">
              <option value="consultant" ${user.role !== "admin" ? "selected" : ""}>Consultor</option>
              <option value="admin" ${user.role === "admin" ? "selected" : ""}>Maestro</option>
            </select>
            <input data-user-password="${user.id}" type="password" placeholder="Nueva contrasena">
            <button type="button" data-save-password="${user.id}">Cambiar</button>
            <button class="secondary" type="button" data-toggle-user="${user.id}" data-active="${user.is_active}">
              ${user.is_active ? "Desactivar" : "Activar"}
            </button>
            <button class="danger" type="button" data-delete-user="${user.id}" data-user-name="${attr(user.name)}">Eliminar</button>
          </div>
        </article>
      `
    )
    .join("");

  elements.userList.querySelectorAll("[data-user-role]").forEach((select) => {
    select.addEventListener("change", () => updateUser(select.dataset.userRole, { role: select.value }));
  });
  elements.userList.querySelectorAll("[data-save-password]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = elements.userList.querySelector(`[data-user-password="${button.dataset.savePassword}"]`);
      if (!input.value.trim()) return;
      updateUser(button.dataset.savePassword, { password: input.value.trim() });
      input.value = "";
    });
  });
  elements.userList.querySelectorAll("[data-toggle-user]").forEach((button) => {
    button.addEventListener("click", () => {
      updateUser(button.dataset.toggleUser, { is_active: button.dataset.active !== "true" });
    });
  });
  elements.userList.querySelectorAll("[data-delete-user]").forEach((button) => {
    button.addEventListener("click", () => deleteUser(button.dataset.deleteUser, button.dataset.userName));
  });
}

function renderTemplates() {
  elements.templates.innerHTML = state.templates
    .map(
      (template) => `
        <button class="template ${template.lead_type === "investor" ? "investor" : ""} ${template.key === state.selectedTemplate ? "selected" : ""}" data-key="${template.key}">
          <strong>${template.name}</strong>
          <span>${template.description}</span>
          <small>${template.lead_type} · ${template.target_region}</small>
        </button>
      `
    )
    .join("");

  elements.templates.querySelectorAll(".template").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedTemplate = button.dataset.key;
      renderTemplates();
    });
  });
}

function categoryLabel(category) {
  if (category === "consultoria") return "Consultoria";
  if (category === "inversionistas") return "Inversionistas";
  if (category === "seguimiento") return "Seguimiento";
  if (category === "reactivacion") return "Reactivacion";
  if (category === "institucional") return "Presentacion institucional";
  return category;
}

function campaignTemplateOptions() {
  return MESSAGE_TEMPLATES.filter((template) => template.channel === "Email");
}

function renderCampaignTemplateOptions() {
  if (!elements.campaignTemplate) return;
  const current = elements.campaignTemplate.value;
  elements.campaignTemplate.innerHTML = [
    `<option value="">Plantilla corporativa</option>`,
    ...campaignTemplateOptions().map(
      (template) => `<option value="${template.id}">${categoryLabel(template.category)} | ${template.title}</option>`
    ),
  ].join("");
  if (campaignTemplateOptions().some((template) => template.id === current)) elements.campaignTemplate.value = current;
}

function renderMessageTemplates() {
  if (!elements.messageTemplates) return;
  renderCampaignTemplateOptions();
  const filter = state.messageTemplateFilter || "all";
  if (elements.messageTemplateFilter) elements.messageTemplateFilter.value = filter;
  const templates = filter === "all" ? MESSAGE_TEMPLATES : MESSAGE_TEMPLATES.filter((template) => template.category === filter);
  if (elements.messageTemplateCount) {
    elements.messageTemplateCount.textContent = `${templates.length} plantillas`;
  }
  elements.messageTemplates.innerHTML = templates
    .map(
      (template) => `
        <article class="message-template-card">
          <div class="message-template-header">
            <div>
              <strong>${template.title}</strong>
              <span>${template.channel} | ${categoryLabel(template.category)}</span>
            </div>
            <button class="secondary" type="button" data-copy-template="${template.id}">Copiar</button>
          </div>
          ${template.subject ? `<p><strong>Asunto</strong><span>${template.subject}</span></p>` : ""}
          <pre>${template.body}</pre>
        </article>
      `
    )
    .join("");
  elements.messageTemplates.querySelectorAll("[data-copy-template]").forEach((button) => {
    button.addEventListener("click", () => copyMessageTemplate(button.dataset.copyTemplate));
  });
}

function copyMessageTemplate(templateId) {
  const template = MESSAGE_TEMPLATES.find((item) => item.id === templateId);
  if (!template) return;
  const text = [template.subject ? `Asunto: ${template.subject}` : "", template.body].filter(Boolean).join("\n\n");
  copyValue(text, "Plantilla");
}

function renderEmailStatus(status) {
  if (!elements.emailStatus) return;
  if (!status?.resendConfigured) {
    elements.emailStatus.innerHTML = `<span data-tone="warning">Falta RESEND_API_KEY en Vercel.</span>`;
    return;
  }
  const senders = status.senders || [];
  const readySenders = senders.filter((sender) => sender.configured).map((sender) => sender.label).join(" / ");
  const validator = status.emailValidation || {};
  elements.emailStatus.innerHTML = `
    <span data-tone="ok">Resend conectado</span>
    <span>Remitentes: ${readySenders || "pendientes"}</span>
    <span>Webhook: ${status.webhookTokenConfigured ? "protegido" : "pendiente"}</span>
    <span data-tone="${validator.configured ? "ok" : "warning"}">Validador: ${validator.configured ? validator.provider : "pendiente"}</span>
  `;
}

function emailLeadOptions() {
  return (state.leadRows || [])
    .filter((lead) => lead.contacts?.email)
    .sort((a, b) => (a.contacts?.full_name || "").localeCompare(b.contacts?.full_name || "", "es"));
}

function renderEmailOpportunityOptions() {
  if (!elements.emailOpportunity) return;
  const current = elements.emailOpportunity.value;
  const options = emailLeadOptions();
  elements.emailOpportunity.innerHTML = [
    `<option value="">Opcional: vincular lead con email</option>`,
    ...options.map((lead) => {
      const contact = lead.contacts || {};
      const company = lead.companies || {};
      const label = `${contact.full_name || "Contacto"} | ${company.name || "Empresa"} | ${contact.email}`;
      return `<option value="${attr(lead.id)}">${label}</option>`;
    }),
  ].join("");
  if (options.some((lead) => lead.id === current)) elements.emailOpportunity.value = current;
}

function selectedEmailLead() {
  const id = elements.emailOpportunity?.value || "";
  return (state.leadRows || []).find((lead) => lead.id === id) || null;
}

function fillEmailFromLead() {
  const lead = selectedEmailLead();
  if (!lead) return;
  const contact = lead.contacts || {};
  const company = lead.companies || {};
  elements.emailTo.value = contact.email || "";
  elements.emailSender.value = lead.lead_type === "investor" ? "investors" : "consulting";
  if (elements.emailAttachDeck) elements.emailAttachDeck.checked = lead.lead_type === "investor";
  if (!elements.emailSubject.value.trim()) {
    elements.emailSubject.value =
      lead.lead_type === "investor" ? `Tecnotitan - ${company.name || "oportunidad"}` : `Idea rapida para ${company.name || "tu equipo"}`;
  }
}

function emailSenderForMessage(message) {
  if (message?.opportunity?.lead_type === "investor") return "investors";
  const toText = (message?.to_emails || []).join(" ").toLowerCase();
  if (toText.includes("tecnotitaninvestors.com")) return "investors";
  return "consulting";
}

function emailReplySubject(subject) {
  const value = String(subject || "").trim() || "(sin asunto)";
  return /^re:/i.test(value) ? value : `Re: ${value}`;
}

function emailReferenceHeader(message) {
  return [message.references_header, message.message_id].filter(Boolean).join(" ").trim();
}

function renderEmailDetail(message) {
  const contact = message.contact || {};
  const company = message.company || {};
  const date = new Date(message.sent_at || message.received_at || message.created_at).toLocaleString("es-CO");
  const body = message.text_body || message.snippet || "Sin cuerpo disponible.";
  const canReply = message.direction === "inbound" && message.from_email;
  elements.emailList.innerHTML = `
    <article class="email-detail">
      <header>
        <div>
          <strong>${message.direction === "inbound" ? "Recibido" : "Enviado"} | ${attr(message.subject || "(sin asunto)")}</strong>
          <span>${message.direction === "inbound" ? attr(message.from_email) : attr((message.to_emails || []).join(", "))}</span>
          <small>${attr(contact.full_name || "Contacto no vinculado")} | ${attr(company.name || "Empresa no vinculada")} | ${date} | ${emailEventLabel(message.last_event_type || message.status)}</small>
        </div>
        <button class="secondary" type="button" data-back-emails>Volver</button>
      </header>
      <pre>${attr(body)}</pre>
      ${
        canReply
          ? `
            <div class="email-reply-box">
              <h3>Responder</h3>
              <textarea data-reply-body rows="8" placeholder="Escribe tu respuesta"></textarea>
              <button type="button" data-reply-email="${attr(message.id)}">Enviar respuesta</button>
              <span data-reply-status></span>
            </div>
          `
          : ""
      }
    </article>
  `;
  elements.emailList.querySelector("[data-back-emails]")?.addEventListener("click", () => {
    state.selectedEmailId = "";
    renderEmails(state.emailMessages);
  });
  elements.emailList.querySelector("[data-reply-email]")?.addEventListener("click", (event) => replyToEmail(event.currentTarget.dataset.replyEmail));
}

function renderEmails(messages = state.emailMessages) {
  if (!elements.emailList) return;
  renderEmailStatus(state.emailStatus);
  renderEmailOpportunityOptions();
  const emailShell = elements.emailList.closest(".email-shell");
  if (emailShell) {
    emailShell.classList.toggle("compose-only", state.emailMailbox === "compose");
    emailShell.classList.toggle("read-only", state.emailMailbox !== "compose");
  }
  elements.emailMailboxButtons.forEach((button) => button.classList.toggle("active", button.dataset.emailMailbox === state.emailMailbox));
  if (state.emailMailbox === "compose") {
    elements.emailList.innerHTML = "";
    return;
  }
  const selected = (messages || []).find((message) => message.id === state.selectedEmailId);
  if (selected) {
    renderEmailDetail(selected);
    return;
  }
  const query = (state.emailSearch || "").trim().toLowerCase();
  const visible = (messages || []).filter((message) => {
    const mailboxOk =
      state.emailMailbox === "all" ||
      (state.emailMailbox === "inbox" && message.direction === "inbound") ||
      (state.emailMailbox === "sent" && message.direction === "outbound");
    if (!mailboxOk) return false;
    if (!query) return true;
    return [message.from_email, ...(message.to_emails || []), message.subject, message.snippet, message.contact?.full_name, message.company?.name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
  if (!visible.length) {
    elements.emailList.innerHTML = `<p class="empty">No hay correos para esta bandeja.</p>`;
    return;
  }
  const totalPages = Math.max(1, Math.ceil(visible.length / EMAILS_PER_PAGE));
  if (state.emailPage > totalPages) state.emailPage = totalPages;
  if (state.emailPage < 1) state.emailPage = 1;
  const pageStart = (state.emailPage - 1) * EMAILS_PER_PAGE;
  const pageMessages = visible.slice(pageStart, pageStart + EMAILS_PER_PAGE);
  elements.emailList.innerHTML = `
    <div class="client-pagination email-pagination">
      <span>Mostrando ${pageStart + 1}-${Math.min(pageStart + EMAILS_PER_PAGE, visible.length)} de ${visible.length}</span>
      <div>
        ${Array.from({ length: totalPages })
          .map((_, index) => {
            const page = index + 1;
            return `<button class="${page === state.emailPage ? "" : "secondary"}" type="button" data-email-page="${page}">Pagina ${page}</button>`;
          })
          .join("")}
      </div>
    </div>
    ${pageMessages
    .map((message, index) => {
      const contact = message.contact || {};
      const company = message.company || {};
      const date = new Date(message.sent_at || message.received_at || message.created_at).toLocaleString("es-CO");
      const eventLabel = emailEventLabel(message.last_event_type || message.status);
      const rowNumber = pageStart + index + 1;
      return `
        <button class="email-row" type="button" data-open-email="${attr(message.id)}">
          <div>
            <strong><span class="email-row-number">#${rowNumber}</span>${message.direction === "inbound" ? "Recibido" : "Enviado"} | ${attr(message.subject || "(sin asunto)")}</strong>
            <span>${attr(message.direction === "inbound" ? message.from_email : (message.to_emails || []).join(", "))}</span>
            <small>${attr(contact.full_name || "Contacto no vinculado")} | ${attr(company.name || "Empresa no vinculada")} | ${date} | ${eventLabel}</small>
          </div>
          <p>${attr(message.snippet || "Sin vista previa.")}</p>
        </button>
      `;
    })
    .join("")}
    <div class="client-pagination email-pagination">
      <span>Pagina ${state.emailPage} de ${totalPages}</span>
      <div>
        ${Array.from({ length: totalPages })
          .map((_, index) => {
            const page = index + 1;
            return `<button class="${page === state.emailPage ? "" : "secondary"}" type="button" data-email-page="${page}">Pagina ${page}</button>`;
          })
          .join("")}
      </div>
    </div>
  `;
  elements.emailList.querySelectorAll("[data-email-page]").forEach((button) => {
    button.addEventListener("click", () => {
      state.emailPage = Number(button.dataset.emailPage || 1);
      state.selectedEmailId = "";
      renderEmails(state.emailMessages);
    });
  });
  elements.emailList.querySelectorAll("[data-open-email]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedEmailId = button.dataset.openEmail;
      renderEmails(state.emailMessages);
    });
  });
}

function switchEmailMailbox(mailbox) {
  state.emailMailbox = mailbox || "all";
  state.selectedEmailId = "";
  state.emailPage = 1;
  renderEmails(state.emailMessages);
}

function emailEventLabel(eventType) {
  const labels = {
    sent: "Enviado",
    delivered: "Entregado",
    opened: "Abierto",
    clicked: "Clic",
    bounced: "Rebotado",
    failed: "Error",
    complained: "Queja spam",
    suppressed: "Suprimido",
    received: "Respuesta",
  };
  return labels[eventType] || eventType || "Sin tracking";
}

function campaignTypeLabel(type) {
  return type === "investor" ? "Inversionistas" : "Consultoria LATAM";
}

const CAMPAIGN_SEGMENTS = {
  all_investors: { label: "Inversionistas general", region: "" },
  usa_vcs: { label: "VCs USA", region: "usa" },
  usa_angels: { label: "Angels USA", region: "usa" },
  latam_investors: { label: "LATAM investors", region: "latam" },
  europe_funds: { label: "Europe funds", region: "europe" },
  strategic_investors: { label: "Strategic investors", region: "" },
  consulting_latam: { label: "Consultoria LATAM", region: "latam" },
};

function campaignSegmentLabel(campaign) {
  return campaign.segment_label || CAMPAIGN_SEGMENTS[campaign.segment_key]?.label || "Sin segmento";
}

function campaignStatusLabel(status) {
  const labels = {
    draft: "Borrador",
    active: "Activa",
    paused: "Pausada",
    stopped: "Detenida",
    archived: "Archivada",
    completed: "Completada",
  };
  return labels[status] || status || "Sin estado";
}

function campaignProgress(counts = {}, campaign = {}) {
  const sent = Number(counts.sent || 0);
  const objective = Math.max(1, Number(campaign.max_recipients || counts.total || sent || 1));
  const percent = Math.max(0, Math.min(100, Math.round((sent / objective) * 100)));
  return { sent, objective, percent };
}

function campaignQuality(counts = {}, warmup = null) {
  const sent = Number(counts.sent || 0);
  const bounced = Number(counts.bounced || 0);
  const replies = Number(counts.replied || 0);
  const blocked = Number(counts.reputation_blocked || 0);
  const complaints = Number(counts.complained || 0);
  const bounceRate = sent ? bounced / sent : 0;
  const replyRate = sent ? replies / sent : 0;
  let score = 100;
  score -= Math.min(45, bounceRate * 900);
  score -= Math.min(18, complaints * 12);
  score -= Math.min(16, blocked * 2);
  if (sent >= 25 && replyRate === 0) score -= 8;
  if ((warmup?.remaining_today ?? 1) <= 0) score -= 8;
  score = Math.max(0, Math.round(score));
  const tone = score >= 82 ? "ok" : score >= 62 ? "warning" : "danger";
  const label = score >= 82 ? "Sana" : score >= 62 ? "En observacion" : "Riesgosa";
  return {
    score,
    tone,
    label,
    bounceRate: Math.round(bounceRate * 1000) / 10,
    replyRate: Math.round(replyRate * 1000) / 10,
  };
}

function applyCampaignSegmentDefaults() {
  if (!elements.campaignSegment || !elements.campaignTargetRegion) return;
  if (elements.campaignSegment.value !== "consulting_latam" && elements.campaignType.value !== "investor") {
    elements.campaignType.value = "investor";
    elements.campaignSender.value = "investors";
  }
  if (elements.campaignSegment.value === "consulting_latam") {
    elements.campaignType.value = "consulting_client";
    elements.campaignSender.value = "consulting";
  }
  if (elements.campaignType.value !== "investor") {
    elements.campaignSegment.value = "consulting_latam";
    elements.campaignTargetRegion.value = "latam";
    return;
  }
  const segment = CAMPAIGN_SEGMENTS[elements.campaignSegment.value] || CAMPAIGN_SEGMENTS.all_investors;
  elements.campaignTargetRegion.value = segment.region || "";
}

function defaultCampaignTemplate(type) {
  const segmentTemplateMap = {
    usa_vcs: "investors-vc-email-1",
    europe_funds: "investors-vc-email-1",
    latam_investors: "investors-vc-email-1",
    usa_angels: "investors-angel-email-1",
    strategic_investors: "investors-strategic-email-1",
  };
  const templateId = type === "investor" ? segmentTemplateMap[elements.campaignSegment?.value] || "investors-english-email-1" : "consultoria-latam-email-1";
  const template = MESSAGE_TEMPLATES.find((item) => item.id === templateId);
  return { subject: template?.subject || "", body: template?.body || "" };
}

function applyCampaignDefaults(force = false) {
  if (!elements.campaignType) return;
  renderCampaignTemplateOptions();
  if (elements.campaignType.value === "investor") elements.campaignSender.value = "investors";
  if (elements.campaignType.value !== "investor") elements.campaignSender.value = "consulting";
  if (force && elements.campaignSegment) {
    elements.campaignSegment.value = elements.campaignType.value === "investor" ? "usa_vcs" : "consulting_latam";
  }
  if (force && elements.campaignTargetRegion) {
    applyCampaignSegmentDefaults();
  }
  if (elements.campaignTemplate && force) {
    elements.campaignTemplate.value = elements.campaignType.value === "investor" ? "investors-english-email-1" : "consultoria-latam-email-1";
  }
  if (elements.campaignAttachDeck && force) {
    elements.campaignAttachDeck.checked = false;
  }
  const template = defaultCampaignTemplate(elements.campaignType.value);
  if (force || !elements.campaignSubject.value.trim()) elements.campaignSubject.value = template.subject;
  if (force || !elements.campaignBody.value.trim()) elements.campaignBody.value = template.body;
}

function applySelectedCampaignTemplate() {
  const template = MESSAGE_TEMPLATES.find((item) => item.id === elements.campaignTemplate.value);
  if (!template) return;
  elements.campaignSubject.value = template.subject || "";
  elements.campaignBody.value = template.body || "";
  if (template.category === "inversionistas") {
    elements.campaignType.value = "investor";
    elements.campaignSender.value = "investors";
    if (elements.campaignSegment && !elements.campaignSegment.value) elements.campaignSegment.value = "usa_vcs";
    if (elements.campaignTargetRegion) elements.campaignTargetRegion.value = "usa";
    if (elements.campaignAttachDeck) elements.campaignAttachDeck.checked = template.id === "investors-english-deck-followup-1";
  }
  if (template.category === "consultoria") {
    elements.campaignType.value = "consulting_client";
    elements.campaignSender.value = "consulting";
    if (elements.campaignTargetRegion) elements.campaignTargetRegion.value = "latam";
    if (elements.campaignAttachDeck) elements.campaignAttachDeck.checked = false;
  }
}

function activateCampaignSection(section = "create") {
  elements.campaignSectionButtons?.forEach((button) => {
    button.classList.toggle("active", button.dataset.campaignSection === section);
  });
  elements.campaignSectionPanels?.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.campaignSectionPanel === section);
  });
}

function campaignCardHtml(campaign) {
  const counts = campaign.counts || {};
  const warmup = state.emailWarmups.find((item) => item.sender_key === campaign.sender_key);
  const campaignRemaining = Math.max(0, (campaign.daily_limit || 100) - (counts.sent_today || 0));
  const remaining = Math.min(campaignRemaining, warmup?.remaining_today ?? campaignRemaining);
  const nextSend = counts.next_scheduled_at ? new Date(counts.next_scheduled_at).toLocaleString("es-CO") : "Sin pendientes";
  const startAt = campaign.start_at ? new Date(campaign.start_at).toLocaleString("es-CO") : "Inmediato";
  const endAt = campaign.end_at ? new Date(campaign.end_at).toLocaleString("es-CO") : "Sin fin";
  const healthItems = campaignHealthItems(campaign, counts, warmup);
  const progress = campaignProgress(counts, campaign);
  const quality = campaignQuality(counts, warmup);
  const canStart = campaign.status === "paused";
  const canPause = campaign.status === "active";
  const canStop = !["stopped", "archived", "completed"].includes(campaign.status);
  const canArchive = !["archived"].includes(campaign.status);
  return `
    <article class="campaign-card campaign-control-card ${quality.tone}">
      <header>
        <div>
          <strong>${attr(campaign.name)}</strong>
          <small>${campaignTypeLabel(campaign.campaign_type)} | ${campaignSegmentLabel(campaign)} | ${campaign.sender_key === "investors" ? "Inversionistas" : "Consultoria"}</small>
        </div>
        <span class="campaign-status-pill ${campaign.status}">${campaignStatusLabel(campaign.status)}</span>
      </header>
      <div class="campaign-control-top">
        <div class="campaign-progress-block">
          <div class="campaign-progress-label">
            <strong>${progress.sent} de ${progress.objective} correos</strong>
            <span>${progress.percent}% completado</span>
          </div>
          <div class="campaign-progress-meter" aria-label="Progreso de campana">
            <span style="width: ${progress.percent}%"></span>
          </div>
        </div>
        <div class="campaign-quality ${quality.tone}">
          <span>Calidad</span>
          <strong>${quality.score}/100</strong>
          <small>${quality.label}</small>
        </div>
      </div>
      <div class="campaign-action-bar">
        <button class="campaign-action start" type="button" data-campaign-status="${campaign.id}" data-next-status="active" ${canStart ? "" : "disabled"}>Iniciar</button>
        <button class="campaign-action pause" type="button" data-campaign-status="${campaign.id}" data-next-status="paused" ${canPause ? "" : "disabled"}>Pausar</button>
        <button class="campaign-action stop" type="button" data-campaign-status="${campaign.id}" data-next-status="stopped" ${canStop ? "" : "disabled"}>Detener</button>
        <button class="campaign-action archive" type="button" data-campaign-status="${campaign.id}" data-next-status="archived" ${canArchive ? "" : "disabled"}>Archivar</button>
        <button class="campaign-action process" type="button" data-process-campaign="${campaign.id}" ${campaign.status !== "active" || !(counts.due || counts.followups_due) ? "disabled" : ""}>Procesar listos</button>
      </div>
      <div class="campaign-health">
        ${healthItems
          .map(
            (item) => `
              <span class="health-pill ${item.tone}">
                <i aria-hidden="true"></i>
                <strong>${item.label}</strong>
                <small>${item.value}</small>
              </span>
            `
          )
          .join("")}
      </div>
      <div class="campaign-stats">
        <span><b>${counts.total || 0}</b>Total</span>
        <span><b>${counts.queued || 0}</b>En cola</span>
        <span><b>${counts.due || 0}</b>Listos ahora</span>
        <span><b>${counts.sent || 0}</b>Enviados</span>
        <span><b>${counts.followups_sent || 0}</b>Follow-ups</span>
        <span><b>${counts.replied || 0}</b>Respuestas</span>
        <span><b>${counts.delivered || 0}</b>Entregados</span>
        <span><b>${counts.opened || 0}</b>Abiertos</span>
        <span><b>${counts.clicked || 0}</b>Clics</span>
        <span><b>${counts.bounced || 0}</b>Rebotes</span>
        <span><b>${counts.failed_events || 0}</b>Errores</span>
        <span><b>${counts.followups_due || 0}</b>Seguimientos listos</span>
        <span><b>${counts.reputation_blocked || 0}</b>Bloqueados</span>
        <span><b>${counts.sent_today || 0}</b>Hoy</span>
        <span><b>${remaining}</b>Restantes hoy</span>
        <span><b>${campaign.max_recipients || 100}</b>Max total</span>
        <span><b>${warmup?.daily_limit || 100}</b>Limite remitente</span>
        <span><b>${quality.bounceRate}%</b>Rebote</span>
        <span><b>${quality.replyRate}%</b>Respuesta</span>
      </div>
      <small>Inicio: ${startAt} | Fin: ${endAt} | Limite diario: ${campaign.daily_limit || 100} | Maximo por ejecucion: ${campaign.batch_size || 1} | Ritmo: ${campaign.min_delay_minutes || 6}-${campaign.max_delay_minutes || 12} min | Ventana: ${Math.floor((campaign.send_window_start_minutes || 555) / 60)}:${String((campaign.send_window_start_minutes || 555) % 60).padStart(2, "0")}-${Math.floor((campaign.send_window_end_minutes || 705) / 60)}:${String((campaign.send_window_end_minutes || 705) % 60).padStart(2, "0")} | Deck: ${campaign.attach_investor_deck ? "adjunto" : "no"} | Proximo envio: ${nextSend}</small>
    </article>
  `;
}

function bindCampaignListActions(container) {
  if (!container) return;
  container.querySelectorAll("[data-process-campaign]").forEach((button) => {
    button.addEventListener("click", () => processCampaign(button.dataset.processCampaign, button));
  });
  container.querySelectorAll("[data-campaign-status]").forEach((button) => {
    button.addEventListener("click", () => updateCampaignStatus(button.dataset.campaignStatus, button.dataset.nextStatus, button));
  });
}

function renderCampaigns(campaigns = state.emailCampaigns) {
  if (!elements.campaignList) return;
  renderMultiCampaignManager(campaigns);
  const archiveStatuses = new Set(["archived", "completed", "stopped"]);
  const openCampaigns = (campaigns || []).filter((campaign) => !archiveStatuses.has(campaign.status));
  const archivedCampaigns = (campaigns || []).filter((campaign) => archiveStatuses.has(campaign.status));
  if (!openCampaigns.length) {
    elements.campaignList.innerHTML = `<p class="empty">No hay campanas abiertas.</p>`;
  } else {
    elements.campaignList.innerHTML = openCampaigns.map(campaignCardHtml).join("");
  }
  if (elements.campaignArchiveList) {
    elements.campaignArchiveList.innerHTML = archivedCampaigns.length
      ? archivedCampaigns.map(campaignCardHtml).join("")
      : `<p class="empty">No hay campanas archivadas.</p>`;
  }
  bindCampaignListActions(elements.campaignList);
  bindCampaignListActions(elements.campaignArchiveList);
}

function renderMultiCampaignManager(campaigns = state.emailCampaigns) {
  if (!elements.multiCampaignManager) return;
  const openStatuses = new Set(["active", "paused"]);
  const openCampaigns = (campaigns || []).filter((campaign) => openStatuses.has(campaign.status));
  const activeCampaigns = openCampaigns.filter((campaign) => campaign.status === "active");
  const bySender = ["investors", "consulting"].map((senderKey) => {
    const warmup = state.emailWarmups.find((item) => item.sender_key === senderKey) || {};
    const senderCampaigns = openCampaigns.filter((campaign) => campaign.sender_key === senderKey);
    const activeSenderCampaigns = senderCampaigns.filter((campaign) => campaign.status === "active");
    const remainingToday = Number(warmup.remaining_today ?? 0);
    const fairShare = activeSenderCampaigns.length ? Math.ceil(remainingToday / activeSenderCampaigns.length) : 0;
    const sent = senderCampaigns.reduce((sum, campaign) => sum + Number(campaign.counts?.sent || 0), 0);
    const bounced = senderCampaigns.reduce((sum, campaign) => sum + Number(campaign.counts?.bounced || 0), 0);
    const replied = senderCampaigns.reduce((sum, campaign) => sum + Number(campaign.counts?.replied || 0), 0);
    return {
      senderKey,
      label: senderKey === "investors" ? "tecnotitaninvestors.com" : "tecnotitanconsultoria.com",
      dailyLimit: Number(warmup.daily_limit || 0),
      remainingToday,
      fairShare,
      open: senderCampaigns.length,
      active: activeSenderCampaigns.length,
      sent,
      bounced,
      replied,
      bounceRate: sent ? Math.round((bounced / sent) * 1000) / 10 : 0,
      replyRate: sent ? Math.round((replied / sent) * 1000) / 10 : 0,
    };
  });

  const campaignRows = openCampaigns
    .map((campaign) => {
      const progress = campaignProgress(campaign.counts, campaign);
      const quality = campaignQuality(campaign.counts, state.emailWarmups.find((item) => item.sender_key === campaign.sender_key));
      return `
        <div class="multi-campaign-row">
          <span>${attr(campaign.name)}</span>
          <span>${campaignStatusLabel(campaign.status)}</span>
          <span>${progress.sent}/${progress.objective}</span>
          <span>${quality.score}/100</span>
          <span>${quality.bounceRate}%</span>
          <span>${quality.replyRate}%</span>
        </div>
      `;
    })
    .join("");

  elements.multiCampaignManager.innerHTML = `
    <div class="multi-campaign-summary">
      <article>
        <span>Campanas abiertas</span>
        <strong>${openCampaigns.length}</strong>
      </article>
      <article>
        <span>Activas ahora</span>
        <strong>${activeCampaigns.length}</strong>
      </article>
      <article>
        <span>Dominios en uso</span>
        <strong>${bySender.filter((sender) => sender.open).length}</strong>
      </article>
    </div>
    <div class="multi-sender-grid">
      ${bySender
        .map(
          (sender) => `
            <article class="${sender.active ? "is-active" : ""}">
              <header>
                <strong>${sender.label}</strong>
                <span>${sender.active} activas / ${sender.open} abiertas</span>
              </header>
              <div class="multi-domain-meter">
                <span style="width: ${sender.dailyLimit ? Math.max(0, Math.min(100, ((sender.dailyLimit - sender.remainingToday) / sender.dailyLimit) * 100)) : 0}%"></span>
              </div>
              <small>Cupo hoy: ${sender.remainingToday}/${sender.dailyLimit || 0} restantes | Sugerido por campana: ${sender.fairShare}</small>
              <small>Rebote ${sender.bounceRate}% | Respuesta ${sender.replyRate}%</small>
            </article>
          `
        )
        .join("")}
    </div>
    <div class="multi-campaign-table">
      <div class="multi-campaign-row multi-head">
        <span>Campana</span>
        <span>Estado</span>
        <span>Progreso</span>
        <span>Calidad</span>
        <span>Rebote</span>
        <span>Respuesta</span>
      </div>
      ${campaignRows || `<p class="empty">No hay campanas activas o pausadas. Puedes crear varias campanas y activarlas por segmento.</p>`}
    </div>
  `;
}

function campaignInventoryBucket(campaign) {
  const inventory = state.leadInventory;
  if (!inventory?.by_type?.length) return null;
  return inventory.by_type.find((item) => item.key === campaign.campaign_type) || null;
}

function healthTone(isGood, isWarning = false) {
  if (isGood) return "ok";
  return isWarning ? "warning" : "danger";
}

function campaignHealthItems(campaign, counts = {}, warmup = null) {
  const bucket = campaignInventoryBucket(campaign);
  const queued = Number(counts.queued || 0);
  const due = Number(counts.due || 0) + Number(counts.followups_due || 0);
  const sent = Number(counts.sent || 0);
  const bounced = Number(counts.bounced || 0);
  const bounceRate = sent ? bounced / sent : 0;
  const available = Number(bucket?.available_for_campaign || 0);
  const hasInventory = !bucket || available > 0;
  const apolloBlocked = Boolean(bucket && available === 0 && Number(bucket.without_email || 0) > 0);
  const domainHealthy = bounceRate < 0.03 && Number(counts.complained || 0) === 0 && (warmup?.remaining_today ?? 1) > 0;
  const nextSend = counts.next_scheduled_at ? new Date(counts.next_scheduled_at).toLocaleString("es-CO") : "Sin pendientes";

  return [
    {
      label: "Campana",
      value: campaign.status === "active" ? "Activa" : campaign.status === "paused" ? "Pausada" : campaign.status || "Sin estado",
      tone: campaign.status === "active" ? "ok" : campaign.status === "paused" ? "warning" : "danger",
    },
    {
      label: "Cola",
      value: queued ? `${queued} en cola` : "Sin cola",
      tone: healthTone(queued > 0, due > 0),
    },
    {
      label: "Apollo",
      value: apolloBlocked ? "Bloqueando" : "Disponible",
      tone: apolloBlocked ? "danger" : "ok",
    },
    {
      label: "Inventario",
      value: bucket ? `${available} listas` : "Sin lectura",
      tone: healthTone(hasInventory, bucket && available < 25),
    },
    {
      label: "Rebote",
      value: sent ? `${Math.round(bounceRate * 100)}%` : "Sin datos",
      tone: bounceRate >= 0.05 ? "danger" : bounceRate >= 0.03 ? "warning" : "ok",
    },
    {
      label: "Dominio",
      value: domainHealthy ? "Sano" : "Revisar",
      tone: domainHealthy ? "ok" : "warning",
    },
    {
      label: "Proximo envio",
      value: nextSend,
      tone: counts.next_scheduled_at && campaign.status === "active" ? "ok" : "warning",
    },
  ];
}

function inventoryStatusLabel(status) {
  const labels = {
    listo: "Listo para campana",
    bajo: "Inventario bajo",
    sin_inventario: "Sin inventario disponible",
  };
  return labels[status] || "Inventario";
}

function renderLeadInventory(inventory = state.leadInventory) {
  if (!elements.leadInventory) return;
  if (!inventory?.totals) {
    elements.leadInventory.innerHTML = `<p class="empty">No hay inventario cargado.</p>`;
    return;
  }
  const totals = inventory.totals;
  const investor = (inventory.by_type || []).find((item) => item.key === "investor");
  const consulting = (inventory.by_type || []).find((item) => item.key === "consulting_client");
  const focusRows = [investor, consulting].filter(Boolean);
  const regionRows = (inventory.by_region || []).filter((item) => item.total).slice(0, 4);
  const alertClass = totals.status === "listo" ? "is-ready" : totals.status === "bajo" ? "is-low" : "is-empty";
  const statusCopy =
    totals.status === "sin_inventario"
      ? "Apollo debe traer o revelar nuevos emails antes de seguir escalando campanas."
      : totals.status === "bajo"
        ? "Hay leads listas, pero conviene reponer inventario antes de una campana grande."
        : "Hay leads con email listas para entrar en campanas.";

  elements.leadInventory.innerHTML = `
    <div class="inventory-status ${alertClass}">
      <strong>${inventoryStatusLabel(totals.status)}</strong>
      <span>${statusCopy}</span>
    </div>
    <div class="inventory-grid">
      <article><b>${totals.available_for_campaign}</b><span>Disponibles campana</span></article>
      <article><b>${totals.with_email}</b><span>Con email</span></article>
      <article><b>${totals.without_email}</b><span>Sin email</span></article>
      <article><b>${totals.sent_tagged}</b><span>Correo enviado</span></article>
      <article><b>${totals.blocked}</b><span>No contactar</span></article>
      <article><b>${totals.bounced_or_suppressed}</b><span>Rebote/suprimido</span></article>
    </div>
    <div class="inventory-breakdown">
      ${focusRows
        .map(
          (item) => `
            <div>
              <strong>${item.label}</strong>
              <span>${item.available_for_campaign} listas | ${item.with_email} con email | ${item.without_email} sin email</span>
            </div>
          `
        )
        .join("")}
    </div>
    <div class="inventory-regions">
      ${regionRows.map((item) => `<span>${item.label}: <b>${item.available_for_campaign}</b></span>`).join("") || `<span>Sin regiones cargadas</span>`}
    </div>
    <small>Actualizado: ${new Date(inventory.generated_at).toLocaleString("es-CO")}</small>
  `;
}

function warmupSenderLabel(senderKey) {
  return senderKey === "investors" ? "Inversionistas" : "Consultoria";
}

function renderWarmups(warmups = state.emailWarmups) {
  if (!elements.senderWarmupList) return;
  if (!warmups?.length) {
    elements.senderWarmupList.innerHTML = `<p class="empty">No hay calentamiento configurado.</p>`;
    return;
  }
  elements.senderWarmupList.innerHTML = warmups
    .map((item) => {
      const used = Number(item.sent_today || 0);
      const limit = Number(item.daily_limit || 20);
      const progress = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
      const next = item.next_stage_limit ? `Proxima etapa: ${item.next_stage_limit}/dia` : "Etapa final";
      return `
        <article class="warmup-row">
          <header>
            <strong>${warmupSenderLabel(item.sender_key)}</strong>
            <span>Etapa ${item.stage || 1}</span>
          </header>
          <small>${item.domain}</small>
          <div class="warmup-meter" aria-label="Uso diario ${used} de ${limit}">
            <span style="width: ${progress}%"></span>
          </div>
          <footer>
            <span>${used}/${limit} hoy</span>
            <span>${item.remaining_today || 0} restantes</span>
            <span>${next}</span>
          </footer>
        </article>
      `;
    })
    .join("");
}

function exclusionReasonLabel(reason) {
  const labels = {
    manual: "No contactar",
    negative_reply: "Respuesta negativa",
    bounced: "Rebotado",
    unsubscribed: "Dado de baja",
    complained: "Queja spam",
  };
  return labels[reason] || reason || "No contactar";
}

function renderExclusions(exclusions = state.emailExclusions) {
  if (!elements.exclusionList) return;
  if (!exclusions?.length) {
    elements.exclusionList.innerHTML = `<p class="empty">No hay emails excluidos.</p>`;
    return;
  }
  elements.exclusionList.innerHTML = exclusions
    .slice(0, 8)
    .map(
      (item) => `
        <article class="exclusion-row">
          <strong>${item.email}</strong>
          <span>${exclusionReasonLabel(item.reason)} | ${item.source || "crm"}</span>
        </article>
      `
    )
    .join("");
}

function isProcessedClient(lead) {
  return lead.contacts?.apollo_enrichment_status === "enriched";
}

function splitLeadCollections(leads) {
  return {
    airportLeads: leads.filter((lead) => !isProcessedClient(lead) && lead.pipeline_status !== ARCHIVE_STATUS),
    clients: leads.filter((lead) => isProcessedClient(lead) && lead.pipeline_status !== ARCHIVE_STATUS),
    archived: leads.filter((lead) => lead.pipeline_status === ARCHIVE_STATUS),
  };
}

function clientContactState(lead) {
  const contact = lead.contacts || {};
  const phone = contact.mobile_phone || contact.phone || "";
  const email = contact.email || "";
  const phoneStatus = contact.apollo_raw_payload?.tecnotitan_phone_status || "unknown";
  const apolloHasDirectPhone = String(contact.apollo_raw_payload?.has_direct_phone || "").toLowerCase() === "yes";
  const phoneRequested = phoneStatus === "requested" || Boolean(contact.apollo_raw_payload?.tecnotitan_phone_requested_at);
  const phoneNotAvailable = phoneStatus === "not_available";
  return {
    hasEmail: Boolean(email),
    hasPhone: Boolean(phone),
    apolloHasEmail: contact.apollo_raw_payload?.has_email === true,
    apolloHasDirectPhone,
    phoneRequested,
    phoneNotAvailable,
    canRequestPhone: !phone && !phoneRequested && !phoneNotAvailable && (apolloHasDirectPhone || phoneStatus === "unknown"),
    contactable: Boolean(email || phone),
  };
}

function filterClientsByContact(clients) {
  const filter = state.clientContactFilter || "all";
  if (filter === "all") return clients;
  return clients.filter((lead) => {
    const contactState = clientContactState(lead);
    if (filter === "contactable") return contactState.contactable;
    if (filter === "email") return contactState.hasEmail;
    if (filter === "phone") return contactState.hasPhone;
    if (filter === "can_request_phone") return contactState.canRequestPhone;
    if (filter === "phone_requested") return contactState.phoneRequested && !contactState.hasPhone;
    if (filter === "phone_not_available") return contactState.phoneNotAvailable && !contactState.hasPhone;
    if (filter === "no_direct_contact") return !contactState.contactable;
    return true;
  });
}

function clientCountry(lead) {
  const contact = lead.contacts || {};
  const company = lead.companies || {};
  return (
    contact.country ||
    companyField(company, "country") ||
    contact.apollo_raw_payload?.country ||
    contact.apollo_raw_payload?.organization?.country ||
    ""
  );
}

function normalizeFilterValue(value) {
  return String(value || "").trim().toLowerCase();
}

function filterClientsByCountry(clients) {
  const filter = normalizeFilterValue(state.clientCountryFilter);
  if (!filter || filter === "all") return clients;
  return clients.filter((lead) => normalizeFilterValue(clientCountry(lead)) === filter);
}

function filterClientsByCategory(clients) {
  const filter = normalizeFilterValue(state.clientCategoryFilter);
  if (!filter || filter === "all") return clients;
  return clients.filter((lead) => {
    if (filter === "consulting_latam") {
      return lead.lead_type === "consulting_client" && normalizeFilterValue(lead.target_region) === "latam";
    }
    if (filter === "investors") {
      return lead.lead_type === "investor";
    }
    return true;
  });
}

function clientTags(lead) {
  const rows = lead.contacts?.contact_tags || [];
  return rows.map((row) => row.tags).filter(Boolean);
}

function clientSearchText(lead) {
  const contact = lead.contacts || {};
  const company = lead.companies || {};
  const tags = clientTags(lead).map((tag) => tag.name).join(" ");
  return [
    contact.full_name,
    contact.title,
    contact.email,
    contact.phone,
    contact.mobile_phone,
    contact.linkedin_url,
    clientCountry(lead),
    company.name,
    company.industry,
    company.domain,
    company.website_url,
    company.linkedin_url,
    lead.lead_type,
    lead.target_region,
    tags,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function filterClientsBySearch(clients) {
  const query = normalizeFilterValue(state.clientSearch);
  if (!query) return clients;
  return clients.filter((lead) => clientSearchText(lead).includes(query));
}

function filterClientsByTag(clients) {
  const filter = normalizeFilterValue(state.clientTagFilter);
  if (!filter || filter === "all") return clients;
  return clients.filter((lead) => clientTags(lead).some((tag) => normalizeFilterValue(tag.name) === filter));
}

function filteredClients(clients) {
  return filterClientsByTag(filterClientsBySearch(filterClientsByCategory(filterClientsByCountry(filterClientsByContact(clients)))));
}

function renderClientCountryOptions(clients) {
  if (!elements.clientCountryFilter) return;
  const countries = [...new Set(clients.map(clientCountry).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
  const current = state.clientCountryFilter || "all";
  elements.clientCountryFilter.innerHTML = [
    `<option value="all">Todos los paises</option>`,
    ...countries.map((country) => `<option value="${attr(normalizeFilterValue(country))}">${country}</option>`),
  ].join("");
  const hasCurrent = current === "all" || countries.some((country) => normalizeFilterValue(country) === normalizeFilterValue(current));
  if (!hasCurrent) state.clientCountryFilter = "all";
  elements.clientCountryFilter.value = state.clientCountryFilter || "all";
}

function renderClientTagOptions(clients) {
  if (!elements.clientTagFilter) return;
  const tags = [...new Map(
    clients
      .flatMap(clientTags)
      .filter((tag) => tag.name)
      .map((tag) => [normalizeFilterValue(tag.name), tag.name])
  ).entries()]
    .sort((a, b) => a[1].localeCompare(b[1], "es"));
  const current = state.clientTagFilter || "all";
  elements.clientTagFilter.innerHTML = [
    `<option value="all">Todas las etiquetas</option>`,
    ...tags.map(([value, label]) => `<option value="${attr(value)}">${label}</option>`),
  ].join("");
  const hasCurrent = current === "all" || tags.some(([value]) => value === normalizeFilterValue(current));
  if (!hasCurrent) state.clientTagFilter = "all";
  elements.clientTagFilter.value = state.clientTagFilter || "all";
}

function updateClientFilterSummary(total, visible) {
  if (!elements.clientFilterSummary) return;
  elements.clientFilterSummary.textContent = `${visible} de ${total} clientes`;
}

function attachClientActions(container) {
  if (!container) return;
  applyRoleVisibility();
  container.querySelectorAll("[data-assign]").forEach((select) => {
    select.addEventListener("change", () => assignLead(select.dataset.assign, select.value));
  });
  container.querySelectorAll("[data-open-detail]").forEach((button) => {
    button.addEventListener("click", () => openLeadDetail(button.dataset.openDetail));
  });
  container.querySelectorAll("[data-open-company]").forEach((button) => {
    if (button.disabled) return;
    button.addEventListener("click", () => openCompanyDetail(button.dataset.openCompany));
  });
  container.querySelectorAll("[data-pipeline-status]").forEach((select) => {
    select.addEventListener("change", () => changePipelineStatus(select.dataset.pipelineStatus, select.value));
  });
  container.querySelectorAll("[data-copy-value]").forEach((button) => {
    if (button.disabled) return;
    button.addEventListener("click", () => copyValue(button.dataset.copyValue, button.dataset.copyLabel || "Valor"));
  });
  container.querySelectorAll("[data-open-url]").forEach((button) => {
    if (button.disabled) return;
    button.addEventListener("click", () => openUrl(button.dataset.openUrl, button.dataset.openLabel || "Enlace"));
  });
  container.querySelectorAll("[data-register-activity]").forEach((button) => {
    button.addEventListener("click", () => registerActivity(button.dataset.registerActivity, button.dataset.activityType, button));
  });
  container.querySelectorAll("[data-request-phone]").forEach((button) => {
    if (button.disabled) return;
    button.addEventListener("click", () => requestPhone(button.dataset.requestPhone, button));
  });
  container.querySelectorAll("[data-archive-lead]").forEach((button) => {
    button.addEventListener("click", () => archiveLead(button.dataset.archiveLead));
  });
  container.querySelectorAll("[data-schedule-task]").forEach((button) => {
    button.addEventListener("click", () => scheduleTask(button.dataset.scheduleTask, button));
  });
  container.querySelectorAll("[data-send-kanban]").forEach((button) => {
    button.addEventListener("click", () => {
      activateTab("kanban", true);
      setStatus("Cliente enviado al tablero Kanban.", "ok");
    });
  });
}

function renderLeadCollections(leads) {
  state.leadRows = leads;
  const collections = splitLeadCollections(leads);
  renderLeads(collections.airportLeads);
  renderClients(collections.clients);
  renderKanban(collections.clients);
  renderArchive(collections.archived);
}

function refreshClientContactFilter() {
  const collections = splitLeadCollections(state.leadRows || []);
  renderClients(collections.clients);
  renderKanban(collections.clients);
}

function renderLeads(leads) {
  if (!leads.length) {
    elements.leads.innerHTML = `<p class="empty">No hay leads nuevos para procesar con los filtros actuales.</p>`;
    return;
  }
  const totalPages = Math.max(1, Math.ceil(leads.length / LEADS_PER_PAGE));
  if (state.leadPage > totalPages) state.leadPage = totalPages;
  if (state.leadPage < 1) state.leadPage = 1;
  const pageStart = (state.leadPage - 1) * LEADS_PER_PAGE;
  const pageLeads = leads.slice(pageStart, pageStart + LEADS_PER_PAGE);

  elements.leads.innerHTML = `
    <div class="lead-table-header">
      <span>Contacto</span>
      <span>Empresa</span>
      <span>Tipo</span>
      <span>Estado</span>
      <span>Score</span>
    </div>
  ${pageLeads
    .map((lead) => {
      const contact = lead.contacts || {};
      const company = lead.companies || {};
      const enrichmentStatus = contact.apollo_enrichment_status || "not_requested";
      const isEnriched = enrichmentStatus === "enriched";
      const isRequested = enrichmentStatus === "requested";
      const enrichLabel = isEnriched ? "Detalles obtenidos" : isRequested ? "Solicitado" : "Obtener detalles";
      return `
        <article class="lead-row">
          <div>
            <strong>${contact.full_name || "Contacto sin nombre"}</strong>
            <span>${contact.title || "Cargo no disponible"}</span>
            <small>${company.name || "Empresa no disponible"} · ${contact.country || company.country || "Sin pais"}</small>
            <div class="lead-actions admin-only">
              <select data-assign="${lead.id}">
                ${assignmentOptions(lead.owner_user_id)}
              </select>
              <button type="button" data-enrich="${lead.id}" ${isEnriched || isRequested ? "disabled" : ""}>${enrichLabel}</button>
            </div>
            <div class="lead-actions">
              <button class="secondary" type="button" data-open-detail="${lead.id}">Ver detalle</button>
              <button class="danger" type="button" data-archive-lead="${lead.id}">Archivar lead</button>
            </div>
          </div>
          <div class="lead-company">
            <strong>${company.name || "Empresa no disponible"}</strong>
            <span>${company.industry || "Industria no disponible"}</span>
            <small>${company.country || contact.country || "Sin pais"}</small>
          </div>
          <div class="lead-meta">
            <strong>${lead.lead_type === "investor" ? "Inversionista" : "Consultoria"}</strong>
            <span>${lead.target_region}</span>
          </div>
          <div class="lead-meta">
            <select data-pipeline-status="${lead.id}">
              ${pipelineStatusOptions(lead.pipeline_status)}
            </select>
            <span>${new Date(lead.created_at).toLocaleDateString("es-CO")}</span>
          </div>
          <div class="score ${lead.score_label}">
            <strong>${lead.score}</strong>
            <span>${lead.score_label}</span>
          </div>
        </article>
      `;
    })
    .join("")}
    <div class="client-pagination lead-pagination">
      <span>Mostrando ${pageStart + 1}-${Math.min(pageStart + LEADS_PER_PAGE, leads.length)} de ${leads.length}</span>
      <div>
        ${Array.from({ length: totalPages }, (_, index) => {
          const page = index + 1;
          return `<button class="${page === state.leadPage ? "" : "secondary"}" type="button" data-lead-page="${page}">Pagina ${page}</button>`;
        }).join("")}
      </div>
    </div>
  `;

  applyRoleVisibility();
  elements.leads.querySelectorAll("[data-assign]").forEach((select) => {
    select.addEventListener("change", () => assignLead(select.dataset.assign, select.value));
  });
  elements.leads.querySelectorAll("[data-enrich]").forEach((button) => {
    if (button.disabled) return;
    button.addEventListener("click", () => enrichLead(button.dataset.enrich, button));
  });
  elements.leads.querySelectorAll("[data-open-detail]").forEach((button) => {
    button.addEventListener("click", () => openLeadDetail(button.dataset.openDetail));
  });
  elements.leads.querySelectorAll("[data-archive-lead]").forEach((button) => {
    button.addEventListener("click", () => archiveLead(button.dataset.archiveLead));
  });
  elements.leads.querySelectorAll("[data-pipeline-status]").forEach((select) => {
    select.addEventListener("change", () => changePipelineStatus(select.dataset.pipelineStatus, select.value));
  });
  elements.leads.querySelectorAll("[data-lead-page]").forEach((button) => {
    button.addEventListener("click", () => {
      state.leadPage = Number(button.dataset.leadPage || 1);
      renderLeads(leads);
    });
  });
}

function renderClients(clients) {
  if (!elements.clients) return;
  if (elements.clientContactFilter) {
    elements.clientContactFilter.value = state.clientContactFilter || "all";
  }
  if (elements.clientSearch) {
    elements.clientSearch.value = state.clientSearch || "";
  }
  if (elements.clientCategoryFilter) {
    elements.clientCategoryFilter.value = state.clientCategoryFilter || "all";
  }
  renderClientCountryOptions(clients);
  renderClientTagOptions(clients);
  const visibleClients = filteredClients(clients);
  const totalPages = Math.max(1, Math.ceil(visibleClients.length / CLIENTS_PER_PAGE));
  if (state.clientPage > totalPages) state.clientPage = totalPages;
  if (state.clientPage < 1) state.clientPage = 1;
  const pageStart = (state.clientPage - 1) * CLIENTS_PER_PAGE;
  const pageClients = visibleClients.slice(pageStart, pageStart + CLIENTS_PER_PAGE);
  updateClientFilterSummary(clients.length, visibleClients.length);
  if (!clients.length) {
    elements.clients.innerHTML = `<p class="empty">No hay clientes procesados para los filtros actuales.</p>`;
    return;
  }
  if (!visibleClients.length) {
    elements.clients.innerHTML = `<p class="empty">No hay clientes que coincidan con los filtros actuales.</p>`;
    return;
  }

  elements.clients.innerHTML = `
    <div class="crm-client-header">
      <span>Contacto</span>
      <span>Empresa</span>
      <span>Contacto directo</span>
      <span>Estado</span>
      <span>Acciones</span>
    </div>
    ${pageClients
      .map((lead) => {
        const contact = lead.contacts || {};
        const company = lead.companies || {};
        const phone = contact.mobile_phone || contact.phone || "";
        const email = contact.email || "";
        const tags = clientTags(lead);
        const contactState = clientContactState(lead);
        const emailLabel = email || (contactState.apolloHasEmail ? "Email disponible en Apollo" : "Sin email");
        const phoneButtonLabel = phone
          ? "Telefono obtenido"
          : contactState.phoneNotAvailable
            ? "No disponible en Apollo"
            : contactState.phoneRequested
              ? "Telefono solicitado"
              : contactState.apolloHasDirectPhone
                ? "Solicitar telefono disponible"
              : "Solicitar telefono";
        const phoneLabel = phone || (contactState.apolloHasDirectPhone ? "Telefono disponible en Apollo" : phoneButtonLabel);
        return `
          <article class="crm-client-row">
            <div>
              <strong>${contact.full_name || "Contacto sin nombre"}</strong>
              <span>${contact.title || "Cargo no disponible"}</span>
              <small>${lead.lead_type === "investor" ? "Inversionista" : "Consultoria"} | ${regionLabel(lead.target_region)} | ${clientCountry(lead) || "Sin pais"}</small>
              ${
                tags.length
                  ? `<div class="client-tags">${tags.map((tag) => `<span>${tag.name}</span>`).join("")}</div>`
                  : `<div class="client-tags muted"><span>Sin etiquetas</span></div>`
              }
            </div>
            <div>
              <strong>${company.name || "Empresa no disponible"}</strong>
              <span>${company.industry || "Industria no disponible"}</span>
              <small>${clientCountry(lead) || "Sin pais"}</small>
            </div>
            <div>
              <span>${emailLabel}</span>
              <small>${phoneLabel}</small>
            </div>
            <div>
              <select data-pipeline-status="${lead.id}">
                ${pipelineStatusOptions(lead.pipeline_status)}
              </select>
              <small>Score ${lead.score} ${lead.score_label}</small>
            </div>
            <div class="crm-client-actions">
              <button class="secondary" type="button" data-open-detail="${lead.id}">Detalle</button>
              <button class="secondary" type="button" data-open-company="${company.id || ""}" ${company.id ? "" : "disabled"}>Empresa</button>
              <button type="button" data-send-kanban="${lead.id}">Enviar a Kanban</button>
              <button class="secondary" type="button" data-copy-value="${attr(email)}" data-copy-label="Email" ${email ? "" : "disabled"}>Copiar email</button>
              <button class="secondary" type="button" data-copy-value="${attr(phone)}" data-copy-label="Telefono" ${phone ? "" : "disabled"}>Copiar telefono</button>
              <button class="phone-request-button" type="button" data-request-phone="${lead.id}" ${!contactState.canRequestPhone ? "disabled" : ""}>${phoneButtonLabel}</button>
              <button class="danger" type="button" data-archive-lead="${lead.id}">Archivar lead</button>
            </div>
            <div class="lead-actions admin-only">
              <select data-assign="${lead.id}">
                ${assignmentOptions(lead.owner_user_id)}
              </select>
            </div>
          </article>
        `;
      })
      .join("")}
    <div class="client-pagination">
      <span>Mostrando ${pageStart + 1}-${Math.min(pageStart + CLIENTS_PER_PAGE, visibleClients.length)} de ${visibleClients.length}</span>
      <div>
        ${Array.from({ length: totalPages }, (_, index) => {
          const page = index + 1;
          return `<button class="${page === state.clientPage ? "" : "secondary"}" type="button" data-client-page="${page}">Pagina ${page}</button>`;
        }).join("")}
      </div>
    </div>
  `;

  attachClientActions(elements.clients);
  elements.clients.querySelectorAll("[data-client-page]").forEach((button) => {
    button.addEventListener("click", () => {
      state.clientPage = Number(button.dataset.clientPage || 1);
      renderClients(clients);
    });
  });
}

function renderKanban(clients) {
  if (!elements.kanban) return;
  if (!clients.length) {
    elements.kanban.innerHTML = `<p class="empty">Aun no hay clientes en el tablero.</p>`;
    return;
  }

  const query = state.kanbanSearch.trim().toLowerCase();
  const visibleClients = query
    ? clients.filter((lead) => {
        const contact = lead.contacts || {};
        const company = lead.companies || {};
        return [contact.full_name, contact.title, contact.email, company.name, company.industry, company.country, lead.lead_type]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
    : clients;
  const totalPages = Math.max(1, Math.ceil(visibleClients.length / KANBAN_CLIENTS_PER_PAGE));
  if (state.kanbanPage > totalPages) state.kanbanPage = totalPages;
  if (state.kanbanPage < 1) state.kanbanPage = 1;
  const pageStart = (state.kanbanPage - 1) * KANBAN_CLIENTS_PER_PAGE;
  const pageClients = visibleClients.slice(pageStart, pageStart + KANBAN_CLIENTS_PER_PAGE);
  const pageLabelStart = visibleClients.length ? pageStart + 1 : 0;
  const pageLabelEnd = Math.min(pageStart + KANBAN_CLIENTS_PER_PAGE, visibleClients.length);
  const grouped = PIPELINE_STATUSES.map(([status, label]) => ({
    status,
    label,
    rows: pageClients.filter((client) => (client.pipeline_status || "nuevo") === status),
    totalRows: visibleClients.filter((client) => (client.pipeline_status || "nuevo") === status).length,
  }));
  const wonCount = visibleClients.filter((client) => client.pipeline_status === "ganado").length;
  const proposalCount = visibleClients.filter((client) => client.pipeline_status === "propuesta_enviada").length;
  const meetingCount = visibleClients.filter((client) => client.pipeline_status === "reunion_agendada").length;

  elements.kanban.innerHTML = `
    <div class="kanban-toolbar">
      <div class="kanban-summary">
        <strong>${visibleClients.length}</strong>
        <span>clientes en tablero</span>
        <small>${meetingCount} reuniones | ${proposalCount} propuestas | ${wonCount} ganados</small>
      </div>
      <input id="kanban-search" type="search" placeholder="Buscar en Kanban" value="${attr(state.kanbanSearch)}">
    </div>
    <div class="kanban-board compact-kanban">
      ${grouped
        .map(
          (group) => `
            <section class="kanban-column">
              <div class="kanban-column-title">
                <h3>${group.label}</h3>
                <span>${group.totalRows}</span>
              </div>
              <div class="kanban-cards">
                ${
                  group.rows.length
                    ? group.rows
                        .map((lead) => {
                          const contact = lead.contacts || {};
                          const company = lead.companies || {};
                          const nextFollowUp = lead.next_follow_up_at ? lead.next_follow_up_at.slice(0, 10) : "Sin tarea";
                          return `
                            <article class="kanban-card-compact ${lead.score_label}">
                              <div class="kanban-card-title">
                                <strong>${contact.full_name || "Contacto sin nombre"}</strong>
                                <small>${company.name || "Empresa no disponible"}</small>
                              </div>
                              <span class="kanban-role">${contact.title || "Cargo no disponible"}</span>
                              <div class="kanban-card-meta">
                                <span class="score-pill ${lead.score_label}">${lead.score}</span>
                                <span>${lead.lead_type === "investor" ? "Inversionista" : "Consultoria"}</span>
                                <span>${nextFollowUp}</span>
                              </div>
                              <div class="kanban-card-actions">
                                <button class="secondary" type="button" data-open-detail="${lead.id}">Detalle</button>
                                <button class="secondary" type="button" data-open-company="${company.id || ""}" ${company.id ? "" : "disabled"}>Empresa</button>
                                <button class="danger" type="button" data-archive-lead="${lead.id}">Archivar</button>
                              </div>
                              <label class="kanban-quick-move" aria-label="Mover cliente de etapa">
                                <span>Mover</span>
                                <select class="kanban-status-select" data-pipeline-status="${lead.id}">
                                  ${pipelineStatusOptions(lead.pipeline_status)}
                                </select>
                              </label>
                            </article>
                          `;
                        })
                        .join("")
                    : `<p class="kanban-empty">Vacio</p>`
                }
              </div>
            </section>
          `
        )
        .join("")}
    </div>
    <div class="client-pagination kanban-pagination">
      <span>Mostrando ${pageLabelStart}-${pageLabelEnd} de ${visibleClients.length}</span>
      <div>
        ${Array.from({ length: totalPages }, (_, index) => {
          const page = index + 1;
          return `<button class="${page === state.kanbanPage ? "" : "secondary"}" type="button" data-kanban-page="${page}">Pagina ${page}</button>`;
        }).join("")}
      </div>
    </div>
  `;

  const searchInput = elements.kanban.querySelector("#kanban-search");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const cursorPosition = searchInput.selectionStart || searchInput.value.length;
      state.kanbanSearch = searchInput.value;
      state.kanbanPage = 1;
      renderKanban(clients);
      const nextSearchInput = elements.kanban.querySelector("#kanban-search");
      if (nextSearchInput) {
        nextSearchInput.focus();
        nextSearchInput.setSelectionRange(cursorPosition, cursorPosition);
      }
    });
  }
  attachClientActions(elements.kanban);
  elements.kanban.querySelectorAll("[data-kanban-page]").forEach((button) => {
    button.addEventListener("click", () => {
      state.kanbanPage = Number(button.dataset.kanbanPage || 1);
      renderKanban(clients);
    });
  });
}

function renderArchive(archived) {
  if (!elements.archive) return;
  if (!archived.length) {
    elements.archive.innerHTML = `<p class="empty">No hay clientes archivados para nurturing.</p>`;
    return;
  }

  elements.archive.innerHTML = archived
    .map((lead) => {
      const contact = lead.contacts || {};
      const company = lead.companies || {};
      return `
        <article class="archive-row">
          <div>
            <strong>${contact.full_name || "Contacto sin nombre"}</strong>
            <span>${contact.title || "Cargo no disponible"}</span>
            <small>${company.name || "Empresa no disponible"} | ${contact.email || contact.mobile_phone || contact.phone || "Sin contacto directo"}</small>
          </div>
          <div class="client-card-meta">
            <span>${lead.lead_type === "investor" ? "Inversionista" : "Consultoria"}</span>
            <span>${regionLabel(lead.target_region)} | Score ${lead.score}</span>
          </div>
          <div class="archive-actions">
            <button class="secondary" type="button" data-open-detail="${lead.id}">Ver detalle</button>
            <button class="secondary" type="button" data-open-company="${company.id || ""}" ${company.id ? "" : "disabled"}>Ver empresa</button>
            <button type="button" data-restore-lead="${lead.id}">Restaurar a Nuevo</button>
          </div>
        </article>
      `;
    })
    .join("");

  elements.archive.querySelectorAll("[data-open-detail]").forEach((button) => {
    button.addEventListener("click", () => openLeadDetail(button.dataset.openDetail));
  });
  elements.archive.querySelectorAll("[data-open-company]").forEach((button) => {
    if (button.disabled) return;
    button.addEventListener("click", () => openCompanyDetail(button.dataset.openCompany));
  });
  elements.archive.querySelectorAll("[data-restore-lead]").forEach((button) => {
    button.addEventListener("click", () => restoreLead(button.dataset.restoreLead));
  });
}

function pipelineStatusOptions(current) {
  return PIPELINE_STATUSES.map(([value, label]) => `<option value="${value}" ${value === current ? "selected" : ""}>${label}</option>`).join("");
}

function line(label, value) {
  return `<p><strong>${label}</strong><span>${value || "No disponible"}</span></p>`;
}

function origamiStatusLabel(status) {
  const labels = {
    not_requested: "No analizado",
    running: "Analizando",
    completed: "Completado",
    failed: "Error",
    needs_input: "Requiere revision",
  };
  return labels[status] || status || "No analizado";
}

function renderOrigamiSignals(profile) {
  const signals = Array.isArray(profile?.signals) ? profile.signals : [];
  const risks = Array.isArray(profile?.risks) ? profile.risks : [];
  const pitchSource = profile?.official_pitch_url
    ? `<a href="${attr(profile.official_pitch_url)}" target="_blank" rel="noopener">Abrir fuente</a>`
    : "Sin fuente";
  return `
    <div class="origami-signal-grid">
      <article>
        <strong>Cold email fit</strong>
        <span>${escapeHtml(profile?.cold_email_fit || "unknown")}</span>
      </article>
      <article>
        <strong>Canal recomendado</strong>
        <span>${escapeHtml(profile?.recommended_channel || "manual_review")}</span>
      </article>
      <article>
        <strong>Email oficial pitch</strong>
        <span>${escapeHtml(profile?.official_pitch_email || "No encontrado")}</span>
      </article>
      <article>
        <strong>Politica pitch</strong>
        <span>${escapeHtml(profile?.pitch_policy || "unknown")}</span>
      </article>
    </div>
    <div class="origami-pitch-box">
      <strong>Canal oficial para pitch</strong>
      <div class="origami-search-meta">
        <span>Canal: ${escapeHtml(profile?.official_pitch_channel || "unknown")}</span>
        <span>Alias: ${escapeHtml(profile?.pitch_email_alias_type || "unknown")}</span>
        <span>Fuente: ${pitchSource}</span>
      </div>
      ${
        profile?.pitch_detection_evidence
          ? `<p>${escapeHtml(profile.pitch_detection_evidence)}</p>`
          : `<p class="empty">Origami no encontro evidencia publica suficiente para un canal oficial.</p>`
      }
    </div>
    <div class="origami-list-block">
      <strong>Senales</strong>
      ${
        signals.length
          ? `<ul>${signals.map((signal) => `<li>${escapeHtml(signal)}</li>`).join("")}</ul>`
          : `<p class="empty">Sin senales registradas todavia.</p>`
      }
    </div>
    <div class="origami-list-block">
      <strong>Riesgos</strong>
      ${risks.length ? `<ul>${risks.map((risk) => `<li>${escapeHtml(risk)}</li>`).join("")}</ul>` : `<p class="empty">Sin riesgos detectados.</p>`}
    </div>
  `;
}

function renderOrigamiPanel(opportunity) {
  if (!elements.detailOrigami) return;
  const status = opportunity.origami_status || "not_requested";
  const profile = opportunity.origami_profile || {};
  const draft = opportunity.origami_email_draft || {};
  const analyzedAt = opportunity.origami_analyzed_at ? new Date(opportunity.origami_analyzed_at).toLocaleString("es-CO") : "";

  if (elements.analyzeOrigami) {
    elements.analyzeOrigami.disabled = !state.origamiConfigured || status === "running";
    elements.analyzeOrigami.textContent = status === "completed" ? "Reanalizar con Origami" : "Analizar con Origami";
  }
  if (elements.refreshOrigami) {
    elements.refreshOrigami.disabled = !state.origamiConfigured || !opportunity.origami_run_id || status !== "running";
  }

  const draftReady = draft.recommended_subject || draft.email_body || draft.opening_line;
  elements.detailOrigami.innerHTML = `
    <div class="origami-status-row">
      <span class="status-badge">${origamiStatusLabel(status)}</span>
      ${status === "running" ? `<small>Refresco automatico activo. Esto puede tardar varios minutos.</small>` : ""}
      ${analyzedAt ? `<small>Ultimo analisis: ${escapeHtml(analyzedAt)}</small>` : ""}
      ${!state.origamiConfigured ? `<small>Falta ORIGAMI_API_KEY en Vercel.</small>` : ""}
      ${opportunity.origami_error ? `<small>${escapeHtml(opportunity.origami_error)}</small>` : ""}
    </div>
    ${
      profile.summary || profile.personalization_angle
        ? `
          <div class="origami-summary">
            ${profile.summary ? `<p><strong>Resumen</strong><span>${escapeHtml(profile.summary)}</span></p>` : ""}
            ${profile.personalization_angle ? `<p><strong>Angulo</strong><span>${escapeHtml(profile.personalization_angle)}</span></p>` : ""}
            ${profile.cold_email_fit_reason ? `<p><strong>Apertura cold email</strong><span>${escapeHtml(profile.cold_email_fit_reason)}</span></p>` : ""}
          </div>
          ${renderOrigamiSignals(profile)}
        `
        : `<p class="empty">Todavia no hay inteligencia Origami para esta lead.</p>`
    }
    ${
      draftReady
        ? `
          <div class="origami-draft">
            <strong>Borrador personalizado</strong>
            ${draft.opening_line ? `<p>${escapeHtml(draft.opening_line)}</p>` : ""}
            ${draft.recommended_subject ? `<small>Asunto: ${escapeHtml(draft.recommended_subject)}</small>` : ""}
            ${draft.email_body ? `<pre>${escapeHtml(draft.email_body)}</pre>` : ""}
            <div class="origami-actions">
              <button type="button" data-use-origami-draft>Usar en nuevo correo</button>
              <button class="secondary" type="button" data-copy-origami-draft>Copiar borrador</button>
            </div>
          </div>
        `
        : ""
    }
  `;

  elements.detailOrigami.querySelector("[data-use-origami-draft]")?.addEventListener("click", () => useOrigamiDraft(opportunity));
  elements.detailOrigami.querySelector("[data-copy-origami-draft]")?.addEventListener("click", () => {
    const text = [draft.recommended_subject ? `Subject: ${draft.recommended_subject}` : "", draft.email_body || ""].filter(Boolean).join("\n\n");
    copyValue(text, "Borrador Origami");
  });
}

function renderLeadDetail(detail) {
  const opportunity = detail.opportunity;
  const contact = opportunity.contacts || {};
  const company = opportunity.companies || {};
  const reasons = Array.isArray(opportunity.score_reasons) ? opportunity.score_reasons : [];
  const detailContactState = clientContactState(opportunity);
  const detailEmail = contact.email || (detailContactState.apolloHasEmail ? "Disponible en Apollo, no revelado" : "");
  const detailPhone =
    contact.mobile_phone ||
    contact.phone ||
    (detailContactState.apolloHasDirectPhone ? "Disponible en Apollo, solicitar telefono" : "");

  elements.detailTitle.textContent = contact.full_name || "Lead sin nombre";
  elements.detailSubtitle.textContent = `${opportunity.lead_type === "investor" ? "Inversionista" : "Consultoria"} · ${opportunity.target_region}`;
  elements.detailContact.innerHTML = [
    line("Cargo", contact.title),
    line("Senioridad", contact.seniority),
    line("Email", detailEmail),
    line("Estado email", contact.email_status),
    line("Telefono", detailPhone),
    line("LinkedIn", contact.linkedin_url),
    line("Ubicacion", [contact.city, contact.state, contact.country].filter(Boolean).join(", ")),
    line("Enriquecimiento", contact.apollo_enrichment_status),
    line("Actualizado Apollo", contact.apollo_enriched_at ? new Date(contact.apollo_enriched_at).toLocaleString("es-CO") : ""),
  ].join("");
  elements.detailCompany.innerHTML = [
    line("Empresa", company.name),
    line("Dominio", companyDomain(company)),
    line("Industria", companyField(company, "industry")),
    line("Web", companyWebsite(company)),
    line("LinkedIn", companyField(company, "linkedin_url")),
    line("Pais", companyField(company, "country")),
    line("Empleados", companyEmployeeCount(company)),
  ].join("") + `<button class="secondary detail-inline-action" type="button" data-open-company="${company.id || ""}" ${company.id ? "" : "disabled"}>Ver ficha de empresa</button>`;
  elements.detailCompany.querySelector("[data-open-company]")?.addEventListener("click", (event) => {
    if (event.currentTarget.disabled) return;
    openCompanyDetail(event.currentTarget.dataset.openCompany);
  });
  elements.detailScore.innerHTML = `
    <div class="detail-score ${opportunity.score_label}">
      <strong>${opportunity.score}</strong>
      <span>${opportunity.score_label}</span>
    </div>
    <ul>${reasons.map((reason) => `<li>${reason.points} · ${reason.reason}</li>`).join("") || "<li>Sin razones registradas.</li>"}</ul>
  `;
  elements.detailScoreInput.value = opportunity.score ?? 0;
  elements.detailScoreLabel.value = opportunity.score_label || "unqualified";
  elements.detailTagOptions.innerHTML = (detail.tags || [])
    .map(
      (tag) => `
        <label class="tag-option">
          <input type="checkbox" value="${attr(tag.id)}" ${tag.selected ? "checked" : ""}>
          <span style="--tag-color: ${attr(tag.color || "#6b7280")}">${tag.name}</span>
        </label>
      `
    )
    .join("");
  elements.detailStatus.value = opportunity.pipeline_status || "nuevo";
  elements.detailFollowupDate.value = opportunity.next_follow_up_at ? opportunity.next_follow_up_at.slice(0, 10) : "";
  elements.detailFollowupType.value = opportunity.next_follow_up_type || "";
  elements.detailNotesList.innerHTML = detail.notes.length
    ? detail.notes
        .map(
          (note) => `
            <article class="note-row">
              <p>${note.body}</p>
              <small>${note.users?.name || "Usuario"} · ${new Date(note.created_at).toLocaleString("es-CO")}</small>
            </article>
          `
        )
        .join("")
    : `<p class="empty">No hay notas todavia.</p>`;
  elements.detailPipelineEvents.innerHTML = detail.events?.length
    ? detail.events
        .map(
          (event) => `
            <article class="note-row">
              <p>${event.from_status || "inicio"} → ${event.to_status}</p>
              <small>${event.users?.name || "Usuario"} · ${new Date(event.changed_at).toLocaleString("es-CO")}</small>
            </article>
          `
        )
        .join("")
    : `<p class="empty">No hay cambios de pipeline todavia.</p>`;
  elements.detailActivities.innerHTML = detail.activities?.length
    ? detail.activities
        .map(
          (activity) => `
            <article class="note-row">
              <p>${activity.subject || activity.activity_type}</p>
              <small>${activity.users?.name || "Usuario"} Â· ${new Date(activity.activity_at).toLocaleString("es-CO")}</small>
            </article>
          `
        )
        .join("")
    : `<p class="empty">No hay actividades registradas todavia.</p>`;
  renderOrigamiPanel(opportunity);
}

async function openLeadDetail(opportunityId) {
  activeOpportunityId = opportunityId;
  try {
    const detail = await api(`/api/lead-detail?id=${encodeURIComponent(opportunityId)}`);
    renderLeadDetail(detail);
    elements.detailModal.classList.remove("hidden");
    elements.detailModal.setAttribute("aria-hidden", "false");
  } catch (error) {
    setStatus(error.message, "warning");
  }
}

function closeLeadDetail() {
  clearOrigamiPoll();
  activeOpportunityId = "";
  elements.detailModal.classList.add("hidden");
  elements.detailModal.setAttribute("aria-hidden", "true");
}

function renderCompanyDetail(detail) {
  const company = detail.company || {};
  elements.companyDetailTitle.textContent = company.name || "Empresa sin nombre";
  elements.companyDetailSubtitle.textContent = [companyField(company, "industry"), companyField(company, "country")].filter(Boolean).join(" | ") || "Datos comerciales";
  elements.companyDetailFacts.innerHTML = [
    line("Industria", companyField(company, "industry")),
    line("Pais", companyField(company, "country")),
    line("Ciudad", [companyField(company, "city"), companyField(company, "state")].filter(Boolean).join(", ")),
    line("Tamano", companyEmployeeCount(company)),
    line("Web", companyWebsite(company)),
    line("LinkedIn", companyField(company, "linkedin_url")),
    line("Telefono", companyField(company, "phone")),
    line("Dominio", companyDomain(company)),
  ].join("");

  elements.companyDetailOpportunities.innerHTML = detail.opportunities?.length
    ? detail.opportunities
        .map(
          (opportunity) => `
            <article class="company-row">
              <div>
                <strong>${opportunity.lead_type === "investor" ? "Inversionista" : "Consultoria"} | ${regionLabel(opportunity.target_region)}</strong>
                <span>${opportunity.pipeline_status || "Sin estado"} | Score ${opportunity.score} ${opportunity.score_label}</span>
                <small>${opportunity.contacts?.full_name || "Contacto sin nombre"}</small>
              </div>
              <button class="secondary" type="button" data-company-open-lead="${opportunity.id}">Ver lead</button>
            </article>
          `
        )
        .join("")
    : `<p class="empty">No hay oportunidades asociadas.</p>`;

  elements.companyDetailContacts.innerHTML = detail.contacts?.length
    ? detail.contacts
        .map(
          (contact) => `
            <article class="company-row">
              <div>
                <strong>${contact.full_name || "Contacto sin nombre"}</strong>
                <span>${contact.title || "Cargo no disponible"}</span>
                <small>${contact.email || contact.mobile_phone || contact.phone || "Sin contacto directo"}</small>
              </div>
              <div class="company-row-actions">
                <button class="secondary" type="button" data-copy-value="${attr(contact.email || "")}" data-copy-label="Email" ${contact.email ? "" : "disabled"}>Copiar email</button>
                <button class="secondary" type="button" data-copy-value="${attr(contact.mobile_phone || contact.phone || "")}" data-copy-label="Telefono" ${contact.mobile_phone || contact.phone ? "" : "disabled"}>Copiar telefono</button>
                <button class="secondary" type="button" data-open-url="${attr(contact.linkedin_url || "")}" data-open-label="LinkedIn" ${contact.linkedin_url ? "" : "disabled"}>LinkedIn</button>
              </div>
            </article>
          `
        )
        .join("")
    : `<p class="empty">No hay contactos asociados.</p>`;

  elements.companyDetailNotes.innerHTML = detail.notes?.length
    ? detail.notes
        .map(
          (note) => `
            <article class="note-row">
              <p>${note.body}</p>
              <small>${note.users?.name || "Usuario"} | ${new Date(note.created_at).toLocaleString("es-CO")}</small>
            </article>
          `
        )
        .join("")
    : `<p class="empty">No hay notas comerciales de empresa.</p>`;

  elements.companyDetailOpportunities.querySelectorAll("[data-company-open-lead]").forEach((button) => {
    button.addEventListener("click", () => openLeadDetail(button.dataset.companyOpenLead));
  });
  elements.companyDetailContacts.querySelectorAll("[data-copy-value]").forEach((button) => {
    if (button.disabled) return;
    button.addEventListener("click", () => copyValue(button.dataset.copyValue, button.dataset.copyLabel || "Valor"));
  });
  elements.companyDetailContacts.querySelectorAll("[data-open-url]").forEach((button) => {
    if (button.disabled) return;
    button.addEventListener("click", () => openUrl(button.dataset.openUrl, button.dataset.openLabel || "Enlace"));
  });
}

async function openCompanyDetail(companyId) {
  if (!companyId) return;
  activeCompanyId = companyId;
  try {
    const detail = await api(`/api/lead-detail?company_id=${encodeURIComponent(companyId)}`);
    renderCompanyDetail(detail);
    elements.companyDetailModal.classList.remove("hidden");
    elements.companyDetailModal.setAttribute("aria-hidden", "false");
  } catch (error) {
    setStatus(error.message, "warning");
  }
}

function closeCompanyDetail() {
  activeCompanyId = "";
  elements.companyDetailModal.classList.add("hidden");
  elements.companyDetailModal.setAttribute("aria-hidden", "true");
}

async function addCompanyNote() {
  if (!activeCompanyId || !elements.companyNoteInput.value.trim()) return;
  try {
    const detail = await api(`/api/lead-detail?company_id=${encodeURIComponent(activeCompanyId)}`, {
      method: "POST",
      body: JSON.stringify({ note: elements.companyNoteInput.value.trim() }),
    });
    elements.companyNoteInput.value = "";
    renderCompanyDetail(detail);
    setStatus("Nota comercial de empresa agregada.", "ok");
  } catch (error) {
    setStatus(error.message, "warning");
  }
}

async function saveLeadDetail() {
  if (!activeOpportunityId) return;
  try {
    const detail = await api(`/api/lead-detail?id=${encodeURIComponent(activeOpportunityId)}`, {
      method: "PATCH",
      body: JSON.stringify({
        pipeline_status: elements.detailStatus.value,
        next_follow_up_at: elements.detailFollowupDate.value,
        next_follow_up_type: elements.detailFollowupType.value,
      }),
    });
    renderLeadDetail(detail);
    await reloadLeadsOnly();
    renderFollowups(await api("/api/followups"));
    setStatus("Detalle actualizado.", "ok");
  } catch (error) {
    setStatus(error.message, "warning");
  }
}

async function saveScoreTags() {
  if (!activeOpportunityId) {
    setStatus("Abre primero el detalle de un cliente para guardar score y etiquetas.", "warning");
    return;
  }
  const selectedTags = Array.from(elements.detailTagOptions.querySelectorAll("input:checked")).map((input) => input.value);
  const originalText = elements.saveScoreTags.textContent;
  elements.saveScoreTags.disabled = true;
  elements.saveScoreTags.textContent = "Guardando...";
  try {
    const detail = await api(`/api/lead-detail?id=${encodeURIComponent(activeOpportunityId)}`, {
      method: "PATCH",
      body: JSON.stringify({
        score: elements.detailScoreInput.value,
        score_label: elements.detailScoreLabel.value,
        tag_ids: selectedTags,
      }),
    });
    renderLeadDetail(detail);
    await reloadLeadsOnly();
    setStatus("Score y etiquetas actualizados.", "ok");
  } catch (error) {
    setStatus(error.message, "warning");
  } finally {
    elements.saveScoreTags.disabled = false;
    elements.saveScoreTags.textContent = originalText;
  }
}

async function scheduleTask(opportunityId, button) {
  const taskType = elements.clients.querySelector(`[data-task-type="${opportunityId}"]`)?.value || "Seguimiento";
  const taskDate = elements.clients.querySelector(`[data-task-date="${opportunityId}"]`)?.value || "";
  if (!taskDate) {
    setStatus("Selecciona una fecha para crear la tarea.", "warning");
    return;
  }

  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = "Creando...";
  try {
    await api(`/api/lead-detail?id=${encodeURIComponent(opportunityId)}`, {
      method: "PATCH",
      body: JSON.stringify({
        next_follow_up_at: taskDate,
        next_follow_up_type: taskType,
      }),
    });
    await reloadLeadsOnly();
    renderFollowups(await api("/api/followups"));
    setStatus("Tarea creada en Seguimientos.", "ok");
  } catch (error) {
    setStatus(error.message, "warning");
  } finally {
    if (button.isConnected) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
}

async function changePipelineStatus(opportunityId, pipelineStatus) {
  try {
    await api("/api/pipeline", {
      method: "POST",
      body: JSON.stringify({
        opportunity_id: opportunityId,
        pipeline_status: pipelineStatus,
      }),
    });
    await reloadLeadsOnly();
    if (activeOpportunityId === opportunityId) {
      await openLeadDetail(opportunityId);
    }
    setStatus(pipelineStatus === ARCHIVE_STATUS ? "Cliente archivado para nurturing." : "Estado de pipeline actualizado.", "ok");
  } catch (error) {
    setStatus(error.message, "warning");
    await reloadLeadsOnly();
  }
}

async function archiveLead(opportunityId) {
  if (!window.confirm("Archivar este cliente para nurturing futuro? No se borrara ningun dato.")) return;
  await changePipelineStatus(opportunityId, ARCHIVE_STATUS);
  activateTab("archivo", true);
}

async function restoreLead(opportunityId) {
  await changePipelineStatus(opportunityId, "nuevo");
  activateTab("clientes", true);
}

async function addLeadNote() {
  if (!activeOpportunityId || !elements.detailNoteInput.value.trim()) return;
  try {
    const detail = await api(`/api/lead-detail?id=${encodeURIComponent(activeOpportunityId)}`, {
      method: "POST",
      body: JSON.stringify({ note: elements.detailNoteInput.value.trim() }),
    });
    elements.detailNoteInput.value = "";
    renderLeadDetail(detail);
    await reloadLeadsOnly();
    renderFollowups(await api("/api/followups"));
  } catch (error) {
    setStatus(error.message, "warning");
  }
}

function useOrigamiDraft(opportunity) {
  const contact = opportunity.contacts || {};
  const draft = opportunity.origami_email_draft || {};
  const email = contact.email || "";
  if (elements.emailOpportunity) elements.emailOpportunity.value = opportunity.id;
  if (elements.emailTo && email) elements.emailTo.value = email;
  if (elements.emailSubject && draft.recommended_subject) elements.emailSubject.value = draft.recommended_subject;
  if (elements.emailBody && draft.email_body) elements.emailBody.value = draft.email_body;
  if (elements.emailSender) elements.emailSender.value = opportunity.lead_type === "investor" ? "investors" : "consulting";
  closeLeadDetail();
  activateTab("correos", true);
  switchEmailMailbox("compose");
  setStatus("Borrador Origami cargado en Nuevo correo.", "ok");
}

function clearOrigamiPoll() {
  if (state.origamiPollTimer) {
    window.clearTimeout(state.origamiPollTimer);
    state.origamiPollTimer = null;
  }
  state.origamiPollAttempts = 0;
}

function scheduleOrigamiPoll(opportunityId, attempt = 1) {
  if (!opportunityId || activeOpportunityId !== opportunityId) return;
  if (state.origamiPollTimer) window.clearTimeout(state.origamiPollTimer);
  state.origamiPollAttempts = attempt;
  state.origamiPollTimer = window.setTimeout(async () => {
    if (activeOpportunityId !== opportunityId) return;
    try {
      const result = await api(`/api/origami?id=${encodeURIComponent(opportunityId)}`, {
        method: "POST",
        body: JSON.stringify({ action: "refresh" }),
      });
      const detail = await api(`/api/lead-detail?id=${encodeURIComponent(opportunityId)}`);
      renderLeadDetail(detail);
      const status = result.opportunity?.origami_status || detail.opportunity?.origami_status;
      if (status === "running" && attempt < ORIGAMI_MAX_POLL_ATTEMPTS) {
        setStatus(`Origami sigue analizando... intento ${attempt + 1}/${ORIGAMI_MAX_POLL_ATTEMPTS}.`, "ok");
        scheduleOrigamiPoll(opportunityId, attempt + 1);
        return;
      }
      clearOrigamiPoll();
      if (status === "running") {
        setStatus("Origami sigue procesando. Puedes dejar la lead abierta o presionar Actualizar mas tarde.", "warning");
      } else if (status === "completed") {
        setStatus("Inteligencia Origami lista.", "ok");
      } else if (status === "needs_input") {
        setStatus("Origami requiere revision manual para completar este analisis.", "warning");
      } else if (status === "failed") {
        setStatus("Origami no pudo completar este analisis. Revisa el error en el detalle.", "warning");
      }
    } catch (error) {
      clearOrigamiPoll();
      setStatus(error.message, "warning");
    }
  }, ORIGAMI_POLL_INTERVAL_MS);
}

async function runOrigamiAnalysis(action = "analyze") {
  if (!activeOpportunityId) return;
  if (!state.origamiConfigured) {
    setStatus("Falta ORIGAMI_API_KEY en Vercel para activar Origami.", "warning");
    return;
  }
  const button = action === "refresh" ? elements.refreshOrigami : elements.analyzeOrigami;
  const originalText = button?.textContent || "";
  if (button) {
    button.disabled = true;
    button.textContent = action === "refresh" ? "Actualizando..." : "Analizando...";
  }
  try {
    const result = await api(`/api/origami?id=${encodeURIComponent(activeOpportunityId)}`, {
      method: "POST",
      body: JSON.stringify({ action }),
    });
    await openLeadDetail(activeOpportunityId);
    const status = result.opportunity?.origami_status;
    if (status === "running") {
      scheduleOrigamiPoll(activeOpportunityId);
      setStatus("Origami esta analizando la lead. El CRM actualizara automaticamente.", "ok");
    } else {
      clearOrigamiPoll();
      setStatus("Inteligencia Origami actualizada.", "ok");
    }
  } catch (error) {
    setStatus(error.message, "warning");
  } finally {
    if (button?.isConnected) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
}

async function registerActivity(opportunityId, activityType, button) {
  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = "Registrando...";
  try {
    const detail = await api(`/api/lead-detail?id=${encodeURIComponent(opportunityId)}`, {
      method: "POST",
      body: JSON.stringify({
        activity_type: activityType || "contact",
        subject: "Contacto registrado desde Clientes",
      }),
    });
    if (activeOpportunityId === opportunityId) {
      renderLeadDetail(detail);
    }
    await reloadLeadsOnly();
    renderFollowups(await api("/api/followups"));
    setStatus("Contacto registrado.", "ok");
  } catch (error) {
    setStatus(error.message, "warning");
  } finally {
    if (button.isConnected) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
}

async function requestPhone(opportunityId, button) {
  if (!window.confirm("Solicitar telefono movil a Apollo? Esta accion puede consumir creditos de enriquecimiento.")) return;
  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = "Solicitando...";
  try {
    const result = await api("/api/apollo-enrich", {
      method: "POST",
      body: JSON.stringify({
        opportunity_id: opportunityId,
        request_phone: true,
      }),
    });
    await reloadLeadsOnly();
    if (result.has_phone) {
      setStatus("Telefono obtenido desde Apollo.", "ok");
    } else if (result.phone_request_sent) {
      setStatus("Telefono solicitado. Apollo lo enviara al webhook cuando este disponible.", "ok");
    } else if (result.phone_status === "not_available") {
      setStatus("Apollo no tiene telefono disponible para esta lead.", "warning");
    } else {
      setStatus("No hay webhook de telefono configurado.", "warning");
    }
  } catch (error) {
    setStatus(error.message, "warning");
  } finally {
    if (button.isConnected) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
}

async function loadPublicData() {
  const templates = await api("/api/templates");
  const status = templates;
  state.templates = templates.templates;
  state.origamiConfigured = Boolean(status.origamiConfigured);
  if (elements.origamiConfigStatus) {
    elements.origamiConfigStatus.textContent = state.origamiConfigured ? "Origami conectado" : "Origami pendiente";
  }
  renderTemplates();
  renderMessageTemplates();

  if (!status.supabaseConfigured) {
    setStatus("Falta SUPABASE_SERVICE_ROLE_KEY en Vercel para activar base de datos.", "warning");
    return;
  }

  if (!status.apolloConfigured) {
    setStatus("Falta APOLLO_API_KEY en Vercel para busquedas Apollo.", "warning");
    return;
  }

  setStatus("API web lista. Inicia sesion para ver y buscar leads.", "ok");
}

async function loadPrivateData() {
  if (!state.token) {
    showLogin();
    return;
  }

  try {
    showApp();
    const [dashboard, leads, users, followups, searchHistory, emails, campaigns, exclusions, inventory, origamiSearches, origamiJobs] = await Promise.all([
      api("/api/dashboard"),
      api(`/api/leads${leadFilterQuery()}`),
      api("/api/users").catch(() => ({ users: [] })),
      api("/api/followups"),
      api("/api/leads?mode=search_history").catch(() => ({ searches: [] })),
      api("/api/emails").catch(() => ({ status: null, messages: [] })),
      api("/api/emails?mode=campaigns").catch(() => ({ campaigns: [] })),
      api("/api/emails?mode=exclusions").catch(() => ({ exclusions: [] })),
      api("/api/emails?mode=lead_inventory").catch(() => ({ inventory: null })),
      api("/api/origami-search").catch(() => ({ searches: [] })),
      api("/api/origami-jobs").catch(() => ({ searches: [] })),
    ]);
    state.currentUser = dashboard.user;
    state.users = users.users || [];
    state.searches = searchHistory.searches || [];
    state.emailStatus = emails.status || null;
    state.emailMessages = emails.messages || [];
    state.emailCampaigns = campaigns.campaigns || [];
    state.emailWarmups = campaigns.warmups || [];
    state.emailExclusions = exclusions.exclusions || [];
    state.leadInventory = inventory.inventory || null;
    state.origamiPeopleSearches = origamiSearches.searches || [];
    state.origamiJobSearches = origamiJobs.searches || [];
    const leadRows = leads.leads || [];
    const collections = splitLeadCollections(leadRows);
    renderMetrics({
      ...dashboard,
      leadsInAirport: collections.airportLeads.length,
      clientsProcessed: collections.clients.length,
      archived: collections.archived.length,
    });
    renderFollowups(followups);
    renderUsers();
    renderSearchHistory(state.searches);
    renderLeadCollections(leadRows);
    renderEmails(state.emailMessages);
    renderCampaigns(state.emailCampaigns);
    renderLeadInventory(state.leadInventory);
    renderWarmups(state.emailWarmups);
    renderExclusions(state.emailExclusions);
    renderOrigamiPeopleSearches();
    renderOrigamiJobSearches();
    applyRoleVisibility();
    setStatus("Conectado a Supabase y Apollo desde Vercel.", "ok");
  } catch (error) {
    state.token = "";
    sessionStorage.removeItem("tecnotitan_crm_session");
    showLogin();
    setLoginStatus(error.message, "warning");
  }
}

async function openSearchResults(searchId) {
  try {
    const data = await api(`/api/leads?search_id=${encodeURIComponent(searchId)}`);
    renderSearchResults(data.results || []);
  } catch (error) {
    setStatus(error.message, "warning");
  }
}

async function createUser() {
  try {
    const result = await api("/api/users", {
      method: "POST",
      body: JSON.stringify({
        name: elements.newUserName.value.trim(),
        email: elements.newUserEmail.value.trim(),
        username: elements.newUserUsername.value.trim(),
        password: elements.newUserPassword.value,
        role: elements.newUserRole.value,
      }),
    });
    state.users = result.users || [];
    elements.newUserName.value = "";
    elements.newUserEmail.value = "";
    elements.newUserUsername.value = "";
    elements.newUserPassword.value = "";
    renderUsers();
    setStatus("Usuario creado.", "ok");
  } catch (error) {
    setStatus(error.message, "warning");
  }
}

async function updateUser(id, patch) {
  try {
    const result = await api("/api/users", {
      method: "PATCH",
      body: JSON.stringify({ id, ...patch }),
    });
    state.users = result.users || [];
    renderUsers();
    renderLeadCollections(await currentLeads());
    setStatus("Usuario actualizado.", "ok");
  } catch (error) {
    setStatus(error.message, "warning");
  }
}

async function deleteUser(id, name) {
  if (!window.confirm(`Eliminar usuario ${name || ""}? Esta accion desactiva su acceso y conserva el historial.`)) return;

  try {
    const result = await api("/api/users", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    state.users = result.users || [];
    renderUsers();
    renderLeadCollections(await currentLeads());
    setStatus("Usuario eliminado.", "ok");
  } catch (error) {
    setStatus(error.message, "warning");
  }
}

async function currentLeads() {
  const leads = await api(`/api/leads${leadFilterQuery()}`);
  return leads.leads || [];
}

function leadFilterQuery() {
  const params = new URLSearchParams();
  if (elements.leadSearch.value.trim()) params.set("q", elements.leadSearch.value.trim());
  if (elements.leadCountry.value.trim()) params.set("country", elements.leadCountry.value.trim());
  if (elements.leadTypeFilter.value) params.set("lead_type", elements.leadTypeFilter.value);
  if (elements.leadRegionFilter.value) params.set("target_region", elements.leadRegionFilter.value);
  if (elements.leadScoreFilter.value) params.set("score_label", elements.leadScoreFilter.value);
  if (elements.leadStatusFilter.value) params.set("pipeline_status", elements.leadStatusFilter.value);
  const query = params.toString();
  return query ? `?${query}` : "";
}

async function reloadLeadsOnly() {
  try {
    renderLeadCollections(await currentLeads());
  } catch (error) {
    setStatus(error.message, "warning");
  }
}

async function reloadEmailsOnly() {
  try {
    const emails = await api("/api/emails");
    state.emailStatus = emails.status || null;
    state.emailMessages = emails.messages || [];
    if (state.selectedEmailId && !state.emailMessages.some((message) => message.id === state.selectedEmailId)) {
      state.selectedEmailId = "";
    }
    renderEmails(state.emailMessages);
  } catch (error) {
    if (elements.emailList) elements.emailList.innerHTML = `<p class="empty">${error.message}</p>`;
  }
}

async function reloadCampaignsOnly() {
  try {
    const [data, exclusions, inventory] = await Promise.all([
      api("/api/emails?mode=campaigns"),
      api("/api/emails?mode=exclusions").catch(() => ({ exclusions: [] })),
      api("/api/emails?mode=lead_inventory").catch(() => ({ inventory: null })),
    ]);
    state.emailCampaigns = data.campaigns || [];
    state.emailWarmups = data.warmups || [];
    state.emailExclusions = exclusions.exclusions || [];
    state.leadInventory = inventory.inventory || null;
    renderCampaigns(state.emailCampaigns);
    renderLeadInventory(state.leadInventory);
    renderWarmups(state.emailWarmups);
    renderExclusions(state.emailExclusions);
  } catch (error) {
    if (elements.campaignList) elements.campaignList.innerHTML = `<p class="empty">${error.message}</p>`;
  }
}

function applyLeadFiltersFromFirstPage() {
  state.leadPage = 1;
  reloadLeadsOnly();
}

function clearLeadFilters() {
  elements.leadSearch.value = "";
  elements.leadCountry.value = "";
  elements.leadTypeFilter.value = "";
  elements.leadRegionFilter.value = "";
  elements.leadScoreFilter.value = "";
  elements.leadStatusFilter.value = "";
  state.leadPage = 1;
  reloadLeadsOnly();
}

async function getLeads(templateKey) {
  if (!state.token) {
    setStatus("Inicia sesion primero.", "warning");
    return;
  }

  if (state.currentUser?.role !== "admin") {
    setStatus("Solo el usuario maestro puede obtener leads.", "warning");
    return;
  }

  elements.getConsultingLeads.disabled = true;
  elements.getInvestorLeads.disabled = true;
  elements.searchStatus.textContent = "Obteniendo leads desde Apollo...";

  try {
    const result = await api("/api/apollo-search", {
      method: "POST",
      body: JSON.stringify({
        template_key: templateKey,
        per_page: 25,
      }),
    });
    elements.searchStatus.textContent = `Listo: ${result.saved} leads guardados sin revelar detalles.`;
    await loadPrivateData();
  } catch (error) {
    elements.searchStatus.textContent = error.message;
  } finally {
    elements.getConsultingLeads.disabled = false;
    elements.getInvestorLeads.disabled = false;
  }
}

function normalizeCsvHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values.map((value) => value.trim());
}

function parseCsv(text) {
  const lines = String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim());
  if (lines.length < 2) throw new Error("El CSV debe tener encabezados y al menos una fila.");
  const headers = parseCsvLine(lines[0]).map(normalizeCsvHeader);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce((row, header, index) => {
      if (header) row[header] = values[index] || "";
      return row;
    }, {});
  });
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result || "");
    reader.onerror = () => reject(new Error("No pude leer el archivo CSV."));
    reader.readAsText(file);
  });
}

async function importCsv() {
  const file = elements.csvImportFile.files?.[0];
  if (!file) {
    elements.csvImportStatus.textContent = "Selecciona un archivo CSV.";
    return;
  }

  elements.importCsvButton.disabled = true;
  elements.csvImportStatus.textContent = "Leyendo CSV...";
  try {
    const text = await readFileAsText(file);
    const rows = parseCsv(text);
    if (rows.length > 500 && !window.confirm("El CSV tiene mas de 500 filas. Solo se importaran las primeras 500. Continuar?")) return;
    elements.csvImportStatus.textContent = `Importando ${Math.min(rows.length, 500)} filas...`;
    const result = await api("/api/leads", {
      method: "POST",
      body: JSON.stringify({
        mode: "csv_import",
        import_mode: elements.csvImportMode?.value || "general_csv",
        name: file.name,
        lead_type: elements.csvImportType.value,
        target_region: elements.csvImportRegion.value,
        rows,
      }),
    });
    elements.csvImportStatus.textContent = `Listo: ${result.saved} importados (${result.created || 0} nuevos, ${result.merged || 0} mezclados), ${result.skipped} omitidos.`;
    elements.csvImportFile.value = "";
    await loadPrivateData();
    activateTab("leads", true);
  } catch (error) {
    elements.csvImportStatus.textContent = error.message;
  } finally {
    elements.importCsvButton.disabled = false;
  }
}

async function sendEmail() {
  const opportunityId = elements.emailOpportunity.value;
  const to = elements.emailTo.value.trim();
  if (!opportunityId && !to) {
    elements.emailComposeStatus.textContent = "Escribe un destinatario o selecciona una lead.";
    return;
  }
  elements.sendEmailButton.disabled = true;
  elements.emailComposeStatus.textContent = "Enviando...";
  try {
    await api("/api/emails", {
      method: "POST",
      body: JSON.stringify({
        opportunity_id: opportunityId,
        sender_key: elements.emailSender.value,
        to,
        subject: elements.emailSubject.value,
        text: elements.emailBody.value,
        attach_investor_deck: Boolean(elements.emailAttachDeck?.checked),
      }),
    });
    elements.emailBody.value = "";
    if (elements.emailAttachDeck) elements.emailAttachDeck.checked = false;
    elements.emailComposeStatus.textContent = "Correo enviado.";
    state.emailMailbox = "sent";
    state.selectedEmailId = "";
    await reloadEmailsOnly();
    renderFollowups(await api("/api/followups"));
  } catch (error) {
    elements.emailComposeStatus.textContent = error.message;
  } finally {
    elements.sendEmailButton.disabled = false;
  }
}

async function refreshEmails() {
  if (!state.token) {
    setStatus("Inicia sesion primero.", "warning");
    return;
  }
  elements.refreshEmailButton.disabled = true;
  const originalText = elements.refreshEmailButton.textContent;
  elements.refreshEmailButton.textContent = "Actualizando...";
  try {
    await reloadEmailsOnly();
    setStatus("Correos actualizados.", "ok");
  } catch (error) {
    setStatus(error.message, "warning");
  } finally {
    elements.refreshEmailButton.disabled = false;
    elements.refreshEmailButton.textContent = originalText;
  }
}

async function replyToEmail(messageId) {
  const message = state.emailMessages.find((item) => item.id === messageId);
  if (!message) return;
  const replyBox = elements.emailList.querySelector(".email-reply-box");
  const textarea = replyBox?.querySelector("[data-reply-body]");
  const status = replyBox?.querySelector("[data-reply-status]");
  const button = replyBox?.querySelector("[data-reply-email]");
  const text = textarea?.value.trim() || "";
  if (!text) {
    if (status) status.textContent = "Escribe una respuesta.";
    return;
  }
  if (button) button.disabled = true;
  if (status) status.textContent = "Enviando respuesta...";
  try {
    await api("/api/emails", {
      method: "POST",
      body: JSON.stringify({
        opportunity_id: message.opportunity_id || message.opportunity?.id || "",
        sender_key: emailSenderForMessage(message),
        to: message.from_email,
        subject: emailReplySubject(message.subject),
        text,
        in_reply_to: message.message_id || message.provider_message_id || "",
        references: emailReferenceHeader(message),
      }),
    });
    if (textarea) textarea.value = "";
    state.emailMailbox = "sent";
    state.selectedEmailId = "";
    if (status) status.textContent = "Respuesta enviada.";
    await reloadEmailsOnly();
    renderFollowups(await api("/api/followups"));
  } catch (error) {
    if (status) status.textContent = error.message;
  } finally {
    if (button) button.disabled = false;
  }
}

async function createCampaign() {
  elements.createCampaignButton.disabled = true;
  elements.campaignStatus.textContent = "Creando campana...";
  try {
    const result = await api("/api/emails", {
      method: "POST",
      body: JSON.stringify({
        action: "create_campaign",
        name: elements.campaignName.value.trim(),
        campaign_type: elements.campaignType.value,
        segment_key: elements.campaignSegment?.value || "",
        sender_key: elements.campaignSender.value,
        target_region: elements.campaignTargetRegion.value,
        daily_limit: elements.campaignDailyLimit.value,
        queue_size: elements.campaignQueueSize.value,
        max_recipients: elements.campaignQueueSize.value,
        start_at: elements.campaignStartAt.value,
        end_at: elements.campaignEndAt.value,
        schedule_timezone: elements.campaignTimezone.value,
        send_window_start_minutes: 7 * 60,
        send_window_end_minutes: 17 * 60 + 45,
        batch_size: elements.campaignBatchSize.value,
        min_delay_minutes: elements.campaignMinDelay.value,
        max_delay_minutes: elements.campaignMaxDelay.value,
        subject_template: elements.campaignSubject.value,
        body_template: elements.campaignBody.value,
        attach_investor_deck: Boolean(elements.campaignAttachDeck?.checked),
      }),
    });
    elements.campaignName.value = "";
    elements.campaignStatus.textContent = `Campana creada: ${result.campaign?.counts?.queued || 0} correos programados con ritmo aleatorio.`;
    await reloadCampaignsOnly();
  } catch (error) {
    elements.campaignStatus.textContent = error.message;
  } finally {
    elements.createCampaignButton.disabled = false;
  }
}

async function addExclusion() {
  const email = elements.exclusionEmail.value.trim();
  if (!email) {
    elements.campaignStatus.textContent = "Escribe un email para excluir.";
    return;
  }
  elements.addExclusionButton.disabled = true;
  elements.campaignStatus.textContent = "Agregando a no contactar...";
  try {
    await api("/api/emails", {
      method: "POST",
      body: JSON.stringify({
        action: "create_exclusion",
        email,
        reason: elements.exclusionReason.value,
      }),
    });
    elements.exclusionEmail.value = "";
    elements.campaignStatus.textContent = "Email agregado a no contactar.";
    await reloadCampaignsOnly();
  } catch (error) {
    elements.campaignStatus.textContent = error.message;
  } finally {
    elements.addExclusionButton.disabled = false;
  }
}

async function processCampaign(campaignId, button) {
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "Procesando...";
  elements.campaignStatus.textContent = "Enviando lote controlado...";
  try {
    const result = await api("/api/emails", {
      method: "POST",
      body: JSON.stringify({
        action: "process_campaign",
        campaign_id: campaignId,
      }),
    });
    elements.campaignStatus.textContent = `Lote terminado: ${result.sent || 0} iniciales, ${result.followups_sent || 0} follow-ups, ${result.failed || 0} fallidos.`;
    await Promise.all([reloadCampaignsOnly(), reloadEmailsOnly()]);
  } catch (error) {
    elements.campaignStatus.textContent = error.message;
  } finally {
    if (button.isConnected) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
}

async function updateCampaignStatus(campaignId, nextStatus, button) {
  const originalText = button.textContent;
  const labels = {
    active: "Iniciando...",
    paused: "Pausando...",
    stopped: "Deteniendo...",
    archived: "Archivando...",
  };
  button.disabled = true;
  button.textContent = labels[nextStatus] || "Actualizando...";
  elements.campaignStatus.textContent = "Actualizando estado de campana...";
  try {
    await api("/api/emails", {
      method: "POST",
      body: JSON.stringify({
        action: "update_campaign_status",
        campaign_id: campaignId,
        status: nextStatus,
      }),
    });
    elements.campaignStatus.textContent = `Campana ${campaignStatusLabel(nextStatus).toLowerCase()}.`;
    await Promise.all([reloadCampaignsOnly(), reloadEmailsOnly()]);
  } catch (error) {
    elements.campaignStatus.textContent = error.message;
  } finally {
    if (button.isConnected) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
}

async function assignLead(opportunityId, userId) {
  if (!userId) return;
  const ownerUserId = userId === "__unassigned__" ? null : userId;
  try {
    await api("/api/assign-lead", {
      method: "POST",
      body: JSON.stringify({ opportunity_id: opportunityId, owner_user_id: ownerUserId }),
    });
    await loadPrivateData();
    setStatus(ownerUserId ? "Lead asignado al consultor." : "Lead marcado como sin asignar.", "ok");
  } catch (error) {
    setStatus(error.message, "warning");
  }
}

async function enrichLead(opportunityId, button) {
  button.disabled = true;
  button.textContent = "Obteniendo...";
  try {
    const result = await api("/api/apollo-enrich", {
      method: "POST",
      body: JSON.stringify({ opportunity_id: opportunityId }),
    });
    await loadPrivateData();
    activateTab("clientes", true);
    await openLeadDetail(opportunityId);
    if (result.has_email || result.has_phone) {
      setStatus("Detalles Apollo actualizados.", "ok");
    } else if (result.enriched) {
      setStatus("Apollo enriquecio el lead, pero no devolvio email ni telefono disponible.", "warning");
    } else {
      setStatus("Apollo no encontro detalles adicionales para este lead.", "warning");
    }
  } catch (error) {
    setStatus(error.message, "warning");
  } finally {
    if (button.isConnected) {
      button.disabled = false;
      button.textContent = "Obtener detalles";
    }
  }
}

async function login() {
  elements.loginButton.disabled = true;
  try {
    const payload = await api("/api/login", {
      method: "POST",
      body: JSON.stringify({
        username: elements.usernameInput.value.trim(),
        password: elements.passwordInput.value,
      }),
      headers: { Authorization: "" },
    });
    state.token = payload.token;
    state.currentUser = payload.user;
    sessionStorage.setItem("tecnotitan_crm_session", state.token);
    elements.passwordInput.value = "";
    elements.usernameInput.value = "";
    showApp();
    setStatus("Sesion iniciada.", "ok");
    await loadPrivateData();
  } catch (error) {
    setLoginStatus(error.message, "warning");
  } finally {
    elements.loginButton.disabled = false;
  }
}

function logout() {
  state.token = "";
  state.currentUser = null;
  state.users = [];
  state.searches = [];
  state.emailMessages = [];
  state.emailCampaigns = [];
  state.emailExclusions = [];
  state.emailWarmups = [];
  state.emailStatus = null;
  state.origamiPeopleSearches = [];
  if (state.origamiSearchPollTimer) {
    clearTimeout(state.origamiSearchPollTimer);
    state.origamiSearchPollTimer = null;
  }
  state.origamiJobSearches = [];
  if (state.origamiJobPollTimer) {
    clearTimeout(state.origamiJobPollTimer);
    state.origamiJobPollTimer = null;
  }
  state.emailMailbox = "compose";
  state.emailSearch = "";
  state.selectedEmailId = "";
  state.emailPage = 1;
  state.leadRows = [];
  state.leadPage = 1;
  state.assignmentWorkload = null;
  state.clientSearch = "";
  state.clientContactFilter = "all";
  state.clientCountryFilter = "all";
  state.clientCategoryFilter = "all";
  state.clientTagFilter = "all";
  state.clientPage = 1;
  state.kanbanPage = 1;
  sessionStorage.removeItem("tecnotitan_crm_session");
  elements.leads.innerHTML = `<p class="empty">Inicia sesion para cargar leads.</p>`;
  elements.clients.innerHTML = `<p class="empty">Aun no hay clientes procesados.</p>`;
  elements.kanban.innerHTML = `<p class="empty">Aun no hay clientes en el tablero.</p>`;
  elements.archive.innerHTML = `<p class="empty">No hay clientes archivados.</p>`;
  elements.metrics.innerHTML = "";
  elements.executiveSummary.innerHTML = "";
  elements.executiveWeekly.innerHTML = "";
  elements.apolloPerformance.innerHTML = "";
  elements.assignmentWorkload.innerHTML = "";
  elements.searchStatus.textContent = "";
  elements.userList.innerHTML = "";
  elements.searchHistory.innerHTML = `<p class="empty">Inicia sesion para cargar historial.</p>`;
  if (elements.emailList) elements.emailList.innerHTML = `<p class="empty">Inicia sesion para cargar correos.</p>`;
  if (elements.emailComposeStatus) elements.emailComposeStatus.textContent = "";
  if (elements.campaignList) elements.campaignList.innerHTML = `<p class="empty">No hay campanas cargadas.</p>`;
  if (elements.senderWarmupList) elements.senderWarmupList.innerHTML = `<p class="empty">No hay calentamiento configurado.</p>`;
  if (elements.exclusionList) elements.exclusionList.innerHTML = `<p class="empty">No hay emails excluidos.</p>`;
  if (elements.campaignStatus) elements.campaignStatus.textContent = "";
  if (elements.origamiPersonSearchResults) elements.origamiPersonSearchResults.innerHTML = `<p class="empty">Inicia sesion para buscar personas con Origami.</p>`;
  if (elements.origamiPersonSearchStatus) elements.origamiPersonSearchStatus.textContent = "";
  if (elements.origamiJobSearchResults) elements.origamiJobSearchResults.innerHTML = `<p class="empty">Inicia sesion para buscar empleos con Origami.</p>`;
  if (elements.origamiJobSearchStatus) elements.origamiJobSearchStatus.textContent = "";
  elements.searchResults.classList.add("hidden");
  renderSessionUser();
  showLogin();
  setLoginStatus("Sesion cerrada.", "ok");
}

localStorage.removeItem("tecnotitan_crm_username");
elements.usernameInput.value = "";
elements.loginButton.addEventListener("click", login);
elements.passwordInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") login();
});
elements.logoutButton.addEventListener("click", logout);
elements.closeDetail.addEventListener("click", closeLeadDetail);
elements.closeCompanyDetail.addEventListener("click", closeCompanyDetail);
elements.saveDetail.addEventListener("click", saveLeadDetail);
elements.saveScoreTags.addEventListener("click", saveScoreTags);
elements.addDetailNote.addEventListener("click", addLeadNote);
elements.analyzeOrigami?.addEventListener("click", () => runOrigamiAnalysis("analyze"));
elements.refreshOrigami?.addEventListener("click", () => runOrigamiAnalysis("refresh"));
elements.origamiPersonSearchButton?.addEventListener("click", createOrigamiPeopleSearch);
elements.origamiPersonName?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") createOrigamiPeopleSearch();
});
elements.origamiJobSearchButton?.addEventListener("click", createOrigamiJobSearch);
elements.origamiJobRole?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") createOrigamiJobSearch();
});
elements.addCompanyNote.addEventListener("click", addCompanyNote);
elements.createUser.addEventListener("click", createUser);
elements.applyLeadFilters.addEventListener("click", applyLeadFiltersFromFirstPage);
elements.clearLeadFilters.addEventListener("click", clearLeadFilters);
elements.messageTemplateFilter.addEventListener("change", () => {
  state.messageTemplateFilter = elements.messageTemplateFilter.value;
  renderMessageTemplates();
});
elements.emailMailboxButtons.forEach((button) => {
  button.addEventListener("click", () => {
    switchEmailMailbox(button.dataset.emailMailbox || "all");
  });
});
elements.emailSearch.addEventListener("input", () => {
  state.emailSearch = elements.emailSearch.value;
  state.selectedEmailId = "";
  state.emailPage = 1;
  renderEmails(state.emailMessages);
});
elements.emailOpportunity.addEventListener("change", fillEmailFromLead);
elements.emailSender.addEventListener("change", () => {
  if (elements.emailAttachDeck) elements.emailAttachDeck.checked = elements.emailSender.value === "investors";
});
elements.sendEmailButton.addEventListener("click", sendEmail);
elements.refreshEmailButton.addEventListener("click", refreshEmails);
elements.campaignType.addEventListener("change", () => applyCampaignDefaults(true));
elements.campaignSegment?.addEventListener("change", () => {
  applyCampaignSegmentDefaults();
  const template = defaultCampaignTemplate(elements.campaignType.value);
  elements.campaignSubject.value = template.subject;
  elements.campaignBody.value = template.body;
});
elements.campaignSectionButtons?.forEach((button) => {
  button.addEventListener("click", () => activateCampaignSection(button.dataset.campaignSection));
});
elements.campaignTemplate.addEventListener("change", applySelectedCampaignTemplate);
elements.createCampaignButton.addEventListener("click", createCampaign);
elements.addExclusionButton.addEventListener("click", addExclusion);
elements.clientSearch.addEventListener("input", () => {
  state.clientSearch = elements.clientSearch.value;
  state.clientPage = 1;
  refreshClientContactFilter();
});
elements.clientContactFilter.addEventListener("change", () => {
  state.clientContactFilter = elements.clientContactFilter.value;
  state.clientPage = 1;
  refreshClientContactFilter();
});
elements.clientCountryFilter.addEventListener("change", () => {
  state.clientCountryFilter = elements.clientCountryFilter.value;
  state.clientPage = 1;
  refreshClientContactFilter();
});
elements.clientCategoryFilter.addEventListener("change", () => {
  state.clientCategoryFilter = elements.clientCategoryFilter.value;
  state.clientPage = 1;
  refreshClientContactFilter();
});
elements.clientTagFilter.addEventListener("change", () => {
  state.clientTagFilter = elements.clientTagFilter.value;
  state.clientPage = 1;
  refreshClientContactFilter();
});
elements.leadSearch.addEventListener("keydown", (event) => {
  if (event.key === "Enter") applyLeadFiltersFromFirstPage();
});
elements.leadCountry.addEventListener("keydown", (event) => {
  if (event.key === "Enter") applyLeadFiltersFromFirstPage();
});
elements.getConsultingLeads.addEventListener("click", () => getLeads("consulting_client:latam"));
elements.getInvestorLeads.addEventListener("click", () => getLeads("investor:usa"));
elements.csvImportMode?.addEventListener("change", () => {
  if (elements.csvImportMode.value === "investor_csv") elements.csvImportType.value = "investor";
});
elements.importCsvButton.addEventListener("click", importCsv);
elements.tabs.forEach((tab) => {
  tab.addEventListener("click", (event) => {
    event.preventDefault();
    activateTab(tab.dataset.tab, true);
  });
});
window.addEventListener("hashchange", () => activateTab(tabFromHash()));

applyCampaignDefaults(true);
showLogin();
activeTab = tabFromHash();
loadPublicData()
  .then(loadPrivateData)
  .catch((error) => {
    showLogin();
    setLoginStatus(error.message, "warning");
  });
