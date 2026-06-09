const { requireUser } = require("./_auth");
const { countRows } = require("./_supabase");

module.exports = async function handler(req, res) {
  const user = requireUser(req, res);
  if (!user) return;

  try {
    const assignedFilter = user.role === "admin" ? "" : `&owner_user_id=eq.${encodeURIComponent(user.db_user_id || user.email || "")}`;
    const today = new Date().toISOString().slice(0, 10);
    const [companies, contacts, opportunities, searches, hot, warm, overdueFollowups, todayFollowups] = await Promise.all([
      countRows("companies", "&deleted_at=is.null"),
      countRows("contacts", "&deleted_at=is.null"),
      countRows("opportunities", `&deleted_at=is.null${assignedFilter}`),
      countRows("lead_searches"),
      countRows("opportunities", `&deleted_at=is.null&score_label=eq.hot${assignedFilter}`),
      countRows("opportunities", `&deleted_at=is.null&score_label=eq.warm${assignedFilter}`),
      countRows("opportunities", `&deleted_at=is.null&next_follow_up_at=lt.${today}${assignedFilter}`),
      countRows("opportunities", `&deleted_at=is.null&next_follow_up_at=eq.${today}${assignedFilter}`),
    ]);

    res.status(200).json({ companies, contacts, opportunities, searches, hot, warm, overdueFollowups, todayFollowups, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
