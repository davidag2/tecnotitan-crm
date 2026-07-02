const { requireUser } = require("./_auth");
const { emailStatus, resendFetch, senderFor } = require("./_resend");
const { scoreLead } = require("./_scoring");
const { insertRow, supabaseFetch, updateRows, upsertRow } = require("./_supabase");
const { runApolloSearch } = require("./apollo-search");
const { createAgentRun, getRun, origamiConfigured, sourceTableId } = require("./_origami");
const crypto = require("crypto");
const dns = require("dns").promises;
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
const BOUNCE_CONTROL_MIN_SENT = 20;
const BOUNCE_THROTTLE_RATE = 0.03;
const BOUNCE_PAUSE_RATE = 0.05;

const CAMPAIGN_SEGMENTS = {
  all_investors: {
    key: "all_investors",
    label: "Inversionistas general",
    target_region: null,
    templates: [],
  },
  usa_vcs: {
    key: "usa_vcs",
    label: "VCs USA",
    target_region: "usa",
    templates: ["investor:usa:vcs"],
  },
  usa_angels: {
    key: "usa_angels",
    label: "Angels USA",
    target_region: "usa",
    templates: ["investor:usa:angels"],
  },
  latam_investors: {
    key: "latam_investors",
    label: "LATAM investors",
    target_region: "latam",
    templates: ["investor:latam:funds", "investor:latam_angels"],
  },
  europe_funds: {
    key: "europe_funds",
    label: "Europe funds",
    target_region: "europe",
    templates: ["investor:europe:vcs", "investor:europe_family_offices"],
  },
  strategic_investors: {
    key: "strategic_investors",
    label: "Strategic investors",
    target_region: null,
    templates: [
      "investor:usa_family_offices",
      "investor:europe_family_offices",
      "investor:usa_accelerators",
      "investor:europe_accelerators",
      "investor:latam_accelerators",
    ],
  },
};

function campaignSegment(key, campaignType = "investor") {
  if (campaignType !== "investor") {
    return {
      key: "consulting_latam",
      label: "Consultoria LATAM",
      target_region: "latam",
      templates: ["consulting_client:latam"],
    };
  }
  return CAMPAIGN_SEGMENTS[key] || CAMPAIGN_SEGMENTS.all_investors;
}

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

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "tempmail.com",
  "throwawaymail.com",
  "yopmail.com",
]);
const EMAIL_MX_CACHE = new Map();
const EMAIL_VALIDATION_CACHE = new Map();

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

function emailFormatIssue(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return "Email vacio o invalido.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalized)) return "Formato de email invalido.";
  const [local, domain] = normalized.split("@");
  if (!local || local.length > 64) return "Usuario de email invalido.";
  if (!domain || domain.length > 253 || domain.includes("..")) return "Dominio de email invalido.";
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) return "Dominio temporal o desechable.";
  return "";
}

function emailValidationProvider() {
  return String(process.env.EMAIL_VALIDATION_PROVIDER || "").trim().toLowerCase();
}

function emailValidationApiKey(provider) {
  if (provider === "zerobounce") return process.env.ZEROBOUNCE_API_KEY || process.env.EMAIL_VALIDATION_API_KEY || "";
  if (provider === "neverbounce") return process.env.NEVERBOUNCE_API_KEY || process.env.EMAIL_VALIDATION_API_KEY || "";
  if (provider === "millionverifier") return process.env.MILLIONVERIFIER_API_KEY || process.env.EMAIL_VALIDATION_API_KEY || "";
  return "";
}

function emailValidationTimeoutMs() {
  return clampNumber(process.env.EMAIL_VALIDATION_TIMEOUT_MS, 1000, 10000, 4500);
}

function emailValidationUrl(provider, email, apiKey) {
  const encodedEmail = encodeURIComponent(email);
  const encodedKey = encodeURIComponent(apiKey);
  if (provider === "zerobounce") return `https://api.zerobounce.net/v2/validate?api_key=${encodedKey}&email=${encodedEmail}`;
  if (provider === "neverbounce") return `https://api.neverbounce.com/v4/single/check?key=${encodedKey}&email=${encodedEmail}`;
  if (provider === "millionverifier") return `https://api.millionverifier.com/api/v3/?api=${encodedKey}&email=${encodedEmail}&timeout=10`;
  return "";
}

async function fetchJsonWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.message || payload?.error || `Validador respondio ${response.status}`);
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeExternalEmailValidation(provider, payload = {}) {
  const rawStatus = String(payload.status || payload.result || payload.quality || payload.valid || "").toLowerCase();
  const rawSubStatus = String(payload.sub_status || payload.subStatus || payload.reason || payload.error || "").toLowerCase();
  const status = rawStatus || "unknown";
  const validStatuses = new Set(["valid", "ok", "true", "deliverable"]);
  const riskyStatuses = new Set([
    "invalid",
    "do_not_mail",
    "spamtrap",
    "abuse",
    "disposable",
    "catch-all",
    "catchall",
    "unknown",
    "undeliverable",
    "bad",
    "error",
  ]);
  const deliverable = validStatuses.has(status);
  const risky =
    !deliverable ||
    riskyStatuses.has(status) ||
    riskyStatuses.has(rawSubStatus) ||
    Boolean(payload.disposable || payload.free_email === false && status === "unknown");
  return {
    provider,
    status,
    sub_status: rawSubStatus,
    deliverable,
    risky,
    raw: payload,
  };
}

async function validateEmailExternally(email) {
  const normalized = normalizeEmail(email);
  const provider = emailValidationProvider();
  const apiKey = emailValidationApiKey(provider);
  if (!normalized || !provider || !apiKey) return null;
  const cacheKey = `${provider}:${normalized}`;
  if (EMAIL_VALIDATION_CACHE.has(cacheKey)) return EMAIL_VALIDATION_CACHE.get(cacheKey);
  const url = emailValidationUrl(provider, normalized, apiKey);
  if (!url) return null;
  const result = await fetchJsonWithTimeout(url, emailValidationTimeoutMs())
    .then((payload) => normalizeExternalEmailValidation(provider, payload))
    .catch((error) => ({
      provider,
      status: "validation_error",
      sub_status: error.message,
      deliverable: false,
      risky: true,
      raw: null,
    }));
  EMAIL_VALIDATION_CACHE.set(cacheKey, result);
  return result;
}

async function emailQualityIssues(email, contact = {}) {
  const issues = [];
  const formatIssue = emailFormatIssue(email);
  if (formatIssue) return [formatIssue];
  const normalized = normalizeEmail(email);
  const domain = normalized.split("@")[1];
  if (emailStatusLooksRisky(contact.email_status)) {
    issues.push(`Email dudoso segun Apollo: ${contact.email_status}.`);
  }
  try {
    let mxRecords = EMAIL_MX_CACHE.get(domain);
    if (!mxRecords) {
      mxRecords = await Promise.race([
        dns.resolveMx(domain),
        new Promise((_, reject) => setTimeout(() => reject(new Error("mx_timeout")), 1800)),
      ]);
      EMAIL_MX_CACHE.set(domain, mxRecords);
    }
    if (!mxRecords?.length) issues.push("Dominio sin registros MX verificables.");
  } catch (_) {
    issues.push("No se pudo verificar MX del dominio.");
  }
  const externalValidation = await validateEmailExternally(normalized);
  if (externalValidation?.risky) {
    const status = [externalValidation.status, externalValidation.sub_status].filter(Boolean).join(" / ");
    issues.push(`Validador externo ${externalValidation.provider}: ${status}.`);
  }
  return issues;
}

async function markDoubtfulEmail(contactId, issues) {
  if (!contactId || !issues?.length) return;
  await ensureContactTag(contactId, "Email dudoso", "#f59e0b").catch(() => null);
  await updateRows(
    "contacts",
    {
      email_status: "doubtful",
      updated_at: new Date().toISOString(),
    },
    `id=eq.${encodeURIComponent(contactId)}`
  ).catch(() => null);
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
  const dailyLimit = Math.max(0, Number(options.dailyLimit || 0));
  let scheduledToday = 0;
  return leads.reduce((rows, lead, index) => {
    if (dailyLimit && scheduledToday >= dailyLimit) {
      const nextDay = new Date(scheduledAt);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      nextDay.setUTCHours(0, 0, 0, 0);
      scheduledAt = nextDay.getTime();
      scheduledToday = 0;
    } else if (index > 0) {
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
    scheduledToday += 1;
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

const SPANISH_COUNTRIES = new Set([
  "argentina",
  "bolivia",
  "chile",
  "colombia",
  "costa rica",
  "cuba",
  "dominican republic",
  "ecuador",
  "el salvador",
  "guatemala",
  "honduras",
  "mexico",
  "nicaragua",
  "panama",
  "paraguay",
  "peru",
  "spain",
  "uruguay",
  "venezuela",
]);

const PORTUGUESE_COUNTRIES = new Set(["brazil", "brasil", "portugal"]);

function normalizeCountry(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function leadLanguage(data = {}) {
  const country = normalizeCountry(data.contact?.country || data.company?.country);
  const region = String(data.opportunity?.target_region || "").toLowerCase();
  if (PORTUGUESE_COUNTRIES.has(country)) return "pt";
  if (SPANISH_COUNTRIES.has(country) || region === "latam") return "es";
  return "en";
}

const INVESTOR_LANGUAGE_TEMPLATES = {
  es: {
    subject: "Tecnotitan | plataforma de implementacion de IA para LATAM",
    body:
      "Hola {{primer_nombre}},\n\nSoy David Arias, fundador de Tecnotitan. Estamos construyendo una compania de tecnologia aplicada desde Colombia para empresas que necesitan implementacion real de IA, no mas presentaciones.\n\nEl problema que vemos en America Latina es claro: procesos manuales, datos dispersos, presion por adoptar IA y equipos sin capacidad interna para convertir ideas en productos funcionales.\n\nTecnotitan entra por dolores operativos concretos. Diagnosticamos, construimos, implementamos y luego convertimos casos de uso recurrentes en propiedad intelectual, conocimiento sectorial y playbooks operativos. El modelo combina ingresos por servicios hoy y software/licenciamiento escalable manana.\n\nEstamos levantando una ronda pre-seed de US$500K para financiar 18 meses de pilotos pagos, ingenieria de producto, delivery de IA y una plataforma repetible.\n\nVi tu relacion con {{industria}} en {{pais}} y pense que Tecnotitan podria ser relevante para tu tesis alrededor de IA, infraestructura de software y mercados emergentes.\n\nSi esta cerca de tu foco de inversion, con gusto puedo enviarte el deck o coordinar una conversacion de 20 minutos.\n\nSaludos,\nDavid Arias\nFundador, Tecnotitan\ntecnotitan.com",
  },
  en: {
    subject: "Tecnotitan | AI implementation platform for LATAM",
    body:
      "Hi {{primer_nombre}},\n\nI am David Arias, founder of Tecnotitan. We are building an applied technology company from Colombia for companies that need AI implementation, not more slideware.\n\nThe problem we see across Latin America is clear: manual workflows, scattered data, pressure to adopt AI and teams without the internal capacity to turn ideas into working products.\n\nTecnotitan enters through real operational pain. We diagnose, build, implement and then convert recurring use cases into reusable IP, sector knowledge and operating playbooks. The model is service revenue today, scalable SaaS and licensing tomorrow.\n\nWe are raising a US$500K pre-seed to fund 18 months toward paid pilots, product engineering, AI delivery and a repeatable product platform.\n\nI noticed your connection to {{industria}} in {{pais}} and thought Tecnotitan could be relevant to your thesis around AI, software infrastructure and emerging markets.\n\nIf this is close to your investment focus, I would be glad to send the deck or schedule a 20-minute conversation.\n\nBest regards,\nDavid Arias\nFounder, Tecnotitan\ntecnotitan.com",
  },
  pt: {
    subject: "Tecnotitan | plataforma de implementacao de IA para LATAM",
    body:
      "Ola {{primer_nombre}},\n\nSou David Arias, fundador da Tecnotitan. Estamos construindo uma empresa de tecnologia aplicada a partir da Colombia para companhias que precisam implementar IA de forma pratica, nao apenas discutir ideias.\n\nO problema que vemos na America Latina e claro: processos manuais, dados dispersos, pressao para adotar IA e equipes sem capacidade interna para transformar ideias em produtos funcionando.\n\nA Tecnotitan entra por dores operacionais reais. Diagnosticamos, construimos, implementamos e depois transformamos casos recorrentes em propriedade intelectual, conhecimento setorial e playbooks operacionais. O modelo combina receita de servicos hoje e software/licenciamento escalavel amanha.\n\nEstamos captando uma rodada pre-seed de US$500K para financiar 18 meses de pilotos pagos, engenharia de produto, delivery de IA e uma plataforma repetivel.\n\nVi sua conexao com {{industria}} em {{pais}} e pensei que a Tecnotitan poderia ser relevante para sua tese em IA, infraestrutura de software e mercados emergentes.\n\nSe isso estiver proximo do seu foco de investimento, ficarei feliz em enviar o deck ou agendar uma conversa de 20 minutos.\n\nAtenciosamente,\nDavid Arias\nFundador, Tecnotitan\ntecnotitan.com",
  },
};

const INVESTOR_SEGMENT_TEMPLATES = {
  usa_vcs: {
    en: {
      subject: "Tecnotitan | AI implementation platform for LATAM",
      body:
        "Hi {{primer_nombre}},\n\nI am David Arias, founder of Tecnotitan. We are building an AI implementation platform from Colombia for Latin American companies that need working systems, not more strategy decks.\n\nFor venture funds looking at AI infrastructure, vertical SaaS or emerging markets, the wedge is practical: companies across LATAM have fragmented workflows, manual sales operations and pressure to adopt AI without internal product capacity.\n\nTecnotitan starts with paid implementation work, turns repeated use cases into reusable software/IP and compounds toward a regional product platform. That gives us service revenue today and SaaS/licensing upside as patterns repeat.\n\nWe are raising a US$500K pre-seed to fund 18 months of paid pilots, product engineering and a repeatable AI delivery platform.\n\nI noticed your connection to {{industria}} in {{pais}} and thought this could fit your view on AI adoption and software infrastructure in under-digitized markets.\n\nIf relevant, I would be glad to send the deck or schedule a 20-minute conversation.\n\nBest regards,\nDavid Arias\nFounder, Tecnotitan\ntecnotitan.com",
    },
    es: {
      subject: "Tecnotitan | IA aplicada y software para LATAM",
      body:
        "Hola {{primer_nombre}},\n\nSoy David Arias, fundador de Tecnotitan. Estamos construyendo una plataforma de implementacion de IA desde Colombia para empresas latinoamericanas que necesitan sistemas funcionando, no mas consultoria teorica.\n\nPara fondos venture que miran IA, vertical SaaS o mercados emergentes, la entrada es concreta: companias con procesos comerciales manuales, datos dispersos y presion por adoptar IA sin capacidad interna de producto.\n\nTecnotitan empieza con implementaciones pagas, convierte casos repetidos en software/IP reutilizable y compone hacia una plataforma regional. Eso nos da ingresos por servicio hoy y upside SaaS/licenciamiento manana.\n\nEstamos levantando US$500K pre-seed para financiar 18 meses de pilotos pagos, ingenieria de producto y una plataforma repetible de delivery de IA.\n\nVi tu relacion con {{industria}} en {{pais}} y pense que podria encajar con una tesis sobre adopcion de IA e infraestructura de software en mercados subdigitalizados.\n\nSi es relevante, con gusto puedo enviarte el deck o coordinar una conversacion de 20 minutos.\n\nSaludos,\nDavid Arias\nFundador, Tecnotitan\ntecnotitan.com",
    },
    pt: {
      subject: "Tecnotitan | IA aplicada e software para LATAM",
      body:
        "Ola {{primer_nombre}},\n\nSou David Arias, fundador da Tecnotitan. Estamos construindo uma plataforma de implementacao de IA a partir da Colombia para empresas latino-americanas que precisam de sistemas funcionando, nao apenas consultoria teorica.\n\nPara fundos venture olhando IA, vertical SaaS ou mercados emergentes, a entrada e concreta: empresas com operacoes comerciais manuais, dados fragmentados e pressao para adotar IA sem capacidade interna de produto.\n\nA Tecnotitan comeca com implementacoes pagas, transforma casos repetidos em software/IP reutilizavel e evolui para uma plataforma regional. Isso gera receita de servicos hoje e potencial SaaS/licenciamento amanha.\n\nEstamos captando US$500K pre-seed para financiar 18 meses de pilotos pagos, engenharia de produto e uma plataforma repetivel de delivery de IA.\n\nVi sua conexao com {{industria}} em {{pais}} e pensei que isso poderia se encaixar em uma tese sobre adocao de IA e infraestrutura de software em mercados pouco digitalizados.\n\nSe fizer sentido, ficarei feliz em enviar o deck ou agendar uma conversa de 20 minutos.\n\nAtenciosamente,\nDavid Arias\nFundador, Tecnotitan\ntecnotitan.com",
    },
  },
  usa_angels: {
    en: {
      subject: "Tecnotitan | early AI implementation opportunity",
      body:
        "Hi {{primer_nombre}},\n\nI am David Arias, founder of Tecnotitan. We are building from Colombia at the intersection of practical AI, internal software and commercial automation for companies in Latin America.\n\nI am reaching out because angel investors often care about the founder-market fit and the early wedge. Ours is hands-on: we sell and implement real systems for companies now, learn from repeated operational pain and turn those patterns into reusable products.\n\nThe opportunity is to become the trusted AI implementation layer for businesses that cannot hire full product/AI teams but urgently need automation, integrations and better operating data.\n\nWe are raising a US$500K pre-seed to move from paid implementation work into a repeatable product platform.\n\nIf this is close to your interests, I would be glad to share the deck or have a short conversation.\n\nBest regards,\nDavid Arias\nFounder, Tecnotitan\ntecnotitan.com",
    },
    es: {
      subject: "Tecnotitan | oportunidad temprana en IA aplicada",
      body:
        "Hola {{primer_nombre}},\n\nSoy David Arias, fundador de Tecnotitan. Estamos construyendo desde Colombia en la interseccion de IA practica, software interno y automatizacion comercial para empresas en America Latina.\n\nTe escribo porque los angel investors suelen mirar muy bien el founder-market fit y la entrada inicial. La nuestra es directa: vendemos e implementamos sistemas reales para empresas hoy, aprendemos de dolores operativos repetidos y convertimos esos patrones en productos reutilizables.\n\nLa oportunidad es convertirnos en la capa confiable de implementacion de IA para negocios que no pueden contratar equipos completos de producto/IA, pero necesitan automatizacion, integraciones y mejores datos operativos.\n\nEstamos levantando US$500K pre-seed para pasar de implementaciones pagas a una plataforma de producto repetible.\n\nSi esta cerca de tus intereses, con gusto puedo compartir el deck o tener una conversacion corta.\n\nSaludos,\nDavid Arias\nFundador, Tecnotitan\ntecnotitan.com",
    },
    pt: {
      subject: "Tecnotitan | oportunidade inicial em IA aplicada",
      body:
        "Ola {{primer_nombre}},\n\nSou David Arias, fundador da Tecnotitan. Estamos construindo a partir da Colombia na intersecao entre IA pratica, software interno e automacao comercial para empresas na America Latina.\n\nEscrevo porque angel investors geralmente valorizam founder-market fit e a entrada inicial. A nossa e direta: vendemos e implementamos sistemas reais hoje, aprendemos com dores operacionais recorrentes e transformamos esses padroes em produtos reutilizaveis.\n\nA oportunidade e nos tornarmos a camada confiavel de implementacao de IA para empresas que nao conseguem contratar times completos de produto/IA, mas precisam de automacao, integracoes e melhores dados operacionais.\n\nEstamos captando US$500K pre-seed para evoluir de implementacoes pagas para uma plataforma de produto repetivel.\n\nSe estiver perto dos seus interesses, ficarei feliz em compartilhar o deck ou ter uma conversa curta.\n\nAtenciosamente,\nDavid Arias\nFundador, Tecnotitan\ntecnotitan.com",
    },
  },
  strategic_investors: {
    en: {
      subject: "Tecnotitan | strategic AI implementation layer for LATAM",
      body:
        "Hi {{primer_nombre}},\n\nI am David Arias, founder of Tecnotitan. We are building an AI implementation and software platform for Latin American companies that need to modernize operations without building large internal product teams.\n\nFor a strategic investor, the angle is not only financial. Tecnotitan can become a regional implementation layer: CRM, sales automation, integrations, data workflows and AI tools that convert operational friction into measurable systems.\n\nWe start through paid projects, capture repeatable use cases and build reusable IP around sectors, workflows and AI delivery. That creates potential strategic value for partners with exposure to SMEs, B2B services, enterprise software or digital transformation.\n\nWe are raising a US$500K pre-seed to finance pilots, product engineering and a repeatable delivery platform.\n\nI noticed your connection to {{industria}} in {{pais}} and thought a strategic conversation could be useful.\n\nBest regards,\nDavid Arias\nFounder, Tecnotitan\ntecnotitan.com",
    },
    es: {
      subject: "Tecnotitan | capa estrategica de IA para LATAM",
      body:
        "Hola {{primer_nombre}},\n\nSoy David Arias, fundador de Tecnotitan. Estamos construyendo una plataforma de implementacion de IA y software para empresas latinoamericanas que necesitan modernizar operaciones sin crear grandes equipos internos de producto.\n\nPara un inversionista estrategico, el angulo no es solo financiero. Tecnotitan puede convertirse en una capa regional de implementacion: CRM, automatizacion comercial, integraciones, flujos de datos y herramientas de IA que convierten friccion operativa en sistemas medibles.\n\nEmpezamos con proyectos pagos, capturamos casos de uso repetibles y construimos IP alrededor de sectores, workflows y delivery de IA. Eso puede tener valor estrategico para aliados con exposicion a pymes, servicios B2B, software empresarial o transformacion digital.\n\nEstamos levantando US$500K pre-seed para financiar pilotos, ingenieria de producto y una plataforma de delivery repetible.\n\nVi tu relacion con {{industria}} en {{pais}} y pense que una conversacion estrategica podria tener sentido.\n\nSaludos,\nDavid Arias\nFundador, Tecnotitan\ntecnotitan.com",
    },
    pt: {
      subject: "Tecnotitan | camada estrategica de IA para LATAM",
      body:
        "Ola {{primer_nombre}},\n\nSou David Arias, fundador da Tecnotitan. Estamos construindo uma plataforma de implementacao de IA e software para empresas latino-americanas que precisam modernizar operacoes sem criar grandes equipes internas de produto.\n\nPara um investidor estrategico, o angulo nao e apenas financeiro. A Tecnotitan pode se tornar uma camada regional de implementacao: CRM, automacao comercial, integracoes, fluxos de dados e ferramentas de IA que transformam friccao operacional em sistemas mensuraveis.\n\nComecamos com projetos pagos, capturamos casos de uso repetiveis e construimos IP em torno de setores, workflows e delivery de IA. Isso pode ter valor estrategico para parceiros com exposicao a PMEs, servicos B2B, software empresarial ou transformacao digital.\n\nEstamos captando US$500K pre-seed para financiar pilotos, engenharia de produto e uma plataforma de delivery repetivel.\n\nVi sua conexao com {{industria}} em {{pais}} e pensei que uma conversa estrategica poderia fazer sentido.\n\nAtenciosamente,\nDavid Arias\nFundador, Tecnotitan\ntecnotitan.com",
    },
  },
};

INVESTOR_SEGMENT_TEMPLATES.europe_funds = INVESTOR_SEGMENT_TEMPLATES.usa_vcs;
INVESTOR_SEGMENT_TEMPLATES.latam_investors = INVESTOR_SEGMENT_TEMPLATES.usa_vcs;

function localizedCampaignTemplate(campaign, data, field) {
  if (campaign.campaign_type !== "investor") return campaign[field];
  const language = leadLanguage(data);
  const segmentTemplates = INVESTOR_SEGMENT_TEMPLATES[campaign.segment_key] || null;
  const variant = segmentTemplates?.[language] || INVESTOR_LANGUAGE_TEMPLATES[language] || INVESTOR_LANGUAGE_TEMPLATES.en;
  if (field === "subject_template") return variant.subject;
  if (field === "body_template") return variant.body;
  return campaign[field];
}

function personalizedCampaignTemplate(campaign, data, field) {
  const draft = data.opportunity?.origami_email_draft || {};
  const variant = campaignDraftVariant(draft, data.variant_seed || data.opportunity?.id || campaign.id);
  if (field === "subject_template") {
    return String(variant?.subject || draft.recommended_subject || "").trim() || localizedCampaignTemplate(campaign, data, field);
  }
  if (field === "body_template") {
    return String(variant?.body || draft.email_body || draft.opening_line || "").trim() || localizedCampaignTemplate(campaign, data, field);
  }
  return localizedCampaignTemplate(campaign, data, field);
}

function personalizedFollowupTemplate(campaign, data, field) {
  const draft = data.opportunity?.origami_email_draft || {};
  const followup = draft.variants?.followup_short || {};
  if (field === "followup_subject_template") {
    return String(followup.subject || "").trim() || campaign.followup_subject_template;
  }
  if (field === "followup_body_template") {
    return String(followup.body || "").trim() || campaign.followup_body_template;
  }
  return campaign[field];
}

function campaignDraftVariant(draft = {}, seed = "") {
  const variants = draft.variants && typeof draft.variants === "object" ? draft.variants : {};
  const keys = ["direct", "consultative", "investor", "strategic", "followup_short"].filter((key) => {
    const variant = variants[key] || {};
    return String(variant.subject || "").trim() || String(variant.body || "").trim();
  });
  if (!keys.length) return null;
  const hash = String(seed || "")
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return variants[keys[hash % keys.length]];
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

async function firstRow(path) {
  const { payload } = await supabaseFetch(path);
  return payload?.[0] || null;
}

function keepValue(incoming, existing) {
  return incoming === null || incoming === undefined || incoming === "" ? existing || null : incoming;
}

function keepRicherText(incoming, existing) {
  const next = String(incoming || "").trim();
  const current = String(existing || "").trim();
  if (!next) return current || null;
  if (!current) return next;
  return next.split(/\s+/).length > current.split(/\s+/).length || next.length > current.length ? next : current;
}

async function loadOpportunity(id, user) {
  if (!id) return null;
  const filters = [
    "select=id,contact_id,company_id,lead_type,target_region,owner_user_id,origami_email_draft,contacts(id,full_name,email,title,country,city),companies(id,name,country,city,industry)",
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
    `/contacts?select=id,company_id,email,full_name,opportunities(id,company_id,contact_id,owner_user_id,lead_type,target_region,pipeline_status,next_follow_up_at,next_follow_up_type)&email=ilike.${encodeURIComponent(email)}&deleted_at=is.null&limit=1`
  );
  const contact = contacts?.[0] || null;
  const opportunity = contact?.opportunities?.[0] || null;
  return {
    contact,
    opportunity,
    company_id: opportunity?.company_id || contact?.company_id || null,
  };
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function classifyInboundReply(text, leadType) {
  const value = String(text || "").toLowerCase();
  if (negativeReplyReason(value)) {
    return {
      task: "No contactar",
      pipeline_status: "perdido",
      tag: "No contactar",
      note: "Respuesta negativa o solicitud de baja.",
      followup: false,
    };
  }
  if (/\b(meeting|call|calendar|calendly|schedule|zoom|teams|meet|reunion|reunión|llamada|agenda|agendar|conversar)\b/i.test(value)) {
    return {
      task: "Agendar reunion",
      pipeline_status: "reunion_agendada",
      tag: "Prioridad alta",
      note: "La respuesta menciona reunion, llamada o agenda.",
      followup: true,
    };
  }
  if (/\b(deck|pitch deck|investor deck|send.*deck|send.*info|presentation|presentacion|presentación|brochure|more information|mas informacion|más información)\b/i.test(value)) {
    return {
      task: leadType === "investor" ? "Enviar deck" : "Responder con informacion",
      pipeline_status: "calificado",
      tag: leadType === "investor" ? "Inversionista estrategico" : "Prioridad alta",
      note: "La respuesta solicita material o mas informacion.",
      followup: true,
    };
  }
  if (/\b(interested|interesting|tell me more|looks good|sounds good|open to|let's talk|lets talk|me interesa|interesado|interesante|cuentame|cuéntame|hablemos)\b/i.test(value)) {
    return {
      task: "Responder interesado",
      pipeline_status: "calificado",
      tag: leadType === "investor" ? "Inversionista estrategico" : "Cliente ideal",
      note: "La respuesta muestra interes comercial.",
      followup: true,
    };
  }
  return {
    task: "Responder interesado",
    pipeline_status: "contactado",
    tag: "Prioridad alta",
    note: "Respuesta recibida; requiere revision humana.",
    followup: true,
  };
}

async function applyInboundReplyAction({ opportunity, contact, companyId, fromEmail, text, subject }) {
  if (!opportunity?.id) return null;
  const action = classifyInboundReply(`${subject || ""}\n${text || ""}`, opportunity.lead_type);
  const now = new Date().toISOString();

  if (action.tag && contact?.id) {
    await ensureContactTag(contact.id, action.tag, action.tag === "No contactar" ? "#6b7280" : "#ef4444").catch(() => null);
  }

  const patch = {
    last_activity_at: now,
    updated_at: now,
  };
  if (action.followup) {
    patch.next_follow_up_at = todayDateString();
    patch.next_follow_up_type = action.task;
  } else {
    patch.next_follow_up_at = null;
    patch.next_follow_up_type = action.task;
  }
  if (action.pipeline_status && opportunity.pipeline_status !== action.pipeline_status) {
    patch.pipeline_status = action.pipeline_status;
  }

  await updateRows("opportunities", patch, `id=eq.${encodeURIComponent(opportunity.id)}`);

  if (patch.pipeline_status) {
    await insertRow("pipeline_events", {
      opportunity_id: opportunity.id,
      from_status: opportunity.pipeline_status || null,
      to_status: action.pipeline_status,
      note: `Respuesta inbound: ${action.task}`,
    }).catch(() => null);
  }

  await insertRow("activities", {
    opportunity_id: opportunity.id,
    contact_id: contact?.id || null,
    company_id: companyId || null,
    activity_type: "reply_task_created",
    subject: `Tarea automatica: ${action.task}`,
    body: `${action.note} Email: ${fromEmail || "sin email"}. Fragmento: ${snippet(text || subject)}`,
  }).catch(() => null);

  return action;
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
  const replyAction = await applyInboundReplyAction({
    opportunity,
    contact,
    companyId,
    fromEmail,
    text: textBody,
    subject,
  });
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
  return { ...row, reply_action: replyAction };
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

function campaignBounceRate(counts = {}) {
  const sent = Number(counts.sent || 0);
  if (!sent) return 0;
  return Number(counts.bounced || 0) / sent;
}

function preflightIssue(level, label, detail, metric = null) {
  return { level, label, detail, metric };
}

function minimumPreflightQueue(campaign = {}) {
  const dailyLimit = Number(campaign.daily_limit || 100);
  const maxRecipients = Number(campaign.max_recipients || 100);
  return Math.max(25, Math.min(100, dailyLimit, Math.ceil(maxRecipients * 0.1)));
}

async function approvedInventoryForCampaign(campaign) {
  const regions = campaignLeadRegions(campaign.campaign_type, campaign.target_region);
  const filters = [
    "select=id,origami_status,origami_profile,contacts(id,email,email_status,contact_tags(tags(name)))",
    `lead_type=eq.${encodeURIComponent(campaign.campaign_type)}`,
    regionFilter(regions),
    "deleted_at=is.null",
    "limit=1000",
  ].filter(Boolean);
  const { payload } = await supabaseFetch(`/opportunities?${filters.join("&")}`);
  return (payload || [])
    .filter((opportunity) => opportunity.contacts?.email)
    .filter((opportunity) => !hasContactTag(opportunity.contacts, "Correo enviado"))
    .filter((opportunity) => !hasContactTag(opportunity.contacts, "No contactar"))
    .filter((opportunity) => !hasContactTag(opportunity.contacts, "Email dudoso"))
    .filter((opportunity) => !emailStatusLooksRisky(opportunity.contacts?.email_status))
    .filter((opportunity) => origamiCampaignApproval(opportunity).approved).length;
}

async function campaignPreflight(campaign, counts = null) {
  const currentCounts = counts || (await campaignCounts(campaign.id));
  const warmup = await warmupStatus(campaign.sender_key).catch(() => null);
  const approvedInventory = await approvedInventoryForCampaign(campaign).catch(() => 0);
  const issues = [];
  const warnings = [];
  const minQueue = minimumPreflightQueue(campaign);
  const queued = Number(currentCounts.queued || 0);
  const sent = Number(currentCounts.sent || 0);
  const bounced = Number(currentCounts.bounced || 0);
  const bounceRate = campaignBounceRate(currentCounts);
  const startAt = campaign.start_at ? new Date(campaign.start_at) : null;
  const endAt = campaign.end_at ? new Date(campaign.end_at) : null;
  const now = new Date();

  if (campaign.status !== "active") {
    issues.push(preflightIssue("danger", "Campana inactiva", `Estado actual: ${campaign.status || "sin estado"}.`));
  }
  if (!campaign.subject_template || !String(campaign.subject_template).trim()) {
    issues.push(preflightIssue("danger", "Sin asunto", "La campana no tiene asunto configurado."));
  }
  if (!campaign.body_template || !String(campaign.body_template).trim()) {
    issues.push(preflightIssue("danger", "Sin cuerpo", "La campana no tiene cuerpo de correo configurado."));
  }
  if (startAt && endAt && endAt <= startAt) {
    issues.push(preflightIssue("danger", "Fechas invalidas", "La fecha final es anterior o igual al inicio."));
  }
  if (endAt && endAt <= now) {
    issues.push(preflightIssue("danger", "Campana vencida", "La ventana de envio ya termino."));
  }
  if (queued < minQueue) {
    const missing = Math.max(0, minQueue - queued);
    issues.push(preflightIssue("danger", "Cola baja", `Hay ${queued} en cola; minimo recomendado ${minQueue}. Faltan ${missing}.`, { queued, min_queue: minQueue }));
  }
  if (approvedInventory + queued < minQueue) {
    warnings.push(preflightIssue("warning", "Inventario aprobado bajo", `${approvedInventory} leads aprobadas disponibles fuera de cola.`, { approved_inventory: approvedInventory }));
  }
  if (sent >= Number(campaign.max_recipients || 100)) {
    issues.push(preflightIssue("danger", "Objetivo agotado", "La campana ya alcanzo su maximo de destinatarios."));
  }
  if (sent >= Number(campaign.daily_limit || 100)) {
    warnings.push(preflightIssue("warning", "Limite diario agotado", "La campana ya uso su cupo diario configurado."));
  }
  if (warmup && Number(warmup.remaining_today || 0) <= 0) {
    warnings.push(preflightIssue("warning", "Cupo de dominio agotado", `${warmup.domain || campaign.sender_key} no tiene cupo restante hoy.`));
  }
  if (sent >= BOUNCE_CONTROL_MIN_SENT && bounceRate >= BOUNCE_PAUSE_RATE) {
    issues.push(preflightIssue("danger", "Rebote alto", `Rebote ${Math.round(bounceRate * 1000) / 10}% (${bounced}/${sent}).`));
  } else if (sent >= BOUNCE_CONTROL_MIN_SENT && bounceRate >= BOUNCE_THROTTLE_RATE) {
    warnings.push(preflightIssue("warning", "Rebote en observacion", `Rebote ${Math.round(bounceRate * 1000) / 10}% (${bounced}/${sent}).`));
  }
  if (Number(currentCounts.complained || 0) > 0) {
    issues.push(preflightIssue("danger", "Quejas spam", `${currentCounts.complained} queja(s) registradas.`));
  }
  if (Number(currentCounts.reputation_blocked || 0) > 0) {
    warnings.push(preflightIssue("warning", "Bloqueos reputacion", `${currentCounts.reputation_blocked} destinatario(s) bloqueados.`));
  }

  const status = issues.length ? "blocked" : warnings.length ? "warning" : "ready";
  const label = status === "ready" ? "Listo para enviar" : status === "warning" ? "Atencion antes de enviar" : "No listo";
  return {
    status,
    label,
    checked_at: new Date().toISOString(),
    min_queue: minQueue,
    queued,
    approved_inventory: approvedInventory,
    warmup_remaining_today: warmup?.remaining_today ?? null,
    next_scheduled_at: currentCounts.next_scheduled_at,
    issues,
    warnings,
  };
}

async function ensureCampaignReserve(user, campaign, counts, startAt = new Date()) {
  const minQueue = minimumPreflightQueue(campaign);
  const queued = Number(counts.queued || 0);
  const sent = Number(counts.sent || 0);
  if (sent > 0 || queued >= minQueue) {
    return { ok: true, min_queue: minQueue, queued, added: 0 };
  }
  const maxRecipients = Number(campaign.max_recipients || minQueue);
  const totalPrepared = queued + sent;
  const remainingToQueue = Math.max(0, maxRecipients - totalPrepared);
  const missing = Math.max(0, minQueue - queued);
  let added = 0;
  if (remainingToQueue > 0 && missing > 0) {
    added = await addCampaignRecipients(user, campaign, Math.min(50, remainingToQueue, missing), startAt).catch(() => 0);
  }
  const nextCounts = added ? await campaignCounts(campaign.id) : counts;
  const nextQueued = Number(nextCounts.queued || 0);
  return {
    ok: nextQueued >= minQueue,
    min_queue: minQueue,
    queued: nextQueued,
    added,
    counts: nextCounts,
    message: nextQueued >= minQueue
      ? `Reserva minima alcanzada: ${nextQueued}/${minQueue}.`
      : `Reserva insuficiente: ${nextQueued}/${minQueue}. La campana espera mas inventario aprobado antes de despegar.`,
  };
}

async function enforceBounceControl(campaign, counts = {}) {
  const sent = Number(counts.sent || 0);
  const bounced = Number(counts.bounced || 0);
  const bounceRate = campaignBounceRate(counts);
  if (sent < BOUNCE_CONTROL_MIN_SENT || bounced <= 0) return null;

  const percent = Math.round(bounceRate * 1000) / 10;
  if (bounceRate >= BOUNCE_PAUSE_RATE) {
    await updateRows(
      "email_campaigns",
      {
        status: "paused",
        updated_at: new Date().toISOString(),
      },
      `id=eq.${encodeURIComponent(campaign.id)}`
    );
    return {
      action: "paused",
      reason: `Rebote alto: ${percent}% (${bounced}/${sent}). Campana pausada para proteger el dominio.`,
      bounce_rate: bounceRate,
    };
  }

  if (bounceRate >= BOUNCE_THROTTLE_RATE) {
    const nextDailyLimit = Math.max(5, Math.floor(Number(campaign.daily_limit || 100) / 2));
    const nextMinDelay = Math.max(12, Number(campaign.min_delay_minutes || 6));
    const nextMaxDelay = Math.max(18, Number(campaign.max_delay_minutes || 12), nextMinDelay + 3);
    const alreadyThrottled =
      Number(campaign.daily_limit || 100) <= nextDailyLimit &&
      Number(campaign.batch_size || 1) <= 1 &&
      Number(campaign.min_delay_minutes || 0) >= nextMinDelay;

    if (!alreadyThrottled) {
      await updateRows(
        "email_campaigns",
        {
          daily_limit: nextDailyLimit,
          batch_size: 1,
          min_delay_minutes: nextMinDelay,
          max_delay_minutes: nextMaxDelay,
          updated_at: new Date().toISOString(),
        },
        `id=eq.${encodeURIComponent(campaign.id)}`
      );
    }

    return {
      action: alreadyThrottled ? "throttled_active" : "throttled",
      reason: `Rebote en observacion: ${percent}% (${bounced}/${sent}). Ritmo diario reducido para proteger el dominio.`,
      bounce_rate: bounceRate,
      daily_limit: nextDailyLimit,
      batch_size: 1,
    };
  }

  return null;
}

async function listCampaigns(user) {
  requireCampaignAdmin(user);
  const { payload } = await supabaseFetch(
    "/email_campaigns?select=id,name,campaign_type,sender_key,status,daily_limit,batch_size,min_delay_minutes,max_delay_minutes,followup_enabled,followup_delays_days,followup_subject_template,followup_body_template,subject_template,body_template,target_region,segment_key,segment_label,search_templates,attach_investor_deck,start_at,end_at,max_recipients,schedule_timezone,send_window_start_minutes,send_window_end_minutes,last_processed_at,created_at&order=created_at.desc&limit=50"
  );
  const campaigns = [];
  for (const campaign of payload || []) {
    const counts = await campaignCounts(campaign.id);
    campaigns.push({ ...campaign, counts, preflight: await campaignPreflight(campaign, counts) });
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
    origami_pending: 0,
    origami_rejected: 0,
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

function origamiCampaignApproval(opportunity = {}) {
  return { approved: true, issues: [] };
}

async function leadInventory(user) {
  requireCampaignAdmin(user);
  const [{ payload: opportunities }, { payload: exclusions }, { payload: recipients }] = await Promise.all([
    supabaseFetch(
      "/opportunities?select=id,lead_type,target_region,deleted_at,origami_status,origami_profile,contacts(id,email,email_status,contact_tags(tags(name))),companies(id,name,country)&deleted_at=is.null&limit=5000"
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
    const doubtfulTagged = hasContactTag(opportunity.contacts, "Email dudoso");
    const blocked = (email && excludedEmails.has(email)) || noContactTagged || doubtfulTagged || emailStatusLooksRisky(opportunity.contacts?.email_status);
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
    "select=id,contact_id,company_id,lead_type,target_region,owner_user_id,origami_status,origami_profile,origami_email_draft,contacts(id,apollo_person_id,first_name,last_name,full_name,email,email_status,title,country,city,linkedin_url,apollo_raw_payload,contact_tags(tags(name))),companies(id,name,domain,country,city,industry)",
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
    "select=id,contact_id,company_id,lead_type,target_region,owner_user_id,origami_status,origami_profile,origami_email_draft,contacts(id,apollo_person_id,first_name,last_name,full_name,email,email_status,title,country,city,linkedin_url,apollo_raw_payload,apollo_enrichment_status,contact_tags(tags(name))),companies(id,name,domain,country,city,industry)",
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

function campaignTemplateKeys(campaignType, targetRegion, segmentKey, searchTemplates = []) {
  if (campaignType !== "investor") return ["consulting_client:latam"];
  const explicitTemplates = Array.isArray(searchTemplates) ? searchTemplates.filter(Boolean) : [];
  if (explicitTemplates.length) return explicitTemplates;
  const segment = campaignSegment(segmentKey, campaignType);
  if (segment.templates.length) return segment.templates;
  const byRegion = {
    usa: ["investor:usa:vcs", "investor:usa:angels", "investor:usa_family_offices", "investor:usa_accelerators", "investor:usa"],
    latam: ["investor:latam:funds", "investor:latam_angels", "investor:latam_accelerators", "investor:latam"],
    europe: ["investor:europe:vcs", "investor:europe_angels", "investor:europe_family_offices", "investor:europe_accelerators", "investor:europe"],
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

async function buildCampaignLeadPool(user, campaignType, targetRegion, desiredCount, segmentKey = "", searchTemplates = []) {
  let pool = await campaignLeadPool(campaignType, targetRegion);
  let searches = 0;
  const templateKeys = campaignTemplateKeys(campaignType, targetRegion, segmentKey, searchTemplates);
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

async function openCampaignEmails(currentCampaignId) {
  const { payload: campaigns } = await supabaseFetch(
    `/email_campaigns?select=id&status=in.(active,paused)&id=neq.${encodeURIComponent(currentCampaignId)}&limit=200`
  );
  const ids = (campaigns || []).map((campaign) => campaign.id).filter(Boolean);
  if (!ids.length) return new Set();
  const { payload } = await supabaseFetch(
    `/email_campaign_recipients?select=email&campaign_id=in.(${ids.join(",")})&status=in.(queued,sent)&limit=10000`
  );
  return new Set((payload || []).map((row) => normalizeEmail(row.email)).filter(Boolean));
}

async function addCampaignRecipients(user, campaign, count, startAt = new Date()) {
  const maxRecipients = Number(campaign.max_recipients || 100);
  if (count <= 0) return 0;
  const [existingEmails, openEmails] = await Promise.all([
    existingCampaignEmails(campaign.id),
    openCampaignEmails(campaign.id),
  ]);
  const leads = await buildCampaignLeadPool(
    user,
    campaign.campaign_type,
    campaign.target_region,
    Math.min(count * 3, 100),
    campaign.segment_key,
    campaign.search_templates
  );
  const allowedLeads = [];
  const blockedRecipients = [];
  for (const lead of leads) {
    if (allowedLeads.length >= count) break;
    const email = normalizeEmail(lead.contacts?.email);
    if (!email || existingEmails.has(email) || openEmails.has(email)) continue;
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
      continue;
    }
    const qualityIssues = await emailQualityIssues(email, lead.contacts);
    if (qualityIssues.length) {
      await markDoubtfulEmail(lead.contact_id || lead.contacts?.id, qualityIssues);
      blockedRecipients.push({
        campaign_id: campaign.id,
        opportunity_id: lead.id,
        contact_id: lead.contact_id,
        company_id: lead.company_id,
        email,
        status: "skipped",
        reputation_status: "blocked",
        reputation_issues: qualityIssues,
        last_error: qualityIssues.join(" "),
      });
    } else {
      allowedLeads.push(lead);
    }
  }
  const rows = [
    ...scheduleRecipients(campaign.id, allowedLeads, campaign.min_delay_minutes || 4, campaign.max_delay_minutes || 9, {
      startAt,
      endAt: campaign.end_at ? new Date(campaign.end_at) : null,
      dailyLimit: campaign.daily_limit || 100,
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

async function campaignRecipientSummary(campaignId) {
  const { payload } = await supabaseFetch(
    `/email_campaign_recipients?select=status,reputation_status&campaign_id=eq.${encodeURIComponent(campaignId)}&limit=5000`
  );
  return (payload || []).reduce(
    (summary, row) => {
      summary.total += 1;
      summary[row.status] = (summary[row.status] || 0) + 1;
      if (row.reputation_status === "blocked") summary.blocked += 1;
      return summary;
    },
    { total: 0, queued: 0, sent: 0, skipped: 0, failed: 0, blocked: 0 }
  );
}

async function warehouseCandidates(campaign, { withEmail = true, limit = 50 } = {}) {
  const regions = campaignLeadRegions(campaign.campaign_type, campaign.target_region);
  const filters = [
    "select=id,contact_id,company_id,lead_type,target_region,owner_user_id,origami_status,origami_profile,origami_email_draft,contacts(id,apollo_person_id,first_name,last_name,full_name,email,email_status,title,country,city,linkedin_url,apollo_raw_payload,apollo_enrichment_status,contact_tags(tags(name))),companies(id,name,domain,country,city,industry)",
    `lead_type=eq.${encodeURIComponent(campaign.campaign_type)}`,
    regionFilter(regions),
    "deleted_at=is.null",
    "order=score.desc",
    `limit=${Math.max(1, Math.min(500, Number(limit || 50)))}`,
  ].filter(Boolean);
  const { payload } = await supabaseFetch(`/opportunities?${filters.join("&")}`);
  return (payload || [])
    .filter((opportunity) => !hasContactTag(opportunity.contacts, "Correo enviado"))
    .filter((opportunity) => !hasContactTag(opportunity.contacts, "No contactar"))
    .filter((opportunity) => !hasContactTag(opportunity.contacts, "Email dudoso"))
    .filter((opportunity) => (withEmail === null ? true : withEmail ? Boolean(opportunity.contacts?.email) : !opportunity.contacts?.email))
    .filter((opportunity) => opportunity.contacts?.apollo_enrichment_status !== "not_available");
}

async function warehouseAnalyzeCandidates(campaign, limit = 25) {
  const regions = campaignLeadRegions(campaign.campaign_type, campaign.target_region);
  const maxLimit = Math.max(1, Math.min(500, Number(limit || 25)));
  const baseFilters = [
    `lead_type=eq.${encodeURIComponent(campaign.campaign_type)}`,
    regionFilter(regions),
    "deleted_at=is.null",
    "origami_status=neq.completed",
    "order=score.desc",
  ].filter(Boolean);
  const withEmailFilters = [
    "select=id,origami_status,score,contacts!inner(id,email,email_status,contact_tags(tags(name)))",
    ...baseFilters,
    "contacts.email=not.is.null",
    `limit=${maxLimit}`,
  ];
  const fallbackFilters = [
    "select=id,origami_status,score,contacts(id,email,email_status,contact_tags(tags(name)))",
    ...baseFilters,
    `limit=${maxLimit}`,
  ];
  const [{ payload: withEmailPayload }, { payload: fallbackPayload }] = await Promise.all([
    supabaseFetch(`/opportunities?${withEmailFilters.join("&")}`).catch(() => ({ payload: [] })),
    supabaseFetch(`/opportunities?${fallbackFilters.join("&")}`).catch(() => ({ payload: [] })),
  ]);
  const seen = new Set();
  return [...(withEmailPayload || []), ...(fallbackPayload || [])]
    .filter((opportunity) => {
      if (!opportunity.id || seen.has(opportunity.id)) return false;
      seen.add(opportunity.id);
      return true;
    })
    .filter((opportunity) => !hasContactTag(opportunity.contacts, "Correo enviado"))
    .filter((opportunity) => !hasContactTag(opportunity.contacts, "No contactar"))
    .filter((opportunity) => !hasContactTag(opportunity.contacts, "Email dudoso"))
    .sort((a, b) => {
      const aHasEmail = a.contacts?.email ? 1 : 0;
      const bHasEmail = b.contacts?.email ? 1 : 0;
      if (aHasEmail !== bHasEmail) return bHasEmail - aHasEmail;
      const aVerified = emailStatusLooksRisky(a.contacts?.email_status) ? 0 : 1;
      const bVerified = emailStatusLooksRisky(b.contacts?.email_status) ? 0 : 1;
      if (aVerified !== bVerified) return bVerified - aVerified;
      return Number(b.score || 0) - Number(a.score || 0);
    });
}

function origamiRunStatus(status) {
  const value = String(status || "").toLowerCase();
  if (["failed", "error", "cancelled", "canceled"].includes(value)) return "failed";
  if (["completed", "complete", "done", "succeeded", "success", "finished"].includes(value)) return "completed";
  return "running";
}

function extractOrigamiText(run) {
  const response = run?.response || run?.result || run?.output || run;
  if (typeof response === "string") return response;
  if (response?.text) return String(response.text);
  if (response?.message) return String(response.message);
  if (response?.content) return typeof response.content === "string" ? response.content : JSON.stringify(response.content);
  return JSON.stringify(response || {});
}

function extractOrigamiJson(text, marker = "TECNOTITAN_ORIGAMI_SOURCE_JSON") {
  const match = String(text || "").match(new RegExp(`BEGIN_${marker}\\s*([\\s\\S]*?)\\s*END_${marker}`, "i"));
  const raw = match?.[1] || "";
  if (!raw.trim()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function origamiSourcePrompt({ campaign, targetCount, query }) {
  const segment = campaignSegment(campaign.segment_key, campaign.campaign_type);
  const defaultQuery =
    campaign.campaign_type === "investor"
      ? `${targetCount} pre-seed and seed investors who invest in applied AI, AI implementation, B2B SaaS, vertical software, automation, CRM/workflow software, emerging markets, LATAM, Colombia, SMB digitization or AI services becoming software. Prioritize people/firms open to founder pitches, inbound deals, startup submissions, AI infrastructure/application theses and cold email.`
      : `${targetCount} LATAM companies likely to need AI implementation, CRM automation, sales ops, data integration or internal software consulting.`;
  const regionHint = campaign.target_region === "usa" ? "USA, especially California and major tech hubs" : campaign.target_region === "europe" ? "Europe" : campaign.target_region === "latam" ? "Latin America" : "USA, LATAM and Europe";
  return [
    "You are an Origami lead sourcing agent for Tecnotitan CRM.",
    "Goal: create a CRM-ready lead list, not a generic explanation.",
    "Use public information only. Do not invent emails, titles, LinkedIn URLs, websites or evidence.",
    "Prioritize leads where outreach is allowed or has a clear official pitch channel.",
    "",
    "Tecnotitan context:",
    "- Colombian applied technology company building practical AI implementation, CRM, sales automation, integrations and internal software.",
    "- Investor pitch: AI implementation platform for LATAM.",
    "- Core premise: companies in LATAM do not need more slideware; they need operating systems that turn sales, marketing, support and internal workflows into measurable AI-powered execution.",
    "- Strong fit investors: pre-seed/seed, AI applications, B2B SaaS, vertical SaaS, future of work, automation, SMB software, emerging markets, LATAM, Colombia, founder-led operators, angels with AI/software background.",
    "- Avoid weak fit: late-stage-only funds, biotech-only, consumer-only, crypto-only unless they explicitly invest in AI or B2B software, investors who discourage unsolicited pitches.",
    "- Consulting pitch: convert manual workflows and scattered data into working systems.",
    "",
    `Campaign name: ${campaign.name}`,
    `Campaign type: ${campaign.campaign_type}`,
    `Segment: ${segment.label}`,
    `Target region: ${regionHint}`,
    `Requested candidates: ${targetCount}`,
    `User sourcing query: ${query || defaultQuery}`,
    "",
    "If a focus table is attached to this run, treat it as the primary lead inventory.",
    "Read the existing table rows first, select the strongest campaign-ready leads, and return them as the JSON output.",
    "Do not create a new workspace. Do not duplicate rows already present in the focus table. Use the table data as the source of truth when available.",
    "",
    "For each lead, find specific evidence for at least one of these:",
    "- invests in AI, B2B SaaS, automation, emerging markets, LATAM, seed or pre-seed;",
    "- accepts cold email, founder submissions, startup pitches, inbound deals or has a public pitch email/form;",
    "- role is relevant: partner, investor, principal, angel, founder, corporate development, accelerator lead.",
    "- has public thesis or portfolio overlap with applied AI, operational software, sales automation, workflow automation, vertical SaaS, Colombian/LATAM startups or AI implementation.",
    "",
    "Quality bar:",
    "- Prefer fewer but stronger leads over filling the list with generic investors.",
    "- A lead is campaign-ready only if cold_email_fit is high or medium and pitch_policy is not no_unsolicited.",
    "- If you find official pitch emails like pitch@, deals@, startups@, submissions@, investment@, use those when they are the right channel.",
    "",
    "Return at most the requested number of leads. Include exactly one JSON object between these markers:",
    "BEGIN_TECNOTITAN_ORIGAMI_SOURCE_JSON",
    "{",
    '  "query_summary": "what was searched",',
    '  "leads": [',
    "    {",
    '      "person_name": "full name or investment team name",',
    '      "first_name": "first name if known",',
    '      "last_name": "last name if known",',
    '      "title": "role/title",',
    '      "email": "best direct or official pitch email if publicly found",',
    '      "email_status": "public|official_pitch|unknown",',
    '      "linkedin_url": "person LinkedIn URL if found",',
    '      "country": "country",',
    '      "city": "city",',
    '      "state": "state/region",',
    '      "company_name": "fund/company",',
    '      "company_domain": "domain without https",',
    '      "company_website": "website",',
    '      "company_linkedin_url": "company LinkedIn URL",',
    '      "industry": "VC|Angel investor|Family office|Accelerator|Corporate VC|Consulting prospect|Other",',
    '      "cold_email_fit": "high|medium|low|unknown",',
    '      "accepts_cold_email": "yes|no|unknown",',
    '      "accepts_pitches": "yes|no|unknown",',
    '      "accepts_founder_submissions": "yes|no|unknown",',
    '      "accepts_inbound_deals": "yes|no|unknown",',
    '      "official_pitch_email": "pitch/deals/startups/investment email if found",',
    '      "official_pitch_channel": "email|form|linkedin|referral|unknown",',
    '      "official_pitch_url": "source URL for pitch channel",',
    '      "pitch_policy": "accepts_pitches|form_required|referral_only|no_unsolicited|unknown",',
    '      "outreach_openness_evidence": "short evidence",',
    '      "investment_stage": "pre-seed|seed|series a|growth|unknown",',
    '      "investment_thesis": "short thesis match",',
    '      "personalization_angle": "specific reason Tecnotitan should contact them",',
    '      "recommended_subject": "natural subject line",',
    '      "email_body": "short personalized first email",',
    '      "signals": ["signal 1", "signal 2"],',
    '      "risks": ["risk or caveat"],',
    '      "confidence": "high|medium|low"',
    "    }",
    "  ]",
    "}",
    "END_TECNOTITAN_ORIGAMI_SOURCE_JSON",
  ].join("\n");
}

function origamiLeadRegion(lead, campaign) {
  const text = [lead.country, lead.state, lead.city].filter(Boolean).join(" ").toLowerCase();
  if (campaign.campaign_type !== "investor") return "latam";
  if (/(united states|usa|u\.s\.|california|new york|texas|florida|massachusetts|washington)/i.test(text)) return "usa";
  if (/(colombia|mexico|argentina|chile|peru|brazil|brasil|latam|latin america)/i.test(text)) return "latam";
  if (/(spain|espa|france|germany|italy|netherlands|switzerland|uk|united kingdom|europe)/i.test(text)) return "europe";
  return campaign.target_region || "usa";
}

function origamiCompanyRow(lead) {
  const domain = String(lead.company_domain || lead.domain || "").replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0].trim().toLowerCase();
  const name = String(lead.company_name || lead.company || "").trim();
  if (!name && !domain) return null;
  return {
    name: name || domain,
    domain: domain || null,
    website_url: lead.company_website || (domain ? `https://${domain}` : null),
    linkedin_url: lead.company_linkedin_url || null,
    industry: lead.industry || null,
    country: lead.country || null,
    city: lead.city || null,
    state: lead.state || null,
    raw_payload: {
      source: "origami",
      tecnotitan_origami_sourced_at: new Date().toISOString(),
      lead,
    },
  };
}

function origamiContactRow(lead, companyId) {
  const email = normalizeEmail(lead.email || lead.official_pitch_email);
  const fullName = String(lead.person_name || [lead.first_name, lead.last_name].filter(Boolean).join(" ") || "").trim();
  return {
    company_id: companyId || null,
    first_name: lead.first_name || fullName.split(/\s+/)[0] || null,
    last_name: lead.last_name || null,
    full_name: fullName || `Investment team - ${lead.company_name || "Origami lead"}`,
    title: lead.title || null,
    email: email || null,
    email_status: lead.email_status || (email ? "origami_public" : "unknown"),
    linkedin_url: lead.linkedin_url || null,
    country: lead.country || null,
    city: lead.city || null,
    state: lead.state || null,
    lead_source: "other",
    apollo_raw_payload: {
      source: "origami",
      tecnotitan_origami_sourced_at: new Date().toISOString(),
      lead,
    },
    apollo_last_synced_at: new Date().toISOString(),
    apollo_enrichment_status: email ? "enriched" : "not_requested",
  };
}

async function findOrigamiCompany(row) {
  if (!row) return null;
  if (row.domain) {
    const existing = await firstRow(`/companies?select=*&domain=ilike.${encodeURIComponent(row.domain)}&deleted_at=is.null&limit=1`);
    if (existing) return existing;
  }
  if (row.name) {
    const countryFilter = row.country ? `country=ilike.${encodeURIComponent(row.country)}` : "or=(country.is.null,country.eq.)";
    return firstRow(`/companies?select=*&name=ilike.${encodeURIComponent(row.name)}&${countryFilter}&deleted_at=is.null&limit=1`);
  }
  return null;
}

async function saveOrigamiCompany(row) {
  if (!row) return null;
  const existing = await findOrigamiCompany(row);
  if (existing) {
    const rows = await updateRows(
      "companies",
      {
        name: keepValue(row.name, existing.name),
        domain: keepValue(row.domain, existing.domain),
        website_url: keepValue(row.website_url, existing.website_url),
        linkedin_url: keepValue(row.linkedin_url, existing.linkedin_url),
        industry: keepValue(row.industry, existing.industry),
        country: keepValue(row.country, existing.country),
        city: keepValue(row.city, existing.city),
        state: keepValue(row.state, existing.state),
        raw_payload: { ...(row.raw_payload || {}), ...(existing.raw_payload || {}), tecnotitan_origami_last_source_at: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      },
      `id=eq.${encodeURIComponent(existing.id)}`
    );
    return rows[0] || existing;
  }
  return insertRow("companies", row);
}

async function findOrigamiContact(row) {
  if (!row) return null;
  if (row.email) {
    const existing = await firstRow(`/contacts?select=*&email=ilike.${encodeURIComponent(row.email)}&deleted_at=is.null&limit=1`);
    if (existing) return existing;
  }
  if (row.linkedin_url) {
    const existing = await firstRow(`/contacts?select=*&linkedin_url=ilike.${encodeURIComponent(row.linkedin_url)}&deleted_at=is.null&limit=1`);
    if (existing) return existing;
  }
  if (row.full_name && row.company_id) {
    return firstRow(`/contacts?select=*&full_name=ilike.${encodeURIComponent(row.full_name)}&company_id=eq.${encodeURIComponent(row.company_id)}&deleted_at=is.null&limit=1`);
  }
  return null;
}

async function saveOrigamiContact(row) {
  const existing = await findOrigamiContact(row);
  if (existing) {
    const rows = await updateRows(
      "contacts",
      {
        company_id: existing.company_id || row.company_id,
        first_name: keepValue(row.first_name, existing.first_name),
        last_name: keepValue(row.last_name, existing.last_name),
        full_name: keepRicherText(row.full_name, existing.full_name),
        title: keepValue(row.title, existing.title),
        email: keepValue(row.email, existing.email),
        email_status: keepValue(row.email_status, existing.email_status),
        linkedin_url: keepValue(row.linkedin_url, existing.linkedin_url),
        country: keepValue(row.country, existing.country),
        city: keepValue(row.city, existing.city),
        state: keepValue(row.state, existing.state),
        apollo_raw_payload: { ...(row.apollo_raw_payload || {}), ...(existing.apollo_raw_payload || {}), tecnotitan_origami_last_source_at: new Date().toISOString() },
        apollo_last_synced_at: new Date().toISOString(),
        apollo_enrichment_status: existing.apollo_enrichment_status || row.apollo_enrichment_status,
        updated_at: new Date().toISOString(),
      },
      `id=eq.${encodeURIComponent(existing.id)}`
    );
    return rows[0] || existing;
  }
  return insertRow("contacts", row);
}

function origamiProfileFromLead(lead) {
  return {
    summary: lead.summary || lead.investment_thesis || "",
    cold_email_fit: lead.cold_email_fit || "unknown",
    accepts_cold_email: lead.accepts_cold_email || "unknown",
    accepts_pitches: lead.accepts_pitches || "unknown",
    accepts_founder_submissions: lead.accepts_founder_submissions || "unknown",
    accepts_inbound_deals: lead.accepts_inbound_deals || "unknown",
    outreach_openness_evidence: lead.outreach_openness_evidence || "",
    official_pitch_email: lead.official_pitch_email || "",
    official_pitch_channel: lead.official_pitch_channel || "unknown",
    official_pitch_url: lead.official_pitch_url || "",
    pitch_policy: lead.pitch_policy || "unknown",
    recommended_channel: lead.recommended_channel || (lead.official_pitch_email ? "official_pitch_email" : "email"),
    personalization_angle: lead.personalization_angle || "",
    signals: Array.isArray(lead.signals) ? lead.signals : [],
    risks: Array.isArray(lead.risks) ? lead.risks : [],
    confidence: lead.confidence || "low",
    contact_risk: {
      level: String(lead.pitch_policy || "").toLowerCase() === "no_unsolicited" ? "high" : "medium",
      reason: (Array.isArray(lead.risks) ? lead.risks[0] : "") || "",
    },
    source: "origami_sourcing",
  };
}

async function saveOrigamiSourcedLead(user, campaign, lead, leadSearchId, position) {
  const company = await saveOrigamiCompany(origamiCompanyRow(lead));
  const contact = await saveOrigamiContact(origamiContactRow(lead, company?.id || null));
  const targetRegion = origamiLeadRegion(lead, campaign);
  const score = scoreLead({
    leadType: campaign.campaign_type,
    title: contact.title,
    country: contact.country || company?.country,
    linkedinUrl: contact.linkedin_url,
    organization: company || {},
  });
  const origamiProfile = origamiProfileFromLead(lead);
  const existingOpportunity = await firstRow(
    `/opportunities?select=*&contact_id=eq.${encodeURIComponent(contact.id)}&lead_type=eq.${encodeURIComponent(campaign.campaign_type)}&target_region=eq.${encodeURIComponent(targetRegion)}&deleted_at=is.null&limit=1`
  );
  const opportunityPatch = {
    company_id: company?.id || existingOpportunity?.company_id || null,
    lead_type: campaign.campaign_type,
    target_region: targetRegion,
    pipeline_status: existingOpportunity?.pipeline_status || "nuevo",
    investor_type: campaign.campaign_type === "investor" ? lead.industry || existingOpportunity?.investor_type || null : existingOpportunity?.investor_type || null,
    investment_stage: campaign.campaign_type === "investor" ? lead.investment_stage || existingOpportunity?.investment_stage || null : existingOpportunity?.investment_stage || null,
    investment_thesis: campaign.campaign_type === "investor" ? lead.investment_thesis || existingOpportunity?.investment_thesis || null : existingOpportunity?.investment_thesis || null,
    score: Math.max(Number(existingOpportunity?.score || 0), Number(score.score || 0)),
    score_label: existingOpportunity?.score_label || score.score_label,
    score_reasons: existingOpportunity?.score_reasons?.length ? existingOpportunity.score_reasons : score.score_reasons,
    origami_status: "completed",
    origami_profile: origamiProfile,
    origami_email_draft: {
      recommended_subject: lead.recommended_subject || "",
      email_body: lead.email_body || "",
    },
    origami_analyzed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const opportunity = existingOpportunity
    ? (await updateRows("opportunities", opportunityPatch, `id=eq.${encodeURIComponent(existingOpportunity.id)}`))[0] || existingOpportunity
    : await insertRow("opportunities", {
        contact_id: contact.id,
        ...opportunityPatch,
      });

  await insertRow("lead_search_results", {
    lead_search_id: leadSearchId,
    contact_id: contact.id,
    company_id: company?.id || null,
    opportunity_id: opportunity.id,
    page: 1,
    position,
  }).catch(() => null);

  if (contact?.id) await ensureContactTag(contact.id, "Origami sourced", "#db2777").catch(() => null);
  return { contact, company, opportunity };
}

async function completeOrigamiSourceSearch(user, leadSearch) {
  const origami = leadSearch?.filters?.origami_source || {};
  if (!origami.agent_id || !origami.run_id) return { saved: 0, status: leadSearch.status };
  const { run } = await getRun(origami.agent_id, origami.run_id);
  const status = origamiRunStatus(run?.status);
  if (status !== "completed") {
    await updateRows("lead_searches", { status, updated_at: new Date().toISOString() }, `id=eq.${encodeURIComponent(leadSearch.id)}`);
    return { saved: 0, status };
  }
  const text = extractOrigamiText(run);
  const parsed = extractOrigamiJson(text) || {};
  const leads = Array.isArray(parsed.leads) ? parsed.leads : [];
  let saved = 0;
  const campaign = origami.campaign || {
    campaign_type: leadSearch.lead_type,
    target_region: leadSearch.target_region,
    segment_key: origami.segment_key || "",
    name: leadSearch.name,
  };
  for (const [index, lead] of leads.entries()) {
    await saveOrigamiSourcedLead(user, campaign, lead, leadSearch.id, index + 1).then(() => {
      saved += 1;
    }).catch(() => null);
  }
  await updateRows(
    "lead_searches",
    {
      status: "completed",
      results_saved: saved,
      total_entries: leads.length,
      filters: { ...(leadSearch.filters || {}), origami_source: { ...origami, query_summary: parsed.query_summary || "", completed_at: new Date().toISOString() } },
      updated_at: new Date().toISOString(),
    },
    `id=eq.${encodeURIComponent(leadSearch.id)}`
  );
  return { saved, status: "completed", returned: leads.length };
}

async function refreshOrigamiSourceSearches(user, limit = 5) {
  const { payload } = await supabaseFetch(
    `/lead_searches?select=*&search_template=eq.origami_sourcing&status=eq.running&order=created_at.asc&limit=${Math.max(1, Math.min(20, Number(limit || 5)))}`
  );
  const results = [];
  for (const search of payload || []) {
    results.push(await completeOrigamiSourceSearch(user, search).catch((error) => ({ saved: 0, status: "failed", error: error.message })));
  }
  return results;
}

async function runningOrigamiSourceForCampaign(campaignId) {
  if (!campaignId) return null;
  const { payload } = await supabaseFetch(
    "/lead_searches?select=id,name,status,filters,created_at,updated_at&search_template=eq.origami_sourcing&status=eq.running&order=created_at.desc&limit=50"
  );
  const staleMs = 60 * 60 * 1000;
  return (payload || []).find((search) => {
    const filters = search.filters || {};
    const referenceDate = new Date(search.updated_at || search.created_at || 0).getTime();
    const isFresh = Number.isFinite(referenceDate) && Date.now() - referenceDate < staleMs;
    return isFresh && (filters.campaign_id === campaignId || filters.origami_source?.campaign?.id === campaignId);
  }) || null;
}

async function sourceLeadsWithOrigami(user, campaign, body = {}) {
  if (!origamiConfigured()) return { started: false, reason: "ORIGAMI_API_KEY no configurada.", saved: 0 };
  const runningSearch = await runningOrigamiSourceForCampaign(campaign.id).catch(() => null);
  if (runningSearch) {
    return {
      started: false,
      status: "running",
      lead_search_id: runningSearch.id,
      requested: Number(runningSearch.filters?.target_count || body.origami_source_count || body.count || 0),
      saved: 0,
      reason: "Ya existe una busqueda Origami sourcing corriendo para esta campana.",
    };
  }
  const targetCount = clampNumber(body.origami_source_count || body.count, 1, 500, 50);
  const query = String(body.origami_source_query || body.query || "").trim();
  const leadSearch = await insertRow("lead_searches", {
    name: `Origami Warehouse ${campaign.name}`.slice(0, 120),
    lead_type: campaign.campaign_type,
    target_region: campaign.target_region || (campaign.campaign_type === "investor" ? "usa" : "latam"),
    search_template: "origami_sourcing",
    filters: {
      query,
      target_count: targetCount,
      campaign_id: campaign.id,
      campaign_name: campaign.name,
      segment_key: campaign.segment_key,
    },
    status: "running",
    pages_requested: 1,
    results_saved: 0,
    created_by: user.db_user_id || null,
  });
  let result;
  try {
    result = await createAgentRun({
      name: `Tecnotitan lead sourcing - ${campaign.name}`.slice(0, 90),
      prompt: origamiSourcePrompt({ campaign, targetCount, query }),
      focusTableIds: sourceTableId() ? [sourceTableId()] : [],
    });
  } catch (error) {
    await updateRows(
      "lead_searches",
      {
        status: "failed",
        filters: { ...(leadSearch.filters || {}), error: error.message, failed_at: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      },
      `id=eq.${encodeURIComponent(leadSearch.id)}`
    ).catch(() => null);
    throw error;
  }
  const agent = result.agent || result.data?.agent || {};
  const run = result.run || result.data?.run || result;
  const filters = {
    ...(leadSearch.filters || {}),
    origami_source: {
      agent_id: agent.id || run.agentId || run.agent_id || null,
      run_id: run.id || null,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        campaign_type: campaign.campaign_type,
        target_region: campaign.target_region,
        segment_key: campaign.segment_key,
      },
      started_at: new Date().toISOString(),
    },
  };
  const rows = await updateRows(
    "lead_searches",
    {
      status: origamiRunStatus(run?.status),
      filters,
      updated_at: new Date().toISOString(),
    },
    `id=eq.${encodeURIComponent(leadSearch.id)}`
  );
  const savedSearch = rows[0] || { ...leadSearch, filters };
  const completion = await completeOrigamiSourceSearch(user, savedSearch).catch(() => ({ saved: 0, status: savedSearch.status }));
  return {
    started: true,
    lead_search_id: leadSearch.id,
    status: completion.status || savedSearch.status,
    requested: targetCount,
    saved: completion.saved || 0,
  };
}

async function prepareCampaignWarehouse(user, body = {}) {
  requireCampaignAdmin(user);
  const campaignId = String(body.campaign_id || "").trim();
  const targetQueue = clampNumber(body.target_queue || body.target_per_campaign, 1, 1000, 500);
  const sourceMix = "apollo";
  const apolloSourceCount = clampNumber(body.apollo_source_count || targetQueue, 0, 1000, targetQueue);
  const searchBatches = clampNumber(body.search_batches, 0, 40, Math.ceil(apolloSourceCount / 25));
  const revealLimit = clampNumber(body.reveal_limit, 0, 50, 25);
  const queueBatch = clampNumber(body.queue_batch, 1, 500, 100);
  const campaignFilters = [
    "select=*",
    campaignId ? `id=eq.${encodeURIComponent(campaignId)}` : "status=eq.active",
    "order=created_at.asc",
    "limit=10",
  ];
  const { payload } = await supabaseFetch(`/email_campaigns?${campaignFilters.join("&")}`);
  const campaigns = (payload || []).filter((campaign) => !campaign.start_at || new Date(campaign.start_at) > new Date() || campaign.status === "active");
  const results = [];

  for (const campaign of campaigns) {
    const before = await campaignRecipientSummary(campaign.id);
    const missing = Math.max(0, targetQueue - Number(before.queued || 0) - Number(before.sent || 0));
    let searches = 0;
    let revealed = 0;
    let queued = 0;
    const templateKeys = campaignTemplateKeys(campaign.campaign_type, campaign.target_region, campaign.segment_key, campaign.search_templates);

    for (let index = 0; index < searchBatches && missing > 0; index += 1) {
      const templateKey = templateKeys[index % templateKeys.length] || "investor:usa:vcs";
      await runApolloSearch(user, {
        template_key: templateKey,
        per_page: 25,
        name: `Warehouse ${campaign.name} ${templateKey}`.slice(0, 120),
      }).catch(() => null);
      searches += 1;
    }

    const revealCandidates = await warehouseCandidates(campaign, { withEmail: false, limit: revealLimit });
    for (const candidate of revealCandidates.slice(0, revealLimit)) {
      const enriched = await revealCampaignLeadEmail(candidate).catch(() => null);
      if (enriched?.contacts?.email) revealed += 1;
    }

    const afterAnalysis = await campaignRecipientSummary(campaign.id);
    const queueMissing = Math.max(0, targetQueue - Number(afterAnalysis.queued || 0) - Number(afterAnalysis.sent || 0));
    if (queueMissing > 0) {
      queued = await addCampaignRecipients(user, campaign, Math.min(queueBatch, queueMissing), campaign.start_at ? new Date(campaign.start_at) : new Date()).catch(() => 0);
    }
    const after = await campaignRecipientSummary(campaign.id);
    results.push({
      campaign_id: campaign.id,
      name: campaign.name,
      target_queue: targetQueue,
      source_mix: sourceMix,
      apollo_target: apolloSourceCount,
      origami_target: 0,
      queue_batch: queueBatch,
      searches,
      origami_sourced: 0,
      origami_source_status: "disabled",
      origami_source_reason: "Origami desactivado: Apollo es la fuente unica de leads.",
      origami_refreshed: 0,
      revealed,
      analyzed: 0,
      analyzed_with_email: 0,
      queued_added: queued,
      before,
      after,
    });
  }

  return { prepared_at: new Date().toISOString(), campaigns: results };
}

async function createCampaign(user, body) {
  requireCampaignAdmin(user);
  const campaignType = body.campaign_type === "investor" ? "investor" : "consulting_client";
  const senderKey = body.sender_key === "investors" ? "investors" : "consulting";
  const name = String(body.name || "").trim();
  const subject = String(body.subject_template || "").trim();
  const text = String(body.body_template || "").trim();
  const segment = campaignSegment(String(body.segment_key || "").trim(), campaignType);
  const targetRegion = String(segment.target_region || body.target_region || "").trim() || null;
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
    segment_key: segment.key,
    segment_label: segment.label,
    search_templates: segment.templates,
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
  const bounceControl = await enforceBounceControl(campaign, counts);
  if (bounceControl?.action === "paused") {
    return { sent: 0, failed: 0, skipped: 0, followups_sent: 0, bounce_control: bounceControl };
  }
  if (bounceControl?.action === "throttled") {
    return { sent: 0, failed: 0, skipped: 0, followups_sent: 0, bounce_control: bounceControl };
  }
  const queuedAndSent = (counts.queued || 0) + (counts.sent || 0);
  const remainingToQueue = campaign.max_recipients ? Math.max(0, campaign.max_recipients - queuedAndSent) : 0;
  const minReserve = minimumPreflightQueue(campaign);
  if (remainingToQueue > 0 && (counts.queued || 0) < Math.max(minReserve, campaign.batch_size || 1)) {
    await addCampaignRecipients(user, campaign, Math.min(50, remainingToQueue), nowDate);
    counts = await campaignCounts(campaign.id);
  }
  const reserve = await ensureCampaignReserve(user, campaign, counts, nowDate);
  if (!reserve.ok && Number(counts.sent || 0) === 0) {
    return {
      sent: 0,
      failed: 0,
      skipped: 0,
      followups_sent: 0,
      reserve_blocked: true,
      min_queue: reserve.min_queue,
      queued: reserve.queued,
      added_to_queue: reserve.added,
      message: reserve.message,
    };
  }
  if (reserve.counts) counts = reserve.counts;
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
    `/email_campaign_recipients?select=id,email,opportunity_id,status,opportunities(id,lead_type,target_region,origami_status,origami_profile,origami_email_draft,contacts(id,full_name,email,email_status,title,country,city),companies(id,name,country,city,industry))&campaign_id=eq.${encodeURIComponent(campaign.id)}&status=eq.queued&scheduled_at=lte.${encodeURIComponent(now)}&order=scheduled_at.asc&limit=${sendLimit}`
  );

  let sent = 0;
  let failed = 0;
  let followupsSent = 0;
  for (const recipient of recipients || []) {
    const opportunity = recipient.opportunities || {};
    const templateData = { opportunity, contact: opportunity.contacts, company: opportunity.companies, variant_seed: `${campaign.id}:${recipient.id}` };
    const subject = renderTemplate(personalizedCampaignTemplate(campaign, templateData, "subject_template"), templateData);
    const text = renderTemplate(personalizedCampaignTemplate(campaign, templateData, "body_template"), templateData);
    const qualityIssues = await emailQualityIssues(recipient.email, opportunity.contacts);
    if (qualityIssues.length) {
      await markDoubtfulEmail(opportunity.contacts?.id, qualityIssues);
      await updateRows(
        "email_campaign_recipients",
        {
          status: "skipped",
          reputation_status: "blocked",
          reputation_issues: qualityIssues,
          last_error: qualityIssues.join(" "),
          updated_at: new Date().toISOString(),
        },
        `id=eq.${encodeURIComponent(recipient.id)}`
      );
      failed += 1;
      continue;
    }
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
      `/email_campaign_recipients?select=id,email,opportunity_id,followup_step,next_followup_at,opportunities(id,lead_type,target_region,origami_email_draft,contacts(id,full_name,email,title,country,city),companies(id,name,country,city,industry))&campaign_id=eq.${encodeURIComponent(campaign.id)}&status=eq.sent&reply_received_at=is.null&next_followup_at=lte.${encodeURIComponent(now)}&order=next_followup_at.asc&limit=${remainingAfterInitial}`
    );
    for (const recipient of followups || []) {
      const opportunity = recipient.opportunities || {};
      const nextStep = Number(recipient.followup_step || 0) + 1;
      const templateData = {
        opportunity,
        contact: opportunity.contacts,
        company: opportunity.companies,
        followupStep: nextStep,
      };
      const subject = renderTemplate(personalizedFollowupTemplate(campaign, templateData, "followup_subject_template"), templateData);
      const text = renderTemplate(personalizedFollowupTemplate(campaign, templateData, "followup_body_template"), templateData);
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

async function updateCampaignStatus(user, body) {
  requireCampaignAdmin(user);
  const campaignId = String(body.campaign_id || "").trim();
  const nextStatus = String(body.status || "").trim().toLowerCase();
  const allowedStatuses = new Set(["active", "paused", "stopped", "archived", "completed"]);
  if (!campaignId) throw new Error("Selecciona una campana.");
  if (!allowedStatuses.has(nextStatus)) throw new Error("Estado de campana no permitido.");

  const { payload } = await supabaseFetch(`/email_campaigns?select=id,name,status&id=eq.${encodeURIComponent(campaignId)}&limit=1`);
  const campaign = payload?.[0];
  if (!campaign) throw new Error("Campana no encontrada.");
  if (campaign.status === "completed" && nextStatus === "active") {
    throw new Error("Una campana completada no se debe reactivar. Crea una nueva campana para continuar.");
  }
  if (campaign.status === "stopped" && nextStatus === "active") {
    throw new Error("Una campana detenida no se debe reactivar. Usa pausa si necesitas retomarla despues.");
  }
  if (campaign.status === "archived" && nextStatus === "active") {
    throw new Error("Una campana archivada no se debe reactivar. Crea una nueva campana para continuar.");
  }

  await updateRows(
    "email_campaigns",
    {
      status: nextStatus,
      updated_at: new Date().toISOString(),
    },
    `id=eq.${encodeURIComponent(campaign.id)}`
  );
  return { campaign_id: campaign.id, status: nextStatus };
}

async function processDueCampaigns() {
  const { payload } = await supabaseFetch(
    "/email_campaigns?select=id,name,status,sender_key,batch_size&status=eq.active&order=created_at.asc&limit=20"
  );
  const user = systemCampaignUser();
  const results = [];
  const campaigns = payload || [];
  const senderState = {};
  for (const campaign of campaigns) {
    const senderKey = campaign.sender_key === "investors" ? "investors" : "consulting";
    if (!senderState[senderKey]) {
      senderState[senderKey] = {
        warmup: await warmupStatus(senderKey),
        remaining_campaigns: campaigns.filter((item) => (item.sender_key === "investors" ? "investors" : "consulting") === senderKey).length,
      };
    }
  }

  for (const campaign of campaigns) {
    const senderKey = campaign.sender_key === "investors" ? "investors" : "consulting";
    const state = senderState[senderKey];
    const fairShare = state ? Math.ceil(Number(state.warmup.remaining_today || 0) / Math.max(1, state.remaining_campaigns || 1)) : Number(campaign.batch_size || 1);
    const maxSend = Math.min(Number(campaign.batch_size || 1), fairShare);
    if (!maxSend) {
      results.push({ campaign_id: campaign.id, name: campaign.name, sent: 0, failed: 0, skipped: 0, message: "Sin cupo diario disponible para este dominio." });
      if (state) state.remaining_campaigns = Math.max(0, state.remaining_campaigns - 1);
      continue;
    }
    try {
      const result = await processCampaign(user, { campaign_id: campaign.id, max_send: maxSend });
      const used = Number(result.sent || 0) + Number(result.followups_sent || 0);
      if (state) {
        state.warmup.remaining_today = Math.max(0, Number(state.warmup.remaining_today || 0) - used);
        state.remaining_campaigns = Math.max(0, state.remaining_campaigns - 1);
      }
      results.push({ campaign_id: campaign.id, name: campaign.name, fair_share: maxSend, ...result });
    } catch (error) {
      if (state) state.remaining_campaigns = Math.max(0, state.remaining_campaigns - 1);
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

function percent(part, total) {
  const denominator = Number(total || 0);
  return denominator ? Math.round((Number(part || 0) / denominator) * 1000) / 10 : 0;
}

function campaignHealthLabel(counts = {}) {
  const sent = Number(counts.sent || 0);
  const bounceRate = percent(counts.bounced, sent);
  const replyRate = percent(counts.replied, sent);
  if (bounceRate >= 5 || Number(counts.complained || 0) > 0) return "Riesgo alto";
  if (bounceRate >= 3 || Number(counts.reputation_blocked || 0) > 20) return "En observacion";
  if (sent >= 20 && replyRate >= 3) return "Saludable";
  return "Normal";
}

function campaignManagerRecommendations({ campaigns, warmups, totalCounts, recentTotals, inventory }) {
  const recommendations = [];
  const activeCampaigns = campaigns.filter((campaign) => campaign.status === "active");
  const pausedCampaigns = campaigns.filter((campaign) => campaign.status === "paused");
  const sent = Number(totalCounts.sent || 0);
  const bounceRate = percent(totalCounts.bounced, sent);
  const replyRate = percent(totalCounts.replied, sent);
  const investorInventory = inventory?.by_type?.find((row) => row.type === "investor" || row.label === "Inversionistas");

  if (!activeCampaigns.length) recommendations.push("No hay campanas activas. Revisar si se debe iniciar una nueva campana o reactivar una pausada.");
  if (pausedCampaigns.length) recommendations.push(`${pausedCampaigns.length} campana(s) pausada(s). Revisar motivo antes de reactivar.`);
  if (bounceRate >= 5) recommendations.push(`Rebote total en ${bounceRate}%. Pausar o reducir ritmo antes de seguir enviando.`);
  else if (bounceRate >= 3) recommendations.push(`Rebote total en ${bounceRate}%. Mantener bajo observacion y validar emails antes de ampliar volumen.`);
  if (replyRate >= 3) recommendations.push(`Respuesta acumulada ${replyRate}%. Buen indicador: priorizar segmentos/plantillas que estan respondiendo.`);
  if (recentTotals.replied > 0) recommendations.push(`Hay ${recentTotals.replied} respuesta(s) nuevas en 24h. Prioridad: revisar inbox y mover interesados a Kanban.`);
  if (recentTotals.sent === 0 && activeCampaigns.length) recommendations.push("No hubo envios en 24h aunque hay campanas activas. Revisar inventario aprobado, cupo diario o fecha de inicio.");
  if (investorInventory && Number(investorInventory.available_for_campaign || 0) < 25) {
    recommendations.push(`Inventario inversionista apto bajo: ${investorInventory.available_for_campaign}. Necesita mas busquedas Apollo y revelado de emails antes de escalar.`);
  }
  for (const warmup of warmups || []) {
    if (warmup.remaining_today <= 0) recommendations.push(`${warmup.domain}: cupo diario agotado. No se enviara mas desde ese dominio hoy.`);
  }
  return recommendations.length ? recommendations : ["Sistema sin alertas criticas. Mantener monitoreo diario."];
}

function buildCampaignReport({ campaigns, warmups, recentByCampaign, apolloLogs, sinceIso, inventory }) {
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
  const activeCampaigns = campaigns.filter((campaign) => campaign.status === "active");
  const pendingCapacity = campaigns.reduce((sum, campaign) => sum + Math.max(0, Number(campaign.max_recipients || 0) - Number(campaign.counts?.sent || 0)), 0);
  const totalReplyRate = percent(totalCounts.replied, totalCounts.sent);
  const totalBounceRate = percent(totalCounts.bounced, totalCounts.sent);
  const recentReplyRate = percent(recentTotals.replied, recentTotals.sent + recentTotals.followups_sent);
  const recentBounceRate = percent(recentTotals.bounced, recentTotals.sent + recentTotals.followups_sent);
  const recommendations = campaignManagerRecommendations({ campaigns, warmups, totalCounts, recentTotals, inventory });
  const lines = [
    `Reporte diario de campanas Tecnotitan`,
    `Fecha de envio: ${campaignReportDate()}`,
    `Ventana analizada: ultimas 24 horas desde ${new Date(sinceIso).toLocaleString("es-CO", { timeZone: "America/Bogota" })}`,
    "",
    "Resumen ejecutivo para gerencia",
    `- Estado general: ${campaignHealthLabel(totalCounts)}`,
    `- Campanas activas: ${activeCampaigns.length} de ${campaigns.length}`,
    `- Capacidad restante configurada: ${pendingCapacity} correos`,
    `- Tasa acumulada de respuesta: ${totalReplyRate}%`,
    `- Tasa acumulada de rebote: ${totalBounceRate}%`,
    `- Tasa de respuesta ultimas 24h: ${recentReplyRate}%`,
    `- Tasa de rebote ultimas 24h: ${recentBounceRate}%`,
    `- Creditos Apollo usados ultimas 24h: ${apolloCredits}`,
    "",
    "Decisiones recomendadas",
    ...recommendations.map((item) => `- ${item}`),
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
    "Inventario para campanas",
    ...(inventory?.by_type || []).map(
      (row) =>
        `- ${row.label || row.type}: ${row.available_for_campaign || 0} listas, ${row.with_email || 0} con email, ${row.blocked || 0} bloqueadas/no contactar`
    ),
    ...(inventory?.by_region || []).map(
      (row) =>
        `- Region ${row.label || row.region}: ${row.available_for_campaign || 0} aptas, cobertura email ${row.email_coverage_pct || 0}%, estado ${row.status}`
    ),
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
      `- Salud: ${campaignHealthLabel(counts)} | Progreso: ${counts.sent || 0}/${campaign.max_recipients || counts.total || 0} | Restante: ${Math.max(0, Number(campaign.max_recipients || 0) - Number(counts.sent || 0))}`,
      `- Cola: ${counts.queued || 0} | Listos ahora: ${(counts.due || 0) + (counts.followups_due || 0)} | Proximo envio: ${counts.next_scheduled_at || "sin pendientes"}`,
      `- Total enviados: ${counts.sent || 0} | Follow-ups: ${counts.followups_sent || 0} | Respuestas: ${counts.replied || 0}`,
      `- Tasas: respuesta ${percent(counts.replied, counts.sent)}% | rebote ${percent(counts.bounced, counts.sent)}%`,
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
  const [{ payload: recentRecipients }, { payload: apolloLogs }, inventory] = await Promise.all([
    supabaseFetch(
      `/email_campaign_recipients?select=campaign_id,status,sent_at,last_followup_sent_at,delivered_at,opened_at,clicked_at,bounced_at,failed_at,complained_at,reply_received_at,updated_at&updated_at=gte.${encodeURIComponent(since)}&limit=10000`
    ),
    supabaseFetch(`/apollo_sync_logs?select=operation,credits_used,created_at&created_at=gte.${encodeURIComponent(since)}&limit=10000`),
    leadInventory(user).catch(() => null),
  ]);
  const recentByCampaign = countRecentCampaignActivity(recentRecipients || [], since);
  const text = buildCampaignReport({ campaigns, warmups, recentByCampaign, apolloLogs: apolloLogs || [], sinceIso: since, inventory });
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

  if (req.method === "GET" && req.query.cron === "warehouse") {
    try {
      if (!isAuthorizedCron(req)) {
        res.status(401).json({ error: "Cron no autorizado." });
        return;
      }
      res.status(200).json(await prepareCampaignWarehouse(systemCampaignUser(), {
        target_queue: 500,
        source_mix: "apollo",
        origami_source_count: 0,
        apollo_source_count: 500,
        reveal_limit: 25,
        analyze_limit: 50,
        queue_batch: 500,
      }));
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
      if (req.body?.action === "prepare_warehouse") {
        res.status(200).json(await prepareCampaignWarehouse(user, req.body));
        return;
      }
      if (req.body?.action === "update_campaign_status") {
        res.status(200).json(await updateCampaignStatus(user, req.body));
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
