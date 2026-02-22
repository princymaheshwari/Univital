import React from "react";
import type { RiskPlanProfile } from "../types/risk";

const LOGO_URL = "https://files.oaiusercontent.com/file-K1XNq9f4C4U7jB5L1Z8p3d";

const SHORT: Record<string, string> = {
  "Blue Cross Blue Shield": "BCBS", UnitedHealthcare: "UHC", Aetna: "Aetna",
  "Kaiser Permanente": "Kaiser", Ambetter: "Ambetter",
};
function sn(p?: string) { return SHORT[p || ""] || p || "—"; }

type Page = "dashboard" | "shock" | "compare";

const Icon = ({ name, className = "", fill = 0, size = "24px" }: { name: string; className?: string; fill?: number; size?: string }) => (
  <span className={`material-symbols-rounded select-none ${className}`} style={{ fontVariationSettings: `'FILL' ${fill}, 'wght' 400, 'GRAD' 0, 'opsz' 24`, fontSize: size, display: "inline-block" }}>{name}</span>
);

interface Props {
  activePage: Page;
  setActivePage: (p: Page) => void;
  dark: boolean;
  glass: string;
  toggleTheme: () => void;
  onLogout: () => void;
  plans: RiskPlanProfile[];
  profileKey: string | null;
  county?: string;
  annualIncome?: number;
  children: React.ReactNode;
}

export default function MainLayout({
  activePage, setActivePage, dark, glass, toggleTheme, onLogout,
  plans, profileKey, county, annualIncome, children,
}: Props) {
  const lowestP90 = plans.length ? plans.reduce((a, b) => a.p90_exposure < b.p90_exposure ? a : b) : null;
  const highestTail = plans.length ? plans.reduce((a, b) => a.p90_exposure > b.p90_exposure ? a : b) : null;
  const stableLeader = plans.length ? plans.reduce((a, b) => a.distance_to_cliff > b.distance_to_cliff ? a : b) : null;

  const NAV: { id: Page; label: string; icon: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: "analytics" },
    { id: "shock", label: "Shock Tests", icon: "bolt" },
    { id: "compare", label: "Compare", icon: "compare_arrows" },
  ];

  const borderB = dark ? "border-white/[0.06]" : "border-black/[0.06]";

  return (
    <div className={`min-h-screen ${dark ? "bg-[#09090b] text-slate-100" : "bg-[#f4f4f5] text-slate-900"} font-sans selection:bg-blue-500/30`}>

      <header className={`sticky top-0 z-50 backdrop-blur-2xl border-b ${borderB} ${dark ? "bg-[#09090b]/80" : "bg-white/80"}`}>
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between px-8 lg:px-12 h-16">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="UniVital" className="w-8 h-8 object-contain" />
            <span className="text-xl font-extrabold tracking-tight text-blue-500">UniVital</span>
          </div>

          <nav className="flex items-center gap-1">
            {NAV.map(t => (
              <button
                key={t.id}
                onClick={() => setActivePage(t.id)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold tracking-wide transition-colors ${
                  activePage === t.id
                    ? "bg-blue-600 text-white"
                    : dark ? "text-slate-400 hover:text-slate-200 hover:bg-white/5" : "text-slate-500 hover:text-slate-800 hover:bg-black/5"
                }`}
              >
                <Icon name={t.icon} size="18px" fill={activePage === t.id ? 1 : 0} className="mr-2 align-[-3px]" />
                {t.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className={`w-10 h-10 rounded-lg flex items-center justify-center transition ${dark ? "hover:bg-white/5" : "hover:bg-black/5"}`}>
              <Icon name={dark ? "light_mode" : "dark_mode"} size="20px" fill={1} className={dark ? "text-slate-400" : "text-slate-500"} />
            </button>
            <button onClick={onLogout} className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition" title="Log out">
              <Icon name="logout" size="18px" fill={1} className="text-red-400" />
            </button>
          </div>
        </div>
      </header>

      {plans.length > 0 && (
        <section className={`border-b ${borderB} ${dark ? "bg-[#0c0c0f]" : "bg-white/60"}`}>
          <div className="max-w-screen-2xl mx-auto px-8 lg:px-12 py-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
            <Tile label="County" value={county || "—"} dark={dark} />
            <Tile label="Annual Income" value={annualIncome ? `$${annualIncome.toLocaleString()}` : "—"} dark={dark} />
            {lowestP90 && <Tile label="Lowest Tail Risk" value={sn(lowestP90.provider)} sub={`P90 $${lowestP90.p90_exposure.toLocaleString()}`} dark={dark} color="#10b981" />}
            {highestTail && <Tile label="Highest Tail Risk" value={sn(highestTail.provider)} sub={`P90 $${highestTail.p90_exposure.toLocaleString()}`} dark={dark} color="#ef4444" />}
            {stableLeader && <Tile label="Stability Leader" value={sn(stableLeader.provider)} sub={`Cliff $${stableLeader.distance_to_cliff.toLocaleString()}`} dark={dark} color="#3b82f6" />}
          </div>
        </section>
      )}

      <main className="max-w-screen-2xl mx-auto px-8 lg:px-12 py-12">
        {children}
      </main>
    </div>
  );
}

function Tile({ label, value, sub, dark, accent, color }: {
  label: string; value: string; sub?: string; dark: boolean; accent?: boolean; color?: string;
}) {
  return (
    <div className={`rounded-xl px-5 py-4 ${dark ? "bg-white/[0.03] border border-white/[0.06]" : "bg-black/[0.02] border border-black/[0.06]"}`}>
      <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? "text-slate-500" : "text-slate-400"}`}>{label}</p>
      <p className={`text-2xl font-bold mt-1 tracking-tight ${accent ? "text-blue-400" : ""}`} style={color ? { color } : undefined}>
        {value}
      </p>
      {sub && <p className={`text-sm mt-1 ${dark ? "text-slate-500" : "text-slate-400"}`}>{sub}</p>}
    </div>
  );
}
