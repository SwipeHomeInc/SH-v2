"use client";
import { useState } from "react";

const TRADES = [
  "General Contractor", "Roofing", "HVAC", "Electrical", "Plumbing",
  "Flooring", "Painting", "Landscaping", "Cabinetry / Custom Woodworking",
  "Appliance Repair", "Pest Control", "Other",
];

export default function ContractorJoinPage() {
  const [form, setForm] = useState({
    name: "", company: "", email: "", phone: "",
    trade: "General Contractor", zip: "", notes: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) { setError("Please agree to the privacy policy."); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/contractors/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to submit."); return; }
      setDone(true);
    } catch { setError("Network error. Please try again."); }
    finally { setSubmitting(false); }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="bg-white rounded-2xl border border-green-200 p-8 max-w-sm w-full shadow-sm">
          <p className="text-4xl mb-3">✅</p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">You're on the list!</h2>
          <p className="text-sm text-gray-500 mb-5">
            We'll review your application and reach out soon. Welcome to the Swipe network.
          </p>
          <a href="/" className="block bg-[#357AFF] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#2E69DE] transition-colors">
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <a href="/contractors" className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Join as a Pro</h1>
            <p className="text-xs text-gray-500">Get matched with homeowners near you</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Value props */}
        <div className="bg-gradient-to-r from-[#357AFF] to-[#2E69DE] rounded-2xl p-5 text-white">
          <p className="font-bold text-base mb-3">Why join Swipe?</p>
          <ul className="space-y-2 text-sm text-blue-100">
            {[
              "Get matched with homeowners who already know what they need",
              "Verify completed jobs and build your reputation",
              "No upfront costs — early access pricing",
              "Use SwipeCheck to document work professionally",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-white shrink-0 mt-0.5">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
              <input
                required
                placeholder="Jane Smith"
                value={form.name}
                onChange={set("name")}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#357AFF]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input
                placeholder="Smith Roofing LLC"
                value={form.company}
                onChange={set("company")}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#357AFF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              required
              type="email"
              placeholder="jane@smithroofing.com"
              value={form.email}
              onChange={set("email")}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#357AFF]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                placeholder="(555) 000-0000"
                value={form.phone}
                onChange={set("phone")}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#357AFF]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
              <input
                required
                placeholder="27601"
                value={form.zip}
                onChange={set("zip")}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#357AFF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trade / Specialty</label>
            <select
              value={form.trade}
              onChange={set("trade")}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#357AFF]"
            >
              {TRADES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Years in business, certifications, service areas..."
              value={form.notes}
              onChange={set("notes")}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none resize-none focus:border-[#357AFF]"
            />
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="mt-0.5 rounded border-gray-300"
            />
            <span className="text-xs text-gray-500">
              I agree to Swipe Home's{" "}
              <a href="/privacy" className="text-[#357AFF] hover:underline">Privacy Policy</a>
              {" "}and consent to being contacted about contractor opportunities.
            </span>
          </label>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#357AFF] text-white rounded-xl py-3.5 text-sm font-semibold hover:bg-[#2E69DE] transition-colors disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Request to Join"}
          </button>
        </form>
      </div>
    </div>
  );
}
