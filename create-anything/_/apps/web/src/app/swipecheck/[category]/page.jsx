"use client";
import { useState, useEffect } from "react";
import { useParams } from "react-router";

const CATEGORY_LABELS = {
  bathroom: "Bathroom", kitchen: "Kitchen", roof: "Roof", hvac: "HVAC",
  electrical: "Electrical", plumbing: "Plumbing", flooring: "Flooring",
  bedroom: "Bedroom", windows_doors: "Windows & Doors", foundation: "Foundation",
  exterior: "Exterior", garage: "Garage",
};

function ProgressBar({ current, total }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="w-full bg-gray-200 rounded-full h-1.5">
      <div
        className="bg-[#357AFF] h-1.5 rounded-full transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function SwipeCheckQuestionsPage() {
  const { category } = useParams();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers]     = useState({});
  const [current, setCurrent]     = useState(0);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState(null);

  const label = CATEGORY_LABELS[category] || category;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/questions/list?category=${encodeURIComponent(category)}&mode=lite`)
      .then(r => r.json())
      .then(data => {
        setQuestions(data.questions || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load questions. Please try again.");
        setLoading(false);
      });
  }, [category]);

  const q = questions[current];

  const handleAnswer = (value) => {
    const newAnswers = { ...answers, [q.id]: value };
    setAnswers(newAnswers);

    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
    } else {
      submitCheck(newAnswers);
    }
  };

  const submitCheck = async (finalAnswers) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/swipecheck/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, answers: finalAnswers, mode: "lite" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit. Please try again.");
        setSubmitting(false);
        return;
      }
      window.location.href = `/swipecheck/results?checkId=${data.checkId}`;
    } catch {
      setError("Network error. Please check your connection.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-sm">Loading {label} questions...</div>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-[#357AFF] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600 text-sm font-medium">Analyzing your {label} check...</p>
        <p className="text-gray-400 text-xs">AI is generating your results</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <a href="/swipecheck" className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">{label} Check</h1>
              <p className="text-xs text-gray-400">
                Question {Math.min(current + 1, questions.length)} of {questions.length}
              </p>
            </div>
          </div>
          <ProgressBar current={current} total={questions.length} />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {error && (
          <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {questions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold text-gray-800 mb-1">No questions found</p>
            <p className="text-sm text-gray-500 mb-4">
              Questions for {label} haven't been seeded yet.
            </p>
            <a href="/admin/seed-questions" className="inline-block text-sm text-[#357AFF] hover:underline">
              Seed questions →
            </a>
          </div>
        ) : q ? (
          <div className="space-y-5">
            {/* Question card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <p className="text-base font-semibold text-gray-900 leading-relaxed mb-6">
                {q.text}
              </p>

              {/* Answer options */}
              <div className="space-y-3">
                {(q.options_json || []).map((option, idx) => {
                  const val = typeof option === "string" ? option : option.value || option.label;
                  const lbl = typeof option === "string" ? option : option.label || option.value;
                  const selected = answers[q.id] === val;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(val)}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        selected
                          ? "border-[#357AFF] bg-blue-50 text-[#357AFF]"
                          : "border-gray-200 bg-white text-gray-700 hover:border-[#357AFF] hover:bg-blue-50"
                      }`}
                    >
                      {lbl}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Back button */}
            {current > 0 && (
              <button
                onClick={() => setCurrent(c => c - 1)}
                className="w-full border border-gray-200 bg-white rounded-xl py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                ← Back
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
