
import React from 'react';

interface Props {
  label: string;
  value: number;
  onChange: (val: number) => void;
  step?: string;
}

const NumberInput: React.FC<Props> = ({ label, value, onChange, step = "0.0001" }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
    <input
      type="number"
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none bg-white transition-all shadow-sm"
    />
  </div>
);

export default NumberInput;
