import React from "react";
import type { Message } from "../types/policy";

const Icon = ({ name, className = "", fill = 0, size = "24px" }: { name: string; className?: string; fill?: number; size?: string }) => (
  <span
    className={`material-symbols-rounded select-none ${className}`}
    style={{
      fontVariationSettings: `'FILL' ${fill}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
      fontSize: size,
      display: "inline-block",
    }}
  >
    {name}
  </span>
);

interface PolicyClauseCardProps {
  messages: Message[];
  glass: string;
  inputCls: string;
  dark: boolean;
}

export default function PolicyClauseCard({ messages, glass, inputCls, dark }: PolicyClauseCardProps) {
  return (
    <div className="flex flex-col animate-in fade-in" style={{height: "calc(100vh - 280px)"}}>
      <div className={`${glass} p-6 rounded-[2.5rem] mb-6 flex items-center gap-5 shadow-2xl`}>
        <div className="w-16 h-16 rounded-[1.8rem] bg-violet-600/20 flex items-center justify-center text-violet-400"><Icon name="auto_awesome" size="36px" fill={1} /></div>
        <div><p className="text-2xl font-black tracking-tighter leading-none">Vital AI</p><p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] mt-1">Rule Inference Active</p></div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-6 mb-6 hide-scrollbar px-2">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[88%] p-7 rounded-[2.5rem] text-[15px] font-medium leading-relaxed ${m.role === "user" ? "bg-blue-600 text-white rounded-br-none shadow-2xl" : glass + " rounded-bl-none"}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div className="relative">
        <input className={`w-full py-6 pl-8 pr-20 rounded-full outline-none transition-all ${inputCls} font-bold shadow-inner`} placeholder="Ask coverage rules..." />
        <button className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"><Icon name="arrow_upward" className="font-black" /></button>
      </div>
    </div>
  );
}
