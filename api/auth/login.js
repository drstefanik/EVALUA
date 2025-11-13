import { ensureMethod, parseJsonBody, sendError } from "../_lib/http.js";
import { comparePassword, signJWT } from "../../src/util.js";
import { tbl } from "../../src/airtable.js";
import {
  findAdminByEmail,
  findSchoolByEmail,
  findStudentByEmail,
} from "../../src/finders.js";

const schoolsTable = tbl("Schools");

function sanitizeExtras(extras = {}) {
  return Object.fromEntries(
    Object.entries(extras).filter(([, value]) => value !== undefined)
  );
}

export default async function handler(req, res) {
  if (!ensureMethod(req, res, "POST")) return;

  let body;
  try {
    body = await parseJsonBody(req);
  } catch (error) {
    console.error("Invalid JSON body", error);
    return sendError(res, 400, "Invalid payload");
  }

  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return sendError(res, 400, "Email and password are required");
  }

  const tryLogin = async (user, role, nameField, extras = {}) => {
    if (!user) return false;

    if (user.status !== "active") {
      sendError(res, 423, "User disabled");
      return true;
    }

    const passwordMatch = await comparePassword(password, user.password_hash);
    if (!passwordMatch) {
      return false;
    }

    const sanitizedExtra = sanitizeExtras(extras);
    const payload = {
      role,
      id: user.id,
      email: user.email,
      ...sanitizedExtra,
    };

    res.status(200).json({
      token: signJWT(payload),
      role,
      id: user.id,
      name: user[nameField],
      email: user.email,
      ...sanitizedExtra,
    });
    return true;
  };

  try {
    if (await tryLogin(await findAdminByEmail(email), "admin", "full_name")) return;

    const schoolUser = await findSchoolByEmail(email);
    if (
      await tryLogin(schoolUser, "school", "name", { schoolCode: schoolUser?.school_code })
    )
      return;

    const student = await findStudentByEmail(email);
    const studentExtras = {
      features: {
        courses: Boolean(student?.enable_courses),
        quaet: Boolean(student?.enable_quaet),
        results: Boolean(student?.enable_results),
        personal_details: Boolean(student?.feature_personal_details),
      },
    };
    const schoolId = student?.school?.[0];
    if (schoolId) {
      studentExtras.schoolId = schoolId;
      try {
        const schoolRecord = await schoolsTable.find(schoolId);
        const schoolName = schoolRecord?.fields?.name;
        if (schoolName) {
          studentExtras.schoolName = schoolName;
        }
      } catch (innerError) {
        console.error("Unable to load school details for student login", innerError);
      }
    }
    if (await tryLogin(student, "student", "full_name", studentExtras)) return;
    return sendError(res, 401, "Invalid email or password");
  } catch (error) {
    console.error("Login error", error);
    return sendError(res, 500, "Server error");
  }
}
