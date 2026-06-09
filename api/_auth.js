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

function configuredUsers() {
  const rawUsers = process.env.CRM_USERS_JSON;
  if (rawUsers) {
    return JSON.parse(rawUsers);
  }

  return [
    {
      username: process.env.CRM_USERNAME || "",
      name: "David Arias",
      email: "david@tecnotitan.com",
      role: "admin",
      password_hash: process.env.CRM_PASSWORD_HASH || "",
    },
  ];
}

function publicUser(user) {
  return {
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
    db_user_id: user.db_user_id,
  };
}

function createSession(user) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = base64url(JSON.stringify({ ...publicUser(user), sub: user.username, exp: expiresAt }));
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

function verifySession(token) {
  const [payload, signature] = String(token || "").split(".");
  if (!payload || !signature) return false;
  if (!timingSafeEqual(sign(payload), signature)) return false;

  const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (data.exp <= Math.floor(Date.now() / 1000)) return null;
  return {
    username: data.username || data.sub,
    name: data.name,
    email: data.email,
    role: data.role || "consultant",
    db_user_id: data.db_user_id,
  };
}

function verifyPassword(password, passwordHash) {
  const stored = String(passwordHash || "").replace(/^"|"$/g, "");
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
  const user = configuredUsers().find((item) => item.username === String(username || ""));
  if (!user) return null;
  return verifyPassword(password, user.password_hash) ? publicUser(user) : null;
}

function requireUser(req, res) {
  const token = tokenFromRequest(req);
  const user = verifySession(token);

  if (user) {
    return user;
  }

  const legacyToken = process.env.CRM_ADMIN_TOKEN || "";
  if (legacyToken && timingSafeEqual(token, legacyToken)) {
    return {
      username: "david",
      name: "David Arias",
      email: "david@tecnotitan.com",
      role: "admin",
    };
  }

  res.status(401).json({ error: "Sesion invalida o expirada." });
  return null;
}

function requireAdmin(req, res) {
  const user = requireUser(req, res);
  if (!user) return null;
  if (user.role !== "admin") {
    res.status(403).json({ error: "Solo el usuario maestro puede realizar esta accion." });
    return null;
  }
  return user;
}

module.exports = { createSession, requireAdmin, requireUser, verifyCredentials };
