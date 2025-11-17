import { handleCors } from "../_lib/cors.js";
import { ensureMethod, parseJsonBody, sendError } from "../_lib/http.js";
import { hashPassword } from "../../src/util.js";
import { tbl } from "../../src/airtable.js";
import { findAdminByEmail } from "../../src/finders.js";

const adminTable = tbl(process.env.AIRTABLE_TABLE_ADMINS || "Admin");

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (!ensureMethod(req, res, "POST")) return;

  let body;
  try {
    body = await parseJsonBody(req);
  } catch (error) {
    console.error("signup-admin invalid payload", error);
    return sendError(res, 400, "Invalid payload");
  }

  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const confirmPassword =
    typeof body?.confirmPassword === "string" ? body.confirmPassword : "";
  const secret = typeof body?.secret === "string" ? body.secret.trim() : "";

  if (!fullName || !email || !password || !confirmPassword || !secret) {
    return sendError(res, 400, "Missing required fields");
  }

  if (password !== confirmPassword) {
    return sendError(res, 400, "Passwords do not match");
  }

  if (!process.env.ADMIN_SIGNUP_SECRET || secret !== process.env.ADMIN_SIGNUP_SECRET) {
    return sendError(res, 403, "Not authorized");
  }

  try {
    const existingAdmin = await findAdminByEmail(email);
    if (existingAdmin) {
      return sendError(res, 409, "Admin with this email already exists");
    }

    const password_hash = await hashPassword(password);

    const created = await adminTable.create([
      {
        fields: {
          email,
          full_name: fullName,
          password_hash,
          status: "active",
        },
      },
    ]);

    const admin = created?.[0];
    if (!admin?.id) {
      console.error("signup-admin creation failed", created);
      return sendError(res, 500, "Unable to create the admin");
    }

    return res.status(201).json({
      message: "Admin created successfully",
      admin: {
        id: admin.id,
        email,
        full_name: fullName,
        status: "active",
      },
    });
  } catch (error) {
    console.error("signup-admin error", error);
    return sendError(res, 500, "Server error");
  }
}
