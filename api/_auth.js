const crypto = require("crypto");
const { verifyPassword, timingSafeEqual } = require("./_password");
const { supabaseFetch } = require("./_supabase");

const SESSION_TTL_SECONDS = 60 * 60 * 12;

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function sign(value) {
  const secret = process.env.CRM_SESSION_SECRET || process.env.CRM_ADMIN_TOKEN || "";
  if (!secret) throw new Error("CRM_SESSION_SECRET no esta configurado en Vercel.");
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
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

function appRole(dbRole) {
  return dbRole === "admin" ? "admin" : "consultant";
}

async function findDbUser(username) {
  const query = [
    "select=id,username,name,email,role,password_hash,is_active",
    `username=eq.${encodeURIComponent(username)}`,
    "is_active=eq.true",
    "limit=1",
  ].join("&");
  const { payload } = await supabaseFetch(`/users?${query}`);
  const user = payload?.[0];
  if (!user?.password_hash) return null;
  return {
    username: user.username,
    name: user.name,
    email: user.email,
    role: appRole(user.role),
    db_user_id: user.id,
    password_hash: user.password_hash,
  };
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

async function verifyCredentials(username, password) {
  const normalizedUsername = String(username || "").trim();
  const dbUser = await findDbUser(normalizedUsername).catch(() => null);
  if (dbUser) {
    return verifyPassword(password, dbUser.password_hash) ? publicUser(dbUser) : null;
  }

  const user = configuredUsers().find((item) => item.username === normalizedUsername);
  if (!user) return null;
  return verifyPassword(password, user.password_hash) ? publicUser(user) : null;
}

function configuredLoginPin() {
  return String(process.env.CRM_LOGIN_PIN || process.env.CRM_PIN || "224477").trim();
}

function verifyPin(pin) {
  const submittedPin = String(pin || "").trim();
  const expectedPin = configuredLoginPin();
  if (!/^\d{6}$/.test(submittedPin) || !/^\d{6}$/.test(expectedPin)) return null;
  if (!timingSafeEqual(submittedPin, expectedPin)) return null;

  const configuredAdmin = configuredUsers().find((item) => item.role === "admin") || {};
  return {
    username: configuredAdmin.username || process.env.CRM_USERNAME || "david",
    name: configuredAdmin.name || "David Arias",
    email: configuredAdmin.email || "david@tecnotitan.com",
    role: "admin",
  };
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

module.exports = { createSession, requireAdmin, requireUser, verifyCredentials, verifyPin };
