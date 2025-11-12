import { useEffect, useRef, useState } from "react";
import { initState, pickNextItem, gradeAnswer, computeResult } from "../engine/adaptive";
import { useItems } from "../hooks/useItems";
import AdaptiveIntro from "../components/AdaptiveIntro";
import FeatureGate from "./FeatureGate.jsx";
import { useCurrentUser } from "../hooks/useCurrentUser.js";
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

function getToken() {
  // salvato dopo /api/auth/login
  return localStorage.getItem("authToken") || "";
}
function AdaptiveTestContent({ currentUser }) {
  const { items, error } = useItems();

  // Fasi
  const [phase, setPhase] = useState("intro"); // intro | running | finished

  // Engine/stato
  const [st] = useState(initState);
  const [item, setItem] = useState(null);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState(null);
  const [pendingNext, setPendingNext] = useState(false);

  // Timing & metriche
  const startedAtIsoRef = useRef(null);
  const startedAtTsRef = useRef(null);
  const askedBySkillRef = useRef({ listening: 0, reading: 0 });
  const lastSavedEntryIdRef = useRef(null);

  const noteAsked = (nextItem) => {
    if (!nextItem || !nextItem.skill) return;
    const k = nextItem.skill;
    askedBySkillRef.current[k] = (askedBySkillRef.current[k] || 0) + 1;
  };

  // Avvio effettivo del test quando si passa a "running"
  useEffect(() => {
    if (phase !== "running") return;
    if (!items || error) return;

    // reset timing e contatori ad ogni nuovo tentativo
    startedAtIsoRef.current = new Date().toISOString();
    startedAtTsRef.current = Date.now();
    askedBySkillRef.current = { listening: 0, reading: 0 };

    const next = pickNextItem(st, items);
    if (!next) {
      setFinished(true);
      setResult(computeResult(st));
      setPhase("finished");
    } else {
      setItem(next);
      noteAsked(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, items, error]);

  const goNext = () => {
    const next = pickNextItem(st, items);
    if (!next) {
      setFinished(true);
      setResult(computeResult(st));
      setPhase("finished");
    } else {
      setItem(next);
      noteAsked(next);
    }
  };

  const onAnswer = (idx) => {
    if (!items || !item || pendingNext) return;
    setPendingNext(true);
    gradeAnswer(st, item, idx);
    setTimeout(() => {
      setPendingNext(false);
      goNext();
    }, 140);
  };

  // Salvataggio su Airtable via API route
  useEffect(() => {
    if (!finished || !result) return;

    const { id: storedId, email: storedEmail } = getCurrentUserFromStorage();
    const token = getToken();

    const completedAtIso = new Date().toISOString();
    const totalItemsSafe = (() => {
      try {
        const obj = result?.askedByLevel || {};
        return Object.values(obj).reduce((a, b) => a + (Number(b) || 0), 0);
      } catch {
        return st?.askedCount || null;
      }
    })();

    const askedByLevel = result?.askedByLevel || st?.askedByLevel || {};
    const studentRecordId = currentUser?.recordId || currentUser?.id || null;
    const normalizedUserId = studentRecordId || storedId || null;
    const normalizedEmail = currentUser?.email || storedEmail || null;

    const payload = {
      userId: normalizedUserId,
      userEmail: normalizedEmail,
      studentRecordId,
      estimatedLevel: result?.estimatedLevel || st?.current || null,
      confidence: result?.confidence ?? null, // numero 0..1 o 0..100 (server lo normalizza)
      askedByLevel,
      askedBySkill: askedBySkillRef.current,
      totalItems: totalItemsSafe,
      startedAt: startedAtIsoRef.current,
      durationSec: Math.round((Date.now() - startedAtTsRef.current) / 1000),
      completedAt: completedAtIso,
    };

    const storageKey = "evaluaAdaptiveResults";
    const entryId = `${payload.startedAt || completedAtIso}-${payload.estimatedLevel || "result"}`;

    if (lastSavedEntryIdRef.current === entryId) {
      return;
    }
    lastSavedEntryIdRef.current = entryId;

    const entry = {
      id: entryId,
      estimatedLevel: payload.estimatedLevel || null,
      confidence: payload.confidence ?? null,
      totalItems: payload.totalItems ?? null,
      durationSec: payload.durationSec ?? null,
      askedByLevel: askedByLevel || {},
      askedBySkill: payload.askedBySkill || {},
      startedAt: payload.startedAt,
      completedAt: completedAtIso,
      TestId: null,
      testId: null,
      CandidateId: null,
      candidateId: null,
    };

    const persistEntry = (value) => {
      const raw = window.localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(parsed) ? parsed : [];
      const updated = [value, ...list.filter((it) => it?.id !== value.id)];
      window.localStorage.setItem(storageKey, JSON.stringify(updated.slice(0, 20)));
      window.dispatchEvent(new CustomEvent("evalua:adaptive-result-saved", { detail: value }));
    };

    const enrichEntryWithServerIds = (testId, candidateId) => {
      try {
        const raw = window.localStorage.getItem(storageKey);
        const parsed = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(parsed)) return;
        const nextList = parsed.map((item) => {
          if (item?.id !== entryId) return item;
          return {
            ...item,
            TestId: testId || item?.TestId || null,
            testId: testId || item?.testId || null,
            CandidateId: candidateId || item?.CandidateId || null,
            candidateId: candidateId || item?.candidateId || null,
          };
        });
        window.localStorage.setItem(storageKey, JSON.stringify(nextList.slice(0, 20)));
        const updatedEntry = nextList.find((it) => it?.id === entryId);
        if (updatedEntry) {
          window.dispatchEvent(
            new CustomEvent("evalua:adaptive-result-saved", { detail: updatedEntry })
          );
        }
      } catch (err) {
        console.error("adaptive-results enrichment failed:", err);
      }
    };

    if (typeof window !== "undefined") {
      try {
        persistEntry(entry);
      } catch (err) {
        console.error("adaptive-results storage failed:", err);
      }
    }

    (async () => {
      try {
        const response = await fetch("/api/save-placement", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "x-user-id": payload.userId ?? "",
            "x-user-email": payload.userEmail ?? "",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const text = await response.text().catch(() => "");
          console.error("save-placement failed:", response.status, text);
          return;
        }

        const data = await response.json().catch(() => null);
        if (!data) return;

        if ((data.testId || data.candidateId) && typeof window !== "undefined") {
          enrichEntryWithServerIds(data.testId || null, data.candidateId || null);
        }
      } catch (err) {
        console.error("save-placement failed:", err);
      }
    })();
  }, [currentUser, finished, result]);

  // ---- UI di stato/caricamento/errore
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

  // ---- Fase INTRO
  if (phase === "intro") {
    return (
      <AdaptiveIntro
        onStart={() => {
          setItem(null);
          setFinished(false);
          setResult(null);
          setPendingNext(false);
          setPhase("running");
        }}
      />
    );
  }

  // ---------- FINE TEST ----------
  if (phase === "finished" && finished && result) {
    // Dati per eventuale grafico (non rivela algoritmo)
    const breakdown = Object.entries(result.askedByLevel).map(([level, count]) => ({
      level,
      count,
    }));

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

          {/* Messaggio istituzionale (no algoritmo, no durata) */}
          <div className="mt-5 rounded-xl border bg-gray-50 p-4">
            <p className="text-sm text-gray-700">
              This QUAET outcome reflects your performance in this session and indicates an
              estimated proficiency of <strong>CEFR {result.estimatedLevel}</strong>. For official
              placement or enrolment decisions, please follow your institution’s policy.
            </p>
          </div>

          {/* Radar opzionale */}
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

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                setPhase("intro");
                setItem(null);
                setFinished(false);
                setResult(null);
                setPendingNext(false);
              }}
              className="px-5 py-2.5 rounded-xl border hover:bg-gray-50"
            >
              Back to start
            </button>
            {/* Reindirizza sempre alla dashboard studente */}
            <a
              href="/student"
              className="px-5 py-2.5 rounded-xl text-white bg-black hover:opacity-90"
            >
              Go to dashboard
            </a>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            QUAET — the Qualification UAE Adaptive English Test.
          </p>
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
        <h1 className="mb-4 text-2xl font-semibold tracking-tight">{item.prompt}</h1>

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

export default function AdaptiveTest() {
  const { currentUser, loading } = useCurrentUser()
  const enabled = loading ? true : currentUser ? Boolean(currentUser?.features?.quaet) : false

  if (loading && !currentUser) {
    return (
      <div className="mx-auto max-w-2xl p-6 text-center text-sm text-slate-600 dark:text-slate-300">
        Loading…
      </div>
    )
  }

  return (
    <FeatureGate
      enabled={enabled}
      fallback={
        <div className="mx-auto max-w-2xl p-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Section unavailable</h2>
            <p className="mt-2">
              This area is not enabled for your account. Contact your administrator if you need access to the adaptive test.
            </p>
          </div>
        </div>
      }
    >
      <AdaptiveTestContent currentUser={currentUser} />
    </FeatureGate>
  )
}
