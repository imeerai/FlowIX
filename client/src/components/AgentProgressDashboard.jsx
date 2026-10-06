import {
  CheckCircle2Icon,
  CircleIcon,
  Clock3,
  Loader2Icon,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

export default function AgentProgressDashboard({ project }) {
  const { id } = useParams();
  const { retryGeneration } = useAppContext();
  const [retrying, setRetrying] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const planned = project.filesPlanned || [];
  const completed = project.filesGenerated || [];
  const current = project.currentFile;
  const currentOperation = project.currentOperation;
  const isFailed = project.status === "failed";
  const isRevision = project.status === "revising";
  const rawProgress = planned.length
    ? Math.round((completed.length / planned.length) * 100)
    : 0;
  const progress =
    isRevision && current ? Math.min(rawProgress, 99) : rawProgress;

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
            {(project.messages || []).filter((m) =>
              m.content?.includes("Retrying project generation"),
            ).length >= 2 ? (
              <div className="mt-2 rounded bg-amber-100/80 p-2 text-xs font-semibold text-amber-900">
                Maximum retry limit reached (2/2 retries used). Further retries stopped.
              </div>
            ) : (
              <button
                type="button"
                disabled={retrying}
                onClick={async () => {
                  setRetrying(true);
                  await retryGeneration(id || project._id);
                  setRetrying(false);
                }}
                className="mt-1 flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50 cursor-pointer transition-colors"
              >
                <RefreshCw size={13} className={retrying ? "animate-spin" : ""} />
                {retrying ? "Retrying..." : "Retry Generation"}
              </button>
            )}
          </div>
        )}

        {/* Progress bar */}
        {planned.length > 0 && !isFailed && (
          <div className="mb-6">
            <div className="flex justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              <span>{isRevision ? "Applying changes" : "Progress"}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-zinc-700 transition-all duration-500 ease-out"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Files checklist */}
        {planned.length > 0 ? (
          <div>
            <span className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-3">
              {isRevision ? "Revision Files" : "Planned Files"} (
              {completed.length}/{planned.length})
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
                        {isRevision && file.path === current
                          ? `${currentOperation || "apply"} operation in progress`
                          : file.description}
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
