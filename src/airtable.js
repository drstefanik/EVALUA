import Airtable from "airtable";

const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;

function ensureEnv(varName, value) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
  return value;
}

const base = new Airtable({
  apiKey: ensureEnv("AIRTABLE_API_KEY", AIRTABLE_API_KEY),
}).base(ensureEnv("AIRTABLE_BASE_ID", AIRTABLE_BASE_ID));

export const tbl = Object.freeze({
  ADMIN: base("Admin"),
  SCHOOLS: base("Schools"),
  STUDENTS: base("Students"),
  SCHOOL_OTP: base("SchoolOTP"),
  FOLDERS: base("Folders"),
  FILES: base("Files"),
});

export function getBase() {
  return base;
}
