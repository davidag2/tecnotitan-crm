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
  const match = String(text || "").match(/BEGIN_TECNOTITAN_JOBS_JSON\s*([\s\S]*?)\s*END_TECNOTITAN_JOBS_JSON/i);
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

function jobPrompt(search) {
  return [
    "You are an Origami job search research agent for Tecnotitan CRM.",
    "Goal: find practical job opportunities for Oscar and create outreach intelligence.",
    "Search public sources only. Do not invent emails, job postings, contacts or hiring signals.",
    "Prioritize current/open roles, companies likely hiring, recruiters, HR contacts, hiring managers, LinkedIn URLs and official application links.",
    "If an email is not public and official, leave it blank and recommend LinkedIn or application form.",
    "",
    "Candidate/search input:",
    JSON.stringify(
      {
        target_person: search.target_person || "Oscar",
        target_role: search.target_role,
        target_locations: search.target_locations,
        target_keywords: search.target_keywords,
        seniority: search.seniority,
        candidate_profile: search.candidate_profile,
        notes: search.notes,
      },
      null,
      2
    ),
    "",
    "Return Spanish CRM-ready recommendations and include exactly one JSON object between these markers:",
    "BEGIN_TECNOTITAN_JOBS_JSON",
    "{",
    '  "summary": "short executive summary in Spanish",',
    '  "best_search_angle": "recommended positioning for Oscar",',
    '  "target_roles": ["role 1", "role 2"],',
    '  "target_locations": ["location 1"],',
    '  "opportunities": [',
    "    {",
    '      "company": "company name",',
    '      "role": "job title or target role",',
    '      "location": "city/country/remote",',
    '      "job_url": "official job URL if found",',
    '      "company_website": "company site",',
    '      "linkedin_url": "company or job LinkedIn URL",',
    '      "recruiter_name": "public recruiter/contact name if found",',
    '      "recruiter_title": "title",',
    '      "recruiter_linkedin": "LinkedIn URL",',
    '      "hr_email": "official/public HR or careers email if found",',
    '      "fit_score": "high|medium|low|unknown",',
    '      "why_fit": "specific reason",',
    '      "application_channel": "job_url|email|linkedin|company_careers|manual_review",',
    '      "message_angle": "personalized angle",',
    '      "risks": ["risk or missing info"]',
    "    }",
    "  ],",
    '  "message_templates": {',
    '    "linkedin_connection": "short LinkedIn connection note in Spanish",',
    '    "recruiter_email_subject": "natural email subject",',
    '    "recruiter_email_body": "short email in Spanish",',
    '    "follow_up": "short follow-up message"',
    "  },",
    '  "next_steps": ["step 1", "step 2"],',
    '  "confidence": "high|medium|low"',
    "}",
    "END_TECNOTITAN_JOBS_JSON",
  ].join("\n");
}

async function listSearches() {
  const { payload } = await supabaseFetch(
    "/origami_job_searches?select=id,target_person,target_role,target_locations,target_keywords,seniority,status,result_summary,opportunities,message_templates,error,created_at,updated_at,completed_at&order=created_at.desc&limit=25"
  );
  return payload || [];
}

async function loadSearch(id) {
  const { payload } = await supabaseFetch(`/origami_job_searches?select=*&id=eq.${encodeURIComponent(id)}&limit=1`);
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
    const result = extractJson(resultText) || {};
    patch.result_summary = {
      raw_summary: resultText,
      summary: result.summary || "",
      best_search_angle: result.best_search_angle || "",
      target_roles: Array.isArray(result.target_roles) ? result.target_roles : [],
      target_locations: Array.isArray(result.target_locations) ? result.target_locations : [],
      next_steps: Array.isArray(result.next_steps) ? result.next_steps : [],
      confidence: result.confidence || "low",
    };
    patch.opportunities = Array.isArray(result.opportunities) ? result.opportunities : [];
    patch.message_templates = result.message_templates || {};
    patch.raw_response = resultText;
    patch.completed_at = new Date().toISOString();
    patch.error = null;
  }
  if (status === "failed") {
    patch.error = run?.error?.message || run?.error || "Origami no pudo completar la busqueda laboral.";
  }
  const rows = await updateRows("origami_job_searches", patch, `id=eq.${encodeURIComponent(search.id)}`);
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
  const targetRole = cleanText(body.target_role);
  if (!targetRole) throw new Error("El cargo objetivo es requerido.");
  const search = await insertRow("origami_job_searches", {
    target_person: cleanText(body.target_person) || "Oscar",
    target_role: targetRole,
    target_locations: cleanText(body.target_locations) || null,
    target_keywords: cleanText(body.target_keywords) || null,
    seniority: cleanText(body.seniority) || null,
    candidate_profile: cleanText(body.candidate_profile) || null,
    notes: cleanText(body.notes) || null,
    status: "running",
    created_by: user.db_user_id || null,
  });
  const result = await createAgentRun({
    name: `Tecnotitan job search - ${search.target_person}`.slice(0, 90),
    prompt: jobPrompt(search),
  });
  const agent = result.agent || result.data?.agent || {};
  const run = result.run || result.data?.run || result;
  const rows = await updateRows(
    "origami_job_searches",
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
  if (!search) throw new Error("No se encontro la busqueda laboral.");
  if (!search.agent_id || !search.run_id) throw new Error("Esta busqueda no tiene un run de Origami asociado.");
  const { run } = await getRun(search.agent_id, search.run_id);
  return saveRunResult(search, run);
}

module.exports = async function handler(req, res) {
  const user = requireAdmin(req, res);
  if (!user) return;
  res.status(410).json({ configured: false, searches: [], error: "Origami esta desactivado. Apollo es la fuente unica de leads." });
  return;
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
