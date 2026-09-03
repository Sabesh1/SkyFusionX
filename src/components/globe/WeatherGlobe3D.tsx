import React from 'react';
import { ClusteredWeatherEvent } from '../../types/event';
import { Compass, ShieldCheck } from 'lucide-react';

interface WeatherGlobe3DProps {
  events?: ClusteredWeatherEvent[];
  onSelectEvent?: (event: ClusteredWeatherEvent) => void;
  className?: string;
  height?: string;
  autoRotateSpeed?: number;
}

export const WeatherGlobe3D: React.FC<WeatherGlobe3DProps> = ({
  events = [],
  onSelectEvent,
  className = '',
  height = '500px',
}) => {
  return (
    <>
      <style>
        {`
          @keyframes earthRotate {
            0% { background-position: 0 0; }
            100% { background-position: 400px 0; }
          }
          @keyframes twinkling { 0%,100% { opacity:0.1; } 50% { opacity:1; } }
          @keyframes twinkling-slow { 0%,100% { opacity:0.1; } 50% { opacity:1; } }
          @keyframes twinkling-long { 0%,100% { opacity:0.1; } 50% { opacity:1; } }
          @keyframes twinkling-fast { 0%,100% { opacity:0.1; } 50% { opacity:1; } }
        `}
      </style>

      <div
        style={{ height: height || '500px' }}
        className={`relative w-full rounded-2xl overflow-hidden bg-[#070A11] border border-slate-800/80 shadow-sm select-none flex items-center justify-center ${className}`}
      >
        {/* Top Left Professional Satellite Status Badge */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0B101D]/85 border border-slate-800/80 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-mono font-semibold text-slate-200">
            3D EARTH SURVEILLANCE
          </span>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/60 font-semibold">
            LIVE SATELLITE
          </span>
        </div>

        {/* 3D Rotating Globe with Spherical Inset Lighting and Custom Shadows */}
        <div
          className="relative w-[260px] h-[260px] sm:w-[290px] sm:h-[290px] rounded-full overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.2),-5px_0_8px_#c3f4ff_inset,15px_2px_25px_#000_inset,-24px_-2px_34px_#c3f4ff99_inset,250px_0_44px_#00000066_inset,150px_0_38px_#000000aa_inset]"
          style={{
            backgroundImage: "url('https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/globe.jpeg')",
            backgroundSize: "cover",
            backgroundPosition: "left",
            animation: "earthRotate 30s linear infinite",
          }}
        >
          {/* Twinkling Stars */}
          <div
            className="absolute left-[-20px] w-1 h-1 bg-white rounded-full pointer-events-none"
            style={{ animation: "twinkling 3s infinite" }}
          />
          <div
            className="absolute left-[-40px] top-[30px] w-1 h-1 bg-white rounded-full pointer-events-none"
            style={{ animation: "twinkling-slow 2s infinite" }}
          />
          <div
            className="absolute left-[350px] top-[90px] w-1 h-1 bg-white rounded-full pointer-events-none"
            style={{ animation: "twinkling-long 4s infinite" }}
          />
          <div
            className="absolute left-[200px] top-[290px] w-1 h-1 bg-white rounded-full pointer-events-none"
            style={{ animation: "twinkling 3s infinite" }}
          />
          <div
            className="absolute left-[50px] top-[270px] w-1 h-1 bg-white rounded-full pointer-events-none"
            style={{ animation: "twinkling-fast 1.5s infinite" }}
          />
          <div
            className="absolute left-[250px] top-[-50px] w-1 h-1 bg-white rounded-full pointer-events-none"
            style={{ animation: "twinkling-long 4s infinite" }}
          />
          <div
            className="absolute left-[290px] top-[60px] w-1 h-1 bg-white rounded-full pointer-events-none"
            style={{ animation: "twinkling-slow 2s infinite" }}
          />
        </div>

        {/* Bottom Status Hint */}
        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2.5 text-[10px] font-mono text-slate-400 bg-[#0B101D]/75 px-3 py-1.5 rounded-xl border border-slate-800/60 backdrop-blur-md pointer-events-none">
          <div className="flex items-center gap-1">
            <Compass className="w-3 h-3 text-cyan-400" />
            <span>Continuous Orbital Rotation</span>
          </div>
          <span>•</span>
          <span className="text-emerald-400 font-semibold">Live Feed Synced</span>
        </div>
      </div>
    </>
  );
};

export default WeatherGlobe3D;
