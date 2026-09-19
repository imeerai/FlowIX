import { Loader2 } from "lucide-react";

/** Renders a full-screen loading indicator. */
function Loading() {
  return (
    <div
      role="status"
      aria-label="loading"
      className="h-screen flex items-center justify-center bg-white"
    >
      <Loader2 size={26} className="animate-spin text-zinc-950" />
    </div>
  );
}

export default Loading;
