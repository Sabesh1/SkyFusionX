import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Radio,
  TriangleAlert,
  Cpu,
  Flame,
  LineChart,
  Layers,
  MapPinned,
  Camera,
  BellRing,
  Bot,
  Clock,
  ShieldAlert,
  BarChart3,
  Server,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useApp();

  const navGroups = [
    {
      group: 'SURVEILLANCE',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Live Intel', path: '/live-intel', icon: Radio },
        { name: 'Weather Events', path: '/events', icon: TriangleAlert },
        { name: 'Risk Heatmap', path: '/risk-heatmap', icon: Flame },
      ],
    },
    {
      group: 'AI TRUTH CORE',
      items: [
        { name: 'Truth Engine', path: '/truth-engine', icon: Cpu },
        { name: 'Data Fusion', path: '/data-fusion', icon: Layers },
        { name: 'Event Clustering', path: '/clustering', icon: MapPinned },
        { name: 'Predictive Risk', path: '/predictions', icon: LineChart },
        { name: 'Visual Forensics', path: '/image-verification', icon: Camera },
      ],
    },
    {
      group: 'OPERATIONS',
      items: [
        { name: 'Alert Broadcasting', path: '/multilingual-alerts', icon: BellRing },
        { name: 'Smart Triage', path: '/alert-prioritization', icon: ShieldAlert },
        { name: 'AI Copilot', path: '/assistant', icon: Bot },
        { name: 'Timeline', path: '/timeline', icon: Clock },
      ],
    },
    {
      group: 'SYSTEM',
      items: [
        { name: 'Analytics', path: '/analytics', icon: BarChart3 },
        { name: 'Health & Admin', path: '/admin', icon: Server },
      ],
    },
  ];

  return (
    <aside
      className={`h-screen sticky top-0 bg-[#0B0E14] border-r border-slate-800/80 flex flex-col justify-between transition-all duration-300 z-40 select-none ${
        isSidebarCollapsed ? 'w-[72px]' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 border-b border-slate-800/80 flex items-center justify-between">
        {!isSidebarCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm">
              <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-sans font-bold text-xs tracking-wide text-slate-100 uppercase">
                Weather Truth
              </h1>
              <p className="text-[10px] font-mono text-cyan-400">National Platform</p>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
        )}

        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors ${
            isSidebarCollapsed ? 'hidden' : 'block'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Groups with 8px Spacing */}
      <div className="flex-1 overflow-y-auto px-3 py-6 space-y-6">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!isSidebarCollapsed && (
              <div className="px-3 text-[10px] font-mono font-semibold tracking-wider text-slate-500 mb-2">
                {group.group}
              </div>
            )}
            {group.items.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* Footer Collapse / System Status */}
      <div className="p-3 border-t border-slate-800/80 bg-[#080B10]">
        {!isSidebarCollapsed ? (
          <div className="flex items-center justify-between px-2 py-1.5 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Grid Online</span>
            </span>
            <span className="text-slate-500">v2.4</span>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="text-slate-500 hover:text-slate-300 p-1"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
