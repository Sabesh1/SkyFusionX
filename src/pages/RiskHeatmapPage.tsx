import React, { useEffect, useState } from 'react';
import { INDIAN_STATES_DATA, IndianStateRisk } from '../data/indiaGeoData';
import { ClusteredWeatherEvent } from '../types/event';
import { eventApi } from '../services/eventApi';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { IndiaWeatherMap } from '../components/map/IndiaWeatherMap';
import { RiskLegend } from '../components/map/RiskLegend';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { Filter, Layers, Radio } from 'lucide-react';

export const RiskHeatmapPage: React.FC = () => {
  const [selectedStateCode, setSelectedStateCode] = useState<string>('ALL');
  const [selectedEventType, setSelectedEventType] = useState<string>('ALL');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('24h');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');

  const [events, setEvents] = useState<ClusteredWeatherEvent[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const data = await eventApi.getWeatherEvents();
      setEvents(data);
    };
    fetchEvents();
    const interval = setInterval(fetchEvents, 30000);
    return () => clearInterval(interval);
  }, []);

  const stateCounts = events.reduce<Record<string, { count: number; severity: string }>>((acc, e) => {
    const key = e.state || 'Unknown';
    const severity = e.severity || 'LOW';
    if (!acc[key]) acc[key] = { count: 0, severity };
    acc[key].count += 1;
    if (severity === 'CRITICAL' || acc[key].severity === 'LOW') acc[key].severity = severity;
    return acc;
  }, {});

  const states: IndianStateRisk[] = Object.values(INDIAN_STATES_DATA).map(state => ({
    ...state,
    activeEventsCount: stateCounts[state.name]?.count ?? 0,
    riskLevel: (stateCounts[state.name]?.severity as any) || state.riskLevel,
  }));

  const activeState: IndianStateRisk = INDIAN_STATES_DATA[selectedStateCode] || states[0];

  const filteredEvents = events.filter((e: ClusteredWeatherEvent) => {
    const stateMatches = selectedStateCode === 'ALL' || e.state === activeState.name || e.state === (INDIAN_STATES_DATA[selectedStateCode]?.name ?? '');
    const matchesSeverity = selectedSeverity === 'ALL' || e.severity === selectedSeverity;
    const matchesType = selectedEventType === 'ALL' || e.eventType === selectedEventType;
    return stateMatches && matchesSeverity && matchesType;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <Breadcrumbs
        title="India Dynamic Risk Heatmap"
        description="Full-screen national disaster risk surveillance with interactive telemetry and severe weather warnings."
      />

      {/* Horizontal Toolbar Above Map */}
      <div className="p-3.5 rounded-2xl bg-theme-card border border-theme-border/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-theme-muted font-semibold uppercase text-[11px]">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>Filters:</span>
          </div>

          <select
            value={selectedStateCode}
            onChange={e => setSelectedStateCode(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-theme-surface border border-theme-border text-cyan-300 font-bold focus:border-cyan-500 outline-none"
          >
            <option value="ALL">All Active States</option>
            {states.filter(s => s.activeEventsCount > 0).map((s: IndianStateRisk) => (
              <option key={s.code} value={s.code}>
                {s.name} ({s.riskLevel}) {s.activeEventsCount}
              </option>
            ))}
          </select>

          <select
            value={selectedEventType}
            onChange={e => setSelectedEventType(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-theme-surface border border-theme-border text-theme-text focus:border-cyan-500 outline-none"
          >
            <option value="ALL">All Event Types</option>
            <option value="Heavy Rainfall">Heavy Rainfall</option>
            <option value="Urban Flooding">Urban Flooding</option>
            <option value="Thunderstorm">Thunderstorm</option>
            <option value="Cyclone">Cyclone</option>
            <option value="Dust Storm">Dust Storm</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={e => setSelectedSeverity(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-theme-surface border border-theme-border text-theme-text focus:border-cyan-500 outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MODERATE">Moderate</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <div className="text-cyan-400 font-semibold">
          {filteredEvents.length} Active Incidents Displayed
        </div>
      </div>

      {/* Near Full-Screen Map Container */}
      <div className="relative">
        <IndiaWeatherMap
          events={filteredEvents}
          height="640px"
          zoomLevel={selectedStateCode !== 'ALL' && activeState?.bounds ? 7 : 5}
          center={selectedStateCode !== 'ALL' && activeState?.center ? [activeState.center.lat, activeState.center.lng] : [20.5937, 78.9629]}
          selectedStateBounds={selectedStateCode !== 'ALL' ? activeState?.bounds : undefined}
        />

        <div className="absolute bottom-4 left-4 z-[400]">
          <RiskLegend orientation="horizontal" />
        </div>
      </div>
    </div>
  );
};
