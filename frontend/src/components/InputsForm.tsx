import React, { useState, useRef } from "react";
import type { FormData } from "../types/risk";

const LOGO_URL = "https://files.oaiusercontent.com/file-K1XNq9f4C4U7jB5L1Z8p3d";
const COUNTIES = ["Fulton", "DeKalb", "Gwinnett", "Cobb", "Clayton", "Cherokee", "Forsyth", "Hall"];

const Icon = ({ name, className = "", fill = 0, size = "24px" }: { name: string; className?: string; fill?: number; size?: string }) => (
  <span className={`material-symbols-rounded select-none ${className}`} style={{ fontVariationSettings: `'FILL' ${fill}, 'wght' 400, 'GRAD' 0, 'opsz' 24`, fontSize: size, display: "inline-block" }}>{name}</span>
);

const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

interface InputsFormProps {
  step: number;
  setStep: (s: number) => void;
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  apiLoading: boolean;
  apiError: string | null;
  handleRegister: () => void;
  handleFinishOnboarding: () => void;
  dark: boolean;
  bg: string;
  text: string;
  glass: string;
  inputCls: string;
}

export default function InputsForm({
  step, setStep, form, setForm,
  apiLoading, apiError, handleRegister, handleFinishOnboarding,
  dark, bg, text, glass, inputCls,
}: InputsFormProps) {
  const [canAcceptTOS, setCanAcceptTOS] = useState(false);
  const tosRef = useRef<HTMLDivElement>(null);

  const handleTOSScroll = () => {
    if (tosRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = tosRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 30) setCanAcceptTOS(true);
    }
  };

  return (
    <div className={`min-h-screen ${bg} ${text} flex flex-col items-center justify-center p-8 transition-colors duration-1000 relative overflow-hidden`}>
      <div className={`absolute top-[-100px] left-[-100px] w-80 h-80 blur-[120px] rounded-full opacity-30 ${dark ? 'bg-blue-600' : 'bg-blue-900'}`} />
      <div className={`absolute top-[-100px] right-[-100px] w-80 h-80 blur-[120px] rounded-full opacity-30 ${dark ? 'bg-blue-600' : 'bg-blue-900'}`} />
      <div className={`absolute bottom-[-100px] left-[-100px] w-80 h-80 blur-[120px] rounded-full opacity-30 ${dark ? 'bg-blue-600' : 'bg-blue-900'}`} />
      <div className={`absolute bottom-[-100px] right-[-100px] w-80 h-80 blur-[120px] rounded-full opacity-30 ${dark ? 'bg-blue-600' : 'bg-blue-900'}`} />

      <div className="w-full max-w-sm relative z-10">
        {step === 1 && (
          <div className="text-center space-y-12 animate-in fade-in zoom-in duration-1000">
            <div className="w-40 h-40 mx-auto drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]">
              <img src={LOGO_URL} alt="UniVital" className="w-full h-full object-contain scale-110" />
            </div>
            <div className="space-y-4">
              <h1 className={`text-6xl font-black tracking-tighter italic ${dark ? 'glow-text-dark' : 'glow-text-light'}`}>UniVital</h1>
              <p className="text-xl font-medium opacity-60 leading-tight">Healthcare Financial Risk Engine</p>
            </div>
            <button onClick={() => setStep(1.5)} className={`w-full py-5 bg-blue-600 text-white rounded-full font-black text-xl active:scale-95 transition-all hover:brightness-110 ${dark ? 'glow-btn-dark' : 'glow-btn-light'}`}>Get Started</button>
          </div>
        )}

        {step === 1.5 && (
          <div className={`${glass} p-8 rounded-[3.5rem] space-y-6 animate-in slide-in-from-bottom-20`}>
            <div className="space-y-1 text-center">
              <div className="flex items-center justify-center gap-2 mb-1"><Icon name="verified_user" className="text-blue-500" fill={1} /><h2 className="text-2xl font-black">HIPAA Notice</h2></div>
              <p className="text-[9px] font-black opacity-30 tracking-[0.2em] uppercase">Privacy & Patient Rights</p>
            </div>
            <div ref={tosRef} onScroll={handleTOSScroll} className={`h-[350px] overflow-y-auto pr-2 text-[13px] leading-relaxed space-y-5 opacity-70 custom-scrollbar ${dark ? 'bg-black/20' : 'bg-white/40'} p-4 rounded-3xl`}>
              <div className="space-y-3"><h3 className="font-black text-blue-500 uppercase text-[11px] tracking-widest">1. Data Encryption</h3><p>UniVital uses AES-256 encryption for all Protected Health Information (PHI). Your data is stored on HIPAA-compliant servers.</p></div>
              <div className="space-y-3"><h3 className="font-black text-blue-500 uppercase text-[11px] tracking-widest">2. Your HIPAA Rights</h3>
                <ul className="space-y-2 list-disc pl-4 italic">
                  <li><strong>Right of Access:</strong> Request a digital copy of all health data.</li>
                  <li><strong>Right to Amend:</strong> Request corrections to inaccurate data.</li>
                  <li><strong>Right to Restrict:</strong> Limit how we process sensitive data.</li>
                </ul>
              </div>
              <div className="space-y-3"><h3 className="font-black text-blue-500 uppercase text-[11px] tracking-widest">3. Risk Modeling</h3><p>You authorize our Risk Engine to simulate insurance premium fragility and subsidy cliff proximity.</p></div>
              <div className="space-y-3 border-t border-white/10 pt-4"><p className="text-blue-500 font-bold text-center animate-pulse">--- Scroll to bottom to verify ---</p></div>
            </div>
            <button disabled={!canAcceptTOS} onClick={() => setStep(2)} className={`w-full py-5 rounded-full font-black transition-all ${canAcceptTOS ? 'bg-blue-600 text-white shadow-xl active:scale-95' : 'bg-white/5 text-white/20'}`}>{canAcceptTOS ? "Accept & Continue" : "Scroll to Bottom"}</button>
          </div>
        )}

        {step === 2 && (
          <div className={`${glass} p-10 rounded-[3.5rem] space-y-8 animate-in slide-in-from-right`}>
            <h2 className="text-3xl font-black tracking-tight">Profile & Risk Inputs</h2>
            {apiError && <div className="px-5 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">{apiError}</div>}

            <div className="space-y-4">
              <input className={`w-full px-7 py-5 rounded-full outline-none ${inputCls} font-bold`} placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              <input className={`w-full px-7 py-5 rounded-full outline-none ${inputCls} font-bold`} placeholder="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              <select className={`w-full px-7 py-5 rounded-full outline-none ${inputCls} font-bold appearance-none`} value={form.county} onChange={e => setForm({...form, county: e.target.value})}>
                <option value="">Select County</option>
                {COUNTIES.map(c => <option key={c} value={c}>{c} County</option>)}
              </select>
              <div className="relative">
                <Icon name="payments" className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-500" />
                <input type="number" className={`w-full pl-16 pr-6 py-5 rounded-full outline-none ${inputCls} font-bold`} placeholder="Annual Income" value={form.income} onChange={e => setForm({...form, income: e.target.value})} />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">Utilization Inputs</p>
              <div className="space-y-2">
                <p className="text-[10px] opacity-40 font-bold px-2">Monthly Medication Count</p>
                <input type="number" className={`w-full px-7 py-4 rounded-full outline-none ${inputCls} font-bold`} placeholder="e.g. 2" value={form.medicationCount} onChange={e => setForm({...form, medicationCount: e.target.value})} />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] opacity-40 font-bold px-2">Expected ER Visits / Year</p>
                <input type="number" step="0.1" className={`w-full px-7 py-4 rounded-full outline-none ${inputCls} font-bold`} placeholder="e.g. 0.5" value={form.expectedErVisits} onChange={e => setForm({...form, expectedErVisits: e.target.value})} />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] opacity-40 font-bold px-2">Therapy Sessions / Month</p>
                <input type="number" step="0.5" className={`w-full px-7 py-4 rounded-full outline-none ${inputCls} font-bold`} placeholder="e.g. 1.0" value={form.therapyFrequency} onChange={e => setForm({...form, therapyFrequency: e.target.value})} />
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-4">
              <button onClick={handleRegister} disabled={apiLoading || !form.name || !form.email || !form.income} className="w-full py-5 bg-blue-600 text-white rounded-full font-black shadow-xl active:scale-95 flex items-center justify-center gap-3 disabled:opacity-40">
                {apiLoading ? <><Spinner /> Creating Account...</> : "Create Account"}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={`${glass} p-10 rounded-[3.5rem] space-y-8 text-center animate-in slide-in-from-right`}>
            <div className="w-24 h-24 mx-auto rounded-3xl bg-blue-600/20 flex items-center justify-center"><Icon name="analytics" className="text-blue-500" size="48px" fill={1} /></div>
            <h2 className="text-3xl font-black tracking-tight">Ready to Analyze</h2>
            <p className="text-sm opacity-60 leading-relaxed">Your profile is saved. We'll match you to a demo risk cohort and compute per-plan fragility metrics across 5 insurance plans in {form.county || "your"} County.</p>
            <div className={`p-5 rounded-2xl ${dark ? 'bg-white/5' : 'bg-black/5'} text-left space-y-2`}>
              <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">Your Inputs</p>
              <p className="text-sm opacity-70">Income: <strong>${form.income || '—'}</strong> · Meds: <strong>{form.medicationCount || '0'}</strong> · ER: <strong>{form.expectedErVisits || '0'}</strong> · Therapy: <strong>{form.therapyFrequency || '0'}</strong></p>
            </div>
            <button onClick={handleFinishOnboarding} disabled={apiLoading} className="w-full py-5 bg-blue-600 text-white rounded-full font-black shadow-xl active:scale-95 flex items-center justify-center gap-3 disabled:opacity-60">
              {apiLoading ? <><Spinner /> Running Risk Engine...</> : "Run Risk Engine"}
            </button>
            <button onClick={() => setStep(2)} className="text-[11px] font-black opacity-30 uppercase tracking-[0.2em]">Edit Inputs</button>
          </div>
        )}
      </div>
    </div>
  );
}
