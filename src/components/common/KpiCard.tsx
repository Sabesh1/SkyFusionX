import React from 'react';
import { LucideIcon } from 'lucide-react';
import { soundFX } from '../../utils/soundEffects';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  changePercent?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  color?: 'gold' | 'cyan' | 'emerald' | 'amber' | 'crimson' | 'blue' | 'purple';
  onClick?: () => void;
  alertPulse?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  onClick,
  alertPulse = false,
}) => {
  return (
    <div
      onClick={() => {
        soundFX.playClick();
        if (onClick) onClick();
      }}
      className={`p-5 rounded-2xl bg-theme-card border border-theme-border/80 hover:border-theme-border-hover transition-all shadow-sm group ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-theme-muted font-sans tracking-wide">
          {title}
        </span>
        <div className="p-2 rounded-xl bg-theme-surface text-theme-muted group-hover:text-cyan-400 transition-colors">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-2xl sm:text-3xl font-bold font-sans text-theme-text tracking-tight">
          {value}
        </div>
        {alertPulse && (
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        )}
      </div>

      {subtext && (
        <div className="mt-1.5 text-[11px] font-mono text-theme-muted truncate">
          {subtext}
        </div>
      )}
    </div>
  );
};
