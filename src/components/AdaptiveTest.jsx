import { useEffect, useState } from "react";
import { initState, pickNextItem, gradeAnswer, computeResult } from "../engine/adaptive";
import { useItems } from "../hooks/useItems"; // <-- nuovo

export default function AdaptiveTest() {
  const { items, error } = useItems(); // carica A1..C2
  const [st] = useState(initState);
  const [item, setItem] = useState(null);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState(null);

  // quando i dati sono pronti, estrai la prima domanda
  useEffect(() => {
    if (!items || error) return;
    const next = pickNextItem(st, items);
    if (!next) {
      setFinished(true);
      setResult(computeResult(st));
    } else {
      setItem(next);
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
    }
  };

  if (error) {
    return <div className="p-6 text-red-600">Errore nel caricare i dati.</div>;
  }
  if (!items) {
    return <div className="p-6">Loading…</div>;
  }
  if (finished) {
    return (
      <div className="max-w-xl mx-auto p-6 space-y-2">
        <h2 className="text-2xl font-semibold">Estimated level: {result.estimatedLevel}</h2>
        <p>Confidence: {(result.confidence * 100).toFixed(0)}%</p>
        <pre className="text-xs bg-gray-50 p-3 rounded">{JSON.stringify(result.askedByLevel, null, 2)}</pre>
      </div>
    );
  }
  if (!item) return <div className="p-6">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <div className="text-sm opacity-70">
        Level: {st.current} • Question {st.askedCount + 1} • {item.skill}
      </div>

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
