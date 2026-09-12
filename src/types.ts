export interface Research {
  id: string;
  user_id: string;
  query: string;
  report: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  research_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}
