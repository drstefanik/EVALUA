import { useEffect, useState } from "react";

export default function AdaptiveIntro({ onStart }) {
  const [checked, setChecked] = useState({ audio: false, connection: false, environment: false });
  const allOk = checked.audio && checked.connection && checked.environment;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Enter" && allOk) onStart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [allOk, onStart]);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-2">Adaptive Placement Test</h1>
        <p className="text-gray-700 mb-6">
          This short adaptive test estimates your CEFR level. Questions adjust to your performance.
          Please prepare your environment before starting.
        </p>

        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <div className="rounded-xl border p-4">
            <h2 className="font-medium mb-2">Before you start</h2>

            <label className="flex items-start gap-3 mb-2 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1"
                checked={checked.audio}
                onChange={(e) => setChecked((s) => ({ ...s, audio: e.target.checked }))}
              />
              <span>Use <strong>headphones</strong> and set an appropriate volume.</span>
            </label>

            <label className="flex items-start gap-3 mb-2 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1"
                checked={checked.connection}
                onChange={(e) => setChecked((s) => ({ ...s, connection: e.target.checked }))}
              />
              <span>Ensure a <strong>stable internet connection</strong>.</span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1"
                checked={checked.environment}
                onChange={(e) => setChecked((s) => ({ ...s, environment: e.target.checked }))}
              />
              <span>Stay in a <strong>quiet place</strong> without interruptions.</span>
            </label>
          </div>

          <div className="rounded-xl border p-4">
            <h2 className="font-medium mb-2">Test info</h2>
            <ul className="list-disc pl-5 text-gray-700 space-y-1">
              <li>Estimated duration: <strong>8–12 minutes</strong></li>
              <li>Adaptive policy: start at <strong>B1</strong>, +1 after two consecutive correct; −1 after two consecutive wrong; stop when a level reaches <strong>7 items</strong>.</li>
              <li>Do not refresh or close the page.</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            disabled={!allOk}
            onClick={onStart}
            className={`px-5 py-2.5 rounded-xl text-white transition ${
              allOk ? "bg-black hover:opacity-90" : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Start test
          </button>
          <span className="text-sm text-gray-500">
            Press <kbd className="px-1 py-0.5 border rounded">Enter</kbd> to start
          </span>
        </div>
      </div>
    </div>
  );
}
