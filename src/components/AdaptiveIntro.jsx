import { useEffect, useState } from "react";

export default function AdaptiveIntro({ onStart, canResume=false, onResume }) {
  const [checked, setChecked] = useState({
    audio: false,
    connection: false,
    environment: false,
  });
  const [section, setSection] = useState("Listening"); // or hide if not needed
  const [startLevel, setStartLevel] = useState("B1");   // default B1 as agreed

  const allOk = checked.audio && checked.connection && checked.environment;

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Enter" && allOk) onStart({ section, startLevel });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [allOk, onStart, section, startLevel]);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white shadow-sm rounded-2xl p-6 border">
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
              <span>Use <strong>headphones</strong> and set the volume properly.</span>
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

            {/* Optional controls – hide if not needed */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Section</label>
                <select
                  className="w-full border rounded-lg p-2"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                >
                  <option>Listening</option>
                  <option>Reading</option>
                  <option>Use of English</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Start level</label>
                <select
                  className="w-full border rounded-lg p-2"
                  value={startLevel}
                  onChange={(e) => setStartLevel(e.target.value)}
                >
                  <option>B1</option>
                  <option>A2</option>
                  <option>B2</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            disabled={!allOk}
            onClick={() => onStart({ section, startLevel })}
            className={`px-5 py-2.5 rounded-xl text-white transition ${
              allOk ? "bg-black hover:opacity-90" : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Start test
          </button>

          {canResume && (
            <button
              onClick={onResume}
              className="px-5 py-2.5 rounded-xl border hover:bg-gray-50"
            >
              Resume previous attempt
            </button>
          )}

          <span className="text-sm text-gray-500">Press <kbd className="px-1 py-0.5 border rounded">Enter</kbd> to start</span>
        </div>
      </div>
    </div>
  );
}
