"use client";
import { useEffect, useState } from "react";
import { useUser } from "@/utils/useUser";

const NAV_CARDS = [
  {
    href: "/swipecheck",
    icon: "✅",
    title: "SwipeCheck",
    desc: "Walk through a home inspection checklist by category",
    color: "border-blue-200 hover:border-blue-400",
  },
  {
    href: "/quick-check",
    icon: "📸",
    title: "Quick Check",
    desc: "Snap a photo of any issue and get instant AI analysis",
    color: "border-purple-200 hover:border-purple-400",
  },
  {
    href: "/my-home",
    icon: "🏠",
    title: "My Home",
    desc: "View your property dashboard and latest check results",
    color: "border-green-200 hover:border-green-400",
  },
  {
    href: "/my-home/proof-pack",
    icon: "📋",
    title: "Proof Pack",
    desc: "Your shareable home record — verified work & documents",
    color: "border-amber-200 hover:border-amber-400",
  },
  {
    href: "/contractors",
    icon: "🔧",
    title: "Find a Pro",
    desc: "Browse Swipe-verified contractors in your area",
    color: "border-red-200 hover:border-red-400",
  },
];

export default function HomePage() {
  const { user, loading } = useUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏠</span>
            <span className="text-xl font-bold text-gray-900">Swipe Home</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {!loading && (
              user
                ? <a href="/account/logout" className="text-gray-500 hover:text-gray-700 transition-colors">Sign out</a>
                : <>
                    <a href="/account/signin" className="text-gray-500 hover:text-gray-700 transition-colors">Sign in</a>
                    <a href="/account/signup" className="bg-[#357AFF] text-white px-4 py-1.5 rounded-lg font-medium hover:bg-[#2E69DE] transition-colors">Sign up</a>
                  </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Hero */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Know your home.
          </h1>
          <p className="text-gray-500 text-base">
            Track condition, verify work, and build your home's proof of care.
          </p>
        </div>

        {/* Nav cards */}
        <div className="space-y-3">
          {NAV_CARDS.map((card) => (
            <a
              key={card.href}
              href={card.href}
              className={`flex items-center gap-4 bg-white rounded-2xl border-2 p-4 shadow-sm transition-all ${card.color}`}
            >
              <span className="text-3xl">{card.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{card.title}</p>
                <p className="text-sm text-gray-500 truncate">{card.desc}</p>
              </div>
              <svg className="w-5 h-5 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          ))}
        </div>

        {!loading && !user && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-5 text-center">
            <p className="text-sm text-blue-700 font-medium mb-3">
              Create a free account to save checks, claim your DIDPID, and build your Proof Pack.
            </p>
            <a
              href="/account/signup"
              className="inline-block bg-[#357AFF] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2E69DE] transition-colors"
            >
              Get Started Free
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
