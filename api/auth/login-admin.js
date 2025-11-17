import { handleCors } from "../_lib/cors.js";
import { ensureMethod, parseJsonBody, sendError } from "../_lib/http.js";
import { comparePassword, signJWT } from "../../src/util.js";
import { findAdminByEmail } from "../../src/finders.js";

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (!ensureMethod(req, res, "POST")) return;

  let body;
  try {
    body = await parseJsonBody(req);
  } catch (error) {
    console.error("login-admin invalid payload", error);
    return sendError(res, 400, "Invalid payload");
  }

  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return sendError(res, 400, "Missing email or password");
  }

  try {
    const admin = await findAdminByEmail(email);

    if (!admin) {
      return sendError(res, 401, "Invalid credentials");
    }

    if (admin.status !== "active") {
      return sendError(res, 403, "Admin account is not active");
    }

    const passwordValid = await comparePassword(password, admin.password_hash || "");

    if (!passwordValid) {
      return sendError(res, 401, "Invalid credentials");
    }

    const payload = {
      sub: admin.id,
      email: admin.email,
      name: admin.full_name,
      role: "admin",
      type: "admin",
    };

    const token = signJWT(payload);

    return res.status(200).json({
      token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.full_name,
        role: "admin",
      },
    });
  } catch (error) {
    console.error("login-admin error", error);
    return sendError(res, 500, "Server error");
  }
}
