const { requireUser } = require("./_auth");
const { emailStatus, resendFetch, senderFor } = require("./_resend");
const { insertRow, supabaseFetch, updateRows } = require("./_supabase");

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
  };
  return String(template || "").replace(
    /\{\{\s*(nombre|primer_nombre|cargo|empresa|pais|ciudad|industria|tipo_lead|categoria|region)\s*\}\}/gi,
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
    contact: row.contacts || null,
    company: row.companies || null,
    opportunity: row.opportunities || null,
  };
}

async function listMessages(user, req) {
  const mailbox = String(req.query.mailbox || "all");
  const q = String(req.query.q || "").trim().toLowerCase();
  const filters = [
    "select=id,thread_id,direction,status,provider_message_id,message_id,from_email,to_emails,subject,snippet,text_body,html_body,sent_at,received_at,created_at,opportunities(id,lead_type,target_region,owner_user_id),contacts(id,full_name,email,title),companies(id,name,domain)",
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
    `/email_campaign_recipients?select=status,sent_at,scheduled_at&campaign_id=eq.${encodeURIComponent(campaignId)}&limit=5000`
  );
  const today = todayStartIso();
  const counts = { queued: 0, due: 0, sent: 0, failed: 0, skipped: 0, sent_today: 0, total: 0, next_scheduled_at: null };
  const now = new Date().toISOString();
  for (const row of payload || []) {
    counts.total += 1;
    counts[row.status] = (counts[row.status] || 0) + 1;
    if (row.status === "sent" && row.sent_at && row.sent_at >= today) counts.sent_today += 1;
    if (row.status === "queued" && row.scheduled_at <= now) counts.due += 1;
    if (row.status === "queued" && (!counts.next_scheduled_at || row.scheduled_at < counts.next_scheduled_at)) {
      counts.next_scheduled_at = row.scheduled_at;
    }
  }
  return counts;
}

async function listCampaigns(user) {
  requireCampaignAdmin(user);
  const { payload } = await supabaseFetch(
    "/email_campaigns?select=id,name,campaign_type,sender_key,status,daily_limit,batch_size,min_delay_minutes,max_delay_minutes,subject_template,body_template,target_region,last_processed_at,created_at&order=created_at.desc&limit=50"
  );
  const campaigns = [];
  for (const campaign of payload || []) {
    campaigns.push({ ...campaign, counts: await campaignCounts(campaign.id) });
  }
  return campaigns;
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
    subject_template: subject,
    body_template: text,
    target_region: targetRegion,
    created_by: user.db_user_id || null,
    status: "active",
  });

  const leads = await campaignLeadPool(campaignType, targetRegion);
  const recipients = scheduleRecipients(campaign.id, leads, minDelay, maxDelay);
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

  const counts = await campaignCounts(campaign.id);
  const remainingToday = Math.max(0, campaign.daily_limit - counts.sent_today);
  const sendLimit = Math.min(remainingToday, campaign.batch_size, clampNumber(body.max_send, 1, 25, campaign.batch_size));
  if (!sendLimit) return { sent: 0, failed: 0, remaining_today: 0, message: "Limite diario alcanzado." };

  const now = new Date().toISOString();
  const { payload: recipients } = await supabaseFetch(
    `/email_campaign_recipients?select=id,email,opportunity_id,status,opportunities(id,lead_type,target_region,contacts(id,full_name,email,title,country,city),companies(id,name,country,city,industry))&campaign_id=eq.${encodeURIComponent(campaign.id)}&status=eq.queued&scheduled_at=lte.${encodeURIComponent(now)}&order=scheduled_at.asc&limit=${sendLimit}`
  );

  let sent = 0;
  let failed = 0;
  for (const recipient of recipients || []) {
    const opportunity = recipient.opportunities || {};
    const subject = renderTemplate(campaign.subject_template, { opportunity, contact: opportunity.contacts, company: opportunity.companies });
    const text = renderTemplate(campaign.body_template, { opportunity, contact: opportunity.contacts, company: opportunity.companies });
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
          sent_at: new Date().toISOString(),
          provider_message_id: message.provider_message_id || null,
          last_error: null,
          updated_at: new Date().toISOString(),
        },
        `id=eq.${encodeURIComponent(recipient.id)}`
      );
      sent += 1;
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

  await updateRows(
    "email_campaigns",
    { last_processed_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    `id=eq.${encodeURIComponent(campaign.id)}`
  );

  const nextCounts = await campaignCounts(campaign.id);
  if (nextCounts.queued === 0) {
    await updateRows("email_campaigns", { status: "completed", updated_at: new Date().toISOString() }, `id=eq.${encodeURIComponent(campaign.id)}`);
  }
  return { sent, failed, remaining_today: Math.max(0, campaign.daily_limit - nextCounts.sent_today), counts: nextCounts };
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
      if (req.query.mode === "campaigns") {
        res.status(200).json({ campaigns: await listCampaigns(user) });
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
