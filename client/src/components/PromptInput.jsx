import React, { useRef, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

const PromptInput = ({
  onSubmit,
  loading = false,
  placeholder = "Describe the website you want to build...",
}) => {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    onSubmit(trimmed);
    setValue("");
  };
  const handlekeydown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl flex items-end gap-2 focus-within:ring-1 focus-within:ring-zinc-300 transition p-3">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        onKeyDown={handlekeydown}
        disabled={loading}
        rows={1}
        className="flex-1 bg-transparent border-none outline-none resize-none text-zinc-900 placeholder:text-zinc-400 text-sm"
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!value.trim() || loading}
        className="inline-flex items-center justify-center bg-zinc-950 text-white hover:bg-zinc-800 disabled:opacity-40 cursor-pointer rounded-full shrink-0"
        style={{ width: 24, height: 24 }}
      >
        {loading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <ArrowRight size={18} />
        )}
      </button>
    </div>
  );
};

export default PromptInput;
