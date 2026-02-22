import React from "react";
import type { MappedPlan, Discount } from "../types/plan";
import type { FormData } from "../types/risk";

const COUNTIES = ["Fulton", "DeKalb", "Gwinnett", "Cobb", "Clayton", "Cherokee", "Forsyth", "Hall"];

const DISCOUNTS: Discount[] = [
  { name: "Metformin 500mg", store: "Emory Pharmacy", price: "$2.40", off: "87%" },
  { name: "Sertraline 50mg", store: "CVS Midtown", price: "$4.25", off: "75%" },
  { name: "Adderall XR", store: "GT Stamps", price: "$12.80", off: "84%" },
];

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

const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

interface PlanComparisonTableProps {
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  mappedPlans: MappedPlan[];
  plansLoading: boolean;
  selectedPlan: string | null;
  fetchPlans: (county: string) => void;
  setInsViewDetail: (plan: MappedPlan | null) => void;
  glass: string;
  inputCls: string;
  dark: boolean;
}

export default function PlanComparisonTable({
  form, setForm, mappedPlans, plansLoading, selectedPlan,
  fetchPlans, setInsViewDetail, glass, inputCls, dark,
}: PlanComparisonTableProps) {
  return (
    <div className="space-y-10 animate-in fade-in pb-10">
      {/* County selector to re-fetch plans */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Icon name="location_on" className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500 text-sm" fill={1} size="18px" />
          <select
            className={`w-full pl-10 pr-6 py-3 rounded-full outline-none ${inputCls} font-bold text-sm appearance-none`}
            value={form.county}
            onChange={e => {
              setForm(f => ({...f, county: e.target.value}));
              fetchPlans(e.target.value);
            }}
          >
            {COUNTIES.map(c => (
              <option key={c} value={c}>{c} County</option>
            ))}
          </select>
        </div>
        {plansLoading && <Spinner />}
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4 hide-scrollbar snap-x px-1">
        {mappedPlans.map((ins, i) => (
          <div key={i} onClick={() => setInsViewDetail(ins)} className={`${glass} min-w-[280px] p-8 rounded-[3rem] snap-center active:scale-95 transition-all relative overflow-hidden group`}>
            <div className={`absolute top-0 left-0 w-2 h-full bg-${ins.color}-500 opacity-40`} />
            <div className="flex justify-between items-center mb-4">
              <p className="font-black text-xl tracking-tight leading-none">{ins.name}</p>
              <Icon name="verified" className="text-blue-500" fill={1} />
            </div>
            {ins.metal && (
              <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-6">{ins.metal} Plan</p>
            )}
            <div className="space-y-4">
              <div className="flex justify-between items-center"><span className="text-[10px] opacity-40 font-black uppercase tracking-widest">Compatibility</span><span className="text-2xl font-black text-emerald-400">{ins.compatibility}%</span></div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${ins.compatibility}%` }} /></div>
              {ins.premium && (
                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <span className="text-[10px] opacity-40 font-black uppercase tracking-widest">Premium</span>
                  <span className="text-sm font-black text-blue-400">{ins.premium}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {!plansLoading && mappedPlans.length === 0 && (
          <div className="text-xs opacity-30 italic font-medium py-8 px-4">No plans found for this county.</div>
        )}
      </div>

      <div className="space-y-5">
        <div className="flex justify-between items-center px-4"><h3 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 text-glow">Matched RX</h3><div className="px-4 py-1.5 bg-blue-600 text-[10px] font-black text-white rounded-full uppercase tracking-widest leading-none">{selectedPlan}</div></div>
        <div className="space-y-4">
          {DISCOUNTS.map((d, i) => (
            <div key={i} className={`${glass} p-8 rounded-[3.2rem] flex items-center justify-between active:scale-[0.98] transition-all`}>
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shadow-inner"><Icon name="pill" size="36px" fill={1} /></div>
                <div><p className="font-black text-xl tracking-tight leading-none">{d.name}</p><p className="text-[11px] font-black opacity-30 uppercase tracking-widest mt-2">{d.store}</p></div>
              </div>
              <div className="text-right"><p className="text-2xl font-black text-emerald-400 leading-none">{d.price}</p><div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">{d.off} Saved</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
