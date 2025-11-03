import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const DEFAULT_SALT_ROUNDS = 10;
const { JWT_SECRET, JWT_EXPIRATION = "7d" } = process.env;

if (!JWT_SECRET) {
  throw new Error("Missing required environment variable: JWT_SECRET");
}

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(DEFAULT_SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

export function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function signJWT(payload, options = {}) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION, ...options });
}

export function verifyJWT(token, options = {}) {
  return jwt.verify(token, JWT_SECRET, options);
}
