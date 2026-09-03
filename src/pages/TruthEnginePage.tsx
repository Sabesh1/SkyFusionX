import React, { useEffect, useState } from 'react';
import { reportApi } from '../services/reportApi';
import { WeatherReport } from '../types/report';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { TrustScoreGauge } from '../components/common/TrustScoreGauge';
import { StatusBadge, SeverityBadge } from '../components/common/SeverityBadge';
import { VerificationSimulator } from '../components/truthEngine/VerificationSimulator';
import { FactorBreakdown } from '../components/truthEngine/FactorBreakdown';
import { useApp } from '../context/AppContext';
import {
  Cpu,
  ShieldCheck,
  Search,
  Filter,
  FileText,
  Radio,
  ExternalLink,
} from 'lucide-react';

export const TruthEnginePage: React.FC = () => {
  const [reports, setReports] = useState<WeatherReport[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { setSelectedReport } = useApp();

  // Featured flagship verification case (Chennai Flood)
  const featuredReport = reports.find(r => r.id === 'REP-CHE-001') || reports[0];

  useEffect(() => {
    const fetchReports = async () => {
      const data = await reportApi.getLiveReports();
      setReports(data);
    };
    fetchReports();
  }, []);

  const filteredReports = reports.filter(r => {
    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.text.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <Breadcrumbs
        title="AI Weather Truth Engine"
        description="Every incoming crowdsource, sensor, and social report is mathematically verified through a 7-factor Bayesian fusion pipeline to calculate an incontrovertible Trust Score."
      />

      {/* Hero Section: Large Trust Score Gauge (40% Left) + 7 Verification Breakdown (60% Right) */}
      {featuredReport && (
        <div className="p-6 md:p-8 rounded-2xl bg-[#121620] border border-slate-800/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono font-bold uppercase">
                  Flagship Incident Verification
                </span>
                <span className="font-mono text-xs text-slate-500">{featuredReport.id}</span>
              </div>
              <h2 className="text-base font-bold text-slate-100 font-sans">
                "{featuredReport.text}"
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Location: {featuredReport.locationName}, {featuredReport.state} • Source: {featuredReport.source}
              </p>
            </div>

            <button
              onClick={() => setSelectedReport(featuredReport)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A1F2C] hover:bg-slate-800 text-cyan-400 text-xs font-mono font-medium border border-slate-700 transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>Deep Forensic Drawer</span>
            </button>
          </div>

          {/* 40/60 Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left 5 Cols (40%): Hero Trust Score Gauge */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-[#0B0E14] border border-slate-800/80 flex flex-col items-center justify-center text-center space-y-4">
              <TrustScoreGauge
                score={featuredReport.trustScore}
                size="xl"
                verdict="VERIFIED"
                subtext="AI Verification Confidence: HIGH"
              />

              <div className="w-full space-y-2 pt-3 border-t border-slate-800/80 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Ground Station Correlation:</span>
                  <span className="text-emerald-400 font-bold">62.4 mm/hr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">INSAT-3D Thermal Core:</span>
                  <span className="text-cyan-400 font-bold">-74°C squall</span>
                </div>
              </div>
            </div>

            {/* Right 7 Cols (60%): 7 Factor Breakdown Progress Bars */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase font-bold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  7-Factor Independent Bayesian Weights
                </h3>
                <span className="text-[10px] font-mono text-cyan-400">18ms Latency</span>
              </div>
              <FactorBreakdown factors={featuredReport.verificationFactors} interactive={false} />
            </div>
          </div>
        </div>
      )}

      {/* Interactive Verification Simulator Sandbox */}
      <VerificationSimulator />

      {/* Verification Ingestion Table with Spacious 56-64px Row Height */}
      <div className="p-6 md:p-8 rounded-2xl bg-[#121620] border border-slate-800/80 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="text-sm font-mono uppercase font-bold text-slate-100 flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              Incoming Surveillance Ingestion Queue
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any row to open the detailed slide-out forensic drawer.
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filter by keyword..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-[#0B0E14] border border-slate-800 text-xs text-slate-200 outline-none font-mono"
              />
            </div>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#0B0E14] border border-slate-800 text-xs text-slate-300 outline-none font-mono"
            >
              <option value="ALL">All Statuses</option>
              <option value="VERIFIED">Verified</option>
              <option value="REVIEW">Review</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Spacious Table (56-64px row height) */}
        <div className="overflow-x-auto rounded-xl border border-slate-800/80">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#0B0E14] border-b border-slate-800 text-[10px] font-mono uppercase text-slate-400">
              <tr>
                <th className="py-4 px-4">Report & Claim</th>
                <th className="py-4 px-4">Location</th>
                <th className="py-4 px-4">Severity</th>
                <th className="py-4 px-4">Source</th>
                <th className="py-4 px-4">Trust Score</th>
                <th className="py-4 px-4">AI Status</th>
                <th className="py-4 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-normal text-slate-300">
              {filteredReports.map(report => (
                <tr
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className="hover:bg-[#161B28] cursor-pointer transition-colors h-14"
                >
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-semibold text-slate-200 truncate">{report.title}</div>
                    <div className="text-[11px] text-slate-400 font-sans truncate">{report.text}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {report.locationName}
                  </td>
                  <td className="py-3 px-4">
                    <SeverityBadge severity={report.severity} size="sm" />
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                    {report.source}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                    {report.trustScore}%
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={report.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedReport(report);
                      }}
                      className="px-3 py-1 rounded-lg bg-[#1A1F2C] hover:bg-slate-800 text-cyan-400 text-xs font-semibold"
                    >
                      Audit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
