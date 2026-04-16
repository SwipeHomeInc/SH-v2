"use client";
import { useState, useRef, useEffect } from "react";
import { useUser } from "@/utils/useUser";

export default function ClaimDidpidPage() {
  const { user, loading: authLoading } = useUser();

  // Address search state
  const [query, setQuery]           = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching]   = useState(false);
  const [sessionToken]              = useState(() => crypto.randomUUID());

  // Selected address form fields
  const [selected, setSelected]     = useState(null); // { address, city, state, zip, lat, lng }
  const [unit, setUnit]             = useState("");
  const [consent, setConsent]       = useState(false);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState(null); // { property, didpid, formatted_address }
  const [error, setError]           = useState(null);

  const debounceRef = useRef(null);

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSelected(null);
    setError(null);

    clearTimeout(debounceRef.current);
    if (val.length < 3) { setSuggestions([]); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/google/places/autocomplete?input=${encodeURIComponent(val)}&sessionToken=${sessionToken}`
        );
        const data = await res.json();
        setSuggestions(data.predictions || []);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  };

  const handleSelectSuggestion = async (suggestion) => {
    setSuggestions([]);
    setQuery(suggestion.description);
    setSearching(true);
    try {
      const res = await fetch(
        `/api/google/places/details?placeId=${encodeURIComponent(suggestion.place_id)}&sessionToken=${sessionToken}`
      );
      const data = await res.json();
      const c = data.components || {};
      setSelected({
        address: c.street_number && c.route
          ? `${c.street_number} ${c.route}`
          : suggestion.description.split(",")[0],
        city:    c.locality || c.sublocality || "",
        state:   c.administrative_area_level_1 || "",
        zip:     c.postal_code || "",
        lat:     data.geometry?.location?.lat || null,
        lng:     data.geometry?.location?.lng || null,
        formatted_address: suggestion.description,
      });
    } catch {
      setError("Failed to load address details. Try typing the address manually.");
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) { setError("Please select an address from the suggestions."); return; }
    if (!consent)  { setError("Please consent to location data use."); return; }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/properties/claim-or-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address:   selected.address,
          unit:      unit || null,
          city:      selected.city,
          state:     selected.state,
          postal_code: selected.zip,
          latitude:  selected.lat,
          longitude: selected.lng,
          formatted_address: selected.formatted_address,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to claim property."); return; }
      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-2xl">🏠</p>
        <p className="font-semibold text-gray-800">Sign in to claim your DIDPID</p>
        <p className="text-sm text-gray-500">A DIDPID is your home's permanent digital ID — it stays with the property forever.</p>
        <div className="flex gap-3">
          <a href="/account/signin" className="border border-gray-200 bg-white text-gray-700 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Sign In</a>
          <a href="/account/signup" className="bg-[#357AFF] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2E69DE] transition-colors">Sign Up</a>
        </div>
      </div>
    );
  }

  // Success screen
  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-8 max-w-sm w-full text-center space-y-4">
          <p className="text-4xl">🏠</p>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">DIDPID Claimed!</h2>
            <p className="text-sm text-gray-500">{result.formatted_address}</p>
          </div>
          {result.didpid?.didpid_code && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl py-3 px-4">
              <p className="text-xs text-gray-500 mb-1 font-medium">Your DIDPID</p>
              <p className="text-lg font-bold text-[#357AFF] tracking-wider">{result.didpid.didpid_code}</p>
            </div>
          )}
          <div className="space-y-2 pt-2">
            <a href="/my-home" className="block w-full bg-[#357AFF] text-white rounded-xl py-3 text-sm font-semibold hover:bg-[#2E69DE] transition-colors">
              View My Home
            </a>
            <a href="/swipecheck" className="block w-full border border-gray-200 bg-white text-gray-700 rounded-xl py-3 text-sm font-medium hover:bg-gray-50 transition-colors">
              Run a SwipeCheck
            </a>
            <a href="/my-home/proof-pack" className="block w-full border border-gray-200 bg-white text-gray-700 rounded-xl py-3 text-sm font-medium hover:bg-gray-50 transition-colors">
              View Proof Pack
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <a href="/my-home" className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Claim Your DIDPID</h1>
            <p className="text-xs text-gray-500">Your home's permanent digital identity</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Explainer */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-700">
          A <strong>DIDPID</strong> (Did I Do Property ID) is a permanent, unique identifier tied to your home's address. It unlocks contractor contact details, your Proof Pack, and your full home history.
        </div>

        {/* Address search form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Address search */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search your address</label>
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={handleQueryChange}
                  placeholder="Start typing your address..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#357AFF] pr-8"
                  autoComplete="off"
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#357AFF] border-t-transparent rounded-full animate-spin" />
                )}
              </div>

              {/* Autocomplete suggestions */}
              {suggestions.length > 0 && (
                <div className="mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-10">
                  {suggestions.map((s) => (
                    <button
                      key={s.place_id}
                      type="button"
                      onClick={() => handleSelectSuggestion(s)}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 border-b border-gray-100 last:border-0 transition-colors"
                    >
                      <span className="text-gray-400 mr-2">📍</span>
                      {s.description}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Show selected address fields */}
            {selected && (
              <div className="space-y-3 pt-1 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Street Address</label>
                    <p className="text-sm font-medium text-gray-800">{selected.address}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Unit / Apt</label>
                    <input
                      type="text"
                      value={unit}
                      onChange={e => setUnit(e.target.value)}
                      placeholder="e.g. #2B"
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#357AFF]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
                    <p className="text-sm font-medium text-gray-800">{selected.city}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">State</label>
                    <p className="text-sm font-medium text-gray-800">{selected.state}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">ZIP</label>
                    <p className="text-sm font-medium text-gray-800">{selected.zip}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Consent */}
          <label className="flex items-start gap-3 cursor-pointer bg-white rounded-xl border border-gray-200 p-4">
            <input
              type="checkbox"
              checked={consent}
              onChange={e => setConsent(e.target.checked)}
              className="mt-0.5 rounded border-gray-300"
            />
            <span className="text-sm text-gray-600">
              I consent to Swipe Home storing my property location data to generate my DIDPID and home record. I understand this data is used per the{" "}
              <a href="/privacy" className="text-[#357AFF] hover:underline">Privacy Policy</a>.
            </span>
          </label>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !selected || !consent}
            className="w-full bg-[#357AFF] text-white rounded-xl py-4 text-base font-semibold hover:bg-[#2E69DE] transition-colors disabled:opacity-50"
          >
            {submitting ? "Claiming..." : "Claim My DIDPID"}
          </button>
        </form>
      </div>
    </div>
  );
}
