const { requireAdmin } = require("./_auth");
const { supabaseFetch } = require("./_supabase");

module.exports = async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  try {
    const query = [
      "select=id,lead_type,target_region,pipeline_status,score,score_label,created_at,contacts(full_name,title,email,linkedin_url,country,city),companies(name,domain,industry,country)",
      "deleted_at=is.null",
      "order=score.desc",
      "limit=50",
    ].join("&");
    const { payload } = await supabaseFetch(`/opportunities?${query}`);
    res.status(200).json({ leads: payload || [], count: payload?.length || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
