"use client";
import React from "react";
import { useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
} from "@tanstack/react-query";
import useUser from "@/utils/useUser";

function ResetInner() {
  const { data: user, loading } = useUser();
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  const previewMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/dev/reset-my-data", { method: "GET" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.error || `Preview failed: [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
    onSuccess: (data) => {
      setPreview(data?.preview || null);
      setError(null);
    },
    onError: (e) => {
      console.error(e);
      setError(e.message || "Preview failed");
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/dev/reset-my-data", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.error || `Reset failed: [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data?.deleted || null);
      setPreview(null);
      setError(null);
    },
    onError: (e) => {
      console.error(e);
      setError(e.message || "Reset failed");
    },
  });

  if (loading) {
    return <div className="p-6">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2">Reset My Data</h1>
        <p className="text-gray-600 mb-4">You need to sign in first.</p>
        <a
          href="/account/signin"
          className="inline-block bg-black text-white px-4 py-2 rounded"
        >
          Sign in
        </a>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Reset My Data</h1>
      <p className="text-gray-600 mb-6">
        This will delete your properties, DIDPIDs, swipe checks and photos, and
        contractor leads that match your account email. This cannot be undone.
      </p>

      {error && (
        <div className="mb-4 p-3 border border-yellow-400 bg-yellow-50 text-yellow-800 rounded">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => previewMutation.mutate()}
          disabled={previewMutation.isLoading || resetMutation.isLoading}
          className="bg-white border px-4 py-2 rounded hover:bg-gray-50 disabled:opacity-50"
        >
          {previewMutation.isLoading
            ? "Previewing…"
            : "Preview what will be deleted"}
        </button>
        <button
          onClick={() => {
            if (
              confirm("Are you sure? This will permanently delete your data.")
            ) {
              resetMutation.mutate();
            }
          }}
          disabled={resetMutation.isLoading}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
        >
          {resetMutation.isLoading ? "Deleting…" : "Delete my data now"}
        </button>
      </div>

      {/* Preview */}
      {preview && (
        <div className="mb-6 p-4 border rounded">
          <h2 className="font-medium mb-2">Preview</h2>
          <ul className="list-disc pl-6 text-sm text-gray-700">
            <li>SwipeCheck photos: {preview.swipecheck_photos}</li>
            <li>SwipeChecks: {preview.swipe_checks}</li>
            <li>DIDPIDs: {preview.didpids}</li>
            <li>Properties: {preview.properties}</li>
            <li>Contractor leads: {preview.contractor_leads}</li>
          </ul>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="p-4 border rounded bg-green-50 border-green-200 text-green-900">
          <h2 className="font-medium mb-2">Deleted</h2>
          <ul className="list-disc pl-6 text-sm">
            <li>SwipeCheck photos: {result.swipecheck_photos}</li>
            <li>SwipeChecks: {result.swipe_checks}</li>
            <li>DIDPIDs: {result.didpids}</li>
            <li>Properties: {result.properties}</li>
            <li>Contractor leads: {result.contractor_leads}</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ResetDataPage() {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <ResetInner />
    </QueryClientProvider>
  );
}
