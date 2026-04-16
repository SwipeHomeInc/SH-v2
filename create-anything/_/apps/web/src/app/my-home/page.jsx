"use client";
import { useState, useEffect } from "react";
import { useUser } from "@/utils/useUser";

function StatPill({ label, value }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-800">{value || "—"}</p>
    </div>
  );
}

const CATEGORY_LABELS = {
  bathroom: "Bathroom", kitchen: "Kitchen", roof: "Roof", hvac: "HVAC",
  electrical: "Electrical", plumbing: "Plumbing", flooring: "Flooring",
  bedroom: "Bedroom", windows_doors: "Windows/Doors", foundation: "Foundation",
  exterior: "Exterior", garage: "Garage",
};

const CONDITION_STYLES = {
  Good: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700" },
  Fair: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700" },
  "Needs Attention": { bg: "bg-red-50", border: "border-red-200", text: "text-red-700" },
};

export default function MyHomePage() {
  const { user, loading: authLoading } = useUser();
  const [property, setProperty] = useState(null);
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    Promise.all([
      fetch("/api/properties/my-property").then(r => r.json()),
      fetch("/api/swipecheck/latest-by-category").then(r => r.json()),
    ])
      .then(([prop, latestChecks]) => {
        setProperty(prop || null);
        setChecks(Array.isArray(latestChecks) ? latestChecks : []);
      })
      .catch(() => setError("Failed to load your home data."))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-sm">Loading your home...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-gray-700 font-medium">Sign in to view your home dashboard.</p>
        <a href="/account/signin" className="bg-[#357AFF] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2E69DE] transition-colors">
          Sign In
        </a>
      </div>
    );
  }

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
            <h1 className="text-xl font-bold text-gray-900">My Home</h1>
            <p className="text-xs text-gray-500">Your property dashboard</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {/* No property yet */}
        {!property && !error && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center space-y-3">
            <p className="text-4xl">🏠</p>
            <p className="font-semibold text-gray-800">No home claimed yet</p>
            <p className="text-sm text-gray-500">Claim your DIDPID to unlock your property dashboard, SwipeCheck history, and Proof Pack.</p>
            <a
              href="/didpid/claim"
              className="inline-block bg-[#357AFF] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2E69DE] transition-colors"
            >
              Claim Your DIDPID
            </a>
          </div>
        )}

        {/* Property card */}
        {property && (
          <>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-gray-900 text-base leading-snug">
                    {property.address}
                    {property.unit ? ` #${property.unit}` : ""}
                  </p>
                  <p className="text-sm text-gray-500">
                    {[property.city, property.state, property.zip].filter(Boolean).join(", ")}
                  </p>
                </div>
                <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                  property.didpid_status === "verified"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}>
                  {property.didpid_code ? `DIDPID: ${property.didpid_code}` : "No DIDPID"}
                </span>
              </div>

              {/* Home stats */}
              {(property.bedrooms || property.bathrooms || property.square_feet || property.year_built) && (
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {property.bedrooms && <StatPill label="Beds" value={property.bedrooms} />}
                  {property.bathrooms && <StatPill label="Baths" value={property.bathrooms} />}
                  {property.square_feet && <StatPill label="Sq Ft" value={property.square_feet?.toLocaleString()} />}
                  {property.year_built && <StatPill label="Built" value={property.year_built} />}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href="/swipecheck"
                className="bg-[#357AFF] text-white rounded-xl py-3 text-sm font-semibold text-center hover:bg-[#2E69DE] transition-colors"
              >
                Run SwipeCheck
              </a>
              <a
                href="/my-home/proof-pack"
                className="bg-white border border-gray-200 text-gray-700 rounded-xl py-3 text-sm font-semibold text-center hover:bg-gray-50 transition-colors"
              >
                View Proof Pack
              </a>
            </div>

            {/* Latest SwipeChecks */}
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-3">Latest SwipeChecks</h2>
              {checks.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
                  <p className="text-sm text-gray-500">No checks yet. Run your first SwipeCheck to see results here.</p>
                  <a href="/swipecheck" className="inline-block mt-3 text-sm text-[#357AFF] font-medium hover:underline">
                    Start a SwipeCheck →
                  </a>
                </div>
              ) : (
                <div className="space-y-2">
                  {checks.map((check) => {
                    const cond = CONDITION_STYLES[check.condition_label || check.condition] || CONDITION_STYLES.Fair;
                    return (
                      <a
                        key={check.id}
                        href={`/swipecheck/results?checkId=${check.id}`}
                        className={`flex items-center justify-between bg-white rounded-xl border p-4 hover:shadow-sm transition-all ${cond.border}`}
                      >
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">
                            {CATEGORY_LABELS[check.category] || check.category}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {check.created_at ? new Date(check.created_at).toLocaleDateString() : ""}
                          </p>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cond.bg} ${cond.text}`}>
                          {check.condition_label || check.condition}
                        </span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick links */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
              {[
                { href: "/quick-check", label: "Quick Check", icon: "📸", desc: "AI photo analysis" },
                { href: "/contractors", label: "Find a Pro", icon: "🔧", desc: "Browse local contractors" },
                { href: "/my-home/proof-pack", label: "Proof Pack", icon: "📋", desc: "Shareable home record" },
              ].map(link => (
                <a key={link.href} href={link.href} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <span className="text-xl">{link.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{link.label}</p>
                    <p className="text-xs text-gray-400">{link.desc}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
