const { requireAdmin } = require("./_auth");
const { readJsonBody } = require("./_request");
const { updateRows } = require("./_supabase");

module.exports = async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== "POST") {
    res.status(405).json({ error: "Metodo no permitido." });
    return;
  }

  try {
    const body = await readJsonBody(req);
    if (!body.opportunity_id || !body.owner_user_id) {
      res.status(400).json({ error: "opportunity_id y owner_user_id son requeridos." });
      return;
    }

    const rows = await updateRows(
      "opportunities",
      {
        owner_user_id: body.owner_user_id,
        updated_at: new Date().toISOString(),
      },
      `id=eq.${encodeURIComponent(body.opportunity_id)}`
    );

    res.status(200).json({ opportunity: rows[0] || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
