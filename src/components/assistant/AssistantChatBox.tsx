import React, { useState, useRef, useEffect } from 'react';
import { assistantApi } from '../../services/assistantApi';
import { AssistantMessage, AssistantSourceChip } from '../../types/assistant';
import { Bot, User, Send, Database } from 'lucide-react';
import { soundFX } from '../../utils/soundEffects';

export const AssistantChatBox: React.FC = () => {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'msg-init-1',
      sender: 'assistant',
      text: 'AI Weather Assistant initialized and synchronized with ISRO INSAT-3D, 1,284 Automatic Weather Stations, and Bayesian Truth Engine. How can I assist with your disaster operational brief?',
      timestamp: new Date().toISOString(),
      sourceChips: [
        { name: '1,284 AWS Stations', type: 'stations' },
        { name: 'INSAT-3D Satellite', type: 'satellite' },
        { name: 'Truth Engine v2', type: 'ai' },
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    soundFX.playClick();
    setInput('');

    const userMsg: AssistantMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const botResponse = await assistantApi.askWeatherAssistant(query, [...messages, userMsg]);
      setIsTyping(false);
      setMessages(prev => [...prev, botResponse]);
      soundFX.playSuccess();
    } catch {
      setIsTyping(false);
    }
  };

  const sampleQueries = [
    'Why is Chennai marked high risk?',
    'Show flood-related reports from the last 6 hours',
    'Which events have the lowest trust scores?',
    'What are the recommended actions for Mumbai?',
  ];

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[640px] rounded-2xl bg-[#121620] border border-slate-800/80 shadow-sm overflow-hidden">
      {/* Chat Header */}
      <div className="h-14 px-6 bg-[#0B0E14] border-b border-slate-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold font-sans text-slate-100 uppercase tracking-wide">
              Grounded AI Weather Assistant
            </h3>
            <p className="text-[10px] font-mono text-cyan-400">Zero Hallucination • Cites Live Telemetry</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Live Ops</span>
        </div>
      </div>

      {/* Messages Stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start gap-3.5 max-w-3xl ${
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.sender === 'user'
                  ? 'bg-slate-800 text-slate-200 border border-slate-700'
                  : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div
              className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed space-y-2.5 font-sans ${
                msg.sender === 'user'
                  ? 'bg-cyan-500/10 border border-cyan-500/30 text-slate-100 rounded-tr-none'
                  : 'bg-[#0B0E14] border border-slate-800/80 text-slate-200 rounded-tl-none'
              }`}
            >
              <div className="whitespace-pre-line">{msg.text}</div>

              {/* Verified Telemetry Citations */}
              {msg.sourceChips && msg.sourceChips.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider block">
                    Verified Sensor Citations:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.sourceChips.map((cite: AssistantSourceChip, idx: number) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-[#121620] border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center gap-1"
                      >
                        <Database className="w-3 h-3 text-cyan-400" />
                        {cite.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-[10px] font-mono text-slate-500 text-right">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 p-3 bg-[#0B0E14] border border-slate-800/80 rounded-2xl w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>AI Copilot querying 1,284 weather stations & Truth Engine...</span>
          </div>
        )}
      </div>

      {/* Suggested Questions Ribbon */}
      <div className="px-6 py-2 bg-[#0B0E14]/60 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto text-[11px] font-mono">
        <span className="text-slate-500 shrink-0">Try:</span>
        {sampleQueries.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="px-3 py-1 rounded-full bg-[#121620] hover:bg-[#1A1F2C] border border-slate-800 text-slate-300 hover:text-cyan-300 shrink-0 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSend();
        }}
        className="p-4 bg-[#0B0E14] border-t border-slate-800/80 flex items-center gap-3 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about weather events, truth scores, AWS sensor telemetry..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-[#121620] border border-slate-800 text-xs text-slate-200 outline-none focus:border-cyan-500/50 font-sans"
        />
        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-semibold text-xs font-mono transition-all flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};
