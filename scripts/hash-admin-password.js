import { hashPassword } from "../src/util.js";

const password = process.argv[2] || process.env.ADMIN_PASSWORD;

if (!password) {
  console.error("Usage: node scripts/hash-admin-password.js <password>");
  process.exit(1);
}

try {
  const hash = await hashPassword(password);
  console.log(hash);
} catch (error) {
  console.error("Unable to hash admin password", error);
  process.exit(1);
}
