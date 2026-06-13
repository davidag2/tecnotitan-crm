const crypto = require("crypto");
const { insertRow, supabaseFetch, updateRows } = require("./_supabase");

function normalizeEmail(value) {
  const raw = String(value || "").trim();
  const match = raw.match(/<([^>]+)>/);
  return (match ? match[1] : raw).trim().toLowerCase();
}

function unsubscribeSecret() {
  return process.env.UNSUBSCRIBE_SECRET || process.env.CRM_SESSION_SECRET || process.env.RESEND_WEBHOOK_TOKEN || "tecnotitan-local-unsubscribe";
}

function unsubscribeToken(email) {
  return crypto.createHmac("sha256", unsubscribeSecret()).update(normalizeEmail(email)).digest("hex");
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

async function upsertUnsubscribe(email) {
  const normalized = normalizeEmail(email);
  const row = {
    email: normalized,
    reason: "unsubscribed",
    source: "unsubscribe_link",
    note: "Baja solicitada desde link del correo.",
    active: true,
    updated_at: new Date().toISOString(),
  };
  const { payload } = await supabaseFetch("/email_exclusions?on_conflict=email", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(row),
  });
  await updateRows(
    "email_campaign_recipients",
    {
      reply_received_at: new Date().toISOString(),
      next_followup_at: null,
      suppressed_at: new Date().toISOString(),
      last_error: "Unsubscribed",
      updated_at: new Date().toISOString(),
    },
    `email=eq.${encodeURIComponent(normalized)}`
  );
  await insertRow("email_events", {
    event_id: `unsubscribe:${normalized}:${Date.now()}`,
    event_type: "unsubscribed",
    email: normalized,
    occurred_at: new Date().toISOString(),
    raw_payload: { source: "unsubscribe_link" },
  }).catch(() => null);
  return payload?.[0] || row;
}

function html(message) {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Tecnotitan - baja confirmada</title>
  </head>
  <body style="margin:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#13213a;">
    <main style="max-width:560px;margin:64px auto;padding:28px;background:#fff;border:1px solid #dfe6ef;border-radius:10px;">
      <h1 style="margin-top:0;">${message}</h1>
      <p>Tu solicitud fue registrada. No enviaremos mas correos de prospeccion a esta direccion.</p>
      <p style="color:#66758d;font-size:13px;">Tecnotitan Marketing</p>
    </main>
  </body>
</html>`;
}

module.exports = async function handler(req, res) {
  if (!["GET", "POST"].includes(req.method)) {
    res.status(405).send("Metodo no permitido.");
    return;
  }
  try {
    const url = new URL(req.url, "https://www.tecnotitanmarketing.com");
    const email = normalizeEmail(url.searchParams.get("email"));
    const token = String(url.searchParams.get("token") || "");
    if (!email || !safeEqual(token, unsubscribeToken(email))) {
      res.status(401).send("Link de baja invalido.");
      return;
    }
    await upsertUnsubscribe(email);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html("Baja confirmada"));
  } catch (error) {
    res.status(500).send("No pudimos procesar la baja en este momento.");
  }
};
