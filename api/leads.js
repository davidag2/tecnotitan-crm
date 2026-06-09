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

module.exports = async function handler(req, res) {
  const user = requireUser(req, res);
  if (!user) return;

  try {
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
      "select=id,lead_type,target_region,pipeline_status,score,score_label,created_at,owner_user_id,contacts(id,full_name,title,email,email_status,phone,mobile_phone,linkedin_url,country,city,apollo_enrichment_status),companies(name,domain,industry,country)",
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
