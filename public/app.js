const state = {
  token: sessionStorage.getItem("tecnotitan_crm_session") || "",
  username: localStorage.getItem("tecnotitan_crm_username") || "david",
  templates: [],
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
  usernameInput: document.querySelector("#username-input"),
  passwordInput: document.querySelector("#password-input"),
  loginButton: document.querySelector("#login-button"),
  logoutButton: document.querySelector("#logout-button"),
  runSearch: document.querySelector("#run-search"),
  searchStatus: document.querySelector("#search-status"),
};

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

  setStatus("API web lista. Inicia sesion para ver y buscar leads.", "ok");
}

async function loadPrivateData() {
  if (!state.token) {
    showLogin();
    return;
  }

  try {
    showApp();
    const [dashboard, leads] = await Promise.all([api("/api/dashboard"), api("/api/leads")]);
    renderMetrics(dashboard);
    renderLeads(leads.leads || []);
    setStatus("Conectado a Supabase y Apollo desde Vercel.", "ok");
  } catch (error) {
    state.token = "";
    sessionStorage.removeItem("tecnotitan_crm_session");
    showLogin();
    setLoginStatus(error.message, "warning");
  }
}

async function runApolloSearch() {
  if (!state.token) {
    setStatus("Inicia sesion primero.", "warning");
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
  sessionStorage.removeItem("tecnotitan_crm_session");
  elements.leads.innerHTML = `<p class="empty">Inicia sesion para cargar leads.</p>`;
  elements.metrics.innerHTML = "";
  showLogin();
  setLoginStatus("Sesion cerrada.", "ok");
}

elements.usernameInput.value = state.username;
elements.loginButton.addEventListener("click", login);
elements.passwordInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") login();
});
elements.logoutButton.addEventListener("click", logout);
elements.runSearch.addEventListener("click", runApolloSearch);

showLogin();
loadPublicData()
  .then(loadPrivateData)
  .catch((error) => {
    showLogin();
    setLoginStatus(error.message, "warning");
  });
