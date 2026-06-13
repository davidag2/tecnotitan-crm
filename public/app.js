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
  emailStatus: null,
  emailMailbox: "all",
  emailSearch: "",
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
  assignmentWorkload: document.querySelector("#assignment-workload"),
  messageTemplateFilter: document.querySelector("#message-template-filter"),
  messageTemplateCount: document.querySelector("#message-template-count"),
  messageTemplates: document.querySelector("#message-templates"),
  emailStatus: document.querySelector("#email-status"),
  emailList: document.querySelector("#email-list"),
  emailSearch: document.querySelector("#email-search"),
  emailOpportunity: document.querySelector("#email-opportunity"),
  emailSender: document.querySelector("#email-sender"),
  emailTo: document.querySelector("#email-to"),
  emailSubject: document.querySelector("#email-subject"),
  emailBody: document.querySelector("#email-body"),
  sendEmailButton: document.querySelector("#send-email-button"),
  emailComposeStatus: document.querySelector("#email-compose-status"),
  emailMailboxButtons: document.querySelectorAll("[data-email-mailbox]"),
  campaignName: document.querySelector("#campaign-name"),
  campaignType: document.querySelector("#campaign-type"),
  campaignSender: document.querySelector("#campaign-sender"),
  campaignTemplate: document.querySelector("#campaign-template"),
  campaignDailyLimit: document.querySelector("#campaign-daily-limit"),
  campaignBatchSize: document.querySelector("#campaign-batch-size"),
  campaignMinDelay: document.querySelector("#campaign-min-delay"),
  campaignMaxDelay: document.querySelector("#campaign-max-delay"),
  campaignSubject: document.querySelector("#campaign-subject"),
  campaignBody: document.querySelector("#campaign-body"),
  createCampaignButton: document.querySelector("#create-campaign-button"),
  campaignStatus: document.querySelector("#campaign-status"),
  campaignList: document.querySelector("#campaign-list"),
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
  elements.emailStatus.innerHTML = `
    <span data-tone="ok">Resend conectado</span>
    <span>Remitentes: ${readySenders || "pendientes"}</span>
    <span>Webhook: ${status.webhookTokenConfigured ? "protegido" : "pendiente"}</span>
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
  if (!elements.emailSubject.value.trim()) {
    elements.emailSubject.value =
      lead.lead_type === "investor" ? `Tecnotitan - ${company.name || "oportunidad"}` : `Idea rapida para ${company.name || "tu equipo"}`;
  }
}

function renderEmails(messages = state.emailMessages) {
  if (!elements.emailList) return;
  renderEmailStatus(state.emailStatus);
  renderEmailOpportunityOptions();
  const emailShell = elements.emailList.closest(".email-shell");
  if (emailShell) emailShell.classList.toggle("sent-only", state.emailMailbox === "sent");
  elements.emailMailboxButtons.forEach((button) => button.classList.toggle("active", button.dataset.emailMailbox === state.emailMailbox));
  const query = (state.emailSearch || "").trim().toLowerCase();
  const visible = (messages || []).filter((message) => {
    const mailboxOk =
      (state.emailMailbox === "all" && message.direction !== "outbound") ||
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
  elements.emailList.innerHTML = visible
    .map((message) => {
      const contact = message.contact || {};
      const company = message.company || {};
      const date = new Date(message.sent_at || message.received_at || message.created_at).toLocaleString("es-CO");
      return `
        <article class="email-row">
          <div>
            <strong>${message.direction === "inbound" ? "Recibido" : "Enviado"} | ${message.subject || "(sin asunto)"}</strong>
            <span>${message.direction === "inbound" ? message.from_email : (message.to_emails || []).join(", ")}</span>
            <small>${contact.full_name || "Contacto no vinculado"} | ${company.name || "Empresa no vinculada"} | ${date}</small>
          </div>
          <p>${message.snippet || "Sin vista previa."}</p>
        </article>
      `;
    })
    .join("");
}

function campaignTypeLabel(type) {
  return type === "investor" ? "Inversionistas" : "Consultoria LATAM";
}

function defaultCampaignTemplate(type) {
  const templateId = type === "investor" ? "inversionistas-email-1" : "consultoria-latam-email-1";
  const template = MESSAGE_TEMPLATES.find((item) => item.id === templateId);
  return { subject: template?.subject || "", body: template?.body || "" };
}

function applyCampaignDefaults(force = false) {
  if (!elements.campaignType) return;
  renderCampaignTemplateOptions();
  const template = defaultCampaignTemplate(elements.campaignType.value);
  if (elements.campaignType.value === "investor") elements.campaignSender.value = "investors";
  if (elements.campaignType.value !== "investor") elements.campaignSender.value = "consulting";
  if (elements.campaignTemplate && force) {
    elements.campaignTemplate.value = elements.campaignType.value === "investor" ? "inversionistas-email-1" : "consultoria-latam-email-1";
  }
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
  }
  if (template.category === "consultoria") {
    elements.campaignType.value = "consulting_client";
    elements.campaignSender.value = "consulting";
  }
}

function renderCampaigns(campaigns = state.emailCampaigns) {
  if (!elements.campaignList) return;
  if (!campaigns?.length) {
    elements.campaignList.innerHTML = `<p class="empty">No hay campanas automaticas todavia.</p>`;
    return;
  }
  elements.campaignList.innerHTML = campaigns
    .map((campaign) => {
      const counts = campaign.counts || {};
      const remaining = Math.max(0, (campaign.daily_limit || 100) - (counts.sent_today || 0));
      const nextSend = counts.next_scheduled_at ? new Date(counts.next_scheduled_at).toLocaleString("es-CO") : "Sin pendientes";
      return `
        <article class="campaign-card">
          <header>
            <div>
              <strong>${campaign.name}</strong>
              <small>${campaignTypeLabel(campaign.campaign_type)} | ${campaign.sender_key === "investors" ? "Inversionistas" : "Consultoria"} | ${campaign.status}</small>
            </div>
            <button type="button" data-process-campaign="${campaign.id}" ${campaign.status !== "active" || !(counts.due || counts.followups_due) ? "disabled" : ""}>Procesar listos</button>
          </header>
          <div class="campaign-stats">
            <span><b>${counts.total || 0}</b>Total</span>
            <span><b>${counts.queued || 0}</b>En cola</span>
            <span><b>${counts.due || 0}</b>Listos ahora</span>
            <span><b>${counts.sent || 0}</b>Enviados</span>
            <span><b>${counts.followups_sent || 0}</b>Follow-ups</span>
            <span><b>${counts.replied || 0}</b>Respuestas</span>
            <span><b>${counts.followups_due || 0}</b>Seguimientos listos</span>
            <span><b>${counts.reputation_blocked || 0}</b>Bloqueados</span>
            <span><b>${counts.sent_today || 0}</b>Hoy</span>
            <span><b>${remaining}</b>Restantes hoy</span>
          </div>
          <small>Limite diario: ${campaign.daily_limit || 100} | Maximo por ejecucion: ${campaign.batch_size || 1} | Ritmo: ${campaign.min_delay_minutes || 6}-${campaign.max_delay_minutes || 12} min | Follow-ups: 3, 7 y 14 dias | Proximo envio: ${nextSend}</small>
        </article>
      `;
    })
    .join("");
  elements.campaignList.querySelectorAll("[data-process-campaign]").forEach((button) => {
    button.addEventListener("click", () => processCampaign(button.dataset.processCampaign, button));
  });
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
    const [dashboard, leads, users, followups, searchHistory, emails, campaigns, exclusions] = await Promise.all([
      api("/api/dashboard"),
      api(`/api/leads${leadFilterQuery()}`),
      api("/api/users").catch(() => ({ users: [] })),
      api("/api/followups"),
      api("/api/leads?mode=search_history").catch(() => ({ searches: [] })),
      api("/api/emails").catch(() => ({ status: null, messages: [] })),
      api("/api/emails?mode=campaigns").catch(() => ({ campaigns: [] })),
      api("/api/emails?mode=exclusions").catch(() => ({ exclusions: [] })),
    ]);
    state.currentUser = dashboard.user;
    state.users = users.users || [];
    state.searches = searchHistory.searches || [];
    state.emailStatus = emails.status || null;
    state.emailMessages = emails.messages || [];
    state.emailCampaigns = campaigns.campaigns || [];
    state.emailExclusions = exclusions.exclusions || [];
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
    renderExclusions(state.emailExclusions);
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
    renderEmails(state.emailMessages);
  } catch (error) {
    if (elements.emailList) elements.emailList.innerHTML = `<p class="empty">${error.message}</p>`;
  }
}

async function reloadCampaignsOnly() {
  try {
    const [data, exclusions] = await Promise.all([
      api("/api/emails?mode=campaigns"),
      api("/api/emails?mode=exclusions").catch(() => ({ exclusions: [] })),
    ]);
    state.emailCampaigns = data.campaigns || [];
    state.emailExclusions = exclusions.exclusions || [];
    renderCampaigns(state.emailCampaigns);
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
        name: file.name,
        lead_type: elements.csvImportType.value,
        target_region: elements.csvImportRegion.value,
        rows,
      }),
    });
    elements.csvImportStatus.textContent = `Listo: ${result.saved} importados, ${result.skipped} omitidos.`;
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
      }),
    });
    elements.emailBody.value = "";
    elements.emailComposeStatus.textContent = "Correo enviado.";
    state.emailMailbox = "sent";
    await reloadEmailsOnly();
    renderFollowups(await api("/api/followups"));
  } catch (error) {
    elements.emailComposeStatus.textContent = error.message;
  } finally {
    elements.sendEmailButton.disabled = false;
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
        sender_key: elements.campaignSender.value,
        daily_limit: elements.campaignDailyLimit.value,
        batch_size: elements.campaignBatchSize.value,
        min_delay_minutes: elements.campaignMinDelay.value,
        max_delay_minutes: elements.campaignMaxDelay.value,
        subject_template: elements.campaignSubject.value,
        body_template: elements.campaignBody.value,
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
  state.emailStatus = null;
  state.emailMailbox = "all";
  state.emailSearch = "";
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
  elements.assignmentWorkload.innerHTML = "";
  elements.searchStatus.textContent = "";
  elements.userList.innerHTML = "";
  elements.searchHistory.innerHTML = `<p class="empty">Inicia sesion para cargar historial.</p>`;
  if (elements.emailList) elements.emailList.innerHTML = `<p class="empty">Inicia sesion para cargar correos.</p>`;
  if (elements.emailComposeStatus) elements.emailComposeStatus.textContent = "";
  if (elements.campaignList) elements.campaignList.innerHTML = `<p class="empty">No hay campanas cargadas.</p>`;
  if (elements.exclusionList) elements.exclusionList.innerHTML = `<p class="empty">No hay emails excluidos.</p>`;
  if (elements.campaignStatus) elements.campaignStatus.textContent = "";
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
    state.emailMailbox = button.dataset.emailMailbox || "all";
    renderEmails(state.emailMessages);
  });
});
elements.emailSearch.addEventListener("input", () => {
  state.emailSearch = elements.emailSearch.value;
  renderEmails(state.emailMessages);
});
elements.emailOpportunity.addEventListener("change", fillEmailFromLead);
elements.sendEmailButton.addEventListener("click", sendEmail);
elements.campaignType.addEventListener("change", () => applyCampaignDefaults(true));
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
