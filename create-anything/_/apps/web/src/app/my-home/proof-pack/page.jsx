"use client";
import { useState, useEffect, useRef } from "react";
import { useUser } from "@/utils/useUser";

const DOC_CATEGORIES = [
  "Roof", "HVAC", "Water Heater", "Electrical", "Plumbing",
  "Appliance", "Insurance", "Tax", "General/Other",
];

const WORK_CATEGORIES = [
  "Roof", "HVAC", "Plumbing", "Electrical", "Flooring",
  "Kitchen", "Bathroom", "Exterior", "Foundation", "General",
];

const STATUS_STYLES = {
  finalized:             { label: "Verified",            bg: "bg-green-100",  text: "text-green-700"  },
  pending_approval:      { label: "Awaiting Approval",   bg: "bg-amber-100",  text: "text-amber-700"  },
  pending_verification:  { label: "Awaiting Contractor", bg: "bg-blue-100",   text: "text-blue-700"   },
  draft:                 { label: "Draft",               bg: "bg-gray-100",   text: "text-gray-600"   },
};

function Badge({ children, className }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${className}`}>
      {children}
    </span>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="text-center">
      <p className="text-xl font-bold text-gray-900">{value ?? "—"}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

function AddWorkModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ category: "General", date_completed: "", scope_summary: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/properties/work-records/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save"); return; }
      onSaved();
    } catch { setError("Network error."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Add Work Record</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#357AFF]"
            >
              {WORK_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Completed</label>
            <input
              type="date"
              required
              value={form.date_completed}
              onChange={e => setForm(f => ({ ...f, date_completed: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#357AFF]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              required
              placeholder="Describe what was done..."
              rows={3}
              value={form.scope_summary}
              onChange={e => setForm(f => ({ ...f, scope_summary: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none resize-none focus:border-[#357AFF]"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-[#357AFF] text-white py-2.5 text-sm font-semibold hover:bg-[#2E69DE] transition-colors disabled:opacity-50">
              {saving ? "Saving..." : "Save Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddDocModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ title: "", category: "General/Other", url: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/properties/documents/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save"); return; }
      onSaved();
    } catch { setError("Network error."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Add Document</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Name</label>
            <input
              required
              placeholder="e.g. Roof Warranty 2024"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#357AFF]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#357AFF]"
            >
              {DOC_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document URL
              <span className="text-gray-400 font-normal ml-1">(Google Drive, Dropbox, etc.)</span>
            </label>
            <input
              required
              type="url"
              placeholder="https://..."
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#357AFF]"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-[#357AFF] text-white py-2.5 text-sm font-semibold hover:bg-[#2E69DE] transition-colors disabled:opacity-50">
              {saving ? "Saving..." : "Add Document"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProofPackPage() {
  const { user, loading: authLoading } = useUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOwnerEntries, setShowOwnerEntries] = useState(false);
  const [showAddWork, setShowAddWork] = useState(false);
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/properties/record")
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    load();
  }, [user, authLoading]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-sm">Loading Proof Pack...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-gray-700 font-medium">Please sign in to view your Proof Pack.</p>
        <a href="/account/signin" className="bg-[#357AFF] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2E69DE] transition-colors">
          Sign In
        </a>
      </div>
    );
  }

  const { property, work_records = [], documents = [], stats } = data || {};

  // Filter work records
  const verifiedRecords = work_records.filter(r => r.status === "finalized");
  const pendingRecords  = work_records.filter(r => r.status !== "finalized");

  const visibleWork = showOwnerEntries
    ? work_records
    : work_records.filter(r => r.verification_type !== "owner_entry" || r.status !== "finalized");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <a href="/my-home" className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <h1 className="text-xl font-bold text-gray-900">Proof Pack</h1>
          </div>
          <p className="text-xs text-[#357AFF] font-medium ml-8">Clean, shareable proof for disclosure.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Owner-entry toggle + actions */}
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOwnerEntries}
              onChange={e => setShowOwnerEntries(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-600">Include owner-reported items <span className="text-gray-400">(clearly labeled)</span></span>
          </label>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 border border-gray-200 bg-white rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            {copied ? "Copied!" : "Copy link"}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-[#357AFF] text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-[#2E69DE] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print / Save PDF
          </button>
        </div>

        {/* Property card */}
        {property ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={property.didpid_status === "verified" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
                    {property.didpid_status === "verified" ? "✓ Contractor Verified" : "⏳ Pending"}
                  </Badge>
                  <Badge className="bg-gray-100 text-gray-600">
                    🔒 Locked
                  </Badge>
                </div>
                <p className="font-bold text-gray-900">
                  {property.address}
                  {property.unit ? ` #${property.unit}` : ""}
                  {property.city ? `, ${property.city}` : ""}
                  {property.state ? `, ${property.state}` : ""}
                  {property.zip ? ` ${property.zip}` : ""}
                </p>
                <p className="text-sm text-[#357AFF] font-medium mt-0.5">
                  DIDPID: {property.didpid_code ? <span>{property.didpid_code}</span> : <span className="text-amber-600">(pending)</span>}
                </p>
              </div>
              <div className="shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                🛡️
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 pt-3 border-t border-gray-100">
              <StatBox label="Verified Jobs" value={stats?.verified_jobs ?? 0} />
              <StatBox label="Documents" value={stats?.documents ?? 0} />
              <StatBox
                label="Last Verified"
                value={stats?.last_verified ? new Date(stats.last_verified).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : null}
              />
              <StatBox
                label="Last SwipeCheck"
                value={stats?.last_swipecheck ? new Date(stats.last_swipecheck).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : null}
              />
            </div>

            <p className="text-xs text-gray-400 mt-3 leading-relaxed">
              <strong>Verified Work</strong> entries are contractor-verified and locked into this home's DIDPID record.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
            <p className="text-sm text-gray-500 mb-3">No property found. Claim your DIDPID to build your Proof Pack.</p>
            <a href="/didpid/claim" className="inline-block bg-[#357AFF] text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-[#2E69DE] transition-colors">
              Claim DIDPID
            </a>
          </div>
        )}

        {/* Verified Work */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">✅</span>
              <h2 className="font-bold text-gray-900">Verified Work</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">Ordered by completion date</span>
              <button
                onClick={() => setShowAddWork(true)}
                className="text-xs bg-[#357AFF] text-white px-3 py-1.5 rounded-lg font-medium hover:bg-[#2E69DE] transition-colors"
              >
                + Add
              </button>
            </div>
          </div>

          {visibleWork.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <p className="text-sm text-gray-400">No contractor-verified jobs yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleWork.map(record => {
                const st = STATUS_STYLES[record.status] || STATUS_STYLES.draft;
                const isOwnerOnly = record.verification_type === "owner_entry" && record.status === "finalized";
                return (
                  <div key={record.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900 text-sm">{record.category}</span>
                          {isOwnerOnly && (
                            <Badge className="bg-gray-100 text-gray-500">Owner-reported</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Completed {record.date_completed ? new Date(record.date_completed).toLocaleDateString() : "—"}
                          {record.contractor_name ? ` · ${record.contractor_name}` : ""}
                        </p>
                      </div>
                      <Badge className={`${st.bg} ${st.text} shrink-0`}>{st.label}</Badge>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{record.scope_summary}</p>
                    {record.photos?.length > 0 && (
                      <div className="flex gap-2 mt-1 overflow-x-auto">
                        {record.photos.map(ph => (
                          <img
                            key={ph.id}
                            src={ph.url}
                            alt={ph.caption || "Work photo"}
                            className="h-16 w-16 object-cover rounded-lg border border-gray-200 shrink-0"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Documents */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">📄</span>
              <h2 className="font-bold text-gray-900">Documents (All)</h2>
            </div>
            <button
              onClick={() => setShowAddDoc(true)}
              className="text-xs bg-[#357AFF] text-white px-3 py-1.5 rounded-lg font-medium hover:bg-[#2E69DE] transition-colors"
            >
              + Add
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <p className="text-sm text-gray-400">No documents uploaded yet.</p>
              <p className="text-xs text-gray-400 mt-1">Store receipts, warranties, permits, and property records here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map(doc => (
                <a
                  key={doc.id}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-base shrink-0">📄</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{doc.title}</p>
                    <p className="text-xs text-gray-400">{doc.category}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-[#357AFF] pb-4">
          This report is generated from the home's DIDPID record. It is designed for disclosure and proof-first clarity.
        </p>
      </div>

      {showAddWork && (
        <AddWorkModal
          onClose={() => setShowAddWork(false)}
          onSaved={() => { setShowAddWork(false); load(); }}
        />
      )}
      {showAddDoc && (
        <AddDocModal
          onClose={() => setShowAddDoc(false)}
          onSaved={() => { setShowAddDoc(false); load(); }}
        />
      )}
    </div>
  );
}
