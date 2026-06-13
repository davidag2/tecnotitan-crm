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

async function loadOpportunity(id, user) {
  if (!id) return null;
  const filters = [
    "select=id,contact_id,company_id,lead_type,target_region,owner_user_id,contacts(id,full_name,email),companies(id,name)",
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
      html: textToHtml(text),
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
    html_body: textToHtml(text),
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

  const user = requireUser(req, res);
  if (!user) return;

  try {
    if (req.method === "GET") {
      res.status(200).json({ status: emailStatus(), messages: await listMessages(user, req) });
      return;
    }
    if (req.method === "POST") {
      const message = await sendEmail(user, req.body || {});
      res.status(201).json({ message });
      return;
    }
    res.status(405).json({ error: "Metodo no permitido." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
