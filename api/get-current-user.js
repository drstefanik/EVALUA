// api/get-current-user.js
import Airtable from "airtable";
import { handleCors } from "./_lib/cors.js";

function ensureEnv(value, name) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;
const tableName = process.env.AIRTABLE_TABLE_STUDENTS || "Students";

const base = new Airtable({ apiKey: ensureEnv(AIRTABLE_API_KEY, "AIRTABLE_API_KEY") }).base(
  ensureEnv(AIRTABLE_BASE_ID, "AIRTABLE_BASE_ID")
);

function escapeFormulaValue(value) {
  return String(value).replace(/"/g, '\\"');
}

// Helpers per leggere varianti di nomi campo
function pickField(fields, keys = []) {
  for (const k of keys) {
    if (fields[k] !== undefined && fields[k] !== null && fields[k] !== "") {
      return fields[k];
    }
  }
  return null;
}

function toISODateYMD(value) {
  if (!value) return "";
  try {
    // Airtable Date o stringa
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      // solo YYYY-MM-DD
      return d.toISOString().slice(0, 10);
    }
    // se è già una stringa tipo "12/11/2025" la lascio così (meglio non perdere info)
    return String(value);
  } catch {
    return String(value);
  }
}

async function findStudentById(id) {
  if (!id) return null;
  try {
    const record = await base(tableName).find(id);
    return record || null;
  } catch (error) {
    if (error?.statusCode === 404) return null;
    throw error;
  }
}

async function findStudentByEmail(email) {
  if (!email) return null;
  const normalized = String(email).trim().toLowerCase();
  if (!normalized) return null;
  const records = await base(tableName)
    .select({
      maxRecords: 1,
      filterByFormula: `LOWER({email}) = "${escapeFormulaValue(normalized)}"`,
    })
    .firstPage();
  return records[0] || null;
}

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  try {
    const id = req.query?.id || req.body?.id;
    const email = req.query?.email || req.body?.email;

    const record = (await findStudentById(id)) || (await findStudentByEmail(email));

    if (!record) {
      return res.status(404).json({ error: "User not found" });
    }

    const f = record.fields || {};

    // Mappature flessibili
    const fullName = pickField(f, ["full_name", "Full Name", "name", "Name"]) || "";
    const school = pickField(f, ["school", "School"]) || "";
    const nationality =
      pickField(f, ["nationality", "Nationality", "country", "Country"]) || "";
    const dateOfBirthRaw =
      pickField(f, ["date_of_birth", "Date of birth", "Date Of Birth", "DOB", "dob"]) || "";
    const dateOfBirth = toISODateYMD(dateOfBirthRaw);
    const placeOfBirth =
      pickField(f, ["place_birth", "Place of birth", "Place Of Birth", "Birthplace", "birth_place"]) || "";
    const countryOfBirth =
      pickField(f, ["country_birth", "Country of birth", "Country Of Birth", "birth_country"]) || "";
    const identificationDocument =
      pickField(f, ["identification_document", "Identification document", "Identification Document", "ID document"]) || "";
    const documentNumber =
      pickField(f, ["document_number", "Document number", "Document Number", "ID number", "Identification number"]) || "";

    const firstName =
      pickField(f, ["first_name", "First name", "First Name", "FirstName"]) || "";
    const lastName =
      pickField(f, ["last_name", "Last name", "Last Name", "LastName"]) || "";
    const phone = pickField(f, ["phone", "Phone", "mobile", "Mobile"]) || "";
    const studentPhoto = Array.isArray(f.student_photo) ? f.student_photo : [];

    res.json({
      id: record.id,
      name: fullName,
      email: f.email || "",
      school,
      firstName,
      lastName,
      phone,
      nationality,     // <-- NEW
      dateOfBirth,     // <-- NEW (YYYY-MM-DD se possibile)
      placeOfBirth,
      countryOfBirth,
      identificationDocument,
      documentNumber,
      student_photo: studentPhoto,
      features: {
        courses: Boolean(f.enable_courses),
        quaet: Boolean(f.enable_quaet),
        results: Boolean(f.enable_results),
        personal_details: Boolean(f.feature_personal_details),
      },
    });
  } catch (error) {
    console.error("get-current-user error", error);
    res.status(500).json({ error: "Server error" });
  }
}
