import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ClusteredWeatherEvent } from '../../types/event';
import { SeverityLevel } from '../../types/common';
import { SeverityBadge } from '../common/SeverityBadge';
import { useNavigate } from 'react-router-dom';
import { soundFX } from '../../utils/soundEffects';
import {
  ShieldCheck,
  ArrowRight,
  Radio,
  Eye,
  Layers,
  CloudRain,
  Satellite,
  Compass,
} from 'lucide-react';

interface IndiaWeatherMapProps {
  events: ClusteredWeatherEvent[];
  selectedEventId?: string;
  onSelectEvent?: (event: ClusteredWeatherEvent) => void;
  height?: string;
  zoomLevel?: number;
  center?: [number, number];
  showClusters?: boolean;
}

// Custom map view controller for smooth panning
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
};

// Create custom luxury gold pulsing HTML markers
const createCustomMarkerIcon = (severity: SeverityLevel, trustScore: number, name: string) => {
  const colorMap: Record<SeverityLevel, { ring: string; dot: string; shadow: string }> = {
    LOW: { ring: 'border-emerald-400', dot: 'bg-emerald-400', shadow: 'rgba(52,211,153,0.6)' },
    MODERATE: { ring: 'border-[#E5A962]', dot: 'bg-[#E5A962]', shadow: 'rgba(229,169,98,0.7)' },
    HIGH: { ring: 'border-amber-400', dot: 'bg-amber-400', shadow: 'rgba(251,191,36,0.7)' },
    CRITICAL: { ring: 'border-red-500', dot: 'bg-red-500', shadow: 'rgba(239,68,68,0.8)' },
  };

  const c = colorMap[severity] || colorMap.MODERATE;

  const html = `
    <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
      <div class="absolute w-9 h-9 rounded-full border ${c.ring} opacity-75 animate-ping"></div>
      <div class="absolute w-7 h-7 rounded-full border ${c.ring} opacity-40"></div>
      <div class="w-4 h-4 rounded-full ${c.dot}" style="box-shadow: 0 0 14px ${c.shadow};">
      </div>
      <div class="absolute top-5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full bg-[#181822]/95 border border-[#2B2B3C] text-[10px] font-mono text-slate-200 pointer-events-none shadow-card-emboss backdrop-blur-md">
        ${name.split(' ')[0]} <span class="text-[#E5A962] font-bold">${trustScore}%</span>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-radar-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

export const IndiaWeatherMap: React.FC<IndiaWeatherMapProps> = ({
  events,
  selectedEventId,
  onSelectEvent,
  height = '520px',
  zoomLevel = 5,
  center = [20.5937, 78.9629], // Center of India
  showClusters = true,
}) => {
  const navigate = useNavigate();
  const [layerRadar, setLayerRadar] = useState(true);
  const [layerRadius, setLayerRadius] = useState(true);
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-[#2B2B3C] bg-[#121217] shadow-card-emboss">
      <MapContainer
        center={center}
        zoom={zoomLevel}
        style={{ height, width: '100%', background: '#121217' }}
        zoomControl={false}
      >
        <MapController center={center} zoom={zoomLevel} />

        {/* High Contrast Dark Carto Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a> | National Disaster Surveillance Grid'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          maxZoom={16}
        />

        {/* Clustered Event Markers and Radius Overlays */}
        {events.map(event => {
          const isSelected = selectedEventId === event.id;
          const severityColors = {
            LOW: '#34D399',
            MODERATE: '#E5A962',
            HIGH: '#FBBF24',
            CRITICAL: '#F87171',
          };

          return (
            <React.Fragment key={event.id}>
              {/* Radius Risk Circle */}
              {showClusters && layerRadius && (
                <Circle
                  center={[event.coordinates.lat, event.coordinates.lng]}
                  radius={event.clusterRadiusKm * 1000}
                  pathOptions={{
                    color: severityColors[event.severity],
                    fillColor: severityColors[event.severity],
                    fillOpacity: isSelected ? 0.22 : 0.1,
                    weight: isSelected ? 2 : 1,
                    dashArray: isSelected ? undefined : '4, 4',
                  }}
                />
              )}

              {/* Pulsing Pin Marker */}
              {layerRadar && (
                <Marker
                  position={[event.coordinates.lat, event.coordinates.lng]}
                  icon={createCustomMarkerIcon(event.severity, event.trustScore, event.title || event.eventName || event.location)}
                  eventHandlers={{
                    click: () => {
                      soundFX.playClick();
                      if (onSelectEvent) onSelectEvent(event);
                    },
                  }}
                >
                  <Popup className="custom-dark-popup">
                    <div className="p-4 bg-[#181822] border border-[#E5A962]/40 rounded-2xl text-slate-100 font-sans shadow-2xl min-w-[250px]">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <SeverityBadge severity={event.severity} size="sm" />
                        <span className="text-[10px] font-mono text-[#E5A962] font-bold px-2 py-0.5 rounded-full bg-[#2A2218] border border-[#E5A962]/30">
                          {event.trustScore}% Trust
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-[#F3D9B5]">{event.eventName}</h4>
                      <p className="text-[11px] text-slate-400 mt-1">{event.location}</p>

                      <div className="grid grid-cols-2 gap-2 my-2.5 py-1.5 border-y border-[#2B2B3C] font-mono text-[10px] text-slate-300">
                        <div>
                          Reports: <span className="text-[#E5A962] font-bold">{event.totalReports}</span>
                        </div>
                        <div>
                          Radius: <span className="text-slate-200 font-bold">{event.clusterRadiusKm} km</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => navigate(`/events/${event.id}`)}
                          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-[#E5A962] to-[#B37B34] text-slate-950 text-xs font-bold transition-all shadow-gold-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Inspect Event Details
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Grid Overlay Header Badge */}
      <div className="absolute top-4 left-4 z-[400] flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#181822]/90 border border-[#2B2B3C] backdrop-blur-md shadow-card-emboss">
        <span className="w-2 h-2 rounded-full bg-[#E5A962] animate-ping" />
        <span className="text-xs font-mono font-bold text-[#F3D9B5]">
          SURVEILLANCE RADAR
        </span>
        <span className="text-[10px] font-mono text-[#E5A962] bg-[#2A2218] px-2 py-0.5 rounded-full border border-[#E5A962]/40 font-bold">
          {events.length} ACTIVE CLUSTERS
        </span>
      </div>

      {/* Map Layer Controls Menu (Top Right) */}
      <div className="absolute top-4 right-4 z-[400]">
        <button
          onClick={() => setShowLayerMenu(!showLayerMenu)}
          className="p-2.5 px-3 rounded-full bg-[#181822]/90 border border-[#2B2B3C] hover:border-[#E5A962]/50 text-slate-300 backdrop-blur-md flex items-center gap-1.5 text-xs font-mono transition-colors shadow-card-emboss"
        >
          <Layers className="w-4 h-4 text-[#E5A962]" />
          <span className="hidden sm:inline font-semibold">Layers</span>
        </button>

        {showLayerMenu && (
          <div className="absolute right-0 mt-2 w-52 p-3.5 bg-[#181822] border border-[#E5A962]/40 rounded-2xl shadow-2xl text-xs font-mono space-y-2.5 animate-fadeIn backdrop-blur-xl">
            <div className="text-[10px] text-slate-400 uppercase font-bold border-b border-[#2B2B3C] pb-1.5">
              Surveillance Overlays
            </div>
            <label className="flex items-center justify-between cursor-pointer text-slate-200 hover:text-[#E5A962]">
              <span>Radar Signal Pins</span>
              <input
                type="checkbox"
                checked={layerRadar}
                onChange={e => setLayerRadar(e.target.checked)}
                className="accent-[#E5A962]"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer text-slate-200 hover:text-[#E5A962]">
              <span>Risk Bounding Radii</span>
              <input
                type="checkbox"
                checked={layerRadius}
                onChange={e => setLayerRadius(e.target.checked)}
                className="accent-[#E5A962]"
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
};
