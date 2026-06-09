function tokenFromRequest(req) {
  const authorization = req.headers.authorization || "";
  if (authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim();
  }

  return req.headers["x-crm-token"] || "";
}

function requireAdmin(req, res) {
  const expected = process.env.CRM_ADMIN_TOKEN;
  if (!expected) {
    res.status(500).json({ error: "CRM_ADMIN_TOKEN no esta configurado en Vercel." });
    return false;
  }

  if (tokenFromRequest(req) !== expected) {
    res.status(401).json({ error: "Token interno invalido o ausente." });
    return false;
  }

  return true;
}

module.exports = { requireAdmin };
