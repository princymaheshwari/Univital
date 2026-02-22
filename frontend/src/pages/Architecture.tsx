import React from "react";
import ArchitectureDiagram from "../components/ArchitectureDiagram";

interface Props { dark: boolean; glass: string; }

export default function Architecture({ dark, glass }: Props) {
  const muted = dark ? "text-slate-500" : "text-slate-400";

  return (
    <div className="space-y-10 animate-in fade-in">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">How UniVital Computes Risk</h2>
        <p className={`text-base mt-2 ${muted}`}>
          Databricks Lakehouse pipeline (Bronze → Silver → Gold) powering the Risk Engine.
        </p>
        <p className={`text-sm mt-2 px-4 py-2.5 rounded-lg inline-block ${dark ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/15" : "bg-yellow-50 text-yellow-700 border border-yellow-200"}`}>
          For demo reliability, Gold outputs are cached in the backend. In production, the API queries Databricks directly.
        </p>
      </div>

      <ArchitectureDiagram dark={dark} glass={glass} />
    </div>
  );
}
