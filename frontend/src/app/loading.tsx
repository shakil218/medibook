import { Activity } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[65vh] px-4 bg-slate-50/50">
      {/* Visual Indicator Container */}
      <div className="relative flex flex-col items-center max-w-sm w-full text-center">
        {/* Glow effect in background */}
        <div className="absolute -inset-4 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 rounded-full blur-2xl animate-pulse" />

        {/* Dynamic Spinning Rings and Pulse Center */}
        <div className="relative flex items-center justify-center w-24 h-24 mb-6">
          {/* Outer Ring */}
          <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
          {/* Outer spinning gradient border */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-teal-500 border-r-teal-500 animate-spin" />
          
          {/* Inner Ring (spinning opposite) */}
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-emerald-400 border-l-emerald-400 animate-spin [animation-duration:1.5s] [animation-direction:reverse]" />
          
          {/* Core icon with high-end pulsing */}
          <div className="absolute flex items-center justify-center w-12 h-12 bg-teal-500 rounded-full shadow-md shadow-teal-500/30 text-white animate-pulse">
            <Activity className="h-6 w-6 stroke-[2.5]" />
          </div>
        </div>

        {/* Loading text with shimmer */}
        <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-2 animate-pulse">
          MediBook is loading
        </h3>
        <p className="text-sm text-slate-500 max-w-[280px] mx-auto animate-pulse [animation-delay:200ms]">
          Connecting you to secure healthcare channels...
        </p>

        {/* Premium Shimmer skeleton representation (micro-dashboard) */}
        <div className="w-full mt-10 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-100 rounded-full animate-pulse" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3 bg-slate-100 rounded w-1/3 animate-pulse" />
              <div className="h-3 bg-slate-100 rounded w-1/2 animate-pulse [animation-delay:150ms]" />
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <div className="h-3 bg-slate-100 rounded animate-pulse [animation-delay:300ms]" />
            <div className="h-3 bg-slate-100 rounded w-5/6 animate-pulse [animation-delay:450ms]" />
          </div>
        </div>
      </div>
    </div>
  );
}
