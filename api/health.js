import { ensureMethod } from "./_lib/http.js";

export default function handler(req, res) {
  if (!ensureMethod(req, res, "GET")) return;
  res.status(200).json({ ok: true });
}
