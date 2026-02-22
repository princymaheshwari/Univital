import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { api } from "./api/client";
import type { MappedPlan, PlanResponse } from "./types/plan";
import type { FormData, Medication } from "./types/risk";
import type { Message } from "./types/policy";
import InputsForm from "./components/InputsForm";
import FragilityCurveChart from "./components/FragilityCurveChart";
import PlanComparisonTable from "./components/PlanComparisonTable";
import PolicyClauseCard from "./components/PolicyClauseCard";

const LOGO_URL = "https://files.oaiusercontent.com/file-K1XNq9f4C4U7jB5L1Z8p3d";
const COUNTIES = ["Fulton", "DeKalb", "Gwinnett", "Cobb", "Clayton", "Cherokee", "Forsyth", "Hall"];

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

const INSURERS_FALLBACK: MappedPlan[] = [
  { name: "UnitedHealthcare", compatibility: 88, savings: "$420", color: "blue", risk: "Medium", details: "Matches 100% of profile." },
  { name: "Aetna", compatibility: 74, savings: "$310", color: "indigo", risk: "High", details: "Requires some prior auths." },
  { name: "BCBS", compatibility: 91, savings: "$580", color: "cyan", risk: "Low", details: "Excellent GA coverage." },
];

export default function App() {
  const [theme, setTheme] = useState("dark");
  const [step, setStep] = useState(1);
  const [activeTab, setActiveTab] = useState("home");
  const [profileSubView, setProfileSubView] = useState("default");

  const [hasIns, setHasIns] = useState<boolean | null>(null);
  const [form, setForm] = useState<FormData>({
    name: "Jordan Davis",
    email: "jordan.d@gatech.edu",
    password: "",
    school: "Georgia Tech",
    major: "Health Informatics",
    year: "Senior",
    income: "24500",
    status: "Domestic Student",
    sex: "Male",
    age: "22",
    height: "5'11\"",
    weight: "175 lbs",
    county: "Fulton",
  });

  const [meds, setMeds] = useState<Medication[]>([
    { name: "Metformin", dose: "500mg", time: "08:00", taken: true, icon: "pill", color: "blue" },
    { name: "Sertraline", dose: "50mg", time: "20:00", taken: false, icon: "psychology", color: "indigo" },
  ]);

  const [newMed, setNewMed] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string | null>("UnitedHealthcare");
  const [insViewDetail, setInsViewDetail] = useState<MappedPlan | null>(null);
  const [messages, setMessages] = useState<Message[]>([{ role: "ai", text: "Security verified. Ready to review your health insights?" }]);
  const [toast, setToast] = useState<{ msg: string; isError: boolean } | null>(null);

  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [plans, setPlans] = useState<PlanResponse[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);

  // --- Theme helpers ---
  const dark = theme === "dark";
  const bg = dark ? "bg-[#000000]" : "bg-[#F2F2F7]";
  const text = dark ? "text-white" : "text-[#1C1C1E]";
  const subtext = dark ? "text-slate-500" : "text-slate-400";
  const glass = dark
    ? "bg-[#1C1C1E]/60 backdrop-blur-3xl glass-border ios-inner-shadow shadow-2xl"
    : "bg-white/80 backdrop-blur-3xl glass-border shadow-lg";
  const inputCls = dark
    ? "bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/50"
    : "bg-black/5 border border-black/10 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/50";

  // --- Functions ---
  const showToast = (msg: string, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 2500);
  };

  const toggleMedication = (index: number) => {
    const updatedMeds = [...meds];
    updatedMeds[index].taken = !updatedMeds[index].taken;
    setMeds(updatedMeds);
    showToast(updatedMeds[index].taken ? `${updatedMeds[index].name} logged` : `${updatedMeds[index].name} unselected`);
  };

  const addMedication = () => {
    if (!newMed.trim()) return;
    setMeds(prev => [...prev, { name: newMed, dose: "As directed", time: "08:00", taken: false, icon: "pill", color: "blue" }]);
    setNewMed("");
    showToast(`${newMed} added`);
  };

  const fetchPlans = async (county: string) => {
    if (!county) return;
    setPlansLoading(true);
    try {
      const data = await api.getPlansByCounty(county);
      setPlans(data);
    } catch (e: any) {
      showToast(`Plans error: ${e.message}`, true);
      setPlans([]);
    } finally {
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "savings" && step >= 6) {
      fetchPlans(form.county);
    }
  }, [activeTab, step]);

  const handleRegister = async () => {
    setApiError(null);
    setApiLoading(true);
    try {
      await api.registerUser({ ...form, hasIns });
      showToast("Account created!");
      setStep(3);
    } catch (e: any) {
      if (e.message === "Email already registered") {
        showToast("Welcome back!");
        setStep(3);
      } else {
        setApiError(e.message);
        showToast(e.message, true);
      }
    } finally {
      setApiLoading(false);
    }
  };

  const handleUpdateIncome = async () => {
    setApiLoading(true);
    try {
      await api.updateUser(form.email, { ...form, hasIns });
      setProfileSubView("default");
      showToast("Engine Re-calibrated");
    } catch (e: any) {
      showToast(`Update failed: ${e.message}`, true);
    } finally {
      setApiLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setApiLoading(true);
    try {
      await api.updateUser(form.email, { ...form, hasIns });
      showToast("Profile synced");
    } catch (e: any) {
      showToast(`Sync failed: ${e.message}`, true);
    } finally {
      setApiLoading(false);
    }
  };

  const handleLogout = () => {
    setStep(1);
    setProfileSubView("default");
    setHasIns(null);
    setSelectedPlan(null);
    setPlans([]);
    setForm({
      name: "",
      email: "",
      password: "",
      school: "Georgia Tech",
      major: "General Studies",
      year: "Freshman",
      income: "",
      status: "Domestic Student",
      sex: "",
      age: "",
      height: "",
      weight: "",
      county: "Fulton",
    });
    setMeds([]);
    showToast("Logged Out");
  };

  // --- Map API plan data to insurer card shape ---
  const mappedPlans: MappedPlan[] = plans.length > 0
    ? plans.map((p, i) => ({
        name: p.Health_Insurance_Provider ?? "",
        planName: p.Plan_Marketing_Name ?? undefined,
        compatibility: Math.max(60, 95 - i * 5),
        savings: p.Subsidy_Details || "See details",
        color: ["blue", "indigo", "cyan", "emerald", "violet"][i % 5],
        risk: p.Metal === "Gold" || p.Metal === "Platinum" ? "Low" : p.Metal === "Silver" ? "Medium" : "High",
        details: `${p.Plan_Marketing_Name} · ${p.Metal} tier · Deductible: ${p.Deductible_21_Year_Old}`,
        premium: p.Premium_21_Year_Old,
        deductible: p.Deductible_21_Year_Old,
        copayPrimary: p.Copay_Primary_Care,
        copaySpecialist: p.Copay_Specialist,
        copayER: p.Copay_Emergency_Room,
        metal: p.Metal,
        raw: p,
      }))
    : INSURERS_FALLBACK;

  /* ─── ONBOARDING ─── */
  if (step < 6) {
    return (
      <InputsForm
        step={step} setStep={setStep}
        form={form} setForm={setForm}
        hasIns={hasIns} setHasIns={setHasIns}
        meds={meds} newMed={newMed} setNewMed={setNewMed}
        apiLoading={apiLoading} apiError={apiError}
        handleRegister={handleRegister} addMedication={addMedication}
        dark={dark} bg={bg} text={text} glass={glass} inputCls={inputCls}
      />
    );
  }

  /* ─── DASHBOARD ─── */
  return (
    <div className={`min-h-screen pb-32 transition-all duration-700 ${bg} ${text} font-sans selection:bg-blue-500/30 overflow-x-hidden relative`}>

      {/* Floating Background Blobs */}
      <div className={`mesh-blob w-[300px] h-[300px] top-[15%] left-[5%] ${dark ? 'bg-blue-600/10' : 'bg-blue-900/10'}`} style={{ animationDuration: '20s' }} />
      <div className={`mesh-blob w-[400px] h-[400px] bottom-[20%] right-[-10%] ${dark ? 'bg-indigo-600/10' : 'bg-indigo-900/10'}`} style={{ animationDuration: '25s', animationDelay: '2s' }} />
      <div className={`mesh-blob w-[250px] h-[250px] top-[40%] right-[10%] ${dark ? 'bg-cyan-600/5' : 'bg-cyan-900/5'}`} style={{ animationDuration: '18s', animationDelay: '5s' }} />

      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-full text-xs font-black shadow-2xl animate-in fade-in slide-in-from-top-4 ${toast.isError ? 'bg-red-600' : 'bg-blue-600'} text-white`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-3xl border-b ${dark ? "bg-black/60 border-white/5" : "bg-white/70 border-black/5"} px-8 py-5 flex justify-between items-center`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 drop-shadow-xl"><img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" /></div>
          <div className="flex flex-col leading-none">
            <span className="text-2xl font-black tracking-tighter italic text-blue-600 dark:text-blue-400">UniVital</span>
            <span className="text-[8px] font-black opacity-30 uppercase tracking-[0.3em] mt-1">Equity Engine</span>
          </div>
        </div>
        <button onClick={() => setTheme(dark ? "light" : "dark")} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${glass} active:scale-90`}>
          <Icon name={dark ? "light_mode" : "dark_mode"} className="text-2xl" fill={1} />
        </button>
      </header>

      {/* Plan Detail Overlay */}
      {insViewDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setInsViewDetail(null)} />
          <div className={`${glass} w-full max-w-sm p-10 rounded-[3.5rem] relative z-10 space-y-8 animate-in zoom-in-95 duration-300`}>
            <div className="text-center">
              <p className={`text-${insViewDetail.color}-500 font-black text-xs uppercase tracking-widest`}>Compatibility Match</p>
              <h2 className="text-4xl font-black tracking-tighter">{insViewDetail.name}</h2>
              {insViewDetail.planName && <p className="text-sm opacity-50 mt-1">{insViewDetail.planName}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 text-center">
                <p className="text-[10px] opacity-40 font-black mb-1 uppercase">Match</p>
                <p className="text-3xl font-black text-emerald-400">{insViewDetail.compatibility}%</p>
              </div>
              <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 text-center">
                <p className="text-[10px] opacity-40 font-black mb-1 uppercase">Risk</p>
                <p className="text-xl font-black text-red-400">{insViewDetail.risk}</p>
              </div>
            </div>
            {insViewDetail.premium && (
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-white/5 text-center">
                  <p className="text-[9px] opacity-40 font-black uppercase mb-1">Premium</p>
                  <p className="text-sm font-black">{insViewDetail.premium}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 text-center">
                  <p className="text-[9px] opacity-40 font-black uppercase mb-1">Deductible</p>
                  <p className="text-sm font-black">{insViewDetail.deductible}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 text-center">
                  <p className="text-[9px] opacity-40 font-black uppercase mb-1">PCP Copay</p>
                  <p className="text-sm font-black">{insViewDetail.copayPrimary}</p>
                </div>
              </div>
            )}
            <div className="p-6 rounded-[2.5rem] bg-white/5 text-sm font-medium opacity-90 text-center italic">"{insViewDetail.details}"</div>
            <button onClick={() => { setSelectedPlan(insViewDetail.name); setInsViewDetail(null); showToast(`Synced to ${insViewDetail.name}`); }} className="w-full py-5 bg-blue-600 text-white rounded-full font-black shadow-2xl active:scale-95">Select Plan</button>
          </div>
        </div>
      )}

      <main className="px-8 py-8 max-w-md mx-auto space-y-10 relative z-10">

        {/* HOME DASHBOARD */}
        {activeTab === "home" && (
          <FragilityCurveChart meds={meds} toggleMedication={toggleMedication} glass={glass} dark={dark} />
        )}

        {/* INSIGHTS */}
        {activeTab === "mustknows" && (
          <div className="space-y-10 animate-in slide-in-from-bottom-10">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 px-2 mb-6 text-glow">Market Trends</h3>
              <div className="flex gap-6 overflow-x-auto hide-scrollbar snap-x px-1">
                {[
                  { label: "Premium Shifts", val: "+14.2%", data: [30, 45, 60, 40, 70, 85, 80], color: "text-red-400" },
                  { label: "Subsidy Power", val: "-22.1%", data: [90, 80, 75, 65, 50, 40, 30], color: "text-emerald-400" }
                ].map((pulse, idx) => (
                  <div key={idx} className={`${glass} min-w-[300px] p-10 rounded-[3.5rem] snap-center group relative overflow-hidden`}>
                    <div className="flex justify-between items-start mb-8 relative z-10">
                      <p className="text-[11px] font-black opacity-40 uppercase tracking-widest">{pulse.label}</p>
                      <span className={`text-sm font-black ${pulse.color}`}>{pulse.val}</span>
                    </div>
                    <div className="h-24 flex items-end gap-3 relative z-10">
                      {pulse.data.map((h, i) => (
                        <div key={i} className="flex-1 bg-blue-500/20 rounded-xl transition-all duration-1000 hover:bg-blue-600 group-hover:bg-blue-500/40" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={`${glass} p-10 rounded-[3.5rem] bg-blue-600/5 space-y-6 border border-blue-500/20`}>
              <div className="w-16 h-16 rounded-3xl bg-blue-600/20 flex items-center justify-center text-blue-500"><Icon name="history_toggle_off" size="40px" /></div>
              <h4 className="text-3xl font-black tracking-tighter leading-none">The 2026 Cliff</h4>
              <p className="text-sm font-medium opacity-60 leading-relaxed italic">"Federal enhanced subsidies expire in 11 months. Plan premiums are projected to pivot significantly based on market volume."</p>
              <button className="text-blue-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">Read Data Paper <Icon name="arrow_forward" size="14px" /></button>
            </div>
          </div>
        )}

        {/* VITAL AI */}
        {activeTab === "vitalai" && (
          <PolicyClauseCard messages={messages} glass={glass} inputCls={inputCls} dark={dark} />
        )}

        {/* RX ENGINE */}
        {activeTab === "savings" && (
          <PlanComparisonTable
            form={form} setForm={setForm}
            mappedPlans={mappedPlans} plansLoading={plansLoading}
            selectedPlan={selectedPlan} fetchPlans={fetchPlans}
            setInsViewDetail={setInsViewDetail}
            glass={glass} inputCls={inputCls} dark={dark}
          />
        )}

        {/* PROFILE */}
        {activeTab === "profile" && (
          <div className="space-y-10 animate-in fade-in">
            {profileSubView === "default" ? (
              <>
                <div className="text-center space-y-6 py-10">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-blue-600/30 blur-3xl rounded-full scale-150" />
                    <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-6xl font-black text-white shadow-2xl border-8 border-white/10 relative">
                      {form.name ? form.name[0] : "U"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-4xl font-black tracking-tighter text-glow leading-none">{form.name || "Student User"}</p>
                    <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.4em] mt-2">{form.school} · {form.major}</p>
                    <p className="text-[10px] font-black opacity-20 uppercase tracking-[0.2em]">{form.county} County</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 px-2">Account Hub</h4>
                  <button onClick={() => setProfileSubView("editIncome")} className={`${glass} p-8 rounded-[2.8rem] flex justify-between items-center w-full active:scale-95 transition-all`}>
                    <div className="flex items-center gap-5"><Icon name="payments" className="text-blue-500" fill={1} /><span className="text-lg font-black tracking-tight">Income Page</span></div>
                    <span className="font-black text-blue-500 text-xl">${form.income || '0'}</span>
                  </button>
                  <button onClick={() => setProfileSubView("editMeds")} className={`${glass} p-8 rounded-[2.8rem] flex justify-between items-center w-full active:scale-95 transition-all`}>
                    <div className="flex items-center gap-5"><Icon name="medication" className="text-emerald-500" fill={1} /><span className="text-lg font-black tracking-tight">Health Page</span></div>
                    <span className="font-black text-emerald-500 text-xl">{meds.length}</span>
                  </button>
                  <button onClick={() => setProfileSubView("settings")} className={`${glass} p-8 rounded-[2.8rem] flex items-center gap-5 w-full active:scale-95 transition-all`}>
                    <Icon name="settings" className="opacity-30" fill={1} />
                    <span className="flex-1 text-left text-lg font-black tracking-tight">Profile Page</span>
                    <Icon name="chevron_right" className="opacity-20" />
                  </button>
                </div>
              </>
            ) : (
              <div className="animate-in slide-in-from-right duration-400">
                <button onClick={() => setProfileSubView("default")} className="text-blue-500 font-black text-xs uppercase tracking-widest flex items-center gap-2 mb-10 active:opacity-50"><Icon name="arrow_back" size="18px" /> Return to Hub</button>

                {profileSubView === "editIncome" ? (
                  <div className="space-y-10">
                    <h2 className="text-4xl font-black tracking-tight leading-none">Income Page</h2>
                    <div className="relative">
                      <Icon name="attach_money" className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-500" />
                      <input type="number" className={`w-full pl-16 pr-6 py-8 rounded-[2.8rem] outline-none ${inputCls} text-4xl font-black`} value={form.income} onChange={e => setForm({...form, income: e.target.value})} />
                    </div>
                    <button
                      onClick={handleUpdateIncome}
                      disabled={apiLoading}
                      className="w-full py-6 bg-blue-600 text-white rounded-full font-black text-xl shadow-2xl active:scale-95 flex items-center justify-center gap-3 disabled:opacity-60"
                    >
                      {apiLoading ? <><Spinner /> Updating...</> : "Update Model"}
                    </button>
                  </div>
                ) : profileSubView === "editMeds" ? (
                  <div className="space-y-10">
                    <h2 className="text-4xl font-black tracking-tight leading-none">Health Page</h2>
                    <div className="flex gap-3"><input className={`flex-1 px-7 py-5 rounded-3xl outline-none ${inputCls} font-bold`} placeholder="New compound..." value={newMed} onChange={e => setNewMed(e.target.value)} /><button onClick={addMedication} className="p-5 bg-blue-600 text-white rounded-3xl active:scale-95"><Icon name="add" /></button></div>
                    <div className="space-y-3">
                      {meds.map((m, i) => (
                        <div key={i} className="p-6 rounded-[2.5rem] bg-white/5 border border-white/5 flex justify-between items-center animate-in fade-in">
                          <div className="flex items-center gap-3"><Icon name={m.icon} className={`text-${m.color}-500`} fill={1} /><span className="font-black text-lg tracking-tight">{m.name}</span></div>
                          <button onClick={() => setMeds(meds.filter((_, idx) => idx !== i))} className="p-2 opacity-30 hover:opacity-100 transition-opacity"><Icon name="close" /></button>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setProfileSubView("default")} className="w-full py-6 bg-blue-600 text-white rounded-full font-black text-xl active:scale-95">Sync Profile</button>
                  </div>
                ) : (
                  <div className="space-y-10 pb-10">
                    <h2 className="text-4xl font-black tracking-tight leading-none">Profile Page</h2>

                    <div className="space-y-10">
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase opacity-30 tracking-[0.2em] px-4">Personal Identity</h3>
                        <div className="space-y-3">
                          <div className="space-y-1 px-4"><p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">Full Name</p><input className={`w-full px-8 py-5 rounded-full outline-none ${inputCls} font-bold`} value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                          <div className="space-y-1 px-4"><p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">Secure Email</p><input className={`w-full px-8 py-5 rounded-full outline-none ${inputCls} font-bold`} value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                          <div className="space-y-1 px-4"><p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">County</p>
                            <select className={`w-full px-8 py-5 rounded-full outline-none ${inputCls} font-bold appearance-none`} value={form.county} onChange={e => setForm({...form, county: e.target.value})}>
                              {COUNTIES.map(c => (
                                <option key={c} value={c}>{c} County</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase opacity-30 tracking-[0.2em] px-4">Academic Context</h3>
                        <div className="space-y-3">
                          <div className="space-y-1 px-4"><p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">University</p><input className={`w-full px-8 py-5 rounded-full outline-none ${inputCls} font-bold`} value={form.school} onChange={e => setForm({...form, school: e.target.value})} /></div>
                          <div className="grid grid-cols-2 gap-2 px-2">
                            <div className="space-y-1 px-2"><p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">Year</p>
                              <select className={`w-full px-6 py-4 rounded-full outline-none ${inputCls} font-bold appearance-none`} value={form.year} onChange={e => setForm({...form, year: e.target.value})}>
                                {["Freshman", "Sophomore", "Junior", "Senior", "Graduate"].map(y => <option key={y} value={y}>{y}</option>)}
                              </select>
                            </div>
                            <div className="space-y-1 px-2"><p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">Status</p>
                              <select className={`w-full px-6 py-4 rounded-full outline-none ${inputCls} font-bold appearance-none`} value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                                {["Domestic Student", "International Student", "DACA/Undocumented"].map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase opacity-30 tracking-[0.2em] px-4">Biometric Calibration</h3>
                        <div className="grid grid-cols-2 gap-4 px-2">
                          <div className="space-y-1 px-2"><p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">Sex</p>
                            <select className={`w-full px-6 py-4 rounded-full outline-none ${inputCls} font-bold appearance-none`} value={form.sex} onChange={e => setForm({...form, sex: e.target.value})}>
                              {["Male", "Female", "Other", "Non-binary"].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1 px-2"><p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">Age</p><input type="number" className={`w-full px-6 py-4 rounded-full outline-none ${inputCls} font-bold`} value={form.age} onChange={e => setForm({...form, age: e.target.value})} /></div>
                          <div className="space-y-1 px-2"><p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">Height</p><input className={`w-full px-6 py-4 rounded-full outline-none ${inputCls} font-bold`} value={form.height} onChange={e => setForm({...form, height: e.target.value})} /></div>
                          <div className="space-y-1 px-2"><p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">Weight</p><input className={`w-full px-6 py-4 rounded-full outline-none ${inputCls} font-bold`} value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} /></div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleUpdateProfile}
                      disabled={apiLoading}
                      className="w-full py-6 bg-blue-600 text-white rounded-full font-black text-xl shadow-2xl active:scale-95 flex items-center justify-center gap-3 disabled:opacity-60"
                    >
                      {apiLoading ? <><Spinner /> Saving...</> : "Save Profile"}
                    </button>

                    <button onClick={handleLogout} className="w-full py-6 bg-red-500/10 text-red-500 rounded-full font-black border border-red-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all mt-2"><Icon name="logout" fill={1} /> Log Out</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Nav Dock */}
      <nav className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-10 py-6 rounded-full ${glass} flex justify-around items-center w-[92%] max-w-md shadow-[0_30px_70px_rgba(0,0,0,0.6)] border border-white/20`}>
        {[
          { id: "home", label: "Control", icon: "space_dashboard" },
          { id: "mustknows", label: "Insights", icon: "insights" },
          { id: "vitalai", label: "Vital AI", icon: "auto_awesome" },
          { id: "savings", label: "Rx Engine", icon: "medication_liquid" },
          { id: "profile", label: "Identity", icon: "account_circle" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); if (tab.id === "profile") setProfileSubView("default"); }}
            className={`flex flex-col items-center gap-2 transition-all duration-300 ${activeTab === tab.id ? "text-blue-500 scale-125" : "text-slate-500 opacity-40 hover:opacity-100"}`}
          >
            <Icon name={tab.icon} size="30px" fill={activeTab === tab.id ? 1 : 0} />
            <span className={`text-[8px] font-black uppercase tracking-[0.1em] ${activeTab === tab.id ? 'opacity-100' : 'opacity-0'} transition-opacity`}>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
