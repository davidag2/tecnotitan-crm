const { requireUser } = require("./_auth");
const { countRows, supabaseFetch } = require("./_supabase");

async function assignmentWorkload() {
  const [{ payload: users }, { payload: opportunities }] = await Promise.all([
    supabaseFetch("/users?select=id,name,email,username,role,is_active&order=name.asc"),
    supabaseFetch(
      "/opportunities?select=id,owner_user_id,pipeline_status,next_follow_up_at,score_label,contacts(apollo_enrichment_status)&deleted_at=is.null&limit=2000"
    ),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const rows = (users || [])
    .filter((user) => user.is_active && user.role !== "admin")
    .map((user) => {
      const owned = (opportunities || []).filter((opportunity) => opportunity.owner_user_id === user.id);
      return {
        user_id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        total: owned.length,
        leads: owned.filter((opportunity) => opportunity.contacts?.apollo_enrichment_status !== "enriched" && opportunity.pipeline_status !== "archivado").length,
        clients: owned.filter((opportunity) => opportunity.contacts?.apollo_enrichment_status === "enriched" && opportunity.pipeline_status !== "archivado").length,
        archived: owned.filter((opportunity) => opportunity.pipeline_status === "archivado").length,
        hot: owned.filter((opportunity) => opportunity.score_label === "hot").length,
        overdue: owned.filter((opportunity) => opportunity.next_follow_up_at && opportunity.next_follow_up_at.slice(0, 10) < today).length,
        today: owned.filter((opportunity) => opportunity.next_follow_up_at && opportunity.next_follow_up_at.slice(0, 10) === today).length,
      };
    });
  const unassigned = (opportunities || []).filter((opportunity) => !opportunity.owner_user_id);
  return {
    rows,
    unassigned: {
      total: unassigned.length,
      leads: unassigned.filter((opportunity) => opportunity.contacts?.apollo_enrichment_status !== "enriched" && opportunity.pipeline_status !== "archivado").length,
      clients: unassigned.filter((opportunity) => opportunity.contacts?.apollo_enrichment_status === "enriched" && opportunity.pipeline_status !== "archivado").length,
    },
  };
}

module.exports = async function handler(req, res) {
  const user = requireUser(req, res);
  if (!user) return;

  try {
    const assignedFilter = user.role === "admin" ? "" : `&owner_user_id=eq.${encodeURIComponent(user.db_user_id || user.email || "")}`;
    const today = new Date().toISOString().slice(0, 10);
    const [companies, contacts, opportunities, searches, hot, warm, overdueFollowups, todayFollowups, workload] = await Promise.all([
      countRows("companies", "&deleted_at=is.null"),
      countRows("contacts", "&deleted_at=is.null"),
      countRows("opportunities", `&deleted_at=is.null${assignedFilter}`),
      countRows("lead_searches"),
      countRows("opportunities", `&deleted_at=is.null&score_label=eq.hot${assignedFilter}`),
      countRows("opportunities", `&deleted_at=is.null&score_label=eq.warm${assignedFilter}`),
      countRows("opportunities", `&deleted_at=is.null&next_follow_up_at=lt.${today}${assignedFilter}`),
      countRows("opportunities", `&deleted_at=is.null&next_follow_up_at=eq.${today}${assignedFilter}`),
      user.role === "admin" ? assignmentWorkload() : Promise.resolve(null),
    ]);

    res.status(200).json({ companies, contacts, opportunities, searches, hot, warm, overdueFollowups, todayFollowups, assignmentWorkload: workload, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
