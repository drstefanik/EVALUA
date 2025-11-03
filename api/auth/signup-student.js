import { ensureMethod, parseJsonBody, sendError } from "../_lib/http.js";
import { hashPassword, signJWT } from "../../src/util.js";
import { tbl } from "../../src/airtable.js";
import { findSchoolByCode, findStudentByEmail } from "../../src/finders.js";

export default async function handler(req, res) {
  if (!ensureMethod(req, res, "POST")) return;

  let body;
  try {
    body = await parseJsonBody(req);
  } catch (error) {
    console.error("Invalid JSON body", error);
    return sendError(res, 400, "Invalid payload");
  }

  const full_name = typeof body?.full_name === "string" ? body.full_name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const school_code_raw =
    typeof body?.school_code === "string" ? body.school_code.trim() : "";
  const school_code = school_code_raw.toUpperCase();

  if (!full_name || !email || !password) {
    return sendError(res, 400, "Incomplete student registration data");
  }

  if (!school_code) {
    return sendError(res, 400, "School Code is required");
  }

  try {
    const school = await findSchoolByCode(school_code);
    if (!school) {
      return sendError(res, 400, "Invalid School Code");
    }

    const existing = await findStudentByEmail(email);
    if (existing) {
      return sendError(res, 409, "Email already registered");
    }

    const password_hash = await hashPassword(password);

    const created = await tbl.STUDENTS.create([
      {
        fields: {
          full_name,
          email,
          password_hash,
          status: "active",
          school: [school.id],
        },
      },
    ]);

    const id = created[0]?.id;
    if (!id) {
      console.error("Student creation failed", created);
      return sendError(res, 500, "Unable to create the student");
    }

    const payload = {
      role: "student",
      id,
      email,
      schoolId: school.id,
    };

    const response = {
      token: signJWT(payload),
      role: "student",
      id,
      name: full_name,
      schoolId: school.id,
      schoolName: school.name,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Signup student error", error);
    return sendError(res, 500, "Server error");
  }
}
