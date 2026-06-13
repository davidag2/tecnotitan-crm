const { requireUser } = require("./_auth");
const { emailStatus, resendFetch, senderFor } = require("./_resend");
const { insertRow, supabaseFetch, updateRows } = require("./_supabase");
const crypto = require("crypto");

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

function brandedEmailHtml(text, senderKey) {
  const accent = senderKey === "investors" ? "#1f5eff" : "#16856e";
  const label = senderKey === "investors" ? "Tecnotitan Investors" : "Tecnotitan Consultoria";
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

function addDaysIso(dateValue, days) {
  const date = new Date(dateValue || Date.now());
  date.setUTCDate(date.getUTCDate() + Number(days || 0));
  return date.toISOString();
}

function scheduleRecipients(campaignId, leads, minDelayMinutes, maxDelayMinutes) {
  let scheduledAt = Date.now();
  return leads.map((lead, index) => {
    if (index > 0) {
      scheduledAt += randomInteger(minDelayMinutes, maxDelayMinutes) * 60 * 1000;
    }
    return {
      campaign_id: campaignId,
      opportunity_id: lead.id,
      contact_id: lead.contact_id,
      company_id: lead.company_id,
      email: emailAddress(lead.contacts.email),
      status: "queued",
      scheduled_at: new Date(scheduledAt).toISOString(),
    };
  });
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
    "select=id,thread_id,direction,status,provider_message_id,message_id,from_email,to_emails,subject,snippet,text_body,html_body,sent_at,received_at,created_at,last_event_type,last_event_at,opportunities(id,lead_type,target_region,owner_user_id),contacts(id,full_name,email,title),companies(id,name,domain)",
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
    "/email_campaigns?select=id,name,campaign_type,sender_key,status,daily_limit,batch_size,min_delay_minutes,max_delay_minutes,followup_enabled,followup_delays_days,followup_subject_template,followup_body_template,subject_template,body_template,target_region,last_processed_at,created_at&order=created_at.desc&limit=50"
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

async function campaignLeadPool(campaignType, targetRegion) {
  const filters = [
    "select=id,contact_id,company_id,lead_type,target_region,owner_user_id,contacts(id,full_name,email,title,country,city),companies(id,name,country,city,industry)",
    `lead_type=eq.${encodeURIComponent(campaignType)}`,
    targetRegion ? `target_region=eq.${encodeURIComponent(targetRegion)}` : "",
    "deleted_at=is.null",
    "order=score.desc",
    "limit=500",
  ].filter(Boolean);
  const { payload } = await supabaseFetch(`/opportunities?${filters.join("&")}`);
  const seen = new Set();
  return (payload || [])
    .filter((opportunity) => opportunity.contacts?.email)
    .filter((opportunity) => {
      const email = emailAddress(opportunity.contacts.email);
      if (!email || seen.has(email)) return false;
      seen.add(email);
      return true;
    });
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
  const followupSubject = String(body.followup_subject_template || "Re: {{empresa}}").trim();
  const followupBody = String(
    body.followup_body_template ||
      "Hola {{primer_nombre}},\n\nTe escribo para hacer seguimiento a mi mensaje anterior.\n\nSi este tema no es prioridad ahora, lo entiendo. Si tiene sentido revisarlo, puedo enviarte una idea concreta para {{empresa}}.\n\nSaludos,\nDavid Arias\nFundador, Tecnotitan"
  ).trim();
  if (!name) throw new Error("El nombre de la campana es requerido.");
  if (!subject) throw new Error("El asunto de la campana es requerido.");
  if (!text) throw new Error("El cuerpo de la campana es requerido.");

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
    created_by: user.db_user_id || null,
    status: "active",
  });

  const leads = await campaignLeadPool(campaignType, targetRegion);
  const allowedLeads = [];
  const blockedRecipients = [];
  for (const lead of leads) {
    const email = normalizeEmail(lead.contacts.email);
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
  const recipients = [...scheduleRecipients(campaign.id, allowedLeads, minDelay, maxDelay), ...blockedRecipients];
  if (recipients.length) {
    await supabaseFetch("/email_campaign_recipients", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(recipients),
    });
  }

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
  const sender = senderFor(campaign.sender_key);

  const counts = await campaignCounts(campaign.id);
  const warmup = await warmupStatus(campaign.sender_key);
  const campaignRemainingToday = Math.max(0, campaign.daily_limit - counts.sent_today);
  const remainingToday = Math.min(campaignRemainingToday, warmup.remaining_today);
  const sendLimit = Math.min(remainingToday, campaign.batch_size, clampNumber(body.max_send, 1, 25, campaign.batch_size));
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
              ? addDaysIso(new Date().toISOString(), campaign.followup_delays_days[0])
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
        });
        const nextDelay = campaign.followup_delays_days?.[nextStep] || null;
        await updateRows(
          "email_campaign_recipients",
          {
            followup_step: nextStep,
            next_followup_at: nextDelay ? addDaysIso(new Date().toISOString(), nextDelay) : null,
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
  if (nextCounts.queued === 0 && !nextCounts.next_scheduled_at) {
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
  const html = brandedEmailHtml(text, sender.key);

  const thread = await findOrCreateThread({ opportunity, subject });
  const headers = {};
  if (body.in_reply_to) headers["In-Reply-To"] = body.in_reply_to;
  if (body.references) headers.References = body.references;
  const tags = [{ name: "crm", value: "tecnotitan" }];
  if (opportunity?.id) {
    tags.push({ name: "opportunity", value: opportunity.id.replace(/-/g, "_").slice(0, 256) });
  }

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
    snippet: snippet(text),
    raw_payload: data,
    sent_at: new Date().toISOString(),
  });
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
