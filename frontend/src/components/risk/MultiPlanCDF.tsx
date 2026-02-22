import React, { useMemo } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, ReferenceDot,
} from "recharts";
import type { RiskPlanProfile } from "../../types/risk";

const COLORS = ["#3B82F6", "#6366F1", "#06B6D4", "#10B981", "#8B5CF6"];
const SHORT: Record<string, string> = {
  "Blue Cross Blue Shield": "BCBS", UnitedHealthcare: "UHC", Aetna: "Aetna",
  "Kaiser Permanente": "Kaiser", Ambetter: "Ambetter",
};
function sn(p?: string) { return SHORT[p || ""] || p || "Plan"; }

interface CDFPoint { cost: number; cumulative: number; }

function getCDF(plan: RiskPlanProfile): CDFPoint[] {
  if (plan.annual_cost_samples && plan.annual_cost_samples.length > 0) {
    const sorted = [...plan.annual_cost_samples].sort((a, b) => a - b);
    const n = sorted.length;
    const step = Math.max(1, Math.floor(n / 100));
    const pts: CDFPoint[] = [];
    for (let i = 0; i < n; i += step) pts.push({ cost: sorted[i], cumulative: (i + 1) / n });
    const last = sorted[n - 1];
    if (!pts.length || pts[pts.length - 1].cost !== last) pts.push({ cost: last, cumulative: 1 });
    return pts;
  }
  if (plan.distribution_points?.length) {
    return plan.distribution_points.map(p => ({ cost: p.cost, cumulative: p.cumulative_probability }));
  }
  return [];
}

function interp(pts: CDFPoint[], cost: number): number {
  if (!pts.length) return 0;
  if (cost <= pts[0].cost) return pts[0].cumulative;
  if (cost >= pts[pts.length - 1].cost) return pts[pts.length - 1].cumulative;
  for (let i = 1; i < pts.length; i++) {
    if (cost <= pts[i].cost) {
      const r = pts[i].cost - pts[i - 1].cost;
      if (r === 0) return pts[i].cumulative;
      const t = (cost - pts[i - 1].cost) / r;
      return pts[i - 1].cumulative + t * (pts[i].cumulative - pts[i - 1].cumulative);
    }
  }
  return pts[pts.length - 1].cumulative;
}

interface Props { plans: RiskPlanProfile[]; glass: string; dark: boolean; }

export default function MultiPlanCDF({ plans, glass, dark }: Props) {
  const ax = dark ? "#334155" : "#cbd5e1";
  const tipBg = dark ? "#0f172a" : "#ffffff";
  const tipText = dark ? "#e2e8f0" : "#1e293b";
  const muted = dark ? "text-slate-500" : "text-slate-400";

  const { merged, cdfs, names } = useMemo(() => {
    const cdfs = plans.map(getCDF);
    const names = plans.map(p => sn(p.provider));
    let lo = Infinity, hi = -Infinity;
    for (const c of cdfs) for (const pt of c) { if (pt.cost < lo) lo = pt.cost; if (pt.cost > hi) hi = pt.cost; }
    if (!isFinite(lo)) { lo = 0; hi = 10000; }
    const N = 80, step = (hi - lo) / N;
    const merged: Record<string, number>[] = [];
    for (let i = 0; i <= N; i++) {
      const cost = Math.round(lo + i * step);
      const row: Record<string, number> = { cost };
      plans.forEach((_, j) => { row[names[j]] = Math.round(interp(cdfs[j], cost) * 10000) / 10000; });
      merged.push(row);
    }
    return { merged, cdfs, names };
  }, [plans]);

  const THRESHOLD = 5000;
  const tails = useMemo(() =>
    plans.map((p, i) => ({ name: sn(p.provider), tail: Math.round((1 - interp(cdfs[i], THRESHOLD)) * 100), color: COLORS[i] })),
  [plans, cdfs]);
  const sortedTails = useMemo(() => [...tails].sort((a, b) => a.tail - b.tail), [tails]);
  const best = sortedTails[0];
  const worst = sortedTails[sortedTails.length - 1];

  if (!plans.length || cdfs.every(c => !c.length)) return null;

  const dedMap = new Map<number, { color: string }>();
  plans.forEach((p, i) => { const d = p.deductible ?? 0; if (!dedMap.has(d)) dedMap.set(d, { color: COLORS[i] }); });

  const tipStyle = {
    background: tipBg, color: tipText, border: "none",
    borderRadius: 12, fontSize: 14, boxShadow: "0 12px 40px rgba(0,0,0,0.5)", padding: "12px 16px",
  };

  return (
    <div className={`rounded-xl ${glass} p-6 space-y-6`}>
      <ResponsiveContainer width="100%" height={520}>
        <LineChart data={merged} margin={{ top: 30, right: 25, left: 10, bottom: 30 }}>
          <CartesianGrid strokeDasharray="4 4" stroke={ax} opacity={0.12} />
          <XAxis
            dataKey="cost" type="number" domain={["dataMin", "dataMax"]}
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(v >= 1000 ? 0 : 1)}k`}
            stroke={ax} fontSize={13} tickLine={false}
            label={{ value: "Annual Out-of-Pocket Cost ($)", position: "insideBottom", offset: -18, fontSize: 13, fill: ax }}
          />
          <YAxis
            domain={[0, 1]}
            tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
            stroke={ax} fontSize={13} tickLine={false} width={52}
            label={{ value: "Cumulative Probability", angle: -90, position: "insideLeft", offset: 10, fontSize: 13, fill: ax }}
          />
          <Tooltip
            contentStyle={tipStyle}
            labelFormatter={(v: number) => `Cost: $${Number(v).toLocaleString()}`}
            formatter={(val: number, name: string) => [`${(val * 100).toFixed(1)}%`, name]}
          />
          {[...dedMap.entries()].map(([ded, info], idx) => (
            <ReferenceLine key={`d-${ded}`} x={ded} stroke={info.color} strokeDasharray="6 3" strokeOpacity={0.5} strokeWidth={1.5}
              label={{
                value: `Ded $${ded.toLocaleString()}`,
                position: "insideTopLeft",
                offset: 8 + idx * 18,
                fontSize: 12,
                fill: info.color,
                fontWeight: 600,
              }}
            />
          ))}
          <ReferenceLine y={0.9} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.35}
            label={{ value: "P90", position: "insideRight", offset: 6, fontSize: 12, fill: "#f59e0b", fontWeight: 600 }}
          />
          {names.map((name, i) => (
            <Line key={name} type="monotone" dataKey={name} stroke={COLORS[i]} strokeWidth={3} dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: dark ? "#0f172a" : "#fff" }}
            />
          ))}
          {plans.map((p, i) => (
            <ReferenceDot key={`p90-${p.plan_id}`} x={p.p90_exposure} y={0.9} r={6}
              fill={COLORS[i]} stroke={dark ? "#0f172a" : "#fff"} strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap gap-x-6 gap-y-2 px-2">
        {plans.map((p, i) => (
          <div key={p.plan_id} className="flex items-center gap-2">
            <span className="w-5 h-1 rounded-full" style={{ background: COLORS[i] }} />
            <span className="text-sm font-semibold" style={{ color: COLORS[i] }}>{sn(p.provider)}</span>
            <span className={`text-sm font-mono ${muted}`}>P90 ${p.p90_exposure.toLocaleString()}</span>
          </div>
        ))}
      </div>

      <div className={`rounded-xl px-5 py-4 ${dark ? "bg-white/[0.03]" : "bg-black/[0.03]"}`}>
        <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${muted}`}>
          Tail Risk Dominance · ${THRESHOLD.toLocaleString()} threshold
        </p>
        <p className="text-base leading-relaxed opacity-80">
          <strong style={{ color: best.color }}>{best.name}</strong> has the thinnest right
          tail — only <strong>{best.tail}%</strong> probability above ${THRESHOLD.toLocaleString()},
          vs <strong>{worst.tail}%</strong> for <strong style={{ color: worst.color }}>{worst.name}</strong>.
        </p>
        <div className="flex gap-3 flex-wrap mt-3">
          {sortedTails.map(tp => (
            <span key={tp.name} className="px-3 py-1 rounded-lg text-xs font-semibold"
              style={{ background: `${tp.color}15`, color: tp.color }}>
              {tp.name}: {tp.tail}%
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
