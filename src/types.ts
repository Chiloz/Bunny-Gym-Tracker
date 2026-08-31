export type UserRole = 'admin' | 'user';

export type AppTheme = 'emerald' | 'silver' | 'crystal' | 'sunrise' | 'gold' | 'pink_floral' | 'autumn';

export interface GymLocation {
  lat: number;
  lng: number;
  address: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  photoUrl?: string;
  currentStreak?: number;
  highestStreak?: number;
  joinedAt?: string;
  
  // Theme & Milestone Perks
  activeTheme?: AppTheme;
  unlockedThemes?: AppTheme[];
  usedSkipDaysThisMonth?: number;
  lastSkipMonth?: string;
  
  // Gym Location & Notifications
  gymLocation?: GymLocation;
  notificationsEnabled?: boolean;
}

export interface WorkoutLog {
  dateStr: string; // YYYY-MM-DD
  status: 'attended' | 'skipped' | 'protected_skip';
  loggedAt: string;
}

export interface WeightLog {
  id: string;
  uid: string;
  dateStr: string; // YYYY-MM-DD (typically Sunday)
  weight: number;
  loggedAt: string;
}

export interface SundayJogLog {
  id?: string;
  uid: string;
  dateStr: string; // YYYY-MM-DD (Sunday date)
  startUrl?: string;
  startName?: string;
  middleUrl?: string;
  middleName?: string;
  finishUrl?: string;
  finishName?: string;
  createdAt: string;
  expiresAt: string; // Clean up date (next Saturday)
}

export interface GymProof {
  id?: string;
  uid: string;
  dateStr: string;
  fileUrl: string;
  fileType: 'image' | 'video';
  fileName: string;
  uploadedAt: string;
}

export interface QuizConfig {
  q1: string;
  q2: string;
  q3: string;
}

export interface Penalty {
  id: string;
  uid: string;
  taskDescription: string;
  status: 'active' | 'submitted' | 'cleared';
  createdAt: string;
  resolvedAt?: string;
  
  // 3-part video proof for outward run
  outwardStartUrl?: string;
  outwardMiddleUrl?: string;
  outwardEndUrl?: string;
  
  // 3-part video proof for return journey
  returnStartUrl?: string;
  returnMiddleUrl?: string;
  returnEndUrl?: string;

  // Video names (for display in UI)
  outwardStartName?: string;
  outwardMiddleName?: string;
  outwardEndName?: string;
  returnStartName?: string;
  returnMiddleName?: string;
  returnEndName?: string;
}

export interface CheerItem {
  id: string;
  title: string;
  fileUrl: string;
  fileType: 'audio' | 'video';
  createdAt: string;
  uploadedAt?: string;
}
