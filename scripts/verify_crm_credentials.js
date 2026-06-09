const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

const envPath = process.argv[2] || ".env.vercel.production";
const env = {};

for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const index = line.indexOf("=");
  let value = line.slice(index + 1);
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1);
  }
  value = value.replace(/\\"/g, '"');
  env[line.slice(0, index)] = value;
}

const password = fs.readFileSync(path.join(os.tmpdir(), "crm-generated-password.txt"), "utf8");
const [algorithm, iterations, salt, expected] = env.CRM_PASSWORD_HASH.split(":");
const actual = crypto.pbkdf2Sync(password, salt, Number(iterations), 32, "sha256").toString("base64url");

console.log(
  JSON.stringify({
    user: env.CRM_USERNAME,
    hashShape: `${algorithm}:${Boolean(iterations)}:${Boolean(salt)}:${Boolean(expected)}`,
    loginVars: Boolean(env.CRM_USERNAME && env.CRM_PASSWORD_HASH && env.CRM_SESSION_SECRET),
    localMatch: actual === expected,
    passwordLength: password.length,
  })
);
