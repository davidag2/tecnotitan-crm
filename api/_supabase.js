const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function assertSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configurados en Vercel.");
  }
}

async function supabaseFetch(path, options = {}) {
  assertSupabase();
  const response = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || text || `Supabase respondio ${response.status}`);
  }

  return { payload, headers: response.headers };
}

async function countRows(table, filter = "") {
  const { headers } = await supabaseFetch(`/${table}?select=id${filter}`, {
    method: "HEAD",
    headers: { Prefer: "count=exact" },
  });
  const range = headers.get("content-range") || "0-0/0";
  return Number(range.split("/").pop() || 0);
}

async function insertRow(table, row) {
  const { payload } = await supabaseFetch(`/${table}`, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(row),
  });
  return payload?.[0] || null;
}

async function updateRows(table, row, filter) {
  const { payload } = await supabaseFetch(`/${table}?${filter}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(row),
  });
  return payload || [];
}

async function upsertRow(table, row, conflictColumns) {
  const conflict = encodeURIComponent(conflictColumns.join(","));
  const { payload } = await supabaseFetch(`/${table}?on_conflict=${conflict}`, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(row),
  });
  return payload?.[0] || null;
}

module.exports = { countRows, insertRow, supabaseFetch, updateRows, upsertRow };
