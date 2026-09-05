import React, { createContext, useContext, useState, useEffect } from 'react';
import { WeatherReport } from '../types/report';
import { reportApi } from '../services/reportApi';
import { useApp } from './AppContext';

export interface DemoStep {
  step: number;
  title: string;
  route: string;
  description: string;
  highlightAction: string;
  badge: string;
}

export const HACKATHON_DEMO_STEPS: DemoStep[] = [
  {
    step: 1,
    title: 'Command Center Overview',
    route: '/dashboard',
    description: 'National overview showing 12,480 aggregated reports, 78.1% AI verification rate, and active disaster events.',
    highlightAction: 'View animated KPI cards & live India incident map.',
    badge: 'Overview',
  },
  {
    step: 2,
    title: 'Critical Incident Drilldown',
    route: '/events/EVT-TN-01',
    description: '1,248 raw citizen pings clustered into ONE unified Chennai Flash Flood event with 94% Trust Score.',
    highlightAction: 'Inspect telemetry, AWS rain rates (62.4mm/hr) and clustered reports.',
    badge: 'Clustering',
  },
  {
    step: 3,
    title: 'AI Weather Truth Engine',
    route: '/truth-engine',
    description: 'The core innovation: 7-factor Bayesian verification pipeline breaking down sensor, satellite, and GPS matching.',
    highlightAction: 'Test custom scenarios in the Verification Simulator.',
    badge: 'Truth Engine',
  },
  {
    step: 4,
    title: 'Multi-Source Data Fusion',
    route: '/data-fusion',
    description: '6 synchronized pipelines (INSAT-3D, AWS, Doppler Radar, Crowdsource, NWP APIs, Social NLP).',
    highlightAction: 'Inspect 93% multi-modal convergence score for Chennai.',
    badge: 'Data Fusion',
  },
  {
    step: 5,
    title: 'AI Event Clustering & Deduplication',
    route: '/clustering',
    description: 'Spatio-temporal clustering engine reduces 1,248 raw duplicate reports to 1 unified incident (99.4% noise reduction).',
    highlightAction: 'Visualize cluster radius and report source distribution.',
    badge: 'Noise Reduction',
  },
  {
    step: 6,
    title: 'Short-Term Predictive Risk (1-3 Hours)',
    route: '/predictions',
    description: 'AI predictive trajectory anticipating +45% flood accumulation in next 3 hours due to high tide concurrence.',
    highlightAction: 'Review risk trajectory curves and contributing sensor factors.',
    badge: 'AI Forecast',
  },
  {
    step: 7,
    title: 'Dynamic India Risk Heatmap',
    route: '/risk-heatmap',
    description: 'Full-scale interactive meteorological risk surveillance across Indian states and districts.',
    highlightAction: 'Click Tamil Nadu / Maharashtra to reveal localized metrics.',
    badge: 'Heatmap',
  },
  {
    step: 8,
    title: 'Visual Evidence Computer Vision Lab',
    route: '/image-verification',
    description: 'Automated authenticity forensics: EXIF GPS matching, cloud cover cross-check, and flood depth CV bounding boxes.',
    highlightAction: 'Test sample cases: Chennai flood vs Fake Marina tsunami.',
    badge: 'CV Forensics',
  },
  {
    step: 9,
    title: 'Multilingual Warning Broadcast Studio',
    route: '/multilingual-alerts',
    description: 'Instant multi-channel emergency dispatch in 8 Indian languages (Tamil, Hindi, Telugu, Kannada, etc.).',
    highlightAction: 'Switch language to Tamil or Hindi to see instant translation.',
    badge: 'Multilingual',
  },
  {
    step: 10,
    title: 'Grounded AI Weather Assistant Copilot',
    route: '/assistant',
    description: 'Conversational disaster intelligence copilot that cites verified platform sensors, stations, and reports.',
    highlightAction: 'Click "Why is Chennai marked high risk?" to see grounded answer.',
    badge: 'AI Copilot',
  },
  {
    step: 11,
    title: 'Smart Alert Prioritization Matrix',
    route: '/alert-prioritization',
    description: 'Disaster management action matrix triage: Low (Monitor) to Critical (NDRF Emergency Escalation).',
    highlightAction: 'Acknowledge, Escalate, or Broadcast emergency alerts.',
    badge: 'Triage',
  },
];

interface DemoModeContextType {
  isDemoMode: boolean;
  setIsDemoMode: (enabled: boolean) => void;
  toggleDemoMode: () => void;
  liveReports: WeatherReport[];
  totalReportCounter: number;
  verifiedCounter: number;
  isTourActive: boolean;
  setIsTourActive: (active: boolean) => void;
  currentTourStep: number;
  setCurrentTourStep: (step: number) => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  startTour: () => void;
  endTour: () => void;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export const DemoModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToast } = useApp();
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true); // Default to true for smooth hackathon judge demo!
  const [liveReports, setLiveReports] = useState<WeatherReport[]>([]);
  const [totalReportCounter, setTotalReportCounter] = useState<number>(12480);
  const [verifiedCounter, setVerifiedCounter] = useState<number>(9742);

  // Guided tour state
  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [currentTourStep, setCurrentTourStep] = useState<number>(0);

  const toggleDemoMode = () => {
    setIsDemoMode(prev => {
      const next = !prev;
      addToast({
        type: next ? 'success' : 'info',
        title: next ? 'Hackathon Demo Mode Active' : 'Live Data Mode',
        message: next
          ? 'Simulated incoming ground reports & sensor ticker enabled.'
          : 'Standard surveillance monitoring active.',
      });
      return next;
    });
  };

  const startTour = () => {
    setIsTourActive(true);
    setCurrentTourStep(0);
  };

  const endTour = () => {
    setIsTourActive(false);
  };

  const nextTourStep = () => {
    if (currentTourStep < HACKATHON_DEMO_STEPS.length - 1) {
      setCurrentTourStep(prev => prev + 1);
    } else {
      endTour();
    }
  };

  const prevTourStep = () => {
    if (currentTourStep > 0) {
      setCurrentTourStep(prev => prev - 1);
    }
  };

  // Simulated live report generator during Demo Mode
  useEffect(() => {
    if (!isDemoMode) return;

    const interval = setInterval(async () => {
      const newReport = await reportApi.generateMockLiveReport();
      if (newReport) {
        setLiveReports(prev => [newReport, ...prev.slice(0, 20)]);
        setTotalReportCounter(prev => prev + 1);
        if (newReport.status === 'VERIFIED') {
          setVerifiedCounter(prev => prev + 1);
        }
      }
    }, 35000);

    return () => clearInterval(interval);
  }, [isDemoMode]);

  return (
    <DemoModeContext.Provider
      value={{
        isDemoMode,
        setIsDemoMode,
        toggleDemoMode,
        liveReports,
        totalReportCounter,
        verifiedCounter,
        isTourActive,
        setIsTourActive,
        currentTourStep,
        setCurrentTourStep,
        nextTourStep,
        prevTourStep,
        startTour,
        endTour,
      }}
    >
      {children}
    </DemoModeContext.Provider>
  );
};

export const useDemoMode = () => {
  const context = useContext(DemoModeContext);
  if (!context) throw new Error('useDemoMode must be used within DemoModeProvider');
  return context;
};
