const crypto = require("crypto");

const SESSION_TTL_SECONDS = 60 * 60 * 12;

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function sign(value) {
  const secret = process.env.CRM_SESSION_SECRET || process.env.CRM_ADMIN_TOKEN || "";
  if (!secret) throw new Error("CRM_SESSION_SECRET no esta configurado en Vercel.");
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function timingSafeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function tokenFromRequest(req) {
  const authorization = req.headers.authorization || "";
  if (authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim();
  }

  return req.headers["x-crm-token"] || "";
}

function createSession(username) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = base64url(JSON.stringify({ sub: username, exp: expiresAt }));
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

function verifySession(token) {
  const [payload, signature] = String(token || "").split(".");
  if (!payload || !signature) return false;
  if (!timingSafeEqual(sign(payload), signature)) return false;

  const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  return data.exp > Math.floor(Date.now() / 1000);
}

function verifyPassword(password) {
  const stored = String(process.env.CRM_PASSWORD_HASH || "").replace(/^"|"$/g, "");
  const [algorithm, iterations, salt, expected] = stored.split(":");
  if (algorithm !== "pbkdf2_sha256" || !iterations || !salt || !expected) {
    throw new Error("CRM_PASSWORD_HASH no esta configurado correctamente.");
  }

  const actual = crypto
    .pbkdf2Sync(String(password || ""), salt, Number(iterations), 32, "sha256")
    .toString("base64url");

  return timingSafeEqual(actual, expected);
}

function verifyCredentials(username, password) {
  const expectedUsername = process.env.CRM_USERNAME || "";
  if (!expectedUsername) throw new Error("CRM_USERNAME no esta configurado en Vercel.");
  if (!timingSafeEqual(String(username || ""), expectedUsername)) return false;
  return verifyPassword(password);
}

function requireAdmin(req, res) {
  const token = tokenFromRequest(req);

  if (verifySession(token)) {
    return true;
  }

  const legacyToken = process.env.CRM_ADMIN_TOKEN || "";
  if (legacyToken && timingSafeEqual(token, legacyToken)) {
    return true;
  }

  res.status(401).json({ error: "Sesion invalida o expirada." });
  return false;
}

module.exports = { createSession, requireAdmin, verifyCredentials };
