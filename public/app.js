const state = {
  token: sessionStorage.getItem("tecnotitan_crm_session") || "",
  username: "",
  templates: [],
  users: [],
  searches: [],
  currentUser: null,
  selectedTemplate: "consulting_client:latam",
};

const elements = {
  appShell: document.querySelector("#app-shell"),
  loginScreen: document.querySelector("#login-screen"),
  loginStatus: document.querySelector("#login-status"),
  tabs: document.querySelectorAll("[data-tab]"),
  tabPanels: document.querySelectorAll("[data-tab-panel]"),
  status: document.querySelector("#system-status"),
  metrics: document.querySelector("#metrics"),
  followupsOverdue: document.querySelector("#followups-overdue"),
  followupsToday: document.querySelector("#followups-today"),
  followupsUpcoming: document.querySelector("#followups-upcoming"),
  templates: document.querySelector("#templates"),
  searchHistory: document.querySelector("#search-history"),
  searchResults: document.querySelector("#search-results"),
  leads: document.querySelector("#leads"),
  clients: document.querySelector("#clients"),
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
  detailModal: document.querySelector("#lead-detail-modal"),
  closeDetail: document.querySelector("#close-detail"),
  detailTitle: document.querySelector("#detail-title"),
  detailSubtitle: document.querySelector("#detail-subtitle"),
  detailContact: document.querySelector("#detail-contact"),
  detailCompany: document.querySelector("#detail-company"),
  detailScore: document.querySelector("#detail-score"),
  detailStatus: document.querySelector("#detail-status"),
  detailFollowupDate: document.querySelector("#detail-followup-date"),
  detailFollowupType: document.querySelector("#detail-followup-type"),
  saveDetail: document.querySelector("#save-detail"),
  detailNotesList: document.querySelector("#detail-notes-list"),
  detailPipelineEvents: document.querySelector("#detail-pipeline-events"),
  detailActivities: document.querySelector("#detail-activities"),
  detailNoteInput: document.querySelector("#detail-note-input"),
  addDetailNote: document.querySelector("#add-detail-note"),
};

let activeOpportunityId = "";
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

function websiteUrl(company) {
  const raw = company.website_url || company.domain || "";
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
            <small>${roleLabel(user.role)} · ${user.is_active ? "Activo" : "Inactivo"}</small>
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

function renderLeadCollections(leads) {
  const collections = splitLeadCollections(leads);
  renderLeads(collections.airportLeads);
  renderClients(collections.clients);
  renderArchive(collections.archived);
}

function renderLeads(leads) {
  if (!leads.length) {
    elements.leads.innerHTML = `<p class="empty">No hay leads nuevos para procesar con los filtros actuales.</p>`;
    return;
  }

  elements.leads.innerHTML = `
    <div class="lead-table-header">
      <span>Contacto</span>
      <span>Empresa</span>
      <span>Tipo</span>
      <span>Estado</span>
      <span>Score</span>
    </div>
  ${leads
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
                <option value="">Asignar a...</option>
                ${state.users
                  .filter((user) => user.is_active)
                  .map((user) => `<option value="${user.id}" ${lead.owner_user_id === user.id ? "selected" : ""}>${user.name}</option>`)
                  .join("")}
              </select>
              <button type="button" data-enrich="${lead.id}" ${isEnriched || isRequested ? "disabled" : ""}>${enrichLabel}</button>
            </div>
            <div class="lead-actions">
              <button class="secondary" type="button" data-open-detail="${lead.id}">Ver detalle</button>
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
    .join("")}`;

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
  elements.leads.querySelectorAll("[data-pipeline-status]").forEach((select) => {
    select.addEventListener("change", () => changePipelineStatus(select.dataset.pipelineStatus, select.value));
  });
}

function renderClients(clients) {
  if (!elements.clients) return;
  if (!clients.length) {
    elements.clients.innerHTML = `<p class="empty">No hay clientes procesados para los filtros actuales.</p>`;
    return;
  }

  const grouped = PIPELINE_STATUSES.map(([status, label]) => ({
    status,
    label,
    rows: clients.filter((client) => (client.pipeline_status || "nuevo") === status),
  }));

  elements.clients.innerHTML = `
    <div class="kanban-board">
      ${grouped
        .map(
          (group) => `
            <section class="kanban-column">
              <div class="kanban-column-title">
                <h3>${group.label}</h3>
                <span>${group.rows.length}</span>
              </div>
              <div class="kanban-cards">
                ${
                  group.rows.length
                    ? group.rows
                        .map((lead) => {
                          const contact = lead.contacts || {};
                          const company = lead.companies || {};
                          const phone = contact.mobile_phone || contact.phone || "";
                          const email = contact.email || "";
                          const linkedinUrl = contact.linkedin_url || "";
                          const webUrl = websiteUrl(company);
                          return `
                            <article class="client-card">
                              <div class="client-card-title">
                                <strong>${contact.full_name || "Contacto sin nombre"}</strong>
                                <span class="score-pill ${lead.score_label}">${lead.score} ${lead.score_label}</span>
                              </div>
                              <span>${contact.title || "Cargo no disponible"}</span>
                              <small>${company.name || "Empresa no disponible"}</small>
                              <small>${contact.email || contact.mobile_phone || contact.phone || "Detalles obtenidos"}</small>
                              <div class="client-card-meta">
                                <span>${lead.lead_type === "investor" ? "Inversionista" : "Consultoria"}</span>
                                <span>${regionLabel(lead.target_region)}</span>
                              </div>
                              <div class="client-card-actions">
                                <select data-pipeline-status="${lead.id}">
                                  ${pipelineStatusOptions(lead.pipeline_status)}
                                </select>
                                <button class="secondary" type="button" data-open-detail="${lead.id}">Ver detalle</button>
                                <button class="danger" type="button" data-archive-lead="${lead.id}">Archivar</button>
                              </div>
                              <div class="contact-actions">
                                <button class="secondary" type="button" data-copy-value="${attr(email)}" data-copy-label="Email" ${email ? "" : "disabled"}>Copiar email</button>
                                <button class="secondary" type="button" data-copy-value="${attr(phone)}" data-copy-label="Telefono" ${phone ? "" : "disabled"}>Copiar telefono</button>
                                <button class="secondary" type="button" data-open-url="${attr(linkedinUrl)}" data-open-label="LinkedIn" ${linkedinUrl ? "" : "disabled"}>LinkedIn</button>
                                <button class="secondary" type="button" data-open-url="${attr(webUrl)}" data-open-label="Web" ${webUrl ? "" : "disabled"}>Web</button>
                                <button type="button" data-register-activity="${lead.id}" data-activity-type="contact">Registrar contacto</button>
                              </div>
                              <div class="lead-actions admin-only">
                                <select data-assign="${lead.id}">
                                  <option value="">Asignar a...</option>
                                  ${state.users
                                    .filter((user) => user.is_active)
                                    .map((user) => `<option value="${user.id}" ${lead.owner_user_id === user.id ? "selected" : ""}>${user.name}</option>`)
                                    .join("")}
                                </select>
                              </div>
                            </article>
                          `;
                        })
                        .join("")
                    : `<p class="kanban-empty">Sin clientes.</p>`
                }
              </div>
            </section>
          `
        )
        .join("")}
    </div>
  `;

  applyRoleVisibility();
  elements.clients.querySelectorAll("[data-assign]").forEach((select) => {
    select.addEventListener("change", () => assignLead(select.dataset.assign, select.value));
  });
  elements.clients.querySelectorAll("[data-open-detail]").forEach((button) => {
    button.addEventListener("click", () => openLeadDetail(button.dataset.openDetail));
  });
  elements.clients.querySelectorAll("[data-pipeline-status]").forEach((select) => {
    select.addEventListener("change", () => changePipelineStatus(select.dataset.pipelineStatus, select.value));
  });
  elements.clients.querySelectorAll("[data-copy-value]").forEach((button) => {
    button.addEventListener("click", () => copyValue(button.dataset.copyValue, button.dataset.copyLabel || "Valor"));
  });
  elements.clients.querySelectorAll("[data-open-url]").forEach((button) => {
    button.addEventListener("click", () => openUrl(button.dataset.openUrl, button.dataset.openLabel || "Enlace"));
  });
  elements.clients.querySelectorAll("[data-register-activity]").forEach((button) => {
    button.addEventListener("click", () => registerActivity(button.dataset.registerActivity, button.dataset.activityType, button));
  });
  elements.clients.querySelectorAll("[data-archive-lead]").forEach((button) => {
    button.addEventListener("click", () => archiveLead(button.dataset.archiveLead));
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
            <button type="button" data-restore-lead="${lead.id}">Restaurar a Nuevo</button>
          </div>
        </article>
      `;
    })
    .join("");

  elements.archive.querySelectorAll("[data-open-detail]").forEach((button) => {
    button.addEventListener("click", () => openLeadDetail(button.dataset.openDetail));
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

  elements.detailTitle.textContent = contact.full_name || "Lead sin nombre";
  elements.detailSubtitle.textContent = `${opportunity.lead_type === "investor" ? "Inversionista" : "Consultoria"} · ${opportunity.target_region}`;
  elements.detailContact.innerHTML = [
    line("Cargo", contact.title),
    line("Senioridad", contact.seniority),
    line("Email", contact.email),
    line("Estado email", contact.email_status),
    line("Telefono", contact.mobile_phone || contact.phone),
    line("LinkedIn", contact.linkedin_url),
    line("Ubicacion", [contact.city, contact.state, contact.country].filter(Boolean).join(", ")),
    line("Enriquecimiento", contact.apollo_enrichment_status),
    line("Actualizado Apollo", contact.apollo_enriched_at ? new Date(contact.apollo_enriched_at).toLocaleString("es-CO") : ""),
  ].join("");
  elements.detailCompany.innerHTML = [
    line("Empresa", company.name),
    line("Dominio", company.domain),
    line("Industria", company.industry),
    line("Web", company.website_url),
    line("LinkedIn", company.linkedin_url),
    line("Pais", company.country),
    line("Empleados", company.employee_count),
  ].join("");
  elements.detailScore.innerHTML = `
    <div class="detail-score ${opportunity.score_label}">
      <strong>${opportunity.score}</strong>
      <span>${opportunity.score_label}</span>
    </div>
    <ul>${reasons.map((reason) => `<li>${reason.points} · ${reason.reason}</li>`).join("") || "<li>Sin razones registradas.</li>"}</ul>
  `;
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

async function loadPublicData() {
  const [status, templates] = await Promise.all([api("/api/status"), api("/api/templates")]);
  state.templates = templates.templates;
  renderTemplates();

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
    const [dashboard, leads, users, followups, searchHistory] = await Promise.all([
      api("/api/dashboard"),
      api(`/api/leads${leadFilterQuery()}`),
      api("/api/users").catch(() => ({ users: [] })),
      api("/api/followups"),
      api("/api/leads?mode=search_history").catch(() => ({ searches: [] })),
    ]);
    state.currentUser = dashboard.user;
    state.users = users.users || [];
    state.searches = searchHistory.searches || [];
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

function clearLeadFilters() {
  elements.leadSearch.value = "";
  elements.leadCountry.value = "";
  elements.leadTypeFilter.value = "";
  elements.leadRegionFilter.value = "";
  elements.leadScoreFilter.value = "";
  elements.leadStatusFilter.value = "";
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

async function assignLead(opportunityId, userId) {
  if (!userId) return;
  try {
    await api("/api/assign-lead", {
      method: "POST",
      body: JSON.stringify({ opportunity_id: opportunityId, owner_user_id: userId }),
    });
    await loadPrivateData();
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
  sessionStorage.removeItem("tecnotitan_crm_session");
  elements.leads.innerHTML = `<p class="empty">Inicia sesion para cargar leads.</p>`;
  elements.clients.innerHTML = `<p class="empty">Aun no hay clientes procesados.</p>`;
  elements.archive.innerHTML = `<p class="empty">No hay clientes archivados.</p>`;
  elements.metrics.innerHTML = "";
  elements.searchStatus.textContent = "";
  elements.userList.innerHTML = "";
  elements.searchHistory.innerHTML = `<p class="empty">Inicia sesion para cargar historial.</p>`;
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
elements.saveDetail.addEventListener("click", saveLeadDetail);
elements.addDetailNote.addEventListener("click", addLeadNote);
elements.createUser.addEventListener("click", createUser);
elements.applyLeadFilters.addEventListener("click", reloadLeadsOnly);
elements.clearLeadFilters.addEventListener("click", clearLeadFilters);
elements.leadSearch.addEventListener("keydown", (event) => {
  if (event.key === "Enter") reloadLeadsOnly();
});
elements.leadCountry.addEventListener("keydown", (event) => {
  if (event.key === "Enter") reloadLeadsOnly();
});
elements.getConsultingLeads.addEventListener("click", () => getLeads("consulting_client:latam"));
elements.getInvestorLeads.addEventListener("click", () => getLeads("investor:usa"));
elements.tabs.forEach((tab) => {
  tab.addEventListener("click", (event) => {
    event.preventDefault();
    activateTab(tab.dataset.tab, true);
  });
});
window.addEventListener("hashchange", () => activateTab(tabFromHash()));

showLogin();
activeTab = tabFromHash();
loadPublicData()
  .then(loadPrivateData)
  .catch((error) => {
    showLogin();
    setLoginStatus(error.message, "warning");
  });
