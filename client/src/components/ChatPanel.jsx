import React, { useEffect, useRef } from "react";

import { Bot, BotMessageSquare, User } from "lucide-react";

import PromptInput from "./PromptInput";

function ChatPanel({
  messages,
  onSend,
  onCancel,
  loading,
  disabledMessage = "",
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages, loading]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 hide-scrollbar">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-400 text-sm text-center">
              Ask AI to modify your website
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start gap-2.5 ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role !== "user" && (
              <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-5 bg-zinc-100 border border-zinc-200">
                <BotMessageSquare size={14} className="text-zinc-700" />
              </div>
            )}

            <div
              className={`min-w-0 max-w-[88%] ${message.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`flex items-center gap-1.5 mb-1 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "user" && (
                  <User size={12} className="text-zinc-500" />
                )}
                <p
                  className={`text-[10px] font-semibold uppercase tracking-widest ${message.role === "user" ? "text-zinc-500" : "text-zinc-400"}`}
                >
                  {message.role === "user" ? "You" : "AI assistant"}
                </p>
              </div>

              <div
                className={`px-3 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap wrap-break-word bg-zinc-50 text-zinc-700 border border-zinc-200 ${message.role === "user" ? "rounded-2xl rounded-tr-sm" : "rounded-2xl rounded-tl-sm"}`}
              >
                {message.content.split("- '/").map((text, i) => (
                  <span key={i} className="block">
                    <span className={i === 0 ? "hidden" : ""}>- '/</span>
                    {text}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5 items-start">
            <div className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center mt-0.5 bg-zinc-900/5">
              <Bot size={13} className="text-zinc-900" />
            </div>

            <div className="flex-1">
              <p className="text-[11px] font-medium text-zinc-400 mb-2 uppercase tracking-wider">
                AI
              </p>

              <div className="dot-loader">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-zinc-200">
        <PromptInput
          onSubmit={onSend}
          onCancel={onCancel}
          loading={loading}
          disabled={Boolean(disabledMessage)}
          disabledMessage={disabledMessage}
          placeholder="Ask AI to modify your website..."
          autoFocus
        />
      </div>
    </div>
  );
}

export default ChatPanel;
