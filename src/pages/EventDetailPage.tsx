import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventApi } from '../services/eventApi';
import { ClusteredWeatherEvent, WeatherStationTelemetry } from '../types/event';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { TrustScoreGauge } from '../components/common/TrustScoreGauge';
import { IndiaWeatherMap } from '../components/map/IndiaWeatherMap';
import {
  MapPin,
  Clock,
  Radio,
  Satellite,
  ShieldCheck,
  Flame,
  Layers,
  ArrowLeft,
  Users,
  Send,
  AlertTriangle,
  FileCheck2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<ClusteredWeatherEvent | null>(null);
  const { addToast } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvent = async () => {
      if (id) {
        const data = await eventApi.getEventDetails(id);
        setEvent(data);
      }
    };
    fetchEvent();
  }, [id]);

  if (!event) return null;

  const handleEscalate = () => {
    addToast({
      type: 'error',
      title: 'Incident Escalated',
      message: `Emergency escalation sent to NDRF Battalion for ${event.location}.`,
    });
  };

  return (
    <div className="space-y-8">
      {/* Back button & Breadcrumbs */}
      <div>
        <button
          onClick={() => navigate('/events')}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Weather Incidents</span>
        </button>

        <Breadcrumbs
          title={event.title}
          description={`Incident ID: ${event.id} • Initiated: ${event.startTime} • Last Updated: ${event.lastUpdate}`}
          actionButton={
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/multilingual-alerts')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Issue Multilingual Broadcast</span>
              </button>
              <button
                onClick={handleEscalate}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-950 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-mono font-bold transition-all"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Escalate to NDRF</span>
              </button>
            </div>
          }
        />
      </div>

      {/* Hero Overview Card */}
      <div className="p-6 rounded-2xl bg-command-card border border-cyan-500/40 shadow-2xl space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left 8 Cols: Incident Summary & Action Directive */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center gap-3">
              <SeverityBadge severity={event.severity} size="md" />
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 font-bold">
                {event.status} STATUS
              </span>
              <span className="text-xs font-mono text-slate-400">
                Affected Area: {event.affectedAreaKm2} km² ({event.affectedPopulationEstimate})
              </span>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed font-sans font-normal">
              {event.summary}
            </p>

            <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-slate-300">
              <span className="font-mono text-cyan-400 font-bold uppercase mr-1.5">Action Directive:</span>
              {event.recommendedAction}
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-2">
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase">Total Raw Pings</span>
                <p className="text-base font-bold text-slate-100 mt-0.5">{event.totalReports.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase">Verified Pings</span>
                <p className="text-base font-bold text-emerald-400 mt-0.5">{event.verifiedReports.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase">Unique Reporters</span>
                <p className="text-base font-bold text-slate-100 mt-0.5">{event.uniqueSources}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase">Cluster Radius</span>
                <p className="text-base font-bold text-cyan-400 mt-0.5">{event.clusterRadiusKm} km</p>
              </div>
            </div>
          </div>

          {/* Right 4 Cols: Trust Score & Multi-Source Fusion Gauges */}
          <div className="lg:col-span-4 p-6 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center text-center space-y-4">
            <TrustScoreGauge
              score={event.trustScore}
              size="lg"
              verdict="MULTI-SOURCE VERIFIED"
              subtext="AI Verification Confidence: 94%"
            />

            <div className="w-full space-y-1.5 pt-3 border-t border-slate-800 text-xs font-mono text-slate-400">
              <div className="flex justify-between">
                <span>Multi-Source Fusion:</span>
                <span className="text-cyan-400 font-bold">{event.fusionConfidence}%</span>
              </div>
              <div className="flex justify-between">
                <span>Deduplication Ratio:</span>
                <span className="text-emerald-400 font-bold">99.4% Noise Drop</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Map & Sensor Telemetry Array */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 6 Cols: Localized Cluster Map */}
        <div className="lg:col-span-6 space-y-3">
          <h3 className="text-xs font-mono uppercase font-bold text-slate-300 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            Localized Incident Surveillance Radius ({event.clusterRadiusKm}km)
          </h3>
          <IndiaWeatherMap
            events={[event]}
            selectedEventId={event.id}
            height="380px"
            zoomLevel={10}
            center={[event.coordinates.lat, event.coordinates.lng]}
          />
        </div>

        {/* Right 6 Cols: AWS Ground Station Sensor Telemetry */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase font-bold text-slate-300 flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              Corroborating AWS Sensor Nodes ({event.telemetry.length} Active)
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Rapid Scan 30s</span>
          </div>

          <div className="space-y-3">
            {event.telemetry.map((st: WeatherStationTelemetry) => (
              <div
                key={st.stationId}
                className="p-4 rounded-xl bg-command-card border border-slate-800 space-y-2 font-mono text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100">{st.name}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                    {st.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  <div>
                    Rain Past Hour: <span className="text-cyan-400 font-bold">{st.rainfallPastHourMm} mm</span>
                  </div>
                  <div>
                    Wind Gusts: <span className="text-slate-200 font-bold">{st.windSpeedKmh} km/h {st.windDirection}</span>
                  </div>
                  <div>
                    Water Height: <span className="text-red-400 font-bold">{st.waterLevelMeters || 1.8} m</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
