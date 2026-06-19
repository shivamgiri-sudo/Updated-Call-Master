// backend/src/models/types.ts
export type Role =
  | 'CEO'
  | 'PROCESS_HEAD'
  | 'BRANCH_MANAGER'
  | 'TL'
  | 'QA_HEAD'
  | 'ANALYST'
  | 'AGENT';

export type ProcessScope = string[] | null; // ['FINNABLE', 'INDIFI'] or null for all
export type BranchScope = string[] | null;  // ['MUMBAI', 'DELHI'] or null for all

export interface DataScope {
  clientId: number;
  processCodes: ProcessScope;
  branchCodes: BranchScope;
}

export type EventType = 'VIEW' | 'EXPORT' | 'EDIT' | 'DELETE' | 'LOGIN' | 'LOGOUT';
export type ResourceType = 'CALL' | 'DASHBOARD' | 'REPORT' | 'USER';

export interface AuditEvent {
  userId: number;
  userEmail: string;
  userRole: string;
  eventType: EventType;
  resourceType: ResourceType;
  resourceId?: string;
  requestPath?: string;
  requestMethod?: string;
  ipAddress?: string;
  userAgent?: string;
  watermarkApplied?: boolean;
  exportFormat?: string;
  rowCount?: number;
}
