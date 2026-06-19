const { requireUser } = require("./_auth");
const { createAgentRun, getRun, origamiConfigured } = require("./_origami");
const { readJsonBody } = require("./_request");
const { scoreWithOrigami } = require("./_scoring");
const { insertRow, supabaseFetch, updateRows, upsertRow } = require("./_supabase");

function getOpportunityId(req) {
  const url = new URL(req.url, "https://tecnotitan.local");
  return String(url.searchParams.get("id") || "").trim();
}

async function loadOpportunity(id, user) {
  const filters = [
    "select=id,lead_type,target_region,pipeline_status,score,score_label,score_reasons,origami_status,origami_agent_id,origami_run_id,origami_table_id,origami_profile,origami_email_draft,origami_analyzed_at,origami_error,contacts(id,full_name,first_name,last_name,title,seniority,email,email_status,linkedin_url,country,city,state,apollo_enrichment_status,apollo_raw_payload),companies(id,name,domain,website_url,linkedin_url,industry,country,city,state,employee_count,raw_payload)",
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

function normalize(value) {
  return String(value || "").trim().toLowerCase();
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
    "For investor outreach only, detect whether the lead/fund publicly matches these thesis signals: AI, SaaS, LATAM, B2B, emerging markets, seed, pre-seed. Use only public evidence or mark as unknown.",
    "For B2B consulting outreach only, detect whether the company likely has these operational pain signals: manual processes, growth pressure, automation need, CRM need, scattered data. Use only public evidence or mark as unknown.",
    "Contact risk: explicitly mark when outreach is not recommended because the person/firm does not accept pitches, the contact is irrelevant for Tecnotitan, or the overall fit is low.",
    "",
    "Return a concise CRM intelligence report and include exactly one JSON object between these markers:",
    "BEGIN_TECNOTITAN_JSON",
    "{",
    '  "summary": "2-3 sentence intelligence summary",',
    '  "personalization_angle": "specific angle to open the conversation",',
    '  "executive_brief": {',
    '    "who": "who this lead is in one sentence",',
    '    "what_they_do": "what the person/company does in one sentence",',
    '    "why_it_matters": "why this lead matters for Tecnotitan",',
    '    "how_to_approach": "best practical approach for outreach"',
    '  },',
    '  "cold_email_fit": "high|medium|low|unknown",',
    '  "cold_email_fit_reason": "why they seem open or not open to cold email",',
    '  "accepts_pitches": "yes|no|unknown",',
    '  "accepts_founder_submissions": "yes|no|unknown",',
    '  "accepts_inbound_deals": "yes|no|unknown",',
    '  "accepts_cold_email": "yes|no|unknown",',
    '  "outreach_openness_evidence": "short evidence for openness to pitches, submissions, inbound deals or cold email",',
    '  "official_pitch_email": "official/public pitch, deals, startups, investment, submissions or partnerships email if found",',
    '  "official_pitch_channel": "email|form|linkedin|referral|unknown",',
    '  "official_pitch_url": "source page, form URL or evidence URL if found",',
    '  "pitch_policy": "accepts_pitches|form_required|referral_only|no_unsolicited|unknown",',
    '  "pitch_email_alias_type": "pitch|deals|startups|investment|submissions|partnerships|general|none|unknown",',
    '  "pitch_detection_evidence": "short evidence explaining where this came from",',
    '  "recommended_channel": "email|official_pitch_email|linkedin|form|manual_review",',
    '  "investment_thesis_signals": {',
    '    "ai": "yes|no|unknown",',
    '    "saas": "yes|no|unknown",',
    '    "latam": "yes|no|unknown",',
    '    "b2b": "yes|no|unknown",',
    '    "emerging_markets": "yes|no|unknown",',
    '    "seed": "yes|no|unknown",',
    '    "pre_seed": "yes|no|unknown",',
    '    "evidence": "short evidence for the matched thesis signals"',
    '  },',
    '  "operational_pain_signals": {',
    '    "manual_processes": "yes|no|unknown",',
    '    "growth": "yes|no|unknown",',
    '    "automation": "yes|no|unknown",',
    '    "crm": "yes|no|unknown",',
    '    "scattered_data": "yes|no|unknown",',
    '    "evidence": "short evidence for the matched operational pain signals"',
    '  },',
    '  "contact_risk": {',
    '    "level": "low|medium|high|unknown",',
    '    "do_not_contact": true,',
    '    "no_pitches": "yes|no|unknown",',
    '    "irrelevant_contact": "yes|no|unknown",',
    '    "low_fit": "yes|no|unknown",',
    '    "reason": "short reason explaining the contact risk"',
    '  },',
    '  "next_best_action": {',
    '    "action": "send_email|use_official_pitch_email|review_linkedin|seek_intro|send_deck|do_not_contact",',
    '    "reason": "short reason for the recommended next action"',
    '  },',
    '  "opening_line": "one highly personalized opening line",',
    '  "recommended_subject": "natural subject line",',
    '  "email_body": "short professional outreach email with unsubscribe sentence if cold email",',
    '  "email_variants": {',
    '    "direct": { "subject": "direct subject", "body": "direct concise outreach email" },',
    '    "consultative": { "subject": "consultative subject", "body": "consultative problem-led outreach email" },',
    '    "investor": { "subject": "investor subject", "body": "investor-oriented outreach email" },',
    '    "strategic": { "subject": "strategic subject", "body": "strategic partnership/value creation outreach email" },',
    '    "followup_short": { "subject": "short follow-up subject", "body": "very short follow-up email" }',
    '  },',
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

function normalizeEmailVariant(variant) {
  if (!variant || typeof variant !== "object") return null;
  const subject = String(variant.subject || variant.recommended_subject || "").trim();
  const body = String(variant.body || variant.email_body || "").trim();
  if (!subject && !body) return null;
  return { subject, body };
}

function normalizeEmailVariants(variants) {
  const source = variants && typeof variants === "object" ? variants : {};
  const keys = ["direct", "consultative", "investor", "strategic", "followup_short"];
  return keys.reduce((acc, key) => {
    const variant = normalizeEmailVariant(source[key]);
    if (variant) acc[key] = variant;
    return acc;
  }, {});
}

function normalizeYesNoUnknown(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "yes" || normalized === "no") return normalized;
  return "unknown";
}

function normalizeInvestmentThesisSignals(signals) {
  const source = signals && typeof signals === "object" ? signals : {};
  return {
    ai: normalizeYesNoUnknown(source.ai),
    saas: normalizeYesNoUnknown(source.saas),
    latam: normalizeYesNoUnknown(source.latam),
    b2b: normalizeYesNoUnknown(source.b2b),
    emerging_markets: normalizeYesNoUnknown(source.emerging_markets),
    seed: normalizeYesNoUnknown(source.seed),
    pre_seed: normalizeYesNoUnknown(source.pre_seed),
    evidence: String(source.evidence || "").trim(),
  };
}

function normalizeOperationalPainSignals(signals) {
  const source = signals && typeof signals === "object" ? signals : {};
  return {
    manual_processes: normalizeYesNoUnknown(source.manual_processes),
    growth: normalizeYesNoUnknown(source.growth),
    automation: normalizeYesNoUnknown(source.automation),
    crm: normalizeYesNoUnknown(source.crm),
    scattered_data: normalizeYesNoUnknown(source.scattered_data),
    evidence: String(source.evidence || "").trim(),
  };
}

function normalizeContactRisk(risk) {
  const source = risk && typeof risk === "object" ? risk : {};
  const level = String(source.level || "").trim().toLowerCase();
  return {
    level: ["low", "medium", "high"].includes(level) ? level : "unknown",
    do_not_contact: source.do_not_contact === true,
    no_pitches: normalizeYesNoUnknown(source.no_pitches),
    irrelevant_contact: normalizeYesNoUnknown(source.irrelevant_contact),
    low_fit: normalizeYesNoUnknown(source.low_fit),
    reason: String(source.reason || "").trim(),
  };
}

function normalizeNextBestAction(action) {
  const source = action && typeof action === "object" ? action : {};
  const value = normalize(source.action);
  const allowed = ["send_email", "use_official_pitch_email", "review_linkedin", "seek_intro", "send_deck", "do_not_contact"];
  return {
    action: allowed.includes(value) ? value : "",
    reason: String(source.reason || "").trim(),
  };
}

async function ensureContactTag(contactId, name, color = "#2563eb") {
  if (!contactId || !name) return null;
  const tag = await upsertRow("tags", { name, color }, ["name"]);
  if (!tag?.id) return null;
  return upsertRow("contact_tags", { contact_id: contactId, tag_id: tag.id }, ["contact_id", "tag_id"]);
}

function textBlob(opportunity, profile) {
  const contact = opportunity.contacts || {};
  const company = opportunity.companies || {};
  return [
    contact.full_name,
    contact.title,
    company.name,
    company.industry,
    company.domain,
    profile.summary,
    profile.personalization_angle,
    profile.pitch_detection_evidence,
    ...(Array.isArray(profile.signals) ? profile.signals : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function autoTagsForOrigami(opportunity, profile) {
  const tags = [];
  const blob = textBlob(opportunity, profile);
  const thesis = profile.investment_thesis_signals || {};
  const contactRisk = profile.contact_risk || {};
  const isInvestor = opportunity.lead_type === "investor";

  if (isInvestor && normalize(opportunity.target_region) === "usa" && /\b(vc|venture|capital|fund|partner|principal|investor)\b/i.test(blob)) {
    tags.push({ name: "VC USA", color: "#2563eb" });
  }
  if (isInvestor && /\b(angel|operator investor|solo gp|syndicate)\b/i.test(blob)) {
    tags.push({ name: "Angel", color: "#f59e0b" });
  }
  if (isInvestor && /\b(strategic|corporate venture|cvc|partnership|platform|ecosystem)\b/i.test(blob)) {
    tags.push({ name: "Strategic investor", color: "#7c3aed" });
  }
  if (normalize(thesis.ai) === "yes") tags.push({ name: "AI thesis", color: "#1f5eff" });
  if (profile.official_pitch_email) tags.push({ name: "Pitch email found", color: "#0f766e" });
  if (
    normalize(profile.accepts_cold_email) === "no" ||
    normalize(profile.pitch_policy) === "no_unsolicited" ||
    normalize(contactRisk.no_pitches) === "yes" ||
    contactRisk.do_not_contact === true
  ) {
    tags.push({ name: "No cold email", color: "#6b7280" });
  }

  return tags;
}

async function applyOrigamiAutoTags(opportunity, profile) {
  const contactId = opportunity.contacts?.id;
  if (!contactId) return [];
  const tags = autoTagsForOrigami(opportunity, profile);
  const uniqueTags = [...new Map(tags.map((tag) => [normalize(tag.name), tag])).values()];
  for (const tag of uniqueTags) {
    await ensureContactTag(contactId, tag.name, tag.color).catch(() => null);
  }
  return uniqueTags;
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
    const origamiProfile = {
      raw_response: resultText,
      summary: intelligence.summary || "",
      personalization_angle: intelligence.personalization_angle || "",
      executive_brief:
        intelligence.executive_brief && typeof intelligence.executive_brief === "object"
          ? {
              who: intelligence.executive_brief.who || "",
              what_they_do: intelligence.executive_brief.what_they_do || "",
              why_it_matters: intelligence.executive_brief.why_it_matters || "",
              how_to_approach: intelligence.executive_brief.how_to_approach || "",
            }
          : {},
      cold_email_fit: intelligence.cold_email_fit || "unknown",
      cold_email_fit_reason: intelligence.cold_email_fit_reason || "",
      accepts_pitches: intelligence.accepts_pitches || "unknown",
      accepts_founder_submissions: intelligence.accepts_founder_submissions || "unknown",
      accepts_inbound_deals: intelligence.accepts_inbound_deals || "unknown",
      accepts_cold_email: intelligence.accepts_cold_email || "unknown",
      outreach_openness_evidence: intelligence.outreach_openness_evidence || "",
      official_pitch_email: intelligence.official_pitch_email || "",
      official_pitch_channel: intelligence.official_pitch_channel || "unknown",
      official_pitch_url: intelligence.official_pitch_url || "",
      pitch_policy: intelligence.pitch_policy || "unknown",
      pitch_email_alias_type: intelligence.pitch_email_alias_type || "unknown",
      pitch_detection_evidence: intelligence.pitch_detection_evidence || "",
      recommended_channel: intelligence.recommended_channel || "manual_review",
      investment_thesis_signals: normalizeInvestmentThesisSignals(intelligence.investment_thesis_signals),
      operational_pain_signals: normalizeOperationalPainSignals(intelligence.operational_pain_signals),
      contact_risk: normalizeContactRisk(intelligence.contact_risk),
      next_best_action: normalizeNextBestAction(intelligence.next_best_action),
      signals: Array.isArray(intelligence.signals) ? intelligence.signals : [],
      risks: Array.isArray(intelligence.risks) ? intelligence.risks : [],
    };
    const origamiScore = scoreWithOrigami(opportunity, origamiProfile);
    patch.origami_profile = origamiProfile;
    patch.origami_email_draft = {
      opening_line: intelligence.opening_line || "",
      recommended_subject: intelligence.recommended_subject || "",
      email_body: intelligence.email_body || "",
      variants: normalizeEmailVariants(intelligence.email_variants),
    };
    patch.score = origamiScore.score;
    patch.score_label = origamiScore.score_label;
    patch.score_reasons = origamiScore.score_reasons;
    patch.origami_analyzed_at = new Date().toISOString();
    patch.origami_error = null;
  }

  if (status === "failed") {
    patch.origami_error = run?.error?.message || run?.error || "Origami no pudo completar el analisis.";
  }

  await updateRows("opportunities", patch, `id=eq.${encodeURIComponent(opportunity.id)}`);
  if (status === "completed" && patch.origami_profile) {
    await applyOrigamiAutoTags({ ...opportunity, ...patch }, patch.origami_profile);
  }
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
      profile.accepts_pitches ? `Acepta pitches: ${profile.accepts_pitches}` : "",
      profile.accepts_founder_submissions ? `Founder submissions: ${profile.accepts_founder_submissions}` : "",
      profile.accepts_inbound_deals ? `Inbound deals: ${profile.accepts_inbound_deals}` : "",
      profile.accepts_cold_email ? `Cold emails: ${profile.accepts_cold_email}` : "",
      profile.outreach_openness_evidence ? `Evidencia apertura: ${profile.outreach_openness_evidence}` : "",
      profile.official_pitch_email ? `Email oficial pitch: ${profile.official_pitch_email}` : "",
      profile.official_pitch_channel ? `Canal oficial pitch: ${profile.official_pitch_channel}` : "",
      profile.pitch_policy ? `Politica pitch: ${profile.pitch_policy}` : "",
      profile.official_pitch_url ? `Fuente pitch: ${profile.official_pitch_url}` : "",
      profile.pitch_detection_evidence ? `Evidencia pitch: ${profile.pitch_detection_evidence}` : "",
      profile.next_best_action?.action ? `Siguiente accion: ${profile.next_best_action.action}` : "",
      profile.next_best_action?.reason ? `Motivo siguiente accion: ${profile.next_best_action.reason}` : "",
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
