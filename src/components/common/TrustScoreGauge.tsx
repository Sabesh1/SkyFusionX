import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Compass, Radio } from 'lucide-react';

interface TrustScoreGaugeProps {
  score: number; // 0-100
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  verdict?: string;
  subtext?: string;
}

export const TrustScoreGauge: React.FC<TrustScoreGaugeProps> = ({
  score,
  size = 'lg',
  showLabel = true,
  verdict,
  subtext,
}) => {
  const clampedScore = Math.max(0, Math.min(100, score));

  // Determine size params
  const dimensions = {
    sm: { radius: 38, stroke: 6, text: 'text-lg', label: 'text-[10px]' },
    md: { radius: 56, stroke: 8, text: 'text-2xl', label: 'text-xs' },
    lg: { radius: 76, stroke: 10, text: 'text-4xl', label: 'text-sm' },
    xl: { radius: 98, stroke: 12, text: 'text-5xl', label: 'text-base' },
  }[size];

  const circumference = 2 * Math.PI * dimensions.radius;
  // Use a 270-degree arc gauge
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * clampedScore) / 100;

  // Determine luxury gold score color
  const getColor = (s: number) => {
    if (s >= 85) return { stroke: '#E5A962', text: 'text-[#E5A962]', glow: 'rgba(229, 169, 98, 0.5)', label: 'VERIFIED' };
    if (s >= 70) return { stroke: '#D49547', text: 'text-[#D49547]', glow: 'rgba(212, 149, 71, 0.4)', label: 'CORROBORATED' };
    if (s >= 50) return { stroke: '#F59E0B', text: 'text-amber-400', glow: 'rgba(245, 158, 11, 0.4)', label: 'REVIEW' };
    return { stroke: '#F87171', text: 'text-red-400', glow: 'rgba(248, 113, 113, 0.4)', label: 'SUSPICIOUS' };
  };

  const current = getColor(clampedScore);
  const viewBoxSize = (dimensions.radius + dimensions.stroke + 16) * 2;
  const center = viewBoxSize / 2;

  // Calculate needle angle (-135deg to +135deg for 270deg sweep)
  const needleAngle = -135 + (clampedScore / 100) * 270;

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      <div className="relative flex items-center justify-center p-3 rounded-full bg-gradient-to-b from-[#1C1C26] to-[#121217] shadow-card-emboss border border-[#2B2B3C]">
        <svg
          width={viewBoxSize}
          height={viewBoxSize}
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
          className="transition-all duration-700"
        >
          <defs>
            {/* Golden Gradient for Arc */}
            <linearGradient id="goldGaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F9ECD9" />
              <stop offset="50%" stopColor="#E5A962" />
              <stop offset="100%" stopColor="#945E24" />
            </linearGradient>

            {/* Ambient Gold Radial Glow */}
            <radialGradient id="goldCenterGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(229, 169, 98, 0.18)" />
              <stop offset="100%" stopColor="rgba(229, 169, 98, 0)" />
            </radialGradient>
          </defs>

          {/* Glowing Center Fill */}
          <circle cx={center} cy={center} r={dimensions.radius - 8} fill="url(#goldCenterGlow)" />

          {/* Outer Concentric Radar Orbit Ring */}
          <circle
            cx={center}
            cy={center}
            r={dimensions.radius + 12}
            fill="transparent"
            stroke="#262634"
            strokeWidth="1"
            strokeDasharray="4 6"
          />

          {/* Inner Orbital Ticks */}
          <circle
            cx={center}
            cy={center}
            r={dimensions.radius - 12}
            fill="transparent"
            stroke="#222230"
            strokeWidth="1"
            strokeDasharray="2 4"
          />

          {/* Background Track Arc */}
          <circle
            cx={center}
            cy={center}
            r={dimensions.radius}
            fill="transparent"
            stroke="#22222E"
            strokeWidth={dimensions.stroke}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
            transform={`rotate(135 ${center} ${center})`}
          />

          {/* Animated Golden Value Arc */}
          <circle
            cx={center}
            cy={center}
            r={dimensions.radius}
            fill="transparent"
            stroke="url(#goldGaugeGrad)"
            strokeWidth={dimensions.stroke}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(135 ${center} ${center})`}
            style={{
              filter: `drop-shadow(0 0 10px ${current.glow})`,
              transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />

          {/* Radar Reticle Crosshairs */}
          <line
            x1={center - dimensions.radius + 16}
            y1={center}
            x2={center + dimensions.radius - 16}
            y2={center}
            stroke="rgba(229, 169, 98, 0.15)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <line
            x1={center}
            y1={center - dimensions.radius + 16}
            x2={center}
            y2={center + dimensions.radius - 16}
            stroke="rgba(229, 169, 98, 0.15)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        </svg>

        {/* Center Digital Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pt-2">
          <div className="flex items-baseline justify-center">
            <span className={`font-mono font-extrabold tracking-tight ${dimensions.text} text-[#F3D9B5] drop-shadow-md`}>
              {clampedScore}
            </span>
            <span className="text-sm font-bold text-[#E5A962] ml-0.5">%</span>
          </div>

          <span className="text-[10px] uppercase font-mono tracking-widest text-[#E5A962] font-semibold mt-0.5">
            TRUST SCORE
          </span>
        </div>
      </div>

      {showLabel && (
        <div className="mt-3 flex flex-col items-center">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181822] border border-[#E5A962]/40 text-xs font-mono font-semibold shadow-gold-sm">
            {clampedScore >= 70 ? (
              <ShieldCheck className="w-3.5 h-3.5 text-[#E5A962]" />
            ) : clampedScore >= 50 ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            )}
            <span className="text-[#F3D9B5]">{verdict || current.label}</span>
          </div>
          {subtext && <p className="text-[11px] text-slate-400 mt-1 max-w-[220px] text-center font-sans">{subtext}</p>}
        </div>
      )}
    </div>
  );
};
