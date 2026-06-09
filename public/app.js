const state = {
  token: sessionStorage.getItem("tecnotitan_crm_session") || "",
  username: localStorage.getItem("tecnotitan_crm_username") || "david",
  templates: [],
  users: [],
  currentUser: null,
  selectedTemplate: "consulting_client:latam",
};

const elements = {
  appShell: document.querySelector("#app-shell"),
  loginScreen: document.querySelector("#login-screen"),
  loginStatus: document.querySelector("#login-status"),
  status: document.querySelector("#system-status"),
  metrics: document.querySelector("#metrics"),
  templates: document.querySelector("#templates"),
  leads: document.querySelector("#leads"),
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
  detailNoteInput: document.querySelector("#detail-note-input"),
  addDetailNote: document.querySelector("#add-detail-note"),
};

let activeOpportunityId = "";

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
    ["Oportunidades", data.opportunities ?? "-"],
    ["Busquedas", data.searches ?? "-"],
    ["Hot", data.hot ?? "-"],
    ["Warm", data.warm ?? "-"],
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

function applyRoleVisibility() {
  const isAdmin = state.currentUser?.role === "admin";
  document.querySelectorAll(".admin-only").forEach((node) => {
    node.classList.toggle("hidden", !isAdmin);
  });
  renderSessionUser();
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

function renderLeads(leads) {
  if (!leads.length) {
    elements.leads.innerHTML = `<p class="empty">No hay leads para los filtros actuales.</p>`;
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
              <button type="button" data-enrich="${lead.id}">Obtener detalles</button>
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
            <strong>${lead.pipeline_status}</strong>
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
    button.addEventListener("click", () => enrichLead(button.dataset.enrich, button));
  });
  elements.leads.querySelectorAll("[data-open-detail]").forEach((button) => {
    button.addEventListener("click", () => openLeadDetail(button.dataset.openDetail));
  });
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
    line("Email", contact.email),
    line("Telefono", contact.mobile_phone || contact.phone),
    line("LinkedIn", contact.linkedin_url),
    line("Ubicacion", [contact.city, contact.country].filter(Boolean).join(", ")),
    line("Enriquecimiento", contact.apollo_enrichment_status),
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
    setStatus("Detalle actualizado.", "ok");
  } catch (error) {
    setStatus(error.message, "warning");
  }
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
  } catch (error) {
    setStatus(error.message, "warning");
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
    const [dashboard, leads, users] = await Promise.all([
      api("/api/dashboard"),
      api(`/api/leads${leadFilterQuery()}`),
      api("/api/users").catch(() => ({ users: [] })),
    ]);
    state.currentUser = dashboard.user;
    state.users = users.users || [];
    renderMetrics(dashboard);
    renderUsers();
    renderLeads(leads.leads || []);
    applyRoleVisibility();
    setStatus("Conectado a Supabase y Apollo desde Vercel.", "ok");
  } catch (error) {
    state.token = "";
    sessionStorage.removeItem("tecnotitan_crm_session");
    showLogin();
    setLoginStatus(error.message, "warning");
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
    renderLeads(await currentLeads());
    setStatus("Usuario actualizado.", "ok");
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
    renderLeads(await currentLeads());
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
    await api("/api/apollo-enrich", {
      method: "POST",
      body: JSON.stringify({ opportunity_id: opportunityId }),
    });
    await loadPrivateData();
  } catch (error) {
    setStatus(error.message, "warning");
  } finally {
    button.disabled = false;
    button.textContent = "Obtener detalles";
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
    state.username = payload.username;
    state.currentUser = payload.user;
    sessionStorage.setItem("tecnotitan_crm_session", state.token);
    localStorage.setItem("tecnotitan_crm_username", state.username);
    elements.passwordInput.value = "";
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
  sessionStorage.removeItem("tecnotitan_crm_session");
  elements.leads.innerHTML = `<p class="empty">Inicia sesion para cargar leads.</p>`;
  elements.metrics.innerHTML = "";
  elements.searchStatus.textContent = "";
  elements.userList.innerHTML = "";
  renderSessionUser();
  showLogin();
  setLoginStatus("Sesion cerrada.", "ok");
}

elements.usernameInput.value = state.username;
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

showLogin();
loadPublicData()
  .then(loadPrivateData)
  .catch((error) => {
    showLogin();
    setLoginStatus(error.message, "warning");
  });
