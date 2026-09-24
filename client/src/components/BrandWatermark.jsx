import React from "react";

export default function BrandWatermark() {
  return (
    <div
      aria-label="Built with FlowIX"
      className="pointer-events-none absolute bottom-4 right-4 z-50 rounded-full border border-zinc-200/80 bg-white/90 px-3 py-1.5 text-[10px] font-semibold tracking-wide text-zinc-500 shadow-sm backdrop-blur-sm"
    >
      Built with <span className="text-zinc-900">FlowIX</span>
    </div>
  );
}
