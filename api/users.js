const { requireAdmin } = require("./_auth");
const { hashPassword } = require("./_password");
const { readJsonBody } = require("./_request");
const { insertRow, supabaseFetch, updateRows } = require("./_supabase");

function dbRole(role) {
  return role === "admin" ? "admin" : "sales";
}

function publicUsers(users) {
  return (users || []).map(({ password_hash, ...user }) => user);
}

async function listUsers() {
  const query = ["select=id,username,name,email,role,is_active,created_at", "order=name.asc"].join("&");
  const { payload } = await supabaseFetch(`/users?${query}`);
  return publicUsers(payload);
}

async function createUser(body) {
  if (!body.username || !body.name || !body.email || !body.password) {
    throw new Error("username, name, email y password son requeridos.");
  }

  return insertRow("users", {
    username: String(body.username).trim(),
    name: String(body.name).trim(),
    email: String(body.email).trim(),
    role: dbRole(body.role),
    password_hash: hashPassword(body.password),
    is_active: true,
  });
}

async function updateUser(body, actingUser) {
  if (!body.id) throw new Error("id es requerido.");

  const patch = {
    updated_at: new Date().toISOString(),
  };

  if (body.username) patch.username = String(body.username).trim();
  if (body.name) patch.name = String(body.name).trim();
  if (body.email) patch.email = String(body.email).trim();
  if (body.role) patch.role = dbRole(body.role);
  if (typeof body.is_active === "boolean") {
    if (body.id === actingUser.db_user_id && body.is_active === false) {
      throw new Error("No puedes desactivar tu propio usuario maestro.");
    }
    patch.is_active = body.is_active;
  }
  if (body.password) patch.password_hash = hashPassword(body.password);

  const rows = await updateRows("users", patch, `id=eq.${encodeURIComponent(body.id)}`);
  return rows[0] || null;
}

module.exports = async function handler(req, res) {
  const user = requireAdmin(req, res);
  if (!user) return;

  try {
    if (req.method === "GET") {
      res.status(200).json({ users: await listUsers() });
      return;
    }

    const body = await readJsonBody(req);
    if (req.method === "POST") {
      await createUser(body);
      res.status(201).json({ users: await listUsers() });
      return;
    }

    if (req.method === "PATCH") {
      await updateUser(body, user);
      res.status(200).json({ users: await listUsers() });
      return;
    }

    res.status(405).json({ error: "Metodo no permitido." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
