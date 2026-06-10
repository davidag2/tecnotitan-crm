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

function startOfWeek(date) {
  const copy = new Date(date);
  const day = copy.getUTCDay() || 7;
  copy.setUTCHours(0, 0, 0, 0);
  copy.setUTCDate(copy.getUTCDate() - day + 1);
  return copy;
}

function weekKey(date) {
  return startOfWeek(date).toISOString().slice(0, 10);
}

function emptyWeek(key) {
  return {
    week: key,
    leads_obtained: 0,
    details_consumed: 0,
    clients_processed: 0,
    meetings: 0,
    proposals: 0,
    won: 0,
    conversion_rate: 0,
    apollo_credits_used: 0,
  };
}

async function executiveWeeklyMetrics() {
  const currentWeek = startOfWeek(new Date());
  const weeks = [];
  for (let index = 7; index >= 0; index -= 1) {
    const week = new Date(currentWeek);
    week.setUTCDate(currentWeek.getUTCDate() - index * 7);
    weeks.push(week.toISOString().slice(0, 10));
  }
  const since = `${weeks[0]}T00:00:00.000Z`;
  const weekly = new Map(weeks.map((key) => [key, emptyWeek(key)]));

  const [{ payload: opportunities }, { payload: logs }, { payload: contacts }, { payload: events }] = await Promise.all([
    supabaseFetch(`/opportunities?select=id,created_at&created_at=gte.${encodeURIComponent(since)}&deleted_at=is.null&limit=5000`),
    supabaseFetch(`/apollo_sync_logs?select=created_at,operation,credits_used&created_at=gte.${encodeURIComponent(since)}&limit=5000`),
    supabaseFetch(`/contacts?select=apollo_enriched_at&apollo_enriched_at=gte.${encodeURIComponent(since)}&deleted_at=is.null&limit=5000`),
    supabaseFetch(`/pipeline_events?select=to_status,changed_at&changed_at=gte.${encodeURIComponent(since)}&limit=5000`),
  ]);

  for (const opportunity of opportunities || []) {
    const row = weekly.get(weekKey(opportunity.created_at));
    if (row) row.leads_obtained += 1;
  }
  for (const log of logs || []) {
    const row = weekly.get(weekKey(log.created_at));
    if (!row) continue;
    if (log.operation === "people_match_enrichment") row.details_consumed += 1;
    row.apollo_credits_used += Number(log.credits_used || 0);
  }
  for (const contact of contacts || []) {
    const row = weekly.get(weekKey(contact.apollo_enriched_at));
    if (row) row.clients_processed += 1;
  }
  for (const event of events || []) {
    const row = weekly.get(weekKey(event.changed_at));
    if (!row) continue;
    if (event.to_status === "reunion_agendada") row.meetings += 1;
    if (event.to_status === "propuesta_enviada") row.proposals += 1;
    if (event.to_status === "ganado") row.won += 1;
  }

  return Array.from(weekly.values()).map((row) => ({
    ...row,
    conversion_rate: row.leads_obtained ? Math.round((row.won / row.leads_obtained) * 1000) / 10 : 0,
  }));
}

module.exports = async function handler(req, res) {
  const user = requireUser(req, res);
  if (!user) return;

  try {
    const assignedFilter = user.role === "admin" ? "" : `&owner_user_id=eq.${encodeURIComponent(user.db_user_id || user.email || "")}`;
    const today = new Date().toISOString().slice(0, 10);
    const [companies, contacts, opportunities, searches, hot, warm, overdueFollowups, todayFollowups, workload, executiveWeekly] = await Promise.all([
      countRows("companies", "&deleted_at=is.null"),
      countRows("contacts", "&deleted_at=is.null"),
      countRows("opportunities", `&deleted_at=is.null${assignedFilter}`),
      countRows("lead_searches"),
      countRows("opportunities", `&deleted_at=is.null&score_label=eq.hot${assignedFilter}`),
      countRows("opportunities", `&deleted_at=is.null&score_label=eq.warm${assignedFilter}`),
      countRows("opportunities", `&deleted_at=is.null&next_follow_up_at=lt.${today}${assignedFilter}`),
      countRows("opportunities", `&deleted_at=is.null&next_follow_up_at=eq.${today}${assignedFilter}`),
      user.role === "admin" ? assignmentWorkload() : Promise.resolve(null),
      user.role === "admin" ? executiveWeeklyMetrics() : Promise.resolve(null),
    ]);

    res.status(200).json({
      companies,
      contacts,
      opportunities,
      searches,
      hot,
      warm,
      overdueFollowups,
      todayFollowups,
      assignmentWorkload: workload,
      executiveWeekly,
      user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
