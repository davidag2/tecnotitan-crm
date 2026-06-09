const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
const username = process.argv[2] || "david";
const providedPassword = process.argv[3] || "";
const iterations = 210000;

function randomString(length) {
  return Array.from(crypto.randomBytes(length), (byte) => chars[byte % chars.length]).join("");
}

const password = providedPassword || randomString(18);
const salt = randomString(24);
const sessionSecret = randomString(48);
const hash = crypto.pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("base64url");
const passwordHash = `pbkdf2_sha256:${iterations}:${salt}:${hash}`;
const outputDir = os.tmpdir();

fs.writeFileSync(path.join(outputDir, "crm-generated-password.txt"), password);
fs.writeFileSync(path.join(outputDir, "crm-username.txt"), username);
fs.writeFileSync(path.join(outputDir, "crm-password-hash.txt"), passwordHash);
fs.writeFileSync(path.join(outputDir, "crm-session-secret.txt"), sessionSecret);

console.log(`Generated CRM credentials for ${username}.`);
