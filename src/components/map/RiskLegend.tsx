import React from 'react';

export const RiskLegend: React.FC<{ orientation?: 'horizontal' | 'vertical' }> = ({
  orientation = 'horizontal',
}) => {
  const levels = [
    { label: 'Low', color: 'bg-emerald-400', ring: 'border-emerald-500/50' },
    { label: 'Moderate', color: 'bg-[#E5A962]', ring: 'border-[#E5A962]/50' },
    { label: 'High', color: 'bg-amber-400', ring: 'border-amber-500/50' },
    { label: 'Critical', color: 'bg-red-500', ring: 'border-red-500/50' },
  ];

  return (
    <div className="p-2.5 px-3.5 rounded-full bg-[#16161E]/90 border border-[#2B2B3C] backdrop-blur-md text-[11px] font-mono shadow-card-emboss flex items-center gap-3">
      <span className="text-slate-400 uppercase font-semibold text-[10px]">Risk Severity:</span>
      <div className="flex items-center gap-3">
        {levels.map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${l.color} border ${l.ring} shadow-sm`} />
            <span className="text-slate-300 font-medium">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
