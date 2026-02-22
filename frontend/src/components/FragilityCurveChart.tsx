import React from "react";
import type { Medication } from "../types/risk";

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

interface FragilityCurveChartProps {
  meds: Medication[];
  toggleMedication: (index: number) => void;
  glass: string;
  dark: boolean;
}

export default function FragilityCurveChart({ meds, toggleMedication, glass, dark }: FragilityCurveChartProps) {
  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className={`${glass} p-10 rounded-[3.5rem] relative overflow-hidden group shadow-2xl`}>
        <div className="flex flex-col items-center space-y-8">
          <div className="relative w-52 h-52 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="104" cy="104" r="92" className="stroke-white/5 fill-none" strokeWidth="12" />
              <circle cx="104" cy="104" r="92" className="stroke-blue-600 fill-none" strokeWidth="12" strokeDasharray="578" strokeDashoffset="144" strokeLinecap="round" />
            </svg>
            <div className="text-center space-y-1">
              <p className="text-[10px] font-black opacity-30 uppercase tracking-widest text-glow">Fragility</p>
              <p className="text-6xl font-black">75%</p>
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">Exposure Peak</p>
            </div>
          </div>
          <div className="grid grid-cols-2 w-full gap-8 border-t border-white/5 pt-8">
            <div className="text-center"><p className="text-[10px] opacity-30 font-black uppercase mb-1 tracking-widest">Cliff Gap</p><p className="text-xl font-black text-blue-500">$1,350</p></div>
            <div className="text-center border-l border-white/5"><p className="text-[10px] opacity-30 font-black uppercase mb-1 tracking-widest">Breach</p><p className="text-xl font-black text-emerald-500">28%</p></div>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="text-[11px] font-black uppercase tracking-[0.4em] opacity-30 px-2">Health Log</h3>
        {meds.map((m, i) => (
          <div
            key={i}
            onClick={() => toggleMedication(i)}
            className={`${glass} p-7 rounded-[2.8rem] flex items-center justify-between active:scale-[0.98] transition-all group cursor-pointer`}
          >
            <div className="flex items-center gap-5">
              <div className={`w-14 h-14 rounded-2xl bg-${m.color}-500/10 flex items-center justify-center text-${m.color}-500 shadow-inner group-hover:scale-105 transition-transform`}>
                <Icon name={m.icon} size="32px" fill={1} />
              </div>
              <div><p className="text-xl font-black tracking-tight leading-none">{m.name}</p><p className="text-[11px] font-black opacity-30 uppercase mt-2 tracking-widest">{m.time} · {m.dose}</p></div>
            </div>
            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${m.taken ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'border-white/10'}`}>
              {m.taken && <Icon name="check" size="18px" className="font-black" />}
            </div>
          </div>
        ))}
        {meds.length === 0 && <p className="text-center py-8 text-xs opacity-30 italic font-medium">No compounds tracked.</p>}
      </div>
    </div>
  );
}
