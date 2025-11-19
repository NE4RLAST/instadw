export interface MonitoredUser {
  id: string;
  username: string;
  lastChecked: Date | null;
  status: 'active' | 'paused' | 'error';
  avatarUrl?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: Date;
  username: string;
  action: 'check' | 'download' | 'upload' | 'error';
  details: string;
  status: 'success' | 'failure' | 'info';
}

export interface ArchivedItem {
  id: string;
  username: string;
  type: 'post' | 'story';
  imageUrl: string;
  caption: string;
  archivedAt: Date;
}

export interface AppState {
  isRunning: boolean;
  checkIntervalMinutes: number;
  users: MonitoredUser[];
  logs: ActivityLog[];
  archivedItems: ArchivedItem[];
}