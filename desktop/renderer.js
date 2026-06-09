const state = { leads: [], filter: "all" };

const els = {
  totalMetric: document.querySelector("#totalMetric"),
  consultingMetric: document.querySelector("#consultingMetric"),
  investorMetric: document.querySelector("#investorMetric"),
  priorityMetric: document.querySelector("#priorityMetric"),
  templateSelect: document.querySelector("#templateSelect"),
  locationInput: document.querySelector("#locationInput"),
  keywordsInput: document.querySelector("#keywordsInput"),
  perPageInput: document.querySelector("#perPageInput"),
  searchForm: document.querySelector("#searchForm"),
  searchBtn: document.querySelector("#searchBtn"),
  message: document.querySelector("#message"),
  leadRows: document.querySelector("#leadRows"),
  refreshBtn: document.querySelector("#refreshBtn"),
  navButtons: document.querySelectorAll(".nav"),
};

function typeLabel(type) {
  return type === "investor" ? "Inversionista" : "Consultoria";
}

function renderLeads() {
  const rows = state.filter === "all" ? state.leads : state.leads.filter((lead) => lead.lead_type === state.filter);

  if (!rows.length) {
    els.leadRows.innerHTML = `<tr><td colspan="5">No hay leads para este filtro.</td></tr>`;
    return;
  }

  els.leadRows.innerHTML = rows.map((lead) => `
    <tr>
      <td class="contact"><strong>${lead.full_name || "Sin nombre"}</strong><span>${lead.title || "Sin cargo"}</span></td>
      <td>${lead.company_name || "Sin empresa"}</td>
      <td><span class="badge ${lead.lead_type === "investor" ? "investor" : ""}">${typeLabel(lead.lead_type)}</span></td>
      <td>${String(lead.pipeline_status || "").replaceAll("_", " ")}</td>
      <td class="score">${lead.score || 0} · ${lead.score_label || "unqualified"}</td>
    </tr>
  `).join("");
}

async function refresh() {
  const [dashboard, templates, leads] = await Promise.all([
    window.tecnotitan.dashboard(),
    window.tecnotitan.templates(),
    window.tecnotitan.leads(),
  ]);

  els.totalMetric.textContent = dashboard.total_opportunities || 0;
  els.consultingMetric.textContent = dashboard.consulting_opportunities || 0;
  els.investorMetric.textContent = dashboard.investor_opportunities || 0;
  els.priorityMetric.textContent = dashboard.priority_leads || 0;

  if (!els.templateSelect.options.length) {
    els.templateSelect.innerHTML = templates.map((template) => `<option value="${template.key}">${template.name}</option>`).join("");
  }

  state.leads = leads || [];
  renderLeads();
}

els.searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  els.searchBtn.disabled = true;
  els.message.textContent = "Buscando en Apollo...";

  try {
    const result = await window.tecnotitan.apolloSearch({
      template_key: els.templateSelect.value,
      location: els.locationInput.value.trim(),
      keywords: els.keywordsInput.value.trim(),
      per_page: els.perPageInput.value,
    });

    els.message.textContent = `${result.saved} guardados de ${result.returned} recibidos. Total aproximado: ${result.total_entries}.`;
    await refresh();
  } catch (error) {
    els.message.textContent = error.message;
  } finally {
    els.searchBtn.disabled = false;
  }
});

els.refreshBtn.addEventListener("click", refresh);
els.navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    els.navButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.filter = button.dataset.filter;
    renderLeads();
  });
});

refresh().catch((error) => {
  els.message.textContent = error.message;
});
