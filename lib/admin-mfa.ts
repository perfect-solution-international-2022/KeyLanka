import crypto from "crypto";

function mfaSecret() {
  const secret = process.env.ADMIN_MFA_SECRET ?? process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_MFA_SECRET or JWT_SECRET must be at least 32 characters");
  }
  return secret;
}

export function generateAdminLoginCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

export function hashAdminLoginCode(challengeId: string, code: string) {
  return crypto.createHmac("sha256", mfaSecret()).update(`${challengeId}:${code}`).digest("hex");
}

export function verifyAdminLoginCode(challengeId: string, code: string, expectedHash: string) {
  const actual = Buffer.from(hashAdminLoginCode(challengeId, code), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

