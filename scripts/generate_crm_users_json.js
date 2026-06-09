const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

const iterations = 210000;
const users = [
  {
    username: "david",
    password: process.env.DAVID_CRM_PASSWORD || process.argv[2],
    name: "David Arias",
    email: "david@tecnotitan.com",
    role: "admin",
    db_user_id: "adba40b5-a6d0-4a13-a6ac-fc1dd536cae4",
  },
  {
    username: "consultor",
    password: process.env.CONSULTOR_CRM_PASSWORD || process.argv[3],
    name: "Consultor Tecnotitan",
    email: "consultor@tecnotitan.com",
    role: "consultant",
    db_user_id: "f312e8ad-237c-4d96-b243-f515c2d7f940",
  },
];

if (users.some((user) => !user.password)) {
  throw new Error("Define DAVID_CRM_PASSWORD y CONSULTOR_CRM_PASSWORD, o pasalas como argumentos.");
}

function hashPassword(password) {
  const salt = crypto.randomBytes(18).toString("base64url");
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("base64url");
  return `pbkdf2_sha256:${iterations}:${salt}:${hash}`;
}

const publicUsers = users.map(({ password, ...user }) => ({
  ...user,
  password_hash: hashPassword(password),
}));

fs.writeFileSync(path.join(os.tmpdir(), "crm-users-json.txt"), JSON.stringify(publicUsers));
console.log("Generated CRM_USERS_JSON for david and consultor.");
