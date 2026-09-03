import React, { useState } from 'react';
import { INDIAN_STATES_DATA, IndianStateRisk } from '../data/indiaGeoData';
import { MOCK_WEATHER_EVENTS } from '../data/mockEvents';
import { ClusteredWeatherEvent } from '../types/event';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { IndiaWeatherMap } from '../components/map/IndiaWeatherMap';
import { RiskLegend } from '../components/map/RiskLegend';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { Filter, Layers, Radio } from 'lucide-react';

export const RiskHeatmapPage: React.FC = () => {
  const [selectedStateCode, setSelectedStateCode] = useState<string>('TN');
  const [selectedEventType, setSelectedEventType] = useState<string>('ALL');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('24h');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');

  const states: IndianStateRisk[] = Object.values(INDIAN_STATES_DATA);
  const activeState: IndianStateRisk = INDIAN_STATES_DATA[selectedStateCode] || states[0];

  const filteredEvents = MOCK_WEATHER_EVENTS.filter((e: ClusteredWeatherEvent) => {
    const matchesSeverity = selectedSeverity === 'ALL' || e.severity === selectedSeverity;
    const matchesType = selectedEventType === 'ALL' || e.eventType === selectedEventType;
    return matchesSeverity && matchesType;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <Breadcrumbs
        title="India Dynamic Risk Heatmap"
        description="Full-screen national disaster risk surveillance with interactive telemetry and severe weather warnings."
      />

      {/* Horizontal Toolbar Above Map */}
      <div className="p-3.5 rounded-2xl bg-[#121620] border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase text-[11px]">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>Filters:</span>
          </div>

          <select
            value={selectedStateCode}
            onChange={e => setSelectedStateCode(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#0B0E14] border border-slate-800 text-cyan-300 font-bold focus:border-cyan-500 outline-none"
          >
            {states.map((s: IndianStateRisk) => (
              <option key={s.code} value={s.code}>
                {s.name} ({s.riskLevel})
              </option>
            ))}
          </select>

          <select
            value={selectedEventType}
            onChange={e => setSelectedEventType(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#0B0E14] border border-slate-800 text-slate-200 focus:border-cyan-500 outline-none"
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
            className="px-3 py-1.5 rounded-xl bg-[#0B0E14] border border-slate-800 text-slate-200 focus:border-cyan-500 outline-none"
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
          zoomLevel={activeState ? 6 : 5}
          center={[activeState.center.lat, activeState.center.lng]}
        />

        <div className="absolute bottom-4 left-4 z-[400]">
          <RiskLegend orientation="horizontal" />
        </div>
      </div>
    </div>
  );
};
