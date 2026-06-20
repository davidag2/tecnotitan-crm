const fs = require("fs");
const path = require("path");

const ORIGAMI_BASE_URL = process.env.ORIGAMI_BASE_URL || "https://origami.chat";
const DEFAULT_KEEP_WORKSPACE_ID = "b9f7c531-0d8d-499e-9ea2-1bc3093ed1d1";

function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadDotEnv(path.join(process.cwd(), ".env"));
loadDotEnv(path.join(process.cwd(), ".env.local"));

const apiKey = process.env.ORIGAMI_API_KEY;
const keepWorkspaceId = process.env.ORIGAMI_KEEP_WORKSPACE_ID || process.argv.find((arg) => arg.startsWith("--keep="))?.slice(7) || DEFAULT_KEEP_WORKSPACE_ID;
const execute = process.argv.includes("--execute");
const includeRunning = process.argv.includes("--include-running");

function agentStatus(agent) {
  return String(agent.lastRun?.status || "unknown").toLowerCase();
}

async function origamiFetch(pathname, options = {}) {
  if (!apiKey) throw new Error("Falta ORIGAMI_API_KEY en .env, .env.local o variable de entorno.");
  const response = await fetch(`${ORIGAMI_BASE_URL}${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || text || `Origami respondio ${response.status}`);
  }
  return payload;
}

async function listAgents() {
  const agents = [];
  let page = 0;
  while (true) {
    const payload = await origamiFetch(`/api/v2/agents?page=${page}&pageSize=100`);
    agents.push(...(payload.agents || []));
    if (!payload.pagination?.hasMore) break;
    page += 1;
  }
  return agents;
}

async function archiveAgent(agent) {
  return origamiFetch(`/api/v2/agents/${encodeURIComponent(agent.id)}`, { method: "DELETE" });
}

function shouldArchive(agent) {
  if (!agent.id || !agent.workspaceId) return false;
  if (agent.workspaceId === keepWorkspaceId) return false;
  if (!includeRunning && agentStatus(agent) === "running") return false;
  return true;
}

async function main() {
  const agents = await listAgents();
  const candidates = agents.filter(shouldArchive);
  const skippedKeep = agents.filter((agent) => agent.workspaceId === keepWorkspaceId);
  const skippedRunning = agents.filter((agent) => agent.workspaceId !== keepWorkspaceId && agentStatus(agent) === "running");
  const workspaceIds = new Set(agents.map((agent) => agent.workspaceId).filter(Boolean));
  const candidateWorkspaceIds = new Set(candidates.map((agent) => agent.workspaceId).filter(Boolean));

  console.log(JSON.stringify({
    mode: execute ? "execute" : "dry-run",
    total_agents: agents.length,
    total_workspaces_seen: workspaceIds.size,
    keep_workspace_id: keepWorkspaceId,
    kept_agents_in_gold_workspace: skippedKeep.length,
    running_agents_skipped: includeRunning ? 0 : skippedRunning.length,
    archive_candidates: candidates.length,
    candidate_workspaces: candidateWorkspaceIds.size,
    candidates: candidates.map((agent) => ({
      id: agent.id,
      name: agent.name,
      workspaceId: agent.workspaceId,
      lastRunStatus: agentStatus(agent),
      createdAt: agent.createdAt,
    })),
  }, null, 2));

  if (!execute) return;

  const archived = [];
  for (const agent of candidates) {
    const result = await archiveAgent(agent);
    archived.push({
      agentId: result.agent?.id || agent.id,
      agentDeletedAt: result.agent?.deletedAt || null,
      workspaceId: result.workspace?.id || agent.workspaceId,
      workspaceDeletedAt: result.workspace?.deletedAt || null,
      name: agent.name,
    });
  }

  console.log(JSON.stringify({ archived }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
