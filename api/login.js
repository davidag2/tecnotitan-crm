const { createSession, verifyCredentials, verifyPin } = require("./_auth");
const { readJsonBody } = require("./_request");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Metodo no permitido." });
    return;
  }

  try {
    const { username, password, pin } = await readJsonBody(req);
    const user = pin ? verifyPin(pin) : await verifyCredentials(username, password);
    if (!user) {
      res.status(401).json({ error: pin ? "PIN incorrecto." : "Usuario o contrasena incorrectos." });
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
