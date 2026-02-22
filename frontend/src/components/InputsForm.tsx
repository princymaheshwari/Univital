import React, { useState, useRef } from "react";
import type { FormData, Medication } from "../types/risk";

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

interface InputsFormProps {
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  hasIns: boolean | null;
  setHasIns: React.Dispatch<React.SetStateAction<boolean | null>>;
  meds: Medication[];
  newMed: string;
  setNewMed: React.Dispatch<React.SetStateAction<string>>;
  apiLoading: boolean;
  apiError: string | null;
  handleRegister: () => void;
  addMedication: () => void;
  dark: boolean;
  bg: string;
  text: string;
  glass: string;
  inputCls: string;
}

export default function InputsForm({
  step, setStep, form, setForm, hasIns, setHasIns,
  meds, newMed, setNewMed,
  apiLoading, apiError, handleRegister, addMedication,
  dark, bg, text, glass, inputCls,
}: InputsFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [canAcceptTOS, setCanAcceptTOS] = useState(false);
  const tosRef = useRef<HTMLDivElement>(null);

  const handleTOSScroll = () => {
    if (tosRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = tosRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 30) {
        setCanAcceptTOS(true);
      }
    }
  };

  return (
    <div className={`min-h-screen ${bg} ${text} flex flex-col items-center justify-center p-8 transition-colors duration-1000 relative overflow-hidden`}>

      {/* Background Corner Glows */}
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
              <h1 className={`text-6xl font-black tracking-tighter italic ${dark ? 'glow-text-dark' : 'glow-text-light'}`}>
                UniVital
              </h1>
              <p className="text-xl font-medium opacity-60 leading-tight">Student Healthcare, Simplified.</p>
            </div>
            <button
              onClick={() => setStep(1.5)}
              className={`w-full py-5 bg-blue-600 text-white rounded-full font-black text-xl active:scale-95 transition-all hover:brightness-110 ${dark ? 'glow-btn-dark' : 'glow-btn-light'}`}
            >
              Get Started
            </button>
          </div>
        )}

        {step === 1.5 && (
          <div className={`${glass} p-8 rounded-[3.5rem] space-y-6 animate-in slide-in-from-bottom-20`}>
            <div className="space-y-1 text-center">
              <div className="flex items-center justify-center gap-2 mb-1"><Icon name="verified_user" className="text-blue-500" fill={1} /><h2 className="text-2xl font-black">HIPAA Notice</h2></div>
              <p className="text-[9px] font-black opacity-30 tracking-[0.2em] uppercase">Privacy & Patient Rights</p>
            </div>
            <div
              ref={tosRef}
              onScroll={handleTOSScroll}
              className={`h-[350px] overflow-y-auto pr-2 text-[13px] leading-relaxed space-y-5 opacity-70 custom-scrollbar ${dark ? 'bg-black/20' : 'bg-white/40'} p-4 rounded-3xl`}
            >
              <div className="space-y-3">
                <h3 className="font-black text-blue-500 uppercase text-[11px] tracking-widest">1. Data Encryption</h3>
                <p>UniVital uses AES-256 encryption for all Protected Health Information (PHI). Your data is stored on HIPAA-compliant servers and is never shared with third-party marketers.</p>
              </div>
              <div className="space-y-3">
                <h3 className="font-black text-blue-500 uppercase text-[11px] tracking-widest">2. Your HIPAA Rights</h3>
                <p>Under the HIPAA Privacy Rule, you have the following rights regarding your health data:</p>
                <ul className="space-y-2 list-disc pl-4 italic">
                  <li><strong>Right of Access:</strong> Request a digital copy of all health data we store.</li>
                  <li><strong>Right to Amend:</strong> Request corrections to inaccurate medication or health history.</li>
                  <li><strong>Right to Accounting:</strong> Request a log of any disclosures made of your PHI.</li>
                  <li><strong>Right to Restrict:</strong> Request limitations on how we process certain sensitive data.</li>
                  <li><strong>Confidential Comms:</strong> Request that we contact you only through specific secure channels.</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-black text-blue-500 uppercase text-[11px] tracking-widest">3. Risk Modeling</h3>
                <p>By agreeing, you authorize our Risk Engine to process your data specifically for simulating insurance premium fragility and subsidy cliff proximity.</p>
              </div>
              <div className="space-y-3 border-t border-white/10 pt-4">
                <p className="text-blue-500 font-bold text-center animate-pulse">--- Continue scrolling to verify reading ---</p>
                <p className="text-center font-black opacity-20 text-[10px] uppercase">Compliance Version 2026.1</p>
              </div>
            </div>
            <button
              disabled={!canAcceptTOS}
              onClick={() => setStep(2)}
              className={`w-full py-5 rounded-full font-black transition-all ${canAcceptTOS ? 'bg-blue-600 text-white shadow-xl active:scale-95' : 'bg-white/5 text-white/20'}`}
            >
              {canAcceptTOS ? "Accept & Continue" : "Scroll to Bottom"}
            </button>
          </div>
        )}

        {step >= 2 && (
          <div className={`${glass} p-10 rounded-[3.5rem] space-y-8 animate-in slide-in-from-right`}>
            <h2 className="text-3xl font-black tracking-tight">{step === 2 ? "Account" : step === 3 ? "Health" : step === 3.5 ? "Financial" : "Coverage"}</h2>

            {apiError && (
              <div className="px-5 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                {apiError}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <input className={`w-full px-7 py-5 rounded-full outline-none ${inputCls} font-bold`} placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                <input className={`w-full px-7 py-5 rounded-full outline-none ${inputCls} font-bold`} placeholder="Student Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                <input className={`w-full px-7 py-5 rounded-full outline-none ${inputCls} font-bold`} type={showPassword ? "text" : "password"} placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                <select className={`w-full px-7 py-5 rounded-full outline-none ${inputCls} font-bold appearance-none`} value={form.county} onChange={e => setForm({...form, county: e.target.value})}>
                  {COUNTIES.map(c => (
                    <option key={c} value={c}>{c} County</option>
                  ))}
                </select>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="flex gap-2">
                  <input className={`flex-1 px-6 py-4 rounded-3xl outline-none ${inputCls}`} placeholder="Add medication..." value={newMed} onChange={e => setNewMed(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addMedication()} />
                  <button onClick={addMedication} className="p-4 bg-blue-600 text-white rounded-2xl active:scale-90"><Icon name="add" /></button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto hide-scrollbar">
                  {meds.map((m, i) => (
                    <div key={i} className="p-4 rounded-[1.5rem] bg-white/5 border border-white/5 flex justify-between items-center">
                      <span className="font-bold text-sm">{m.name}</span>
                      <Icon name="check_circle" className="text-emerald-500" fill={1} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3.5 && (
              <div className="space-y-6">
                <div className="relative">
                  <Icon name="payments" className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-500" />
                  <input type="number" className={`w-full pl-16 pr-6 py-8 rounded-[2rem] outline-none ${inputCls} text-3xl font-black`} placeholder="0" value={form.income} onChange={e => setForm({...form, income: e.target.value})} />
                </div>
                <p className="text-xs opacity-40 font-black uppercase tracking-[0.2em] text-center">Annual Gross Income</p>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <button onClick={() => {setHasIns(true); setStep(5);}} className="w-full p-6 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center gap-4 active:scale-95 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400"><Icon name="shield_with_heart" fill={1} /></div>
                  <p className="font-black">I'm Covered</p>
                </button>
                <button onClick={() => {setHasIns(false); setStep(5);}} className="w-full p-6 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center gap-4 active:scale-95 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-500"><Icon name="manage_search" fill={1} /></div>
                  <p className="font-black">No Insurance</p>
                </button>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <div className="p-8 rounded-[2.5rem] bg-red-500/10 border border-red-500/20 text-center space-y-4">
                  <Icon name="warning" className="text-red-500 text-5xl" fill={1} />
                  <p className="text-sm font-black text-red-500 uppercase tracking-widest">Fragility Peak</p>
                  <p className="text-sm font-medium opacity-70 leading-snug">Based on ${form.income} income, you are highly sensitive to market shocks.</p>
                </div>
              </div>
            )}

            <div className="pt-4 flex flex-col gap-4">
              {step === 2 ? (
                <button
                  onClick={handleRegister}
                  disabled={apiLoading}
                  className="w-full py-5 bg-blue-600 text-white rounded-full font-black shadow-xl active:scale-95 flex items-center justify-center gap-3 disabled:opacity-60"
                >
                  {apiLoading ? <><Spinner /> Creating Account...</> : "Continue"}
                </button>
              ) : (
                <button onClick={() => setStep(step === 3.5 ? 4 : step + 1)} className="w-full py-5 bg-blue-600 text-white rounded-full font-black shadow-xl active:scale-95">
                  {step === 5 ? "Go to Dashboard" : "Continue"}
                </button>
              )}
              {step > 2 && <button onClick={() => setStep(step === 4 ? 3.5 : step - 1)} className="text-[11px] font-black opacity-30 uppercase tracking-[0.2em] text-center">Previous Page</button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
