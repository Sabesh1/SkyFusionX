import React from 'react';
import { VerificationFactors } from '../../types/report';
import { ShieldCheck, MapPin, Clock, CloudRain, Users, Camera, Satellite } from 'lucide-react';

interface FactorBreakdownProps {
  factors: VerificationFactors;
  interactive?: boolean;
  onFactorChange?: (factorKey: keyof VerificationFactors, newValue: number) => void;
}

export const FactorBreakdown: React.FC<FactorBreakdownProps> = ({
  factors,
  interactive = false,
  onFactorChange,
}) => {
  const factorConfigs: {
    key: keyof VerificationFactors;
    label: string;
    weight: string;
    icon: React.ElementType;
    description: string;
  }[] = [
    {
      key: 'sourceCredibility',
      label: 'Source Credibility',
      weight: '15%',
      icon: ShieldCheck,
      description: 'Historical reporter accuracy and verification badge weighting',
    },
    {
      key: 'locationMatch',
      label: 'Location Match',
      weight: '20%',
      icon: MapPin,
      description: 'GPS EXIF bounding-box & cell tower triangulations',
    },
    {
      key: 'timestampValidity',
      label: 'Timestamp Validity',
      weight: '15%',
      icon: Clock,
      description: 'Signal latency delta vs telemetry ingestion window',
    },
    {
      key: 'weatherApiMatch',
      label: 'Weather API & AWS Match',
      weight: '15%',
      icon: CloudRain,
      description: 'Corroboration with local Automatic Weather Stations',
    },
    {
      key: 'nearbyReports',
      label: 'Nearby Crowdsource Cluster',
      weight: '10%',
      icon: Users,
      description: 'DBSCAN spatial clustering with neighbouring citizen signals',
    },
    {
      key: 'visualEvidence',
      label: 'Visual Evidence Authenticity',
      weight: '10%',
      icon: Camera,
      description: 'Computer vision waterlevel & hazard mask detection',
    },
    {
      key: 'satelliteCorrelation',
      label: 'Satellite & Radar Correlation',
      weight: '15%',
      icon: Satellite,
      description: 'INSAT-3D infrared cloud top & Doppler reflectivity',
    },
  ];

  return (
    <div className="space-y-3">
      {factorConfigs.map(item => {
        const value = factors[item.key];
        const Icon = item.icon;

        return (
          <div
            key={item.key}
            className="p-3.5 rounded-2xl bg-theme-surface border border-theme-border/80 space-y-2 shadow-card-inset"
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-theme-surface text-theme-primary border border-theme-border">
                  <Icon className="w-3.5 h-3.5 text-theme-primary" />
                </div>
                <div>
                  <span className="font-semibold text-theme-text font-sans">{item.label}</span>
                  <span className="ml-2 text-[10px] font-mono text-theme-muted font-bold">
                    ({item.weight} Weight)
                  </span>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="text-xs font-bold text-theme-text-secondary">{value}%</span>
              </div>
            </div>

            {/* Slider or Capsule Progress Bar */}
            {interactive ? (
              <input
                type="range"
                min="0"
                max="100"
                value={value}
                onChange={e => onFactorChange && onFactorChange(item.key, Number(e.target.value))}
                className="w-full accent-theme-primary h-2 bg-theme-card rounded-full cursor-pointer"
              />
            ) : (
              <div className="w-full h-1.5 bg-theme-card rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-theme-primary-hover to-theme-primary"
                  style={{ width: `${value}%` }}
                />
              </div>
            )}

            <p className="text-[10px] text-theme-muted font-sans truncate">{item.description}</p>
          </div>
        );
      })}
    </div>
  );
};
