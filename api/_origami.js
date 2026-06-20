const ORIGAMI_BASE_URL = process.env.ORIGAMI_BASE_URL || "https://origami.chat";
const ORIGAMI_API_KEY = process.env.ORIGAMI_API_KEY || "";
const ORIGAMI_WORKSPACE_ID = process.env.ORIGAMI_WORKSPACE_ID || "";

function origamiConfigured() {
  return Boolean(ORIGAMI_API_KEY);
}

function assertOrigami() {
  if (!ORIGAMI_API_KEY) {
    throw new Error("ORIGAMI_API_KEY no esta configurada en Vercel.");
  }
}

async function origamiFetch(path, options = {}) {
  assertOrigami();
  const response = await fetch(`${ORIGAMI_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${ORIGAMI_API_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    if (response.status === 402) {
      throw new Error("Origami requiere un plan con API activa para esta integracion.");
    }
    if (response.status === 401) {
      throw new Error("La llave ORIGAMI_API_KEY no es valida o fue revocada.");
    }
    if (response.status === 429) {
      throw new Error("Origami esta limitando solicitudes. Espera unos minutos antes de reintentar.");
    }
    throw new Error(payload?.message || payload?.error || text || `Origami respondio ${response.status}`);
  }

  return { payload, headers: response.headers };
}

async function getCreditBalance() {
  const { payload } = await origamiFetch("/api/v1/credits/balance");
  return payload;
}

async function createAgentRun({ name, prompt, workspaceId = null, focusTableIds = [] }) {
  const resolvedWorkspaceId = workspaceId || ORIGAMI_WORKSPACE_ID || null;
  const { payload } = await origamiFetch("/api/v2/agents", {
    method: "POST",
    body: JSON.stringify({
      name,
      prompt,
      workspaceId: resolvedWorkspaceId,
      focusTableIds,
    }),
  });
  return payload;
}

async function getRun(agentId, runId) {
  const { payload, headers } = await origamiFetch(`/api/v2/agents/${encodeURIComponent(agentId)}/runs/${encodeURIComponent(runId)}`);
  return {
    run: payload,
    retryAfter: Number(headers.get("retry-after") || 15),
  };
}

module.exports = {
  createAgentRun,
  getCreditBalance,
  getRun,
  origamiConfigured,
  workspaceConfigured: () => Boolean(ORIGAMI_WORKSPACE_ID),
};
