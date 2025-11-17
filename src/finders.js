import { tbl } from "./airtable.js";

const pick = (record) => ({ id: record.id, ...record.fields });

function escapeFormulaValue(value) {
  return String(value).replace(/"/g, '\\"');
}

async function selectSingle(tableName, options) {
  const table = tbl(tableName);
  const records = await table.select(options).firstPage();
  return records[0] ? pick(records[0]) : null;
}

export async function findByEmailIn(tableName, email) {
  if (!email) return null;
  const normalizedEmail = String(email).trim().toLowerCase();
  return selectSingle(tableName, {
    filterByFormula: `LOWER({email}) = "${escapeFormulaValue(normalizedEmail)}"`,
    maxRecords: 1,
  });
}

const ADMIN_TABLE = process.env.AIRTABLE_TABLE_ADMINS || "Admin";

export async function findAdminByEmail(email) {
  const admin = await findByEmailIn(ADMIN_TABLE, email);
  if (!admin) return null;

  return {
    id: admin.id,
    email: admin.email,
    full_name: admin.full_name,
    password_hash: admin.password_hash,
    status: admin.status,
  };
}

export async function findSchoolByEmail(email) {
  return findByEmailIn("Schools", email);
}

export async function findSchoolByCode(code) {
  if (!code) return null;
  const normalizedCode = String(code).trim().toUpperCase();
  if (!normalizedCode) return null;
  return selectSingle("Schools", {
    filterByFormula: `UPPER({school_code}) = "${escapeFormulaValue(normalizedCode)}"`,
    maxRecords: 1,
  });
}

export async function findStudentByEmail(email) {
  return findByEmailIn("Students", email);
}

export async function findOTP(code) {
  if (!code) return null;
  return selectSingle("SchoolOTP", {
    filterByFormula: `{otp_code} = "${escapeFormulaValue(code)}"`,
    maxRecords: 1,
  });
}
