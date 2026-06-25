import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HelpChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    await sendMessage({ text });
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open AI help"
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 h-14 w-14 rounded-full bg-gradient-to-br from-gold to-maroon text-background shadow-[0_10px_30px_-8px_rgba(184,134,47,0.6)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      <div
        className={cn(
          "fixed z-40 transition-all",
          "bottom-36 right-4 sm:bottom-24 sm:right-6",
          "w-[calc(100vw-2rem)] sm:w-[380px] max-w-[420px]",
          "h-[70vh] sm:h-[520px]",
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none",
        )}
      >
        <div className="h-full flex flex-col rounded-2xl border border-gold/30 bg-card shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gold/20 bg-gradient-to-r from-ink to-maroon text-background">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gold" />
              <div>
                <div className="font-display text-lg leading-none">Annapurna AI</div>
                <div className="text-[10px] uppercase tracking-widest opacity-70">Concierge · 24/7</div>
              </div>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-background/40">
            {messages.length === 0 && (
              <div className="text-center text-sm text-muted-foreground mt-8 space-y-2 px-4">
                <p>Namaste! 🙏</p>
                <p>Ask me about rooms, menu, table booking, or anything about Annapurna Palace.</p>
              </div>
            )}
            {messages.map((m) => {
              const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
              return (
                <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap leading-relaxed",
                      m.role === "user"
                        ? "bg-gold text-ink rounded-br-sm"
                        : "bg-secondary text-foreground rounded-bl-sm border border-gold/15",
                    )}
                  >
                    {text || "…"}
                  </div>
                </div>
              );
            })}
            {status === "submitted" && (
              <div className="flex justify-start">
                <div className="bg-secondary border border-gold/15 rounded-2xl rounded-bl-sm px-3 py-2 text-sm">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-gold animate-bounce [animation-delay:120ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-gold animate-bounce [animation-delay:240ms]" />
                  </span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="p-2 border-t border-gold/20 flex items-center gap-2 bg-card">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything…"
              className="flex-1 h-10 rounded-full bg-background border border-gold/20 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="h-10 w-10 p-0 rounded-full bg-gold text-ink hover:bg-gold/90 shrink-0"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}