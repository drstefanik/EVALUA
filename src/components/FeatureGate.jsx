export default function FeatureGate({ enabled, fallback = null, children }) {
  if (!enabled) {
    if (fallback !== null && fallback !== undefined) {
      return fallback
    }
    return (
      <div className="rounded-xl border p-6 bg-white">
        <h3 className="text-lg font-semibold mb-1">Section unavailable</h3>
        <p className="text-sm text-slate-600">This area is not enabled for your account.</p>
      </div>
    )
  }
  return children
}
