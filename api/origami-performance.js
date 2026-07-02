const { requireAdmin } = require("./_auth");
const { supabaseFetch } = require("./_supabase");

function roundedRate(part, total) {
  const numerator = Number(part || 0);
  const denominator = Number(total || 0);
  return denominator ? Math.round((numerator / denominator) * 1000) / 10 : 0;
}

function normalizeKey(value, fallback = "unknown") {
  return String(value || fallback).trim().toLowerCase().replace(/\s+/g, "_") || fallback;
}

function labelValue(value, fallback = "Sin dato") {
  return String(value || "").trim() || fallback;
}

function profileFromRecipient(row) {
  return row?.opportunities?.origami_profile && typeof row.opportunities.origami_profile === "object" ? row.opportunities.origami_profile : {};
}

function countryFromRecipient(row) {
  return (
    row?.opportunities?.contacts?.country ||
    row?.opportunities?.companies?.country ||
    row?.contacts?.country ||
    row?.companies?.country ||
    "Sin pais"
  );
}

function segmentFromRecipient(row) {
  const campaign = row?.email_campaigns || {};
  return campaign.segment_label || campaign.segment_key || campaign.campaign_type || row?.opportunities?.lead_type || "Sin segmento";
}

function templateFromRecipient(row) {
  const campaign = row?.email_campaigns || {};
  if (campaign.name) return campaign.name;
  if (campaign.subject_template) return campaign.subject_template;
  return "Sin plantilla";
}

function emptyBucket(key, label) {
  return {
    key,
    label,
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    replies: 0,
    bounced: 0,
    failed: 0,
    suppressed: 0,
    complained: 0,
  };
}

function addToMap(map, key, label, row) {
  if (!map.has(key)) map.set(key, emptyBucket(key, label));
  const bucket = map.get(key);
  const wasSent = row.status === "sent" || Boolean(row.sent_at);
  if (wasSent) bucket.sent += 1;
  if (row.delivered_at) bucket.delivered += 1;
  if (row.opened_at) bucket.opened += 1;
  if (row.clicked_at) bucket.clicked += 1;
  if (row.reply_received_at) bucket.replies += 1;
  if (row.bounced_at) bucket.bounced += 1;
  if (row.failed_at) bucket.failed += 1;
  if (row.suppressed_at) bucket.suppressed += 1;
  if (row.complained_at) bucket.complained += 1;
}

function finalizeBuckets(map, limit = 10) {
  return Array.from(map.values())
    .map((bucket) => ({
      ...bucket,
      reply_rate: roundedRate(bucket.replies, bucket.sent),
      bounce_rate: roundedRate(bucket.bounced, bucket.sent),
      open_rate: roundedRate(bucket.opened, bucket.sent),
    }))
    .sort((a, b) => b.reply_rate - a.reply_rate || b.replies - a.replies || b.sent - a.sent)
    .slice(0, limit);
}

async function loadRows(since) {
  const [{ payload: recipients }, { payload: opportunities }] = await Promise.all([
    supabaseFetch(
      [
        "/email_campaign_recipients?select=",
        [
          "id",
          "status",
          "sent_at",
          "delivered_at",
          "opened_at",
          "clicked_at",
          "bounced_at",
          "failed_at",
          "suppressed_at",
          "complained_at",
          "reply_received_at",
          "email_campaigns(id,name,campaign_type,segment_key,segment_label,subject_template)",
          "opportunities(id,lead_type,target_region,origami_status,origami_profile,contacts(country),companies(country))",
          "contacts(country)",
          "companies(country)",
        ].join(","),
        `&created_at=gte.${encodeURIComponent(since)}`,
        "&limit=10000",
      ].join("")
    ),
    supabaseFetch(
      `/opportunities?select=id,origami_status,origami_profile,created_at&deleted_at=is.null&created_at=gte.${encodeURIComponent(since)}&limit=10000`
    ),
  ]);
  return { recipients: recipients || [], opportunities: opportunities || [] };
}

function buildPerformance({ recipients, opportunities, since }) {
  const totals = emptyBucket("total", "Total");
  const fitMap = new Map();
  const channelMap = new Map();
  const countryMap = new Map();
  const segmentMap = new Map();
  const templateMap = new Map();

  for (const row of recipients) {
    const profile = profileFromRecipient(row);
    addToMap(new Map([["total", totals]]), "total", "Total", row);
    addToMap(fitMap, normalizeKey(profile.cold_email_fit), labelValue(profile.cold_email_fit, "unknown"), row);
    addToMap(channelMap, normalizeKey(profile.recommended_channel), labelValue(profile.recommended_channel, "manual_review"), row);
    addToMap(countryMap, normalizeKey(countryFromRecipient(row)), labelValue(countryFromRecipient(row), "Sin pais"), row);
    addToMap(segmentMap, normalizeKey(segmentFromRecipient(row)), labelValue(segmentFromRecipient(row), "Sin segmento"), row);
    addToMap(templateMap, normalizeKey(templateFromRecipient(row)), labelValue(templateFromRecipient(row), "Sin plantilla"), row);
  }

  const analyzed = opportunities.filter((row) => row.origami_status === "completed" || Object.keys(row.origami_profile || {}).length).length;
  const highFit = opportunities.filter((row) => normalizeKey(row.origami_profile?.cold_email_fit) === "high").length;
  const manualReview = opportunities.filter((row) => normalizeKey(row.origami_profile?.recommended_channel) === "manual_review").length;
  const sentWithOrigami = recipients.filter((row) => Object.keys(profileFromRecipient(row)).length).length;

  return {
    since,
    coverage: {
      opportunities: opportunities.length,
      analyzed,
      analyzed_rate: roundedRate(analyzed, opportunities.length),
      high_fit: highFit,
      manual_review: manualReview,
      sent_with_origami: sentWithOrigami,
    },
    totals: {
      ...totals,
      reply_rate: roundedRate(totals.replies, totals.sent),
      bounce_rate: roundedRate(totals.bounced, totals.sent),
      open_rate: roundedRate(totals.opened, totals.sent),
    },
    by_cold_email_fit: finalizeBuckets(fitMap, 8),
    by_recommended_channel: finalizeBuckets(channelMap, 8),
    by_country: finalizeBuckets(countryMap, 12),
    by_segment: finalizeBuckets(segmentMap, 10),
    by_template: finalizeBuckets(templateMap, 10),
  };
}

module.exports = async function handler(req, res) {
  const user = requireAdmin(req, res);
  if (!user) return;
  res.status(410).json({ error: "Origami esta desactivado. Apollo es la fuente unica de leads." });
  return;

  try {
    const days = Math.max(7, Math.min(180, Number(req.query.days || 90)));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const rows = await loadRows(since);
    res.status(200).json(buildPerformance({ ...rows, since }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
