import { useEffect, useRef, useState } from "react";
import { initState, pickNextItem, gradeAnswer, computeResult } from "../engine/adaptive";
import { useItems } from "../hooks/useItems";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const TOTAL_CAP = 22; // solo per progress bar visuale

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
  const [pendingNext, setPendingNext] = useState(false); // piccolo feedback UI

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

  const goNext = () => {
    const next = pickNextItem(st, items);
    if (!next) {
      setFinished(true);
      setResult(computeResult(st));
    } else {
      setItem(next);
      noteAsked(next);
    }
  };

  const onAnswer = (idx) => {
    if (!items || !item || pendingNext) return;
    setPendingNext(true);
    gradeAnswer(st, item, idx);
    // mini delay per dare feedback visivo
    setTimeout(() => {
      setPendingNext(false);
      goNext();
    }, 140);
  };

  // Salvataggio su Airtable via API route
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

  if (error) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-xl border bg-red-50 p-4 text-red-700">
          Errore nel caricare i dati del test.
        </div>
      </div>
    );
  }

  if (!items) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="animate-pulse space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="h-7 w-2/3 rounded bg-gray-200" />
          <div className="h-12 w-full rounded-lg bg-gray-100" />
          <div className="h-12 w-full rounded-lg bg-gray-100" />
          <div className="h-12 w-full rounded-lg bg-gray-100" />
        </div>
      </div>
    );
  }

  // ---------- FINE TEST ----------
  if (finished && result) {
    const breakdown = Object.entries(result.askedByLevel).map(([level, count]) => ({
      level,
      count,
    }));
    const total = breakdown.reduce((s, r) => s + r.count, 0);
    const used = breakdown.filter(r => r.count > 0).map(r => `${r.level}:${r.count}`).join(" • ");

    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-1 text-sm text-gray-500">Result</div>
          <h2 className="text-3xl font-semibold tracking-tight">
            Estimated level: {result.estimatedLevel}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Confidence: {(result.confidence * 100).toFixed(0)}%
          </p>

          <div className="mt-5 rounded-xl border bg-gray-50 p-4">
            <p className="text-sm text-gray-700">
              The adaptive assessment established the candidate’s proficiency at{" "}
              <strong>CEFR {result.estimatedLevel}</strong>. The test concluded after{" "}
              <strong>{total}</strong> items. Distribution of administered items by pool →{" "}
              {used || "n/a"}. Decision rule: last stable level (start B1; +1 after two consecutive
              correct; −1 after two consecutive errors; stop if a level reaches 7 items).
            </p>
          </div>

          <div className="mt-8 h-80 w-full">
            <ResponsiveContainer>
              <RadarChart data={breakdown}>
                <PolarGrid />
                <PolarAngleAxis dataKey="level" />
                <Tooltip />
                <Radar name="Items" dataKey="count" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  // ---------- DOMANDA ----------
  if (!item) return null;

  const progress = Math.min(100, Math.round((st.askedCount / TOTAL_CAP) * 100));

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-medium text-gray-600">Question {st.askedCount}</div>
          <div className="w-48">
            <div className="h-2 w-full rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-emerald-500 transition-all"
                style={{ width: `${progress}%` }}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
              />
            </div>
          </div>
        </div>

        {/* Audio / Passage */}
        {item.skill === "listening" && item.audioUrl && (
          <div className="mb-4 rounded-lg border bg-gray-50 p-3">
            <audio controls src={item.audioUrl} className="w-full" />
          </div>
        )}

        {item.passage && item.passage.trim() !== "" && (
          <div className="mb-4 whitespace-pre-wrap rounded-lg border bg-gray-50 p-4 leading-relaxed">
            {item.passage}
          </div>
        )}

        {/* Prompt */}
        <h1 className="mb-4 text-2xl font-semibold tracking-tight">
          {item.prompt}
        </h1>

        {/* Options */}
        <div className="space-y-3">
          {item.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => onAnswer(i)}
              disabled={pendingNext}
              className={[
                "group w-full rounded-xl border p-4 text-left",
                "transition-all duration-150",
                "hover:bg-emerald-50 hover:border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400",
                pendingNext ? "opacity-60" : "opacity-100",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border bg-white text-sm font-medium text-gray-600">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-[15px] leading-6">{opt}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
