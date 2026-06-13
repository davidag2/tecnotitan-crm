const RESEND_API_BASE = "https://api.resend.com";

function resendConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

function senderOptions() {
  return [
    {
      key: "consulting",
      label: "Consultoria",
      from: process.env.RESEND_FROM_CONSULTING || "",
    },
    {
      key: "investors",
      label: "Inversionistas",
      from: process.env.RESEND_FROM_INVESTORS || "",
    },
  ];
}

function senderFor(key, opportunity) {
  const options = senderOptions();
  const preferredKey = key || (opportunity?.lead_type === "investor" ? "investors" : "consulting");
  return options.find((option) => option.key === preferredKey && option.from) || options.find((option) => option.from) || null;
}

async function resendFetch(path, options = {}) {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY no esta configurado en Vercel.");
  const response = await fetch(`${RESEND_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || `Resend respondio ${response.status}`);
  }
  return payload;
}

function emailStatus() {
  const options = senderOptions();
  return {
    resendConfigured: resendConfigured(),
    webhookTokenConfigured: Boolean(process.env.RESEND_WEBHOOK_TOKEN),
    senders: options.map((option) => ({
      key: option.key,
      label: option.label,
      configured: Boolean(option.from),
      from: option.from,
    })),
  };
}

module.exports = { emailStatus, resendFetch, senderFor, senderOptions };
