import { Loader2 } from "lucide-react";

function Loading() {
  return (
    <div className="h-screen flex items-center justify-center bg-white">
      <Loader2 size={26} className="animate-spin text-zinc-950" />
    </div>
  );
}

export default Loading;
