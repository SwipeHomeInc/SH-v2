"use client";
import { useState, useEffect } from "react";

const CONDITION_STYLES = {
  Good:             { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700",  icon: "✅" },
  Fair:             { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", icon: "⚠️" },
  "Needs Attention":{ bg: "bg-red-50",    border: "border-red-200",    text: "text-red-700",    icon: "🔴" },
};

function ContractorCard({ contractor, locked }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 ${locked ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="font-semibold text-gray-900 text-sm">{contractor.name}</p>
          <p className="text-xs text-gray-400">{contractor.trade} · {contractor.zip}</p>
        </div>
        {contractor.rating && (
          <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            ★ {Number(contractor.rating).toFixed(1)}
          </span>
        )}
      </div>
      {locked ? (
        <p className="text-xs text-[#357AFF] font-medium">Claim DIDPID to contact →</p>
      ) : (
        <div className="flex gap-2 mt-2">
          {contractor.phone && (
            <a href={`tel:${contractor.phone}`} className="flex-1 text-center text-xs bg-[#357AFF] text-white rounded-lg py-1.5 font-medium hover:bg-[#2E69DE] transition-colors">
              Call
            </a>
          )}
          {contractor.email && (
            <a href={`mailto:${contractor.email}`} className="flex-1 text-center text-xs border border-gray-200 text-gray-700 rounded-lg py-1.5 font-medium hover:bg-gray-50 transition-colors">
              Email
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function SwipeCheckResultsPage() {
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkId = params.get("checkId");
    if (!checkId) {
      setError("No check ID provided.");
      setLoading(false);
      return;
    }

    fetch(`/api/swipecheck/results?checkId=${checkId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); }
        else { setResult(data); }
      })
      .catch(() => setError("Failed to load results."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-[#357AFF] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading your results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-red-600 text-sm font-medium">{error}</p>
        <a href="/swipecheck" className="text-[#357AFF] text-sm hover:underline">← Back to SwipeCheck</a>
      </div>
    );
  }

  if (!result) return null;

  const cond = CONDITION_STYLES[result.condition] || CONDITION_STYLES.Fair;
  const localContractors  = result.local_swipe_contractors  || [];
  const nearbyContractors = result.nearby_swipe_contractors || [];
  const isLocked          = result.unlock_required;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <a href="/swipecheck" className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <div>
            <h1 className="text-xl font-bold text-gray-900">SwipeCheck Results</h1>
            <p className="text-xs text-gray-500">AI-powered home condition report</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Condition card */}
        <div className={`rounded-2xl border p-5 space-y-3 ${cond.bg} ${cond.border}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{cond.icon}</span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Condition</p>
                <h2 className={`text-xl font-bold ${cond.text}`}>{result.condition}</h2>
              </div>
            </div>
            {result.suggested_timeframe && (
              <span className="text-xs font-medium text-gray-500 bg-white rounded-full px-3 py-1 border border-gray-200 shrink-0">
                {result.suggested_timeframe}
              </span>
            )}
          </div>

          {result.summary_text && (
            <p className="text-sm text-gray-700 leading-relaxed">{result.summary_text}</p>
          )}
        </div>

        {/* Key findings */}
        {result.key_findings?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-3">Key Findings</h3>
            <ul className="space-y-2">
              {result.key_findings.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-[#357AFF] mt-0.5 shrink-0">•</span>
                  <span>{typeof f === "string" ? f : f.finding || JSON.stringify(f)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Gentle guidance */}
        {result.gentle_guidance?.length > 0 && (
          <div className="bg-blue-50 rounded-2xl border border-blue-200 p-5">
            <h3 className="font-bold text-blue-900 mb-3">Guidance</h3>
            <ul className="space-y-2">
              {result.gentle_guidance.map((g, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-blue-800">
                  <span className="shrink-0 mt-0.5">→</span>
                  <span>{typeof g === "string" ? g : g.guidance || JSON.stringify(g)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Photos */}
        {result.photos?.length > 0 && (
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Photos</h3>
            <div className="grid grid-cols-3 gap-2">
              {result.photos.map(photo => (
                <img
                  key={photo.id}
                  src={photo.url}
                  alt={photo.caption || "Check photo"}
                  className="w-full h-24 object-cover rounded-xl border border-gray-200"
                />
              ))}
            </div>
          </div>
        )}

        {/* Recommended trade */}
        {result.recommended_contractor_type && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <span className="text-2xl">🔧</span>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Recommended Trade</p>
              <p className="font-semibold text-gray-900">{result.recommended_contractor_type}</p>
            </div>
          </div>
        )}

        {/* Contractors */}
        {(localContractors.length > 0 || nearbyContractors.length > 0) && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900">
              Swipe Contractors
              {isLocked && (
                <span className="ml-2 text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  Claim DIDPID to unlock contact
                </span>
              )}
            </h3>

            {localContractors.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Local</p>
                <div className="space-y-2">
                  {localContractors.map(c => (
                    <ContractorCard key={c.id} contractor={c} locked={isLocked} />
                  ))}
                </div>
              </div>
            )}

            {nearbyContractors.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Nearby</p>
                <div className="space-y-2">
                  {nearbyContractors.map(c => (
                    <ContractorCard key={c.id} contractor={c} locked={isLocked} />
                  ))}
                </div>
              </div>
            )}

            {isLocked && (
              <a
                href="/didpid/claim"
                className="block w-full text-center bg-[#357AFF] text-white rounded-xl py-3 text-sm font-semibold hover:bg-[#2E69DE] transition-colors"
              >
                Claim DIDPID to Contact Pros
              </a>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <a
            href="/swipecheck"
            className="flex-1 text-center border border-gray-200 bg-white rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            New Check
          </a>
          <a
            href="/my-home"
            className="flex-1 text-center bg-[#357AFF] text-white rounded-xl py-3 text-sm font-semibold hover:bg-[#2E69DE] transition-colors"
          >
            My Home
          </a>
        </div>
      </div>
    </div>
  );
}
