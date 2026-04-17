"use client";
import { useState } from "react";

// ── Reusable tap-friendly controls ──────────────────────────────────────────

function SegmentedControl({ label, options, value, onChange }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-gray-700">{label}</p>
      <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`flex-1 py-3 text-sm font-medium transition-colors leading-tight px-1 ${
              value === opt
                ? "bg-[#357AFF] text-white"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function YesNoToggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-4">
      <p className="text-sm font-semibold text-gray-800 leading-tight pr-4">{label}</p>
      <div className="flex rounded-xl overflow-hidden border border-gray-200 shrink-0">
        {["No", "Yes"].map((opt) => {
          const isYes = opt === "Yes";
          const selected = value === isYes;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(isYes)}
              className={`w-16 py-2.5 text-sm font-bold transition-colors ${
                selected
                  ? isYes
                    ? "bg-red-500 text-white"
                    : "bg-green-500 text-white"
                  : "bg-gray-50 text-gray-400 hover:bg-gray-100"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SectionHeader({ number, title, subtitle }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-[#357AFF] text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
        {number}
      </div>
      <div>
        <h2 className="font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ── Success screen ────────────────────────────────────────────────────────────

function SuccessScreen({ address, onReset }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-8 max-w-sm w-full text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Risk Profile Saved</h2>
          <p className="text-sm text-gray-500">{address}</p>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          Your Buyer SwipeCheck Lite results have been recorded. Use this data in your offer strategy.
        </p>
        <div className="space-y-2 pt-2">
          <button
            onClick={onReset}
            className="w-full bg-[#357AFF] text-white rounded-xl py-3 text-sm font-semibold hover:bg-[#2E69DE] transition-colors"
          >
            Evaluate Another Property
          </button>
          <a
            href="/"
            className="block w-full border border-gray-200 text-gray-600 rounded-xl py-3 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const DEFAULTS = {
  property_address:       "",
  roof_condition:         null,
  hvac_condition:         null,
  water_heater_condition: null,
  windows_condition:      null,
  water_intrusion_flag:   false,
  foundation_issues_flag: false,
  estimated_capex:        "",
};

export default function EvaluatePage() {
  const [form, setForm]       = useState(DEFAULTS);
  const [submitting, setSub]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState(null);

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.property_address.trim()) {
      setError("Enter the property address to continue.");
      return;
    }
    setSub(true);
    setError(null);
    try {
      const res = await fetch("/api/buyer-swipecheck/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          estimated_capex: form.estimated_capex !== "" ? parseFloat(form.estimated_capex) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save. Try again."); return; }
      setSuccess(true);
    } catch {
      setError("Network error. Check your connection.");
    } finally {
      setSub(false);
    }
  };

  if (success) {
    return <SuccessScreen address={form.property_address} onReset={() => { setForm(DEFAULTS); setSuccess(false); }} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <a href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Buyer SwipeCheck Lite</h1>
            <p className="text-xs text-gray-400">Property risk profile — one-handed walkthrough</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-5">

        {/* Address */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Property Address</label>
          <input
            type="text"
            value={form.property_address}
            onChange={e => set("property_address")(e.target.value)}
            placeholder="123 Main St, Springfield, IL 62701"
            className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-[#357AFF]"
            autoComplete="off"
          />
        </div>

        {/* Section 1: CapEx Big 4 */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-5">
          <SectionHeader
            number="1"
            title="The CapEx Big 4"
            subtitle="Major systems — tap your assessment for each"
          />
          <SegmentedControl
            label="Roof"
            options={["Looks New", "Aging", "Needs Replacement"]}
            value={form.roof_condition}
            onChange={set("roof_condition")}
          />
          <SegmentedControl
            label="HVAC"
            options={["Looks New", "Aging", "Needs Replacement"]}
            value={form.hvac_condition}
            onChange={set("hvac_condition")}
          />
          <SegmentedControl
            label="Water Heater"
            options={["Looks New", "Aging", "Needs Replacement"]}
            value={form.water_heater_condition}
            onChange={set("water_heater_condition")}
          />
          <SegmentedControl
            label="Windows"
            options={["Original", "Updated", "Broken Seals"]}
            value={form.windows_condition}
            onChange={set("windows_condition")}
          />
        </div>

        {/* Section 2: Red Flag Scan */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
          <SectionHeader
            number="2"
            title="Red Flag Scan"
            subtitle="Yes = flag present — tap to record"
          />
          <YesNoToggle
            label="Water intrusion signs — stains, efflorescence, or active moisture visible?"
            value={form.water_intrusion_flag}
            onChange={set("water_intrusion_flag")}
          />
          <YesNoToggle
            label="Foundation concerns — cracks, settling, bowing walls, or uneven floors?"
            value={form.foundation_issues_flag}
            onChange={set("foundation_issues_flag")}
          />
        </div>

        {/* Section 3: Exposure Math */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <SectionHeader
            number="3"
            title="Exposure Math"
            subtitle="Your total anticipated cash required post-close"
          />
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-base">$</span>
            <input
              type="number"
              min="0"
              step="500"
              value={form.estimated_capex}
              onChange={e => set("estimated_capex")(e.target.value)}
              placeholder="0"
              className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-4 text-lg font-semibold outline-none focus:border-[#357AFF] text-gray-800"
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">Total Anticipated Cash Required Post-Close</p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-gray-400 leading-relaxed text-center px-2">
          This document is a condition awareness tool used for structured offer modeling. It does NOT constitute legal advice or replace a licensed home inspection.
        </p>
      </div>

      {/* Sticky submit */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 z-20">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-[#357AFF] text-white rounded-xl py-4 text-base font-bold hover:bg-[#2E69DE] transition-colors disabled:opacity-50 shadow-lg"
          >
            {submitting ? "Saving..." : "Save Risk Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
