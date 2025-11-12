// /api/schools.js
import { ensureMethod } from "./_lib/http.js";
import { tbl } from "../src/airtable.js";

export default async function handler(req, res) {
  if (!ensureMethod(req, res, "GET")) return;
  try {
    const records = await tbl.SCHOOLS.select({ maxRecords: 200, view: "Grid view" }).firstPage();
    const items = records.map(r => ({
      id: r.id,
      name: r.fields?.Name || r.fields?.name || "Unnamed school",
    }));
    res.status(200).json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Unable to load schools" });
  }
}
