import React, { useState } from "react";
import type { RiskPlanProfile } from "../types/risk";

type SortKey = "p90" | "breach" | "premium" | "cliff" | "cost" | "fragility";

const COLUMNS: { key: SortKey; label: string; align: "left" | "right" }[] = [
  { key: "premium", label: "Net Premium", align: "right" },
  { key: "cliff", label: "Cliff Distance", align: "right" },
  { key: "breach", label: "Breach %", align: "right" },
  { key: "p90", label: "P90 Exposure", align: "right" },
  { key: "fragility", label: "Fragility", align: "right" },
  { key: "cost", label: "Est. Annual", align: "right" },
];

const COLORS = ["#3B82F6", "#6366F1", "#06B6D4", "#10B981", "#8B5CF6"];
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
  glass: string;
  dark: boolean;
}

export default function Compare({ plans, profileKey, glass, dark }: Props) {
  const [sortBy, setSortBy] = useState<SortKey>("p90");
  const [sortDir, setSortDir] = useState<1 | -1>(1);

  const muted = dark ? "text-slate-500" : "text-slate-400";
  const headerBg = dark ? "bg-white/[0.02]" : "bg-black/[0.02]";
  const rowBorder = dark ? "border-white/[0.04]" : "border-black/[0.06]";

  if (!plans.length) return <div className="text-center py-32 opacity-30 text-xl">No risk data loaded.</div>;

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir(d => (d === 1 ? -1 : 1));
    else { setSortBy(key); setSortDir(1); }
  };

  const sorted = [...plans].sort((a, b) => {
    let diff = 0;
    if (sortBy === "p90") diff = a.p90_exposure - b.p90_exposure;
    else if (sortBy === "breach") diff = a.breach_probability - b.breach_probability;
    else if (sortBy === "premium") diff = a.net_premium - b.net_premium;
    else if (sortBy === "cliff") diff = b.distance_to_cliff - a.distance_to_cliff;
    else if (sortBy === "cost") diff = a.expected_annual_total_cost - b.expected_annual_total_cost;
    else diff = a.fragility_slope - b.fragility_slope;
    return diff * sortDir;
  });

  const origOrder = new Map(plans.map((p, i) => [p.plan_id, i]));

  const lowestP90 = [...plans].sort((a, b) => a.p90_exposure - b.p90_exposure)[0]?.plan_id;
  const lowestPremium = [...plans].sort((a, b) => a.net_premium - b.net_premium)[0]?.plan_id;
  const mostStable = [...plans].sort((a, b) => b.distance_to_cliff - a.distance_to_cliff)[0]?.plan_id;

  function Badge({ label, color }: { label: string; color: string }) {
    return (
      <span className="px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap" style={{ background: `${color}18`, color }}>
        {label}
      </span>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">Plan Decision View</h2>
        <p className={`text-base mt-2 ${muted}`}>
          Full comparison across all plans. Click any column header to sort. Choose based on risk tolerance and exposure stability.
        </p>
      </div>

      <div className={`rounded-xl ${glass} overflow-x-auto`}>
        <table className="w-full text-base">
          <thead>
            <tr className={headerBg}>
              <th className={`text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider ${muted}`}>Plan</th>
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className={`px-5 py-4 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors hover:text-blue-400 ${col.align === "right" ? "text-right" : "text-left"} ${sortBy === col.key ? "text-blue-400" : muted}`}
                >
                  {col.label}
                  {sortBy === col.key && (
                    <Icon name={sortDir === 1 ? "arrow_upward" : "arrow_downward"} size="14px" className="ml-1 align-[-2px]" />
                  )}
                </th>
              ))}
              <th className={`text-right px-6 py-4 text-xs font-semibold uppercase tracking-wider ${muted}`}>Badges</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((plan) => {
              const idx = origOrder.get(plan.plan_id) ?? 0;
              return (
                <tr key={plan.plan_id} className={`border-t ${rowBorder} transition-colors ${dark ? "hover:bg-white/[0.02]" : "hover:bg-black/[0.02]"}`}>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[idx] }} />
                      <div>
                        <p className="text-base font-bold">{sn(plan.provider)}</p>
                        <p className={`text-sm ${muted}`}>{plan.metal_tier} · {plan.plan_id}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-5 text-right font-mono font-semibold text-blue-400">${plan.net_premium.toFixed(0)}/mo</td>

                  <td className={`px-5 py-5 text-right font-mono font-semibold ${plan.distance_to_cliff < 1500 ? "text-red-400" : plan.distance_to_cliff < 5000 ? "text-yellow-400" : "text-emerald-400"}`}>
                    ${plan.distance_to_cliff.toLocaleString()}
                    {plan.distance_to_cliff < 1500 && <span className="text-xs ml-1 text-red-400">▲</span>}
                  </td>

                  <td className={`px-5 py-5 text-right font-semibold ${plan.breach_probability > 0.5 ? "text-red-400" : plan.breach_probability > 0.3 ? "text-yellow-400" : "text-emerald-400"}`}>
                    {Math.round(plan.breach_probability * 100)}%
                  </td>

                  <td className="px-5 py-5 text-right font-mono font-semibold">${plan.p90_exposure.toLocaleString()}</td>

                  <td className="px-5 py-5 text-right">
                    <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                      plan.fragility_level === "High" ? "bg-red-500/10 text-red-400"
                      : plan.fragility_level === "Moderate" ? "bg-yellow-500/10 text-yellow-400"
                      : "bg-emerald-500/10 text-emerald-400"
                    }`}>{plan.fragility_level}</span>
                  </td>

                  <td className="px-5 py-5 text-right font-mono font-semibold">${plan.expected_annual_total_cost.toLocaleString()}</td>

                  <td className="px-6 py-5 text-right">
                    <div className="flex flex-wrap gap-2 justify-end">
                      {plan.plan_id === mostStable && <Badge label="Most Stable" color="#10b981" />}
                      {plan.plan_id === lowestP90 && <Badge label="Lowest Tail Risk" color="#3b82f6" />}
                      {plan.plan_id === lowestPremium && <Badge label="Lowest Premium" color="#8b5cf6" />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
