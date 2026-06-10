const { requireUser } = require("./_auth");
const { supabaseFetch } = require("./_supabase");

function param(req, name) {
  const url = new URL(req.url, "https://tecnotitan.local");
  return String(url.searchParams.get(name) || "").trim();
}

function textIncludes(value, query) {
  return String(value || "").toLowerCase().includes(query);
}

function matchesText(lead, query) {
  if (!query) return true;
  const contact = lead.contacts || {};
  const company = lead.companies || {};
  return [
    contact.full_name,
    contact.title,
    contact.email,
    contact.country,
    contact.city,
    company.name,
    company.domain,
    company.industry,
    company.country,
  ].some((value) => textIncludes(value, query));
}

function matchesCountry(lead, country) {
  if (!country) return true;
  const contact = lead.contacts || {};
  const company = lead.companies || {};
  return [contact.country, company.country].some((value) => textIncludes(value, country));
}

async function listSearches() {
  const query = [
    "select=id,name,lead_type,target_region,search_template,filters,status,total_entries,pages_requested,results_saved,created_at",
    "order=created_at.desc",
    "limit=30",
  ].join("&");
  const { payload } = await supabaseFetch(`/lead_searches?${query}`);
  return payload || [];
}

async function listSearchResults(id) {
  const query = [
    "select=id,page,position,created_at,opportunities(id,lead_type,target_region,pipeline_status,score,score_label,contacts(full_name,title,email,country,city),companies(name,domain,industry,country))",
    `lead_search_id=eq.${encodeURIComponent(id)}`,
    "order=position.asc",
    "limit=100",
  ].join("&");
  const { payload } = await supabaseFetch(`/lead_search_results?${query}`);
  return payload || [];
}

function requireAdminView(user, res) {
  if (user.role === "admin") return true;
  res.status(403).json({ error: "Solo el usuario maestro puede ver el historial Apollo." });
  return false;
}

module.exports = async function handler(req, res) {
  const user = requireUser(req, res);
  if (!user) return;

  try {
    const mode = param(req, "mode");
    const leadSearchId = param(req, "search_id");
    if (mode === "search_history") {
      if (!requireAdminView(user, res)) return;
      const searches = await listSearches();
      res.status(200).json({ searches, count: searches.length });
      return;
    }

    if (leadSearchId) {
      if (!requireAdminView(user, res)) return;
      const results = await listSearchResults(leadSearchId);
      res.status(200).json({ results, count: results.length });
      return;
    }

    const leadType = param(req, "lead_type");
    const targetRegion = param(req, "target_region");
    const scoreLabel = param(req, "score_label");
    const pipelineStatus = param(req, "pipeline_status");
    const createdAfter = param(req, "created_after");
    const q = param(req, "q").toLowerCase();
    const country = param(req, "country").toLowerCase();
    const assignmentFilter =
      user.role === "admin" ? "" : `&owner_user_id=eq.${encodeURIComponent(user.db_user_id || user.email || "")}`;
    const query = [
      "select=id,lead_type,target_region,pipeline_status,score,score_label,created_at,owner_user_id,next_follow_up_at,next_follow_up_type,contacts(id,full_name,title,email,email_status,phone,mobile_phone,linkedin_url,country,city,apollo_enrichment_status,apollo_raw_payload),companies(id,name,domain,website_url,linkedin_url,industry,country,city,state,employee_count)",
      "deleted_at=is.null",
      assignmentFilter.replace(/^&/, ""),
      leadType ? `lead_type=eq.${encodeURIComponent(leadType)}` : "",
      targetRegion ? `target_region=eq.${encodeURIComponent(targetRegion)}` : "",
      scoreLabel ? `score_label=eq.${encodeURIComponent(scoreLabel)}` : "",
      pipelineStatus ? `pipeline_status=eq.${encodeURIComponent(pipelineStatus)}` : "",
      createdAfter ? `created_at=gte.${encodeURIComponent(createdAfter)}` : "",
      "order=score.desc",
      "limit=200",
    ].filter(Boolean).join("&");
    const { payload } = await supabaseFetch(`/opportunities?${query}`);
    const leads = (payload || []).filter((lead) => matchesText(lead, q)).filter((lead) => matchesCountry(lead, country));
    res.status(200).json({ leads, count: leads.length, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
