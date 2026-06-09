const { requireUser } = require("./_auth");
const { supabaseFetch } = require("./_supabase");

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

module.exports = async function handler(req, res) {
  const user = requireUser(req, res);
  if (!user) return;

  try {
    const assignmentFilter = user.role === "admin" ? "" : `owner_user_id=eq.${encodeURIComponent(user.db_user_id || "")}`;
    const query = [
      "select=id,lead_type,target_region,pipeline_status,score,score_label,next_follow_up_at,next_follow_up_type,contacts(full_name,title,email,country),companies(name,country)",
      "deleted_at=is.null",
      "next_follow_up_at=not.is.null",
      "order=next_follow_up_at.asc",
      "limit=30",
      assignmentFilter,
    ].filter(Boolean).join("&");
    const { payload } = await supabaseFetch(`/opportunities?${query}`);
    const today = todayIso();
    const rows = payload || [];
    res.status(200).json({
      overdue: rows.filter((row) => row.next_follow_up_at < today),
      today: rows.filter((row) => row.next_follow_up_at === today),
      upcoming: rows.filter((row) => row.next_follow_up_at > today),
      count: rows.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
