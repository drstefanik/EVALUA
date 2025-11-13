import { useState } from "react";
import logo from "../assets/EVALUA.svg";

export default function Verify() {
  const [verificationCode, setVerificationCode] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async (event) => {
    event.preventDefault();
    const trimmedCode = verificationCode.trim();

    if (!trimmedCode) {
      setError("Please enter a verification code.");
      setResult(null);
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmedCode }),
      });

      if (!response.ok) {
        throw new Error("Unable to verify the certificate at this time.");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <img src={logo} alt="Evalua" className="h-16 mb-6" />
      <h1 className="text-3xl font-bold text-[#0C3C4A] mb-2">Certificate Verification</h1>
      <p className="text-gray-600 mb-6 text-center max-w-2xl">
        Enter the verification code printed on your certificate to check its authenticity.
      </p>

      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-md">
        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
            Verification code
            <input
              type="text"
              placeholder="Enter verification code"
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0C3C4A]"
              aria-label="Verification code"
              autoComplete="off"
            />
          </label>
          <button
            type="submit"
            className="w-full bg-[#0C3C4A] text-white font-semibold py-2 rounded-lg hover:bg-[#095060] transition disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? "Verifying…" : "Verify"}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-sm text-red-600 font-medium" role="alert">
            {error}
          </p>
        )}

        {result && !error && (
          <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            {result.valid ? (
              <div className="space-y-2 text-gray-800">
                <p>
                  <strong className="text-[#0C3C4A]">Name:</strong> {result.name}
                </p>
                <p>
                  <strong className="text-[#0C3C4A]">Test:</strong> {result.test}
                </p>
                <p>
                  <strong className="text-[#0C3C4A]">Level:</strong> {result.level}
                </p>
                <p>
                  <strong className="text-[#0C3C4A]">Date:</strong> {result.date}
                </p>
                {result.certificateId && (
                  <p>
                    <strong className="text-[#0C3C4A]">Certificate ID:</strong> {result.certificateId}
                  </p>
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
