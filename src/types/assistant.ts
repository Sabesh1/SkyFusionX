export interface AssistantSourceChip {
  name: string;
  count?: number | string;
  type: 'stations' | 'reports' | 'satellite' | 'radar' | 'ai' | 'prediction';
}

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  sourceChips?: AssistantSourceChip[];
  relatedEventId?: string;
  relatedReportId?: string;
  quickActions?: { label: string; actionType: string; payload?: string }[];
  isThinking?: boolean;
}
