const { createSession, verifyCredentials } = require("./_auth");
const { readJsonBody } = require("./_request");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Metodo no permitido." });
    return;
  }

  try {
    const { username, password } = await readJsonBody(req);
    const user = verifyCredentials(username, password);
    if (!user) {
      res.status(401).json({ error: "Usuario o contrasena incorrectos." });
      return;
    }

    res.status(200).json({
      token: createSession(user),
      user,
      username: user.username,
      expires_in_seconds: 43200,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
