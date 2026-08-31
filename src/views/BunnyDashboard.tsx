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
        <div className="flex items-center justify-between text-xs font-bold px-1 pb-1 border-b border-emerald-100/70">
          <span className="font-extrabold text-slate-800 tracking-wide flex items-center gap-1.5">
            <span>📅 {currentMonthName} {year}</span>
            {month === 8 && <span className="text-amber-600 font-mono text-[11px]">🍁 Fall Season</span>}
          </span>
          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            🔒 2-Day Lock Active
          </span>
        </div>

        {/* Header weekdays */}
        <div className="grid grid-cols-7 text-center text-xs font-bold text-emerald-800/60 font-mono tracking-wider">
          {weekdays.map((wd, i) => (
            <div key={i}>{wd}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-2.5 text-center">
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

            let bgClass = "bg-neutral-50 text-neutral-400";
            let borderClass = "border border-neutral-100";
            let clickHandler = undefined;
            let badgeText: string | null = null;
            let badgeClass = "";

            if (log) {
              if (log.status === 'attended') {
                if (isLocked) {
                  bgClass = "bg-emerald-100 text-emerald-950 font-bold shadow-xs";
                  borderClass = "border-2 border-emerald-600";
                  badgeText = "🔒 Smashed";
                  badgeClass = "text-emerald-800 font-extrabold";
                } else {
                  bgClass = "bg-emerald-50 text-emerald-900 font-bold";
                  borderClass = "border-2 border-emerald-500 shadow-sm shadow-emerald-100";
                  badgeText = "Smashed";
                  badgeClass = "text-emerald-600 font-bold";
                }
              } else if (log.status === 'skipped') {
                if (isLocked) {
                  bgClass = "bg-rose-100 text-rose-950 font-bold shadow-xs";
                  borderClass = "border-2 border-rose-600";
                  badgeText = "🔒 Skipped";
                  badgeClass = "text-rose-800 font-extrabold";
                } else {
                  bgClass = "bg-rose-50 text-rose-900 font-bold";
                  borderClass = "border-2 border-rose-500 shadow-sm shadow-rose-100";
                  badgeText = "Skipped";
                  badgeClass = "text-rose-600 font-bold";
                }
              }
            } else if (isFuture) {
              if (isTarget) {
                bgClass = "bg-emerald-50/30 text-emerald-800/50 cursor-not-allowed";
                borderClass = "border border-emerald-200/50 border-dashed";
              } else {
                bgClass = "bg-amber-50/40 text-amber-700/60 cursor-not-allowed";
                borderClass = "border border-amber-200/60 border-dashed";
                badgeText = "OFF 🟧";
                badgeClass = "text-amber-700 bg-amber-100/80 px-1 py-0.5 rounded border border-amber-300/80";
              }
            } else if (isToday) {
              if (isTarget) {
                bgClass = "bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-200 animate-pulse";
                borderClass = "border-2 border-emerald-500";
                clickHandler = () => {
                  setCheckInTargetDate(dateStr);
                  setIsQuizOpen(true);
                };
                badgeText = "Tap! 🔥";
                badgeClass = "text-white font-black animate-bounce";
              } else {
                bgClass = "bg-amber-100/90 text-amber-900 font-bold shadow-xs";
                borderClass = "border-2 border-amber-400";
                badgeText = "OFF 🟧";
                badgeClass = "text-amber-800 bg-amber-200/70 px-1 py-0.5 rounded border border-amber-400/80";
              }
            } else {
              // Past day with no log
              if (isLocked) {
                // Older than 2 days -> PERMANENTLY LOCKED
                if (isTarget) {
                  bgClass = "bg-slate-100/90 text-slate-400 font-medium cursor-not-allowed select-none opacity-85";
                  borderClass = "border border-slate-300 border-dashed";
                  badgeText = "🔒 Missed";
                  badgeClass = "text-slate-500 bg-slate-200/80 px-1 py-0.5 rounded border border-slate-300 font-mono";
                } else {
                  bgClass = "bg-amber-50/50 text-amber-900/60";
                  borderClass = "border border-amber-200/60";
                  badgeText = "OFF 🟧";
                  badgeClass = "text-amber-700 bg-amber-100/80 px-1 py-0.5 rounded border border-amber-300/80";
                }
              } else {
                // Past day within 2-day grace window (yesterday or 2 days ago)
                if (isTarget) {
                  bgClass = "bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 font-medium cursor-pointer";
                  borderClass = "border-2 border-emerald-300 hover:border-emerald-500 border-dashed shadow-xs";
                  clickHandler = () => {
                    setCheckInTargetDate(dateStr);
                    setIsQuizOpen(true);
                  };
                  badgeText = daysDiff === 1 ? "Log (1d)" : "Log (2d)";
                  badgeClass = "text-emerald-700 font-extrabold bg-emerald-100 px-1 py-0.2 rounded border border-emerald-300";
                } else {
                  bgClass = "bg-amber-50/60 text-amber-900 font-medium";
                  borderClass = "border border-amber-200/80";
                  badgeText = "OFF 🟧";
                  badgeClass = "text-amber-700 bg-amber-100/80 px-1 py-0.5 rounded border border-amber-300/80";
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
                  <span className={`text-[7px] uppercase tracking-tighter mt-0.5 ${badgeClass}`}>
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
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-emerald-100 flex flex-col h-60">
        <h4 className="text-xs font-black uppercase text-slate-400 mb-4 tracking-widest">Weight Analytics (Sunday Only)</h4>
        
        <div className="flex-1 flex items-end gap-3.5 px-2">
          {displayData.map((log, idx) => {
            const wVal = Number(log.weight);
            const heightPct = minW === maxW 
              ? 60 
              : 45 + ((wVal - minW) / diff) * 45;

            return (
              <div key={log.id} className="flex-1 flex flex-col items-center gap-1 h-full justify-end relative group">
                <span className="text-[10px] font-black text-emerald-800 transition-transform group-hover:scale-110">
                  {wVal} <span className="text-[8px] font-medium">lb</span>
                </span>
                <div 
                  className={`w-full rounded-t-xl transition-all duration-500 ease-out ${
                    idx === displayData.length - 1 
                      ? 'bg-emerald-500 shadow-lg shadow-emerald-100' 
                      : idx === displayData.length - 2
                      ? 'bg-emerald-300'
                      : idx === displayData.length - 3
                      ? 'bg-emerald-200'
                      : 'bg-emerald-100'
                  }`} 
                  style={{ height: `${heightPct}%` }} 
                />
              </div>
            );
          })}
        </div>

        <div className="mt-2 pt-2 border-t border-slate-50 flex justify-between px-2 text-[8px] font-bold text-slate-400 font-mono">
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
    autumn: 'bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-stone-100 text-stone-900',
  };

  return (
    <div className={`min-h-screen relative flex flex-col font-sans transition-colors duration-500 ${themeClassMap[currentTheme] || 'bg-emerald-50'}`} id="bunny-dashboard">
      
      {/* Greeting Modal Popup on Login */}
      <GreetingModal 
        isOpen={showGreetingModal} 
        onClose={() => setShowGreetingModal(false)} 
      />

      {/* Fall / Autumn Tree with Smoothly Dropping Leaves Background */}
      {(currentTheme === 'autumn' || isFallSeason) && !isSunday && (
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

      {/* Elegant sticky header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-emerald-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-30 shadow-sm" id="app-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200 overflow-hidden shrink-0 border border-emerald-400">
            <img src="/icon.svg" alt="Bunny Gym Icon" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-emerald-900 flex items-center gap-1.5">
              <span>Bunny’s Gym Record</span>
              <span className="text-base" title="Bunny">🐰</span>
            </h1>
            <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest">Montana, USA | UTC-7</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-right border-r border-emerald-100 pr-4 sm:pr-6">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Streak</p>
            <p className="text-lg sm:text-2xl font-black text-emerald-600 leading-none">
              {profile.currentStreak || 0} <span className="text-xs sm:text-sm font-medium">Days</span>
            </p>
          </div>
          
          <div className="text-right border-r border-emerald-100 pr-4 sm:pr-6">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Highest Record</p>
            <p className="text-lg sm:text-2xl font-black text-slate-700 leading-none">
              {profile.highestStreak || 0} <span className="text-xs sm:text-sm font-medium text-amber-500">★</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full border-2 border-emerald-400 overflow-hidden bg-emerald-50 flex items-center justify-center shadow-sm">
                {profile.photoUrl ? (
                  <img src={profile.photoUrl} alt="Bunny Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon className="w-5 h-5 text-emerald-500" />
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
            </div>

            <button 
              onClick={handleLogoutClick}
              className="p-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-400 hover:text-red-500 border border-neutral-200 rounded-xl transition-all cursor-pointer"
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
        <nav className="col-span-12 md:col-span-2 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0" id="sidebar-navigation">
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
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-semibold text-sm cursor-pointer shrink-0 md:w-full text-left ${
                  isActive 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' 
                    : 'bg-white hover:bg-emerald-50 text-slate-500 border border-emerald-100/40'
                }`}
              >
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse hidden md:inline-block" />}
                <tab.icon className="w-4 h-4 shrink-0" />
                <span className="text-xs sm:text-sm">{tab.label}</span>
              </button>
            );
          })}
          
          <div className="hidden md:block mt-auto p-4 bg-emerald-900 rounded-3xl text-white overflow-hidden relative shadow-inner">
            <p className="text-[9px] opacity-65 font-bold uppercase tracking-widest mb-1 font-mono">Penguin Broadcaster</p>
            <p className="text-xs italic leading-relaxed">"{dailyTip || 'Keep grinding. No excuses!'}"</p>
            <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-emerald-700/50 rounded-full blur-xl"></div>
          </div>
        </nav>

        {/* Central Card Column: Middle (col-span-6) */}
        <section className="col-span-12 md:col-span-6 flex flex-col gap-6">
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-emerald-100 flex-1 flex flex-col justify-between min-h-[480px]">
            
            {activeTab === 'calendar' && (
              <div className="flex-1 flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-emerald-600" />
                      <span>Current Month <span className="text-slate-300 font-light">/ Calendar</span></span>
                    </h2>
                    <div className="flex gap-3 text-[9px] font-bold">
                      <span className="flex items-center gap-1 text-emerald-600">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Smashed
                      </span>
                      <span className="flex items-center gap-1 text-rose-500">
                        <span className="w-2 h-2 rounded-full bg-rose-500" /> Skipped
                      </span>
                    </div>
                  </div>

                  {/* Today Action & Status Banner */}
                  {!isTargetWorkoutDay(montanaToday) ? (
                    <div className="p-4 mb-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-center justify-between text-amber-900 shadow-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-700 block">
                          SCHEDULED OFF DAY / REST DAY 🟧
                        </span>
                        <p className="text-xs font-bold">
                          Today ({getMontanaDayOfWeek(montanaToday)}) is your rest day. Stretch, relax, and let your body recover!
                        </p>
                      </div>
                      <button 
                        disabled 
                        className="px-3.5 py-2 bg-amber-200/80 text-amber-800 text-xs font-bold rounded-xl cursor-not-allowed border border-amber-300 shrink-0"
                      >
                        REST DAY 🟧
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 mb-4 bg-emerald-500 text-white rounded-2xl flex items-center justify-between shadow-lg shadow-emerald-200">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-100 block">
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
                          className="px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-black rounded-xl cursor-pointer transition-all active:scale-95 shadow-xs shrink-0"
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
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-700/60 tracking-wider block uppercase font-bold">
                      Target Gym Days (Strict)
                    </span>
                    <div className="flex space-x-1.5 mt-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                        const isTarget = ['Tue', 'Wed', 'Fri', 'Sat', 'Sun'].includes(day);
                        return (
                          <span 
                            key={day}
                            className={`text-[9px] font-bold font-sans px-2 py-0.5 rounded-md ${
                              isTarget 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {day} {!isTarget ? '🟧 OFF' : '🟩'}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono text-emerald-700/60 tracking-wider block uppercase font-bold">
                      Current Streak Goal
                    </span>
                    <span className="text-sm font-black text-emerald-800 block mt-1">
                      🔥 {profile.currentStreak || 0} Target Days
                    </span>
                  </div>
                </div>

                {/* Gym Location & Push Notifications Widgets */}
                <div className="space-y-4 pt-2">
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

            {activeTab === 'cheer' && (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-sans font-bold text-base text-neutral-950 flex items-center space-x-2">
                      <Volume2 className="w-5 h-5 text-emerald-500" />
                      <span>Cheer Box (Penguin's Audio & Video Vault)</span>
                    </h3>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold px-2.5 py-1 rounded-full uppercase">
                      Zambia Support 🇿🇲
                    </span>
                  </div>

                  {cheerVault.length === 0 ? (
                    <div className="text-center py-12 px-4 bg-emerald-50/50 rounded-2xl border border-dashed border-emerald-200 space-y-2">
                      <Sparkles className="w-8 h-8 text-emerald-400 mx-auto animate-pulse" />
                      <p className="text-xs font-bold text-slate-700">The Cheer Box is waiting for Penguin!</p>
                      <p className="text-[11px] text-slate-400">
                        Penguin will upload audio voice notes and video cheers from Zambia to motivate you!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[28rem] overflow-y-auto pr-1">
                      {cheerVault.map((item) => (
                        <div key={item.id} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2.5">
                              {item.fileType === 'audio' ? (
                                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                                  <Volume2 className="w-4 h-4" />
                                </div>
                              ) : (
                                <div className="p-2.5 bg-teal-100 text-teal-700 rounded-xl">
                                  <Play className="w-4 h-4" />
                                </div>
                              )}
                              <div>
                                <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">
                                  {item.fileType === 'audio' ? '🎵 Audio Voice Note' : '🎬 Video Cheer'}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">
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
                  <h3 className="font-sans font-bold text-base text-neutral-950 flex items-center space-x-2 mb-4">
                    <Scale className="w-5 h-5 text-emerald-500" />
                    <span>Sunday Weight Logging</span>
                  </h3>

                  <form onSubmit={handleWeightSubmit} className="space-y-4">
                    {weightError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-500 text-xs font-semibold">
                        {weightError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-600 block uppercase">Weight (lbs)</label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={weightInput}
                          onChange={(e) => setWeightInput(e.target.value)}
                          placeholder="e.g. 145.2"
                          className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 focus:border-emerald-500 focus:bg-white rounded-xl text-sm outline-none transition-all font-sans text-neutral-800"
                          id="weight-value-input"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-600 block uppercase">Log Date (Sunday Only)</label>
                        <input
                          type="date"
                          required
                          value={weightDate}
                          onChange={(e) => setWeightDate(e.target.value)}
                          className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 focus:border-emerald-500 focus:bg-white rounded-xl text-sm outline-none transition-all font-sans text-neutral-800"
                          id="weight-date-input"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={weightLoading}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-200 cursor-pointer flex items-center justify-center space-x-2 text-sm"
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

                <div className="pt-4 border-t border-slate-100">
                  <span className="text-xs font-bold text-neutral-400 block mb-3 uppercase tracking-wider">
                    Weight Log History
                  </span>

                  {weightLogs.length === 0 ? (
                    <p className="text-neutral-400 text-xs text-center py-6 font-medium">
                      No weight records logged yet. Make sure to log every Sunday!
                    </p>
                  ) : (
                    <div className="divide-y divide-neutral-100 max-h-44 overflow-y-auto pr-1">
                      {weightLogs.map((log) => (
                        <div key={log.id} className="py-2.5 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                              <Scale className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-sm font-extrabold text-neutral-800 block">
                                {log.weight} lbs
                              </span>
                              <span className="text-[10px] text-neutral-400 block font-mono">
                                Logged on {getMontanaDayOfWeek(log.dateStr)}, {log.dateStr}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-neutral-300 font-mono">
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
                  <h3 className="font-sans font-bold text-base text-neutral-950 flex items-center space-x-2 mb-4">
                    <Trophy className="w-5 h-5 text-emerald-500" />
                    <span>Achievements Vault</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-center space-y-1">
                      <span className="text-2xl block">🔥</span>
                      <span className="text-xs text-neutral-400 block uppercase font-mono">Current Streak</span>
                      <span className="text-lg font-black text-emerald-800 block">
                        {profile.currentStreak || 0} Days
                      </span>
                    </div>

                    <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-2xl text-center space-y-1">
                      <span className="text-2xl block">👑</span>
                      <span className="text-xs text-neutral-400 block uppercase font-mono">All-Time High</span>
                      <span className="text-lg font-black text-teal-800 block">
                        {profile.highestStreak || 0} Days
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <span className="text-xs font-bold text-neutral-400 block uppercase tracking-wider">
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
                              ? 'bg-gradient-to-r from-emerald-50 to-teal-50/30 border-emerald-100 text-neutral-800' 
                              : 'bg-neutral-50/50 border-neutral-100 opacity-40'
                          }`}
                        >
                          <span className="text-2xl">{badge.icon}</span>
                          <div>
                            <h4 className="text-sm font-extrabold text-neutral-900 leading-tight">
                              {badge.name}
                            </h4>
                            <p className="text-xs text-neutral-500 mt-0.5">{badge.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Themes Vault & Milestone Progression */}
                <div className="pt-4 border-t border-slate-100">
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
                  <h3 className="font-sans font-bold text-base text-neutral-950 flex items-center space-x-2 mb-4">
                    <SettingsIcon className="w-5 h-5 text-emerald-500" />
                    <span>Gym Profile Configuration</span>
                  </h3>

                  <div className="flex flex-col items-center justify-center p-4 border border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50 space-y-3">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full border-4 border-emerald-400 overflow-hidden bg-white flex items-center justify-center shadow-md">
                        {profile.photoUrl ? (
                          <img src={profile.photoUrl} alt="Bunny avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <UserIcon className="w-10 h-10 text-emerald-400" />
                        )}
                      </div>
                      {profileUploading && (
                        <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center text-white">
                          <span className="text-[10px] font-mono font-bold">{profileProgress}%</span>
                        </div>
                      )}
                    </div>

                    <label className="py-2 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 cursor-pointer transition-all active:scale-95 shadow-sm">
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
                    <span className="text-[10px] text-neutral-400">Pushed to Firebase Storage</span>
                  </div>
                </div>

                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <GymLocationPicker 
                    currentGymLocation={profile.gymLocation}
                    onSaveGymLocation={handleSaveGymLocation}
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
      <footer className="h-8 bg-emerald-900 flex items-center justify-center gap-6 mt-auto shrink-0" id="app-footer">
        <span className="text-[10px] font-bold text-emerald-400 tracking-[0.2em] uppercase">No skips. No excuses. Immutable Record.</span>
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
