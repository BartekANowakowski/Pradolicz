
import React from 'react';

interface Props {
  label: string;
  selectedHours: number[];
  onChange: (hours: number[]) => void;
  colorClass: string;
}

const HourSelector: React.FC<Props> = ({ label, selectedHours, onChange, colorClass }) => {
  const toggleHour = (hour: number) => {
    if (selectedHours.includes(hour)) {
      onChange(selectedHours.filter(h => h !== hour));
    } else {
      onChange([...selectedHours, hour]);
    }
  };

  return (
    <div className="mb-4">
      <p className="text-[11px] font-black mb-2.5 text-slate-400 uppercase tracking-tight">{label}</p>
      <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
        {Array.from({ length: 24 }).map((_, i) => (
          <button
            key={i}
            onClick={() => toggleHour(i)}
            className={`text-[10px] h-8 border rounded-lg transition-all flex items-center justify-center ${
              selectedHours.includes(i) 
                ? `${colorClass} text-white border-transparent shadow-sm font-black scale-105 z-10` 
                : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600'
            }`}
          >
            {i.toString().padStart(2, '0')}
          </button>
        ))}
      </div>
    </div>
  );
};

export default HourSelector;
