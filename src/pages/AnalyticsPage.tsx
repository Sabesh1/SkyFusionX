import React, { useState } from 'react';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Filter,
  Calendar,
  Layers,
  ShieldCheck,
  TrendingUp,
  Share2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AnalyticsPage: React.FC = () => {
  const { addToast } = useApp();
  const [timeFilter, setTimeFilter] = useState('7d');

  const reportsOverTime = [
    { time: '00:00', total: 420, verified: 340, suspicious: 12 },
    { time: '04:00', total: 310, verified: 260, suspicious: 8 },
    { time: '08:00', total: 1450, verified: 1180, suspicious: 42 },
    { time: '12:00', total: 2890, verified: 2310, suspicious: 78 },
    { time: '16:00', total: 2120, verified: 1740, suspicious: 54 },
    { time: '20:00', total: 1840, verified: 1490, suspicious: 36 },
  ];

  const stateWiseEvents = [
    { state: 'Tamil Nadu', events: 8, reports: 3420 },
    { state: 'Maharashtra', events: 6, reports: 2450 },
    { state: 'Telangana', events: 5, reports: 1890 },
    { state: 'Karnataka', events: 4, reports: 1420 },
    { state: 'Kerala', events: 4, reports: 1120 },
    { state: 'Odisha', events: 4, reports: 950 },
    { state: 'Delhi NCR', events: 3, reports: 890 },
  ];

  const eventCategoryData = [
    { name: 'Urban Flooding', value: 42, color: '#EF4444' },
    { name: 'Heavy Rainfall', value: 28, color: '#00E5FF' },
    { name: 'Thunderstorm', value: 16, color: '#F59E0B' },
    { name: 'Cyclone Surge', value: 8, color: '#3B82F6' },
    { name: 'Dust Storm', value: 6, color: '#A855F7' },
  ];

  const sourceContributionData = [
    { source: 'Citizen Mobile App', count: 6840, trustAvg: 88 },
    { source: 'AWS Sensor Nodes', count: 3120, trustAvg: 98 },
    { source: 'Social NLP Stream', count: 1820, trustAvg: 68 },
    { source: 'Doppler Radar Sweeps', count: 460, trustAvg: 96 },
    { source: 'INSAT-3D Satellite', count: 240, trustAvg: 99 },
  ];

  const handleExportCSV = () => {
    addToast({
      type: 'success',
      title: 'CSV Intelligence Export',
      message: 'Generated disaster telemetry CSV dataset (12,480 rows).',
    });
  };

  const handleExportReport = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <Breadcrumbs
        title="Disaster Big Data & Predictive Analytics"
        description="Comprehensive intelligence metrics, multi-source ingestion trends, false-alarm reduction analytics, and state disaster profiles."
        actionButton={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-200 text-xs font-mono transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleExportReport}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono shadow-lg transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Generate Briefing PDF</span>
            </button>
          </div>
        }
      />

      {/* Grid: Ingestion Trends & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Reports Over Time */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-command-card border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-mono uppercase font-bold text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                Signal Ingestion & AI Verification Trajectory
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Verified signals vs Quarantined suspicious reports over past 24 hours.
              </p>
            </div>
            <span className="text-[10px] font-mono text-cyan-400">78.1% AI Truth Rate</span>
          </div>

          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reportsOverTime}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00E5FF" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorVer" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} fontFamily="JetBrains Mono" />
                <YAxis stroke="#64748B" fontSize={11} fontFamily="JetBrains Mono" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0D121F',
                    borderColor: '#00E5FF',
                    borderRadius: '8px',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono' }} />
                <Area type="monotone" dataKey="total" name="Total Ingested" stroke="#00E5FF" fill="url(#colorTotal)" strokeWidth={2} />
                <Area type="monotone" dataKey="verified" name="AI Verified" stroke="#10B981" fill="url(#colorVer)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 4 Cols: Event Type Pie Distribution */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-command-card border border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-xs font-mono uppercase font-bold text-slate-100">
              Disaster Type Breakdown
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Active national risk categorization.</p>
          </div>

          <div className="w-full h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={eventCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {eventCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0D121F',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-300">
            {eventCategoryData.map(item => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="truncate">{item.name} ({item.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: State-Wise Activity & Source Contribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Cols: State-Wise Bar Chart */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-command-card border border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-xs font-mono uppercase font-bold text-slate-100">
              State-Wise Incident Inflow
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Disaster clusters & citizen reports by state.</p>
          </div>

          <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stateWiseEvents} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis type="number" stroke="#64748B" fontSize={11} fontFamily="JetBrains Mono" />
                <YAxis dataKey="state" type="category" stroke="#64748B" fontSize={11} fontFamily="JetBrains Mono" width={90} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0D121F',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="reports" name="Ground Reports" fill="#00E5FF" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 6 Cols: Telemetry Source Contribution */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-command-card border border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-xs font-mono uppercase font-bold text-slate-100">
              Telemetry Ingestion Channel Breakdown
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Throughput volume & average source credibility.</p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {sourceContributionData.map(src => (
              <div key={src.source} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-200">{src.source}</span>
                  <span className="text-cyan-400 font-bold">{src.count.toLocaleString()} pings</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${(src.count / 7000) * 100}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Reliability Baseline:</span>
                  <span className="text-emerald-400 font-bold">{src.trustAvg}% Trust Average</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
