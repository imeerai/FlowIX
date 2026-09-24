import {
  CheckCircle2Icon,
  CircleIcon,
  Clock3,
  Loader2Icon,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function AgentProgressDashboard({ project }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const planned = project.filesPlanned || [];
  const completed = project.filesGenerated || [];
  const current = project.currentFile;
  const isFailed = project.status === "failed";
  const isRevision = project.status === "revising";

  useEffect(() => {
    const startedAt = Date.now();
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [project.status]);

  return (
    <div className="h-full w-full bg-zinc-50 flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto">
      <div className="max-w-xl w-full bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 relative overflow-hidden">
        {/* Status Header */}
        <div className="flex items-center gap-4 mb-6">
          <div>
            <h2 className="text-base font-medium text-zinc-800">
              {isFailed
                ? "Generation Failed"
                : isRevision
                  ? "AI is reviewing your website..."
                  : project.status === "pending"
                    ? "Planning Architecture..."
                    : "AI Agent is Building..."}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isFailed
                ? "An error occurred during build"
                : isRevision
                  ? "Checking your request and applying changes to the right files"
                  : "Writing production-ready React codebase"}
            </p>
            {!isFailed && (
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-2">
                <Clock3 size={12} />
                <span>Elapsed {elapsedSeconds}s</span>
              </div>
            )}
          </div>
        </div>

        {isFailed && project.error && (
          <div className="mb-6 space-y-3 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-medium">Error: {project.error}</p>
            <p className="text-xs leading-relaxed text-red-600">
              Download the project from the header and run it locally if the
              browser preview cannot handle its size.
            </p>
            <code className="block rounded bg-white/70 p-2 text-[11px] leading-5 text-red-800">
              npm install
              <br />
              npm run dev
            </code>
          </div>
        )}

        {/* Progress bar */}
        {planned.length > 0 && !isFailed && !isRevision && (
          <div className="mb-6">
            <div className="flex justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              <span>Progress</span>
              <span>
                {Math.round((completed.length / planned.length) * 100)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-zinc-700 transition-all duration-500 ease-out"
                style={{
                  width: `${(completed.length / planned.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Files checklist */}
        {isRevision ? (
          <div className="flex flex-col items-center justify-center py-10 text-zinc-400 text-center">
            <Loader2Icon
              size={26}
              className="animate-spin mb-3 text-zinc-700"
            />
            <p className="text-sm text-zinc-700 font-medium">
              Applying your update
            </p>
            <p className="text-xs mt-1 max-w-sm">
              The AI is updating only the files needed for your request. This
              usually takes a few seconds.
            </p>
          </div>
        ) : planned.length > 0 ? (
          <div>
            <span className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-3">
              Planned Files ({completed.length}/{planned.length})
            </span>
            <div className="space-y-2.5 max-h-75 overflow-y-auto pr-1">
              {planned.map((file) => {
                const isCompleted = completed.includes(file.path);
                const isGenerating = current === file.path;

                return (
                  <div
                    key={file.path}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                      isGenerating
                        ? "bg-zinc-50/50 border-zinc-300"
                        : isCompleted
                          ? "bg-white border-zinc-100"
                          : "bg-white border-zinc-100 opacity-60"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2Icon
                        size={16}
                        className="text-emerald-500 shrink-0"
                      />
                    ) : isGenerating ? (
                      <Loader2Icon
                        size={16}
                        className="animate-spin text-zinc-900 shrink-0"
                      />
                    ) : (
                      <CircleIcon
                        size={16}
                        className="text-zinc-300 shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-medium truncate ${isGenerating ? "text-zinc-800" : "text-zinc-700"}`}
                      >
                        {file.path}
                      </p>
                      <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                        {file.description}
                      </p>
                    </div>
                    {isGenerating && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 font-semibold animate-pulse uppercase tracking-wider">
                        Active
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          !isFailed && (
            <div className="flex flex-col items-center justify-center py-6 text-zinc-400">
              <Loader2Icon size={24} className="animate-spin mb-2" />
              <p className="text-xs">
                Analyzing requirements and designing project structure...
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
