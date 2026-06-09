const { requireAdmin } = require("./_auth");
const { countRows } = require("./_supabase");

module.exports = async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  try {
    const [companies, contacts, opportunities, searches, hot, warm] = await Promise.all([
      countRows("companies", "&deleted_at=is.null"),
      countRows("contacts", "&deleted_at=is.null"),
      countRows("opportunities", "&deleted_at=is.null"),
      countRows("lead_searches"),
      countRows("opportunities", "&deleted_at=is.null&score_label=eq.hot"),
      countRows("opportunities", "&deleted_at=is.null&score_label=eq.warm"),
    ]);

    res.status(200).json({ companies, contacts, opportunities, searches, hot, warm });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
