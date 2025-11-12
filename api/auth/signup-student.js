// /api/auth/signup-student.js
import { ensureMethod, parseJsonBody, sendError } from "../_lib/http.js";
import { hashPassword, signJWT } from "../../src/util.js";
import { tbl } from "../../src/airtable.js";
import { findStudentByEmail } from "../../src/finders.js";

function pick(v, alt = "") {
  return typeof v === "string" ? v.trim() : (typeof v === "number" ? String(v) : alt);
}

export default async function handler(req, res) {
  if (!ensureMethod(req, res, "POST")) return;

  let body = null;
  try {
    body = await parseJsonBody(req);
  } catch (_) {
    // fallback: a volte framework passa già req.body
    body = req.body || null;
  }

  // Normalizza sia snake_case che camelCase
  const firstName = pick(body?.first_name ?? body?.firstName);
  const lastName  = pick(body?.last_name  ?? body?.lastName);
  const email     = pick(body?.email).toLowerCase();
  const password  = typeof body?.password === "string" ? body.password : "";

  const date_of_birth = pick(body?.date_of_birth ?? body?.dateOfBirth, null); // ISO preferito, ma opzionale
  const nationality   = pick(body?.nationality);
  const phone         = pick(body?.phone);

  const missing = [];
  if (!firstName) missing.push("first_name");
  if (!lastName)  missing.push("last_name");
  if (!email)     missing.push("email");
  if (!password)  missing.push("password");
  if (missing.length) {
    // piccolo log di debug (senza password)
    console.warn("Signup missing fields:", missing);
    return sendError(res, 400, `Incomplete student registration data: ${missing.join(", ")}`);
  }

  try {
    // email unica
    const existing = await findStudentByEmail(email);
    if (existing) return sendError(res, 409, "Email already registered");

    // crea utente
    const password_hash = await hashPassword(password);

    const created = await tbl.STUDENTS.create([
      {
        fields: {
          first_name: firstName,
          last_name:  lastName,
          email,
          password_hash,
          status: "active",
          date_of_birth: date_of_birth || null,
          nationality: nationality || "",
          phone: phone || "",
        },
      },
    ]);

    const id = created[0]?.id;
    if (!id) {
      console.error("Student creation failed", created);
      return sendError(res, 500, "Unable to create the student");
    }

    const payload = { role: "student", id, email };
    const response = {
      token: signJWT(payload),
      role: "student",
      id,
      name: `${firstName} ${lastName}`,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Signup student error", error);
    return sendError(res, 500, "Server error");
  }
}
