import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { DemoModeProvider } from './context/DemoModeContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopNavbar } from './components/layout/TopNavbar';
import { HackathonDemoFlow } from './components/layout/HackathonDemoFlow';
import { SearchModal } from './components/common/SearchModal';
import { ReportDetailModal } from './components/common/ReportDetailModal';
import { ToastContainer } from './components/common/ToastContainer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LiveIntelligencePage } from './pages/LiveIntelligencePage';
import { WeatherEventsPage } from './pages/WeatherEventsPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { TruthEnginePage } from './pages/TruthEnginePage';
import { DataFusionPage } from './pages/DataFusionPage';
import { EventClusteringPage } from './pages/EventClusteringPage';
import { PredictionsPage } from './pages/PredictionsPage';
import { RiskHeatmapPage } from './pages/RiskHeatmapPage';
import { ImageVerificationPage } from './pages/ImageVerificationPage';
import { MultilingualAlertsPage } from './pages/MultilingualAlertsPage';
import { AssistantPage } from './pages/AssistantPage';
import { TimelinePage } from './pages/TimelinePage';
import { AlertPrioritizationPage } from './pages/AlertPrioritizationPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AdminPage } from './pages/AdminPage';

// Persistent Dashboard Command Center Shell with 1400px max width and 8px grid
const DashboardLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#080B10] flex flex-row">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar />
        <main className="flex-1 p-6 md:p-8 max-w-[1400px] w-full mx-auto pb-24">
          <Outlet />
        </main>
      </div>

      {/* Global Modals & Slide-out Drawer */}
      <SearchModal />
      <ReportDetailModal />
      <ToastContainer />
      <HackathonDemoFlow />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <DemoModeProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Landing & Sign-in */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Authenticated / Command Center Shell */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/live-intel" element={<LiveIntelligencePage />} />
              <Route path="/events" element={<WeatherEventsPage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />
              <Route path="/truth-engine" element={<TruthEnginePage />} />
              <Route path="/data-fusion" element={<DataFusionPage />} />
              <Route path="/clustering" element={<EventClusteringPage />} />
              <Route path="/predictions" element={<PredictionsPage />} />
              <Route path="/risk-heatmap" element={<RiskHeatmapPage />} />
              <Route path="/image-verification" element={<ImageVerificationPage />} />
              <Route path="/multilingual-alerts" element={<MultilingualAlertsPage />} />
              <Route path="/assistant" element={<AssistantPage />} />
              <Route path="/timeline" element={<TimelinePage />} />
              <Route path="/alert-prioritization" element={<AlertPrioritizationPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </DemoModeProvider>
    </AppProvider>
  );
};

export default App;
