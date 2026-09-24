import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  SandpackCodeEditor,
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { detectDependencies } from "../utils/sandpackUtils";
import SandPackErrorMonitor from "./SandPackErrorMonitor";
import { useAppContext } from "../context/AppContext";
import { Loader2, RefreshCw } from "lucide-react";
import BrandWatermark from "./BrandWatermark";

//watches for file edit inside sandpack editor and saves changes to DB and live state
function SandpackFileWatcher({ onLiveFilesChange }) {
  const { sandpack } = useSandpack();
  const { files } = sandpack;
  const { activeProject, updateProjectFiles } = useAppContext();
  const activeProjectRef = useRef(activeProject);

  useEffect(() => {
    activeProjectRef.current = activeProject;
  }, [activeProject]);

  useEffect(() => {
    const project = activeProjectRef.current;
    if (!project) return;
    // const updatedFiles = {};
    const updatedFiles = {};
    let hasChanges = false;
    for (const [path, fileObj] of Object.entries(files)) {
      const fileCode = fileObj.code;
      updatedFiles[path] = fileCode;
      const originalContent =
        typeof project.files[path] === "string"
          ? project.files[path]
          : project.files[path]?.content;
      if (originalContent !== undefined && originalContent !== fileCode) {
        hasChanges = true;
      }
    }
    //sync live files to parent
    onLiveFilesChange(updatedFiles);
    if (hasChanges) {
      updateProjectFiles(updatedFiles);
    }
  }, [files]);
  return null;
}

function SandpackRuntimeStatus({ onRetry }) {
  const { sandpack } = useSandpack();
  const [timedOut, setTimedOut] = useState(false);
  const status = sandpack.status;
  const isReady = status === "done";
  const hasError =
    Boolean(sandpack.error) || status === "error" || status === "timeout";
  const runtimeError = sandpack.error?.message;

  useEffect(() => {
    if (isReady || hasError) {
      setTimedOut(false);
      return undefined;
    }

    const timer = setTimeout(() => setTimedOut(true), 30000);
    return () => clearTimeout(timer);
  }, [hasError, isReady, status]);

  if (isReady && !hasError) return null;

  const showTimeout = timedOut || hasError;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/95 p-6">
      <div className="max-w-sm text-center">
        {showTimeout ? (
          <>
            <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
              <RefreshCw size={18} />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900">
              Preview is unavailable
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              The browser preview runtime could not start. Your project is still
              safe and can be run locally.
            </p>
            {runtimeError && (
              <p className="mt-2 max-h-16 overflow-auto rounded bg-zinc-50 p-2 text-left text-[10px] text-zinc-400">
                {runtimeError}
              </p>
            )}
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-700 cursor-pointer"
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
              <p className="mt-2 text-[10px] leading-relaxed text-zinc-500">
                Use Download in the header first, unzip the project, then run
                these commands in its folder.
              </p>
            </div>
          </>
        ) : (
          <>
            <Loader2
              size={24}
              className="mx-auto mb-3 animate-spin text-zinc-700"
            />
            <p className="text-sm font-medium text-zinc-800">
              Loading preview...
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Starting the website runtime
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/** Renders project files in Sandpack and disables file synchronization in read-only mode. */
const PreviewPanel = ({ project, activeFile, showCode, readOnly = false }) => {
  const [showErrorOverlay, setShowErrorOverlay] = useState(true);
  const [runtimeKey, setRuntimeKey] = useState(0);

  //keep local state of file that updates as user types
  const [liveFiles, setLiveFiles] = useState(project.files);
  const [prevProjectKey, setPrevProjectKey] = useState(
    `${project._id}-${project.version}`,
  );
  const currentKey = `${project._id}-${project.version}`;
  if (prevProjectKey !== currentKey) {
    setPrevProjectKey(currentKey);
    setLiveFiles(project.files);
  }

  const handleLiveFilesChange = (newFiles) => {
    setLiveFiles((prev) => {
      let changed = false;
      for (const [path, content] of Object.entries(newFiles)) {
        if (prev[path] !== content) {
          changed = true;
          break;
        }
      }
      return changed ? newFiles : prev;
    });
  };

  //convert liveFiles to sandpack format
  const sandpackFiles = useMemo(() => {
    const spFiles = {};
    for (const [path, content] of Object.entries(liveFiles)) {
      const fileCode =
        typeof content === "string" ? content : content?.content || "";
      spFiles[path] = { code: fileCode, active: path === activeFile };
    }
    return spFiles;
  }, [liveFiles, activeFile]);

  // detect dependencies from import statements using liveFiles
  const dependencies = useMemo(() => {
    return detectDependencies(liveFiles);
  }, [liveFiles]);

  return (
    <div className="relative h-full w-full">
      <SandpackProvider
        key={`${project._id}-${runtimeKey}`}
        template="react"
        files={sandpackFiles}
        customSetup={{ dependencies }}
        options={{
          autorun: true,
          initMode: "immediate",
          classes: {
            "sp-wrapper": "sp-wrapper",
            "sp-layout": "sp-layout",
            "sp-preview": "sp-preview",
          },
          logLevel: 0,
          experimental_enableServiceWorker: true,
        }}
        theme={{
          colors: {
            surface1: "#ffffff",
            surface2: "#f4f4f5",
            surface3: "#e4e4e7",
            clickable: "#71717a",
            base: "#09090b",
            disabled: "#a1a1aa",
            hover: "#18181b",
            accent: "#18181b",
            error: "#ef4444",
            errorSurface: "#feef2f2",
          },
          font: {
            body: "'urbanist', sans-serif , system-ui , -apple-system",
            mono: "'Geist Mono', 'ui-monospace',  monospace",
            size: "13px",
            lineHeight: "1.6",
          },
        }}
      >
        <SandpackRuntimeStatus
          onRetry={() => setRuntimeKey((key) => key + 1)}
        />
        {!readOnly && (
          <SandpackFileWatcher onLiveFilesChange={handleLiveFilesChange} />
        )}
        <SandPackErrorMonitor onErrorChange={setShowErrorOverlay} />
        <SandpackLayout
          style={{
            height: "100%",
            border: "none",
            borderRadius: "0px",
            background: "transparent",
          }}
        >
          {showCode && (
            <SandpackCodeEditor
              showTabs
              showLineNumbers
              showInlineErrors
              wrapContent
              style={{ height: "100%", flex: 1, minWidth: 0 }}
            />
          )}

          <SandpackPreview
            showNavigator={false}
            showRefreshButton
            showOpenInCodeSandbox={false}
            showSandpackErrorOverlay={showErrorOverlay}
            style={{ height: "100%", flex: showCode ? 1 : 2, minWidth: 0 }}
          />
        </SandpackLayout>
      </SandpackProvider>
      <BrandWatermark />
    </div>
  );
};

export default PreviewPanel;
