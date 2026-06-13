const DEFAULT_TARGETS = {
  tecnotitan: "https://www.tecnotitanmarketing.com/api/templates",
  copiloto: "https://copilotopyme.com",
};

function isAuthorizedCron(req) {
  const vercelCronSecret = process.env.CRON_SECRET || "";
  const authorization = String(req.headers.authorization || "");
  if (vercelCronSecret && authorization === `Bearer ${vercelCronSecret}`) return true;

  const configuredSecret = process.env.STATUS_CRON_SECRET || process.env.CAMPAIGN_CRON_SECRET || "";
  const receivedSecret = String(req.query.token || req.headers["x-cron-token"] || "").trim();
  if (configuredSecret) return receivedSecret === configuredSecret;

  return String(req.headers["user-agent"] || "").includes("vercel-cron/1.0");
}

function targetUrl(target) {
  const key = String(target || "").toLowerCase();
  if (key === "tecnotitan") return process.env.STATUS_TECNOTITAN_URL || DEFAULT_TARGETS.tecnotitan;
  if (key === "copiloto") return process.env.STATUS_COPILOTO_PYME_URL || DEFAULT_TARGETS.copiloto;
  return "";
}

async function checkUrl(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const startedAt = Date.now();
  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "User-Agent": "Tecnotitan-Status-Monitor/1.0",
      },
    });
    const durationMs = Date.now() - startedAt;
    return {
      ok: response.ok,
      status: response.status,
      duration_ms: durationMs,
      checked_at: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Metodo no permitido." });
    return;
  }

  if (!isAuthorizedCron(req)) {
    res.status(401).json({ error: "Cron no autorizado." });
    return;
  }

  const target = String(req.query.target || "").toLowerCase();
  const url = targetUrl(target);
  if (!url) {
    res.status(400).json({ error: "Target de status no configurado." });
    return;
  }

  try {
    const result = await checkUrl(url);
    const body = { target, url, ...result };
    if (!result.ok) {
      res.status(502).json(body);
      return;
    }
    res.status(200).json(body);
  } catch (error) {
    res.status(504).json({
      target,
      url,
      ok: false,
      error: error.name === "AbortError" ? "Timeout al revisar status." : error.message,
      checked_at: new Date().toISOString(),
    });
  }
};
