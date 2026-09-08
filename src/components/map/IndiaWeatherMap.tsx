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
  selectedStateBounds?: [[number, number], [number, number]];
}

// Custom map view controller for smooth panning
const MapController: React.FC<{ center: [number, number]; zoom: number; bounds?: [[number, number], [number, number]] }> = ({ center, zoom, bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      const [southWest, northEast] = bounds;
      const targetBounds = L.latLngBounds([southWest[0], southWest[1]], [northEast[0], northEast[1]]);
      map.fitBounds(targetBounds, { padding: [30, 30], animate: true });
      return;
    }
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, bounds, map]);
  return null;
};

// Create custom luxury gold pulsing HTML markers
const createCustomMarkerIcon = (severity: SeverityLevel, trustScore: number, name: string) => {
  const colorMap: Record<SeverityLevel, { ring: string; dot: string; shadow: string }> = {
    LOW: { ring: 'border-emerald-400', dot: 'bg-emerald-400', shadow: 'rgba(52,211,153,0.6)' },
    MODERATE: { ring: 'border-theme-primary', dot: 'bg-theme-primary', shadow: 'rgba(13, 148, 136, 0.7)' },
    HIGH: { ring: 'border-amber-400', dot: 'bg-amber-400', shadow: 'rgba(251,191,36,0.7)' },
    CRITICAL: { ring: 'border-red-500', dot: 'bg-red-500', shadow: 'rgba(239,68,68,0.8)' },
  };

  const c = colorMap[severity] || colorMap.MODERATE;

  const html = `
    <div class="relative w-full h-full flex items-center justify-center cursor-pointer group">
      <div class="absolute w-9 h-9 rounded-full border ${c.ring} opacity-75 animate-ping"></div>
      <div class="absolute w-7 h-7 rounded-full border ${c.ring} opacity-40"></div>
      <div class="w-4 h-4 rounded-full ${c.dot}" style="box-shadow: 0 0 14px ${c.shadow};">
      </div>
      <div class="absolute top-5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full bg-theme-surface/95 border border-theme-border/80 text-[10px] font-mono text-theme-text pointer-events-none shadow-card-emboss backdrop-blur-md">
        ${name.split(' ')[0]} <span class="text-theme-primary font-bold">${trustScore}%</span>
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
  selectedStateBounds,
}) => {
  const navigate = useNavigate();
  const [layerRadar, setLayerRadar] = useState(true);
  const [layerRadius, setLayerRadius] = useState(true);
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-theme-border/80 bg-theme-bg shadow-card-emboss">
      <MapContainer
        center={center}
        zoom={zoomLevel}
        style={{ height, width: '100%', background: 'var(--theme-bg)' }}
        zoomControl={false}
      >
        <MapController center={center} zoom={zoomLevel} bounds={selectedStateBounds} />

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
            MODERATE: 'var(--theme-primary)',
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
                    <div className="p-4 bg-theme-surface border border-theme-primary/40 rounded-2xl text-theme-text font-sans shadow-2xl min-w-[250px]">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <SeverityBadge severity={event.severity} size="sm" />
                        <span className="text-[10px] font-mono text-theme-primary font-bold px-2 py-0.5 rounded-full bg-theme-surface border border-theme-primary/30">
                          {event.trustScore}% Trust
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-theme-text-secondary">{event.eventName}</h4>
                      <p className="text-[11px] text-theme-muted mt-1">{event.location}</p>

                      <div className="grid grid-cols-2 gap-2 my-2.5 py-1.5 border-y border-theme-border/80 font-mono text-[10px] text-theme-text">
                        <div>
                          Reports: <span className="text-theme-primary font-bold">{event.totalReports}</span>
                        </div>
                        <div>
                          Radius: <span className="text-theme-text font-bold">{event.clusterRadiusKm} km</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => navigate(`/events/${event.id}`)}
                          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-theme-primary to-theme-primary-hover text-white text-xs font-bold transition-all shadow-primary-sm"
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
      <div className="absolute top-4 left-4 z-[400] flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-theme-surface/90 border border-theme-border/80 backdrop-blur-md shadow-card-emboss">
        <span className="w-2 h-2 rounded-full bg-theme-primary animate-ping" />
        <span className="text-xs font-mono font-bold text-theme-text-secondary">
          SURVEILLANCE RADAR
        </span>
        <span className="text-[10px] font-mono text-theme-primary bg-theme-surface px-2 py-0.5 rounded-full border border-theme-primary/40 font-bold">
          {events.length} ACTIVE CLUSTERS
        </span>
      </div>

      {/* Map Layer Controls Menu (Top Right) */}
      <div className="absolute top-4 right-4 z-[400]">
        <button
          onClick={() => setShowLayerMenu(!showLayerMenu)}
          className="p-2.5 px-3 rounded-full bg-theme-surface/90 border border-theme-border/80 hover:border-theme-primary/50 text-theme-text backdrop-blur-md flex items-center gap-1.5 text-xs font-mono transition-colors shadow-card-emboss"
        >
          <Layers className="w-4 h-4 text-theme-primary" />
          <span className="hidden sm:inline font-semibold">Layers</span>
        </button>

        {showLayerMenu && (
          <div className="absolute right-0 mt-2 w-52 p-3.5 bg-theme-surface border border-theme-primary/40 rounded-2xl shadow-2xl text-xs font-mono space-y-2.5 animate-fadeIn backdrop-blur-xl">
            <div className="text-[10px] text-theme-muted uppercase font-bold border-b border-theme-border/80 pb-1.5">
              Surveillance Overlays
            </div>
            <label className="flex items-center justify-between cursor-pointer text-theme-text hover:text-theme-primary">
              <span>Radar Signal Pins</span>
              <input
                type="checkbox"
                checked={layerRadar}
                onChange={e => setLayerRadar(e.target.checked)}
                className="accent-theme-primary"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer text-theme-text hover:text-theme-primary">
              <span>Risk Bounding Radii</span>
              <input
                type="checkbox"
                checked={layerRadius}
                onChange={e => setLayerRadius(e.target.checked)}
                className="accent-theme-primary"
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
};
