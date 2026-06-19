const { requireUser } = require("./_auth");
const { createAgentRun, getRun, origamiConfigured } = require("./_origami");
const { readJsonBody } = require("./_request");
const { insertRow, supabaseFetch, updateRows } = require("./_supabase");

function getOpportunityId(req) {
  const url = new URL(req.url, "https://tecnotitan.local");
  return String(url.searchParams.get("id") || "").trim();
}

async function loadOpportunity(id, user) {
  const filters = [
    "select=id,lead_type,target_region,pipeline_status,score,score_label,origami_status,origami_agent_id,origami_run_id,origami_table_id,origami_profile,origami_email_draft,origami_analyzed_at,origami_error,contacts(id,full_name,first_name,last_name,title,seniority,email,email_status,linkedin_url,country,city,state,apollo_enrichment_status,apollo_raw_payload),companies(id,name,domain,website_url,linkedin_url,industry,country,city,state,employee_count,raw_payload)",
    `id=eq.${encodeURIComponent(id)}`,
    "deleted_at=is.null",
    "limit=1",
  ];

  if (user.role !== "admin") {
    filters.splice(2, 0, `owner_user_id=eq.${encodeURIComponent(user.db_user_id || "")}`);
  }

  const { payload } = await supabaseFetch(`/opportunities?${filters.join("&")}`);
  return payload?.[0] || null;
}

function cleanText(value) {
  return String(value || "").trim();
}

function compactObject(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ""));
}

function leadPrompt(opportunity) {
  const contact = opportunity.contacts || {};
  const company = opportunity.companies || {};
  const apollo = contact.apollo_raw_payload || {};
  const companyRaw = company.raw_payload || {};
  const leadKind = opportunity.lead_type === "investor" ? "investor outreach" : "B2B consulting outreach";
  const language = opportunity.lead_type === "investor" && !["Colombia", "Mexico", "Chile", "Argentina", "Peru", "Ecuador", "Spain", "Brasil", "Brazil"].includes(contact.country || company.country || "")
    ? "English"
    : "Spanish";

  return [
    "You are an intelligence and cold email research agent for Tecnotitan.",
    "Goal: improve reply rate by finding specific, useful personalization signals before any campaign email is sent.",
    "",
    "Research the person and company/fund using public information. Prioritize LinkedIn/company site context when available.",
    "Do not invent facts. If a signal is uncertain, mark it as uncertain.",
    "Important signal: identify if this person/firm appears open to cold email, founder pitches, inbound startup submissions, or investment opportunities.",
    "Official pitch channel detection: search for public official inbound emails or mandatory forms for startups, founders, investment opportunities, partnerships or proposals.",
    "Examples of relevant official emails: pitch@, deals@, startups@, investment@, investments@, submissions@, founders@, portfolio@, partnerships@, hello@ only if the source says it is for pitches.",
    "If a form is required, capture the form URL and mark policy as form_required. If unsolicited emails are discouraged, mark no_unsolicited. Do not invent emails.",
    "",
    `Use case: ${leadKind}`,
    `Preferred writing language: ${language}`,
    "",
    "Lead data:",
    JSON.stringify(
      compactObject({
        name: contact.full_name,
        first_name: contact.first_name,
        title: contact.title,
        seniority: contact.seniority,
        email_status: contact.email_status,
        linkedin_url: contact.linkedin_url,
        country: contact.country,
        city: contact.city,
        company_name: company.name,
        company_domain: company.domain,
        company_website: company.website_url,
        company_linkedin: company.linkedin_url,
        company_industry: company.industry,
        company_country: company.country,
        company_city: company.city,
        company_employee_count: company.employee_count,
        apollo_headline: apollo.headline,
        apollo_organization_short_description: apollo.organization?.short_description || companyRaw.short_description,
      }),
      null,
      2
    ),
    "",
    "Tecnotitan context:",
    "- Colombian applied technology company.",
    "- Builds practical AI implementation, CRM, sales automation, integrations and internal software for Latin American companies.",
    "- Investor angle: AI implementation platform for LATAM; service revenue today, reusable IP/SaaS/licensing tomorrow.",
    "- Consulting angle: help companies convert manual workflows and scattered data into working systems.",
    "",
    "Return a concise CRM intelligence report and include exactly one JSON object between these markers:",
    "BEGIN_TECNOTITAN_JSON",
    "{",
    '  "summary": "2-3 sentence intelligence summary",',
    '  "personalization_angle": "specific angle to open the conversation",',
    '  "cold_email_fit": "high|medium|low|unknown",',
    '  "cold_email_fit_reason": "why they seem open or not open to cold email",',
    '  "official_pitch_email": "official/public pitch, deals, startups, investment, submissions or partnerships email if found",',
    '  "official_pitch_channel": "email|form|linkedin|referral|unknown",',
    '  "official_pitch_url": "source page, form URL or evidence URL if found",',
    '  "pitch_policy": "accepts_pitches|form_required|referral_only|no_unsolicited|unknown",',
    '  "pitch_email_alias_type": "pitch|deals|startups|investment|submissions|partnerships|general|none|unknown",',
    '  "pitch_detection_evidence": "short evidence explaining where this came from",',
    '  "recommended_channel": "email|official_pitch_email|linkedin|form|manual_review",',
    '  "opening_line": "one highly personalized opening line",',
    '  "recommended_subject": "natural subject line",',
    '  "email_body": "short professional outreach email with unsubscribe sentence if cold email",',
    '  "signals": ["specific signal 1", "specific signal 2"],',
    '  "risks": ["risk or caveat 1"]',
    "}",
    "END_TECNOTITAN_JSON",
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

function extractJson(text) {
  const match = String(text || "").match(/BEGIN_TECNOTITAN_JSON\s*([\s\S]*?)\s*END_TECNOTITAN_JSON/i);
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

function normalizedStatus(status) {
  const value = String(status || "").toLowerCase();
  if (!value) return "running";
  if (["running", "queued", "pending", "cancelling"].includes(value)) return "running";
  if (["failed", "error", "cancelled", "canceled"].includes(value)) return "failed";
  if (["needs_input"].includes(value)) return "needs_input";
  if (["completed", "complete", "done", "succeeded", "success", "finished"].includes(value)) return "completed";
  return "completed";
}

async function saveRunResult(opportunity, run) {
  const status = normalizedStatus(run?.status);
  const patch = {
    origami_status: status,
    origami_run_id: run?.id || opportunity.origami_run_id || null,
    origami_table_id: tableIdFromRun(run) || opportunity.origami_table_id || null,
    updated_at: new Date().toISOString(),
  };

  if (status === "completed") {
    const resultText = extractResultText(run);
    const intelligence = extractJson(resultText) || {};
    patch.origami_profile = {
      raw_response: resultText,
      summary: intelligence.summary || "",
      personalization_angle: intelligence.personalization_angle || "",
      cold_email_fit: intelligence.cold_email_fit || "unknown",
      cold_email_fit_reason: intelligence.cold_email_fit_reason || "",
      official_pitch_email: intelligence.official_pitch_email || "",
      official_pitch_channel: intelligence.official_pitch_channel || "unknown",
      official_pitch_url: intelligence.official_pitch_url || "",
      pitch_policy: intelligence.pitch_policy || "unknown",
      pitch_email_alias_type: intelligence.pitch_email_alias_type || "unknown",
      pitch_detection_evidence: intelligence.pitch_detection_evidence || "",
      recommended_channel: intelligence.recommended_channel || "manual_review",
      signals: Array.isArray(intelligence.signals) ? intelligence.signals : [],
      risks: Array.isArray(intelligence.risks) ? intelligence.risks : [],
    };
    patch.origami_email_draft = {
      opening_line: intelligence.opening_line || "",
      recommended_subject: intelligence.recommended_subject || "",
      email_body: intelligence.email_body || "",
    };
    patch.origami_analyzed_at = new Date().toISOString();
    patch.origami_error = null;
  }

  if (status === "failed") {
    patch.origami_error = run?.error?.message || run?.error || "Origami no pudo completar el analisis.";
  }

  await updateRows("opportunities", patch, `id=eq.${encodeURIComponent(opportunity.id)}`);
  return { ...opportunity, ...patch };
}

async function addOrigamiNote(opportunity, profile, user) {
  if (!profile?.summary && !profile?.personalization_angle) return;
  await insertRow("notes", {
    opportunity_id: opportunity.id,
    contact_id: opportunity.contacts?.id || null,
    company_id: opportunity.companies?.id || null,
    user_id: user.db_user_id || null,
    body: [
      "Inteligencia Origami",
      profile.summary ? `Resumen: ${profile.summary}` : "",
      profile.personalization_angle ? `Angulo: ${profile.personalization_angle}` : "",
      profile.cold_email_fit ? `Cold email fit: ${profile.cold_email_fit}` : "",
      profile.cold_email_fit_reason ? `Motivo: ${profile.cold_email_fit_reason}` : "",
      profile.official_pitch_email ? `Email oficial pitch: ${profile.official_pitch_email}` : "",
      profile.official_pitch_channel ? `Canal oficial pitch: ${profile.official_pitch_channel}` : "",
      profile.pitch_policy ? `Politica pitch: ${profile.pitch_policy}` : "",
      profile.official_pitch_url ? `Fuente pitch: ${profile.official_pitch_url}` : "",
      profile.pitch_detection_evidence ? `Evidencia pitch: ${profile.pitch_detection_evidence}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

async function waitForInitialResult(opportunity, maxPolls = 2) {
  let latest = opportunity;
  for (let index = 0; index < maxPolls; index += 1) {
    if (!latest.origami_agent_id || !latest.origami_run_id) break;
    const { run } = await getRun(latest.origami_agent_id, latest.origami_run_id);
    latest = await saveRunResult(latest, run);
    if (latest.origami_status !== "running") break;
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }
  return latest;
}

async function analyzeOpportunity(id, user) {
  const opportunity = await loadOpportunity(id, user);
  if (!opportunity) throw new Error("No se encontro la lead o no tienes acceso.");
  if (!origamiConfigured()) throw new Error("ORIGAMI_API_KEY no esta configurada en Vercel.");

  const contact = opportunity.contacts || {};
  const company = opportunity.companies || {};
  const result = await createAgentRun({
    name: `Tecnotitan intelligence - ${contact.full_name || company.name || opportunity.id}`.slice(0, 90),
    prompt: leadPrompt(opportunity),
  });
  const agent = result.agent || result.data?.agent || {};
  const run = result.run || result.data?.run || result;
  const patch = {
    origami_status: normalizedStatus(run?.status),
    origami_agent_id: agent.id || run.agentId || run.agent_id || null,
    origami_run_id: run.id || null,
    origami_error: null,
    updated_at: new Date().toISOString(),
  };

  await updateRows("opportunities", patch, `id=eq.${encodeURIComponent(opportunity.id)}`);
  const saved = await waitForInitialResult({ ...opportunity, ...patch });
  if (saved.origami_status === "completed") {
    await addOrigamiNote(opportunity, saved.origami_profile, user);
  }
  return loadOpportunity(id, user);
}

async function refreshOpportunity(id, user) {
  const opportunity = await loadOpportunity(id, user);
  if (!opportunity) throw new Error("No se encontro la lead o no tienes acceso.");
  if (!origamiConfigured()) throw new Error("ORIGAMI_API_KEY no esta configurada en Vercel.");
  if (!opportunity.origami_agent_id || !opportunity.origami_run_id) {
    throw new Error("Esta lead todavia no tiene un analisis Origami en curso.");
  }
  const { run } = await getRun(opportunity.origami_agent_id, opportunity.origami_run_id);
  const saved = await saveRunResult(opportunity, run);
  if (saved.origami_status === "completed" && opportunity.origami_status !== "completed") {
    await addOrigamiNote(opportunity, saved.origami_profile, user);
  }
  return loadOpportunity(id, user);
}

module.exports = async function handler(req, res) {
  const user = requireUser(req, res);
  if (!user) return;

  try {
    const id = getOpportunityId(req);
    if (!id) {
      res.status(400).json({ error: "id es requerido." });
      return;
    }

    if (req.method === "GET") {
      const opportunity = await loadOpportunity(id, user);
      if (!opportunity) {
        res.status(404).json({ error: "No se encontro la lead o no tienes acceso." });
        return;
      }
      res.status(200).json({ configured: origamiConfigured(), opportunity });
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Metodo no permitido." });
      return;
    }

    const body = await readJsonBody(req);
    const action = String(body.action || "analyze");
    const opportunity = action === "refresh" ? await refreshOpportunity(id, user) : await analyzeOpportunity(id, user);
    res.status(200).json({ configured: origamiConfigured(), opportunity });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
