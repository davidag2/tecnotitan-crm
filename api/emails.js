const { requireUser } = require("./_auth");
const { emailStatus, resendFetch, senderFor } = require("./_resend");
const { insertRow, supabaseFetch, updateRows, upsertRow } = require("./_supabase");
const { runApolloSearch } = require("./apollo-search");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function cleanEmail(value) {
  return String(value || "").trim();
}

function emailAddress(value) {
  const raw = cleanEmail(value);
  const match = raw.match(/<([^>]+)>/);
  return (match ? match[1] : raw).trim().toLowerCase();
}

function cleanEmailList(value) {
  if (Array.isArray(value)) return value.map(cleanEmail).filter(Boolean);
  return String(value || "")
    .split(/[,\n;]/)
    .map(cleanEmail)
    .filter(Boolean);
}

function normalizeEmail(value) {
  return emailAddress(value);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function textToHtml(text) {
  return escapeHtml(text)
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function publicBaseUrl() {
  return String(process.env.PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://www.tecnotitanmarketing.com").replace(/\/+$/, "");
}

function unsubscribeSecret() {
  return process.env.UNSUBSCRIBE_SECRET || process.env.CRM_SESSION_SECRET || process.env.RESEND_WEBHOOK_TOKEN || "tecnotitan-local-unsubscribe";
}

function unsubscribeToken(email) {
  return crypto.createHmac("sha256", unsubscribeSecret()).update(normalizeEmail(email)).digest("hex");
}

function unsubscribeUrl(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return "";
  return `${publicBaseUrl()}/api/unsubscribe?email=${encodeURIComponent(normalized)}&token=${unsubscribeToken(normalized)}`;
}

function investorDeckAttachment() {
  const filePath = [
    path.join(process.cwd(), "public", "Tecnotitan-Investor-Deck-EN.pdf"),
    path.join(__dirname, "..", "public", "Tecnotitan-Investor-Deck-EN.pdf"),
  ].find((candidate) => fs.existsSync(candidate));
  if (!filePath) throw new Error("Investor deck PDF no esta disponible en public/.");
  return {
    filename: "Tecnotitan-Investor-Deck-EN.pdf",
    content: fs.readFileSync(filePath).toString("base64"),
  };
}

function emailAttachments(body) {
  const attachments = [];
  if (body.attach_investor_deck) attachments.push(investorDeckAttachment());
  return attachments;
}

function brandedEmailHtml(text, senderKey, unsubscribeLink = "") {
  const accent = senderKey === "investors" ? "#1f5eff" : "#16856e";
  const label = senderKey === "investors" ? "Tecnotitan Investors" : "Tecnotitan Consultoria";
  const unsubscribeHtml = unsubscribeLink
    ? `<br><br>No enviarme mas correos / Unsubscribe: <a href="${escapeHtml(unsubscribeLink)}" style="color:${accent};text-decoration:none;">click aqui</a>`
    : "";
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#13213a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #dfe6ef;border-radius:10px;overflow:hidden;">
            <tr>
              <td style="height:6px;background:${accent};"></td>
            </tr>
            <tr>
              <td style="padding:22px 26px 10px 26px;">
                <table role="presentation" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="vertical-align:middle;padding-right:12px;">
                      <img src="https://www.tecnotitanmarketing.com/tecnotitan-marketing-icon.png" width="42" height="42" alt="Tecnotitan" style="display:block;border-radius:8px;">
                    </td>
                    <td style="vertical-align:middle;">
                      <div style="font-size:18px;font-weight:700;color:#13213a;">Tecnotitan</div>
                      <div style="font-size:12px;font-weight:700;color:${accent};letter-spacing:.02em;">${label}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 26px 24px 26px;font-size:15px;line-height:1.58;color:#23334d;">
                ${textToHtml(text)}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 26px;background:#f8fafc;border-top:1px solid #e5ebf3;font-size:12px;line-height:1.5;color:#66758d;">
                <strong style="color:#13213a;">Tecnotitan</strong><br>
                Software, automatizacion e inteligencia artificial para empresas en crecimiento.<br>
                <a href="https://www.tecnotitan.com" style="color:${accent};text-decoration:none;">tecnotitan.com</a>
                ${unsubscribeHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function htmlToText(html) {
  return String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+\n/g, "\n")
    .trim();
}

function snippet(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
}

function normalizeFingerprintText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\b[\w.+-]+@[\w.-]+\.\w+\b/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\d+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function messageFingerprint(subject, text) {
  return crypto.createHash("sha256").update(`${normalizeFingerprintText(subject)}\n${normalizeFingerprintText(text)}`).digest("hex");
}

function linkCount(text) {
  return (String(text || "").match(/https?:\/\/|www\./gi) || []).length;
}

function senderDomain(from) {
  return emailAddress(from).split("@")[1] || "";
}

function expectedSenderDomain(senderKey) {
  return senderKey === "investors" ? "tecnotitaninvestors.com" : "tecnotitanconsultoria.com";
}

const WARMUP_LIMITS = [20, 40, 60, 100];
const WARMUP_STAGE_DAYS = 7;

function hasClearSignature(text) {
  const normalized = String(text || "").toLowerCase();
  return normalized.includes("david arias") && normalized.includes("tecnotitan");
}

function subjectLooksNatural(subject) {
  const value = String(subject || "").trim();
  if (value.length < 6 || value.length > 95) return false;
  if (/[!]{2,}/.test(value)) return false;
  if (/[A-ZÁÉÍÓÚÑ]{10,}/.test(value)) return false;
  const spamWords = /\b(gratis|urgente|oferta|promocion|compra ahora|gana dinero|garantizado)\b/i;
  return !spamWords.test(value);
}

function personalizationSignals(subject, text, data) {
  const content = `${subject}\n${text}`.toLowerCase();
  const signals = [
    data.contact?.full_name,
    data.contact?.full_name?.split(/\s+/)[0],
    data.company?.name,
    data.company?.industry,
    data.contact?.country || data.company?.country,
    data.contact?.title,
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase())
    .filter((value) => value.length >= 3);
  return signals.filter((value) => content.includes(value)).length;
}

function reputationIssues({ subject, text, sender, senderKey, opportunity, contact, company, duplicateFingerprint }) {
  const issues = [];
  if (!subjectLooksNatural(subject)) issues.push("Asunto poco natural o con señales de spam.");
  if (String(text || "").trim().length < 220) issues.push("Texto demasiado corto para prospeccion personalizada.");
  if (personalizationSignals(subject, text, { opportunity, contact, company }) < 2) {
    issues.push("Faltan señales de personalizacion reales.");
  }
  if (linkCount(text) > 1) issues.push("Demasiados enlaces en el cuerpo.");
  if (!hasClearSignature(text)) issues.push("Falta firma clara con David Arias y Tecnotitan.");
  if (senderDomain(sender?.from) !== expectedSenderDomain(senderKey)) {
    issues.push("Dominio remitente no coincide con el tipo de campana.");
  }
  if (duplicateFingerprint) issues.push("Mensaje demasiado parecido a otro ya preparado.");
  return issues;
}

function negativeReplyReason(text) {
  const value = String(text || "").toLowerCase();
  if (/\b(unsubscribe|remove me|do not contact|don't contact|stop emailing|not interested)\b/i.test(value)) return "negative_reply";
  if (/\b(no contactar|no me contacten|no me escriban|dar de baja|darse de baja|no estoy interesado|no interesa|no me interesa)\b/i.test(value)) {
    return "negative_reply";
  }
  return "";
}

function headerText(value) {
  if (!value) return null;
  if (Array.isArray(value)) return value.filter(Boolean).join(" ");
  return String(value);
}

async function upsertExclusion({ email, reason = "manual", source = "crm", contact_id = null, company_id = null, opportunity_id = null, note = "" }) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const row = {
    email: normalized,
    reason,
    source,
    contact_id,
    company_id,
    opportunity_id,
    note,
    active: true,
    updated_at: new Date().toISOString(),
  };
  const { payload } = await supabaseFetch("/email_exclusions?on_conflict=email", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(row),
  });
  return payload?.[0] || null;
}

async function ensureContactTag(contactId, name, color = "#2563eb") {
  if (!contactId) return null;
  const tag = await upsertRow("tags", { name, color }, ["name"]);
  if (!tag?.id) return null;
  return upsertRow("contact_tags", { contact_id: contactId, tag_id: tag.id }, ["contact_id", "tag_id"]);
}

async function findExclusion(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const { payload } = await supabaseFetch(
    `/email_exclusions?select=id,email,reason,source,note,active,created_at&email=eq.${encodeURIComponent(normalized)}&active=eq.true&limit=1`
  );
  return payload?.[0] || null;
}

async function listExclusions(user) {
  requireCampaignAdmin(user);
  const { payload } = await supabaseFetch(
    "/email_exclusions?select=id,email,reason,source,note,active,created_at&active=eq.true&order=created_at.desc&limit=200"
  );
  return payload || [];
}

async function createExclusion(user, body) {
  requireCampaignAdmin(user);
  const exclusion = await upsertExclusion({
    email: body.email,
    reason: body.reason || "manual",
    source: "crm_manual",
    note: body.note || "",
  });
  if (!exclusion) throw new Error("Email invalido para exclusion.");
  return exclusion;
}

function normalizedEventType(type) {
  return String(type || "").toLowerCase().replace(/^email\./, "");
}

function trackingTimestampColumn(eventType) {
  const event = normalizedEventType(eventType);
  const map = {
    sent: "sent_at",
    delivered: "delivered_at",
    opened: "opened_at",
    clicked: "clicked_at",
    bounced: "bounced_at",
    failed: "failed_at",
    complained: "complained_at",
    suppressed: "suppressed_at",
  };
  return map[event] || "";
}

function eventEmail(meta) {
  const raw = meta.to || meta.email || meta.recipient || meta.from || "";
  return normalizeEmail(Array.isArray(raw) ? raw[0] : raw);
}

async function findMessageForProvider(providerMessageId) {
  if (!providerMessageId) return null;
  const { payload } = await supabaseFetch(
    `/email_messages?select=id,opportunity_id,contact_id,company_id,provider_message_id,to_emails&provider_message_id=eq.${encodeURIComponent(providerMessageId)}&limit=1`
  );
  return payload?.[0] || null;
}

async function findRecipientForEvent(providerMessageId, email) {
  if (providerMessageId) {
    const { payload } = await supabaseFetch(
      `/email_campaign_recipients?select=id,campaign_id,opportunity_id,contact_id,company_id,email&provider_message_id=eq.${encodeURIComponent(providerMessageId)}&order=created_at.desc&limit=1`
    );
    if (payload?.[0]) return payload[0];
  }
  if (!email) return null;
  const { payload } = await supabaseFetch(
    `/email_campaign_recipients?select=id,campaign_id,opportunity_id,contact_id,company_id,email&email=eq.${encodeURIComponent(email)}&order=created_at.desc&limit=1`
  );
  return payload?.[0] || null;
}

async function storeTrackingEvent(req, event) {
  const meta = event.data || {};
  const providerMessageId = meta.email_id || meta.id || meta.message_id || null;
  const email = eventEmail(meta);
  const eventType = normalizedEventType(event.type);
  const occurredAt = meta.created_at || event.created_at || new Date().toISOString();
  const message = await findMessageForProvider(providerMessageId);
  const recipient = await findRecipientForEvent(providerMessageId, email);
  const eventId = req.headers["svix-id"] || `${event.type}:${providerMessageId || email}:${occurredAt}`;

  const stored = await supabaseFetch("/email_events?on_conflict=event_id", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
    body: JSON.stringify({
      event_id: eventId,
      provider: "resend",
      event_type: eventType,
      provider_message_id: providerMessageId,
      message_id: message?.id || null,
      campaign_id: recipient?.campaign_id || null,
      recipient_id: recipient?.id || null,
      opportunity_id: recipient?.opportunity_id || message?.opportunity_id || null,
      contact_id: recipient?.contact_id || message?.contact_id || null,
      company_id: recipient?.company_id || message?.company_id || null,
      email,
      url: meta.link?.url || meta.click?.url || meta.url || null,
      raw_payload: event,
      occurred_at: occurredAt,
    }),
  });

  const column = trackingTimestampColumn(event.type);
  if (column && message?.id) {
    await updateRows(
      "email_messages",
      {
        [column]: occurredAt,
        last_event_type: eventType,
        last_event_at: occurredAt,
        updated_at: new Date().toISOString(),
      },
      `id=eq.${encodeURIComponent(message.id)}`
    );
  }
  if (column && recipient?.id) {
    await updateRows(
      "email_campaign_recipients",
      {
        [column]: occurredAt,
        last_event_type: eventType,
        last_event_at: occurredAt,
        updated_at: new Date().toISOString(),
      },
      `id=eq.${encodeURIComponent(recipient.id)}`
    );
  }
  return stored.payload?.[0] || null;
}

function todayStartIso() {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return now.toISOString();
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const COUNTRY_TIME_ZONES = {
  argentina: "America/Argentina/Buenos_Aires",
  brasil: "America/Sao_Paulo",
  brazil: "America/Sao_Paulo",
  chile: "America/Santiago",
  colombia: "America/Bogota",
  mexico: "America/Mexico_City",
  peru: "America/Lima",
  "united states": "America/New_York",
  usa: "America/New_York",
  "estados unidos": "America/New_York",
  spain: "Europe/Madrid",
  espana: "Europe/Madrid",
  españa: "Europe/Madrid",
  france: "Europe/Paris",
  germany: "Europe/Berlin",
  italy: "Europe/Rome",
  "united kingdom": "Europe/London",
  uk: "Europe/London",
};

function normalizeCountryKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function leadTimeZone(lead = {}) {
  const country = normalizeCountryKey(lead.contacts?.country || lead.companies?.country);
  if (COUNTRY_TIME_ZONES[country]) return COUNTRY_TIME_ZONES[country];
  if (lead.target_region === "usa") return "America/New_York";
  if (lead.target_region === "europe") return "Europe/Madrid";
  return "America/Bogota";
}

function zonedParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour === "24" ? 0 : parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function timeZoneOffsetMs(date, timeZone) {
  const parts = zonedParts(date, timeZone);
  const utcTime = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return utcTime - date.getTime();
}

function zonedTimeToUtc(parts, timeZone) {
  const firstGuess = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute || 0, 0));
  const firstOffset = timeZoneOffsetMs(firstGuess, timeZone);
  const secondGuess = new Date(firstGuess.getTime() - firstOffset);
  const secondOffset = timeZoneOffsetMs(secondGuess, timeZone);
  return new Date(firstGuess.getTime() - secondOffset);
}

function addLocalDays(parts, days) {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days, 12, 0, 0));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

function strategicSendTime(dateValue, lead = {}, options = {}) {
  const timeZone = leadTimeZone(lead);
  let candidate = new Date(dateValue || Date.now());
  const windowStart = Number.isFinite(options.windowStartMinutes) ? options.windowStartMinutes : 9 * 60 + 15;
  const windowEnd = Number.isFinite(options.windowEndMinutes) ? options.windowEndMinutes : 11 * 60 + 45;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const local = zonedParts(candidate, timeZone);
    const localNoon = zonedTimeToUtc({ ...local, hour: 12, minute: 0 }, timeZone);
    const day = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(localNoon);
    const isWeekend = day === "Sat" || day === "Sun";
    const minutes = local.hour * 60 + local.minute;
    if (!isWeekend && minutes >= windowStart && minutes <= windowEnd) return candidate;
    const nextDay = isWeekend || minutes > windowEnd ? addLocalDays(local, 1) : local;
    const localStart = {
      year: nextDay.year,
      month: nextDay.month,
      day: nextDay.day,
      hour: Math.floor(windowStart / 60),
      minute: (windowStart % 60) + randomInteger(0, Math.min(120, Math.max(0, windowEnd - windowStart))),
    };
    candidate = zonedTimeToUtc(localStart, timeZone);
  }
  return candidate;
}

function addDaysStrategicIso(dateValue, days, lead) {
  const date = new Date(dateValue || Date.now());
  date.setUTCDate(date.getUTCDate() + Number(days || 0));
  return strategicSendTime(date, lead).toISOString();
}

function parseScheduleDate(value, timeZone = "America/Bogota") {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (/Z$|[+-]\d{2}:?\d{2}$/.test(raw)) {
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (match) {
    const [, year, month, day, hour, minute] = match.map(Number);
    return zonedTimeToUtc({ year, month, day, hour, minute }, timeZone);
  }
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function scheduleRecipients(campaignId, leads, minDelayMinutes, maxDelayMinutes, options = {}) {
  let scheduledAt = (options.startAt || new Date()).getTime();
  const endAt = options.endAt ? options.endAt.getTime() : null;
  const windowStartMinutes = options.windowStartMinutes ?? 9 * 60 + 15;
  const windowEndMinutes = options.windowEndMinutes ?? 11 * 60 + 45;
  return leads.reduce((rows, lead, index) => {
    if (index > 0) {
      scheduledAt += randomInteger(minDelayMinutes, maxDelayMinutes) * 60 * 1000;
    }
    const strategicAt = strategicSendTime(scheduledAt, lead, { windowStartMinutes, windowEndMinutes });
    scheduledAt = strategicAt.getTime();
    if (endAt && scheduledAt > endAt) return rows;
    rows.push({
      campaign_id: campaignId,
      opportunity_id: lead.id,
      contact_id: lead.contact_id,
      company_id: lead.company_id,
      email: emailAddress(lead.contacts.email),
      status: "queued",
      scheduled_at: strategicAt.toISOString(),
    });
    return rows;
  }, []);
}

function renderTemplate(template, data) {
  const fullName = data.contact?.full_name || "";
  const firstName = fullName.split(/\s+/).filter(Boolean)[0] || "";
  const leadType = data.opportunity?.lead_type === "investor" ? "Inversionista" : "Consultoria LATAM";
  const values = {
    nombre: fullName || "equipo",
    primer_nombre: firstName || fullName || "equipo",
    cargo: data.contact?.title || "",
    empresa: data.company?.name || "tu empresa",
    pais: data.contact?.country || data.company?.country || "",
    ciudad: data.contact?.city || data.company?.city || "",
    industria: data.company?.industry || "tu sector",
    tipo_lead: leadType,
    categoria: leadType,
    region: data.opportunity?.target_region || "",
    seguimiento_numero: String(data.followupStep || ""),
  };
  return String(template || "").replace(
    /\{\{\s*(nombre|primer_nombre|cargo|empresa|pais|ciudad|industria|tipo_lead|categoria|region|seguimiento_numero)\s*\}\}/gi,
    (_, key) => values[key.toLowerCase()] || ""
  );
}

function requireCampaignAdmin(user) {
  if (user.role !== "admin") throw new Error("Solo el usuario maestro puede gestionar campanas automaticas.");
}

function isAuthorizedCron(req) {
  const vercelCronSecret = process.env.CRON_SECRET || "";
  const authorization = String(req.headers.authorization || "");
  if (vercelCronSecret && authorization === `Bearer ${vercelCronSecret}`) return true;

  const configuredSecret = process.env.CAMPAIGN_CRON_SECRET || "";
  const receivedSecret = String(req.query.token || req.headers["x-cron-token"] || "").trim();
  if (configuredSecret) return receivedSecret === configuredSecret;
  return String(req.headers["user-agent"] || "").includes("vercel-cron/1.0");
}

function systemCampaignUser() {
  return {
    username: "system",
    name: "Tecnotitan Scheduler",
    email: "system@tecnotitanmarketing.com",
    role: "admin",
    db_user_id: null,
  };
}

async function loadOpportunity(id, user) {
  if (!id) return null;
  const filters = [
    "select=id,contact_id,company_id,lead_type,target_region,owner_user_id,contacts(id,full_name,email,title,country,city),companies(id,name,country,city,industry)",
    `id=eq.${encodeURIComponent(id)}`,
    "deleted_at=is.null",
    "limit=1",
  ];
  const { payload } = await supabaseFetch(`/opportunities?${filters.join("&")}`);
  const opportunity = payload?.[0] || null;
  if (!opportunity) return null;
  if (user.role !== "admin" && opportunity.owner_user_id !== user.db_user_id) return null;
  return opportunity;
}

async function findLeadByEmail(email) {
  if (!email) return {};
  const { payload: contacts } = await supabaseFetch(
    `/contacts?select=id,company_id,email,full_name,opportunities(id,company_id,contact_id,owner_user_id,lead_type,target_region)&email=ilike.${encodeURIComponent(email)}&deleted_at=is.null&limit=1`
  );
  const contact = contacts?.[0] || null;
  const opportunity = contact?.opportunities?.[0] || null;
  return {
    contact,
    opportunity,
    company_id: opportunity?.company_id || contact?.company_id || null,
  };
}

async function findOrCreateThread({ opportunity, subject }) {
  if (!opportunity?.id) {
    return insertRow("email_threads", {
      subject,
      last_message_at: new Date().toISOString(),
    });
  }
  const filters = [
    "select=*",
    `opportunity_id=eq.${encodeURIComponent(opportunity.id)}`,
    "order=last_message_at.desc",
    "limit=1",
  ].filter(Boolean);
  const { payload } = await supabaseFetch(`/email_threads?${filters.join("&")}`);
  if (payload?.[0]) return payload[0];
  return insertRow("email_threads", {
    opportunity_id: opportunity?.id || null,
    contact_id: opportunity?.contact_id || null,
    company_id: opportunity?.company_id || null,
    subject,
    last_message_at: new Date().toISOString(),
  });
}

async function loadReceivedEmail(emailId) {
  if (!emailId) return null;
  return resendFetch(`/emails/receiving/${encodeURIComponent(emailId)}`);
}

async function storeInbound(event) {
  const meta = event.data || {};
  const full = await loadReceivedEmail(meta.email_id).catch(() => null);
  const fromEmail = emailAddress(full?.from || meta.from);
  const { contact, opportunity, company_id: companyId } = await findLeadByEmail(fromEmail);
  const subject = full?.subject || meta.subject || "";
  const textBody = full?.text || htmlToText(full?.html) || "";
  const thread = await findOrCreateThread({ opportunity, subject });

  const existing = meta.email_id
    ? await supabaseFetch(`/email_messages?select=id&provider_message_id=eq.${encodeURIComponent(meta.email_id)}&limit=1`)
    : { payload: [] };
  if (existing.payload?.[0]) return existing.payload[0];

  const row = await insertRow("email_messages", {
    thread_id: thread.id,
    opportunity_id: opportunity?.id || null,
    contact_id: contact?.id || null,
    company_id: companyId || null,
    direction: "inbound",
    status: "received",
    provider_message_id: meta.email_id || full?.id || null,
    message_id: full?.message_id || meta.message_id || null,
    in_reply_to: headerText(full?.in_reply_to || meta.in_reply_to),
    references_header: headerText(full?.references || meta.references),
    from_email: full?.from || meta.from || "",
    to_emails: full?.to || meta.to || [],
    cc_emails: full?.cc || meta.cc || [],
    bcc_emails: full?.bcc || meta.bcc || [],
    subject,
    text_body: textBody,
    html_body: full?.html || null,
    snippet: snippet(textBody || subject),
    raw_payload: { event, email: full },
    attachments: full?.attachments || meta.attachments || [],
    received_at: full?.created_at || meta.created_at || event.created_at || new Date().toISOString(),
  });
  await touchThread(thread.id, subject);
  const negativeReason = negativeReplyReason(textBody || subject);
  if (negativeReason) {
    await upsertExclusion({
      email: fromEmail,
      reason: negativeReason,
      source: "inbound_reply",
      contact_id: contact?.id || null,
      company_id: companyId || null,
      opportunity_id: opportunity?.id || null,
      note: snippet(textBody || subject),
    });
  }
  if (fromEmail) {
    await updateRows(
      "email_campaign_recipients",
      {
        reply_received_at: new Date().toISOString(),
        next_followup_at: null,
        updated_at: new Date().toISOString(),
      },
      `email=eq.${encodeURIComponent(fromEmail)}&reply_received_at=is.null`
    );
  }
  if (opportunity?.id) {
    await insertRow("activities", {
      opportunity_id: opportunity.id,
      contact_id: contact?.id || null,
      company_id: companyId || null,
      activity_type: "email_inbound",
      subject: `Email recibido: ${subject || "(sin asunto)"}`,
      body: snippet(textBody || subject),
    });
  }
  return row;
}

async function storeSuppressionEvent(event) {
  const meta = event.data || {};
  const rawEmail = meta.to || meta.email || meta.recipient || meta.from || "";
  const email = Array.isArray(rawEmail) ? rawEmail[0] : rawEmail;
  const eventType = String(event.type || "").toLowerCase();
  const reason = eventType.includes("bounce") ? "bounced" : eventType.includes("complain") ? "complained" : "unsubscribe";
  return upsertExclusion({
    email,
    reason,
    source: "resend_event",
    note: eventType,
  });
}

async function handleResendWebhook(req, res) {
  const expectedToken = process.env.RESEND_WEBHOOK_TOKEN || "";
  const receivedToken = String(req.query.token || req.headers["x-webhook-token"] || "");
  if (expectedToken && receivedToken !== expectedToken) {
    res.status(401).json({ error: "Webhook no autorizado." });
    return true;
  }
  if (!expectedToken) {
    res.status(403).json({ error: "RESEND_WEBHOOK_TOKEN debe estar configurado para activar el webhook." });
    return true;
  }
  const event = req.body || {};
  const eventType = String(event.type || "").toLowerCase();
  if (eventType.startsWith("email.")) {
    await storeTrackingEvent(req, event).catch(() => null);
  }
  if (eventType.includes("bounce") || eventType.includes("complain") || eventType.includes("unsubscribe")) {
    const exclusion = await storeSuppressionEvent(event);
    res.status(200).json({ ok: true, exclusion_id: exclusion?.id || null });
    return true;
  }
  if (event.type !== "email.received") {
    res.status(200).json({ ok: true, ignored: true });
    return true;
  }
  const message = await storeInbound(event);
  res.status(200).json({ ok: true, message_id: message?.id });
  return true;
}

async function touchThread(threadId, subject) {
  if (!threadId) return;
  await updateRows(
    "email_threads",
    {
      subject: subject || null,
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    `id=eq.${encodeURIComponent(threadId)}`
  );
}

function normalizeMessage(row) {
  return {
    id: row.id,
    thread_id: row.thread_id,
    direction: row.direction,
    status: row.status,
    opportunity_id: row.opportunity_id || row.opportunities?.id || null,
    from_email: row.from_email,
    to_emails: row.to_emails || [],
    subject: row.subject || "",
    snippet: row.snippet || "",
    text_body: row.text_body || "",
    html_body: row.html_body || "",
    created_at: row.created_at,
    sent_at: row.sent_at,
    received_at: row.received_at,
    provider_message_id: row.provider_message_id,
    message_id: row.message_id || "",
    in_reply_to: row.in_reply_to || "",
    references_header: row.references_header || "",
    last_event_type: row.last_event_type || row.status || "",
    last_event_at: row.last_event_at || null,
    contact: row.contacts || null,
    company: row.companies || null,
    opportunity: row.opportunities || null,
  };
}

async function listMessages(user, req) {
  const mailbox = String(req.query.mailbox || "all");
  const q = String(req.query.q || "").trim().toLowerCase();
  const filters = [
    "select=id,thread_id,opportunity_id,direction,status,provider_message_id,message_id,in_reply_to,references_header,from_email,to_emails,subject,snippet,text_body,html_body,sent_at,received_at,created_at,last_event_type,last_event_at,opportunities(id,lead_type,target_region,owner_user_id),contacts(id,full_name,email,title),companies(id,name,domain)",
    mailbox === "inbox" ? "direction=eq.inbound" : "",
    mailbox === "sent" ? "direction=eq.outbound" : "",
    req.query.opportunity_id ? `opportunity_id=eq.${encodeURIComponent(req.query.opportunity_id)}` : "",
    "order=created_at.desc",
    "limit=200",
  ].filter(Boolean);
  const { payload } = await supabaseFetch(`/email_messages?${filters.join("&")}`);
  const rows = (payload || [])
    .filter((row) => user.role === "admin" || row.opportunities?.owner_user_id === user.db_user_id)
    .filter((row) => {
      if (!q) return true;
      return [row.from_email, ...(row.to_emails || []), row.subject, row.snippet, row.contacts?.full_name, row.companies?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  return rows.map(normalizeMessage);
}

async function campaignCounts(campaignId) {
  const { payload } = await supabaseFetch(
    `/email_campaign_recipients?select=status,sent_at,scheduled_at,reply_received_at,followup_step,next_followup_at,last_followup_sent_at,reputation_status,delivered_at,opened_at,clicked_at,bounced_at,failed_at,complained_at,suppressed_at&campaign_id=eq.${encodeURIComponent(campaignId)}&limit=5000`
  );
  const today = todayStartIso();
  const counts = {
    queued: 0,
    due: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    reputation_blocked: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    failed_events: 0,
    complained: 0,
    suppressed: 0,
    replied: 0,
    followups_due: 0,
    followups_sent: 0,
    sent_today: 0,
    total: 0,
    next_scheduled_at: null,
  };
  const now = new Date().toISOString();
  for (const row of payload || []) {
    counts.total += 1;
    counts[row.status] = (counts[row.status] || 0) + 1;
    if (row.status === "sent" && row.sent_at && row.sent_at >= today) counts.sent_today += 1;
    if (row.reputation_status === "blocked") counts.reputation_blocked += 1;
    if (row.delivered_at) counts.delivered += 1;
    if (row.opened_at) counts.opened += 1;
    if (row.clicked_at) counts.clicked += 1;
    if (row.bounced_at) counts.bounced += 1;
    if (row.failed_at) counts.failed_events += 1;
    if (row.complained_at) counts.complained += 1;
    if (row.suppressed_at) counts.suppressed += 1;
    if (row.last_followup_sent_at && row.last_followup_sent_at >= today) counts.sent_today += 1;
    if (row.reply_received_at) counts.replied += 1;
    counts.followups_sent += Number(row.followup_step || 0);
    if (row.status === "sent" && !row.reply_received_at && row.next_followup_at && row.next_followup_at <= now) counts.followups_due += 1;
    if (row.status === "queued" && row.scheduled_at <= now) counts.due += 1;
    if (row.status === "queued" && (!counts.next_scheduled_at || row.scheduled_at < counts.next_scheduled_at)) {
      counts.next_scheduled_at = row.scheduled_at;
    }
    if (row.status === "sent" && !row.reply_received_at && row.next_followup_at && (!counts.next_scheduled_at || row.next_followup_at < counts.next_scheduled_at)) {
      counts.next_scheduled_at = row.next_followup_at;
    }
  }
  return counts;
}

async function listCampaigns(user) {
  requireCampaignAdmin(user);
  const { payload } = await supabaseFetch(
    "/email_campaigns?select=id,name,campaign_type,sender_key,status,daily_limit,batch_size,min_delay_minutes,max_delay_minutes,followup_enabled,followup_delays_days,followup_subject_template,followup_body_template,subject_template,body_template,target_region,attach_investor_deck,start_at,end_at,max_recipients,schedule_timezone,send_window_start_minutes,send_window_end_minutes,last_processed_at,created_at&order=created_at.desc&limit=50"
  );
  const campaigns = [];
  for (const campaign of payload || []) {
    campaigns.push({ ...campaign, counts: await campaignCounts(campaign.id) });
  }
  return campaigns;
}

function warmupStageLimit(stage) {
  return WARMUP_LIMITS[Math.max(1, Math.min(4, Number(stage) || 1)) - 1] || 20;
}

function defaultWarmup(senderKey) {
  const key = senderKey === "investors" ? "investors" : "consulting";
  return {
    sender_key: key,
    domain: expectedSenderDomain(key),
    stage: 1,
    daily_limit: 20,
    stage_started_at: new Date().toISOString(),
    is_active: true,
  };
}

async function upsertWarmup(warmup) {
  const row = {
    sender_key: warmup.sender_key,
    domain: warmup.domain || expectedSenderDomain(warmup.sender_key),
    stage: warmup.stage || 1,
    daily_limit: warmup.daily_limit || warmupStageLimit(warmup.stage),
    stage_started_at: warmup.stage_started_at || new Date().toISOString(),
    last_advanced_at: warmup.last_advanced_at || null,
    is_active: warmup.is_active !== false,
    updated_at: new Date().toISOString(),
  };
  const { payload } = await supabaseFetch("/email_sender_warmups?on_conflict=sender_key", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(row),
  });
  return payload?.[0] || row;
}

async function loadWarmup(senderKey) {
  const key = senderKey === "investors" ? "investors" : "consulting";
  const { payload } = await supabaseFetch(`/email_sender_warmups?select=*&sender_key=eq.${encodeURIComponent(key)}&limit=1`);
  let warmup = payload?.[0] || (await upsertWarmup(defaultWarmup(key)));
  const currentStage = Math.max(1, Math.min(4, Number(warmup.stage) || 1));
  const startedAt = new Date(warmup.stage_started_at || warmup.created_at || new Date().toISOString()).getTime();
  const daysInStage = Number.isFinite(startedAt) ? (Date.now() - startedAt) / 86400000 : 0;
  if (warmup.is_active !== false && currentStage < 4 && daysInStage >= WARMUP_STAGE_DAYS) {
    const nextStage = currentStage + 1;
    warmup = await upsertWarmup({
      ...warmup,
      stage: nextStage,
      daily_limit: warmupStageLimit(nextStage),
      stage_started_at: new Date().toISOString(),
      last_advanced_at: new Date().toISOString(),
    });
  }
  return warmup;
}

async function senderSentToday(senderKey) {
  const { payload } = await supabaseFetch(
    `/email_campaigns?select=id&sender_key=eq.${encodeURIComponent(senderKey)}&limit=500`
  );
  const campaigns = payload || [];
  let total = 0;
  for (const campaign of campaigns) {
    const counts = await campaignCounts(campaign.id);
    total += counts.sent_today || 0;
  }
  return total;
}

async function warmupStatus(senderKey) {
  const warmup = await loadWarmup(senderKey);
  const sentToday = await senderSentToday(warmup.sender_key);
  const dailyLimit = warmup.is_active === false ? 100 : Number(warmup.daily_limit || 20);
  return {
    ...warmup,
    daily_limit: dailyLimit,
    sent_today: sentToday,
    remaining_today: Math.max(0, dailyLimit - sentToday),
    next_stage_limit: warmup.stage < 4 ? warmupStageLimit(Number(warmup.stage || 1) + 1) : null,
  };
}

async function listWarmups(user) {
  requireCampaignAdmin(user);
  return Promise.all(["consulting", "investors"].map((senderKey) => warmupStatus(senderKey)));
}

function emptyLeadInventoryBucket(key, label) {
  return {
    key,
    label,
    total: 0,
    with_email: 0,
    without_email: 0,
    sent_tagged: 0,
    blocked: 0,
    bounced_or_suppressed: 0,
    available_for_campaign: 0,
  };
}

function leadTypeLabel(type) {
  if (type === "investor") return "Inversionistas";
  if (type === "consulting_client") return "Consultoria LATAM";
  return type || "Sin tipo";
}

function inventoryStatus(bucket) {
  if (!bucket.available_for_campaign) return "sin_inventario";
  if (bucket.available_for_campaign < 25) return "bajo";
  return "listo";
}

async function leadInventory(user) {
  requireCampaignAdmin(user);
  const [{ payload: opportunities }, { payload: exclusions }, { payload: recipients }] = await Promise.all([
    supabaseFetch(
      "/opportunities?select=id,lead_type,target_region,deleted_at,contacts(id,email,contact_tags(tags(name))),companies(id,name,country)&deleted_at=is.null&limit=5000"
    ),
    supabaseFetch("/email_exclusions?select=email,reason,active&active=eq.true&limit=5000"),
    supabaseFetch(
      "/email_campaign_recipients?select=email,status,reputation_status,bounced_at,suppressed_at,complained_at,failed_at&limit=10000"
    ),
  ]);

  const excludedEmails = new Set((exclusions || []).map((row) => normalizeEmail(row.email)).filter(Boolean));
  const unhealthyEmails = new Set();
  for (const row of recipients || []) {
    const email = normalizeEmail(row.email);
    if (!email) continue;
    if (row.reputation_status === "blocked" || row.bounced_at || row.suppressed_at || row.complained_at) {
      unhealthyEmails.add(email);
    }
  }

  const totals = emptyLeadInventoryBucket("all", "Todas las leads");
  const byType = {};
  const byRegion = {};
  const seenOpportunityEmails = new Set();

  for (const opportunity of opportunities || []) {
    const typeKey = opportunity.lead_type || "sin_tipo";
    const regionKey = opportunity.target_region || "sin_region";
    const typeBucket = byType[typeKey] || emptyLeadInventoryBucket(typeKey, leadTypeLabel(typeKey));
    const regionBucket = byRegion[regionKey] || emptyLeadInventoryBucket(regionKey, regionKey === "sin_region" ? "Sin region" : regionKey.toUpperCase());
    const buckets = [totals, typeBucket, regionBucket];
    const email = normalizeEmail(opportunity.contacts?.email);
    const hasEmail = Boolean(email);
    const sentTagged = hasContactTag(opportunity.contacts, "Correo enviado");
    const noContactTagged = hasContactTag(opportunity.contacts, "No contactar");
    const blocked = (email && excludedEmails.has(email)) || noContactTagged;
    const bouncedOrSuppressed = email && unhealthyEmails.has(email);
    const duplicateEmail = email && seenOpportunityEmails.has(email);
    const available = hasEmail && !sentTagged && !blocked && !bouncedOrSuppressed && !duplicateEmail;

    if (email) seenOpportunityEmails.add(email);

    for (const bucket of buckets) {
      bucket.total += 1;
      if (hasEmail) bucket.with_email += 1;
      if (!hasEmail) bucket.without_email += 1;
      if (sentTagged) bucket.sent_tagged += 1;
      if (blocked) bucket.blocked += 1;
      if (bouncedOrSuppressed) bucket.bounced_or_suppressed += 1;
      if (available) bucket.available_for_campaign += 1;
    }

    byType[typeKey] = typeBucket;
    byRegion[regionKey] = regionBucket;
  }

  const enrichBucket = (bucket) => ({
    ...bucket,
    status: inventoryStatus(bucket),
    email_coverage_pct: bucket.total ? Math.round((bucket.with_email / bucket.total) * 100) : 0,
  });

  return {
    generated_at: new Date().toISOString(),
    totals: enrichBucket(totals),
    by_type: Object.values(byType).map(enrichBucket).sort((a, b) => b.total - a.total),
    by_region: Object.values(byRegion).map(enrichBucket).sort((a, b) => b.available_for_campaign - a.available_for_campaign),
  };
}

function campaignLeadRegions(campaignType, targetRegion) {
  if (campaignType !== "investor") return ["latam"];
  const regions = ["usa", "latam", "europe"];
  if (!targetRegion) return regions;
  return [targetRegion, ...regions.filter((region) => region !== targetRegion)];
}

function regionFilter(regions) {
  const cleanRegions = [...new Set((regions || []).filter(Boolean))];
  if (!cleanRegions.length) return "";
  if (cleanRegions.length === 1) return `target_region=eq.${encodeURIComponent(cleanRegions[0])}`;
  return `target_region=in.(${cleanRegions.map((region) => encodeURIComponent(region)).join(",")})`;
}

async function campaignLeadPool(campaignType, targetRegion) {
  const regions = campaignLeadRegions(campaignType, targetRegion);
  const filters = [
    "select=id,contact_id,company_id,lead_type,target_region,owner_user_id,contacts(id,apollo_person_id,first_name,last_name,full_name,email,email_status,title,country,city,linkedin_url,apollo_raw_payload,contact_tags(tags(name))),companies(id,name,domain,country,city,industry)",
    `lead_type=eq.${encodeURIComponent(campaignType)}`,
    regionFilter(regions),
    "deleted_at=is.null",
    "order=score.desc",
    "limit=500",
  ].filter(Boolean);
  const { payload } = await supabaseFetch(`/opportunities?${filters.join("&")}`);
  const seen = new Set();
  return (payload || [])
    .filter((opportunity) => !hasContactTag(opportunity.contacts, "Correo enviado"))
    .filter((opportunity) => opportunity.contacts?.email)
    .filter((opportunity) => {
      const email = emailAddress(opportunity.contacts.email);
      if (!email || seen.has(email)) return false;
      seen.add(email);
      return true;
    });
}

function hasContactTag(contact, name) {
  const normalized = String(name || "").toLowerCase();
  return (contact?.contact_tags || []).some((row) => String(row.tags?.name || "").toLowerCase() === normalized);
}

async function campaignLeadCandidatesWithoutEmail(campaignType, targetRegion, limit = 100) {
  const regions = campaignLeadRegions(campaignType, targetRegion);
  const filters = [
    "select=id,contact_id,company_id,lead_type,target_region,owner_user_id,contacts(id,apollo_person_id,first_name,last_name,full_name,email,email_status,title,country,city,linkedin_url,apollo_raw_payload,apollo_enrichment_status,contact_tags(tags(name))),companies(id,name,domain,country,city,industry)",
    `lead_type=eq.${encodeURIComponent(campaignType)}`,
    regionFilter(regions),
    "deleted_at=is.null",
    "order=score.desc",
    `limit=${limit}`,
  ].filter(Boolean);
  const { payload } = await supabaseFetch(`/opportunities?${filters.join("&")}`);
  return (payload || [])
    .filter((opportunity) => !hasContactTag(opportunity.contacts, "Correo enviado"))
    .filter((opportunity) => !opportunity.contacts?.email)
    .filter((opportunity) => opportunity.contacts?.apollo_enrichment_status !== "not_available");
}

function apolloKey() {
  if (!process.env.APOLLO_API_KEY) throw new Error("APOLLO_API_KEY no esta configurada en Vercel.");
  return process.env.APOLLO_API_KEY;
}

async function revealCampaignLeadEmail(opportunity) {
  const contact = opportunity.contacts || {};
  const company = opportunity.companies || {};
  const params = new URLSearchParams();
  if (contact.apollo_person_id) params.set("id", contact.apollo_person_id);
  if (contact.linkedin_url) params.set("linkedin_url", contact.linkedin_url);
  if (contact.first_name) params.set("first_name", contact.first_name);
  if (contact.last_name) params.set("last_name", contact.last_name);
  if (contact.full_name) params.set("name", contact.full_name);
  if (company.domain) params.set("domain", company.domain);
  if (company.name) params.set("organization_name", company.name);
  params.set("reveal_personal_emails", "true");
  params.set("reveal_phone_number", "false");

  await updateRows("contacts", { apollo_enrichment_status: "requested", updated_at: new Date().toISOString() }, `id=eq.${encodeURIComponent(contact.id)}`);
  const response = await fetch(`https://api.apollo.io/api/v1/people/match?${params.toString()}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache",
      "Content-Type": "application/json",
      "X-Api-Key": apolloKey(),
    },
  });
  const apollo = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(apollo?.message || apollo?.error || `Apollo respondio ${response.status}`);
  const person = apollo.person || {};
  const rawPayload = { ...(contact.apollo_raw_payload || {}), ...person, tecnotitan_email_revealed_at: new Date().toISOString() };
  const rows = await updateRows(
    "contacts",
    {
      apollo_person_id: contact.apollo_person_id || person.id || null,
      email: person.email || null,
      email_status: person.email_status || null,
      apollo_raw_payload: rawPayload,
      apollo_enriched_at: new Date().toISOString(),
      apollo_enrichment_status: person.email ? "enriched" : "not_available",
      updated_at: new Date().toISOString(),
    },
    `id=eq.${encodeURIComponent(contact.id)}`
  );
  await insertRow("apollo_sync_logs", {
    operation: "campaign_email_reveal",
    endpoint: "/api/v1/people/match",
    request_payload: { opportunity_id: opportunity.id },
    response_status: 200,
    response_payload: apollo,
    credits_used: person.email ? 1 : 0,
    contact_id: contact.id,
    company_id: company.id || null,
  });
  const updatedContact = rows[0] || contact;
  return updatedContact.email ? { ...opportunity, contacts: updatedContact } : null;
}

function campaignTemplateKeys(campaignType, targetRegion) {
  if (campaignType !== "investor") return ["consulting_client:latam"];
  const byRegion = {
    usa: ["investor:usa", "investor:usa_vc", "investor:usa_angels", "investor:usa_family_offices", "investor:usa_accelerators"],
    latam: ["investor:latam", "investor:latam_angels", "investor:latam_accelerators"],
    europe: ["investor:europe", "investor:europe_angels", "investor:europe_family_offices", "investor:europe_accelerators"],
  };
  const groups = campaignLeadRegions(campaignType, targetRegion).map((region) => byRegion[region] || []).filter((group) => group.length);
  const interleaved = [];
  const maxLength = Math.max(...groups.map((group) => group.length));
  for (let index = 0; index < maxLength; index += 1) {
    for (const group of groups) {
      if (group[index]) interleaved.push(group[index]);
    }
  }
  return interleaved;
}

async function buildCampaignLeadPool(user, campaignType, targetRegion, desiredCount) {
  let pool = await campaignLeadPool(campaignType, targetRegion);
  let searches = 0;
  const templateKeys = campaignTemplateKeys(campaignType, targetRegion);
  const maxSearches = Math.min(40, Math.ceil(Math.max(0, desiredCount - pool.length) / 25));
  while (pool.length < desiredCount && searches < maxSearches) {
    const templateKey = templateKeys[searches % templateKeys.length] || "consulting_client:latam";
    searches += 1;
    await runApolloSearch(user, {
      template_key: templateKey,
      per_page: 25,
      name: `Auto campana ${campaignType} ${targetRegion || "multi-region"} ${templateKey}`.trim(),
    });
    pool = await campaignLeadPool(campaignType, targetRegion);
  }

  if (pool.length >= desiredCount) return pool.slice(0, desiredCount);

  const candidates = await campaignLeadCandidatesWithoutEmail(campaignType, targetRegion, desiredCount * 2);
  for (const candidate of candidates) {
    if (pool.length >= desiredCount) break;
    const enriched = await revealCampaignLeadEmail(candidate).catch(() => null);
    if (enriched?.contacts?.email && !pool.some((lead) => emailAddress(lead.contacts.email) === emailAddress(enriched.contacts.email))) {
      pool.push(enriched);
    }
  }
  return pool.slice(0, desiredCount);
}

async function existingCampaignEmails(campaignId) {
  const { payload } = await supabaseFetch(
    `/email_campaign_recipients?select=email&campaign_id=eq.${encodeURIComponent(campaignId)}&limit=5000`
  );
  return new Set((payload || []).map((row) => normalizeEmail(row.email)).filter(Boolean));
}

async function addCampaignRecipients(user, campaign, count, startAt = new Date()) {
  const maxRecipients = Number(campaign.max_recipients || 100);
  if (count <= 0) return 0;
  const existingEmails = await existingCampaignEmails(campaign.id);
  const leads = await buildCampaignLeadPool(user, campaign.campaign_type, campaign.target_region, Math.min(count * 3, 100));
  const allowedLeads = [];
  const blockedRecipients = [];
  for (const lead of leads) {
    if (allowedLeads.length >= count) break;
    const email = normalizeEmail(lead.contacts?.email);
    if (!email || existingEmails.has(email)) continue;
    existingEmails.add(email);
    const exclusion = await findExclusion(email);
    if (exclusion) {
      blockedRecipients.push({
        campaign_id: campaign.id,
        opportunity_id: lead.id,
        contact_id: lead.contact_id,
        company_id: lead.company_id,
        email,
        status: "skipped",
        reputation_status: "blocked",
        reputation_issues: [`Lista global no contactar: ${exclusion.reason}`],
        last_error: `Lista global no contactar: ${exclusion.reason}`,
      });
    } else {
      allowedLeads.push(lead);
    }
  }
  const rows = [
    ...scheduleRecipients(campaign.id, allowedLeads, campaign.min_delay_minutes || 4, campaign.max_delay_minutes || 9, {
      startAt,
      endAt: campaign.end_at ? new Date(campaign.end_at) : null,
      windowStartMinutes: campaign.send_window_start_minutes || 7 * 60,
      windowEndMinutes: campaign.send_window_end_minutes || 17 * 60 + 45,
    }),
    ...blockedRecipients,
  ].slice(0, Math.max(0, maxRecipients));
  if (!rows.length) return 0;
  await supabaseFetch("/email_campaign_recipients", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(rows),
  });
  return rows.filter((row) => row.status === "queued").length;
}

async function createCampaign(user, body) {
  requireCampaignAdmin(user);
  const campaignType = body.campaign_type === "investor" ? "investor" : "consulting_client";
  const senderKey = body.sender_key === "investors" ? "investors" : "consulting";
  const name = String(body.name || "").trim();
  const subject = String(body.subject_template || "").trim();
  const text = String(body.body_template || "").trim();
  const targetRegion = String(body.target_region || "").trim() || null;
  const dailyLimit = clampNumber(body.daily_limit, 1, 100, 100);
  const batchSize = clampNumber(body.batch_size, 1, 25, 1);
  const minDelay = clampNumber(body.min_delay_minutes, 1, 60, 6);
  const maxDelay = Math.max(minDelay, clampNumber(body.max_delay_minutes, 1, 120, 12));
  const scheduleTimezone = String(body.schedule_timezone || "America/Bogota").trim() || "America/Bogota";
  const startAt = parseScheduleDate(body.start_at, scheduleTimezone);
  const endAt = parseScheduleDate(body.end_at, scheduleTimezone);
  const maxRecipients = clampNumber(body.queue_size || body.max_recipients, 1, 1000, 100);
  const sendWindowStart = clampNumber(body.send_window_start_minutes, 0, 1439, 9 * 60 + 15);
  const sendWindowEnd = Math.max(sendWindowStart + 1, clampNumber(body.send_window_end_minutes, 0, 1439, 11 * 60 + 45));
  const followupSubject = String(body.followup_subject_template || "Re: {{empresa}}").trim();
  const followupBody = String(
    body.followup_body_template ||
      "Hola {{primer_nombre}},\n\nTe escribo para hacer seguimiento a mi mensaje anterior.\n\nSi este tema no es prioridad ahora, lo entiendo. Si tiene sentido revisarlo, puedo enviarte una idea concreta para {{empresa}}.\n\nSaludos,\nDavid Arias\nFundador, Tecnotitan"
  ).trim();
  if (!name) throw new Error("El nombre de la campana es requerido.");
  if (!subject) throw new Error("El asunto de la campana es requerido.");
  if (!text) throw new Error("El cuerpo de la campana es requerido.");

  if (startAt && endAt && endAt <= startAt) throw new Error("La fecha final debe ser posterior al inicio.");
  const desiredQueue = Math.min(maxRecipients, clampNumber(body.initial_queue_size, 1, 100, Math.min(100, maxRecipients)));

  const campaign = await insertRow("email_campaigns", {
    name,
    campaign_type: campaignType,
    sender_key: senderKey,
    daily_limit: dailyLimit,
    batch_size: batchSize,
    min_delay_minutes: minDelay,
    max_delay_minutes: maxDelay,
    followup_enabled: body.followup_enabled !== false,
    followup_delays_days: [3, 7, 14],
    followup_subject_template: followupSubject,
    followup_body_template: followupBody,
    subject_template: subject,
    body_template: text,
    target_region: targetRegion,
    attach_investor_deck: Boolean(body.attach_investor_deck) && senderKey === "investors",
    start_at: startAt ? startAt.toISOString() : null,
    end_at: endAt ? endAt.toISOString() : null,
    max_recipients: maxRecipients,
    schedule_timezone: scheduleTimezone,
    send_window_start_minutes: sendWindowStart,
    send_window_end_minutes: sendWindowEnd,
    created_by: user.db_user_id || null,
    status: "active",
  });

  await addCampaignRecipients(user, campaign, desiredQueue, startAt || new Date());

  return { ...campaign, counts: await campaignCounts(campaign.id) };
}

async function processCampaign(user, body) {
  requireCampaignAdmin(user);
  const campaignId = String(body.campaign_id || "").trim();
  if (!campaignId) throw new Error("Selecciona una campana.");
  const { payload } = await supabaseFetch(
    `/email_campaigns?select=*&id=eq.${encodeURIComponent(campaignId)}&limit=1`
  );
  const campaign = payload?.[0];
  if (!campaign) throw new Error("Campana no encontrada.");
  if (campaign.status !== "active") throw new Error("La campana debe estar activa para enviar.");
  const nowDate = new Date();
  if (campaign.start_at && nowDate < new Date(campaign.start_at)) {
    return { sent: 0, failed: 0, skipped: 0, followups_sent: 0, waiting_until: campaign.start_at };
  }
  if (campaign.end_at && nowDate >= new Date(campaign.end_at)) {
    await updateRows("email_campaigns", { status: "completed", updated_at: nowDate.toISOString() }, `id=eq.${encodeURIComponent(campaign.id)}`);
    return { sent: 0, failed: 0, skipped: 0, followups_sent: 0, completed: true, reason: "campaign_window_ended" };
  }
  const sender = senderFor(campaign.sender_key);

  let counts = await campaignCounts(campaign.id);
  if (campaign.max_recipients && counts.sent >= campaign.max_recipients) {
    await updateRows("email_campaigns", { status: "completed", updated_at: nowDate.toISOString() }, `id=eq.${encodeURIComponent(campaign.id)}`);
    return { sent: 0, failed: 0, skipped: 0, followups_sent: 0, completed: true, reason: "max_recipients_reached" };
  }
  const queuedAndSent = (counts.queued || 0) + (counts.sent || 0);
  const remainingToQueue = campaign.max_recipients ? Math.max(0, campaign.max_recipients - queuedAndSent) : 0;
  if (remainingToQueue > 0 && (counts.queued || 0) < Math.max(5, campaign.batch_size || 1)) {
    await addCampaignRecipients(user, campaign, Math.min(25, remainingToQueue), nowDate);
    counts = await campaignCounts(campaign.id);
  }
  const warmup = await warmupStatus(campaign.sender_key);
  const campaignRemainingToday = Math.max(0, campaign.daily_limit - counts.sent_today);
  const campaignRemainingTotal = campaign.max_recipients ? Math.max(0, campaign.max_recipients - counts.sent) : campaign.daily_limit;
  const remainingToday = Math.min(campaignRemainingToday, warmup.remaining_today);
  const sendLimit = Math.min(campaignRemainingTotal, remainingToday, campaign.batch_size, clampNumber(body.max_send, 1, 25, campaign.batch_size));
  if (!sendLimit) {
    return {
      sent: 0,
      failed: 0,
      remaining_today: 0,
      warmup,
      message: warmup.remaining_today <= 0 ? "Limite diario del remitente alcanzado." : "Limite diario de la campana alcanzado.",
    };
  }

  const now = new Date().toISOString();
  const { payload: campaignFingerprints } = await supabaseFetch(
    `/email_campaign_recipients?select=id,message_fingerprint&campaign_id=eq.${encodeURIComponent(campaign.id)}&message_fingerprint=not.is.null&limit=5000`
  );
  const existingFingerprints = new Set((campaignFingerprints || []).map((row) => row.message_fingerprint).filter(Boolean));
  const { payload: recipients } = await supabaseFetch(
    `/email_campaign_recipients?select=id,email,opportunity_id,status,opportunities(id,lead_type,target_region,contacts(id,full_name,email,title,country,city),companies(id,name,country,city,industry))&campaign_id=eq.${encodeURIComponent(campaign.id)}&status=eq.queued&scheduled_at=lte.${encodeURIComponent(now)}&order=scheduled_at.asc&limit=${sendLimit}`
  );

  let sent = 0;
  let failed = 0;
  let followupsSent = 0;
  for (const recipient of recipients || []) {
    const opportunity = recipient.opportunities || {};
    const subject = renderTemplate(campaign.subject_template, { opportunity, contact: opportunity.contacts, company: opportunity.companies });
    const text = renderTemplate(campaign.body_template, { opportunity, contact: opportunity.contacts, company: opportunity.companies });
    const fingerprint = messageFingerprint(subject, text);
    const duplicate = existingFingerprints.has(fingerprint);
    const issues = campaign.reputation_checks_enabled
      ? reputationIssues({
          subject,
          text,
          sender,
          senderKey: campaign.sender_key,
          opportunity,
          contact: opportunity.contacts,
          company: opportunity.companies,
          duplicateFingerprint: duplicate,
        })
      : [];
    if (issues.length) {
      await updateRows(
        "email_campaign_recipients",
        {
          status: "skipped",
          reputation_status: "blocked",
          reputation_issues: issues,
          message_fingerprint: fingerprint,
          last_error: issues.join(" "),
          updated_at: new Date().toISOString(),
        },
        `id=eq.${encodeURIComponent(recipient.id)}`
      );
      failed += 1;
      continue;
    }
    try {
      const message = await sendEmail(user, {
        opportunity_id: recipient.opportunity_id,
        sender_key: campaign.sender_key,
        to: recipient.email,
        subject,
        text,
        attach_investor_deck: Boolean(campaign.attach_investor_deck),
      });
      await updateRows(
        "email_campaign_recipients",
        {
          status: "sent",
          reputation_status: "passed",
          reputation_issues: [],
          message_fingerprint: fingerprint,
          sent_at: new Date().toISOString(),
          next_followup_at:
            campaign.followup_enabled && campaign.followup_delays_days?.[0]
              ? addDaysStrategicIso(new Date().toISOString(), campaign.followup_delays_days[0], opportunity)
              : null,
          provider_message_id: message.provider_message_id || null,
          last_error: null,
          updated_at: new Date().toISOString(),
        },
        `id=eq.${encodeURIComponent(recipient.id)}`
      );
      sent += 1;
      existingFingerprints.add(fingerprint);
    } catch (error) {
      await updateRows(
        "email_campaign_recipients",
        {
          status: "failed",
          last_error: error.message,
          updated_at: new Date().toISOString(),
        },
        `id=eq.${encodeURIComponent(recipient.id)}`
      );
      failed += 1;
    }
  }

  const remainingAfterInitial = Math.max(0, sendLimit - sent - failed);
  if (remainingAfterInitial > 0 && campaign.followup_enabled) {
    const { payload: followups } = await supabaseFetch(
      `/email_campaign_recipients?select=id,email,opportunity_id,followup_step,next_followup_at,opportunities(id,lead_type,target_region,contacts(id,full_name,email,title,country,city),companies(id,name,country,city,industry))&campaign_id=eq.${encodeURIComponent(campaign.id)}&status=eq.sent&reply_received_at=is.null&next_followup_at=lte.${encodeURIComponent(now)}&order=next_followup_at.asc&limit=${remainingAfterInitial}`
    );
    for (const recipient of followups || []) {
      const opportunity = recipient.opportunities || {};
      const nextStep = Number(recipient.followup_step || 0) + 1;
      const subject = renderTemplate(campaign.followup_subject_template, {
        opportunity,
        contact: opportunity.contacts,
        company: opportunity.companies,
        followupStep: nextStep,
      });
      const text = renderTemplate(campaign.followup_body_template, {
        opportunity,
        contact: opportunity.contacts,
        company: opportunity.companies,
        followupStep: nextStep,
      });
      const fingerprint = messageFingerprint(subject, text);
      const issues = campaign.reputation_checks_enabled
        ? reputationIssues({
            subject,
            text,
            sender,
            senderKey: campaign.sender_key,
            opportunity,
            contact: opportunity.contacts,
            company: opportunity.companies,
            duplicateFingerprint: existingFingerprints.has(fingerprint),
          })
        : [];
      if (issues.length) {
        await updateRows(
          "email_campaign_recipients",
          {
            reputation_status: "blocked",
            reputation_issues: issues,
            message_fingerprint: fingerprint,
            next_followup_at: null,
            last_error: issues.join(" "),
            updated_at: new Date().toISOString(),
          },
          `id=eq.${encodeURIComponent(recipient.id)}`
        );
        failed += 1;
        continue;
      }
      try {
        const message = await sendEmail(user, {
          opportunity_id: recipient.opportunity_id,
          sender_key: campaign.sender_key,
          to: recipient.email,
          subject,
          text,
          attach_investor_deck: Boolean(campaign.attach_investor_deck),
        });
        const nextDelay = campaign.followup_delays_days?.[nextStep] || null;
        await updateRows(
          "email_campaign_recipients",
          {
            followup_step: nextStep,
            next_followup_at: nextDelay ? addDaysStrategicIso(new Date().toISOString(), nextDelay, opportunity) : null,
            last_followup_sent_at: new Date().toISOString(),
            reputation_status: "passed",
            reputation_issues: [],
            message_fingerprint: fingerprint,
            provider_message_id: message.provider_message_id || null,
            last_error: null,
            updated_at: new Date().toISOString(),
          },
          `id=eq.${encodeURIComponent(recipient.id)}`
        );
        followupsSent += 1;
        existingFingerprints.add(fingerprint);
      } catch (error) {
        await updateRows(
          "email_campaign_recipients",
          {
            last_error: error.message,
            updated_at: new Date().toISOString(),
          },
          `id=eq.${encodeURIComponent(recipient.id)}`
        );
        failed += 1;
      }
    }
  }

  await updateRows(
    "email_campaigns",
    { last_processed_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    `id=eq.${encodeURIComponent(campaign.id)}`
  );

  const nextCounts = await campaignCounts(campaign.id);
  const nextWarmup = await warmupStatus(campaign.sender_key);
  if (campaign.max_recipients && nextCounts.sent >= campaign.max_recipients) {
    await updateRows("email_campaigns", { status: "completed", updated_at: new Date().toISOString() }, `id=eq.${encodeURIComponent(campaign.id)}`);
  }
  return {
    sent,
    followups_sent: followupsSent,
    failed,
    remaining_today: Math.min(Math.max(0, campaign.daily_limit - nextCounts.sent_today), nextWarmup.remaining_today),
    warmup: nextWarmup,
    counts: nextCounts,
  };
}

async function processDueCampaigns() {
  const { payload } = await supabaseFetch(
    "/email_campaigns?select=id,name,status&status=eq.active&order=created_at.asc&limit=20"
  );
  const user = systemCampaignUser();
  const results = [];
  for (const campaign of payload || []) {
    try {
      const result = await processCampaign(user, { campaign_id: campaign.id });
      results.push({ campaign_id: campaign.id, name: campaign.name, ...result });
    } catch (error) {
      results.push({ campaign_id: campaign.id, name: campaign.name, sent: 0, failed: 0, error: error.message });
    }
  }
  return {
    campaigns_checked: results.length,
    sent: results.reduce((sum, item) => sum + (item.sent || 0), 0),
    failed: results.reduce((sum, item) => sum + (item.failed || 0), 0),
    results,
  };
}

function campaignReportDate() {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date());
}

function emptyRecentStats() {
  return {
    sent: 0,
    followups_sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    failed: 0,
    complained: 0,
    replied: 0,
  };
}

function countRecentCampaignActivity(rows = [], sinceIso) {
  const byCampaign = new Map();
  for (const row of rows) {
    const stats = byCampaign.get(row.campaign_id) || emptyRecentStats();
    if (row.sent_at && row.sent_at >= sinceIso) stats.sent += 1;
    if (row.last_followup_sent_at && row.last_followup_sent_at >= sinceIso) stats.followups_sent += 1;
    if (row.delivered_at && row.delivered_at >= sinceIso) stats.delivered += 1;
    if (row.opened_at && row.opened_at >= sinceIso) stats.opened += 1;
    if (row.clicked_at && row.clicked_at >= sinceIso) stats.clicked += 1;
    if (row.bounced_at && row.bounced_at >= sinceIso) stats.bounced += 1;
    if (row.failed_at && row.failed_at >= sinceIso) stats.failed += 1;
    if (row.complained_at && row.complained_at >= sinceIso) stats.complained += 1;
    if (row.reply_received_at && row.reply_received_at >= sinceIso) stats.replied += 1;
    byCampaign.set(row.campaign_id, stats);
  }
  return byCampaign;
}

function sumStats(items, field) {
  return (items || []).reduce((sum, item) => sum + Number(item[field] || 0), 0);
}

function buildCampaignReport({ campaigns, warmups, recentByCampaign, apolloLogs, sinceIso }) {
  const recentTotals = campaigns.reduce((totals, campaign) => {
    const recent = recentByCampaign.get(campaign.id) || emptyRecentStats();
    for (const key of Object.keys(totals)) totals[key] += Number(recent[key] || 0);
    return totals;
  }, emptyRecentStats());
  const apolloCredits = sumStats(apolloLogs, "credits_used");
  const totalCounts = campaigns.reduce(
    (totals, campaign) => {
      const counts = campaign.counts || {};
      totals.queued += Number(counts.queued || 0);
      totals.sent += Number(counts.sent || 0);
      totals.delivered += Number(counts.delivered || 0);
      totals.opened += Number(counts.opened || 0);
      totals.clicked += Number(counts.clicked || 0);
      totals.replied += Number(counts.replied || 0);
      totals.bounced += Number(counts.bounced || 0);
      totals.failed += Number(counts.failed_events || counts.failed || 0);
      totals.blocked += Number(counts.reputation_blocked || 0);
      return totals;
    },
    { queued: 0, sent: 0, delivered: 0, opened: 0, clicked: 0, replied: 0, bounced: 0, failed: 0, blocked: 0 }
  );
  const lines = [
    `Reporte diario de campanas Tecnotitan`,
    `Fecha de envio: ${campaignReportDate()}`,
    `Ventana analizada: ultimas 24 horas desde ${new Date(sinceIso).toLocaleString("es-CO", { timeZone: "America/Bogota" })}`,
    "",
    "Resumen ultimas 24 horas",
    `- Enviados iniciales: ${recentTotals.sent}`,
    `- Follow-ups enviados: ${recentTotals.followups_sent}`,
    `- Entregados: ${recentTotals.delivered}`,
    `- Aperturas: ${recentTotals.opened}`,
    `- Clics: ${recentTotals.clicked}`,
    `- Respuestas: ${recentTotals.replied}`,
    `- Rebotes: ${recentTotals.bounced}`,
    `- Errores: ${recentTotals.failed}`,
    `- Quejas spam: ${recentTotals.complained}`,
    `- Creditos Apollo usados: ${apolloCredits}`,
    "",
    "Acumulado total de campanas",
    `- Campanas totales: ${campaigns.length}`,
    `- En cola: ${totalCounts.queued}`,
    `- Enviados: ${totalCounts.sent}`,
    `- Entregados: ${totalCounts.delivered}`,
    `- Aperturas: ${totalCounts.opened}`,
    `- Clics: ${totalCounts.clicked}`,
    `- Respuestas: ${totalCounts.replied}`,
    `- Rebotes: ${totalCounts.bounced}`,
    `- Fallidos/errores: ${totalCounts.failed}`,
    `- Bloqueados por reputacion/no contactar: ${totalCounts.blocked}`,
    "",
    "Calentamiento por remitente",
    ...warmups.map((warmup) => `- ${warmup.domain}: etapa ${warmup.stage}, limite ${warmup.daily_limit}/dia, usados hoy ${warmup.sent_today}, restantes ${warmup.remaining_today}`),
    "",
    "Detalle por campana",
  ];

  for (const campaign of campaigns) {
    const counts = campaign.counts || {};
    const recent = recentByCampaign.get(campaign.id) || emptyRecentStats();
    lines.push(
      "",
      `${campaign.name}`,
      `- Tipo: ${campaign.campaign_type} | Region: ${campaign.target_region || "todas"} | Remitente: ${campaign.sender_key} | Estado: ${campaign.status}`,
      `- Cola: ${counts.queued || 0} | Listos ahora: ${(counts.due || 0) + (counts.followups_due || 0)} | Proximo envio: ${counts.next_scheduled_at || "sin pendientes"}`,
      `- Total enviados: ${counts.sent || 0} | Follow-ups: ${counts.followups_sent || 0} | Respuestas: ${counts.replied || 0}`,
      `- Tracking total: entregados ${counts.delivered || 0}, abiertos ${counts.opened || 0}, clics ${counts.clicked || 0}, rebotes ${counts.bounced || 0}, errores ${counts.failed_events || 0}`,
      `- Ultimas 24h: enviados ${recent.sent}, follow-ups ${recent.followups_sent}, entregados ${recent.delivered}, abiertos ${recent.opened}, clics ${recent.clicked}, respuestas ${recent.replied}, rebotes ${recent.bounced}, errores ${recent.failed}`
    );
  }

  lines.push("", "Este correo fue generado automaticamente por Tecnotitan CRM.");
  return lines.join("\n");
}

async function sendDailyCampaignReport() {
  const user = systemCampaignUser();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const campaigns = await listCampaigns(user);
  const warmups = await listWarmups(user);
  const [{ payload: recentRecipients }, { payload: apolloLogs }] = await Promise.all([
    supabaseFetch(
      `/email_campaign_recipients?select=campaign_id,status,sent_at,last_followup_sent_at,delivered_at,opened_at,clicked_at,bounced_at,failed_at,complained_at,reply_received_at,updated_at&updated_at=gte.${encodeURIComponent(since)}&limit=10000`
    ),
    supabaseFetch(`/apollo_sync_logs?select=operation,credits_used,created_at&created_at=gte.${encodeURIComponent(since)}&limit=10000`),
  ]);
  const recentByCampaign = countRecentCampaignActivity(recentRecipients || [], since);
  const text = buildCampaignReport({ campaigns, warmups, recentByCampaign, apolloLogs: apolloLogs || [], sinceIso: since });
  const message = await sendEmail(user, {
    sender_key: "consulting",
    to: "info@tecnotitan.com",
    subject: `Reporte diario de campanas Tecnotitan - ${new Date().toLocaleDateString("es-CO", { timeZone: "America/Bogota" })}`,
    text,
    include_unsubscribe: false,
  });
  return { ok: true, to: "info@tecnotitan.com", campaigns: campaigns.length, message_id: message.provider_message_id || message.id || null };
}

async function sendEmail(user, body) {
  let opportunity = await loadOpportunity(body.opportunity_id, user);
  const to = cleanEmailList(body.to || opportunity?.contacts?.email);
  const subject = String(body.subject || "").trim();
  const text = String(body.text || "").trim();
  if (!to.length) throw new Error("Escribe un destinatario o selecciona una lead con email.");
  if (!subject) throw new Error("El asunto es requerido.");
  if (!text) throw new Error("El mensaje no puede estar vacio.");
  for (const recipientEmail of to) {
    const exclusion = await findExclusion(recipientEmail);
    if (exclusion) throw new Error(`Email en lista de no contactar: ${recipientEmail} (${exclusion.reason}).`);
  }
  if (!opportunity && to[0]) {
    const linked = await findLeadByEmail(to[0]);
    if (linked.opportunity && (user.role === "admin" || linked.opportunity.owner_user_id === user.db_user_id)) {
      opportunity = linked.opportunity;
      opportunity.contact_id = linked.contact?.id || opportunity.contact_id;
      opportunity.company_id = linked.company_id || opportunity.company_id;
      opportunity.contacts = linked.contact || null;
    }
  }

  const sender = senderFor(body.sender_key, opportunity);
  if (!sender?.from) throw new Error("Configura RESEND_FROM_CONSULTING o RESEND_FROM_INVESTORS en Vercel.");
  const shouldIncludeUnsubscribe = body.include_unsubscribe !== false && !to.every((email) => normalizeEmail(email).endsWith("@tecnotitan.com"));
  const unsubscribeLink = shouldIncludeUnsubscribe ? unsubscribeUrl(to[0]) : "";
  const html = brandedEmailHtml(text, sender.key, unsubscribeLink);

  const thread = await findOrCreateThread({ opportunity, subject });
  const headers = {};
  if (body.in_reply_to) headers["In-Reply-To"] = body.in_reply_to;
  if (body.references) headers.References = body.references;
  if (unsubscribeLink) headers["List-Unsubscribe"] = `<${unsubscribeLink}>`;
  if (unsubscribeLink) headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  const tags = [{ name: "crm", value: "tecnotitan" }];
  if (opportunity?.id) {
    tags.push({ name: "opportunity", value: opportunity.id.replace(/-/g, "_").slice(0, 256) });
  }
  const attachments = emailAttachments(body);

  const data = await resendFetch("/emails", {
    method: "POST",
    body: JSON.stringify({
      from: sender.from,
      to,
      cc: cleanEmailList(body.cc),
      bcc: cleanEmailList(body.bcc),
      subject,
      text,
      html,
      headers,
      tags,
      ...(attachments.length ? { attachments } : {}),
    }),
  });

  const saved = await insertRow("email_messages", {
    thread_id: thread.id,
    opportunity_id: opportunity?.id || null,
    contact_id: opportunity?.contact_id || null,
    company_id: opportunity?.company_id || null,
    user_id: user.db_user_id || null,
    direction: "outbound",
    status: "sent",
    provider_message_id: data.id,
    from_email: sender.from,
    to_emails: to,
    cc_emails: cleanEmailList(body.cc),
    bcc_emails: cleanEmailList(body.bcc),
    subject,
    text_body: text,
    html_body: html,
    in_reply_to: headerText(body.in_reply_to),
    references_header: headerText(body.references),
    snippet: snippet(text),
    attachments: attachments.map((attachment) => ({ filename: attachment.filename })),
    raw_payload: data,
    sent_at: new Date().toISOString(),
  });
  if (opportunity?.contact_id) {
    await ensureContactTag(opportunity.contact_id, "Correo enviado", "#0f766e");
  }
  await touchThread(thread.id, subject);
  if (opportunity?.id) {
    await insertRow("activities", {
      opportunity_id: opportunity.id,
      contact_id: opportunity.contact_id,
      company_id: opportunity.company_id,
      user_id: user.db_user_id || null,
      activity_type: "email",
      subject: `Email enviado: ${subject}`,
      body: snippet(text),
    });
  }
  return normalizeMessage({ ...saved, contacts: opportunity?.contacts, companies: opportunity?.companies, opportunities: opportunity });
}

module.exports = async function handler(req, res) {
  if (req.method === "POST" && req.query.webhook === "resend") {
    try {
      await handleResendWebhook(req, res);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
    return;
  }

  if (req.method === "GET" && req.query.cron === "campaigns") {
    try {
      if (!isAuthorizedCron(req)) {
        res.status(401).json({ error: "Cron no autorizado." });
        return;
      }
      res.status(200).json(await processDueCampaigns());
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
    return;
  }

  if (req.method === "GET" && req.query.cron === "campaign_report") {
    try {
      if (!isAuthorizedCron(req)) {
        res.status(401).json({ error: "Cron no autorizado." });
        return;
      }
      res.status(200).json(await sendDailyCampaignReport());
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
    return;
  }

  const user = requireUser(req, res);
  if (!user) return;

  try {
    if (req.method === "GET") {
      if (req.query.mode === "exclusions") {
        res.status(200).json({ exclusions: await listExclusions(user) });
        return;
      }
      if (req.query.mode === "campaigns") {
        res.status(200).json({ campaigns: await listCampaigns(user), warmups: await listWarmups(user) });
        return;
      }
      if (req.query.mode === "lead_inventory") {
        res.status(200).json({ inventory: await leadInventory(user) });
        return;
      }
      res.status(200).json({ status: emailStatus(), messages: await listMessages(user, req) });
      return;
    }
    if (req.method === "POST") {
      if (req.body?.action === "create_campaign") {
        res.status(201).json({ campaign: await createCampaign(user, req.body) });
        return;
      }
      if (req.body?.action === "create_exclusion") {
        res.status(201).json({ exclusion: await createExclusion(user, req.body) });
        return;
      }
      if (req.body?.action === "process_campaign") {
        res.status(200).json(await processCampaign(user, req.body));
        return;
      }
      const message = await sendEmail(user, req.body || {});
      res.status(201).json({ message });
      return;
    }
    res.status(405).json({ error: "Metodo no permitido." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
