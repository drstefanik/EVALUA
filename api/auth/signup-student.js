// /api/auth/signup-student.js
import { ensureMethod, parseJsonBody, sendError } from "../_lib/http.js";
import { hashPassword, signJWT } from "../../src/util.js";
import { tbl } from "../../src/airtable.js";
import { findStudentByEmail } from "../../src/finders.js";

export default async function handler(req, res) {
  if (!ensureMethod(req, res, "POST")) return;

  let body;
  try {
    body = await parseJsonBody(req);
  } catch (error) {
    console.error("Invalid JSON body", error);
    return sendError(res, 400, "Invalid payload");
  }

  const firstName = typeof body?.first_name === "string" ? body.first_name.trim() : "";
  const lastName  = typeof body?.last_name  === "string" ? body.last_name.trim()  : "";
  const email     = typeof body?.email      === "string" ? body.email.trim()      : "";
  const password  = typeof body?.password   === "string" ? body.password          : "";

  // nuovi campi (tutti opzionali)
  const date_of_birth = typeof body?.date_of_birth === "string" ? body.date_of_birth : null; // "YYYY-MM-DD"
  const nationality   = typeof body?.nationality   === "string" ? body.nationality   : "";
  const phone         = typeof body?.phone         === "string" ? body.phone         : "";

  if (!firstName || !lastName || !email || !password) {
    return sendError(res, 400, "Incomplete student registration data");
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
          nationality: nationality || "",   // Single select in Airtable (ok passare stringa)
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
