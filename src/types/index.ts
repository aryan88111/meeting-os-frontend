// Roles and Permissions
export type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ActionItemStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type MeetingStatus =
  | 'CREATED'
  | 'WAITING_FOR_TRANSCRIPT'
  | 'TRANSCRIPT_RECEIVED'
  | 'QUEUED'
  | 'PROCESSING'
  | 'AI_COMPLETED'
  | 'DOCUMENT_GENERATING'
  | 'COMPLETED'
  | 'FAILED'
  | 'FAILED_PERMANENT';

export type MeetingSource = 'MANUAL' | 'GOOGLE_MEET' | 'MICROSOFT_TEAMS' | 'ZOOM';

export type DocumentType = 'HTML' | 'PDF' | 'DOCX';

// Canonical Transcript Segment Model
export interface TranscriptSegment {
  id?: string;
  speakerId?: string;
  speakerName?: string;
  text: string;
  startTimeMs?: number;
  endTimeMs?: number;
  confidence?: number;
  sequence: number;
}

// AI Extracted Output Schema
export interface ExtractedTopic {
  title: string;
  summary: string;
  importance: number;
}

export interface ExtractedDecision {
  decision: string;
  context?: string;
  confidence: number;
  sourceSegmentId?: string;
}

export interface ExtractedActionItem {
  description: string;
  assigneeName?: string;
  deadline?: string;
  priority: Priority;
  status: ActionItemStatus;
  sourceSegmentId?: string;
}

export interface ExtractedRisk {
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  sourceSegmentId?: string;
}

export interface ExtractedOpenQuestion {
  question: string;
  owner?: string;
  resolved: boolean;
  sourceSegmentId?: string;
}

export interface MeetingIntelligence {
  executiveSummary: string;
  summary: string;
  topics: ExtractedTopic[];
  decisions: ExtractedDecision[];
  actionItems: ExtractedActionItem[];
  risks: ExtractedRisk[];
  openQuestions: ExtractedOpenQuestion[];
}

export interface Meeting {
  id: string;
  organizationId: string;
  title: string;
  description?: string;
  provider: MeetingSource;
  status: MeetingStatus;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}
