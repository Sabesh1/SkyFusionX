import React, { useEffect, useState } from 'react';
import { alertApi } from '../services/alertApi';
import { WeatherAlert } from '../types/alert';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { MultilingualBroadcastCard } from '../components/alerts/MultilingualBroadcastCard';
import { Globe, Radio, BellRing, Send, Volume2, ShieldCheck, Share2 } from 'lucide-react';

export const MultilingualAlertsPage: React.FC = () => {
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
        title="Multilingual Alert Broadcasting Studio"
        description="Instant multi-channel emergency alert distribution synthesized across 8 major Indian languages with Common Alerting Protocol (CAP v1.2) compliance."
      />

      {/* Language Support Banner */}
      <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-200">Supported Languages:</span>
          <span className="text-cyan-300 font-bold">
            English • हिन्दी (Hindi) • தமிழ் (Tamil) • తెలుగు (Telugu) • ಕನ್ನಡ (Kannada) • മലയാളം (Malayalam) • বাংলা (Bengali) • मराठी (Marathi)
          </span>
        </div>
        <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 font-bold">
          LATENCY &lt; 200ms
        </span>
      </div>

      {/* Broadcast Cards Feed */}
      <div className="space-y-6">
        {alerts.map(alert => (
          <MultilingualBroadcastCard key={alert.id} alert={alert} />
        ))}
      </div>
    </div>
  );
};
