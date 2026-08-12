export interface WisecraftQuery {
  context: string;
  userIntent: string;
  financialSnapshot?: {
    totalSpentMinor?: number;
    totalSavedMinor?: number;
    categories?: string[];
  };
}

export interface WisecraftResponse {
  reply: string;
  confidence: number;
  source: 'local-deterministic' | 'wisecraft-remote';
  actions?: Array<{ type: string; payload?: unknown }>;
}
