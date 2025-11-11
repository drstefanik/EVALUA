import { useEffect, useState } from "react";
import { initState, pickNextItem, gradeAnswer, computeResult } from "../engine/adaptive";
import { useItems } from "../hooks/useItems"; // named export: OK
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";

export default function AdaptiveTest() {
  const { items, error } = useItems(); // carica A1..C2
  const [st] = useState(initState);
  const [item, setItem] = useState(null);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!items || error) return;
    const next = pickNextItem(st, items);
    if (!next) { setFinished(true); setResult(computeResult(st)); }
    else setItem(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, error]);

  const onAnswer = (idx) => {
    if (!items) return;
    gradeAnswer(st, item, idx);
    const next = pickNextItem(st, items);
    if (!next) { setFinished(true); setResult(computeResult(st)); }
    else setItem(next);
  };

  if (error) return <div className="p-6 text-red-600">Errore nel caricare i dati.</div>;
  if (!items) return <div className="p-6">Loading…</div>;
  if (finished) {
  const breakdown = Object.entries(result.askedByLevel).map(([level, count]) => ({ level, count }));
  const total = breakdown.reduce((s, r) => s + r.count, 0);
  const used = breakdown.filter(r => r.count > 0).map(r => `${r.level}:${r.count}`).join(" • ");

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-semibold">Estimated level: {result.estimatedLevel}</h2>
        <p className="text-sm opacity-75">Confidence: {(result.confidence * 100).toFixed(0)}%</p>
      </div>

      {/* FRASE TECNICA (no motivazionale) */}
      <div className="p-4 rounded-lg border bg-white/50">
        <p className="text-sm">
          Outcome: <strong>CEFR {result.estimatedLevel}</strong>. The test converged after <strong>{total}</strong> items.
          Distribution of administered items by pool → {used || "n/a"}. Decision rule: last stable level according to the adaptive policy
          (start B1, +1 level after two consecutive correct answers; −1 level after any error; stop if a level reaches 7 items).
        </p>
      </div>

      {/* RADAR */}
      <div className="h-80 w-full">
        <ResponsiveContainer>
          <RadarChart data={breakdown}>
            <PolarGrid />
            <PolarAngleAxis dataKey="level" />
            <Tooltip />
            <Radar name="Items" dataKey="count" stroke="" fill="" fillOpacity={0.35} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* (Opzionale) JSON raw */}
      <pre className="text-xs bg-gray-50 p-3 rounded">{JSON.stringify(result.askedByLevel, null, 2)}</pre>
    </div>
  );
}
