const state = {
  token: localStorage.getItem("tecnotitan_crm_token") || "",
  templates: [],
  selectedTemplate: "consulting_client:latam",
};

const elements = {
  status: document.querySelector("#system-status"),
  metrics: document.querySelector("#metrics"),
  templates: document.querySelector("#templates"),
  leads: document.querySelector("#leads"),
  tokenInput: document.querySelector("#token-input"),
  saveToken: document.querySelector("#save-token"),
  runSearch: document.querySelector("#run-search"),
  searchStatus: document.querySelector("#search-status"),
};

function apiHeaders() {
  return {
    "Content-Type": "application/json",
    "X-CRM-Token": state.token,
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

function renderMetrics(data) {
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
    elements.leads.innerHTML = `<p class="empty">Todavia no hay leads guardados en Supabase.</p>`;
    return;
  }

  elements.leads.innerHTML = leads
    .map((lead) => {
      const contact = lead.contacts || {};
      const company = lead.companies || {};
      return `
        <article class="lead-row">
          <div>
            <strong>${contact.full_name || "Contacto sin nombre"}</strong>
            <span>${contact.title || "Cargo no disponible"}</span>
            <small>${company.name || "Empresa no disponible"} · ${contact.country || company.country || "Sin pais"}</small>
          </div>
          <div class="score ${lead.score_label}">
            <strong>${lead.score}</strong>
            <span>${lead.score_label}</span>
          </div>
        </article>
      `;
    })
    .join("");
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

  setStatus("API web lista. Ingresa el token interno para ver datos.", "ok");
}

async function loadPrivateData() {
  if (!state.token) return;

  try {
    const [dashboard, leads] = await Promise.all([api("/api/dashboard"), api("/api/leads")]);
    renderMetrics(dashboard);
    renderLeads(leads.leads || []);
    setStatus("Conectado a Supabase y Apollo desde Vercel.", "ok");
  } catch (error) {
    setStatus(error.message, "warning");
  }
}

async function runApolloSearch() {
  if (!state.token) {
    setStatus("Guarda primero el token interno.", "warning");
    return;
  }

  elements.runSearch.disabled = true;
  elements.searchStatus.textContent = "Buscando en Apollo y guardando en Supabase...";

  try {
    const result = await api("/api/apollo-search", {
      method: "POST",
      body: JSON.stringify({
        template_key: state.selectedTemplate,
        per_page: 10,
      }),
    });
    elements.searchStatus.textContent = `Listo: ${result.saved} leads guardados.`;
    await loadPrivateData();
  } catch (error) {
    elements.searchStatus.textContent = error.message;
  } finally {
    elements.runSearch.disabled = false;
  }
}

elements.tokenInput.value = state.token;
elements.saveToken.addEventListener("click", async () => {
  state.token = elements.tokenInput.value.trim();
  localStorage.setItem("tecnotitan_crm_token", state.token);
  await loadPrivateData();
});
elements.runSearch.addEventListener("click", runApolloSearch);

loadPublicData().then(loadPrivateData).catch((error) => setStatus(error.message, "warning"));
