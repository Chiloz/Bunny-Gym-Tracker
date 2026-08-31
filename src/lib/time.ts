/**
 * Time utility functions for Bunny's Gym Record
 * Bunny: Montana, USA (Mountain Time Zone, America/Denver)
 * Admin: Zambia (Central Africa Time, Africa/Lusaka)
 */

export function getMontanaDate(date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Denver',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const day = parts.find(p => p.type === 'day')?.value || '';
  return `${year}-${month}-${day}`;
}

export function getMontanaDayOfWeek(dateStr?: string): string {
  const dateObj = dateStr ? new Date(`${dateStr}T12:00:00`) : new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Denver',
    weekday: 'long',
  });
  return formatter.format(dateObj);
}

export function isTargetWorkoutDay(dateStr: string): boolean {
  const dayOfWeek = getMontanaDayOfWeek(dateStr);
  // Workout targets: Tue, Wed, Fri, Sat, and Sun.
  // Mon and Thu are Rest/Off Days.
  return ['Tuesday', 'Wednesday', 'Friday', 'Saturday', 'Sunday'].includes(dayOfWeek);
}

export function isRestDay(dateStr: string): boolean {
  return !isTargetWorkoutDay(dateStr);
}

/**
 * Generates an array of date strings (YYYY-MM-DD) from startDateStr to endDateStr (inclusive)
 */
export function getDateRange(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = [];
  const start = new Date(`${startDateStr}T12:00:00`);
  const end = new Date(`${endDateStr}T12:00:00`);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return [];
  }
  
  const current = new Date(start);
  while (current <= end) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

export function getPastTargetDates(startDateStr: string, endDateStr: string): string[] {
  const range = getDateRange(startDateStr, endDateStr);
  return range.filter(d => isTargetWorkoutDay(d));
}

export function formatZambiaTime(date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Lusaka',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatMontanaTime(date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Denver',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

/**
 * Calculates calendar days difference between two YYYY-MM-DD date strings
 * (referenceDateStr minus targetDateStr in days).
 * Positive if targetDateStr is in the past compared to referenceDateStr.
 */
export function getDaysDifference(targetDateStr: string, referenceDateStr: string): number {
  const target = new Date(`${targetDateStr}T12:00:00`);
  const ref = new Date(`${referenceDateStr}T12:00:00`);
  if (isNaN(target.getTime()) || isNaN(ref.getTime())) return 0;
  const diffTime = ref.getTime() - target.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Returns true if a past day is past the 2-day logging grace period and is permanently locked.
 * (e.g. today is day 0, yesterday is day 1, 2 days ago is day 2. Anything 3+ days in the past is locked).
 */
export function isDayLocked(dateStr: string, todayStr: string): boolean {
  if (dateStr >= todayStr) return false;
  const diff = getDaysDifference(dateStr, todayStr);
  return diff > 2;
}

/**
 * Checks if a date falls in September (Montana Fall / Autumn kick-off season).
 */
export function isSeptemberOrFall(dateStr?: string): boolean {
  const dateToCheck = dateStr || getMontanaDate();
  // Month 09 is September (Autumn in Montana)
  return dateToCheck.includes('-09-') || dateToCheck.includes('-10-') || dateToCheck.includes('-11-');
}
