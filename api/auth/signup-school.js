import { ensureMethod, parseJsonBody, sendError } from "../_lib/http.js";
import { hashPassword, signJWT } from "../../src/util.js";
import { tbl } from "../../src/airtable.js";
import { findOTP, findSchoolByCode, findSchoolByEmail } from "../../src/finders.js";

const SCHOOL_CODE_LENGTH = 8;
const SCHOOL_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function createSchoolCode() {
  let code = "";
  for (let index = 0; index < SCHOOL_CODE_LENGTH; index += 1) {
    const randomIndex = Math.floor(Math.random() * SCHOOL_CODE_CHARS.length);
    code += SCHOOL_CODE_CHARS[randomIndex];
  }
  return code;
}

async function generateUniqueSchoolCode() {
  const maxAttempts = 10;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const code = createSchoolCode();
    const existing = await findSchoolByCode(code);
    if (!existing) {
      return code;
    }
  }
  throw new Error("Unable to generate unique school code");
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

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const otp_code = typeof body?.otp_code === "string" ? body.otp_code.trim() : "";

  if (!name || !email || !password || !otp_code) {
    return sendError(res, 400, "Incomplete school registration data");
  }

  try {
    const existing = await findSchoolByEmail(email);
    if (existing) {
      return sendError(res, 409, "School email already registered");
    }

    const otp = await findOTP(otp_code);
    if (!otp || otp.used === true) {
      return sendError(res, 400, "OTP not valid or already used");
    }

    const password_hash = await hashPassword(password);
    const school_code = await generateUniqueSchoolCode();

    const created = await tbl.SCHOOLS.create([
      {
        fields: { name, email, password_hash, status: "active", school_code },
      },
    ]);

    const schoolId = created[0]?.id;
    if (!schoolId) {
      console.error("School creation failed", created);
      return sendError(res, 500, "Unable to create the school");
    }

    await tbl.SCHOOL_OTP.update([
      { id: otp.id, fields: { used: true, school: [schoolId] } },
    ]);

    const token = signJWT({ role: "school", id: schoolId, email });
    res
      .status(201)
      .json({
        token,
        role: "school",
        id: schoolId,
        name,
        email,
        schoolCode: school_code,
      });
  } catch (error) {
    console.error("Signup school error", error);
    return sendError(res, 500, "Server error");
  }
}
