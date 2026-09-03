import React, { useEffect, useState } from 'react';
import { alertApi } from '../services/alertApi';
import { WeatherAlert } from '../types/alert';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { PrioritizationMatrix } from '../components/alerts/PrioritizationMatrix';
import { ShieldAlert, Activity, Users, Send, AlertTriangle } from 'lucide-react';

export const AlertPrioritizationPage: React.FC = () => {
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      const data = await alertApi.getAlerts();
      setAlerts(data);
    };
    fetchAlerts();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <Breadcrumbs
        title="Smart Alert Prioritization & Triage"
        description="Automated disaster response decision-matrix mapping real-time trust scores and population exposure to operational escalation levels (Low -> Medium -> High -> Critical)."
      />

      {/* Decision Matrix Logic Tiers Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
          <div className="flex items-center justify-between text-emerald-400 font-bold">
            <span>LEVEL 1: LOW</span>
            <span>Trust &lt; 70%</span>
          </div>
          <p className="text-[11px] text-slate-300 font-sans">Automated sensor watch & telemetry pooling.</p>
          <div className="text-[10px] text-emerald-400 uppercase font-bold">Action: Monitor Grid</div>
        </div>

        <div className="p-3.5 rounded-xl bg-blue-950/20 border border-cyan-500/30 space-y-1">
          <div className="flex items-center justify-between text-cyan-400 font-bold">
            <span>LEVEL 2: MEDIUM</span>
            <span>Trust 70-84%</span>
          </div>
          <p className="text-[11px] text-slate-300 font-sans">Municipal control room notification & pump staging.</p>
          <div className="text-[10px] text-cyan-400 uppercase font-bold">Action: Notify Authorities</div>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1">
          <div className="flex items-center justify-between text-amber-400 font-bold">
            <span>LEVEL 3: HIGH</span>
            <span>Trust 85-92%</span>
          </div>
          <p className="text-[11px] text-slate-300 font-sans">Public cell broadcast, SMS alerts, traffic diversions.</p>
          <div className="text-[10px] text-amber-400 uppercase font-bold">Action: Send Warning</div>
        </div>

        <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/40 space-y-1 animate-pulse">
          <div className="flex items-center justify-between text-red-400 font-bold">
            <span>LEVEL 4: CRITICAL</span>
            <span>Trust &gt; 92%</span>
          </div>
          <p className="text-[11px] text-slate-300 font-sans">Direct NDRF battalion dispatch & civic siren triggers.</p>
          <div className="text-[10px] text-red-400 uppercase font-bold">Action: Emergency Escalation</div>
        </div>
      </div>

      {/* Main Prioritization Queue */}
      <div className="p-6 rounded-2xl bg-command-card border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-mono uppercase font-bold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              Active Emergency Triage Queue
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Review and dispatch actions with single-click authority override.
            </p>
          </div>
        </div>

        <PrioritizationMatrix alerts={alerts} />
      </div>
    </div>
  );
};
