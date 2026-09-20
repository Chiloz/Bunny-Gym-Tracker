export type UserRole = 'admin' | 'user';

export type AppTheme = 'emerald' | 'silver' | 'crystal' | 'sunrise' | 'gold' | 'pink_floral' | 'autumn' | 'pumpkin_spice';

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

export interface DailyCheckinEntry {
  id: string;
  dateStr: string; // YYYY-MM-DD
  dateFormatted: string; // e.g. "Monday, September 14"
  submittedAt: string;
  uid?: string;
  userName?: string;
  
  // Food
  ate: boolean;
  mealCount: number;
  whatAte: string;
  
  // Movement
  morningExercise: boolean;
  gym: boolean;
  caloriesBurned?: number | null;
  water: boolean;
  
  // Progress
  lostWeight: boolean;
  weightDelta?: number | null;
  weightUnit?: 'kg' | 'lb';
  
  // Energy
  energyMorning: number; // 1-10
  energyNow: number; // 1-10
  energyDiff: number; // energyNow - energyMorning
  goodDay: boolean;
  
  // Note
  note: string;

  // Custom question responses if any
  customAnswers?: Record<string, any>;
}

export interface CheckinQuestionItem {
  id: string;
  label: string;
  on: boolean;
  category: 'food' | 'movement' | 'progress' | 'energy' | 'note' | 'custom';
}

export interface EmailReminderConfig {
  recipientEmail: string;
  enabled: boolean;
  targetHour: number; // 0-23 in Montana time (e.g. 19 = 7 PM)
  customNote?: string;
  lastSentDate?: string;
}

export type ScheduledEmailType = 'morning_6am' | 'hydrated_1pm' | 'movement_4pm' | 'checkin_930pm';

export interface EmailTemplateItem {
  id: ScheduledEmailType;
  timeLabel: string;
  title: string;
  defaultSubject: string;
  defaultHeadline: string;
  defaultBadge: string;
  defaultSubtitle: string;
  defaultParagraphs: string[];
  defaultCalloutTitle?: string;
  defaultCalloutContent?: string;
  defaultQuote?: string;

  // Custom overrides (if modified by coach)
  customSubject?: string;
  customHeadline?: string;
  customSubtitle?: string;
  customBadge?: string;
  customParagraphs?: string[];
  customCalloutTitle?: string;
  customCalloutContent?: string;
  customQuote?: string;
  isCustomized?: boolean;
}

export interface SurpriseEmailPayload {
  toEmail?: string;
  subject: string;
  headline: string;
  subtitle?: string;
  badge?: string;
  messageText: string;
  calloutTitle?: string;
  calloutContent?: string;
  quote?: string;
  includeCheckinLink?: boolean;
}
