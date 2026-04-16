"use client";

const CATEGORIES = [
  { key: "roof",         label: "Roof",            icon: "🏚️",  color: "border-slate-200 hover:border-slate-400"  },
  { key: "hvac",         label: "HVAC",            icon: "❄️",  color: "border-blue-200 hover:border-blue-400"    },
  { key: "electrical",   label: "Electrical",      icon: "⚡",  color: "border-yellow-200 hover:border-yellow-400"},
  { key: "plumbing",     label: "Plumbing",        icon: "🚿",  color: "border-cyan-200 hover:border-cyan-400"    },
  { key: "kitchen",      label: "Kitchen",         icon: "🍳",  color: "border-orange-200 hover:border-orange-400"},
  { key: "bathroom",     label: "Bathroom",        icon: "🛁",  color: "border-teal-200 hover:border-teal-400"   },
  { key: "flooring",     label: "Flooring",        icon: "🪵",  color: "border-amber-200 hover:border-amber-400" },
  { key: "bedroom",      label: "Bedroom",         icon: "🛏️",  color: "border-purple-200 hover:border-purple-400"},
  { key: "windows_doors",label: "Windows & Doors", icon: "🪟",  color: "border-indigo-200 hover:border-indigo-400"},
  { key: "foundation",   label: "Foundation",      icon: "🧱",  color: "border-stone-200 hover:border-stone-400" },
  { key: "exterior",     label: "Exterior",        icon: "🏡",  color: "border-green-200 hover:border-green-400" },
  { key: "garage",       label: "Garage",          icon: "🚗",  color: "border-gray-200 hover:border-gray-400"  },
];

export default function SwipeCheckCategoryPage() {
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
            <h1 className="text-xl font-bold text-gray-900">SwipeCheck</h1>
            <p className="text-xs text-gray-500">Choose a category to inspect</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <p className="text-sm text-gray-500 mb-5">
          Answer a short set of questions about each area of your home. Takes 2–3 minutes per category.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map(cat => (
            <a
              key={cat.key}
              href={`/swipecheck/${cat.key}`}
              className={`bg-white rounded-2xl border-2 p-4 flex flex-col items-center gap-2 text-center shadow-sm transition-all ${cat.color}`}
            >
              <span className="text-3xl">{cat.icon}</span>
              <span className="text-sm font-semibold text-gray-800">{cat.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
