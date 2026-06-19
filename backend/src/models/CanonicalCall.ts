// backend/src/models/CanonicalCall.ts
export type CallSource = 'dialer_inbound' | 'dialer_outbound' | 'external' | 'audit';
export type CallDirection = 'inbound' | 'outbound';

export interface QAParameter {
  category: string;
  parameter: string;
  score: number;
  maxScore: number;
  isFatal: boolean;
  remarks?: string;
}

export interface CanonicalCall {
  // Identity
  id: string;
  source: CallSource;
  sourceId: string;
  sourceTable: string;

  // Timestamps
  callDate: string;           // YYYY-MM-DD
  callTime: string;           // HH:MM:SS
  callDatetime: Date;

  // Participants
  clientId: number;
  processCode: string;
  branchCode: string | null;
  agentCode: string;
  agentName: string;
  customerPhone: string;      // Masked

  // Call flow
  direction: CallDirection;
  campaignName?: string;
  listId?: string;
  leadId?: string;

  // Outcome
  disposition: string;
  status: string;
  subStatus?: string;

  // Metrics (seconds)
  duration: number;
  talkTime: number;
  holdTime: number;
  waitTime?: number;
  ringTime?: number;

  // Quality (nullable)
  qaScore?: number;
  qaAuditorCode?: string;
  qaAuditorName?: string;
  qaDate?: string;
  qaParameters?: QAParameter[];
  fatalErrors?: string[];

  // Evidence
  recordingUrl?: string;
  transcript?: string;
  notes?: string;

  // Metadata
  createdAt: Date;
  indexedAt: Date;
}
