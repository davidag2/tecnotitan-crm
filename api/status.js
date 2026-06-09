module.exports = async function handler(req, res) {
  res.status(200).json({
    status: "ok",
    app: "tecnotitan-crm",
    supabaseConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    apolloConfigured: Boolean(process.env.APOLLO_API_KEY),
    tokenRequired: Boolean(process.env.CRM_ADMIN_TOKEN),
  });
};
