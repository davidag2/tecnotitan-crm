const crypto = require("crypto");

const ITERATIONS = 210000;

function timingSafeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(18).toString("base64url");
  const hash = crypto.pbkdf2Sync(String(password || ""), salt, ITERATIONS, 32, "sha256").toString("base64url");
  return `pbkdf2_sha256:${ITERATIONS}:${salt}:${hash}`;
}

function verifyPassword(password, passwordHash) {
  const stored = String(passwordHash || "").replace(/^"|"$/g, "");
  const [algorithm, iterations, salt, expected] = stored.split(":");
  if (algorithm !== "pbkdf2_sha256" || !iterations || !salt || !expected) {
    return false;
  }

  const actual = crypto
    .pbkdf2Sync(String(password || ""), salt, Number(iterations), 32, "sha256")
    .toString("base64url");

  return timingSafeEqual(actual, expected);
}

module.exports = { hashPassword, timingSafeEqual, verifyPassword };
