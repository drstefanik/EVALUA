// src/hooks/useItems.js
export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

function isValidItem(it) {
  const hasOpts = Array.isArray(it.options) && it.options.length > 0;
  const ciOk = Number.isInteger(it.correctIndex) && it.correctIndex >= 0 && it.correctIndex < it.options.length;
  return Boolean(it.id && it.skill && it.level && it.prompt) && hasOpts && ciOk;
}

export async function loadItems(levels = LEVELS) {
  const stamp = Date.now(); // no-cache busting
  const urls = levels.map(L => `/items/${L}.json?ts=${stamp}`);
  const resps = await Promise.all(urls.map(u => fetch(u)));
  const jsons = await Promise.all(resps.map(r => r.json()));
  // merge + safety filter
  const merged = jsons.flat().map(it => ({
    id: it.id,
    skill: it.skill,
    level: it.level,
    prompt: String(it.prompt ?? "").trim(),
    options: (it.options ?? []).map(o => {
      const s = String(o).trim();
      if (s.toLowerCase() === "true") return "True";
      if (s.toLowerCase() === "false") return "False";
      return s;
    }),
    correctIndex: Number.isFinite(it.correctIndex) ? Number(it.correctIndex) : undefined,
    audioUrl: it.audioUrl ? String(it.audioUrl).trim() : undefined,
  })).filter(isValidItem);

  return merged;
}
