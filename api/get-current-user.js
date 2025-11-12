import Airtable from "airtable";

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
  try {
    const id = req.query?.id || req.body?.id;
    const email = req.query?.email || req.body?.email;

    const record = (await findStudentById(id)) || (await findStudentByEmail(email));

    if (!record) {
      return res.status(404).json({ error: "User not found" });
    }

    const fields = record.fields || {};

    res.json({
      id: record.id,
      name: fields.full_name || "",
      email: fields.email || "",
      school: fields.school || "",
      features: {
        courses: Boolean(fields.enable_courses),
        quaet: Boolean(fields.enable_quaet),
        results: Boolean(fields.enable_results),
      },
    });
  } catch (error) {
    console.error("get-current-user error", error);
    res.status(500).json({ error: "Server error" });
  }
}
