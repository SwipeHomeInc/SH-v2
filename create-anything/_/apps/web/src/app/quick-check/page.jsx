"use client";
import { useState, useRef } from "react";

// Severity → color mapping
const SEVERITY_STYLES = {
  minor:       { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700",  label: "Minor"       },
  moderate:    { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", label: "Moderate"    },
  significant: { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-700",    label: "Significant" },
};

const URGENCY_STYLES = {
  low:    { text: "text-green-600",  label: "Low — can wait"              },
  medium: { text: "text-yellow-600", label: "Medium — address soon"       },
  high:   { text: "text-red-600",    label: "High — needs prompt attention" },
};

const ACTION_LABELS = {
  monitor:      "Monitor",
  DIY:          "DIY Possible",
  professional: "Call a Pro",
};

function CameraIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function QuickCheckPage() {
  const [imageUrl, setImageUrl]           = useState(null);
  const [imagePreview, setImagePreview]   = useState(null);
  const [description, setDescription]     = useState("");
  const [loading, setLoading]             = useState(false);
  const [result, setResult]               = useState(null);
  const [photoAnalysis, setPhotoAnalysis] = useState(null);
  const [textAnalysis, setTextAnalysis]   = useState(null);
  const [error, setError]                 = useState(null);
  const fileInputRef = useRef(null);

  // ── Image handling ──────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target.result);
      setImageUrl(ev.target.result); // send as base64 data URL
    };
    reader.readAsDataURL(file);
    setResult(null);
    setError(null);
  };

  const removePhoto = () => {
    setImageUrl(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageUrl && !description.trim()) {
      setError("Add a photo, a description, or both.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai/quick-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: imageUrl || undefined,
          description: description.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setResult(data.result);
      setPhotoAnalysis(data._photoAnalysis || null);
      setTextAnalysis(data._textAnalysis   || null);
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setPhotoAnalysis(null);
    setTextAnalysis(null);
    setError(null);
    setDescription("");
    removePhoto();
  };

  const sev = SEVERITY_STYLES[result?.severity] || SEVERITY_STYLES.minor;
  const urg = URGENCY_STYLES[result?.urgency]   || URGENCY_STYLES.low;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <a href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Quick Check</h1>
            <p className="text-xs text-gray-500">Snap a photo, describe the issue — get answers</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* ── INPUT FORM ───────────────────────────────────────────────────── */}
        {!result && (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Photo upload */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Your photo"
                    className="w-full object-cover max-h-64"
                  />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-black/80 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-10 flex flex-col items-center gap-3 text-gray-400 hover:text-[#357AFF] hover:bg-blue-50 transition-colors"
                >
                  <CameraIcon />
                  <span className="text-sm font-medium">Tap to take or upload a photo</span>
                  <span className="text-xs text-gray-400">JPG, PNG, WebP supported</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe the issue
                <span className="text-gray-400 font-normal ml-1">(optional if you have a photo)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. There's a dark spot on my ceiling that appeared after the rain last week..."
                rows={4}
                className="w-full text-sm text-gray-700 placeholder-gray-400 outline-none resize-none"
                maxLength={800}
              />
              <p className="text-right text-xs text-gray-400 mt-1">{description.length}/800</p>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (!imageUrl && !description.trim())}
              className="w-full rounded-xl bg-[#357AFF] text-white py-4 text-base font-semibold flex items-center justify-center gap-2 hover:bg-[#2E69DE] transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <SpinnerIcon />
                  <span>Analyzing...</span>
                </>
              ) : (
                "Analyze Now"
              )}
            </button>

            {loading && (
              <p className="text-center text-xs text-gray-400 animate-pulse">
                Running photo + description analysis in parallel...
              </p>
            )}
          </form>
        )}

        {/* ── RESULTS ──────────────────────────────────────────────────────── */}
        {result && (
          <div className="space-y-4">

            {/* Photo thumbnail */}
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Analyzed photo"
                className="w-full max-h-48 object-cover rounded-2xl border border-gray-200"
              />
            )}

            {/* Main result card */}
            <div className={`rounded-2xl border p-5 space-y-4 ${sev.bg} ${sev.border}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Likely Issue
                  </p>
                  <h2 className="text-lg font-bold text-gray-900">{result.likely_issue}</h2>
                </div>
                <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full border ${sev.bg} ${sev.border} ${sev.text}`}>
                  {sev.label}
                </span>
              </div>

              <p className="text-sm text-gray-700 leading-relaxed">{result.summary}</p>

              {result.reassurance_note && (
                <p className="text-sm italic text-gray-500">{result.reassurance_note}</p>
              )}
            </div>

            {/* Action grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Action</p>
                <p className="text-sm font-semibold text-gray-800">
                  {ACTION_LABELS[result.recommended_action] || result.recommended_action}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Urgency</p>
                <p className={`text-sm font-semibold ${urg.text}`}>{urg.label.split("—")[0].trim()}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Trade</p>
                <p className="text-sm font-semibold text-gray-800">{result.recommended_trade || "General"}</p>
              </div>
            </div>

            {/* Immediate step */}
            {result.immediate_step && (
              <div className="bg-white rounded-xl border border-blue-200 p-4">
                <p className="text-xs font-semibold text-[#357AFF] uppercase tracking-wider mb-1">
                  Do this now
                </p>
                <p className="text-sm text-gray-700">{result.immediate_step}</p>
              </div>
            )}

            {/* Debug breakdown — collapse by default, visible in dev */}
            {(photoAnalysis || textAnalysis) && (
              <details className="bg-white rounded-xl border border-gray-200 p-4 text-xs text-gray-500">
                <summary className="cursor-pointer font-medium text-gray-600 select-none">
                  AI Breakdown (dev)
                </summary>
                <div className="mt-3 space-y-3">
                  {photoAnalysis && (
                    <div>
                      <p className="font-semibold text-gray-700 mb-1">Photo Analysis</p>
                      <pre className="bg-gray-50 rounded p-2 overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(photoAnalysis, null, 2)}
                      </pre>
                    </div>
                  )}
                  {textAnalysis && (
                    <div>
                      <p className="font-semibold text-gray-700 mb-1">Description Analysis</p>
                      <pre className="bg-gray-50 rounded p-2 overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(textAnalysis, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                New Check
              </button>
              <button
                onClick={() => {/* TODO: save to property */ alert("Save to property — coming in Task 4")}}
                className="flex-1 rounded-xl bg-[#357AFF] text-white py-3 text-sm font-medium hover:bg-[#2E69DE] transition-colors"
              >
                Save to My Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
