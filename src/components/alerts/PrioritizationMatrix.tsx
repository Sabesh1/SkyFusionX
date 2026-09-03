import React, { useState } from 'react';
import { WeatherAlert } from '../../types/alert';
import { SeverityBadge } from '../common/SeverityBadge';
import { alertApi } from '../../services/alertApi';
import { useApp } from '../../context/AppContext';
import { ShieldAlert, CheckCircle2, AlertTriangle, ArrowUpRight, X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PrioritizationMatrix: React.FC<{ alerts: WeatherAlert[] }> = ({ alerts: initialAlerts }) => {
  const [alerts, setAlerts] = useState<WeatherAlert[]>(initialAlerts);
  const { addToast } = useApp();
  const navigate = useNavigate();

  const handleAcknowledge = async (id: string) => {
    await alertApi.acknowledgeAlert(id);
    setAlerts(prev =>
      prev.map(a => (a.id === id ? { ...a, status: 'ACKNOWLEDGED' as const } : a))
    );
    addToast({
      type: 'info',
      title: 'Alert Acknowledged',
      message: `Emergency triage operator acknowledged ${id}.`,
    });
  };

  const handleEscalate = async (id: string) => {
    await alertApi.escalateAlert(id);
    setAlerts(prev =>
      prev.map(a =>
        a.id === id
          ? { ...a, status: 'ESCALATED' as const, severity: 'CRITICAL' as const, actionLevel: 'CRITICAL_ESCALATION' as const }
          : a
      )
    );
    addToast({
      type: 'error',
      title: 'Emergency Escalation Triggered',
      message: `Alert ${id} escalated to Level-4 NDRF Disaster Operations.`,
    });
  };

  const handleDismiss = async (id: string) => {
    await alertApi.dismissAlert(id);
    setAlerts(prev => prev.filter(a => a.id !== id));
    addToast({
      type: 'warning',
      title: 'Alert Dismissed',
      message: `Alert ${id} removed from active triage queue.`,
    });
  };

  const actionLevelBadges = {
    LOW_MONITOR: { label: 'Monitor Only', color: 'bg-emerald-950 text-emerald-400 border-emerald-500/30' },
    MEDIUM_NOTIFY: { label: 'Notify Authorities', color: 'bg-blue-950 text-cyan-400 border-cyan-500/30' },
    HIGH_WARNING: { label: 'Send Warning', color: 'bg-amber-950 text-amber-400 border-amber-500/30' },
    CRITICAL_ESCALATION: { label: 'Emergency Escalation', color: 'bg-red-950 text-red-400 border-red-500/40 animate-pulse' },
  };

  return (
    <div className="space-y-4">
      {/* Triage Queue Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#090D17]">
        <table className="w-full text-left text-xs font-sans">
          <thead className="bg-[#0D121F] border-b border-slate-800 text-[10px] font-mono uppercase text-slate-400">
            <tr>
              <th className="py-3 px-4">Event & Region</th>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Trust Score</th>
              <th className="py-3 px-4">Affected Pop.</th>
              <th className="py-3 px-4">AI Action Level</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Triage Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-normal text-slate-300">
            {alerts.map(alert => {
              const actionBadge = actionLevelBadges[alert.actionLevel] || actionLevelBadges.LOW_MONITOR;

              return (
                <tr key={alert.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-100">{alert.alertType}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{alert.affectedRegion}</div>
                  </td>
                  <td className="py-3 px-4">
                    <SeverityBadge severity={alert.severity} size="sm" />
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                    {alert.trustScore}%
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {alert.affectedPopulation}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${actionBadge.color}`}>
                      {actionBadge.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    <span
                      className={`font-semibold ${
                        alert.status === 'ESCALATED'
                          ? 'text-red-400'
                          : alert.status === 'ACKNOWLEDGED'
                          ? 'text-cyan-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {alert.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 font-mono text-xs">
                      {alert.eventId && (
                        <button
                          onClick={() => navigate(`/events/${alert.eventId}`)}
                          title="View Incident"
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {alert.status !== 'ACKNOWLEDGED' && alert.status !== 'ESCALATED' && (
                        <button
                          onClick={() => handleAcknowledge(alert.id)}
                          className="px-2 py-1 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 text-[11px] font-bold"
                        >
                          Acknowledge
                        </button>
                      )}

                      {alert.status !== 'ESCALATED' && (
                        <button
                          onClick={() => handleEscalate(alert.id)}
                          className="px-2 py-1 rounded bg-red-950/60 border border-red-500/40 text-red-300 hover:bg-red-900/60 text-[11px] font-bold"
                        >
                          Escalate
                        </button>
                      )}

                      <button
                        onClick={() => handleDismiss(alert.id)}
                        className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                        title="Dismiss"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
