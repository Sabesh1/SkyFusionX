import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface BreadcrumbsProps {
  title?: string;
  description?: string;
  actionButton?: React.ReactNode;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ title, description, actionButton }) => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  const routeNameMap: Record<string, string> = {
    dashboard: 'Dashboard',
    'live-intel': 'Live Intelligence',
    events: 'Weather Events',
    'truth-engine': 'AI Truth Engine',
    'data-fusion': 'Data Fusion',
    clustering: 'Event Clustering',
    predictions: 'Predictive Risk',
    'risk-heatmap': 'Risk Heatmap',
    'image-verification': 'Visual Forensics',
    'multilingual-alerts': 'Multilingual Alerts',
    assistant: 'AI Assistant',
    timeline: 'Timeline',
    'alert-prioritization': 'Alert Prioritization',
    analytics: 'Analytics',
    admin: 'System Health',
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-[#252534] pb-4 select-none">
      <div className="space-y-1">
        {/* Navigation Breadcrumb Trail */}
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
          <Link to="/dashboard" className="hover:text-[#E5A962] transition-colors flex items-center gap-1">
            <Home className="w-3.5 h-3.5 text-[#E5A962]" />
            <span>Command Center</span>
          </Link>

          {pathnames.map((segment, index) => {
            const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
            const isLast = index === pathnames.length - 1;
            const displayName = routeNameMap[segment] || segment;

            return (
              <React.Fragment key={routeTo}>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                {isLast ? (
                  <span className="text-[#E5A962] font-semibold">{displayName}</span>
                ) : (
                  <Link to={routeTo} className="hover:text-[#E5A962] transition-colors">
                    {displayName}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Page Title & Subtitle */}
        {title && (
          <h1 className="text-xl md:text-2xl font-bold font-display tracking-tight text-[#EEEEF2]">
            {title}
          </h1>
        )}
        {description && (
          <p className="text-xs md:text-sm text-slate-400 font-sans max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actionButton && <div className="flex items-center gap-2 self-start md:self-center">{actionButton}</div>}
    </div>
  );
};
