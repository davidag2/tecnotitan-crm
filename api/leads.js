const { requireUser } = require("./_auth");
const { supabaseFetch } = require("./_supabase");

module.exports = async function handler(req, res) {
  const user = requireUser(req, res);
  if (!user) return;

  try {
    const assignmentFilter =
      user.role === "admin" ? "" : `&owner_user_id=eq.${encodeURIComponent(user.db_user_id || user.email || "")}`;
    const query = [
      "select=id,lead_type,target_region,pipeline_status,score,score_label,created_at,owner_user_id,contacts(id,full_name,title,email,email_status,phone,mobile_phone,linkedin_url,country,city,apollo_enrichment_status),companies(name,domain,industry,country)",
      "deleted_at=is.null",
      assignmentFilter.replace(/^&/, ""),
      "order=score.desc",
      "limit=50",
    ].filter(Boolean).join("&");
    const { payload } = await supabaseFetch(`/opportunities?${query}`);
    res.status(200).json({ leads: payload || [], count: payload?.length || 0, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
