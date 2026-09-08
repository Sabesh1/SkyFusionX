import React, { useState } from 'react';
import { eventApi } from '../services/eventApi';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { ClusteredWeatherEvent, TimelineItem } from '../types/event';
import {
  Clock,
  Radio,
  Users,
  ShieldCheck,
  BellRing,
  Flame,
  Activity,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TimelinePage: React.FC = () => {
  const [events, setEvents] = useState<ClusteredWeatherEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    eventApi.getWeatherEvents().then(data => {
      setEvents(data);
      if (data.length > 0) setSelectedEventId(data[0].id);
    });
  }, []);

  const activeEvent = events.find(e => e.id === selectedEventId) || events[0] || null;

  const iconMap: Record<string, React.ReactNode> = {
    report: <Users className="w-4 h-4 text-cyan-400" />,
    sensor: <Radio className="w-4 h-4 text-emerald-400" />,
    ai: <ShieldCheck className="w-4 h-4 text-purple-400" />,
    alert: <BellRing className="w-4 h-4 text-amber-400" />,
    escalation: <Flame className="w-4 h-4 text-red-400" />,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <Breadcrumbs
        title="Incident Timeline & Forensic Progression"
        description="Chronological event audit trail tracking raw signal ingestion, telemetry verification thresholds, AI cluster convergence, and authority emergency escalations."
      />

      {/* Event Selector Ribbon */}
      <div className="p-4 rounded-xl bg-theme-card border border-theme-border flex items-center justify-between gap-3 text-xs font-mono">
        <span className="text-theme-muted uppercase font-bold">Select Active Incident Timeline:</span>
        <div className="flex items-center gap-2">
          {events.slice(0, 3).map((ev: ClusteredWeatherEvent) => (
            <button
              key={ev.id}
              onClick={() => setSelectedEventId(ev.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                selectedEventId === ev.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                  : 'bg-theme-surface border border-theme-border text-theme-muted hover:text-theme-text'
              }`}
            >
              {ev.eventName}
            </button>
          ))}
        </div>
      </div>

      {/* Main Vertical Timeline Card */}
      {activeEvent ? (
        <div className="p-6 md:p-8 rounded-2xl bg-theme-card border border-cyan-500/30 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme-border pb-4">
            <div>
              <h3 className="text-lg font-bold font-display text-theme-text">{activeEvent.eventName}</h3>
              <p className="text-xs text-theme-muted font-mono mt-0.5">{activeEvent.location}</p>
            </div>
            <div className="flex items-center gap-2">
              <SeverityBadge severity={activeEvent.severity} size="md" />
              <span className="text-xs font-mono text-emerald-400 font-bold px-2.5 py-1 rounded bg-theme-surface border border-theme-border">
                {activeEvent.trustScore}% Trust
              </span>
            </div>
          </div>

          <div className="relative pl-6 md:pl-10 space-y-8 before:absolute before:left-3 md:before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-cyan-500 before:via-blue-500 before:to-red-500">
            {activeEvent.timeline && activeEvent.timeline.map((item: TimelineItem, idx: number) => (
              <div key={item.id} className="relative group">
                <div className="absolute -left-6 md:-left-10 top-1.5 w-6 h-6 rounded-full bg-theme-bg border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.4)] group-hover:scale-110 transition-transform">
                  {iconMap[item.iconType || 'report'] || iconMap.report}
                </div>
                <div className="p-4 rounded-xl bg-theme-surface/70 border border-theme-border hover:border-theme-border-hover space-y-2 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                        {item.time}
                      </span>
                      <h4 className="font-bold text-theme-text font-sans text-sm">{item.eventTitle}</h4>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <SeverityBadge severity={item.severity} size="sm" />
                      <span className="text-emerald-400 font-bold">{item.trustScore}% Trust</span>
                    </div>
                  </div>
                  <p className="text-xs text-theme-text font-sans leading-relaxed font-normal">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-theme-muted border-t border-theme-border/80">
                    <span>Source: <strong className="text-theme-text">{item.source}</strong></span>
                    <span>ISO: {item.timestamp.split('T')[1]}</span>
                  </div>
                </div>
              </div>
            ))}
            {(!activeEvent.timeline || activeEvent.timeline.length === 0) && (
              <div className="text-theme-muted font-mono text-sm">No timeline events available.</div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-theme-muted font-mono">No active incidents available</div>
      )}
    </div>
  );
};
