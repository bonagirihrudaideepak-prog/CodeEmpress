"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { marked } from "marked";
import toast from "react-hot-toast";
import {
  Send,
  Bot,
  Sparkles,
  Loader2,
  Trash2,
  FileText,
  Briefcase,
  Map,
  Bug,
  GraduationCap,
  BotMessageSquare,
  ArrowRight,
} from "lucide-react";
import { AppShell } from "@/components/ui/app-shell";

interface Msg {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

const SUGGESTIONS = [
  { icon: Map, label: "Build my learning roadmap", prompt: "Help me build a learning roadmap for a full-stack developer." },
  { icon: FileText, label: "Review my resume", prompt: "What should I improve on my resume?" },
  { icon: Briefcase, label: "Interview me", prompt: "Run a mock interview question for me." },
  { icon: Bug, label: "Debug my code", prompt: "I need help debugging my code." },
];

export default function ChatPage() {
  const router = useRouter();
  const { status, data: session } = useSession();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);
  const [suggestActions, setSuggestActions] = useState<{ label: string; href: string }[]>([]);
  const [actionHints, setActionHints] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/chat");
  }, [status, router]);

  // Load persisted conversation history (PRD Pillar 3 session persistence).
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/chat/history")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.messages?.length) {
          const hist = d.messages
            .filter((m: { role: string }) => m.role === "USER" || m.role === "ASSISTANT")
            .map((m: { role: string; content: string }) => ({ role: m.role === "USER" ? "user" : "assistant", content: m.content }));
          if (messages.length === 0) setMessages(hist.map((h: any) => ({ ...h, streaming: false })));
          setChatHistory(hist.slice(-20));
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Load structured suggestions / actions (PRD Pillar 3).
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/ai/chat/actions")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setSuggestActions(d.actions || []);
          setActionHints(d.suggestions || []);
        }
      })
      .catch(() => {});
  }, [status]);

  // Auto-scroll on new content.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Redirecting…
      </div>
    );
  }

  const name = session?.user?.name?.split(" ")[0] || "Developer";

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || sending) return;

    setInput("");
    const userMsg: Msg = { role: "user", content };
    const assistantMsg: Msg = { role: "assistant", content: "", streaming: true };
    const nextMessages = [...messages, userMsg, assistantMsg];
    setMessages(nextMessages);
    setSending(true);

    const payload = [...chatHistory, { role: "user", content }];

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payload }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const err = await res.text().catch(() => "");
        throw new Error(err || "Chat request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          copy[copy.length - 1] = { ...last, content: acc };
          return copy;
        });
      }

      // Finalize the assistant message and record history.
      setHistory(payload, acc);
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        copy[copy.length - 1] = { role: "assistant", content: acc, streaming: false };
        return copy;
      });
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        toast.error(e?.message || "Something went wrong");
      }
      setMessages((prev) => {
        const copy = [...prev].filter((m) => !(m.streaming));
        if (copy.length && copy[copy.length - 1].role === "user") {
          // keep the user message, drop the broken assistant bubble
        }
        return copy;
      });
    } finally {
      setSending(false);
      abortRef.current = null;
    }
  }

  function setHistory(payload: { role: string; content: string }[], reply: string) {
    setChatHistory([...payload, { role: "assistant", content: reply }]);
  }

  function reset() {
    if (abortRef.current) abortRef.current.abort();
    setMessages([]);
    setChatHistory([]);
    setInput("");
  }

  return (
    <AppShell variant="immersive">
      <div className="flex min-h-0 flex-1 text-white">
      {/* Sidebar (context) */}
      <aside className="hidden md:flex w-72 flex-col border-r border-slate-800 bg-slate-950 max-h-full">
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BotMessageSquare className="h-6 w-6 text-blue-400" />
            <span className="font-bold">AI Mentor</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Context-aware career coach. Personalized to your profile.
          </p>
        </div>

        <div className="p-5 overflow-auto flex-1">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">I can help you with</p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2"><Map className="h-4 w-4 text-blue-400" /> Learning paths & roadmaps</li>
              <li className="flex items-center gap-2"><FileText className="h-4 w-4 text-green-400" /> Resume & portfolio feedback</li>
              <li className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-purple-400" /> Interview preparation</li>
              <li className="flex items-center gap-2"><Bug className="h-4 w-4 text-orange-400" /> Debugging & code review</li>
              <li className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-yellow-400" /> Career strategy</li>
            </ul>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Quick prompts</p>
            <div className="space-y-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => send(s.prompt)}
                  className="w-full text-left px-3 py-2 rounded-lg border border-slate-800 hover:border-slate-600 bg-slate-900/40 text-sm text-slate-300 transition"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-800 text-xs text-slate-500">
          Online · streaming replies
        </div>
      </aside>

      {/* Main chat column */}
      <div className="flex-1 flex flex-col min-w-0 max-h-full">
        {/* top bar */}
        <header className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <span className="font-semibold text-sm">Codempress AI Mentor</span>
            <span className="text-xs text-slate-500">· {name}</span>
          </div>
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-600 transition"
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </button>
        </header>

        {/* messages */}
        <div ref={scrollRef} className="flex-1 overflow-auto px-5 py-6 space-y-5 min-h-0">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
                <Bot className="h-8 w-8 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold mb-2">Hi {name}, how can I help?</h2>
              <p className="text-slate-400 max-w-md mb-6">
                Ask me about learning paths, resume feedback, interview prep, code
                debugging, or career strategy — I know your profile.
              </p>
              <div className="grid sm:grid-cols-2 gap-3 max-w-lg w-full">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => send(s.prompt)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900/50 text-left transition"
                  >
                    <s.icon className="h-5 w-5 text-blue-400 flex-shrink-0" />
                    <span className="text-sm text-slate-300">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                    <Bot className="h-5 w-5 text-blue-400" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-900 border border-slate-800 text-slate-100"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <div className="lesson-md" dangerouslySetInnerHTML={{ __html: marked.parse(m.content) as string }} />
                  ) : (
                    m.content
                  )}
                  {m.streaming && <Loader2 className="h-4 w-4 text-blue-400 animate-spin mt-1" />}
                </div>
              </div>
            ))
          )}

          {/* Suggested actions (structured, context-aware) */}
          {suggestActions.length > 0 && (
            <div className="mt-5 max-w-3xl">
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                <Sparkles className="h-3.5 w-3.5" /> Suggested actions
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestActions.slice(0, 4).map((a) => (
                  <a
                    key={a.href}
                    href={a.href}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-700 hover:border-blue-500/60 hover:bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300 transition"
                  >
                    <ArrowRight className="h-3.5 w-3.5 text-blue-400" /> {a.label}
                  </a>
                ))}
              </div>
              {actionHints.length > 0 && (
                <p className="mt-2 text-xs text-slate-500">💡 {actionHints[0]}</p>
              )}
            </div>
          )}
        </div>

        {/* input */}
        <div className="border-t border-slate-800 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-end gap-3 max-w-3xl mx-auto"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Ask your AI mentor anything…"
              className="flex-1 resize-none bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-3 text-sm outline-none placeholder:text-slate-500 max-h-40"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 transition flex-shrink-0"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
          <p className="text-center text-xs text-slate-600 mt-2">
            Powered by Codempress AI · responses stream in real time
          </p>
        </div>
      </div>
      </div>
    </AppShell>
  );
}
