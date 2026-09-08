import React, { useEffect, useState } from 'react';
import { eventApi } from '../services/eventApi';
import { ClusteredWeatherEvent } from '../types/event';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  MapPin,
  Clock,
  Radio,
  ArrowRight,
  Filter,
  Layers,
  Users,
  Search,
} from 'lucide-react';

export const WeatherEventsPage: React.FC = () => {
  const [events, setEvents] = useState<ClusteredWeatherEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      const data = await eventApi.getWeatherEvents();
      setEvents(data);
    };
    fetchEvents();
  }, []);

  const filteredEvents = events.filter(e => {
    const matchesSeverity = filterSeverity === 'ALL' || e.severity === filterSeverity;
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.state.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <Breadcrumbs
        title="Active Clustered Weather Incidents"
        description="Unified disaster incident clusters identified through spatial-temporal clustering and corroborated by multi-modal meteorological telemetry."
      />

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl bg-theme-card border border-theme-border flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-theme-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search incidents or cities..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-theme-surface border border-theme-border focus:border-cyan-500 text-xs text-theme-text outline-none"
            />
          </div>

          <select
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-theme-surface border border-theme-border text-theme-text focus:border-cyan-500 outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MODERATE">Moderate</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <span className="text-cyan-400 font-bold">{filteredEvents.length} Active Disasters Monitored</span>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEvents.map(event => (
          <div
            key={event.id}
            onClick={() => navigate(`/events/${event.id}`)}
            className="p-5 rounded-2xl bg-theme-card border border-theme-border hover:border-cyan-500/50 hover:bg-theme-surface/60 transition-all cursor-pointer space-y-4 hover:-translate-y-1 group shadow-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <SeverityBadge severity={event.severity} size="sm" />
              <div className="text-right font-mono">
                <span className="text-sm font-bold text-emerald-400">{event.trustScore}%</span>
                <span className="text-[10px] text-theme-muted block uppercase">Trust Score</span>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-theme-text font-display group-hover:text-cyan-300 transition-colors">
                {event.eventName}
              </h3>
              <p className="text-xs text-theme-muted flex items-center gap-1 font-mono">
                <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="truncate">{event.location}</span>
              </p>
            </div>

            <p className="text-xs text-theme-text line-clamp-2 leading-relaxed font-sans font-normal">
              {event.summary}
            </p>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-theme-border/80 text-[11px] font-mono text-theme-muted">
              <div>
                Reports: <span className="text-theme-text font-bold">{event.totalReports}</span>
              </div>
              <div>
                Radius: <span className="text-cyan-400 font-bold">{event.clusterRadiusKm}km</span>
              </div>
              <div className="text-right">
                <span className="text-theme-muted">{event.lastUpdate}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs font-mono">
              <span className="text-[11px] text-theme-muted">{event.affectedPopulationEstimate} Impacted</span>
              <span className="text-cyan-400 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>Event Drilldown</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
