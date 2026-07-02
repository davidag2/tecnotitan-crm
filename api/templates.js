const { listTemplates } = require("./_templates");

module.exports = async function handler(req, res) {
  res.status(200).json({
    templates: listTemplates(),
    count: listTemplates().length,
    status: "ok",
    app: "tecnotitan-crm",
    supabaseConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    apolloConfigured: Boolean(process.env.APOLLO_API_KEY),
    origamiConfigured: false,
    resendConfigured: Boolean(process.env.RESEND_API_KEY),
    resendSendersConfigured: Boolean(process.env.RESEND_FROM_CONSULTING || process.env.RESEND_FROM_INVESTORS),
    resendWebhookConfigured: Boolean(process.env.RESEND_WEBHOOK_TOKEN),
    loginConfigured: Boolean(
      process.env.CRM_SESSION_SECRET &&
        (process.env.CRM_LOGIN_PIN || process.env.CRM_PIN || process.env.CRM_USERS_JSON || process.env.CRM_PASSWORD_HASH)
    ),
  });
};
