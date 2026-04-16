import React, { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";

// Admin-only helper page to import the provided SwipeCheck questions into the DB
// This calls the secured /api/questions/import route. You must be signed in.
export default function SeedQuestionsPage() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const items = [
    {
      category: "roof",
      mode: "lite",
      order_index: 1,
      text: "What is the current condition of the roof covering (shingles/tiles/membrane)?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "roof",
      mode: "lite",
      order_index: 2,
      text: "Do you see any missing, curled, or damaged shingles/tiles?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "roof",
      mode: "lite",
      order_index: 3,
      text: "Are there visible water stains or signs of prior leaks on ceilings or top-floor walls?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "roof",
      mode: "lite",
      order_index: 4,
      text: "How is roof drainage (gutters, downspouts, flashing) performing during rain?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "roof",
      mode: "lite",
      order_index: 5,
      text: "Any soft spots, sagging, or structural concerns observed at the roof deck or eaves?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "windows_doors",
      mode: "lite",
      order_index: 6,
      text: "Do windows open, close, and lock smoothly without sticking?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "windows_doors",
      mode: "lite",
      order_index: 7,
      text: "Any broken panes, failing seals, or visible condensation between double panes?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "windows_doors",
      mode: "lite",
      order_index: 8,
      text: "Are there noticeable drafts around windows or exterior doors?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "windows_doors",
      mode: "lite",
      order_index: 9,
      text: "Is weatherstripping and caulking intact around frames and thresholds?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "windows_doors",
      mode: "lite",
      order_index: 10,
      text: "Do interior or exterior doors align properly and latch securely?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "bathroom",
      mode: "lite",
      order_index: 11,
      text: "Do you observe any active leaks at sink, toilet, tub, or shower connections?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "bathroom",
      mode: "lite",
      order_index: 12,
      text: "How is water pressure and drainage at all bathroom fixtures?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "bathroom",
      mode: "lite",
      order_index: 13,
      text: "Any visible mold, mildew, or persistent moisture on walls, ceilings, or grout?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "bathroom",
      mode: "lite",
      order_index: 14,
      text: "Are GFCI-protected outlets present and functioning as required near water sources?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "bathroom",
      mode: "lite",
      order_index: 15,
      text: "Is ventilation adequate (fan or window) to remove humidity after showers?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "kitchen",
      mode: "lite",
      order_index: 16,
      text: "Any leaks or signs of prior water damage under sinks or around appliances?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "kitchen",
      mode: "lite",
      order_index: 17,
      text: "Do faucets, dishwasher, and refrigerator water lines operate without drips or kinks?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "kitchen",
      mode: "lite",
      order_index: 18,
      text: "Are countertop and backsplash seams sealed and free of active deterioration?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "kitchen",
      mode: "lite",
      order_index: 19,
      text: "Are outlets (including GFCI where required) present and functioning near work areas?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "kitchen",
      mode: "lite",
      order_index: 20,
      text: "Do range hood or ventilation systems effectively remove cooking fumes?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "electrical",
      mode: "lite",
      order_index: 21,
      text: "Is the electrical panel clearly labeled, with no signs of overheating or corrosion?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "electrical",
      mode: "lite",
      order_index: 22,
      text: "Do light switches and outlets function properly without buzzing or flickering?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "electrical",
      mode: "lite",
      order_index: 23,
      text: "Any exposed wiring, damaged receptacles, or missing cover plates observed?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "electrical",
      mode: "lite",
      order_index: 24,
      text: "Are required safety devices (GFCI/AFCI) present in applicable circuits?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "electrical",
      mode: "lite",
      order_index: 25,
      text: "Do exterior fixtures and garage/basement outlets function and have proper protection?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "plumbing",
      mode: "lite",
      order_index: 26,
      text: "Any visible leaks at supply lines, shutoff valves, or drain pipes throughout the property?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "plumbing",
      mode: "lite",
      order_index: 27,
      text: "Is water pressure consistent at multiple fixtures running simultaneously?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "plumbing",
      mode: "lite",
      order_index: 28,
      text: "Do sinks, tubs, and showers drain promptly without gurgling or backups?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "plumbing",
      mode: "lite",
      order_index: 29,
      text: "Any signs of corrosion, outdated materials, or patchwork repairs on visible piping?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "plumbing",
      mode: "lite",
      order_index: 30,
      text: "Is the water heater free of leaks, rust, or error indicators, with proper venting?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "roof",
      mode: "lite",
      order_index: 31,
      text: "Are roof penetrations (vents, chimneys, skylights) properly flashed and sealed?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "roof",
      mode: "lite",
      order_index: 32,
      text: "Do gutters and downspouts flow freely without overflow or standing water near the foundation?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "windows_doors",
      mode: "lite",
      order_index: 33,
      text: "Are window sills and frames free of rot, swelling, or peeling paint?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "windows_doors",
      mode: "lite",
      order_index: 34,
      text: "Do garage doors and openers operate smoothly with intact safety sensors?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "bathroom",
      mode: "lite",
      order_index: 35,
      text: "Is caulk and grout intact around tubs, showers, and sinks with no active separation?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "kitchen",
      mode: "lite",
      order_index: 36,
      text: "Do built-in appliances power on and operate without unusual noise or vibration?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "electrical",
      mode: "lite",
      order_index: 37,
      text: "Are exterior GFCI outlets present and tested at front, rear, and garage areas?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "plumbing",
      mode: "lite",
      order_index: 38,
      text: "Is the main water shutoff accessible and functioning without leaks?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "plumbing",
      mode: "lite",
      order_index: 39,
      text: "Is there any evidence of moisture or leaks around toilets at the base or tank?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
    {
      category: "electrical",
      mode: "lite",
      order_index: 40,
      text: "Do smoke and CO detectors exist in required areas and pass a test check?",
      options: ["No issues", "Minor issues", "Moderate", "Major"],
    },
  ];

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/questions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, replace: true }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || `Import failed with ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data);
      setError(null);
    },
    onError: (e) => {
      console.error(e);
      setError(e.message || "Import failed");
    },
  });

  const handleImport = useCallback(() => {
    setResult(null);
    setError(null);
    mutation.mutate();
  }, [mutation]);

  return (
    <div className="min-h-screen bg-[#F5F8FA] p-6">
      <div className="max-w-2xl mx-auto bg-white border border-[#E4E8EC] rounded-xl p-6">
        <h1 className="text-2xl font-semibold text-[#0B1220] mb-1">
          Seed SwipeCheck Questions
        </h1>
        <p className="text-sm text-[#7A8292] mb-6">
          This will upsert your provided questions (replace=true) into the
          database. You must be signed in.
        </p>

        <button
          onClick={handleImport}
          disabled={mutation.isLoading}
          className={`px-4 py-2 rounded-lg text-white ${mutation.isLoading ? "bg-[#9AA1AD]" : "bg-[#00454F]"}`}
        >
          {mutation.isLoading ? "Importing..." : "Import Now"}
        </button>

        {error && (
          <div className="mt-4 p-3 rounded-lg border border-[#FFE082] bg-[#FFF8E1] text-[#8A6D3B] text-sm">
            {error}
          </div>
        )}
        {result && (
          <div className="mt-4 p-3 rounded-lg border border-[#C7F9CC] bg-[#ECFDF5] text-[#065F46] text-sm">
            <div className="font-medium">Imported {result.loaded} items.</div>
            <pre className="mt-2 text-xs whitespace-pre-wrap">
              {JSON.stringify(result.results, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-[#0B1220] mb-1">Preview</h2>
          <p className="text-sm text-[#7A8292] mb-3">First 5 questions</p>
          <ul className="space-y-2">
            {items.slice(0, 5).map((q) => (
              <li
                key={`${q.category}-${q.order_index}`}
                className="p-3 border border-[#E4E8EC] rounded-lg"
              >
                <div className="text-xs text-[#7A8292] mb-1">
                  {q.category} • {q.mode} • #{q.order_index}
                </div>
                <div className="text-sm text-[#0B1220]">{q.text}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
