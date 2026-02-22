import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { api } from "./api/client";
import type { RiskPlanProfile, ShockPlanDelta, FormData } from "./types/risk";
import InputsForm from "./components/InputsForm";
import MainLayout from "./layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Shock from "./pages/Shock";
import Compare from "./pages/Compare";
import Architecture from "./pages/Architecture";
import Chat from "./pages/Chat";

type Page = "dashboard" | "shock" | "compare" | "architecture" | "chat";

export default function App() {
  const [theme, setTheme] = useState("dark");
  const [step, setStep] = useState(1);
  const [activePage, setActivePage] = useState<Page>("dashboard");

  const [form, setForm] = useState<FormData>({
    name: "", email: "", county: "", income: "",
    medicationCount: "", expectedErVisits: "", therapyFrequency: "",
  });

  const [toast, setToast] = useState<{ msg: string; isError: boolean } | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [riskPlans, setRiskPlans] = useState<RiskPlanProfile[]>([]);
  const [riskProfileKey, setRiskProfileKey] = useState<string | null>(null);
  const [annualIncome, setAnnualIncome] = useState<number | undefined>();

  const dark = theme === "dark";
  const bg = dark ? "bg-[#000000]" : "bg-[#F2F2F7]";
  const text = dark ? "text-white" : "text-[#1C1C1E]";
  const glass = dark
    ? "bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl"
    : "bg-black/[0.02] border border-black/[0.06] backdrop-blur-xl";
  const inputCls = dark
    ? "bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/50"
    : "bg-black/5 border border-black/10 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/50";

  const showToast = (msg: string, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 2500);
  };

  const fetchRisk = async (email: string) => {
    try {
      const res = await api.getRisk(email);
      setRiskPlans(res.plans);
      setRiskProfileKey(res.profile_key);
      setAnnualIncome(res.annual_income ?? undefined);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Demo profile not available", true);
      setRiskPlans([]);
      setRiskProfileKey(null);
    }
  };

  const handleRegister = async () => {
    setApiError(null);
    setApiLoading(true);
    try {
      await api.registerUser(form);
      showToast("Account created!");
      setStep(3);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Registration failed";
      if (msg === "Email already registered") { showToast("Welcome back!"); setStep(3); }
      else { setApiError(msg); showToast(msg, true); }
    } finally { setApiLoading(false); }
  };

  const handleFinishOnboarding = async () => {
    setApiLoading(true);
    try {
      await api.updateUser(form.email, form);
      setStep(6);
      setActivePage("dashboard");
      await fetchRisk(form.email);
      showToast("Risk Engine Complete");
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Failed", true);
    } finally { setApiLoading(false); }
  };

  const handleRunShock = async (scenario: string): Promise<ShockPlanDelta[]> => {
    const res = await api.runShock(form.email, scenario);
    return res.results;
  };

  const handleLogout = () => {
    setStep(1);
    setRiskPlans([]); setRiskProfileKey(null); setAnnualIncome(undefined);
    setForm({ name: "", email: "", county: "", income: "", medicationCount: "", expectedErVisits: "", therapyFrequency: "" });
    showToast("Logged Out");
  };

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&family=Inter:wght@400;500;600;700;800;900&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  if (step < 6) {
    return (
      <InputsForm
        step={step} setStep={setStep}
        form={form} setForm={setForm}
        apiLoading={apiLoading} apiError={apiError}
        handleRegister={handleRegister}
        handleFinishOnboarding={handleFinishOnboarding}
        dark={dark} bg={bg} text={text} glass={glass} inputCls={inputCls}
      />
    );
  }

  return (
    <MainLayout
      activePage={activePage} setActivePage={setActivePage}
      dark={dark} glass={glass}
      toggleTheme={() => setTheme(dark ? "light" : "dark")}
      onLogout={handleLogout}
      plans={riskPlans} profileKey={riskProfileKey}
      county={form.county} annualIncome={annualIncome}
    >
      {toast && (
        <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-[200] px-5 py-2.5 rounded-lg text-xs font-semibold shadow-xl ${toast.isError ? "bg-red-600" : "bg-blue-600"} text-white`}>
          {toast.msg}
        </div>
      )}

      {activePage === "dashboard" && (
        <Dashboard plans={riskPlans} profileKey={riskProfileKey} annualIncome={annualIncome} glass={glass} dark={dark} />
      )}
      {activePage === "shock" && (
        <Shock plans={riskPlans} profileKey={riskProfileKey} onRunShock={handleRunShock} glass={glass} dark={dark} />
      )}
      {activePage === "compare" && (
        <Compare plans={riskPlans} profileKey={riskProfileKey} glass={glass} dark={dark} />
      )}
      {activePage === "architecture" && (
        <Architecture dark={dark} glass={glass} />
      )}
      {activePage === "chat" && (
        <Chat dark={dark} glass={glass} />
      )}
    </MainLayout>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
