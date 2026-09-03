import React from 'react';
import { SeverityLevel, VerificationStatus } from '../../types/common';
import { AlertCircle, AlertTriangle, CheckCircle, ShieldAlert, Clock, XCircle, ShieldCheck, Loader2 } from 'lucide-react';

interface SeverityBadgeProps {
  severity: SeverityLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  size = 'md',
  showIcon = true,
}) => {
  const config: Record<SeverityLevel, { bg: string; icon: React.ElementType; label: string }> = {
    LOW: {
      bg: 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40',
      icon: CheckCircle,
      label: 'Low Risk',
    },
    MODERATE: {
      bg: 'bg-[#2A2315] text-[#E5A962] border-[#E5A962]/40',
      icon: AlertCircle,
      label: 'Moderate',
    },
    HIGH: {
      bg: 'bg-amber-950/50 text-amber-300 border-amber-500/50',
      icon: AlertTriangle,
      label: 'High Alert',
    },
    CRITICAL: {
      bg: 'bg-red-950/60 text-red-300 border-red-500/50 animate-pulse',
      icon: ShieldAlert,
      label: 'Critical Zone',
    },
  };

  const current = config[severity] || config.LOW;
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1 font-mono font-bold',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-mono font-bold',
    lg: 'text-sm px-3 py-1.5 gap-2 font-mono font-bold',
  }[size];

  const IconComponent = current.icon;

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-sm ${current.bg} ${sizeClasses}`}
    >
      {showIcon && <IconComponent className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      <span>{current.label}</span>
    </span>
  );
};

interface StatusBadgeProps {
  status: VerificationStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config: Record<VerificationStatus, { bg: string; icon: React.ElementType; label: string }> = {
    VERIFIED: {
      bg: 'bg-[#2E2417] text-[#F3C58E] border-[#E5A962]/50 shadow-gold-sm',
      icon: ShieldCheck,
      label: 'AI Verified',
    },
    PARTIALLY_VERIFIED: {
      bg: 'bg-[#262016] text-[#E5A962] border-[#E5A962]/40',
      icon: CheckCircle,
      label: 'Corroborated',
    },
    VERIFYING: {
      bg: 'bg-[#201C14] text-[#E5A962] border-[#E5A962]/30',
      icon: Loader2,
      label: 'Verifying...',
    },
    REVIEW: {
      bg: 'bg-amber-950/50 text-amber-300 border-amber-500/50',
      icon: Clock,
      label: 'In Review',
    },
    SUSPICIOUS: {
      bg: 'bg-purple-950/40 text-purple-300 border-purple-500/40',
      icon: AlertTriangle,
      label: 'Suspicious',
    },
    REJECTED: {
      bg: 'bg-red-950/50 text-red-300 border-red-500/50',
      icon: XCircle,
      label: 'Rejected',
    },
    UNVERIFIED: {
      bg: 'bg-slate-900/50 text-slate-400 border-slate-700/50',
      icon: Clock,
      label: 'Unverified',
    },
    PROCESSING: {
      bg: 'bg-cyan-950/40 text-cyan-400 border-cyan-500/40',
      icon: Loader2,
      label: 'Processing...',
    },
  };

  const current = config[status] || config.REVIEW;
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1 font-mono font-bold',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-mono font-bold',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-mono font-bold',
  }[size];

  const Icon = current.icon;

  return (
    <span className={`inline-flex items-center rounded-full border shadow-sm ${current.bg} ${sizeClasses}`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      <span>{current.label}</span>
    </span>
  );
};
