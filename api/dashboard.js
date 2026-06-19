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

function roundedRate(part, total) {
  const numerator = Number(part || 0);
  const denominator = Number(total || 0);
  return denominator ? Math.round((numerator / denominator) * 1000) / 10 : 0;
}

function roundNumber(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}

function emailStatusLooksRisky(status) {
  const value = String(status || "").toLowerCase();
  if (!value) return false;
  return [
    "invalid",
    "unavailable",
    "not_available",
    "risky",
    "unknown",
    "catch",
    "doubtful",
    "guessed",
    "unverified",
    "bounced",
    "failed",
  ].some((item) => value.includes(item));
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

async function apolloPerformanceMetrics() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [{ payload: logs }, { payload: contacts }, { payload: recipients }, { payload: campaigns }, { payload: searches }] = await Promise.all([
    supabaseFetch(`/apollo_sync_logs?select=created_at,operation,credits_used&created_at=gte.${encodeURIComponent(since)}&limit=10000`),
    supabaseFetch("/contacts?select=id,email,email_status,lead_source,apollo_enriched_at&deleted_at=is.null&email=not.is.null&limit=10000"),
    supabaseFetch(
      `/email_campaign_recipients?select=campaign_id,status,sent_at,delivered_at,bounced_at,complained_at,suppressed_at,failed_at,reply_received_at,reputation_status&created_at=gte.${encodeURIComponent(since)}&limit=10000`
    ),
    supabaseFetch("/email_campaigns?select=id,name,campaign_type,segment_key,segment_label,search_templates,status&limit=500"),
    supabaseFetch(`/lead_searches?select=search_template,lead_type,target_region,results_saved,created_at&created_at=gte.${encodeURIComponent(since)}&limit=5000`),
  ]);

  const campaignById = new Map((campaigns || []).map((campaign) => [campaign.id, campaign]));
  const creditsUsed = (logs || []).reduce((sum, log) => sum + Number(log.credits_used || 0), 0);
  const validApolloEmails = (contacts || []).filter((contact) => {
    const source = String(contact.lead_source || "").toLowerCase();
    const cameFromApollo = source === "apollo" || Boolean(contact.apollo_enriched_at);
    return cameFromApollo && contact.email && !emailStatusLooksRisky(contact.email_status);
  }).length;

  const totals = {
    sent: 0,
    delivered: 0,
    bounced: 0,
    replies: 0,
    failed: 0,
    suppressed: 0,
    complained: 0,
  };
  const segmentMap = new Map();

  for (const row of recipients || []) {
    const campaign = campaignById.get(row.campaign_id) || {};
    const key = campaign.segment_key || campaign.segment_label || campaign.campaign_type || "sin_segmento";
    const label = campaign.segment_label || campaign.name || key;
    if (!segmentMap.has(key)) {
      segmentMap.set(key, {
        key,
        label,
        sent: 0,
        delivered: 0,
        bounced: 0,
        replies: 0,
        failed: 0,
      });
    }
    const segment = segmentMap.get(key);
    const wasSent = row.status === "sent" || Boolean(row.sent_at);
    if (wasSent) {
      totals.sent += 1;
      segment.sent += 1;
    }
    if (row.delivered_at) {
      totals.delivered += 1;
      segment.delivered += 1;
    }
    if (row.bounced_at) {
      totals.bounced += 1;
      segment.bounced += 1;
    }
    if (row.reply_received_at) {
      totals.replies += 1;
      segment.replies += 1;
    }
    if (row.failed_at) {
      totals.failed += 1;
      segment.failed += 1;
    }
    if (row.suppressed_at || row.reputation_status === "blocked") totals.suppressed += 1;
    if (row.complained_at) totals.complained += 1;
  }

  const segments = Array.from(segmentMap.values())
    .map((segment) => ({
      ...segment,
      bounce_rate: roundedRate(segment.bounced, segment.sent),
      reply_rate: roundedRate(segment.replies, segment.sent),
    }))
    .sort((a, b) => b.reply_rate - a.reply_rate || b.replies - a.replies || b.sent - a.sent)
    .slice(0, 8);

  const templateMap = new Map();
  for (const search of searches || []) {
    const key = search.search_template || `${search.lead_type || "lead"}:${search.target_region || "global"}`;
    if (!templateMap.has(key)) {
      templateMap.set(key, { template: key, searches: 0, leads_saved: 0 });
    }
    const template = templateMap.get(key);
    template.searches += 1;
    template.leads_saved += Number(search.results_saved || 0);
  }
  const templates = Array.from(templateMap.values())
    .sort((a, b) => b.leads_saved - a.leads_saved || b.searches - a.searches)
    .slice(0, 8);

  return {
    since,
    credits_used: creditsUsed,
    valid_emails: validApolloEmails,
    credits_per_usable_lead: validApolloEmails ? roundNumber(creditsUsed / validApolloEmails, 2) : 0,
    sent: totals.sent,
    delivered: totals.delivered,
    bounced: totals.bounced,
    replies: totals.replies,
    failed: totals.failed,
    suppressed: totals.suppressed,
    complained: totals.complained,
    bounce_rate: roundedRate(totals.bounced, totals.sent),
    reply_rate: roundedRate(totals.replies, totals.sent),
    best_segment: segments[0] || null,
    best_template: templates[0] || null,
    segments,
    templates,
  };
}

module.exports = async function handler(req, res) {
  const user = requireUser(req, res);
  if (!user) return;

  try {
    const assignedFilter = user.role === "admin" ? "" : `&owner_user_id=eq.${encodeURIComponent(user.db_user_id || user.email || "")}`;
    const today = new Date().toISOString().slice(0, 10);
    const [companies, contacts, opportunities, searches, hot, warm, overdueFollowups, todayFollowups, workload, executiveWeekly, apolloPerformance] = await Promise.all([
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
      user.role === "admin" ? apolloPerformanceMetrics() : Promise.resolve(null),
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
      apolloPerformance,
      user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
