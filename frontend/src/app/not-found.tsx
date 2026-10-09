"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home, Stethoscope, Brain, HelpCircle } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] px-4 py-12 bg-slate-50/50 relative overflow-hidden">
      {/* Background soft glowing shapes for premium aesthetics */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-teal-100/30 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-emerald-100/20 rounded-full blur-3xl" />

      <div className="relative max-w-xl w-full text-center z-10">
        {/* Animated flatline/heartbeat representation */}
        <div className="flex justify-center items-center gap-1.5 mb-6 text-slate-300">
          <svg className="w-48 h-12" viewBox="0 0 200 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Standard pulse wave */}
            <path
              d="M0 25H60L70 10L80 40L90 20L100 25H200"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-40"
            />
            {/* Animated glowing path tracing the heartbeat line */}
            <path
              d="M0 25H60L70 10L80 40L90 20L100 25H200"
              stroke="url(#pulse-grad)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="200"
              strokeDashoffset="200"
              className="animate-[dash_2.5s_linear_infinite]"
            />
            <defs>
              <linearGradient id="pulse-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#14b8a6" />
                <stop offset="50%" stopColor="#0d9488" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Inject style tag for pure CSS heartbeat line animation */}
          <style>{`
            @keyframes dash {
              0% {
                stroke-dashoffset: 400;
              }
              100% {
                stroke-dashoffset: 0;
              }
            }
          `}</style>
        </div>

        {/* Big 404 Heading with Gradient styling */}
        <h1 className="text-8xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-500">
          404
        </h1>
        <h2 className="mt-4 text-2xl font-bold text-slate-800 tracking-tight">
          Page Not Found
        </h2>
        <p className="mt-3 text-slate-500 max-w-md mx-auto leading-relaxed">
          The health document or service portal you are looking for doesn't exist, has been moved, or is temporarily unavailable. Let's find your way back.
        </p>

        {/* Quick action controls */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-teal-600 transition-all font-semibold shadow-sm active:scale-98 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
          
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold shadow-md shadow-teal-500/25 hover:shadow-teal-500/35 transition-all active:scale-98 cursor-pointer"
          >
            <Home className="h-4 w-4" />
            Go to Homepage
          </Link>
        </div>

        {/* Helpful links grid */}
        <div className="mt-12 border-t border-slate-200/80 pt-8">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Try one of these departments instead
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/doctors"
              className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 bg-white hover:border-teal-200 hover:shadow-sm hover:-translate-y-0.5 transition-all group"
            >
              <div className="p-2 rounded-lg bg-teal-50 text-teal-600 group-hover:bg-teal-100 transition-colors">
                <Stethoscope className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-700 group-hover:text-teal-600 transition-colors">
                  Find Doctors
                </p>
                <p className="text-xs text-slate-400">Book specialists</p>
              </div>
            </Link>

            <Link
              href="/symptom-checker"
              className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 bg-white hover:border-teal-200 hover:shadow-sm hover:-translate-y-0.5 transition-all group"
            >
              <div className="p-2 rounded-lg bg-teal-50 text-teal-600 group-hover:bg-teal-100 transition-colors">
                <Brain className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-700 group-hover:text-teal-600 transition-colors">
                  AI Diagnostic
                </p>
                <p className="text-xs text-slate-400">Symptom check</p>
              </div>
            </Link>

            <Link
              href="/faq"
              className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 bg-white hover:border-teal-200 hover:shadow-sm hover:-translate-y-0.5 transition-all group"
            >
              <div className="p-2 rounded-lg bg-teal-50 text-teal-600 group-hover:bg-teal-100 transition-colors">
                <HelpCircle className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-700 group-hover:text-teal-600 transition-colors">
                  Support Center
                </p>
                <p className="text-xs text-slate-400">Common questions</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
