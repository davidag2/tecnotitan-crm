const { requireAdmin } = require("./_auth");
const { supabaseFetch } = require("./_supabase");

function startOfWeek(date) {
  const copy = new Date(date);
  const day = copy.getUTCDay() || 7;
  copy.setUTCHours(0, 0, 0, 0);
  copy.setUTCDate(copy.getUTCDate() - day + 1);
  return copy;
}

function weekKey(value) {
  return startOfWeek(new Date(value)).toISOString().slice(0, 10);
}

function emptyWeek(key) {
  return {
    week: key,
    leads: 0,
    clients: 0,
    emails_sent: 0,
    replies: 0,
    bounces: 0,
    apollo_credits: 0,
    meetings: 0,
    proposals: 0,
    won: 0,
  };
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}

function rate(part, total) {
  return total ? round((Number(part || 0) / Number(total || 0)) * 100, 1) : 0;
}

function addToMap(map, key, label) {
  const safeKey = String(key || "unknown").trim() || "unknown";
  const safeLabel = String(label || safeKey).trim() || safeKey;
  map.set(safeKey, { label: safeLabel, value: (map.get(safeKey)?.value || 0) + 1 });
}

function mapRows(map, limit = 10) {
  const total = Array.from(map.values()).reduce((sum, row) => sum + row.value, 0);
  return Array.from(map.values())
    .map((row) => ({ ...row, share: rate(row.value, total) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function trendSlope(values) {
  const y = values.map((value) => Number(value || 0));
  const n = y.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = y.reduce((sum, value) => sum + value, 0) / n;
  const numerator = y.reduce((sum, value, index) => sum + (index - xMean) * (value - yMean), 0);
  const denominator = y.reduce((sum, _value, index) => sum + (index - xMean) ** 2, 0);
  return denominator ? round(numerator / denominator, 2) : 0;
}

function movingAverage(values, windowSize = 3) {
  const slice = values.slice(-windowSize);
  return slice.length ? round(slice.reduce((sum, value) => sum + Number(value || 0), 0) / slice.length, 2) : 0;
}

function trendLabel(slope, unit = "") {
  if (slope > 1) return `Subiendo +${slope}${unit}/semana`;
  if (slope < -1) return `Bajando ${slope}${unit}/semana`;
  return "Estable";
}

function buildInsights(weekly, totals) {
  const leadSlope = trendSlope(weekly.map((row) => row.leads));
  const replySlope = trendSlope(weekly.map((row) => row.replies));
  const creditSlope = trendSlope(weekly.map((row) => row.apollo_credits));
  const last = weekly[weekly.length - 1] || emptyWeek("");
  const previous = weekly[weekly.length - 2] || emptyWeek("");
  const insights = [
    `Leads: ${trendLabel(leadSlope)}. Promedio movil 3 semanas: ${movingAverage(weekly.map((row) => row.leads))}.`,
    `Respuestas: ${trendLabel(replySlope)}. Tasa acumulada: ${rate(totals.replies, totals.emails_sent)}%.`,
    `Creditos Apollo: ${trendLabel(creditSlope, " creditos")}. Creditos por lead: ${totals.leads ? round(totals.apollo_credits / totals.leads, 2) : 0}.`,
  ];
  if (last.leads < previous.leads) insights.push(`La ultima semana bajo en leads: ${previous.leads} -> ${last.leads}.`);
  if (rate(totals.bounces, totals.emails_sent) >= 5) insights.push(`Rebote alto: ${rate(totals.bounces, totals.emails_sent)}%. Conviene revisar calidad de emails.`);
  if (rate(totals.replies, totals.emails_sent) >= 3) insights.push("Respuesta saludable para cold outreach: el copy y segmentacion van en buena direccion.");
  return insights;
}

async function loadStatistics(since) {
  const [opportunities, contacts, recipients, searches, logs, events] = await Promise.all([
    supabaseFetch(
      `/opportunities?select=id,created_at,lead_type,target_region,pipeline_status,score_label,origami_status&deleted_at=is.null&created_at=gte.${encodeURIComponent(since)}&limit=10000`
    ),
    supabaseFetch(`/contacts?select=id,created_at,apollo_enriched_at,country&deleted_at=is.null&created_at=gte.${encodeURIComponent(since)}&limit=10000`),
    supabaseFetch(
      `/email_campaign_recipients?select=status,sent_at,reply_received_at,bounced_at,failed_at,created_at,email_campaigns(name,campaign_type,segment_label)&created_at=gte.${encodeURIComponent(since)}&limit=10000`
    ),
    supabaseFetch(`/lead_searches?select=created_at,results_saved,search_template,lead_type,target_region&created_at=gte.${encodeURIComponent(since)}&limit=5000`),
    supabaseFetch(`/apollo_sync_logs?select=created_at,operation,credits_used&created_at=gte.${encodeURIComponent(since)}&limit=10000`),
    supabaseFetch(`/pipeline_events?select=to_status,changed_at&changed_at=gte.${encodeURIComponent(since)}&limit=10000`),
  ]);
  return {
    opportunities: opportunities.payload || [],
    contacts: contacts.payload || [],
    recipients: recipients.payload || [],
    searches: searches.payload || [],
    logs: logs.payload || [],
    events: events.payload || [],
  };
}

function buildStatistics(rows, weeks) {
  const weeklyMap = new Map(weeks.map((key) => [key, emptyWeek(key)]));
  const typeMap = new Map();
  const regionMap = new Map();
  const statusMap = new Map();
  const scoreMap = new Map();
  const campaignMap = new Map();
  const countryMap = new Map();
  const templateMap = new Map();

  for (const opportunity of rows.opportunities) {
    const week = weeklyMap.get(weekKey(opportunity.created_at));
    if (week) week.leads += 1;
    addToMap(typeMap, opportunity.lead_type, opportunity.lead_type === "investor" ? "Inversionistas" : "Consultoria");
    addToMap(regionMap, opportunity.target_region, String(opportunity.target_region || "Sin region").toUpperCase());
    addToMap(statusMap, opportunity.pipeline_status, opportunity.pipeline_status || "Sin estado");
    addToMap(scoreMap, opportunity.score_label, opportunity.score_label || "Sin score");
  }

  for (const contact of rows.contacts) {
    if (contact.apollo_enriched_at) {
      const week = weeklyMap.get(weekKey(contact.apollo_enriched_at));
      if (week) week.clients += 1;
    }
    addToMap(countryMap, contact.country || "Sin pais", contact.country || "Sin pais");
  }

  for (const recipient of rows.recipients) {
    const sentWeek = recipient.sent_at ? weeklyMap.get(weekKey(recipient.sent_at)) : null;
    if (sentWeek) sentWeek.emails_sent += 1;
    if (recipient.reply_received_at) {
      const week = weeklyMap.get(weekKey(recipient.reply_received_at));
      if (week) week.replies += 1;
    }
    if (recipient.bounced_at) {
      const week = weeklyMap.get(weekKey(recipient.bounced_at));
      if (week) week.bounces += 1;
    }
    const campaign = recipient.email_campaigns || {};
    addToMap(campaignMap, campaign.segment_label || campaign.name || campaign.campaign_type, campaign.segment_label || campaign.name || "Sin campana");
  }

  for (const search of rows.searches) {
    addToMap(templateMap, search.search_template, search.search_template || "Sin plantilla");
  }

  for (const log of rows.logs) {
    const week = weeklyMap.get(weekKey(log.created_at));
    if (week) week.apollo_credits += Number(log.credits_used || 0);
  }

  for (const event of rows.events) {
    const week = weeklyMap.get(weekKey(event.changed_at));
    if (!week) continue;
    if (event.to_status === "reunion_agendada") week.meetings += 1;
    if (event.to_status === "propuesta_enviada") week.proposals += 1;
    if (event.to_status === "ganado") week.won += 1;
  }

  const weekly = Array.from(weeklyMap.values()).map((row) => ({
    ...row,
    reply_rate: rate(row.replies, row.emails_sent),
    bounce_rate: rate(row.bounces, row.emails_sent),
  }));
  const totals = weekly.reduce(
    (acc, row) => {
      for (const key of ["leads", "clients", "emails_sent", "replies", "bounces", "apollo_credits", "meetings", "proposals", "won"]) {
        acc[key] += Number(row[key] || 0);
      }
      return acc;
    },
    { leads: 0, clients: 0, emails_sent: 0, replies: 0, bounces: 0, apollo_credits: 0, meetings: 0, proposals: 0, won: 0 }
  );

  return {
    weekly,
    totals: {
      ...totals,
      reply_rate: rate(totals.replies, totals.emails_sent),
      bounce_rate: rate(totals.bounces, totals.emails_sent),
      lead_to_client_rate: rate(totals.clients, totals.leads),
      win_rate: rate(totals.won, totals.leads),
    },
    trends: {
      leads_slope: trendSlope(weekly.map((row) => row.leads)),
      replies_slope: trendSlope(weekly.map((row) => row.replies)),
      credits_slope: trendSlope(weekly.map((row) => row.apollo_credits)),
      leads_moving_avg: movingAverage(weekly.map((row) => row.leads)),
      replies_moving_avg: movingAverage(weekly.map((row) => row.replies)),
    },
    distributions: {
      lead_type: mapRows(typeMap),
      region: mapRows(regionMap),
      pipeline_status: mapRows(statusMap),
      score: mapRows(scoreMap),
      country: mapRows(countryMap, 12),
      campaign: mapRows(campaignMap, 12),
      apollo_template: mapRows(templateMap, 12),
    },
    insights: buildInsights(weekly, totals),
  };
}

module.exports = async function handler(req, res) {
  const user = requireAdmin(req, res);
  if (!user) return;

  try {
    const weekCount = Math.max(4, Math.min(26, Number(req.query.weeks || 12)));
    const currentWeek = startOfWeek(new Date());
    const weeks = [];
    for (let index = weekCount - 1; index >= 0; index -= 1) {
      const week = new Date(currentWeek);
      week.setUTCDate(currentWeek.getUTCDate() - index * 7);
      weeks.push(week.toISOString().slice(0, 10));
    }
    const since = `${weeks[0]}T00:00:00.000Z`;
    const rows = await loadStatistics(since);
    res.status(200).json({ since, weeks: weekCount, ...buildStatistics(rows, weeks) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
