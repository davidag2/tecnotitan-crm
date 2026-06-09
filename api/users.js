const { requireAdmin } = require("./_auth");
const { supabaseFetch } = require("./_supabase");

module.exports = async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  try {
    const query = [
      "select=id,name,email,role,is_active",
      "is_active=eq.true",
      "order=name.asc",
    ].join("&");
    const { payload } = await supabaseFetch(`/users?${query}`);
    res.status(200).json({ users: payload || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
