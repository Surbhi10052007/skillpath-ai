"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUp, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { AIOrb } from "@/components/fx/AIOrb";
import { ASSISTANT_PROMPTS } from "@/data/mock";
import { chatService } from "@/lib/api/services";
import {
  generateAssistantReply,
  generatePreOnboardingReply,
  generateProjectReply,
  type AssistantContext,
  type ProjectContext,
} from "@/lib/engine/assistant";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";

interface ChatPanelProps {
  context?: AssistantContext;
  /** Landing mode: answer honestly without assuming a student profile. */
  anonymous?: boolean;
  /** Use the API (persists history) instead of generating locally. */
  remote?: boolean;
  /** When set, replies are grounded in the mission the student is viewing. */
  projectContext?: ProjectContext;
  pendingPrompt?: string | null;
  initialMessages?: ChatMessage[];
  onMessagesChange?: (messages: ChatMessage[]) => void;
  className?: string;
  heightClass?: string;
  showHeader?: boolean;
}

/* Minimal rich text: **bold**, *italic*, bullet / numbered lines. */
function renderRich(text: string): ReactNode {
  const inline = (line: string, key: string) => {
    const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
    return (
      <span key={key}>
        {parts.map((p, i) => {
          if (p.startsWith("**")) return <strong key={i} className="font-semibold text-fg">{p.slice(2, -2)}</strong>;
          if (p.startsWith("*")) return <em key={i}>{p.slice(1, -1)}</em>;
          return p;
        })}
      </span>
    );
  };
  return text.split("\n").map((line, i) => {
    if (!line.trim()) return <span key={i} className="block h-2" />;
    const bullet = /^[•\-]\s+/.test(line);
    const numbered = /^\d+\.\s+/.test(line);
    const status = /^[✓→·]\s/.test(line);
    if (bullet || numbered || status) {
      return (
        <span key={i} className="flex gap-2 pl-1">
          <span className={cn("shrink-0", line.startsWith("✓") ? "text-mint" : line.startsWith("→") ? "text-neon" : "text-electric-2")}>
            {numbered ? line.match(/^\d+\./)?.[0] : bullet ? "•" : line[0]}
          </span>
          <span>{inline(line.replace(/^([•\-]|\d+\.|[✓→·])\s+/, ""), `l${i}`)}</span>
        </span>
      );
    }
    return <span key={i} className="block">{inline(line, `l${i}`)}</span>;
  });
}

export function ChatPanel({ context, anonymous = false, remote, projectContext, pendingPrompt, initialMessages, onMessagesChange, className, heightClass = "h-[520px]", showHeader = true }: ChatPanelProps) {
  const reduce = useReducedMotion();
  const first = context?.profile.name.split(" ")[0];
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    initialMessages?.length
      ? initialMessages
      : [
          {
            id: "welcome",
            role: "assistant",
            content: anonymous
              ? "Hi — I can help you make sense of what to learn and build. I don’t know your skills yet, so I’ll never pretend a recommendation is personal until you build your path."
              : `Hey ${first} — I've read your profile. You're **${context?.analysis.readiness}%** of the way to **${context?.analysis.role.name}**. What do you want to figure out?`,
            suggestions: anonymous
              ? ["What information do you need?", "What happens after onboarding?", "How does project matching work?"]
              : ASSISTANT_PROMPTS,
            createdAt: new Date().toISOString(),
          },
        ],
  );
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const changeRef = useRef(onMessagesChange);
  changeRef.current = onMessagesChange;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [messages, thinking, reduce]);

  useEffect(() => {
    if (!streamingId) changeRef.current?.(messages);
  }, [messages, streamingId]);

  const streamIn = useCallback(
    (full: ChatMessage) => {
      if (reduce) {
        setMessages((m) => [...m, full]);
        return;
      }
      const words = full.content.split(" ");
      let i = 0;
      setStreamingId(full.id);
      setMessages((m) => [...m, { ...full, content: "", suggestions: [] }]);
      const tick = () => {
        i += 2;
        const partial = words.slice(0, i).join(" ");
        setMessages((m) => m.map((msg) => (msg.id === full.id ? { ...msg, content: partial } : msg)));
        if (i < words.length) {
          setTimeout(tick, 28);
        } else {
          setMessages((m) => m.map((msg) => (msg.id === full.id ? full : msg)));
          setStreamingId(null);
        }
      };
      setTimeout(tick, 60);
    },
    [reduce],
  );

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || thinking || streamingId) return;
      setError(null);
      setInput("");
      setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", content: message, createdAt: new Date().toISOString() }]);
      setThinking(true);
      const started = Date.now();
      try {
        let reply: ChatMessage;
        if (anonymous || !context) {
          const local = generatePreOnboardingReply(message);
          reply = { id: `a-${Date.now()}`, role: "assistant", content: local.content, suggestions: local.suggestions, createdAt: new Date().toISOString() };
        } else if (projectContext) {
          // Mission pages answer locally so the project context is never lost.
          const local = generateProjectReply(message, context, projectContext);
          reply = { id: `a-${Date.now()}`, role: "assistant", content: local.content, suggestions: local.suggestions, createdAt: new Date().toISOString() };
        } else if (remote) {
          try {
            reply = (await chatService.send(message, context.profile)).message;
          } catch {
            const local = generateAssistantReply(message, context);
            reply = { id: `a-${Date.now()}`, role: "assistant", content: local.content, suggestions: local.suggestions, createdAt: new Date().toISOString() };
          }
        } else {
          const local = generateAssistantReply(message, context);
          reply = { id: `a-${Date.now()}`, role: "assistant", content: local.content, suggestions: local.suggestions, createdAt: new Date().toISOString() };
        }
        // Give the orb a beat to "think" so the interaction feels considered.
        const elapsed = Date.now() - started;
        if (elapsed < 700 && !reduce) await new Promise((r) => setTimeout(r, 700 - elapsed));
        setThinking(false);
        streamIn(reply);
      } catch {
        setThinking(false);
        setError("The assistant is taking a breather. Try again in a moment.");
      }
    },
    [thinking, streamingId, anonymous, remote, context, projectContext, streamIn, reduce],
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  useEffect(() => {
    if (pendingPrompt) void send(pendingPrompt.split("\u0000")[0]);
    // The caller appends a nonce so the same question can be asked again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPrompt]);

  const orbState = thinking ? "thinking" : streamingId ? "speaking" : "idle";
  const last = messages[messages.length - 1];

  return (
    <div className={cn("glass-strong relative flex flex-col overflow-hidden rounded-4xl", heightClass, className)}>
      {showHeader && (
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
          <AIOrb size={36} state={orbState} />
          <div className="min-w-0">
            <p className="font-display text-sm font-bold text-fg">SkillPath Assistant</p>
            <p className="truncate text-xs text-muted">
              {thinking ? "Thinking…" : streamingId ? "Typing…" : anonymous ? "Ready when you are" : `Tuned to ${context?.analysis.role.name ?? "your path"}`}
            </p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-dim">
            <span className={cn("h-1.5 w-1.5 rounded-full", thinking || streamingId ? "bg-neon animate-pulse" : "bg-mint")} />
            {remote ? "synced" : "local"}
          </span>
        </div>
      )}

      <div ref={scrollRef} role="log" aria-live="polite" aria-relevant="additions" className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}
            >
              {m.role === "assistant" && <AIOrb size={26} state={m.id === streamingId ? "speaking" : "idle"} className="mt-1" />}
              <div
                className={cn(
                  "max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-relaxed",
                  m.role === "user"
                    ? "rounded-br-lg bg-gradient-to-br from-electric to-azure text-white shadow-glow-violet"
                    : "rounded-bl-lg border border-white/[0.08] bg-white/[0.04] text-muted",
                )}
              >
                {m.role === "assistant" ? renderRich(m.content) : m.content}
                {m.id === streamingId && <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 bg-neon animate-pulse" />}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {thinking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
            <AIOrb size={26} state="thinking" />
            <div className="flex gap-1 rounded-3xl rounded-bl-lg border border-white/[0.08] bg-white/[0.04] px-4 py-3">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-electric-2"
                  animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {!thinking && !streamingId && last?.role === "assistant" && last.suggestions?.length ? (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-wrap gap-2 pl-9">
            {last.suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void send(s)}
                className="inline-flex items-center gap-1.5 rounded-full border border-electric/30 bg-electric/10 px-3 py-1.5 text-xs font-medium text-electric-2 transition hover:border-electric/60 hover:bg-electric/20 hover:text-white"
              >
                <Sparkles className="h-3 w-3" /> {s}
              </button>
            ))}
          </motion.div>
        ) : null}

        {error && <p role="alert" className="text-xs text-coral">{error}</p>}
      </div>

      <form onSubmit={onSubmit} className="border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-ink/60 py-1.5 pl-5 pr-1.5 transition focus-within:border-electric/50 focus-within:shadow-[0_0_0_4px_rgba(139,92,246,.12)]">
          <label htmlFor={`chat-input-${remote ? "r" : "l"}`} className="sr-only">Ask SkillPath anything</label>
          <input
            id={`chat-input-${remote ? "r" : "l"}`}
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask SkillPath anything…"
            autoComplete="off"
            maxLength={600}
            className="min-w-0 flex-1 bg-transparent text-sm text-fg placeholder:text-dim focus:outline-none"
          />
          <motion.button
            type="submit"
            whileTap={{ scale: 0.9 }}
            disabled={!input.trim() || thinking || !!streamingId}
            aria-label="Send message"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-electric to-azure text-white shadow-glow-violet transition disabled:opacity-40 disabled:shadow-none"
          >
            <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
          </motion.button>
        </div>
      </form>
    </div>
  );
}
