const state = {
  templates: [],
  leads: [],
  filter: "all",
};

const els = {
  dbStatus: document.querySelector("#dbStatus"),
  metricTotal: document.querySelector("#metricTotal"),
  metricConsulting: document.querySelector("#metricConsulting"),
  metricInvestors: document.querySelector("#metricInvestors"),
  metricPriority: document.querySelector("#metricPriority"),
  templateSelect: document.querySelector("#templateSelect"),
  locationInput: document.querySelector("#locationInput"),
  keywordsInput: document.querySelector("#keywordsInput"),
  perPageInput: document.querySelector("#perPageInput"),
  searchForm: document.querySelector("#searchForm"),
  runSearchButton: document.querySelector("#runSearchButton"),
  searchResult: document.querySelector("#searchResult"),
  leadsTable: document.querySelector("#leadsTable"),
  refreshButton: document.querySelector("#refreshButton"),
  filterButtons: document.querySelectorAll("[data-filter]"),
};

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Error de API");
  }
  return payload;
}

function formatType(value) {
  return value === "investor" ? "Inversionista" : "Consultoria";
}

function formatStatus(value) {
  return String(value || "").replaceAll("_", " ");
}

function setStatus(ok, text) {
  els.dbStatus.textContent = text;
  els.dbStatus.classList.toggle("ok", ok);
  els.dbStatus.classList.toggle("error", !ok);
}

async function loadDashboard() {
  const summary = await api("/api/dashboard");
  els.metricTotal.textContent = summary.total_opportunities || 0;
  els.metricConsulting.textContent = summary.consulting_opportunities || 0;
  els.metricInvestors.textContent = summary.investor_opportunities || 0;
  els.metricPriority.textContent = (summary.hot_leads || 0) + (summary.warm_leads || 0);
}

async function loadTemplates() {
  const data = await api("/api/search-templates");
  state.templates = data.templates || [];
  els.templateSelect.innerHTML = state.templates
    .map((template) => `<option value="${template.key}">${template.name}</option>`)
    .join("");
}

async function loadLeads() {
  const data = await api("/api/leads");
  state.leads = data.leads || [];
  renderLeads();
}

function renderLeads() {
  const leads = state.filter === "all"
    ? state.leads
    : state.leads.filter((lead) => lead.lead_type === state.filter);

  if (!leads.length) {
    els.leadsTable.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">No hay leads para este filtro.</td>
      </tr>
    `;
    return;
  }

  els.leadsTable.innerHTML = leads.map((lead) => `
    <tr>
      <td>
        <div class="lead-name">${lead.full_name || "Sin nombre"}</div>
        <div class="lead-title">${lead.title || "Sin cargo"}</div>
      </td>
      <td>${lead.company_name || "Sin empresa"}</td>
      <td>
        <span class="type-badge ${lead.lead_type === "investor" ? "investor" : ""}">
          ${formatType(lead.lead_type)}
        </span>
      </td>
      <td>${formatStatus(lead.pipeline_status)}</td>
      <td>
        <span class="score-pill ${lead.score_label || ""}">
          ${lead.score || 0} · ${lead.score_label || "unqualified"}
        </span>
      </td>
    </tr>
  `).join("");
}

function selectedTemplate() {
  return state.templates.find((template) => template.key === els.templateSelect.value);
}

function buildSearchPayload() {
  const template = selectedTemplate();
  const filters = {};
  const location = els.locationInput.value.trim();
  const keywords = els.keywordsInput.value.trim();

  if (location && template.editable_filters.includes("person_locations")) {
    filters.person_locations = location.split(",").map((item) => item.trim()).filter(Boolean);
  }

  if (keywords && template.editable_filters.includes("q_keywords")) {
    filters.q_keywords = keywords;
  }

  return {
    template_key: template.key,
    page: 1,
    per_page: Number(els.perPageInput.value || template.default_per_page || 5),
    name: `CRM ${template.name}`,
    filters,
  };
}

async function runSearch(event) {
  event.preventDefault();
  els.runSearchButton.disabled = true;
  els.searchResult.textContent = "Buscando en Apollo...";

  try {
    const payload = buildSearchPayload();
    const result = await api("/api/apollo/search", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    els.searchResult.innerHTML = `
      <strong>${result.saved}</strong> guardados de
      <strong>${result.returned}</strong> recibidos.
      Total Apollo aproximado: <strong>${result.total_entries || 0}</strong>.
    `;
    await refreshAll();
  } catch (error) {
    els.searchResult.textContent = error.message;
  } finally {
    els.runSearchButton.disabled = false;
  }
}

async function refreshAll() {
  await Promise.all([loadDashboard(), loadLeads()]);
}

async function boot() {
  try {
    const db = await api("/api/db/health");
    setStatus(true, `${db.database}`);
    await loadTemplates();
    await refreshAll();
  } catch (error) {
    setStatus(false, "Sin DB");
    els.searchResult.textContent = error.message;
  }
}

els.searchForm.addEventListener("submit", runSearch);
els.refreshButton.addEventListener("click", refreshAll);
els.filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    els.filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.filter = button.dataset.filter;
    renderLeads();
  });
});

boot();
