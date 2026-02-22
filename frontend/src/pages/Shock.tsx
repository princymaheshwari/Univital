import React, { useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell, ReferenceLine,
} from "recharts";
import type { ShockPlanDelta, RiskPlanProfile } from "../types/risk";

const SCENARIOS = [
  { id: "income_plus_10pct", label: "+10% Income", icon: "trending_up", desc: "10% increase in annual income" },
  { id: "add_chronic_med", label: "Add Chronic Med", icon: "medication", desc: "One chronic medication added" },
  { id: "two_er_visits", label: "2 ER Visits", icon: "local_hospital", desc: "Two emergency room visits" },
  { id: "subsidy_expiration", label: "Subsidy Expiration", icon: "warning", desc: "2026 ACA enhanced subsidy cliff" },
];

const SHORT: Record<string, string> = {
  "Blue Cross Blue Shield": "BCBS", UnitedHealthcare: "UHC", Aetna: "Aetna",
  "Kaiser Permanente": "Kaiser", Ambetter: "Ambetter",
};
function sn(p?: string) { return SHORT[p || ""] || p || "Plan"; }

const Icon = ({ name, className = "", fill = 0, size = "24px" }: { name: string; className?: string; fill?: number; size?: string }) => (
  <span className={`material-symbols-rounded select-none ${className}`} style={{ fontVariationSettings: `'FILL' ${fill}, 'wght' 400, 'GRAD' 0, 'opsz' 24`, fontSize: size, display: "inline-block" }}>{name}</span>
);

interface Props {
  plans: RiskPlanProfile[];
  profileKey: string | null;
  onRunShock: (scenario: string) => Promise<ShockPlanDelta[]>;
  glass: string;
  dark: boolean;
}

export default function Shock({ plans, profileKey, onRunShock, glass, dark }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const [data, setData] = useState<ShockPlanDelta[]>([]);
  const [loading, setLoading] = useState(false);

  const ax = dark ? "#334155" : "#cbd5e1";
  const tipBg = dark ? "#0f172a" : "#ffffff";
  const tipText = dark ? "#e2e8f0" : "#1e293b";
  const muted = dark ? "text-slate-500" : "text-slate-400";

  const run = async (id: string) => {
    setActive(id); setLoading(true);
    try { setData(await onRunShock(id)); } catch { setData([]); }
    finally { setLoading(false); }
  };

  const tipStyle = {
    background: tipBg, color: tipText, border: "none",
    borderRadius: 12, fontSize: 14, boxShadow: "0 12px 40px rgba(0,0,0,0.5)", padding: "12px 16px",
  };

  if (!plans.length) return <div className="text-center py-32 opacity-30 text-xl">No risk data loaded.</div>;

  const costDeltas = data.map(d => ({ name: sn(d.provider), delta: d.delta_expected_annual_total_cost, fill: d.delta_expected_annual_total_cost > 0 ? "#ef4444" : "#10b981" }));
  const breachDeltas = data.map(d => ({ name: sn(d.provider), delta: Math.round(d.delta_breach_probability * 10000) / 100, fill: d.delta_breach_probability > 0 ? "#ef4444" : "#10b981" }));
  const premDeltas = data.map(d => ({ name: sn(d.provider), delta: d.delta_net_premium_monthly, fill: d.delta_net_premium_monthly > 0 ? "#ef4444" : "#10b981" }));
  const p90Deltas = data.map(d => ({ name: sn(d.provider), delta: d.delta_p90_exposure, fill: d.delta_p90_exposure > 0 ? "#ef4444" : "#10b981" }));

  function DeltaChart({ title, unit, chartData, fmtVal }: { title: string; unit: string; chartData: typeof costDeltas; fmtVal: (v: number) => string }) {
    return (
      <div className={`rounded-xl ${glass} p-6`}>
        <p className={`text-sm font-semibold uppercase tracking-wider mb-4 ${muted}`}>{title}</p>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="4 4" stroke={ax} opacity={0.12} />
            <XAxis dataKey="name" stroke={ax} fontSize={14} tickLine={false} />
            <YAxis tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${fmtVal(v)}`} stroke={ax} fontSize={13} tickLine={false} width={70} />
            <Tooltip contentStyle={tipStyle} formatter={(val: number) => [`${val > 0 ? "+" : ""}${fmtVal(val)}`, `${title} Δ`]} />
            <ReferenceLine y={0} stroke={ax} strokeOpacity={0.4} />
            <Bar dataKey="delta" radius={[6, 6, 0, 0]} maxBarSize={56}>
              {chartData.map((d, i) => <Cell key={i} fill={d.fill} fillOpacity={0.85} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="space-y-14 animate-in fade-in">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">Shock Test Scenarios</h2>
        <p className={`text-base mt-2 ${muted}`}>
          Toggle a scenario to see how each plan's cost structure responds to financial or medical shocks.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {SCENARIOS.map(s => (
          <button
            key={s.id}
            onClick={() => run(s.id)}
            disabled={loading}
            className={`${glass} rounded-xl px-6 py-5 text-left transition-all active:scale-[0.97] ${active === s.id ? "ring-2 ring-blue-500 ring-offset-1 ring-offset-transparent" : ""}`}
          >
            <Icon name={s.icon} className={active === s.id ? "text-blue-500" : "opacity-40"} fill={1} size="32px" />
            <p className="text-base font-bold mt-3">{s.label}</p>
            <p className={`text-sm mt-1 ${muted}`}>{s.desc}</p>
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 gap-3">
          <svg className="animate-spin h-7 w-7 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className={`text-base font-semibold ${muted}`}>Running scenario…</span>
        </div>
      )}

      {!loading && data.length > 0 && active && (
        <>
          <div className="flex items-center gap-3">
            <span className="px-4 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm font-bold text-yellow-400 uppercase tracking-wider">
              {SCENARIOS.find(s => s.id === active)?.label}
            </span>
            <span className={`text-sm ${muted}`}>Delta from baseline</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <DeltaChart title="Expected Annual Cost Change" unit="$" chartData={costDeltas} fmtVal={v => `$${Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
            <DeltaChart title="Breach Probability Change" unit="pp" chartData={breachDeltas} fmtVal={v => `${v.toFixed(1)}pp`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <DeltaChart title="Monthly Premium Change" unit="$/mo" chartData={premDeltas} fmtVal={v => `$${Math.abs(v).toFixed(0)}/mo`} />
            <DeltaChart title="P90 Exposure Change" unit="$" chartData={p90Deltas} fmtVal={v => `$${Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
          </div>
        </>
      )}
    </div>
  );
}
