import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import evaluaLogo from "../assets/EVALUA.svg";

export default function Verify() {
  const [sp] = useSearchParams();
  const [code, setCode] = useState(sp.get("code")?.toUpperCase() || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function handleVerify(c = code) {
    setLoading(true); setResult(null);
    const r = await fetch("/api/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: c.trim().toUpperCase() }),
    });
    const data = await r.json();
    setResult(data);
    setLoading(false);
  }

  useEffect(() => {
    if (code) handleVerify(code);
  }, []); // autoverifica da query

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-xl bg-white p-6 rounded-2xl shadow">
        <div className="flex items-center gap-3 mb-4">
          <img src={evaluaLogo} alt="Evalua" className="h-8" />
          <h1 className="text-2xl font-bold text-[#0C3C4A]">Certificate Verification</h1>
        </div>
        <p className="text-gray-600 mb-4">
          Enter the verification code printed on your certificate.
        </p>

        <div className="flex gap-2 mb-4">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Q-XXXX-XXXX-XXXX..."
            className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0C3C4A]"
          />
          <button
            onClick={() => handleVerify()}
            disabled={!code || loading}
            className="px-4 py-2 rounded-lg text-white bg-[#0C3C4A] disabled:opacity-60"
          >
            {loading ? "Verifying…" : "Verify"}
          </button>
        </div>

        {result && (
          <div className="mt-4 border rounded-lg p-4">
            {result.valid ? (
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1">
                  <span className="font-semibold">VALID</span>
                  <span className="text-xs text-gray-500">{result.code}</span>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <dt className="text-gray-500">Candidate</dt><dd>{result.name || "-"}</dd>
                  <dt className="text-gray-500">Test</dt><dd>{result.test || "-"}</dd>
                  <dt className="text-gray-500">Level</dt><dd>{result.level || "-"}</dd>
                  <dt className="text-gray-500">Issued</dt><dd>{result.issuedAt || "-"}</dd>
                  <dt className="text-gray-500">Status</dt><dd>{result.status || "-"}</dd>
                </dl>
                {result.pdfUrl && (
                  <a className="mt-3 inline-block underline" href={result.pdfUrl} target="_blank" rel="noreferrer">
                    View certificate PDF
                  </a>
                )}
              </div>
            ) : (
              <p className="text-red-600 font-medium">Invalid verification code.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
