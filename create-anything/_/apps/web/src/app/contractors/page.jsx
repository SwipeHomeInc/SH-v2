"use client";
import { useState, useEffect } from "react";
import { useUser } from "@/utils/useUser";

function ContractorCard({ contractor, locked }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{contractor.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {contractor.trade}
            {contractor.zip ? ` · ${contractor.zip}` : ""}
            {contractor.is_insured ? " · Insured" : ""}
          </p>
        </div>
        {contractor.rating && (
          <span className="shrink-0 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
            ★ {Number(contractor.rating).toFixed(1)}
          </span>
        )}
      </div>

      {locked ? (
        <div className="mt-3 text-center bg-gray-50 rounded-lg py-2.5">
          <p className="text-xs text-gray-400">
            <a href="/didpid/claim" className="text-[#357AFF] font-medium hover:underline">Claim DIDPID</a>
            {" "}to view contact details
          </p>
        </div>
      ) : (
        <div className="flex gap-2 mt-3">
          {contractor.phone && (
            <a
              href={`tel:${contractor.phone}`}
              className="flex-1 text-center text-sm bg-[#357AFF] text-white rounded-lg py-2 font-medium hover:bg-[#2E69DE] transition-colors"
            >
              Call
            </a>
          )}
          {contractor.email && (
            <a
              href={`mailto:${contractor.email}`}
              className="flex-1 text-center text-sm border border-gray-200 text-gray-700 rounded-lg py-2 font-medium hover:bg-gray-50 transition-colors"
            >
              Email
            </a>
          )}
          {contractor.website && (
            <a
              href={contractor.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center text-sm border border-gray-200 text-gray-700 rounded-lg py-2 font-medium hover:bg-gray-50 transition-colors"
            >
              Website
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ locked }) {
  if (locked) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
        <p className="text-3xl mb-3">🔒</p>
        <p className="font-semibold text-gray-800 mb-2">Claim your DIDPID first</p>
        <p className="text-sm text-gray-500 mb-4">
          Add your home to browse local Swipe-verified contractors in your area.
        </p>
        <a
          href="/didpid/claim"
          className="inline-block bg-[#357AFF] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2E69DE] transition-colors"
        >
          Claim DIDPID
        </a>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
      <p className="text-sm text-gray-400">No contractors found in this area yet.</p>
    </div>
  );
}

export default function ContractorsPage() {
  const { user, loading: authLoading } = useUser();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    fetch("/api/contractors/list")
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Failed to load contractors."))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  const filterBySearch = (list) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.trade?.toLowerCase().includes(q) ||
      c.zip?.includes(q)
    );
  };

  const local  = filterBySearch(data?.local_swipe_contractors  || []);
  const nearby = filterBySearch(data?.nearby_swipe_contractors || []);
  const locked = !user;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-sm">Loading contractors...</div>
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
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Find a Pro</h1>
            <p className="text-xs text-gray-500">Swipe-verified contractors near you</p>
          </div>
          <a
            href="/contractors/join"
            className="text-xs text-[#357AFF] font-medium hover:underline shrink-0"
          >
            Join as Pro
          </a>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Search */}
        {!locked && (
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, trade, or ZIP..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#357AFF] shadow-sm"
            />
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
            {error}
          </div>
        )}

        {/* Not signed in */}
        {!user && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center shadow-sm space-y-3">
            <p className="text-3xl">🔧</p>
            <p className="font-semibold text-gray-800">Browse local contractors</p>
            <p className="text-sm text-gray-500">Sign in and claim your DIDPID to see Swipe-verified pros in your area.</p>
            <div className="flex gap-2 justify-center">
              <a href="/account/signin" className="border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                Sign In
              </a>
              <a href="/account/signup" className="bg-[#357AFF] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#2E69DE] transition-colors">
                Sign Up
              </a>
            </div>
          </div>
        )}

        {/* Local contractors */}
        {user && (
          <>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-900">
                  Local Swipe Contractors
                  {local.length > 0 && <span className="ml-2 text-sm font-normal text-gray-400">({local.length})</span>}
                </h2>
              </div>
              {local.length === 0
                ? <EmptyState locked={false} />
                : <div className="space-y-3">{local.map(c => <ContractorCard key={c.id} contractor={c} locked={false} />)}</div>
              }
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-900">
                  Nearby Swipe Contractors
                  {nearby.length > 0 && <span className="ml-2 text-sm font-normal text-gray-400">({nearby.length})</span>}
                </h2>
              </div>
              {nearby.length === 0
                ? <EmptyState locked={false} />
                : <div className="space-y-3">{nearby.map(c => <ContractorCard key={c.id} contractor={c} locked={false} />)}</div>
              }
            </div>
          </>
        )}

        {/* Join CTA */}
        <div className="bg-gradient-to-r from-[#357AFF] to-[#2E69DE] rounded-2xl p-5 text-white text-center">
          <p className="font-bold text-base mb-1">Are you a contractor?</p>
          <p className="text-sm text-blue-100 mb-4">Join the Swipe network — get matched with homeowners in your area.</p>
          <a
            href="/contractors/join"
            className="inline-block bg-white text-[#357AFF] px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors"
          >
            Join as a Pro
          </a>
        </div>
      </div>
    </div>
  );
}
