import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";

/* ─── Node descriptors ─── */

interface NodeDef {
  id: string;
  title: string;
  subtitle: string;
  bullets: string[];
  tooltip: string;
  color: string;
  icon: string;
  lane: "databricks" | "serving";
}

const NODES: NodeDef[] = [
  {
    id: "bronze", title: "Bronze", subtitle: "Raw Ingestion",
    bullets: ["Plan catalog + priors", "Normalization fixes", "Tables: plans, priors, subsidy_params"],
    tooltip: "Raw ingestion + normalization. Stores plan catalog and priors: plans, utilization_priors, cost_priors, er_priors, subsidy_params, users. Fixes encoding artifacts so joins/filters don't break.",
    color: "#CD7F32", icon: "database", lane: "databricks",
  },
  {
    id: "silver", title: "Silver", subtitle: "Policy Math",
    bullets: ["Subsidy-adjusted premium grid", "Fragility slope / curve", "Per plan × county"],
    tooltip: "Deterministic policy math. Computes subsidy-adjusted premiums across an income grid per plan and county. Outputs premium fragility curves + finite-difference slope.",
    color: "#94A3B8", icon: "functions", lane: "databricks",
  },
  {
    id: "gold", title: "Gold", subtitle: "Risk Metrics",
    bullets: ["Cliff proximity + elasticity", "Monte Carlo: breach, OOP, p90", "Shock scenario deltas"],
    tooltip: "Risk indicators per user × plan. Computes cliff proximity + elasticity. Runs Monte Carlo to estimate deductible breach probability, mean OOP, and p90 exposure. Produces scenario deltas for shock tests.",
    color: "#EAB308", icon: "star", lane: "databricks",
  },
  {
    id: "export", title: "Export", subtitle: "Precompute JSON",
    bullets: ["Per demo cohort", "Baseline + scenarios"],
    tooltip: "Precompute for demo stability. Exports plan-level outputs as JSON for 2–3 demo cohorts (baseline + scenarios).",
    color: "#F97316", icon: "download", lane: "databricks",
  },
  {
    id: "store", title: "Risk Store", subtitle: "Cached JSON",
    bullets: ["backend/data/*.json", "profile_lowrisk_fulton.json"],
    tooltip: "Cached JSON served by the backend for reliable demos. In production, the API would query Databricks Gold tables.",
    color: "#8B5CF6", icon: "folder_open", lane: "serving",
  },
  {
    id: "api", title: "Backend API", subtitle: "FastAPI",
    bullets: ["GET /risk/{email}", "POST /shock/{email}"],
    tooltip: "FastAPI service that returns plan fragility profiles. Routes: /risk and /shock.",
    color: "#10B981", icon: "api", lane: "serving",
  },
  {
    id: "frontend", title: "Frontend", subtitle: "UniVital UI",
    bullets: ["5-plan fragility profiles", "Curves + comparisons"],
    tooltip: "Renders side-by-side plan fragility profiles: premium fragility, cliff proximity, breach probability, and tail exposure.",
    color: "#3B82F6", icon: "dashboard", lane: "serving",
  },
  {
    id: "user", title: "Student", subtitle: "User Inputs",
    bullets: ["County, income, meds", "ER visits, therapy freq"],
    tooltip: "Student user inputs: county, income, monthly medication count, expected ER visits/year, therapy sessions/month.",
    color: "#EC4899", icon: "person", lane: "serving",
  },
];

const ARROW_PATHS = [
  { from: "bronze", to: "silver" },
  { from: "silver", to: "gold" },
  { from: "gold", to: "export" },
  { from: "export", to: "store" },
  { from: "store", to: "api" },
  { from: "api", to: "frontend" },
  { from: "user", to: "api" },
];

const PRODUCTION_ARROW = { from: "api", to: "gold" };

/* ─── Animated arrow (SVG) ─── */

function AnimatedArrow({ x1, y1, x2, y2, dark, reducedMotion, highlight, dashed }: {
  x1: number; y1: number; x2: number; y2: number;
  dark: boolean; reducedMotion: boolean; highlight: boolean; dashed: boolean;
}) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len, uy = dy / len;
  const ax1 = x1 + ux * 8, ay1 = y1 + uy * 8;
  const ax2 = x2 - ux * 12, ay2 = y2 - uy * 12;
  const headSize = 8;
  const perpX = -uy * headSize, perpY = ux * headSize;
  const arrowColor = highlight ? "#3B82F6" : dark ? "rgba(148,163,184,0.3)" : "rgba(100,116,139,0.3)";

  return (
    <g>
      <line
        x1={ax1} y1={ay1} x2={ax2} y2={ay2}
        stroke={arrowColor} strokeWidth={highlight ? 2.5 : 1.5}
        strokeDasharray={dashed ? "8 5" : undefined}
        strokeLinecap="round"
      />
      {!reducedMotion && (
        <line
          x1={ax1} y1={ay1} x2={ax2} y2={ay2}
          stroke={highlight ? "#3B82F6" : dark ? "rgba(148,163,184,0.15)" : "rgba(100,116,139,0.15)"}
          strokeWidth={highlight ? 2.5 : 1.5}
          strokeDasharray="4 12"
          strokeLinecap="round"
        >
          <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="1s" repeatCount="indefinite" />
        </line>
      )}
      <polygon
        points={`${ax2},${ay2} ${ax2 - ux * headSize + perpX * 0.5},${ay2 - uy * headSize + perpY * 0.5} ${ax2 - ux * headSize - perpX * 0.5},${ay2 - uy * headSize - perpY * 0.5}`}
        fill={arrowColor}
      />
    </g>
  );
}

/* ─── Glowing packet ─── */

function DataPacket({ path, duration, dark, reducedMotion }: {
  path: { x: number; y: number }[]; duration: number; dark: boolean; reducedMotion: boolean;
}) {
  if (reducedMotion || path.length < 2) return null;
  const xs = path.map(p => p.x);
  const ys = path.map(p => p.y);

  return (
    <motion.circle
      r={5}
      fill="#3B82F6"
      filter="url(#glow)"
      animate={{ cx: xs, cy: ys }}
      transition={{ duration, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
    />
  );
}

/* ─── Node card ─── */

function NodeCard({ node, dark, glass, reducedMotion, onHover }: {
  node: NodeDef; dark: boolean; glass: string; reducedMotion: boolean;
  onHover: (id: string | null) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onMouseEnter={() => { setHovered(true); onHover(node.id); }}
      onMouseLeave={() => { setHovered(false); onHover(null); }}
      className={`relative rounded-xl ${glass} p-4 min-w-[160px] max-w-[200px] cursor-default transition-shadow duration-200`}
      style={{ boxShadow: hovered ? `0 0 24px ${node.color}30` : undefined }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="material-symbols-rounded select-none"
          style={{
            fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
            fontSize: "20px", color: node.color,
          }}
        >{node.icon}</span>
        <div>
          <p className="text-sm font-bold leading-none" style={{ color: node.color }}>{node.title}</p>
          <p className={`text-[11px] mt-0.5 ${dark ? "text-slate-500" : "text-slate-400"}`}>{node.subtitle}</p>
        </div>
      </div>
      <ul className={`space-y-0.5 text-[11px] leading-snug ${dark ? "text-slate-400" : "text-slate-500"}`}>
        {node.bullets.map((b, i) => <li key={i}>· {b}</li>)}
      </ul>

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className={`absolute z-50 left-1/2 -translate-x-1/2 top-full mt-2 w-64 rounded-lg p-3 text-xs leading-relaxed shadow-2xl ${
              dark ? "bg-slate-800 text-slate-200 border border-slate-700" : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            {node.tooltip}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Main diagram ─── */

interface Props { dark: boolean; glass: string; }

export default function ArchitectureDiagram({ dark, glass }: Props) {
  const reducedMotion = useReducedMotion() ?? false;
  const [mode, setMode] = useState<"demo" | "production">("demo");
  const [, setHoveredNode] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});

  const measure = useCallback(() => {
    if (!containerRef.current) return;
    const cr = containerRef.current.getBoundingClientRect();
    const pos: Record<string, { x: number; y: number }> = {};
    for (const [id, el] of Object.entries(nodeRefs.current)) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      pos[id] = { x: r.left - cr.left + r.width / 2, y: r.top - cr.top + r.height / 2 };
    }
    setPositions(pos);
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  useEffect(() => { const t = setTimeout(measure, 100); return () => clearTimeout(t); }, [measure]);

  const setNodeRef = (id: string) => (el: HTMLDivElement | null) => { nodeRefs.current[id] = el; };

  const allMeasured = NODES.every(n => positions[n.id]);

  const muted = dark ? "text-slate-500" : "text-slate-400";

  const demoHighlight = new Set(mode === "demo" ? ["export-store", "store-api"] : []);
  const prodHighlight = new Set(mode === "production" ? ["api-gold"] : []);

  const databricksNodes = NODES.filter(n => n.lane === "databricks");
  const servingNodes = NODES.filter(n => n.lane === "serving");

  const packetPath = (() => {
    const ids = mode === "demo"
      ? ["bronze", "silver", "gold", "export", "store", "api", "frontend"]
      : ["bronze", "silver", "gold", "api", "frontend"];
    return ids.map(id => positions[id]).filter(Boolean);
  })();

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Mode toggle */}
      <div className="flex items-center gap-3 mb-10">
        <span className={`text-sm font-semibold ${muted}`}>View:</span>
        {(["demo", "production"] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              mode === m
                ? "bg-blue-600 text-white"
                : dark ? "text-slate-400 hover:bg-white/5" : "text-slate-500 hover:bg-black/5"
            }`}
          >
            {m === "demo" ? "Demo Mode" : "Production Mode"}
          </button>
        ))}
        <span className={`text-xs ml-2 ${muted} hidden md:inline`}>
          {mode === "demo"
            ? "Cached JSON served from backend"
            : "API queries Databricks Gold tables directly"}
        </span>
      </div>

      {/* Lane: Databricks */}
      <div className={`rounded-xl mb-6 p-6 ${dark ? "bg-white/[0.02] border border-white/[0.04]" : "bg-black/[0.02] border border-black/[0.04]"}`}>
        <p className={`text-xs font-semibold uppercase tracking-wider mb-5 ${muted}`}>
          <span className="material-symbols-rounded select-none align-[-4px] mr-1.5" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400", fontSize: "16px", color: "#EAB308" }}>cloud</span>
          Compute — Databricks Lakehouse
        </p>
        <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
          {databricksNodes.map(n => (
            <div key={n.id} ref={setNodeRef(n.id)}>
              <NodeCard node={n} dark={dark} glass={glass} reducedMotion={reducedMotion} onHover={setHoveredNode} />
            </div>
          ))}
        </div>
      </div>

      {/* Lane: Serving */}
      <div className={`rounded-xl p-6 ${dark ? "bg-white/[0.02] border border-white/[0.04]" : "bg-black/[0.02] border border-black/[0.04]"}`}>
        <p className={`text-xs font-semibold uppercase tracking-wider mb-5 ${muted}`}>
          <span className="material-symbols-rounded select-none align-[-4px] mr-1.5" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400", fontSize: "16px", color: "#10B981" }}>dns</span>
          Serving — Application Stack
        </p>
        <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
          {servingNodes.map(n => (
            <div key={n.id} ref={setNodeRef(n.id)}>
              <NodeCard node={n} dark={dark} glass={glass} reducedMotion={reducedMotion} onHover={setHoveredNode} />
            </div>
          ))}
        </div>
      </div>

      {/* SVG overlay for arrows + packets */}
      {allMeasured && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {ARROW_PATHS.map(({ from, to }) => {
            const a = positions[from], b = positions[to];
            if (!a || !b) return null;
            const key = `${from}-${to}`;
            const highlight = demoHighlight.has(key);
            return (
              <AnimatedArrow
                key={key} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                dark={dark} reducedMotion={reducedMotion} highlight={highlight} dashed={false}
              />
            );
          })}

          {/* Production dotted line */}
          {(() => {
            const a = positions[PRODUCTION_ARROW.from], b = positions[PRODUCTION_ARROW.to];
            if (!a || !b) return null;
            return (
              <g opacity={mode === "production" ? 1 : 0.25}>
                <AnimatedArrow
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  dark={dark} reducedMotion={reducedMotion}
                  highlight={prodHighlight.has("api-gold")} dashed
                />
                <text
                  x={(a.x + b.x) / 2 + 10} y={(a.y + b.y) / 2 - 8}
                  fill={mode === "production" ? "#3B82F6" : dark ? "rgba(148,163,184,0.3)" : "rgba(100,116,139,0.3)"}
                  fontSize={11} fontWeight={600} textAnchor="middle"
                >
                  Production: query Gold directly
                </text>
              </g>
            );
          })()}

          {/* Animated data packet */}
          <DataPacket path={packetPath} duration={6} dark={dark} reducedMotion={reducedMotion} />
        </svg>
      )}
    </div>
  );
}
