import { useEffect, useRef, useState, Suspense, lazy } from "react";
import { initState, pickNextItem, gradeAnswer, computeResult } from "../engine/adaptive";
import { useItems } from "../hooks/useItems";

const RadarBreakdown = lazy(() => import("./RadarBreakdown.jsx"));

function getCurrentUserFromStorage() {
  const fallback = {
    id: localStorage.getItem("userId") || "",
    email: localStorage.getItem("userEmail") || "",
  };
  const keys = ["user", "auth", "session", "currentUser"];
  for (const k of keys) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const obj = JSON.parse(raw);
      if (obj && (obj.id || obj.userId || obj._id || obj.email || obj.userEmail)) {
        return {
          id: obj.id || obj.userId || obj._id || "",
          email: obj.email || obj.userEmail || "",
        };
      }
    } catch {}
  }
  return fallback;
}

export default function AdaptiveTest() {
  const { items, error } = useItems();
  const [st] = useState(initState);
  const [item, setItem] = useState(null);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState(null);

  const startedAtIsoRef = useRef(new Date().toISOString());
  const startedAtTsRef = useRef(Date.now());

  const askedBySkillRef = useRef({ listening: 0, reading: 0 });
  const noteAsked = (nextItem) => {
    if (!nextItem || !nextItem.skill) return;
    const k = nextItem.skill;
    askedBySkillRef.current[k] = (askedBySkillRef.current[k] || 0) + 1;
  };

  useEffect(() => {
    if (!items || error) return;
    const next = pickNextItem(st, items);
    if (!next) {
      setFinished(true);
      setResult(computeResult(st));
    } else {
      setItem(next);
      noteAsked(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, error]);

  const onAnswer = (idx) => {
    if (!items) return;
    gradeAnswer(st, item, idx);
    const next = pickNextItem(st, items);
    if (!next) {
      setFinished(true);
      setResult(computeResult(st));
    } else {
      setItem(next);
      noteAsked(next);
    }
  };

  useEffect(() => {
    if (!finished || !result) return;

    const { id, email } = getCurrentUserFromStorage();

    const payload = {
      userId: id,
      userEmail: email,
      estimatedLevel: result.estimatedLevel,
      confidence: result.confidence,
      askedByLevel: result.askedByLevel,
      askedBySkill: askedBySkillRef.current,
      totalItems: Object.values(result.askedByLevel).reduce((a, b) => a + b, 0),
      startedAt: startedAtIsoRef.current,
      durationSec: Math.round((Date.now() - startedAtTsRef.current) / 1000),
    };

    fetch("/api/save-placement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }, [finished, result]);

  if (error) return <div className="p-6 text-red-600">Errore nel caricare i dati.</div>;
  if (!items) return <div className="p-6">Loading…</div>;

  if (finished) {
    const breakdown = Object.entries(result.askedByLevel).map(([level, count]) => ({
      level,
      count,
    }));
    const total = breakdown.reduce((s, r) => s + r.count, 0);
    const used = breakdown.filter(r => r.count > 0).map(r => `${r.level}:${r.count}`).join(" • ");

    return (
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div>
          <h2 className="text-3xl font-semibold">Estimated level: {result.estimatedLevel}</h2>
          <p className="text-sm opacity-75">Confidence: {(result.confidence * 100).toFixed(0)}%</p>
        </div>

        <div className="p-4 rounded-lg border bg-white/50">
          <p className="text-sm">
            The adaptive assessment established the candidate’s proficiency at{" "}
            <strong>CEFR {result.estimatedLevel}</strong>. The test concluded after{" "}
            <strong>{total}</strong> items. Distribution of administered items by pool → {used || "n/a"}.
            Decision rule: last stable level (start B1; +1 after two consecutive correct; −1 after any error;
            stop if a level reaches 7 items).
          </p>
        </div>

        <Suspense fallback={<div className="h-80 flex items-center justify-center">Loading chart…</div>}>
          <RadarBreakdown data={breakdown} />
        </Suspense>
      </div>
    );
  }

  if (!item) return <div className="p-6">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      {/* Header domanda — niente livello/skill, contatore corretto (parte da 1) */}
      <div className="text-sm opacity-70">Question {st.askedCount}</div>

      {item.skill === "listening" && item.audioUrl && (
        <audio controls src={item.audioUrl} className="w-full" />
      )}

      {item.passage && item.passage.trim() !== "" && (
        <div className="p-4 rounded-lg bg-gray-50 border whitespace-pre-wrap">{item.passage}</div>
      )}

      <div className="text-lg font-medium">{item.prompt}</div>

      <div className="space-y-2">
        {item.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => onAnswer(i)}
            className="w-full text-left p-3 border rounded-lg hover:bg-gray-100"
          >
            {String.fromCharCode(65 + i)}. {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
