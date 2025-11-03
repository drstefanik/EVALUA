import { tbl } from "./airtable.js";

const pick = (record) => ({ id: record.id, ...record.fields });

function escapeFormulaValue(value) {
  return String(value).replace(/"/g, '\\"');
}

async function selectSingle(table, options) {
  const records = await table.select(options).firstPage();
  return records[0] ? pick(records[0]) : null;
}

export async function findByEmailIn(table, email) {
  if (!email) return null;
  const normalizedEmail = String(email).trim().toLowerCase();
  return selectSingle(table, {
    filterByFormula: `LOWER({email}) = "${escapeFormulaValue(normalizedEmail)}"`,
    maxRecords: 1,
  });
}

export async function findAdminByEmail(email) {
  return findByEmailIn(tbl.ADMIN, email);
}

export async function findSchoolByEmail(email) {
  return findByEmailIn(tbl.SCHOOLS, email);
}

export async function findSchoolByCode(code) {
  if (!code) return null;
  const normalizedCode = String(code).trim().toUpperCase();
  if (!normalizedCode) return null;
  return selectSingle(tbl.SCHOOLS, {
    filterByFormula: `UPPER({school_code}) = "${escapeFormulaValue(normalizedCode)}"`,
    maxRecords: 1,
  });
}

export async function findStudentByEmail(email) {
  return findByEmailIn(tbl.STUDENTS, email);
}

export async function findOTP(code) {
  if (!code) return null;
  return selectSingle(tbl.SCHOOL_OTP, {
    filterByFormula: `{otp_code} = "${escapeFormulaValue(code)}"`,
    maxRecords: 1,
  });
}
