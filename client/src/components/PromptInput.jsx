import React, { useRef, useState } from "react";
import { ArrowRight, Square } from "lucide-react";

const PromptInput = ({
  onSubmit,
  onCancel,
  loading = false,
  disabled = false,
  disabledMessage = "",
  placeholder = "Describe the website you want to build...",
}) => {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || loading || disabled) return;
    onSubmit(trimmed);
    setValue("");
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white focus-within:ring-1 focus-within:ring-zinc-300 transition">
      <div className="flex items-end gap-2 p-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          disabled={loading || disabled}
          rows={1}
          aria-label={disabled ? "Limit reached" : placeholder}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none outline-none resize-none text-zinc-900 placeholder:text-zinc-400 text-sm"
        />
        <button
          type="button"
          onClick={loading ? onCancel : handleSubmit}
          disabled={disabled || (!loading && !value.trim())}
          aria-label={loading ? "Stop AI request" : "Send prompt"}
          title={loading ? "Stop AI request" : "Send prompt"}
          className="inline-flex items-center justify-center bg-zinc-950 text-white hover:bg-zinc-800 disabled:opacity-40 cursor-pointer rounded-full shrink-0"
          style={{ width: 24, height: 24 }}
        >
          {loading ? (
            <Square size={12} fill="currentColor" />
          ) : (
            <ArrowRight size={18} />
          )}
        </button>
      </div>
      {disabledMessage && (
        <div
          className="border-t border-amber-100 bg-amber-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-amber-700"
          role="status"
        >
          Limit reached
        </div>
      )}
    </div>
  );
};

export default PromptInput;
