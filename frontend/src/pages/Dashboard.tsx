import React from "react";
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";
import type { RiskPlanProfile } from "../types/risk";
import MultiPlanCDF from "../components/risk/MultiPlanCDF";

const COLORS = ["#3B82F6", "#6366F1", "#06B6D4", "#10B981", "#8B5CF6"];
const SHORT: Record<string, string> = {
  "Blue Cross Blue Shield": "BCBS", UnitedHealthcare: "UHC", Aetna: "Aetna",
  "Kaiser Permanente": "Kaiser", Ambetter: "Ambetter",
};
function sn(p?: string) { return SHORT[p || ""] || p || "Plan"; }

interface Props {
  plans: RiskPlanProfile[];
  profileKey: string | null;
  annualIncome?: number;
  glass: string;
  dark: boolean;
}

export default function Dashboard({ plans, profileKey, annualIncome, glass, dark }: Props) {
  if (!plans.length) return <div className="text-center py-32 opacity-30 text-xl">No risk data loaded. Complete onboarding to begin.</div>;

  const ax = dark ? "#334155" : "#cbd5e1";
  const tipBg = dark ? "#0f172a" : "#ffffff";
  const tipText = dark ? "#e2e8f0" : "#1e293b";
  const muted = dark ? "text-slate-500" : "text-slate-400";
  const sectionBorder = dark ? "border-white/[0.04]" : "border-black/[0.06]";

  const incomePoints = plans[0]?.premium_fragility_curve?.map(p => p.income) || [];
  const curveData = incomePoints.map(inc => {
    const row: Record<string, number> = { income: inc };
    plans.forEach((plan, i) => {
      const pt = plan.premium_fragility_curve?.find(c => c.income === inc);
      row[`plan_${i}`] = pt?.net_premium ?? 0;
    });
    return row;
  });

  const tipStyle = {
    background: tipBg, color: tipText, border: "none",
    borderRadius: 10, fontSize: 14, boxShadow: "0 12px 40px rgba(0,0,0,0.5)", padding: "12px 16px",
  };

  const maxCliff = Math.max(...plans.map(p => p.distance_to_cliff));

  return (
    <div className="space-y-20">

      {/* ── Premium Sensitivity Across Income ── */}
      <section>
        <h2 className="text-3xl font-extrabold tracking-tight">Premium Sensitivity Across Income</h2>
        <p className={`text-base mt-2 ${muted}`}>
          Net monthly premium vs. annual income for all plans. Steep slopes flag subsidy discontinuities.
        </p>

        <div className={`mt-8 rounded-xl ${glass} p-6`}>
          <ResponsiveContainer width="100%" height={520}>
            <LineChart data={curveData} margin={{ top: 20, right: 30, left: 15, bottom: 15 }}>
              <CartesianGrid strokeDasharray="4 4" stroke={ax} opacity={0.12} />
              <XAxis
                dataKey="income" type="number" domain={["dataMin", "dataMax"]}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                stroke={ax} fontSize={14} tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => `$${v}`}
                stroke={ax} fontSize={14} tickLine={false} width={55}
              />
              <Tooltip
                contentStyle={tipStyle}
                labelFormatter={(v: number) => `Income: $${Number(v).toLocaleString()}`}
                formatter={(val: number, name: string) => {
                  const idx = parseInt(name.split("_")[1]);
                  const plan = plans[idx];
                  return [`$${val.toFixed(0)}/mo`, sn(plan?.provider)];
                }}
              />
              {annualIncome && (
                <ReferenceLine
                  x={annualIncome} stroke="#f59e0b" strokeDasharray="6 3" strokeWidth={2}
                  label={{ value: "Your Income", position: "top", fill: "#f59e0b", fontSize: 13, fontWeight: 600 }}
                />
              )}
              {plans.map((plan, i) => (
                <Line
                  key={plan.plan_id} type="monotone" dataKey={`plan_${i}`}
                  stroke={COLORS[i]} strokeWidth={3} dot={false}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: dark ? "#0f172a" : "#fff" }}
                  name={`plan_${i}`}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>

          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-5 px-2">
            {plans.map((p, i) => (
              <div key={p.plan_id} className="flex items-center gap-2.5">
                <span className="w-4 h-1 rounded-full" style={{ background: COLORS[i] }} />
                <span className="text-sm font-semibold" style={{ color: COLORS[i] }}>{sn(p.provider)}</span>
                <span className={`text-sm ${muted} font-mono`}>slope {p.fragility_slope.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Annual Cost Risk Distribution ── */}
      <section className={`border-t pt-20 ${sectionBorder}`}>
        <h2 className="text-3xl font-extrabold tracking-tight">Annual Cost Risk Distribution</h2>
        <p className={`text-base mt-2 ${muted}`}>
          Monte Carlo–derived cumulative distributions. Steeper curves = lower financial risk; heavy right tails = danger.
        </p>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          <MultiPlanCDF plans={plans} glass={glass} dark={dark} />

          <div className={`rounded-xl ${glass} p-6 self-start`}>
            <p className={`text-sm font-semibold uppercase tracking-wider mb-5 ${muted}`}>Risk Metrics by Plan</p>
            <div className="space-y-0">
              {plans.map((p, i) => (
                <div key={p.plan_id} className={`flex items-center gap-4 py-4 ${i > 0 ? `border-t ${sectionBorder}` : ""}`}>
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold truncate">{sn(p.provider)}</p>
                    <p className={`text-sm ${muted}`}>{p.metal_tier}</p>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <p className={`text-base font-bold ${p.breach_probability > 0.5 ? "text-red-400" : p.breach_probability > 0.3 ? "text-yellow-400" : "text-emerald-400"}`}>
                      {Math.round(p.breach_probability * 100)}% breach
                    </p>
                    <p className={`text-sm ${muted}`}>${p.mean_oop.toLocaleString(undefined, { maximumFractionDigits: 0 })} avg</p>
                    <p className={`text-sm font-mono ${muted}`}>P90 ${p.p90_exposure.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Subsidy Risk Distance ── */}
      <section className={`border-t pt-20 ${sectionBorder}`}>
        <h2 className="text-3xl font-extrabold tracking-tight">Subsidy Risk Distance</h2>
        <p className={`text-base mt-2 ${muted}`}>
          Each plan's buffer to the nearest subsidy cliff. Shorter bars indicate higher sensitivity to income changes.
        </p>

        <div className="mt-8 space-y-4">
          {plans.map((p, i) => {
            const pct = maxCliff > 0 ? (p.distance_to_cliff / maxCliff) * 100 : 0;
            const isCliffProne = p.distance_to_cliff < 1500;
            return (
              <div key={p.plan_id} className={`rounded-xl ${glass} px-6 py-5 flex items-center gap-5`}>
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i] }} />
                <div className="w-32 shrink-0">
                  <p className="text-base font-bold">{sn(p.provider)}</p>
                  <p className={`text-sm ${muted}`}>{p.metal_tier}</p>
                </div>

                <div className="flex-1 relative h-8">
                  <div className={`absolute inset-0 rounded-lg ${dark ? "bg-white/[0.04]" : "bg-black/[0.04]"}`} />
                  <div
                    className="absolute inset-y-0 left-0 rounded-lg transition-all duration-700"
                    style={{
                      width: `${Math.max(pct, 3)}%`,
                      background: isCliffProne
                        ? "linear-gradient(90deg, #ef4444, #f87171)"
                        : `linear-gradient(90deg, ${COLORS[i]}90, ${COLORS[i]}40)`,
                    }}
                  />
                  <span className="absolute inset-y-0 left-4 flex items-center text-sm font-bold text-white drop-shadow-md">
                    ${p.distance_to_cliff.toLocaleString()}
                  </span>
                </div>

                {isCliffProne && (
                  <span className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-sm font-bold shrink-0">
                    CLIFF-PRONE
                  </span>
                )}

                <div className="w-24 text-right shrink-0">
                  <p className="text-base font-mono font-bold">{p.elasticity_ratio.toFixed(1)}x</p>
                  <p className={`text-xs ${muted}`}>elasticity</p>
                </div>

                <div className="w-40 text-right shrink-0">
                  <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                    p.stability_classification === "Cliff-Prone" ? "bg-red-500/10 text-red-400"
                    : p.stability_classification === "Moderately Sensitive" ? "bg-yellow-500/10 text-yellow-400"
                    : "bg-emerald-500/10 text-emerald-400"
                  }`}>{p.stability_classification}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
