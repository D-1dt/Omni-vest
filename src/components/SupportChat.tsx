import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

const SUPPORT_PHONE = "+1 (956) 572-4292";

const WELCOME =
  "Hello! Welcome to Omni-Musk Support. How can I help you navigate your portfolio or track your orders today?";

const ERROR_FALLBACK = `I'm sorry — I can't assist with that right now. Please call our support desk at ${SUPPORT_PHONE} and one of our representatives will help you further.`;

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, status } = useChat({
    transport,
    onError: () => setErrorText(ERROR_FALLBACK),
  });

  const busy = status === "submitted" || status === "streaming";
  const typing = status === "submitted";

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing, errorText]);

  const send = () => {
    const text = input.trim();
    if (!text || busy) return;
    setErrorText(null);
    setInput("");
    void sendMessage({ text });
    setTimeout(() => inputRef.current?.focus(), 0);
  };


  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open support chat"
          className="fixed bottom-6 right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background shadow-elevated transition-transform hover:scale-105"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-[60] flex h-[540px] max-h-[85vh] w-[92vw] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 text-neutral-100 shadow-elevated">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-neutral-900 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-neutral-700 to-neutral-900 text-sm font-semibold">
                  OM
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-neutral-900" />
              </div>
              <div>
                <div className="text-sm font-semibold">Omni-Musk Support</div>
                <div className="text-[11px] text-emerald-400">Online</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-full p-1.5 text-neutral-400 transition hover:bg-white/5 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            <div className="flex justify-start">
              <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-neutral-800 px-3.5 py-2 text-sm leading-relaxed text-neutral-100">
                {WELCOME}
              </div>
            </div>
            {messages.map((m) => {
              const text = m.parts
                .map((p) => (p.type === "text" ? p.text : ""))
                .join("");
              if (!text) return null;
              return (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "rounded-br-sm bg-white text-neutral-900"
                        : "rounded-bl-sm bg-neutral-800 text-neutral-100"
                    }`}
                  >
                    {text}
                  </div>
                </div>
              );
            })}
            {errorText && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-sm leading-relaxed text-amber-200">
                  {errorText}
                </div>
              </div>
            )}
            {typing && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-neutral-800 px-3.5 py-2.5 text-xs text-neutral-400">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500" />
                  </span>
                  <span className="ml-2">Assistant is typing…</span>
                </div>
              </div>
            )}
          </div>


          {/* Footer */}
          <div className="border-t border-white/10 bg-neutral-900 p-3">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Type your message…"
                className="flex-1 rounded-full border border-white/10 bg-neutral-950 px-4 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-white/30 focus:outline-none"
              />
              <button
                onClick={send}
                disabled={!input.trim() || busy}
                aria-label="Send message"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-900 transition disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
