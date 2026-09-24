import React, { useEffect, useMemo, useState } from "react";
import {
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { detectDependencies } from "../utils/sandpackUtils";
import SandPackErrorMonitor from "./SandPackErrorMonitor";
import BrandWatermark from "./BrandWatermark";
import { Loader2, RefreshCw } from "lucide-react";

function FullPageRuntimeStatus({ onRetry }) {
  const { sandpack } = useSandpack();
  const status = sandpack.status;
  const hasError =
    Boolean(sandpack.error) || status === "error" || status === "timeout";
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (hasError || status === "done") {
      setTimedOut(false);
      return undefined;
    }
    const timer = setTimeout(() => setTimedOut(true), 30000);
    return () => clearTimeout(timer);
  }, [hasError, status]);

  if (status === "done" && !hasError) return null;
  if (!hasError && !timedOut) {
    return (
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 text-zinc-700">
        <Loader2 size={24} className="mb-3 animate-spin" />
        <p className="text-sm">Loading preview...</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/95 p-6">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
          <RefreshCw size={18} />
        </div>
        <h3 className="text-sm font-semibold text-zinc-900">
          Preview is unavailable
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          The browser preview runtime could not start. Download the project and
          run it locally.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white cursor-pointer"
        >
          <RefreshCw size={13} />
          Try again
        </button>
        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-left">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            Run locally
          </p>
          <code className="mt-2 block text-[11px] leading-5 text-zinc-700">
            npm install
            <br />
            npm run dev
          </code>
        </div>
      </div>
    </div>
  );
}

const FullPagePreview = ({ files }) => {
  const [showErrorOverlay, setShowErrorOverlay] = useState(true);
  const [runtimeKey, setRuntimeKey] = useState(0);

  //convert liveFiles to sandpack format
  const sandpackFiles = useMemo(() => {
    if (!files) return {};
    const spFiles = {};
    for (const [path, content] of Object.entries(files)) {
      spFiles[path] = { code: content };
    }
    return spFiles;
  }, [files]);

  // detect dependencies from import statements using liveFiles
  const dependencies = useMemo(() => {
    if (!files) return {};

    return detectDependencies(files);
  }, [files]);

  return (
    <div className="relative h-screen w-screen bg-white overflow-hidden">
      <SandpackProvider
        key={runtimeKey}
        template="react"
        files={sandpackFiles}
        customSetup={{ dependencies }}
        options={{
          autorun: true,
          initMode: "immediate",
          experimental_enableServiceWorker: true,
          logLevel: 0,
        }}
        className="h-full w-full"
      >
        <FullPageRuntimeStatus
          onRetry={() => setRuntimeKey((key) => key + 1)}
        />
        <SandPackErrorMonitor onErrorChange={setShowErrorOverlay} />
        <SandpackLayout className="h-full w-full border-none! bg-transparent!">
          <SandpackPreview
            showNavigator={false}
            showRefreshButton={false}
            showOpenInCodeSandbox={false}
            showSandpackErrorOverlay={showErrorOverlay}
            className="h-full w-full"
          />
        </SandpackLayout>
      </SandpackProvider>
      <BrandWatermark />
    </div>
  );
};

export default FullPagePreview;
