const { requireUser } = require("./_auth");
const { createAgentRun, getRun, origamiConfigured } = require("./_origami");
const { insertRow, supabaseFetch, updateRows } = require("./_supabase");

function getCompanyId(req) {
  const url = new URL(req.url, "https://tecnotitan.local");
  return String(url.searchParams.get("company_id") || "").trim();
}

async function loadCompany(companyId, user) {
  const { payload } = await supabaseFetch(
    `/companies?select=id,name,domain,website_url,linkedin_url,industry,country,city,state,employee_count,employee_range,annual_revenue,raw_payload&deleted_at=is.null&id=eq.${encodeURIComponent(companyId)}&limit=1`
  );
  const company = payload?.[0] || null;
  if (!company) return null;

  const filters = [
    "select=id,owner_user_id,lead_type,target_region,contacts(full_name,title,email,linkedin_url,country,city)",
    `company_id=eq.${encodeURIComponent(companyId)}`,
    "deleted_at=is.null",
    "limit=20",
  ];
  if (user.role !== "admin") filters.splice(2, 0, `owner_user_id=eq.${encodeURIComponent(user.db_user_id || "")}`);
  const { payload: opportunities } = await supabaseFetch(`/opportunities?${filters.join("&")}`);
  if (user.role !== "admin" && !(opportunities || []).length) return null;
  return { company, opportunities: opportunities || [] };
}

function compactObject(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ""));
}

function companyPrompt(company, opportunities) {
  const raw = company.raw_payload || {};
  return [
    "You are an account intelligence analyst for Tecnotitan.",
    "Analyze the full company, fund, or firm, not only one person.",
    "Use public information and the supplied CRM data. Do not invent facts; mark uncertainty clearly.",
    "",
    "Tecnotitan context:",
    "- Colombian applied technology company.",
    "- Builds practical AI implementation, CRM, sales automation, integrations, internal software and data workflows.",
    "- Consulting target: companies with manual processes, scattered data, CRM gaps, growth pressure or automation needs.",
    "- Investor target: funds/firms aligned with AI, SaaS, B2B, LATAM, emerging markets, seed or pre-seed.",
    "",
    "Company data:",
    JSON.stringify(
      compactObject({
        name: company.name,
        domain: company.domain,
        website: company.website_url,
        linkedin: company.linkedin_url,
        industry: company.industry,
        country: company.country,
        city: company.city,
        employee_count: company.employee_count,
        employee_range: company.employee_range,
        annual_revenue: company.annual_revenue,
        raw_description: raw.short_description || raw.description || raw.organization?.short_description,
        associated_opportunities: opportunities.map((row) => ({
          lead_type: row.lead_type,
          target_region: row.target_region,
          contact: row.contacts?.full_name,
          title: row.contacts?.title,
          country: row.contacts?.country,
        })),
      }),
      null,
      2
    ),
    "",
    "Return exactly one JSON object between these markers:",
    "BEGIN_TECNOTITAN_COMPANY_JSON",
    "{",
    '  "summary": "2-3 sentence company/fund summary",',
    '  "business_model": "what the company or firm does",',
    '  "market_context": "market, geography, stage or segment context",',
    '  "why_it_matters": "why this account matters to Tecnotitan",',
    '  "recommended_approach": "best account-level approach",',
    '  "buying_triggers": ["trigger 1", "trigger 2"],',
    '  "operational_pains": ["manual processes, CRM, scattered data, automation or growth pain if found"],',
    '  "investment_fit": ["AI, SaaS, LATAM, B2B, emerging markets, seed or pre-seed fit if relevant"],',
    '  "signals": ["specific company-level signal 1", "specific company-level signal 2"],',
    '  "risks": ["risk or caveat 1"]',
    "}",
    "END_TECNOTITAN_COMPANY_JSON",
  ].join("\n");
}

function extractResultText(run) {
  const response = run?.response || run?.result || run?.output || run;
  if (typeof response === "string") return response;
  if (response?.text) return String(response.text);
  if (response?.message) return String(response.message);
  if (response?.content) return typeof response.content === "string" ? response.content : JSON.stringify(response.content);
  return JSON.stringify(response || {});
}

function extractCompanyJson(text) {
  const match = String(text || "").match(/BEGIN_TECNOTITAN_COMPANY_JSON\s*([\s\S]*?)\s*END_TECNOTITAN_COMPANY_JSON/i);
  const raw = match?.[1] || "";
  if (!raw.trim()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function normalizedStatus(status) {
  const value = String(status || "").toLowerCase();
  if (["running", "queued", "pending"].includes(value)) return "running";
  if (["failed", "error", "cancelled", "canceled"].includes(value)) return "failed";
  if (["completed", "complete", "done", "succeeded", "success", "finished"].includes(value)) return "completed";
  return value || "running";
}

function normalizedProfile(resultText) {
  const parsed = extractCompanyJson(resultText) || {};
  return {
    raw_response: resultText,
    summary: parsed.summary || "",
    business_model: parsed.business_model || "",
    market_context: parsed.market_context || "",
    why_it_matters: parsed.why_it_matters || "",
    recommended_approach: parsed.recommended_approach || "",
    buying_triggers: Array.isArray(parsed.buying_triggers) ? parsed.buying_triggers : [],
    operational_pains: Array.isArray(parsed.operational_pains) ? parsed.operational_pains : [],
    investment_fit: Array.isArray(parsed.investment_fit) ? parsed.investment_fit : [],
    signals: Array.isArray(parsed.signals) ? parsed.signals : [],
    risks: Array.isArray(parsed.risks) ? parsed.risks : [],
  };
}

async function saveCompanyIntelligence(company, patch) {
  const rawPayload = {
    ...(company.raw_payload || {}),
    tecnotitan_company_origami: patch,
  };
  const rows = await updateRows(
    "companies",
    {
      raw_payload: rawPayload,
      updated_at: new Date().toISOString(),
    },
    `id=eq.${encodeURIComponent(company.id)}`
  );
  return rows?.[0] || { ...company, raw_payload: rawPayload };
}

async function analyzeCompany(company, opportunities, user) {
  const result = await createAgentRun({
    name: `Tecnotitan company intelligence - ${company.name || company.id}`.slice(0, 90),
    prompt: companyPrompt(company, opportunities),
  });
  const agent = result.agent || result.data?.agent || {};
  let run = result.run || result.data?.run || result;
  let status = normalizedStatus(run?.status);

  const started = {
    status,
    agent_id: agent.id || run.agentId || run.agent_id || null,
    run_id: run.id || null,
    updated_at: new Date().toISOString(),
  };
  await saveCompanyIntelligence(company, started);

  for (let index = 0; index < 2 && status === "running" && started.agent_id && started.run_id; index += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const latest = await getRun(started.agent_id, started.run_id);
    run = latest.run || latest;
    status = normalizedStatus(run?.status);
  }

  if (status !== "completed") {
    return saveCompanyIntelligence(company, {
      ...started,
      status,
      error: status === "failed" ? run?.error?.message || run?.error || "Origami no pudo analizar la empresa." : null,
      updated_at: new Date().toISOString(),
    });
  }

  const resultText = extractResultText(run);
  const profile = normalizedProfile(resultText);
  const completed = {
    ...started,
    status: "completed",
    profile,
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    error: null,
  };
  const saved = await saveCompanyIntelligence(company, completed);
  await insertRow("notes", {
    company_id: company.id,
    user_id: user.db_user_id || null,
    body: [
      "Inteligencia Origami de empresa",
      profile.summary ? `Resumen: ${profile.summary}` : "",
      profile.why_it_matters ? `Por que importa: ${profile.why_it_matters}` : "",
      profile.recommended_approach ? `Abordaje: ${profile.recommended_approach}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  }).catch(() => null);
  return saved;
}

module.exports = async function handler(req, res) {
  const user = requireUser(req, res);
  if (!user) return;
  res.status(410).json({ error: "Origami esta desactivado. Apollo es la fuente unica de leads." });
  return;

  try {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Metodo no permitido." });
      return;
    }
    if (!origamiConfigured()) throw new Error("ORIGAMI_API_KEY no esta configurada en Vercel.");
    const companyId = getCompanyId(req);
    if (!companyId) {
      res.status(400).json({ error: "company_id es requerido." });
      return;
    }
    const loaded = await loadCompany(companyId, user);
    if (!loaded) {
      res.status(404).json({ error: "No se encontro la empresa o no tienes acceso." });
      return;
    }
    const company = await analyzeCompany(loaded.company, loaded.opportunities, user);
    res.status(200).json({ company });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
