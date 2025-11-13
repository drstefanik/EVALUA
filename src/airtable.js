import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

export function tbl(name) {
  if (!name) throw new Error("Missing table name");
  return base(name);
}
