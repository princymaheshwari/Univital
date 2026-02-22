import React, { useState, useRef, useEffect } from "react";
import { api } from "../api/client";

const TIERS = ["Silver", "Gold", "Expanded Bronze"];

const Icon = ({ name, className = "", fill = 0, size = "24px" }: { name: string; className?: string; fill?: number; size?: string }) => (
  <span className={`material-symbols-rounded select-none ${className}`} style={{ fontVariationSettings: `'FILL' ${fill}, 'wght' 400, 'GRAD' 0, 'opsz' 24`, fontSize: size, display: "inline-block" }}>{name}</span>
);

interface Message { role: "user" | "assistant"; content: string; }

interface Props { dark: boolean; glass: string; }

export default function Chat({ dark, glass }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm UniVital's Health Plan Navigator. Ask me anything about health insurance plans — coverage, copays, premiums, or recommendations for students." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tierFilter, setTierFilter] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const toggleTier = (t: string) => {
    setTierFilter(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const send = async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const res = await api.chat(msg, tierFilter.length ? tierFilter : undefined);
      setMessages(prev => [...prev, { role: "assistant", content: res.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${e instanceof Error ? e.message : "Something went wrong"}` }]);
    } finally {
      setLoading(false);
    }
  };

  const muted = dark ? "text-slate-500" : "text-slate-400";
  const bubbleUser = "bg-blue-600 text-white";
  const bubbleAI = dark ? "bg-white/[0.04] border border-white/[0.06] text-slate-200" : "bg-black/[0.03] border border-black/[0.06] text-slate-800";
  const inputBg = dark
    ? "bg-white/[0.04] border border-white/[0.08] text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/50"
    : "bg-black/[0.03] border border-black/[0.08] text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/50";

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[500px] animate-in fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Plan Navigator AI</h2>
          <p className={`text-base mt-1 ${muted}`}>
            Powered by Gemini 2.5 Flash + Actian VectorAI DB semantic search
          </p>
        </div>
      </div>

      {/* Tier filter pills */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`text-sm font-semibold ${muted}`}>Filter:</span>
        {TIERS.map(t => (
          <button
            key={t}
            onClick={() => toggleTier(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              tierFilter.includes(t)
                ? "bg-blue-600 text-white"
                : dark ? "text-slate-400 hover:bg-white/5 border border-white/[0.06]" : "text-slate-500 hover:bg-black/5 border border-black/[0.06]"
            }`}
          >
            {t}
          </button>
        ))}
        {tierFilter.length > 0 && (
          <button onClick={() => setTierFilter([])} className={`text-xs ${muted} hover:text-blue-400 ml-1`}>Clear</button>
        )}
      </div>

      {/* Messages area */}
      <div className={`flex-1 overflow-y-auto rounded-xl ${glass} p-6 space-y-4 mb-4`}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex items-start gap-3 max-w-[80%] ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                m.role === "user"
                  ? "bg-blue-600 text-white"
                  : dark ? "bg-white/[0.06] text-blue-400" : "bg-black/[0.04] text-blue-600"
              }`}>
                <Icon name={m.role === "user" ? "person" : "smart_toy"} size="18px" fill={1} />
              </div>
              <div className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed whitespace-pre-wrap ${m.role === "user" ? bubbleUser : bubbleAI}`}>
                {m.content}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${dark ? "bg-white/[0.06] text-blue-400" : "bg-black/[0.04] text-blue-600"}`}>
                <Icon name="smart_toy" size="18px" fill={1} />
              </div>
              <div className={`rounded-2xl px-5 py-3.5 ${bubbleAI}`}>
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className={`text-sm ${muted}`}>Searching plans...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-3">
        <input
          className={`flex-1 px-5 py-4 rounded-xl outline-none text-base font-medium ${inputBg}`}
          placeholder="Ask about plans (e.g., 'Cheapest Silver plan for a student')"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center active:scale-95 transition-all disabled:opacity-40"
        >
          <Icon name="send" size="20px" fill={1} />
        </button>
      </div>
    </div>
  );
}
