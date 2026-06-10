const { requireUser } = require("./_auth");
const { readJsonBody } = require("./_request");
const { insertRow, supabaseFetch, updateRows } = require("./_supabase");

const ALLOWED_STATUSES = new Set([
  "nuevo",
  "calificado",
  "contactado",
  "reunion_agendada",
  "propuesta_enviada",
  "ganado",
  "perdido",
  "archivado",
]);

async function loadOpportunity(id, user) {
  const filters = [
    "select=id,pipeline_status,owner_user_id",
    `id=eq.${encodeURIComponent(id)}`,
    "deleted_at=is.null",
    "limit=1",
  ];

  if (user.role !== "admin") {
    filters.splice(2, 0, `owner_user_id=eq.${encodeURIComponent(user.db_user_id || "")}`);
  }

  const { payload } = await supabaseFetch(`/opportunities?${filters.join("&")}`);
  return payload?.[0] || null;
}

module.exports = async function handler(req, res) {
  const user = requireUser(req, res);
  if (!user) return;
  if (req.method !== "POST") {
    res.status(405).json({ error: "Metodo no permitido." });
    return;
  }

  try {
    const body = await readJsonBody(req);
    if (!body.opportunity_id || !body.pipeline_status) {
      res.status(400).json({ error: "opportunity_id y pipeline_status son requeridos." });
      return;
    }
    if (!ALLOWED_STATUSES.has(body.pipeline_status)) {
      res.status(400).json({ error: "Estado de pipeline no permitido." });
      return;
    }

    const opportunity = await loadOpportunity(body.opportunity_id, user);
    if (!opportunity) {
      res.status(404).json({ error: "No se encontro el lead o no tienes acceso." });
      return;
    }

    if (opportunity.pipeline_status !== body.pipeline_status) {
      await updateRows(
        "opportunities",
        {
          pipeline_status: body.pipeline_status,
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        `id=eq.${encodeURIComponent(body.opportunity_id)}`
      );
      await insertRow("pipeline_events", {
        opportunity_id: body.opportunity_id,
        from_status: opportunity.pipeline_status,
        to_status: body.pipeline_status,
        changed_by: user.db_user_id || null,
        note: body.note || null,
      });
    }

    res.status(200).json({ ok: true, from_status: opportunity.pipeline_status, to_status: body.pipeline_status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
