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

  const schoolId   = typeof body?.schoolId   === "string" ? body.schoolId.trim()   : "";
  const schoolName = typeof body?.schoolName === "string" ? body.schoolName.trim() : "";

  const date_of_birth = typeof body?.date_of_birth === "string" ? body.date_of_birth : null; // "YYYY-MM-DD"
  const nationality   = typeof body?.nationality   === "string" ? body.nationality   : "";
  const phone         = typeof body?.phone         === "string" ? body.phone         : "";

  if (!firstName || !lastName || !email || !password) {
    return sendError(res, 400, "Incomplete student registration data");
  }

  // serve una scuola: via schoolId o via schoolName
  if (!schoolId && !schoolName) {
    return sendError(res, 400, "School is required");
  }

  try {
    // 1) email unica
    const existing = await findStudentByEmail(email);
    if (existing) return sendError(res, 409, "Email already registered");

    // 2) risolvi scuola
    let school = null;
    if (schoolId) {
      try {
        const rec = await tbl.SCHOOLS.find(schoolId);
        if (rec?.id) school = { id: rec.id, name: rec.fields?.Name || rec.fields?.name || "" };
      } catch {}
    }
    if (!school && schoolName) {
      const list = await tbl.SCHOOLS.select({
        maxRecords: 1,
        filterByFormula: `LOWER({Name}) = "${schoolName.toLowerCase()}"`
      }).firstPage();
      if (list?.length) {
        const rec = list[0];
        school = { id: rec.id, name: rec.fields?.Name || rec.fields?.name || "" };
      }
    }
    if (!school) return sendError(res, 400, "School not found");

    // 3) crea utente
    const password_hash = await hashPassword(password);

    const created = await tbl.STUDENTS.create([
      {
        fields: {
          first_name: firstName,
          last_name:  lastName,
          email,
          password_hash,
          status: "active",
          school: [school.id],
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

    const payload = { role: "student", id, email, schoolId: school.id };
    const response = {
      token: signJWT(payload),
      role: "student",
      id,
      name: `${firstName} ${lastName}`,
      schoolId: school.id,
      schoolName: school.name,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Signup student error", error);
    return sendError(res, 500, "Server error");
  }
}
