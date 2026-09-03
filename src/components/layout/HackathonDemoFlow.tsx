import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemoMode, HACKATHON_DEMO_STEPS } from '../../context/DemoModeContext';
import { Play, ChevronLeft, ChevronRight, X, Sparkles, CheckCircle2 } from 'lucide-react';

export const HackathonDemoFlow: React.FC = () => {
  const { isTourActive, currentTourStep, nextTourStep, prevTourStep, endTour } = useDemoMode();
  const navigate = useNavigate();

  if (!isTourActive) return null;

  const current = HACKATHON_DEMO_STEPS[currentTourStep];
  const total = HACKATHON_DEMO_STEPS.length;
  const progressPct = ((currentTourStep + 1) / total) * 100;

  const handleStepJump = (targetIndex: number) => {
    const step = HACKATHON_DEMO_STEPS[targetIndex];
    navigate(step.route);
  };

  const handleNext = () => {
    const nextIdx = currentTourStep + 1;
    if (nextIdx < total) {
      navigate(HACKATHON_DEMO_STEPS[nextIdx].route);
    }
    nextTourStep();
  };

  const handlePrev = () => {
    const prevIdx = currentTourStep - 1;
    if (prevIdx >= 0) {
      navigate(HACKATHON_DEMO_STEPS[prevIdx].route);
    }
    prevTourStep();
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-3xl bg-[#0D1322]/95 border-2 border-purple-500/80 rounded-2xl shadow-[0_0_40px_rgba(168,85,247,0.3)] backdrop-blur-xl p-4 animate-fadeIn">
      {/* Top progress line */}
      <div className="w-full h-1.5 bg-slate-800 rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 via-cyan-400 to-emerald-400 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Step details */}
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-mono font-bold uppercase">
              Judge Tour • Step {current.step} of {total} ({current.badge})
            </span>
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              {current.title}
            </h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">{current.description}</p>
          <p className="text-[11px] font-mono text-cyan-300 flex items-center gap-1 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            Recommended action: {current.highlightAction}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            onClick={handlePrev}
            disabled={currentTourStep === 0}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg transition-all"
          >
            <span>{currentTourStep === total - 1 ? 'Finish Tour' : 'Next Step'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={endTour}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
            title="Close Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
