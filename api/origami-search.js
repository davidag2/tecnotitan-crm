const { requireAdmin } = require("./_auth");
const { createAgentRun, getRun, origamiConfigured } = require("./_origami");
const { readJsonBody } = require("./_request");
const { insertRow, supabaseFetch, updateRows } = require("./_supabase");

function cleanText(value) {
  return String(value || "").trim();
}

function normalizedStatus(status) {
  const value = String(status || "").toLowerCase();
  if (!value) return "running";
  if (["running", "queued", "pending", "cancelling"].includes(value)) return "running";
  if (["failed", "error", "cancelled", "canceled"].includes(value)) return "failed";
  if (["needs_input"].includes(value)) return "needs_input";
  if (["completed", "complete", "done", "succeeded", "success", "finished"].includes(value)) return "completed";
  return "completed";
}

function extractResultText(run) {
  const response = run?.response || run?.result || run?.output || run;
  if (typeof response === "string") return response;
  if (response?.text) return String(response.text);
  if (response?.message) return String(response.message);
  if (response?.content) return typeof response.content === "string" ? response.content : JSON.stringify(response.content);
  return JSON.stringify(response || {});
}

function extractJson(text) {
  const match = String(text || "").match(/BEGIN_TECNOTITAN_PERSON_JSON\s*([\s\S]*?)\s*END_TECNOTITAN_PERSON_JSON/i);
  const raw = match?.[1] || "";
  if (!raw.trim()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function tableIdFromRun(run) {
  const tables = run?.response?.tables || run?.tables || [];
  return tables?.[0]?.id || tables?.[0]?.tableId || null;
}

function personPrompt(search) {
  const language = search.search_purpose === "investor" ? "English unless the person is clearly LATAM/Spanish-speaking" : "Spanish";
  return [
    "You are an Origami research agent for Tecnotitan CRM.",
    "Goal: research one specific person before creating them as a lead.",
    "",
    "Research public information about the person, company/fund and best outreach path.",
    "Do not invent facts. If evidence is weak, mark confidence as low.",
    "Important: find whether there is an official pitch email or official inbound channel for startups, founders, consulting proposals, partnerships or investment opportunities.",
    "",
    `Preferred language: ${language}`,
    `Purpose: ${search.search_purpose}`,
    "",
    "Search input:",
    JSON.stringify(
      {
        name: search.query_name,
        company: search.query_company,
        linkedin_url: search.query_linkedin_url,
        notes: search.query_notes,
      },
      null,
      2
    ),
    "",
    "Tecnotitan context:",
    "- Colombian applied technology company.",
    "- Builds practical AI implementation, CRM, sales automation, integrations and internal software.",
    "- Investor angle: AI implementation platform for LATAM.",
    "- Consulting angle: help companies convert manual workflows and scattered data into working systems.",
    "",
    "Return a concise CRM-ready result and include exactly one JSON object between these markers:",
    "BEGIN_TECNOTITAN_PERSON_JSON",
    "{",
    '  "person_name": "full name if confirmed",',
    '  "current_title": "title/role",',
    '  "company_name": "company or fund",',
    '  "company_website": "website if found",',
    '  "linkedin_url": "best LinkedIn URL if found",',
    '  "summary": "2-3 sentence summary",',
    '  "fit_for_tecnotitan": "high|medium|low|unknown",',
    '  "cold_email_fit": "high|medium|low|unknown",',
    '  "cold_email_fit_reason": "evidence-based reason",',
    '  "official_pitch_email": "official pitch/inbound email if found",',
    '  "official_pitch_channel": "email|form|linkedin|referral|unknown",',
    '  "official_pitch_url": "source page URL if found",',
    '  "pitch_policy": "accepts_pitches|form_required|referral_only|no_unsolicited|unknown",',
    '  "recommended_channel": "email|official_pitch_email|form|linkedin|manual_review",',
    '  "personalization_angle": "specific outreach angle",',
    '  "recommended_subject": "natural subject",',
    '  "email_body": "short personalized email",',
    '  "signals": ["specific signal 1", "specific signal 2"],',
    '  "risks": ["risk or caveat 1"],',
    '  "confidence": "high|medium|low"',
    "}",
    "END_TECNOTITAN_PERSON_JSON",
  ].join("\n");
}

async function listSearches() {
  const { payload } = await supabaseFetch(
    "/origami_people_searches?select=id,query_name,query_company,query_linkedin_url,query_notes,search_purpose,status,result_profile,email_draft,error,created_at,updated_at,completed_at&order=created_at.desc&limit=25"
  );
  return payload || [];
}

async function loadSearch(id) {
  const { payload } = await supabaseFetch(
    `/origami_people_searches?select=*&id=eq.${encodeURIComponent(id)}&limit=1`
  );
  return payload?.[0] || null;
}

async function saveRunResult(search, run) {
  const status = normalizedStatus(run?.status);
  const patch = {
    status,
    run_id: run?.id || search.run_id || null,
    table_id: tableIdFromRun(run) || search.table_id || null,
    updated_at: new Date().toISOString(),
  };
  if (status === "completed") {
    const resultText = extractResultText(run);
    const profile = extractJson(resultText) || {};
    patch.result_profile = {
      raw_summary: resultText,
      person_name: profile.person_name || "",
      current_title: profile.current_title || "",
      company_name: profile.company_name || "",
      company_website: profile.company_website || "",
      linkedin_url: profile.linkedin_url || "",
      summary: profile.summary || "",
      fit_for_tecnotitan: profile.fit_for_tecnotitan || "unknown",
      cold_email_fit: profile.cold_email_fit || "unknown",
      cold_email_fit_reason: profile.cold_email_fit_reason || "",
      official_pitch_email: profile.official_pitch_email || "",
      official_pitch_channel: profile.official_pitch_channel || "unknown",
      official_pitch_url: profile.official_pitch_url || "",
      pitch_policy: profile.pitch_policy || "unknown",
      recommended_channel: profile.recommended_channel || "manual_review",
      personalization_angle: profile.personalization_angle || "",
      signals: Array.isArray(profile.signals) ? profile.signals : [],
      risks: Array.isArray(profile.risks) ? profile.risks : [],
      confidence: profile.confidence || "low",
    };
    patch.email_draft = {
      recommended_subject: profile.recommended_subject || "",
      email_body: profile.email_body || "",
    };
    patch.raw_response = resultText;
    patch.completed_at = new Date().toISOString();
    patch.error = null;
  }
  if (status === "failed") {
    patch.error = run?.error?.message || run?.error || "Origami no pudo completar la busqueda.";
  }
  const rows = await updateRows("origami_people_searches", patch, `id=eq.${encodeURIComponent(search.id)}`);
  return rows?.[0] || { ...search, ...patch };
}

async function waitForInitialResult(search, maxPolls = 2) {
  let latest = search;
  for (let index = 0; index < maxPolls; index += 1) {
    if (!latest.agent_id || !latest.run_id) break;
    const { run } = await getRun(latest.agent_id, latest.run_id);
    latest = await saveRunResult(latest, run);
    if (latest.status !== "running") break;
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }
  return latest;
}

async function createSearch(body, user) {
  if (!origamiConfigured()) throw new Error("ORIGAMI_API_KEY no esta configurada en Vercel.");
  const queryName = cleanText(body.query_name);
  if (!queryName) throw new Error("El nombre de la persona es requerido.");
  const search = await insertRow("origami_people_searches", {
    query_name: queryName,
    query_company: cleanText(body.query_company) || null,
    query_linkedin_url: cleanText(body.query_linkedin_url) || null,
    query_notes: cleanText(body.query_notes) || null,
    search_purpose: cleanText(body.search_purpose) || "lead_research",
    status: "running",
    created_by: user.db_user_id || null,
  });
  const result = await createAgentRun({
    name: `Tecnotitan person search - ${queryName}`.slice(0, 90),
    prompt: personPrompt(search),
  });
  const agent = result.agent || result.data?.agent || {};
  const run = result.run || result.data?.run || result;
  const rows = await updateRows(
    "origami_people_searches",
    {
      status: normalizedStatus(run?.status),
      agent_id: agent.id || run.agentId || run.agent_id || null,
      run_id: run.id || null,
      updated_at: new Date().toISOString(),
    },
    `id=eq.${encodeURIComponent(search.id)}`
  );
  const saved = rows?.[0] || search;
  return waitForInitialResult(saved);
}

async function refreshSearch(id) {
  if (!origamiConfigured()) throw new Error("ORIGAMI_API_KEY no esta configurada en Vercel.");
  const search = await loadSearch(id);
  if (!search) throw new Error("No se encontro la busqueda Origami.");
  if (!search.agent_id || !search.run_id) throw new Error("Esta busqueda no tiene un run de Origami asociado.");
  const { run } = await getRun(search.agent_id, search.run_id);
  return saveRunResult(search, run);
}

module.exports = async function handler(req, res) {
  const user = requireAdmin(req, res);
  if (!user) return;
  try {
    if (req.method === "GET") {
      res.status(200).json({ configured: origamiConfigured(), searches: await listSearches() });
      return;
    }
    if (req.method !== "POST") {
      res.status(405).json({ error: "Metodo no permitido." });
      return;
    }
    const body = await readJsonBody(req);
    const action = cleanText(body.action) || "search";
    const search = action === "refresh" ? await refreshSearch(cleanText(body.id)) : await createSearch(body, user);
    res.status(200).json({ configured: origamiConfigured(), search, searches: await listSearches() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
