import { useEffect, useState, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, Scale, Trophy, Settings as SettingsIcon, 
  Dumbbell, Flame, Sparkles, LogOut, CheckCircle2, AlertTriangle, 
  HelpCircle, User as UserIcon, Upload, ArrowRight, Play, Volume2, Lock
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { 
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, 
  where, getDocs, addDoc, limit, orderBy, onSnapshot 
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../lib/firebase';
import { 
  UserProfile, WorkoutLog, WeightLog, QuizConfig, Penalty, CheerItem, SundayJogLog, GymProof, GymLocation, AppTheme 
} from '../types';
import { 
  getMontanaDate, getMontanaDayOfWeek, isTargetWorkoutDay, 
  isRestDay, getPastTargetDates, getDateRange, formatMontanaTime,
  isDayLocked, isSeptemberOrFall, getDaysDifference 
} from '../lib/time';
import { getRandomPenaltyTask } from '../lib/penalties';

// Component Imports
import BouncingBunnies from '../components/BouncingBunnies';
import FallAutumnTreeBackground from '../components/FallAutumnTreeBackground';
import QuizModal from '../components/QuizModal';
import EgoDeflaterModal from '../components/EgoDeflaterModal';
import PenaltyBox from '../components/PenaltyBox';
import GreetingModal from '../components/GreetingModal';
import SundayJogSection from '../components/SundayJogSection';
import ThemesVault from '../components/ThemesVault';
import GymLocationPicker from '../components/GymLocationPicker';
import RandomGymProofCard from '../components/RandomGymProofCard';
import NotificationSettings from '../components/NotificationSettings';

interface BunnyDashboardProps {
  profile: UserProfile;
  onLogout: () => void;
  isPreviewMode?: boolean;
  onExitPreview?: () => void;
}

export default function BunnyDashboard({ profile: initialProfile, onLogout, isPreviewMode, onExitPreview }: BunnyDashboardProps) {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [activeTab, setActiveTab] = useState<'calendar' | 'cheer' | 'weight' | 'rewards' | 'settings'>('calendar');
  const [activeTheme, setActiveTheme] = useState<AppTheme>(initialProfile.activeTheme || 'emerald');
  const [workoutLogs, setWorkoutLogs] = useState<{ [dateStr: string]: WorkoutLog }>({});
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [cheerVault, setCheerVault] = useState<CheerItem[]>([]);
  const [sundayJogLog, setSundayJogLog] = useState<SundayJogLog | null>(null);
  const [gymProofLog, setGymProofLog] = useState<GymProof | null>(null);
  
  // Greeting Modal
  const [showGreetingModal, setShowGreetingModal] = useState<boolean>(true);

  // Quiz
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [checkInTargetDate, setCheckInTargetDate] = useState<string | null>(null);
  const [quizConfig, setQuizConfig] = useState<QuizConfig>({ q1: '', q2: '', q3: '' });
  
  // Daily Tip & Ego Deflater Text
  const [dailyTip, setDailyTip] = useState("Train hard, stay humble! Let's smash today's goals.");
  const [egoDeflaterMsg, setEgoDeflaterMsg] = useState('');
  
  // Penalty System
  const [activePenalty, setActivePenalty] = useState<Penalty | null>(null);
  
  // Ego Deflater Modal trigger
  const [showEgoDeflater, setShowEgoDeflater] = useState(false);
  const [pendingEgoDeflaterDate, setPendingEgoDeflaterDate] = useState<string>('');
  
  // Weight Input
  const [weightInput, setWeightInput] = useState('');
  const [weightDate, setWeightDate] = useState('');
  const [weightError, setWeightError] = useState('');
  const [weightLoading, setWeightLoading] = useState(false);

  // Profile Upload
  const [profileUploading, setProfileUploading] = useState(false);
  const [profileProgress, setProfileProgress] = useState(0);

  // Sync / loading state
  const [loading, setLoading] = useState(true);

  // Theme change handler
  const handleSelectTheme = async (newTheme: AppTheme) => {
    setActiveTheme(newTheme);
    try {
      await updateDoc(doc(db, 'users', profile.uid), { activeTheme: newTheme });
    } catch (e) {
      console.error("Failed to save theme:", e);
    }
  };

  // Gym location save handler
  const handleSaveGymLocation = async (loc: GymLocation) => {
    try {
      await updateDoc(doc(db, 'users', profile.uid), { gymLocation: loc });
      setProfile(prev => ({ ...prev, gymLocation: loc }));
    } catch (e) {
      console.error("Failed to save gym location:", e);
    }
  };

  // Skip day handler
  const handleUseSkipDay = async () => {
    const currentUsed = profile.usedSkipDaysThisMonth || 0;
    if (currentUsed >= 2) return;
    try {
      await updateDoc(doc(db, 'users', profile.uid), { usedSkipDaysThisMonth: currentUsed + 1 });
      setProfile(prev => ({ ...prev, usedSkipDaysThisMonth: currentUsed + 1 }));
    } catch (e) {
      console.error("Failed to use skip day:", e);
    }
  };

  const montanaToday = getMontanaDate();
  const isSunday = getMontanaDayOfWeek(montanaToday) === 'Sunday' || new Date().getDay() === 0;
  const isFallSeason = isSeptemberOrFall(montanaToday);
  // In September / Fall season, default active theme to 'autumn' unless explicitly chosen otherwise
  const currentTheme = isSunday 
    ? 'pink_floral' 
    : (activeTheme === 'emerald' && isFallSeason)
      ? 'autumn'
      : activeTheme;

  useEffect(() => {
    if (!profile.uid) return;

    // Real-time listener for the user profile (to reflect streak updates, photoUrl, etc)
    const unsubProfile = onSnapshot(doc(db, 'users', profile.uid), (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      }
    });

    // Real-time listener for workouts
    const workoutColRef = collection(db, 'users', profile.uid, 'workouts');
    const unsubWorkouts = onSnapshot(workoutColRef, (snapshot) => {
      const logs: { [dateStr: string]: WorkoutLog } = {};
      snapshot.forEach((doc) => {
        logs[doc.id] = doc.data() as WorkoutLog;
      });
      setWorkoutLogs(logs);
    });

    // Real-time listener for weight logs
    const weightColRef = collection(db, 'users', profile.uid, 'weight_logs');
    const qWeight = query(weightColRef, orderBy('dateStr', 'desc'));
    const unsubWeight = onSnapshot(qWeight, (snapshot) => {
      const logs: WeightLog[] = [];
      snapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() } as WeightLog);
      });
      setWeightLogs(logs);
    });

    // Real-time listener for Cheer Vault
    const cheerColRef = collection(db, 'cheer_vault');
    const unsubCheer = onSnapshot(cheerColRef, (snapshot) => {
      const items: CheerItem[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({ 
          id: doc.id, 
          title: data.title || 'Cheer Broadcast',
          fileUrl: data.fileUrl || '',
          fileType: data.fileType || 'video',
          createdAt: data.createdAt || data.uploadedAt || new Date().toISOString(),
          uploadedAt: data.uploadedAt || data.createdAt,
          ...data 
        } as CheerItem);
      });
      items.sort((a, b) => new Date(b.createdAt || b.uploadedAt || 0).getTime() - new Date(a.createdAt || a.uploadedAt || 0).getTime());
      setCheerVault(items);
    });

    // Real-time listener for Sunday Jog logs
    const sundayJogDocRef = doc(db, 'sunday_jogs', `${profile.uid}_${montanaToday}`);
    const unsubSundayJog = onSnapshot(sundayJogDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setSundayJogLog({ id: docSnap.id, ...docSnap.data() } as SundayJogLog);
      } else {
        setSundayJogLog(null);
      }
    });

    // Real-time listener for Gym Proof logs
    const gymProofDocRef = doc(db, 'gym_proofs', `${profile.uid}_${montanaToday}`);
    const unsubGymProof = onSnapshot(gymProofDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setGymProofLog({ id: docSnap.id, ...docSnap.data() } as GymProof);
      } else {
        setGymProofLog(null);
      }
    });

    // Load configs
    const loadConfigs = async () => {
      try {
        const quizSnap = await getDoc(doc(db, 'config', 'quiz'));
        if (quizSnap.exists()) setQuizConfig(quizSnap.data() as QuizConfig);

        const tipSnap = await getDoc(doc(db, 'config', 'daily_tip'));
        if (tipSnap.exists()) setDailyTip(tipSnap.data().text || dailyTip);

        const egoSnap = await getDoc(doc(db, 'config', 'ego_deflater'));
        if (egoSnap.exists()) setEgoDeflaterMsg(egoSnap.data().text || '');
      } catch (e) {
        console.error("Config load error", e);
      }
    };
    loadConfigs();

    return () => {
      unsubProfile();
      unsubWorkouts();
      unsubWeight();
      unsubCheer();
      unsubSundayJog();
      unsubGymProof();
    };
  }, [profile.uid]);

  // Synchronize past missed workout days and trigger the Penalty and Ego Deflater
  useEffect(() => {
    syncCalendarAndPenalties();
  }, [workoutLogs]);

  const syncCalendarAndPenalties = async () => {
    try {
      // 1. Clean up any stale skipped logs on rest days (Monday and Tuesday)
      // and any auto-marked skipped logs so Bunny's days are never removed automatically.
      const cleanupBatch: Promise<any>[] = [];
      for (const log of Object.values(workoutLogs) as WorkoutLog[]) {
        if (!isTargetWorkoutDay(log.dateStr) && log.status === 'skipped') {
          cleanupBatch.push(
            deleteDoc(doc(db, 'users', profile.uid, 'workouts', log.dateStr))
          );
        }
      }
      if (cleanupBatch.length > 0) {
        await Promise.all(cleanupBatch);
      }

      // 2. Check for active penalties (ONLY manual penalties created by Penguin Admin)
      const penaltyColRef = collection(db, 'penalties');
      const qPenalty = query(
        penaltyColRef, 
        where('uid', '==', profile.uid), 
        where('status', 'in', ['active', 'submitted'])
      );
      const penaltySnap = await getDocs(qPenalty);
      
      let runningPenalty: Penalty | null = null;
      if (!penaltySnap.empty) {
        runningPenalty = { id: penaltySnap.docs[0].id, ...penaltySnap.docs[0].data() } as Penalty;

        const penaltyCreatedDate = runningPenalty.createdAt ? runningPenalty.createdAt.split('T')[0] : '';
        if (runningPenalty.status === 'submitted' && penaltyCreatedDate && penaltyCreatedDate < montanaToday) {
          const penaltyDocRef = doc(db, 'penalties', runningPenalty.id);
          await updateDoc(penaltyDocRef, {
            status: 'cleared',
            resolvedAt: new Date().toISOString(),
            autoApprovedAtReset: true,
          });
          runningPenalty = null;
          setActivePenalty(null);
        } else {
          setActivePenalty(runningPenalty);
        }
      } else {
        setActivePenalty(null);
      }

      // 3. Recalculate streak based on attended workouts
      await recalculateStreaks();

      setLoading(false);
    } catch (e) {
      console.error("Sync error", e);
      setLoading(false);
    }
  };

  const recalculateStreaks = async () => {
    // Collect all historical target days that have logs
    const logs = Object.values(workoutLogs) as WorkoutLog[];
    if (logs.length === 0) return;

    // Filter to target workout days only and sort by date ascending
    const sortedTargetLogs = logs
      .filter(log => isTargetWorkoutDay(log.dateStr))
      .sort((a, b) => a.dateStr.localeCompare(b.dateStr));

    let current = 0;
    let highest = profile.highestStreak || 0;

    for (const log of sortedTargetLogs) {
      if (log.status === 'attended') {
        current++;
        if (current > highest) {
          highest = current;
        }
      } else if (log.status === 'skipped') {
        current = 0; // broken!
      }
    }

    // Save back to user profile
    await updateDoc(doc(db, 'users', profile.uid), {
      currentStreak: current,
      highestStreak: highest
    });
  };

  const handleAcknowledgeEgoDeflater = async () => {
    const targetDate = pendingEgoDeflaterDate;
    setShowEgoDeflater(false);
    setPendingEgoDeflaterDate('');

    try {
      if (targetDate) {
        const userDocRef = doc(db, 'users', profile.uid);
        const userSnap = await getDoc(userDocRef);
        const acknowledged = userSnap.data()?.acknowledgedSkippedDays || [];
        
        const updated = Array.from(new Set([...acknowledged, targetDate].filter(Boolean)));
        await updateDoc(userDocRef, {
          acknowledgedSkippedDays: updated
        });
      }
      
      // Recalculate or resync
      syncCalendarAndPenalties();
    } catch (e) {
      console.error("Acknowledge failed", e);
    }
  };

  const handleCheckInWorkout = async () => {
    // Perform green check-in for targeted date or TODAY in Montana
    try {
      const dateToLog = checkInTargetDate || getMontanaDate();
      const workoutDocRef = doc(db, 'users', profile.uid, 'workouts', dateToLog);
      
      await setDoc(workoutDocRef, {
        dateStr: dateToLog,
        status: 'attended',
        loggedAt: new Date().toISOString()
      });

      setCheckInTargetDate(null);

      // Recalculate streak
      const workoutColRef = collection(db, 'users', profile.uid, 'workouts');
      const workoutSnap = await getDocs(workoutColRef);
      const logs: { [dateStr: string]: WorkoutLog } = {};
      workoutSnap.forEach(d => {
        logs[d.id] = d.data() as WorkoutLog;
      });
      setWorkoutLogs(logs);

      // Trigger streak calculation
      const sortedTargetLogs = Object.values(logs)
        .filter(log => isTargetWorkoutDay(log.dateStr))
        .sort((a, b) => a.dateStr.localeCompare(b.dateStr));

      let current = 0;
      let highest = profile.highestStreak || 0;

      for (const log of sortedTargetLogs) {
        if (log.status === 'attended') {
          current++;
          if (current > highest) {
            highest = current;
          }
        } else if (log.status === 'skipped') {
          current = 0;
        }
      }

      await updateDoc(doc(db, 'users', profile.uid), {
        currentStreak: current,
        highestStreak: highest
      });

      // Show success micro interaction
    } catch (e) {
      console.error("Check-in failed", e);
    }
  };

  const handleWeightSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setWeightError('');
    
    const parsedWeight = parseFloat(weightInput);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      setWeightError("Please enter a valid positive decimal number.");
      return;
    }

    if (!weightDate) {
      setWeightError("Select a date.");
      return;
    }

    const dayName = getMontanaDayOfWeek(weightDate);
    if (dayName !== 'Sunday') {
      setWeightError("Strict Rule: Weight logs must be entered on Sundays only.");
      return;
    }

    setWeightLoading(true);
    try {
      const logId = `${profile.uid}_${weightDate}`;
      await setDoc(doc(db, 'users', profile.uid, 'weight_logs', logId), {
        uid: profile.uid,
        dateStr: weightDate,
        weight: parsedWeight,
        loggedAt: new Date().toISOString()
      });

      setWeightInput('');
      setWeightDate('');
    } catch (err: any) {
      setWeightError(`Failed: ${err.message}`);
    } finally {
      setWeightLoading(false);
    }
  };

  const handleProfilePhotoUpload = async (file: File) => {
    if (!file) return;
    setProfileUploading(true);
    setProfileProgress(0);

    try {
      const photoRef = ref(storage, `users/${profile.uid}/profile_${file.name}`);
      const uploadTask = uploadBytesResumable(photoRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setProfileProgress(pct);
        },
        (err) => {
          console.error("Upload error", err);
          setProfileUploading(false);
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          await updateDoc(doc(db, 'users', profile.uid), {
            photoUrl: downloadUrl
          });
          setProfileUploading(false);
        }
      );
    } catch (e) {
      console.error(e);
      setProfileUploading(false);
    }
  };

  const handleLogoutClick = async () => {
    await signOut(auth);
    onLogout();
  };

  // Build the calendar days of the current month
  const renderCalendarDays = () => {
    // Respect Montana local date/year/month
    const montanaParts = montanaToday.split('-');
    const year = parseInt(montanaParts[0], 10) || new Date().getFullYear();
    const month = (parseInt(montanaParts[1], 10) - 1); // 0-indexed month

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const currentMonthName = monthNames[month] || 'Current Month';

    // Days in this month
    const totalDays = new Date(year, month + 1, 0).getDate();
    const daysArray = [];

    // Pads the start of the week
    const firstDayIndex = new Date(year, month, 1).getDay();
    for (let i = 0; i < firstDayIndex; i++) {
      daysArray.push(null);
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      daysArray.push(dateStr);
    }

    const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
      <div className="space-y-4">
        {/* Month indicator banner */}
        <div className={`flex items-center justify-between text-xs sm:text-sm font-bold px-1 pb-2 border-b ${
          isAutumnActive ? 'border-amber-300/80 text-stone-950' : 'border-emerald-200/80 text-slate-900'
        }`}>
          <span className="font-black tracking-wide flex items-center gap-1.5 text-sm sm:text-base">
            <span>📅 {currentMonthName} {year}</span>
            {month === 8 && <span className="text-amber-950 font-mono text-[11px] bg-amber-200/90 px-2 py-0.5 rounded-full border border-amber-400 font-extrabold shadow-xs">🍁 Fall Season</span>}
          </span>
          <span className={`text-[11px] sm:text-xs font-mono font-extrabold px-2.5 py-1 rounded-full border ${
            isAutumnActive 
              ? 'text-amber-950 bg-amber-200/90 border-amber-400 shadow-xs' 
              : 'text-emerald-900 bg-emerald-100 border-emerald-300'
          }`}>
            🔒 2-Day Lock Active
          </span>
        </div>

        {/* Header weekdays */}
        <div className={`grid grid-cols-7 text-center text-xs font-black font-mono tracking-wider ${
          isAutumnActive ? 'text-stone-950' : 'text-emerald-950'
        }`}>
          {weekdays.map((wd, i) => (
            <div key={i} className="py-0.5">{wd}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 text-center">
          {daysArray.map((dateStr, idx) => {
            if (!dateStr) {
              return <div key={`empty-${idx}`} className="aspect-square" />;
            }

            const dayNum = parseInt(dateStr.split('-')[2], 10);
            const isToday = dateStr === montanaToday;
            const log = workoutLogs[dateStr];
            const isTarget = isTargetWorkoutDay(dateStr);
            const isFuture = dateStr > montanaToday;
            const isLocked = isDayLocked(dateStr, montanaToday);
            const daysDiff = getDaysDifference(dateStr, montanaToday);

            let bgClass = "bg-stone-50/90 text-stone-700 font-bold";
            let borderClass = "border border-stone-300";
            let clickHandler = undefined;
            let badgeText: string | null = null;
            let badgeClass = "";

            if (log) {
              if (log.status === 'attended') {
                if (isAutumnActive) {
                  bgClass = "bg-gradient-to-br from-amber-200/95 to-orange-200/95 text-amber-950 font-black shadow-sm";
                  borderClass = isLocked ? "border-2 border-amber-800" : "border-2 border-orange-600 shadow-orange-300/60";
                  badgeText = isLocked ? "🔒 Smashed" : "Smashed";
                  badgeClass = "text-amber-950 font-black";
                } else {
                  if (isLocked) {
                    bgClass = "bg-emerald-200 text-emerald-950 font-black shadow-xs";
                    borderClass = "border-2 border-emerald-700";
                    badgeText = "🔒 Smashed";
                    badgeClass = "text-emerald-950 font-extrabold";
                  } else {
                    bgClass = "bg-emerald-100 text-emerald-950 font-black";
                    borderClass = "border-2 border-emerald-600 shadow-sm shadow-emerald-200";
                    badgeText = "Smashed";
                    badgeClass = "text-emerald-900 font-black";
                  }
                }
              } else if (log.status === 'skipped') {
                if (isLocked) {
                  bgClass = "bg-rose-200 text-rose-950 font-black shadow-xs";
                  borderClass = "border-2 border-rose-700";
                  badgeText = "🔒 Skipped";
                  badgeClass = "text-rose-950 font-extrabold";
                } else {
                  bgClass = "bg-rose-100 text-rose-950 font-black";
                  borderClass = "border-2 border-rose-600 shadow-sm shadow-rose-200";
                  badgeText = "Skipped";
                  badgeClass = "text-rose-900 font-black";
                }
              }
            } else if (isFuture) {
              if (isTarget) {
                bgClass = isAutumnActive 
                  ? "bg-amber-50/70 text-stone-600 cursor-not-allowed" 
                  : "bg-emerald-50/50 text-emerald-900/60 cursor-not-allowed";
                borderClass = isAutumnActive 
                  ? "border border-amber-400 border-dashed" 
                  : "border border-emerald-300 border-dashed";
              } else {
                bgClass = "bg-amber-100/70 text-amber-950 font-extrabold cursor-not-allowed";
                borderClass = "border border-amber-400 border-dashed";
                badgeText = "OFF 🟧";
                badgeClass = "text-amber-950 bg-amber-300/90 px-1 py-0.5 rounded border border-amber-500 font-extrabold";
              }
            } else if (isToday) {
              if (isTarget) {
                bgClass = isAutumnActive
                  ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black shadow-lg shadow-orange-400/60 animate-pulse"
                  : "bg-emerald-600 text-white font-black shadow-lg shadow-emerald-300 animate-pulse";
                borderClass = isAutumnActive ? "border-2 border-amber-800" : "border-2 border-emerald-700";
                clickHandler = () => {
                  setCheckInTargetDate(dateStr);
                  setIsQuizOpen(true);
                };
                badgeText = "Tap! 🔥";
                badgeClass = "text-white font-black animate-bounce";
              } else {
                bgClass = "bg-amber-200 text-amber-950 font-black shadow-sm";
                borderClass = "border-2 border-amber-500";
                badgeText = "OFF 🟧";
                badgeClass = "text-amber-950 bg-amber-300 font-black px-1 py-0.5 rounded border border-amber-500";
              }
            } else {
              // Past day with no log
              if (isLocked) {
                // Older than 2 days -> PERMANENTLY LOCKED
                if (isTarget) {
                  bgClass = "bg-stone-200/90 text-stone-800 font-black cursor-not-allowed select-none";
                  borderClass = "border border-stone-400 border-dashed";
                  badgeText = "🔒 Missed";
                  badgeClass = "text-stone-950 bg-stone-300 px-1 py-0.5 rounded border border-stone-500 font-mono font-bold";
                } else {
                  bgClass = "bg-amber-100/70 text-amber-950 font-black";
                  borderClass = "border border-amber-300";
                  badgeText = "OFF 🟧";
                  badgeClass = "text-amber-950 bg-amber-200 px-1 py-0.5 rounded border border-amber-400 font-black";
                }
              } else {
                // Past day within 2-day grace window (yesterday or 2 days ago)
                if (isTarget) {
                  bgClass = isAutumnActive
                    ? "bg-amber-100/90 hover:bg-amber-200 text-amber-950 font-black cursor-pointer shadow-xs"
                    : "bg-emerald-100/80 hover:bg-emerald-200 text-emerald-950 font-black cursor-pointer shadow-xs";
                  borderClass = isAutumnActive
                    ? "border-2 border-amber-500 hover:border-orange-600 border-dashed shadow-sm"
                    : "border-2 border-emerald-400 hover:border-emerald-600 border-dashed shadow-xs";
                  clickHandler = () => {
                    setCheckInTargetDate(dateStr);
                    setIsQuizOpen(true);
                  };
                  badgeText = daysDiff === 1 ? "Log (1d)" : "Log (2d)";
                  badgeClass = isAutumnActive
                    ? "text-amber-950 font-black bg-amber-300 px-1 py-0.5 rounded border border-amber-500"
                    : "text-emerald-950 font-black bg-emerald-200 px-1 py-0.5 rounded border border-emerald-400";
                } else {
                  bgClass = "bg-amber-100/80 text-amber-950 font-black";
                  borderClass = "border border-amber-400";
                  badgeText = "OFF 🟧";
                  badgeClass = "text-amber-950 bg-amber-200 px-1 py-0.5 rounded border border-amber-400 font-black";
                }
              }
            }

            return (
              <motion.button
                key={dateStr}
                whileTap={clickHandler ? { scale: 0.93 } : {}}
                onClick={clickHandler}
                disabled={!clickHandler}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative text-sm select-none transition-all ${bgClass} ${borderClass} ${clickHandler ? 'cursor-pointer hover:scale-105 hover:shadow-md' : 'cursor-default'}`}
                title={
                  isLocked && !log && isTarget 
                    ? `Locked: ${dateStr} is past the 2-day logging grace period.` 
                    : undefined
                }
              >
                <span className="font-sans font-black text-xs sm:text-sm">{dayNum}</span>
                
                {badgeText && (
                  <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-tight mt-0.5 ${badgeClass}`}>
                    {badgeText}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeightAnalyticsCard = () => {
    // Sort latest 4 weight logs ascending by date
    const sortedLogs = [...weightLogs]
      .sort((a, b) => a.dateStr.localeCompare(b.dateStr))
      .slice(-4);

    // If less than 4, pad with realistic styling values
    const displayData = [...sortedLogs];
    const mockData = [
      { dateStr: 'Week 1', weight: 132 },
      { dateStr: 'Week 2', weight: 130 },
      { dateStr: 'Week 3', weight: 129 },
      { dateStr: 'Week 4', weight: 128 },
    ];
    
    while (displayData.length < 4) {
      const idx = displayData.length;
      displayData.push({
        id: `mock-${idx}`,
        uid: profile.uid,
        weight: mockData[idx].weight,
        dateStr: mockData[idx].dateStr,
        loggedAt: new Date().toISOString()
      });
    }

    const weights = displayData.map(d => Number(d.weight));
    const maxW = Math.max(...weights) || 150;
    const minW = Math.min(...weights) || 120;
    const diff = maxW - minW || 10;
    
    return (
      <div className={`rounded-[32px] p-6 shadow-md flex flex-col h-60 transition-all ${
        isAutumnActive 
          ? 'bg-white/50 backdrop-blur-xs border border-white/70 shadow-lg shadow-amber-950/5' 
          : 'bg-white/75 backdrop-blur-xs border border-emerald-100/80 shadow-sm'
      }`}>
        <h4 className={`text-xs font-black uppercase mb-4 tracking-widest ${
          isAutumnActive ? 'text-stone-950 font-mono' : 'text-slate-800'
        }`}>Weight Analytics (Sunday Only)</h4>
        
        <div className="flex-1 flex items-end gap-3.5 px-2">
          {displayData.map((log, idx) => {
            const wVal = Number(log.weight);
            const heightPct = minW === maxW 
              ? 60 
              : 45 + ((wVal - minW) / diff) * 45;

            return (
              <div key={log.id} className="flex-1 flex flex-col items-center gap-1 h-full justify-end relative group">
                <span className={`text-[11px] font-black transition-transform group-hover:scale-110 ${
                  isAutumnActive ? 'text-stone-950' : 'text-emerald-950'
                }`}>
                  {wVal} <span className="text-[9px] font-bold">lb</span>
                </span>
                <div 
                  className={`w-full rounded-t-xl transition-all duration-500 ease-out ${
                    isAutumnActive
                      ? idx === displayData.length - 1
                        ? 'bg-gradient-to-t from-orange-600 to-amber-500 shadow-md shadow-orange-300'
                        : idx === displayData.length - 2
                        ? 'bg-amber-500'
                        : idx === displayData.length - 3
                        ? 'bg-amber-400'
                        : 'bg-amber-300'
                      : idx === displayData.length - 1 
                        ? 'bg-emerald-600 shadow-md shadow-emerald-200' 
                        : idx === displayData.length - 2
                        ? 'bg-emerald-400'
                        : idx === displayData.length - 3
                        ? 'bg-emerald-300'
                        : 'bg-emerald-200'
                  }`} 
                  style={{ height: `${heightPct}%` }} 
                />
              </div>
            );
          })}
        </div>

        <div className={`mt-2 pt-2 border-t flex justify-between px-2 text-[10px] sm:text-xs font-black font-mono ${
          isAutumnActive ? 'border-amber-200 text-stone-950' : 'border-slate-200 text-slate-900'
        }`}>
          {displayData.map((log) => {
            const isReal = !log.id.startsWith('mock');
            if (isReal) {
              const parts = log.dateStr.split('-');
              return <span key={log.id}>{parts[1]}/{parts[2]}</span>;
            }
            return <span key={log.id}>{log.dateStr}</span>;
          })}
        </div>
      </div>
    );
  };

  // Determine if active penalty box view is active
  if (activePenalty && (activePenalty.status === 'active' || activePenalty.status === 'submitted')) {
    return (
      <PenaltyBox 
        penalty={activePenalty} 
        onRefresh={syncCalendarAndPenalties}
        isPreviewMode={isPreviewMode}
        onExitPreview={onExitPreview} 
      />
    );
  }

  const themeClassMap: Record<AppTheme, string> = {
    emerald: 'bg-emerald-50 text-slate-800',
    silver: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-slate-100',
    crystal: 'bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-900 text-cyan-50',
    sunrise: 'bg-gradient-to-br from-amber-950 via-slate-900 to-yellow-950 text-amber-50',
    gold: 'bg-gradient-to-br from-yellow-950 via-amber-900 to-slate-950 text-amber-100',
    pink_floral: 'bg-gradient-to-br from-pink-50 via-rose-50/60 to-pink-100/50 text-slate-850',
    autumn: 'bg-gradient-to-br from-amber-100/80 via-orange-50/60 to-amber-50/90 text-stone-900',
  };

  const isAutumnActive = currentTheme === 'autumn' || (isFallSeason && !isSunday);

  return (
    <div className={`min-h-screen relative flex flex-col font-sans transition-colors duration-500 ${isAutumnActive ? 'bg-gradient-to-b from-amber-50/90 via-orange-50/40 to-amber-100/50 text-stone-900' : themeClassMap[currentTheme] || 'bg-emerald-50'}`} id="bunny-dashboard">
      
      {/* Greeting Modal Popup on Login */}
      <GreetingModal 
        isOpen={showGreetingModal} 
        onClose={() => setShowGreetingModal(false)} 
      />

      {/* Fall / Autumn Tree with Smoothly Dropping Leaves Background */}
      {isAutumnActive && (
        <FallAutumnTreeBackground />
      )}

      {/* Top Preview Banner when viewed from Admin */}
      {isPreviewMode && (
        <div className="bg-slate-900 text-white px-6 py-2.5 text-xs font-bold font-mono flex items-center justify-between sticky top-0 z-50 shadow-md border-b border-emerald-500/40">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="tracking-wide">👁️ PREVIEW MODE: Viewing Dashboard as Bunny (Admin View)</span>
          </div>
          {onExitPreview && (
            <button 
              onClick={onExitPreview}
              className="px-3.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[11px] font-bold cursor-pointer transition-all active:scale-95 shadow-xs"
            >
              Exit Preview ✕
            </button>
          )}
        </div>
      )}

      {/* Background floating emojis on Sunday Jogging Theme */}
      {(isSunday || currentTheme === 'pink_floral') && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-35">
          <div className="absolute top-12 left-10 text-3xl animate-bounce" style={{ animationDuration: '3s' }}>🌸</div>
          <div className="absolute top-1/4 right-12 text-3xl animate-bounce" style={{ animationDuration: '4s' }}>🏃‍♀️</div>
          <div className="absolute bottom-1/3 left-16 text-3xl animate-bounce" style={{ animationDuration: '3.5s' }}>👟</div>
          <div className="absolute bottom-12 right-20 text-3xl animate-bounce" style={{ animationDuration: '5s' }}>🌺</div>
          <div className="absolute top-1/2 left-1/3 text-2xl animate-pulse">💖</div>
        </div>
      )}

      {/* Elegant sticky liquid header */}
      <header className={`px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 sticky top-0 z-30 shadow-sm transition-all duration-300 ${
        isAutumnActive 
          ? 'bg-white/55 backdrop-blur-xs border-b border-white/60 shadow-amber-900/5' 
          : 'bg-white/80 backdrop-blur-xs border-b border-emerald-100'
      }`} id="app-header">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg overflow-hidden shrink-0 border ${
            isAutumnActive 
              ? 'bg-amber-500 shadow-amber-300/50 border-amber-400' 
              : 'bg-emerald-500 shadow-emerald-200 border-emerald-400'
          }`}>
            <img src="/icon.svg" alt="Bunny Gym Icon" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className={`text-lg font-black tracking-tight flex items-center gap-1.5 ${
              isAutumnActive ? 'text-stone-950' : 'text-emerald-950'
            }`}>
              <span>Bunny’s Gym Record</span>
              <span className="text-base" title="Bunny">🐰</span>
              {isAutumnActive && (
                <span className="ml-1 text-[11px] font-mono font-black bg-amber-200 text-amber-950 px-2.5 py-0.5 rounded-full border border-amber-400 flex items-center gap-0.5 shadow-xs">
                  🍁 Autumn Edition
                </span>
              )}
            </h1>
            <p className={`text-[10px] font-extrabold uppercase tracking-widest ${
              isAutumnActive ? 'text-stone-700' : 'text-emerald-700'
            }`}>Montana, USA | UTC-7</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end">
          <div className={`text-right border-r pr-4 sm:pr-6 ${isAutumnActive ? 'border-amber-300' : 'border-emerald-200'}`}>
            <p className={`text-[10px] font-black uppercase tracking-wider ${isAutumnActive ? 'text-stone-800' : 'text-slate-700'}`}>Current Streak</p>
            <p className={`text-lg sm:text-2xl font-black leading-none ${isAutumnActive ? 'text-stone-950' : 'text-emerald-700'}`}>
              {profile.currentStreak || 0} <span className={`text-xs sm:text-sm font-bold ${isAutumnActive ? 'text-amber-800' : 'text-emerald-800'}`}>Days</span>
            </p>
          </div>
          
          <div className={`text-right border-r pr-4 sm:pr-6 ${isAutumnActive ? 'border-amber-300' : 'border-emerald-200'}`}>
            <p className={`text-[10px] font-black uppercase tracking-wider ${isAutumnActive ? 'text-stone-800' : 'text-slate-700'}`}>Highest Record</p>
            <p className={`text-lg sm:text-2xl font-black leading-none ${isAutumnActive ? 'text-stone-950' : 'text-slate-900'}`}>
              {profile.highestStreak || 0} <span className="text-xs sm:text-sm font-black text-amber-600">★</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-10 h-10 rounded-full border-2 overflow-hidden flex items-center justify-center shadow-sm ${
                isAutumnActive ? 'border-amber-600 bg-amber-100' : 'border-emerald-500 bg-emerald-50'
              }`}>
                {profile.photoUrl ? (
                  <img src={profile.photoUrl} alt="Bunny Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon className={`w-5 h-5 ${isAutumnActive ? 'text-amber-800' : 'text-emerald-600'}`} />
                )}
              </div>
              <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full animate-pulse ${
                isAutumnActive ? 'bg-amber-600' : 'bg-emerald-500'
              }`} />
            </div>

            <button 
              onClick={handleLogoutClick}
              className={`p-2 rounded-xl transition-all cursor-pointer border ${
                isAutumnActive 
                  ? 'bg-white/80 hover:bg-amber-100 text-stone-800 hover:text-rose-600 border-amber-300' 
                  : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600 hover:text-red-500 border-neutral-200'
              }`}
              id="dashboard-logout-btn"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main 12-Column Layout */}
      <main className="flex-1 p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 w-full max-w-7xl mx-auto relative z-10">
        
        {/* Sidebar Column: Left (col-span-2) */}
        <nav className="col-span-12 md:col-span-2 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none" id="sidebar-navigation">
          {[
            { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
            { id: 'cheer', label: 'Cheer Box', icon: Volume2 },
            { id: 'weight', label: 'Weight Logs', icon: Scale },
            { id: 'rewards', label: 'Achievement Vault', icon: Trophy },
            { id: 'settings', label: 'Settings', icon: SettingsIcon }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2.5 sm:gap-3 px-4 py-3 rounded-2xl transition-all cursor-pointer shrink-0 md:w-full text-left whitespace-nowrap border ${
                  isActive 
                    ? isAutumnActive
                      ? 'bg-gradient-to-r from-amber-800 to-orange-600 text-white shadow-md shadow-orange-950/25 border-amber-900/50'
                      : 'bg-emerald-600 text-white shadow-md shadow-emerald-200 border-emerald-700' 
                    : isAutumnActive
                      ? 'bg-white/95 hover:bg-white text-stone-950 border-amber-300/90 shadow-xs'
                      : 'bg-white hover:bg-emerald-50 text-slate-900 border-emerald-200 shadow-xs'
                }`}
              >
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse hidden md:inline-block shrink-0" />}
                <tab.icon className={`w-4 h-4 shrink-0 ${
                  isActive 
                    ? 'text-white' 
                    : isAutumnActive 
                      ? 'text-amber-800' 
                      : 'text-emerald-700'
                }`} />
                <span className="text-xs sm:text-sm font-black whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
          
          <div className={`hidden md:block mt-auto p-4 rounded-3xl text-white overflow-hidden relative shadow-inner ${
            isAutumnActive ? 'bg-stone-900/85 backdrop-blur-xs border border-amber-500/30' : 'bg-emerald-900'
          }`}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1 font-mono text-amber-300">Penguin Broadcaster</p>
            <p className="text-xs italic leading-relaxed font-bold text-amber-100">"{dailyTip || 'Keep grinding. No excuses!'}"</p>
            <div className={`absolute -right-4 -bottom-4 w-12 h-12 rounded-full blur-xl ${
              isAutumnActive ? 'bg-orange-600/40' : 'bg-emerald-700/50'
            }`}></div>
          </div>
        </nav>

        {/* Central Card Column: Middle (col-span-6) */}
        <section className="col-span-12 md:col-span-6 flex flex-col gap-6">
          <div className={`rounded-[32px] p-4 sm:p-6 shadow-md flex-1 flex flex-col justify-between min-h-[480px] transition-all duration-300 ${
            isAutumnActive 
              ? 'bg-white/50 backdrop-blur-xs border border-white/70 shadow-lg shadow-amber-950/5' 
              : 'bg-white/80 backdrop-blur-xs border border-emerald-100'
          }`}>
            
            {activeTab === 'calendar' && (
              <div className="flex-1 flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className={`text-base font-black flex items-center gap-2 ${
                      isAutumnActive ? 'text-stone-950' : 'text-slate-900'
                    }`}>
                      <CalendarIcon className={`w-5 h-5 ${isAutumnActive ? 'text-amber-700' : 'text-emerald-600'}`} />
                      <span>Current Month <span className="text-stone-500 font-semibold">/ Calendar</span></span>
                    </h2>
                    <div className="flex gap-3 text-[11px] sm:text-xs font-black">
                      <span className={`flex items-center gap-1.5 ${isAutumnActive ? 'text-amber-950' : 'text-emerald-800'}`}>
                        <span className={`w-2 h-2 rounded-full ${isAutumnActive ? 'bg-orange-600' : 'bg-emerald-500'}`} /> Smashed
                      </span>
                      <span className="flex items-center gap-1.5 text-rose-700">
                        <span className="w-2 h-2 rounded-full bg-rose-600" /> Skipped
                      </span>
                    </div>
                  </div>

                  {/* Today Action & Status Banner */}
                  {!isTargetWorkoutDay(montanaToday) ? (
                    <div className={`p-4 mb-4 rounded-2xl flex items-center justify-between shadow-xs ${
                      isAutumnActive 
                        ? 'bg-amber-200/90 border-2 border-amber-400 text-amber-950' 
                        : 'bg-amber-100 border-2 border-amber-300 rounded-2xl text-amber-950'
                    }`}>
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-mono font-black uppercase tracking-widest text-amber-950 block">
                          SCHEDULED OFF DAY / REST DAY 🟧
                        </span>
                        <p className="text-xs font-black text-amber-950">
                          Today ({getMontanaDayOfWeek(montanaToday)}) is your rest day. Stretch, relax, and let your body recover!
                        </p>
                      </div>
                      <button 
                        disabled 
                        className="px-3.5 py-2 bg-amber-300 text-amber-950 text-xs font-black rounded-xl cursor-not-allowed border border-amber-500 shrink-0 shadow-xs"
                      >
                        REST DAY 🟧
                      </button>
                    </div>
                  ) : (
                    <div className={`p-4 mb-4 rounded-2xl flex items-center justify-between shadow-lg ${
                      isAutumnActive 
                        ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-orange-300/50' 
                        : 'bg-emerald-600 text-white shadow-emerald-300'
                    }`}>
                      <div>
                        <span className={`text-[11px] font-mono font-black uppercase tracking-widest block ${
                          isAutumnActive ? 'text-amber-200' : 'text-emerald-200'
                        }`}>
                          TARGET GYM DAY 🟩 ({getMontanaDayOfWeek(montanaToday)})
                        </span>
                        <p className="text-xs font-black">
                          {workoutLogs[montanaToday]?.status === 'attended' 
                            ? "🎉 Gym Attendance Logged! Great job, Bunny!" 
                            : "Step foot in the gym today? Tap to log attendance!"}
                        </p>
                      </div>
                      {workoutLogs[montanaToday]?.status !== 'attended' && (
                        <button 
                          onClick={() => setIsQuizOpen(true)}
                          className={`px-4 py-2 text-xs font-black rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm shrink-0 ${
                            isAutumnActive 
                              ? 'bg-white hover:bg-amber-50 text-stone-950 border border-amber-300' 
                              : 'bg-white hover:bg-emerald-50 text-emerald-900 shadow-xs'
                          }`}
                        >
                          I Went to Gym 🏋️‍♀️
                        </button>
                      )}
                    </div>
                  )}

                  {/* Sunday Jog Section on Sunday */}
                  {isSunday && (
                    <SundayJogSection
                      uid={profile.uid}
                      sundayDateStr={montanaToday}
                      currentJogLog={sundayJogLog}
                      onLogUpdated={syncCalendarAndPenalties}
                    />
                  )}

                  {/* Random Gym Proof Card */}
                  <RandomGymProofCard
                    uid={profile.uid}
                    dateStr={montanaToday}
                    existingProof={gymProofLog}
                    onProofUploaded={syncCalendarAndPenalties}
                  />
                  
                  {renderCalendarDays()}
                </div>

                {/* Target schedule visual indicator block */}
                <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row gap-3 items-center justify-between ${
                  isAutumnActive 
                    ? 'bg-white/60 backdrop-blur-xs border-amber-300/80 text-stone-950' 
                    : 'bg-emerald-50/70 border-emerald-200 text-slate-900'
                }`}>
                  <div>
                    <span className={`text-[10px] font-mono tracking-wider block uppercase font-black ${
                      isAutumnActive ? 'text-amber-950' : 'text-emerald-800'
                    }`}>
                      Target Gym Days (Strict)
                    </span>
                    <div className="flex space-x-1.5 mt-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                        const isTarget = ['Tue', 'Wed', 'Fri', 'Sat', 'Sun'].includes(day);
                        return (
                          <span 
                            key={day}
                            className={`text-[10px] font-black font-sans px-2 py-0.5 rounded-md ${
                              isTarget 
                                ? isAutumnActive
                                  ? 'bg-amber-200 text-amber-950 border border-amber-400 shadow-xs'
                                  : 'bg-emerald-200 text-emerald-950 border border-emerald-300' 
                                : 'bg-amber-100 text-amber-950 border border-amber-300'
                            }`}
                          >
                            {day} {!isTarget ? '🟧 OFF' : '🟩'}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[10px] font-mono tracking-wider block uppercase font-black ${
                      isAutumnActive ? 'text-amber-950' : 'text-emerald-800'
                    }`}>
                      Current Streak Goal
                    </span>
                    <span className={`text-sm font-black block mt-1 ${
                      isAutumnActive ? 'text-stone-950' : 'text-emerald-900'
                    }`}>
                      🔥 {profile.currentStreak || 0} Target Days
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'cheer' && (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`font-sans font-black text-base flex items-center space-x-2 ${
                      isAutumnActive ? 'text-stone-950' : 'text-neutral-950'
                    }`}>
                      <Volume2 className={`w-5 h-5 ${isAutumnActive ? 'text-amber-700' : 'text-emerald-600'}`} />
                      <span>Cheer Box (Penguin's Audio & Video Vault)</span>
                    </h3>
                    <span className={`text-[10px] font-mono font-black px-2.5 py-1 rounded-full uppercase border ${
                      isAutumnActive 
                        ? 'bg-amber-200 text-amber-950 border-amber-300' 
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}>
                      Zambia Support 🇿🇲
                    </span>
                  </div>

                  {cheerVault.length === 0 ? (
                    <div className={`text-center py-12 px-4 rounded-2xl border border-dashed space-y-2 ${
                      isAutumnActive 
                        ? 'bg-white/60 border-amber-300/80 text-stone-950' 
                        : 'bg-emerald-50/50 border-emerald-200 text-slate-700'
                    }`}>
                      <Sparkles className={`w-8 h-8 mx-auto animate-pulse ${
                        isAutumnActive ? 'text-amber-600' : 'text-emerald-500'
                      }`} />
                      <p className="text-xs font-black">The Cheer Box is waiting for Penguin!</p>
                      <p className={`text-[11px] font-semibold ${isAutumnActive ? 'text-stone-700' : 'text-slate-500'}`}>
                        Penguin will upload audio voice notes and video cheers from Zambia to motivate you!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[28rem] overflow-y-auto pr-1">
                      {cheerVault.map((item) => (
                        <div key={item.id} className={`border rounded-2xl p-4 shadow-xs space-y-3 ${
                          isAutumnActive 
                            ? 'bg-white/70 border-amber-200 shadow-xs' 
                            : 'bg-white border-slate-200/80'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2.5">
                              {item.fileType === 'audio' ? (
                                <div className={`p-2.5 rounded-xl ${
                                  isAutumnActive ? 'bg-amber-200 text-amber-900' : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  <Volume2 className="w-4 h-4" />
                                </div>
                              ) : (
                                <div className={`p-2.5 rounded-xl ${
                                  isAutumnActive ? 'bg-orange-200 text-orange-900' : 'bg-teal-100 text-teal-700'
                                }`}>
                                  <Play className="w-4 h-4" />
                                </div>
                              )}
                              <div>
                                <h4 className="text-sm font-black text-stone-950">{item.title}</h4>
                                <span className={`text-[10px] uppercase font-mono font-black ${
                                  isAutumnActive ? 'text-stone-700' : 'text-slate-500'
                                }`}>
                                  {item.fileType === 'audio' ? '🎵 Audio Voice Note' : '🎬 Video Cheer'}
                                </span>
                              </div>
                            </div>
                            <span className={`text-[10px] font-mono font-bold ${
                              isAutumnActive ? 'text-stone-700' : 'text-slate-500'
                            }`}>
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          {item.fileType === 'audio' ? (
                            <audio controls className="w-full h-10 mt-1 animate-fadeIn" id={`audio-player-${item.id}`}>
                              <source src={item.fileUrl} />
                              Your browser does not support audio playback.
                            </audio>
                          ) : (
                            <video controls playsInline className="w-full rounded-2xl overflow-hidden shadow-sm aspect-video bg-black animate-fadeIn" id={`video-player-${item.id}`}>
                              <source src={item.fileUrl} />
                              Your browser does not support video playback.
                            </video>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'weight' && (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className={`font-sans font-black text-base flex items-center space-x-2 mb-4 ${
                    isAutumnActive ? 'text-stone-950' : 'text-neutral-950'
                  }`}>
                    <Scale className={`w-5 h-5 ${isAutumnActive ? 'text-amber-700' : 'text-emerald-600'}`} />
                    <span>Sunday Weight Logging</span>
                  </h3>

                  <form onSubmit={handleWeightSubmit} className="space-y-4">
                    {weightError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-black">
                        {weightError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className={`text-xs font-black block uppercase ${
                          isAutumnActive ? 'text-stone-900' : 'text-neutral-700'
                        }`}>Weight (lbs)</label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={weightInput}
                          onChange={(e) => setWeightInput(e.target.value)}
                          placeholder="e.g. 145.2"
                          className={`w-full px-4 py-3 border rounded-xl text-sm font-black outline-none transition-all ${
                            isAutumnActive 
                              ? 'bg-white/80 border-amber-300 focus:border-amber-600 text-stone-950' 
                              : 'bg-neutral-50 border-neutral-200 focus:border-emerald-500 focus:bg-white text-neutral-800'
                          }`}
                          id="weight-value-input"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className={`text-xs font-black block uppercase ${
                          isAutumnActive ? 'text-stone-900' : 'text-neutral-700'
                        }`}>Log Date (Sunday Only)</label>
                        <input
                          type="date"
                          required
                          value={weightDate}
                          onChange={(e) => setWeightDate(e.target.value)}
                          className={`w-full px-4 py-3 border rounded-xl text-sm font-black outline-none transition-all ${
                            isAutumnActive 
                              ? 'bg-white/80 border-amber-300 focus:border-amber-600 text-stone-950' 
                              : 'bg-neutral-50 border-neutral-200 focus:border-emerald-500 focus:bg-white text-neutral-800'
                          }`}
                          id="weight-date-input"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={weightLoading}
                      className={`w-full py-3 text-white font-black rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center space-x-2 text-sm ${
                        isAutumnActive 
                          ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-orange-300/40' 
                          : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 shadow-emerald-200'
                      }`}
                      id="submit-weight-btn"
                    >
                      {weightLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>Save Sunday Log</span>
                      )}
                    </button>
                  </form>
                </div>

                <div className={`pt-4 border-t ${isAutumnActive ? 'border-amber-200' : 'border-slate-100'}`}>
                  <span className={`text-xs font-black block mb-3 uppercase tracking-wider ${
                    isAutumnActive ? 'text-stone-900' : 'text-neutral-500'
                  }`}>
                    Weight Log History
                  </span>

                  {weightLogs.length === 0 ? (
                    <p className={`text-xs text-center py-6 font-bold ${
                      isAutumnActive ? 'text-stone-700' : 'text-neutral-400'
                    }`}>
                      No weight records logged yet. Make sure to log every Sunday!
                    </p>
                  ) : (
                    <div className={`divide-y max-h-44 overflow-y-auto pr-1 ${
                      isAutumnActive ? 'divide-amber-200/60' : 'divide-neutral-100'
                    }`}>
                      {weightLogs.map((log) => (
                        <div key={log.id} className="py-2.5 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-xl ${
                              isAutumnActive ? 'bg-amber-200 text-amber-900' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                              <Scale className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-sm font-black text-stone-950 block">
                                {log.weight} lbs
                              </span>
                              <span className={`text-[10px] block font-mono font-bold ${
                                isAutumnActive ? 'text-stone-700' : 'text-neutral-500'
                              }`}>
                                Logged on {getMontanaDayOfWeek(log.dateStr)}, {log.dateStr}
                              </span>
                            </div>
                          </div>
                          <span className={`text-xs font-mono font-bold ${
                            isAutumnActive ? 'text-stone-700' : 'text-neutral-400'
                          }`}>
                            {log.loggedAt ? new Date(log.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'rewards' && (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className={`font-sans font-black text-base flex items-center space-x-2 mb-4 ${
                    isAutumnActive ? 'text-stone-950' : 'text-neutral-950'
                  }`}>
                    <Trophy className={`w-5 h-5 ${isAutumnActive ? 'text-amber-700' : 'text-emerald-500'}`} />
                    <span>Achievements Vault</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-4 rounded-2xl text-center space-y-1 border ${
                      isAutumnActive 
                        ? 'bg-amber-100/90 border-amber-300' 
                        : 'bg-emerald-50/50 border-emerald-100'
                    }`}>
                      <span className="text-2xl block">🔥</span>
                      <span className={`text-xs block uppercase font-mono font-bold ${
                        isAutumnActive ? 'text-stone-800' : 'text-neutral-400'
                      }`}>Current Streak</span>
                      <span className={`text-lg font-black block ${
                        isAutumnActive ? 'text-stone-950' : 'text-emerald-800'
                      }`}>
                        {profile.currentStreak || 0} Days
                      </span>
                    </div>

                    <div className={`p-4 rounded-2xl text-center space-y-1 border ${
                      isAutumnActive 
                        ? 'bg-orange-100/90 border-orange-300' 
                        : 'bg-teal-50/50 border-teal-100'
                    }`}>
                      <span className="text-2xl block">👑</span>
                      <span className={`text-xs block uppercase font-mono font-bold ${
                        isAutumnActive ? 'text-stone-800' : 'text-neutral-400'
                      }`}>All-Time High</span>
                      <span className={`text-lg font-black block ${
                        isAutumnActive ? 'text-stone-950' : 'text-teal-800'
                      }`}>
                        {profile.highestStreak || 0} Days
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <span className={`text-xs font-black block uppercase tracking-wider ${
                    isAutumnActive ? 'text-stone-900' : 'text-neutral-400'
                  }`}>
                    Your Unlocked Badges
                  </span>

                  <div className="space-y-2.5 max-h-[12rem] overflow-y-auto pr-1">
                    {[
                      { limit: 1, name: "First Footstep", icon: "🌱", desc: "Smashed 1 Gym Target Day" },
                      { limit: 3, name: "Unstoppable Force", icon: "🚀", desc: "Achieved a 3-Day streak" },
                      { limit: 7, name: "Elite Athlete", icon: "⚡", desc: "Maintained a 7-Day streak" },
                      { limit: 14, name: "God Mode Gym-Goer", icon: "👹", desc: "Crushed a 14-Day streak" }
                    ].map((badge) => {
                      const isUnlocked = (profile.highestStreak || 0) >= badge.limit;
                      return (
                        <div 
                          key={badge.name} 
                          className={`p-3 rounded-2xl border flex items-center space-x-4 transition-all ${
                            isUnlocked 
                              ? isAutumnActive
                                ? 'bg-amber-100/90 border-amber-300 text-stone-950'
                                : 'bg-gradient-to-r from-emerald-50 to-teal-50/30 border-emerald-100 text-neutral-800' 
                              : 'bg-neutral-50/50 border-neutral-100 opacity-40'
                          }`}
                        >
                          <span className="text-2xl">{badge.icon}</span>
                          <div>
                            <h4 className="text-sm font-black leading-tight text-stone-950">
                              {badge.name}
                            </h4>
                            <p className={`text-xs mt-0.5 font-bold ${
                              isAutumnActive ? 'text-stone-700' : 'text-neutral-500'
                            }`}>{badge.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Themes Vault & Milestone Progression */}
                <div className={`pt-4 border-t ${isAutumnActive ? 'border-amber-200' : 'border-slate-100'}`}>
                  <ThemesVault
                    profile={profile}
                    currentStreak={profile.currentStreak || 0}
                    activeTheme={activeTheme}
                    onSelectTheme={handleSelectTheme}
                    onUseSkipDay={handleUseSkipDay}
                  />
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className={`font-sans font-black text-base flex items-center space-x-2 mb-4 ${
                    isAutumnActive ? 'text-stone-950' : 'text-neutral-950'
                  }`}>
                    <SettingsIcon className={`w-5 h-5 ${isAutumnActive ? 'text-amber-700' : 'text-emerald-500'}`} />
                    <span>Gym Profile Configuration</span>
                  </h3>

                  <div className={`flex flex-col items-center justify-center p-4 border border-dashed rounded-2xl space-y-3 ${
                    isAutumnActive 
                      ? 'bg-white/60 border-amber-300' 
                      : 'bg-neutral-50/50 border-neutral-200'
                  }`}>
                    <div className="relative">
                      <div className={`w-20 h-20 rounded-full border-4 overflow-hidden bg-white flex items-center justify-center shadow-md ${
                        isAutumnActive ? 'border-amber-500' : 'border-emerald-400'
                      }`}>
                        {profile.photoUrl ? (
                          <img src={profile.photoUrl} alt="Bunny avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <UserIcon className={`w-10 h-10 ${isAutumnActive ? 'text-amber-500' : 'text-emerald-400'}`} />
                        )}
                      </div>
                      {profileUploading && (
                        <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center text-white">
                          <span className="text-[10px] font-mono font-bold">{profileProgress}%</span>
                        </div>
                      )}
                    </div>

                    <label className={`py-2 px-4 text-xs font-black rounded-xl border cursor-pointer transition-all active:scale-95 shadow-sm ${
                      isAutumnActive 
                        ? 'bg-amber-200 hover:bg-amber-300 text-amber-950 border-amber-400' 
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                    }`}>
                      <Upload className="w-3.5 h-3.5 inline-block mr-1.5" />
                      <span>Upload Profile Photo</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        disabled={profileUploading}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleProfilePhotoUpload(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                    <span className={`text-[10px] font-bold ${
                      isAutumnActive ? 'text-stone-700' : 'text-neutral-400'
                    }`}>Pushed to Firebase Storage</span>
                  </div>
                </div>

                <div className={`space-y-4 pt-2 border-t ${isAutumnActive ? 'border-amber-200' : 'border-slate-100'}`}>
                  <GymLocationPicker 
                    currentGymLocation={profile.gymLocation}
                    onSaveGymLocation={handleSaveGymLocation}
                  />
                  <NotificationSettings 
                    montanaToday={montanaToday}
                    dailyTip={dailyTip}
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Monitoring Card Column: Right (col-span-4) */}
        <aside className="col-span-12 md:col-span-4 flex flex-col gap-6" id="aside-panel">
          {/* Weight Analytics (Sunday Only) bar chart */}
          {renderWeightAnalyticsCard()}
        </aside>
      </main>

      {/* Footer Mini Banner */}
      <footer className={`h-8 flex items-center justify-center gap-6 mt-auto shrink-0 ${
        isAutumnActive ? 'bg-amber-950 border-t border-amber-900' : 'bg-emerald-900'
      }`} id="app-footer">
        <span className={`text-[10px] font-black tracking-[0.2em] uppercase ${
          isAutumnActive ? 'text-amber-300' : 'text-emerald-400'
        }`}>
          No skips. No excuses. Immutable Record.
        </span>
      </footer>

      {/* Psychological Quiz Modal trigger */}
      <QuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        onConfirm={handleCheckInWorkout}
        quizConfig={quizConfig}
      />

      {/* Un-skippable Ego Deflater Modal trigger */}
      <EgoDeflaterModal
        isOpen={showEgoDeflater}
        message={egoDeflaterMsg}
        onAcknowledge={handleAcknowledgeEgoDeflater}
      />
    </div>
  );
}
