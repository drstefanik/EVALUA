// /api/auth/signup-student.js
import { ensureMethod, parseJsonBody, sendError } from "../_lib/http.js";
import { hashPassword, signJWT } from "../../src/util.js";
import { tbl } from "../../src/airtable.js";
import { findStudentByEmail } from "../../src/finders.js";

const ALLOWED_IDENTIFICATION_DOCUMENTS = new Set([
  "Passport",
  "National ID",
  "Residence Permit",
  "Driver License",
  "Other",
]);

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
  const place_birth   = pick(body?.place_birth ?? body?.placeOfBirth);
  const country_birth = pick(body?.country_birth ?? body?.countryOfBirth);
  const identification_document = pick(body?.identification_document ?? body?.identificationDocument);
  const document_number = pick(body?.document_number ?? body?.documentNumber);

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

  if (!place_birth) return sendError(res, 400, "place_birth is required");
  if (!country_birth) return sendError(res, 400, "country_birth is required");
  if (!identification_document) return sendError(res, 400, "identification_document is required");
  if (!ALLOWED_IDENTIFICATION_DOCUMENTS.has(identification_document)) {
    return sendError(res, 400, "identification_document is invalid");
  }
  if (!document_number) return sendError(res, 400, "document_number is required");

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
          place_birth,
          country_birth,
          identification_document,
          document_number,
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
