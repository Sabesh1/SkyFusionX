import React from 'react';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { AssistantChatBox } from '../components/assistant/AssistantChatBox';
import { Bot, ShieldCheck, Sparkles, Database } from 'lucide-react';

export const AssistantPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Breadcrumbs
        title="AI Weather Assistant Copilot"
        description="Grounded conversational intelligence engine for disaster commanders and municipal operators, powered exclusively by verified platform telemetry and sensor readings."
      />

      {/* Main Chat Interface */}
      <AssistantChatBox />
    </div>
  );
};
