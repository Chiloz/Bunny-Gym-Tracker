import { useEffect, useState, useMemo, FormEvent } from 'react';
import { motion } from 'motion/react';
import { 
  Users, Scale, Award, ShieldAlert, CheckCircle2, XCircle, 
  Video, Music, Play, Upload, MessageSquare, AlertOctagon, 
  Save, RefreshCw, Calendar as CalendarIcon, LogOut, HelpCircle, Sparkles, Download, Trash2
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { 
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, 
  where, getDocs, addDoc, onSnapshot, orderBy 
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip 
} from 'recharts';
import { auth, db, storage } from '../lib/firebase';
import { 
  UserProfile, WorkoutLog, WeightLog, QuizConfig, Penalty, CheerItem, SundayJogLog, GymProof 
} from '../types';
import { 
  formatZambiaTime, isTargetWorkoutDay, getMontanaDayOfWeek, getMontanaDate, isSeptemberOrFall 
} from '../lib/time';
import { WEIGHT_LOSS_PENALTIES, getRandomPenaltyTask } from '../lib/penalties';
import BunnyDashboard from './BunnyDashboard';
import CloudinaryConfigCard from '../components/CloudinaryConfigCard';
import FallAutumnTreeBackground from '../components/FallAutumnTreeBackground';
import { getCloudinaryConfig, uploadToCloudinary } from '../lib/cloudinary';

interface PenguinAdminProps {
  profile: UserProfile;
  onLogout: () => void;
}

interface UploadProgress {
  pct: number;
  loading: boolean;
}

export default function PenguinAdmin({ profile: adminProfile, onLogout }: PenguinAdminProps) {
  // Bunny's profile and data (Since Bunny is the only tracking user, we locate standard user role)
  const [bunnyProfile, setBunnyProfile] = useState<UserProfile | null>(null);
  const [bunnyWorkouts, setBunnyWorkouts] = useState<{ [dateStr: string]: WorkoutLog }>({});
  const [bunnyWeights, setBunnyWeights] = useState<WeightLog[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [sundayJogs, setSundayJogs] = useState<SundayJogLog[]>([]);
  const [gymProofs, setGymProofs] = useState<GymProof[]>([]);
  const [cheerVault, setCheerVault] = useState<CheerItem[]>([]);

  // Derived Autumn Theme state automatically synchronized from Bunny's active theme or Fall season
  const montanaToday = useMemo(() => getMontanaDate(), []);
  const isFallSeason = isSeptemberOrFall(montanaToday);
  const isSunday = getMontanaDayOfWeek(montanaToday) === 'Sunday';
  const bunnyActiveTheme = bunnyProfile?.activeTheme || (isFallSeason && !isSunday ? 'autumn' : 'emerald');
  const isAdminAutumnActive = bunnyActiveTheme === 'autumn' || (isFallSeason && !isSunday);

  // Admin View as Bunny toggle
  const [viewingAsBunny, setViewingAsBunny] = useState(false);

  // Admin Section Navigation Tabs
  const [adminTab, setAdminTab] = useState<'monitor' | 'media' | 'penalties' | 'cheer' | 'broadcaster'>('monitor');

  // Broadcasting configurations
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');
  const [dailyTip, setDailyTip] = useState('');
  const [egoDeflaterMsg, setEgoDeflaterMsg] = useState('');
  const [penaltyTaskDesc, setPenaltyTaskDesc] = useState('');
  
  // Save states
  const [broadcastingLoading, setBroadcastingLoading] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Penalty management state
  const [penaltyTab, setPenaltyTab] = useState<'active' | 'cleared'>('active');
  const [selectedDateModal, setSelectedDateModal] = useState<string | null>(null);
  const [manualPenaltySuccess, setManualPenaltySuccess] = useState('');

  // Issue penalty modal state
  const [showIssuePenaltyModal, setShowIssuePenaltyModal] = useState(false);
  const [issuePenaltyDate, setIssuePenaltyDate] = useState<string>('');
  const [chosenTaskType, setChosenTaskType] = useState<string>(WEIGHT_LOSS_PENALTIES[0]);
  const [customTaskInput, setCustomTaskInput] = useState<string>('');

  // Cheer Vault Upload
  const [cheerTitle, setCheerTitle] = useState('');
  const [cheerType, setCheerType] = useState<'audio' | 'video'>('audio');
  const [cheerInputMode, setCheerInputMode] = useState<'file' | 'link'>('file');
  const [cheerLinkUrl, setCheerLinkUrl] = useState('');
  const [cheerFile, setCheerFile] = useState<File | null>(null);
  const [cheerUpload, setCheerUpload] = useState<UploadProgress>({ pct: 0, loading: false });
  const [cheerError, setCheerError] = useState('');
  const [cheerSuccess, setCheerSuccess] = useState(false);

  // Media Gallery Filter State
  const [mediaGalleryFilter, setMediaGalleryFilter] = useState<'all' | 'gym' | 'jog' | 'penalty' | 'cheer'>('all');

  // Aggregated Media List across all collections
  const allUploadedMedia = useMemo(() => {
    const items: {
      id: string;
      rawId: string;
      source: 'gym_proof' | 'sunday_jog' | 'penalty' | 'cheer_vault';
      categoryLabel: string;
      url: string;
      title: string;
      dateStr: string;
      uploadedAt: string;
      fileType: 'image' | 'video' | 'audio';
      fileName?: string;
      slotKey?: string;
      nameKey?: string;
    }[] = [];

    // 1. Gym Spot-Check Proofs
    gymProofs.forEach((gp) => {
      if (gp.fileUrl) {
        items.push({
          id: `gym_${gp.id}`,
          rawId: gp.id,
          source: 'gym_proof',
          categoryLabel: 'Gym Spot Check',
          url: gp.fileUrl,
          title: `Gym Spot-Check Proof (${gp.dateStr})`,
          dateStr: gp.dateStr,
          uploadedAt: gp.uploadedAt || gp.dateStr,
          fileType: gp.fileType || (/\.(mp4|mov|webm|avi|3gp)/i.test(gp.fileUrl) ? 'video' : 'image'),
          fileName: gp.fileName
        });
      }
    });

    // 2. Sunday Jog Clips
    sundayJogs.forEach((jog) => {
      if (jog.startUrl) {
        items.push({
          id: `jog_start_${jog.id}`,
          rawId: jog.id,
          source: 'sunday_jog',
          categoryLabel: 'Sunday Jog (Start)',
          url: jog.startUrl,
          title: `Sunday Jog 10s Start Clip (${jog.dateStr})`,
          dateStr: jog.dateStr,
          uploadedAt: jog.createdAt || jog.dateStr,
          fileType: 'video',
          fileName: jog.startName || 'start_clip.mp4',
          slotKey: 'startUrl',
          nameKey: 'startName'
        });
      }
      if (jog.middleUrl) {
        items.push({
          id: `jog_mid_${jog.id}`,
          rawId: jog.id,
          source: 'sunday_jog',
          categoryLabel: 'Sunday Jog (Mid)',
          url: jog.middleUrl,
          title: `Sunday Jog 10s Midpoint Clip (${jog.dateStr})`,
          dateStr: jog.dateStr,
          uploadedAt: jog.createdAt || jog.dateStr,
          fileType: 'video',
          fileName: jog.middleName || 'midpoint_clip.mp4',
          slotKey: 'middleUrl',
          nameKey: 'middleName'
        });
      }
      if (jog.finishUrl) {
        items.push({
          id: `jog_finish_${jog.id}`,
          rawId: jog.id,
          source: 'sunday_jog',
          categoryLabel: 'Sunday Jog (Finish)',
          url: jog.finishUrl,
          title: `Sunday Jog 10s Finish Clip (${jog.dateStr})`,
          dateStr: jog.dateStr,
          uploadedAt: jog.createdAt || jog.dateStr,
          fileType: 'video',
          fileName: jog.finishName || 'finish_clip.mp4',
          slotKey: 'finishUrl',
          nameKey: 'finishName'
        });
      }
    });

    // 3. Penalty Videos
    penalties.forEach((p) => {
      const slots = [
        { key: 'outwardStartUrl', nameKey: 'outwardStartName', label: 'Outward Start' },
        { key: 'outwardMiddleUrl', nameKey: 'outwardMiddleName', label: 'Outward Mid' },
        { key: 'outwardEndUrl', nameKey: 'outwardEndName', label: 'Outward End' },
        { key: 'returnStartUrl', nameKey: 'returnStartName', label: 'Return Start' },
        { key: 'returnMiddleUrl', nameKey: 'returnMiddleName', label: 'Return Mid' },
        { key: 'returnEndUrl', nameKey: 'returnEndName', label: 'Return End' },
      ];

      slots.forEach((s) => {
        const url = (p as any)[s.key];
        const fileName = (p as any)[s.nameKey];
        if (url) {
          items.push({
            id: `penalty_${p.id}_${s.key}`,
            rawId: p.id,
            source: 'penalty',
            categoryLabel: `Penalty (${s.label})`,
            url,
            title: `Penalty Proof: ${p.taskDescription || 'Exercise Challenge'} (${s.label})`,
            dateStr: p.dateStr || new Date(p.createdAt).toLocaleDateString(),
            uploadedAt: p.createdAt,
            fileType: 'video',
            fileName: fileName || `${s.label}.mp4`,
            slotKey: s.key,
            nameKey: s.nameKey
          });
        }
      });
    });

    // 4. Cheer Vault Broadcasts (Voice Notes & Video Clips)
    cheerVault.forEach((c) => {
      if (c.fileUrl) {
        items.push({
          id: `cheer_${c.id}`,
          rawId: c.id,
          source: 'cheer_vault',
          categoryLabel: `Cheer Vault (${c.fileType === 'video' ? 'Video' : 'Audio'})`,
          url: c.fileUrl,
          title: `Cheer Broadcast: ${c.title}`,
          dateStr: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recent',
          uploadedAt: c.createdAt || c.uploadedAt || new Date().toISOString(),
          fileType: c.fileType === 'video' ? 'video' : (/\.(mp4|mov|webm|avi|3gp)/i.test(c.fileUrl) ? 'video' : 'audio'),
          fileName: c.title
        });
      }
    });

    return items.sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime());
  }, [gymProofs, sundayJogs, penalties, cheerVault]);

  const filteredMediaList = useMemo(() => {
    if (mediaGalleryFilter === 'gym') return allUploadedMedia.filter(m => m.source === 'gym_proof');
    if (mediaGalleryFilter === 'jog') return allUploadedMedia.filter(m => m.source === 'sunday_jog');
    if (mediaGalleryFilter === 'penalty') return allUploadedMedia.filter(m => m.source === 'penalty');
    if (mediaGalleryFilter === 'cheer') return allUploadedMedia.filter(m => m.source === 'cheer_vault');
    return allUploadedMedia;
  }, [allUploadedMedia, mediaGalleryFilter]);

  // Time in Zambia
  const [zambiaTime, setZambiaTime] = useState(formatZambiaTime());

  useEffect(() => {
    // Keep Zambia clock ticking
    const timer = setInterval(() => {
      setZambiaTime(formatZambiaTime());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Listen for users to find the first standard User (Bunny)
    const usersQuery = query(collection(db, 'users'), where('role', '==', 'user'));
    
    const unsubUsers = onSnapshot(usersQuery, async (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        const profileData = { uid: docSnap.id, ...docSnap.data() } as UserProfile;
        setBunnyProfile(profileData);

        // Fetch Bunny workouts (real-time subcollection)
        const unsubWorkouts = onSnapshot(collection(db, 'users', profileData.uid, 'workouts'), (snap) => {
          const logs: { [dateStr: string]: WorkoutLog } = {};
          snap.forEach(d => {
            logs[d.id] = d.data() as WorkoutLog;
          });
          setBunnyWorkouts(logs);
        });

        // Fetch Bunny weights
        const unsubWeights = onSnapshot(
          query(collection(db, 'users', profileData.uid, 'weight_logs'), orderBy('dateStr', 'asc')), 
          (snap) => {
            const weights: WeightLog[] = [];
            snap.forEach(d => {
              weights.push({ id: d.id, ...d.data() } as WeightLog);
            });
            setBunnyWeights(weights);
          }
        );

        return () => {
          unsubWorkouts();
          unsubWeights();
        };
      }
    });

    // Listen for penalties (Zambia Reviews)
    const penaltiesQuery = query(collection(db, 'penalties'), orderBy('createdAt', 'desc'));
    const unsubPenalties = onSnapshot(penaltiesQuery, (snapshot) => {
      const list: Penalty[] = [];
      snapshot.forEach(d => {
        list.push({ id: d.id, ...d.data() } as Penalty);
      });
      setPenalties(list);
    });

    // Listen for Sunday Jog video submissions
    const sundayJogsQuery = query(collection(db, 'sunday_jogs'), orderBy('createdAt', 'desc'));
    const unsubSundayJogs = onSnapshot(sundayJogsQuery, (snapshot) => {
      const list: SundayJogLog[] = [];
      snapshot.forEach(d => {
        list.push({ id: d.id, ...d.data() } as SundayJogLog);
      });
      setSundayJogs(list);
    });

    // Listen for Random Gym Proof uploads
    const gymProofsQuery = query(collection(db, 'gym_proofs'), orderBy('uploadedAt', 'desc'));
    const unsubGymProofs = onSnapshot(gymProofsQuery, (snapshot) => {
      const list: GymProof[] = [];
      snapshot.forEach(d => {
        list.push({ id: d.id, ...d.data() } as GymProof);
      });
      setGymProofs(list);
    });

    // Listen for Cheer Vault uploads (robust fetch without filtering out documents missing uploadedAt)
    const cheerVaultQuery = collection(db, 'cheer_vault');
    const unsubCheerVault = onSnapshot(cheerVaultQuery, (snapshot) => {
      const list: CheerItem[] = [];
      snapshot.forEach(d => {
        const data = d.data();
        list.push({ 
          id: d.id, 
          title: data.title || 'Cheer Broadcast',
          fileUrl: data.fileUrl || '',
          fileType: data.fileType || 'video',
          createdAt: data.createdAt || data.uploadedAt || new Date().toISOString(),
          uploadedAt: data.uploadedAt || data.createdAt,
          ...data 
        } as CheerItem);
      });
      list.sort((a, b) => new Date(b.createdAt || b.uploadedAt || 0).getTime() - new Date(a.createdAt || a.uploadedAt || 0).getTime());
      setCheerVault(list);
    });

    // Load original config values
    const loadConfigs = async () => {
      try {
        const quizSnap = await getDoc(doc(db, 'config', 'quiz'));
        if (quizSnap.exists()) {
          const data = quizSnap.data() as QuizConfig;
          setQ1(data.q1 || '');
          setQ2(data.q2 || '');
          setQ3(data.q3 || '');
        }

        const tipSnap = await getDoc(doc(db, 'config', 'daily_tip'));
        if (tipSnap.exists()) setDailyTip(tipSnap.data().text || '');

        const egoSnap = await getDoc(doc(db, 'config', 'ego_deflater'));
        if (egoSnap.exists()) setEgoDeflaterMsg(egoSnap.data().text || '');

        const taskSnap = await getDoc(doc(db, 'config', 'penalty_task'));
        if (taskSnap.exists()) setPenaltyTaskDesc(taskSnap.data().text || '');
      } catch (e) {
        console.error(e);
      }
    };
    loadConfigs();

    return () => {
      unsubUsers();
      unsubPenalties();
    };
  }, []);

  const [tipSuccess, setTipSuccess] = useState(false);
  const [punishmentSuccess, setPunishmentSuccess] = useState(false);
  const [quizSuccess, setQuizSuccess] = useState(false);
  const [savingTip, setSavingTip] = useState(false);
  const [savingPunishment, setSavingPunishment] = useState(false);
  const [savingQuiz, setSavingQuiz] = useState(false);

  const handleSaveDailyTip = async (e: FormEvent) => {
    e.preventDefault();
    setSavingTip(true);
    setTipSuccess(false);
    try {
      await setDoc(doc(db, 'config', 'daily_tip'), {
        text: dailyTip.trim()
      });
      setTipSuccess(true);
      setTimeout(() => setTipSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingTip(false);
    }
  };

  const handleSavePunishmentSettings = async (e: FormEvent) => {
    e.preventDefault();
    setSavingPunishment(true);
    setPunishmentSuccess(false);
    try {
      await setDoc(doc(db, 'config', 'ego_deflater'), {
        text: egoDeflaterMsg.trim()
      });
      await setDoc(doc(db, 'config', 'penalty_task'), {
        text: penaltyTaskDesc.trim()
      });
      setPunishmentSuccess(true);
      setTimeout(() => setPunishmentSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPunishment(false);
    }
  };

  const handleSaveQuizQuestions = async (e: FormEvent) => {
    e.preventDefault();
    setSavingQuiz(true);
    setQuizSuccess(false);
    try {
      await setDoc(doc(db, 'config', 'quiz'), {
        q1: q1.trim(),
        q2: q2.trim(),
        q3: q3.trim()
      });
      setQuizSuccess(true);
      setTimeout(() => setQuizSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingQuiz(false);
    }
  };

  const handlePenaltyApprove = async (penaltyId: string) => {
    try {
      const penaltyDocRef = doc(db, 'penalties', penaltyId);
      await updateDoc(penaltyDocRef, {
        status: 'cleared',
        resolvedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handlePenaltyReject = async (penaltyId: string) => {
    try {
      const penaltyDocRef = doc(db, 'penalties', penaltyId);
      await updateDoc(penaltyDocRef, {
        status: 'active',
        // Clear previous uploaded slots to make her re-upload correctly
        outwardStartUrl: null,
        outwardMiddleUrl: null,
        outwardEndUrl: null,
        returnStartUrl: null,
        returnMiddleUrl: null,
        returnEndUrl: null,
        outwardStartName: null,
        outwardMiddleName: null,
        outwardEndName: null,
        returnStartName: null,
        returnMiddleName: null,
        returnEndName: null,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handlePenaltyReinstate = async (penaltyId: string) => {
    try {
      const penaltyDocRef = doc(db, 'penalties', penaltyId);
      await updateDoc(penaltyDocRef, {
        status: 'active',
        resolvedAt: null,
        // Reset proof slots so Bunny must re-run and upload fresh proof
        outwardStartUrl: null,
        outwardMiddleUrl: null,
        outwardEndUrl: null,
        returnStartUrl: null,
        returnMiddleUrl: null,
        returnEndUrl: null,
        outwardStartName: null,
        outwardMiddleName: null,
        outwardEndName: null,
        returnStartName: null,
        returnMiddleName: null,
        returnEndName: null,
      });
      setManualPenaltySuccess("Penalty reinstated! Bunny's app is now locked in Penalty Mode.");
      setTimeout(() => setManualPenaltySuccess(''), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  const openIssuePenaltyModal = (dateStr?: string) => {
    setIssuePenaltyDate(dateStr || new Date().toISOString().split('T')[0]);
    setShowIssuePenaltyModal(true);
  };

  const handleCreateManualPenalty = async (dateStr?: string, customTask?: string) => {
    if (!bunnyProfile) return;
    try {
      let finalTask = customTask;
      if (!finalTask) {
        if (chosenTaskType === 'random') {
          finalTask = getRandomPenaltyTask();
        } else if (chosenTaskType === 'custom') {
          finalTask = customTaskInput || getRandomPenaltyTask();
        } else {
          finalTask = chosenTaskType;
        }
      }

      await addDoc(collection(db, 'penalties'), {
        uid: bunnyProfile.uid,
        taskDescription: finalTask,
        status: 'active',
        createdAt: new Date().toISOString(),
        dateStr: dateStr || issuePenaltyDate || new Date().toISOString().split('T')[0]
      });

      const dateToMark = dateStr || issuePenaltyDate;
      if (dateToMark) {
        await setDoc(doc(db, 'users', bunnyProfile.uid, 'workouts', dateToMark), {
          dateStr: dateToMark,
          status: 'skipped',
          loggedAt: new Date().toISOString()
        }, { merge: true });
      }

      setShowIssuePenaltyModal(false);
      setManualPenaltySuccess(`New penalty assigned: "${finalTask}"! App locked.`);
      setTimeout(() => setManualPenaltySuccess(''), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleWorkoutStatus = async (dateStr: string, status: 'attended' | 'skipped') => {
    if (!bunnyProfile) return;
    try {
      await setDoc(doc(db, 'users', bunnyProfile.uid, 'workouts', dateStr), {
        dateStr,
        status,
        loggedAt: new Date().toISOString()
      }, { merge: true });

      if (status === 'skipped') {
        await handleCreateManualPenalty(dateStr);
      } else {
        setManualPenaltySuccess(`Marked ${dateStr} as Attended.`);
        setTimeout(() => setManualPenaltySuccess(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handlers for deleting media items
  const handleDeleteCheer = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this cheer broadcast? Bunny will no longer see it.")) return;
    try {
      await deleteDoc(doc(db, 'cheer_vault', id));
      setManualPenaltySuccess("Cheer broadcast deleted successfully.");
      setTimeout(() => setManualPenaltySuccess(''), 3000);
    } catch (err: any) {
      alert("Error deleting cheer: " + err.message);
    }
  };

  const handleDeleteGymProof = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this gym spot-check proof record?")) return;
    try {
      await deleteDoc(doc(db, 'gym_proofs', id));
      setManualPenaltySuccess("Gym proof record deleted successfully.");
      setTimeout(() => setManualPenaltySuccess(''), 3000);
    } catch (err: any) {
      alert("Error deleting gym proof: " + err.message);
    }
  };

  const handleDeleteSundayJog = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this Sunday jog submission?")) return;
    try {
      await deleteDoc(doc(db, 'sunday_jogs', id));
      setManualPenaltySuccess("Sunday jog record deleted successfully.");
      setTimeout(() => setManualPenaltySuccess(''), 3000);
    } catch (err: any) {
      alert("Error deleting jog record: " + err.message);
    }
  };

  const handleDeletePenaltyVideo = async (penaltyId: string, slotKey?: string, nameKey?: string) => {
    if (!window.confirm("Are you sure you want to remove this penalty video proof?")) return;
    try {
      if (slotKey) {
        await updateDoc(doc(db, 'penalties', penaltyId), {
          [slotKey]: null,
          ...(nameKey ? { [nameKey]: null } : {})
        });
      } else {
        await deleteDoc(doc(db, 'penalties', penaltyId));
      }
      setManualPenaltySuccess("Penalty video removed successfully.");
      setTimeout(() => setManualPenaltySuccess(''), 3000);
    } catch (err: any) {
      alert("Error updating penalty: " + err.message);
    }
  };

  const handleDeleteGenericMedia = async (item: {
    rawId: string;
    source: 'gym_proof' | 'sunday_jog' | 'penalty' | 'cheer_vault';
    slotKey?: string;
    nameKey?: string;
  }) => {
    if (item.source === 'cheer_vault') {
      await handleDeleteCheer(item.rawId);
    } else if (item.source === 'gym_proof') {
      await handleDeleteGymProof(item.rawId);
    } else if (item.source === 'sunday_jog') {
      await handleDeleteSundayJog(item.rawId);
    } else if (item.source === 'penalty') {
      await handleDeletePenaltyVideo(item.rawId, item.slotKey, item.nameKey);
    }
  };

  const handleCheerUpload = async (e: FormEvent) => {
    e.preventDefault();
    setCheerError('');
    setCheerSuccess(false);

    if (!cheerTitle.trim()) {
      setCheerError("Please specify a display title.");
      return;
    }

    if (cheerInputMode === 'link') {
      if (!cheerLinkUrl.trim()) {
        setCheerError("Please paste an audio or video link (Google Drive, YouTube, SoundCloud, etc.).");
        return;
      }
      setCheerUpload({ pct: 100, loading: true });
      try {
        await addDoc(collection(db, 'cheer_vault'), {
          title: cheerTitle.trim(),
          fileUrl: cheerLinkUrl.trim(),
          fileType: cheerType,
          createdAt: new Date().toISOString()
        });
        setCheerTitle('');
        setCheerLinkUrl('');
        setCheerUpload({ pct: 0, loading: false });
        setCheerSuccess(true);
        setTimeout(() => setCheerSuccess(false), 3000);
      } catch (err: any) {
        setCheerError(err.message);
        setCheerUpload({ pct: 0, loading: false });
      }
      return;
    }

    if (!cheerFile) {
      setCheerError("Please select an audio or video file, or switch to 'Paste Link'.");
      return;
    }

    setCheerUpload({ pct: 5, loading: true });

    // 1. Check if Cloudinary is enabled
    try {
      const cConfig = await getCloudinaryConfig();
      if (cConfig.enabled) {
        const cloudRes = await uploadToCloudinary(
          cheerFile,
          cConfig.cloudName,
          cConfig.uploadPreset,
          cheerType === 'video' ? 'video' : 'auto',
          (pct) => setCheerUpload({ pct: pct || 10, loading: true })
        );
        await addDoc(collection(db, 'cheer_vault'), {
          title: cheerTitle.trim(),
          fileUrl: cloudRes.url,
          fileType: cheerType,
          createdAt: new Date().toISOString()
        });
        setCheerTitle('');
        setCheerFile(null);
        setCheerUpload({ pct: 0, loading: false });
        setCheerSuccess(true);
        setTimeout(() => setCheerSuccess(false), 3000);
        return;
      }
    } catch (cErr: any) {
      console.warn("Cloudinary cheer upload failed, trying Firebase Storage:", cErr);
    }

    try {
      const cleanFileName = cheerFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const cheerRef = ref(storage, `cheers/${Date.now()}_${cleanFileName}`);
      const uploadTask = uploadBytesResumable(cheerRef, cheerFile);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setCheerUpload(prev => ({ ...prev, pct: percent || 10 }));
        },
        async (err) => {
          console.warn("Cheer upload error", err);
          if (cheerFile.size <= 700 * 1024) {
            const reader = new FileReader();
            reader.onload = async (evt) => {
              const dataUrl = evt.target?.result as string;
              if (dataUrl && dataUrl.length < 950000) {
                await addDoc(collection(db, 'cheer_vault'), {
                  title: cheerTitle.trim(),
                  fileUrl: dataUrl,
                  fileType: cheerType,
                  createdAt: new Date().toISOString()
                });
                setCheerTitle('');
                setCheerFile(null);
                setCheerUpload({ pct: 0, loading: false });
                setCheerSuccess(true);
                setTimeout(() => setCheerSuccess(false), 3000);
              } else {
                setCheerError(`Storage error: ${err.message}. Switch to "Paste Link" tab to attach Google Drive/YouTube link!`);
                setCheerUpload({ pct: 0, loading: false });
              }
            };
            reader.readAsDataURL(cheerFile);
          } else {
            setCheerError(`Storage upload error (${err.message}). Switch to "Paste Link" tab above to paste a Google Drive, SoundCloud, or YouTube link!`);
            setCheerUpload({ pct: 0, loading: false });
          }
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            
            await addDoc(collection(db, 'cheer_vault'), {
              title: cheerTitle.trim(),
              fileUrl: downloadUrl,
              fileType: cheerType,
              createdAt: new Date().toISOString()
            });

            setCheerTitle('');
            setCheerFile(null);
            setCheerUpload({ pct: 0, loading: false });
            setCheerSuccess(true);
            setTimeout(() => setCheerSuccess(false), 3000);
          } catch (e: any) {
            setCheerError(`Error saving URL: ${e.message}`);
            setCheerUpload({ pct: 0, loading: false });
          }
        }
      );
    } catch (err: any) {
      setCheerError(err.message);
      setCheerUpload({ pct: 0, loading: false });
    }
  };

  const handleLogoutClick = async () => {
    await signOut(auth);
    onLogout();
  };

  // Prepares data for Weight Logs Recharts Chart
  const chartData = bunnyWeights.map(log => ({
    date: log.dateStr.slice(5), // MM-DD format
    weight: log.weight
  }));

  // Render Workout grid for Admin review
  const renderBunnyCalendarGrid = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const totalDays = new Date(year, month + 1, 0).getDate();
    const daysArray = [];

    const firstDayIndex = new Date(year, month, 1).getDay();
    for (let i = 0; i < firstDayIndex; i++) {
      daysArray.push(null);
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      daysArray.push(dateStr);
    }

    return (
      <div className="space-y-3 mt-3">
        <p className="text-[10px] text-slate-400 italic">
          💡 Click any date below (e.g. Friday) to mark as Missed Gym / Skipped or Issue a Penalty.
        </p>

        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((wd, i) => (
            <div key={`head-${i}`} className="font-mono text-[9px] text-slate-400 font-bold">{wd}</div>
          ))}
          {daysArray.map((dateStr, idx) => {
            if (!dateStr) {
              return <div key={`empty-${idx}`} />;
            }

            const dayNum = parseInt(dateStr.split('-')[2], 10);
            const log = bunnyWorkouts[dateStr];
            const isTarget = isTargetWorkoutDay(dateStr);

            let bg = "bg-slate-50 text-slate-400 border border-slate-100 hover:border-slate-300";
            if (log) {
              if (log.status === 'attended') {
                bg = isAdminAutumnActive 
                  ? "bg-orange-500 text-white border-transparent font-black shadow-xs hover:bg-orange-600"
                  : "bg-emerald-550 text-white border-transparent font-bold shadow-xs hover:bg-emerald-600";
              } else {
                bg = "bg-rose-500 text-white border-transparent font-bold shadow-xs hover:bg-rose-600";
              }
            } else if (isTarget) {
              bg = isAdminAutumnActive
                ? "bg-amber-100/90 text-amber-950 border border-amber-300 border-dashed hover:border-amber-400 font-bold"
                : "bg-slate-100 text-slate-500 border border-slate-200 border-dashed hover:border-slate-400";
            }

            return (
              <button 
                key={dateStr}
                onClick={() => setSelectedDateModal(dateStr)}
                title={`${dateStr}: ${log ? log.status : 'no record'} - Click to manage`}
                className={`aspect-square rounded-lg flex items-center justify-center font-bold text-[10px] cursor-pointer transition-all active:scale-95 ${bg}`}
              >
                {dayNum}
              </button>
            );
          })}
        </div>

        {/* Selected Date Modal */}
        {selectedDateModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-sm font-bold text-slate-900">
                  Manage Record for {selectedDateModal}
                </h4>
                <button
                  onClick={() => setSelectedDateModal(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-500">
                  Current Status: <span className="font-bold uppercase text-slate-800">{bunnyWorkouts[selectedDateModal]?.status || 'No record'}</span>
                </p>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => {
                      handleToggleWorkoutStatus(selectedDateModal, 'skipped');
                      setSelectedDateModal(null);
                    }}
                    className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs border border-rose-700"
                  >
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap">Mark as Skipped 🔴 & Issue Penalty</span>
                  </button>

                  <button
                    onClick={() => {
                      handleToggleWorkoutStatus(selectedDateModal, 'attended');
                      setSelectedDateModal(null);
                    }}
                    className={`w-full py-3 px-4 text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs border ${
                      isAdminAutumnActive 
                        ? 'bg-gradient-to-r from-amber-800 to-orange-600 hover:from-amber-900 hover:to-orange-700 border-amber-900/50' 
                        : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-700'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap">Mark as Attended 🟢</span>
                  </button>

                  <button
                    onClick={() => {
                      const d = selectedDateModal;
                      setSelectedDateModal(null);
                      openIssuePenaltyModal(d);
                    }}
                    className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs border border-amber-700"
                  >
                    <AlertOctagon className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap">Issue Penalty for {selectedDateModal}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Issue Penalty Modal */}
        {showIssuePenaltyModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <AlertOctagon className="w-5 h-5 text-rose-600 animate-pulse" />
                  <h4 className="text-sm font-bold text-slate-900">
                    Issue Weight Loss Penalty Challenge
                  </h4>
                </div>
                <button
                  onClick={() => setShowIssuePenaltyModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                    Target Date & Recipient
                  </label>
                  <p className="text-xs font-bold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    Date: {issuePenaltyDate} (Bunny)
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                    Choose Weight Loss Exercise Penalty
                  </label>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {WEIGHT_LOSS_PENALTIES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setChosenTaskType(preset)}
                        className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer border flex items-center justify-between ${
                          chosenTaskType === preset 
                            ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold shadow-xs' 
                            : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{preset}</span>
                        {chosenTaskType === preset && <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0 ml-2" />}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setChosenTaskType('random')}
                      className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-between ${
                        chosenTaskType === 'random' 
                          ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs' 
                          : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>🎲 Random Weight-Loss Exercise (Auto-Selected)</span>
                      {chosenTaskType === 'random' && <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 ml-2" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setChosenTaskType('custom')}
                      className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-between ${
                        chosenTaskType === 'custom' 
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs' 
                          : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>✏️ Write Custom Penalty Challenge</span>
                      {chosenTaskType === 'custom' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
                    </button>
                  </div>
                </div>

                {chosenTaskType === 'custom' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                      Custom Penalty Description
                    </label>
                    <textarea
                      value={customTaskInput}
                      onChange={(e) => setCustomTaskInput(e.target.value)}
                      placeholder="e.g. 2 KM Run + 100 Jump Ropes"
                      rows={2}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-rose-400"
                    />
                  </div>
                )}

                <div className="pt-2 flex items-center space-x-2">
                  <button
                    onClick={() => setShowIssuePenaltyModal(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleCreateManualPenalty(issuePenaltyDate)}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md active:scale-95"
                  >
                    Lock App & Issue 🚨
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (viewingAsBunny && bunnyProfile) {
    return (
      <BunnyDashboard
        profile={bunnyProfile}
        onLogout={onLogout}
        isPreviewMode={true}
        onExitPreview={() => setViewingAsBunny(false)}
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500 relative ${
      isAdminAutumnActive 
        ? 'bg-gradient-to-b from-amber-50/90 via-orange-50/40 to-amber-100/50 text-stone-900' 
        : 'bg-slate-50/50 text-slate-850'
    }`} id="penguin-admin-view">
      
      {/* Dynamic Animated Autumn Backdrop when active */}
      {isAdminAutumnActive && <FallAutumnTreeBackground />}
      
      {/* Top Admin Navigation Header */}
      <header className={`backdrop-blur-md border-b px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm relative ${
        isAdminAutumnActive 
          ? 'bg-white/85 border-amber-200/80 shadow-amber-900/5' 
          : 'bg-white/95 border-slate-100'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ${
            isAdminAutumnActive ? 'bg-gradient-to-br from-amber-700 to-orange-600' : 'bg-slate-900'
          }`}>
            <span className="text-xl">🐧</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className={`text-base font-extrabold tracking-tight ${
                isAdminAutumnActive ? 'text-stone-900' : 'text-slate-900'
              }`}>
                Penguin Control Center
              </h1>
              <span className={`px-2 py-0.5 border text-[9px] rounded-full font-mono font-bold uppercase tracking-wider ${
                isAdminAutumnActive 
                  ? 'bg-amber-100 text-amber-900 border-amber-300' 
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                Zambia Node {isAdminAutumnActive ? '🍁 (Synced)' : '🇿🇲'}
              </span>
            </div>
            <p className={`text-[11px] ${isAdminAutumnActive ? 'text-stone-600 font-medium' : 'text-slate-400'}`}>
              Monitoring sync contracts, active streaks & tax penalties
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* View as Bunny Button */}
          {bunnyProfile && (
            <button
              onClick={() => setViewingAsBunny(true)}
              className={`py-2 px-3.5 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer active:scale-95 ${
                isAdminAutumnActive 
                  ? 'bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 shadow-orange-200/50' 
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <span>👁️ View as Bunny</span>
            </button>
          )}

          {/* Zambia Clock */}
          <div className="text-right hidden sm:block">
            <span className={`text-[9px] font-mono uppercase tracking-widest block font-bold ${
              isAdminAutumnActive ? 'text-stone-700' : 'text-slate-400'
            }`}>
              ZAMBIA LOCAL TIME
            </span>
            <span className={`text-xs font-bold font-mono ${
              isAdminAutumnActive ? 'text-amber-950' : 'text-slate-700'
            }`}>
              {zambiaTime}
            </span>
          </div>

          <button
            onClick={handleLogoutClick}
            className={`p-2.5 border rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 text-xs font-bold ${
              isAdminAutumnActive 
                ? 'bg-white/80 hover:bg-amber-100 text-stone-700 hover:text-rose-600 border-amber-300' 
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-rose-600'
            }`}
            id="admin-logout-btn"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Admin Content Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-12 gap-6 relative z-10" id="penguin-admin-body">
        
        {/* Left Section Navigation Sidebar */}
        <nav className="col-span-12 md:col-span-3 lg:col-span-2 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none" id="admin-sidebar-nav">
          {[
            { 
              id: 'monitor', 
              label: 'Live Monitor', 
              icon: CalendarIcon, 
              badge: bunnyProfile?.currentStreak ? `${bunnyProfile.currentStreak}d` : null,
              color: isAdminAutumnActive ? 'text-amber-800' : 'text-emerald-700'
            },
            { 
              id: 'media', 
              label: 'Media Vault', 
              icon: Video, 
              badge: allUploadedMedia.length > 0 ? `${allUploadedMedia.length}` : null,
              color: isAdminAutumnActive ? 'text-amber-800' : 'text-teal-700'
            },
            { 
              id: 'penalties', 
              label: 'Penalties Box', 
              icon: AlertOctagon, 
              badge: penalties.filter(p => p.status !== 'cleared').length > 0 ? `! ${penalties.filter(p => p.status !== 'cleared').length}` : null,
              color: 'text-rose-600'
            },
            { 
              id: 'cheer', 
              label: 'Cheer Vault', 
              icon: Music, 
              badge: 'Zambia 🇿🇲',
              color: isAdminAutumnActive ? 'text-amber-900' : 'text-amber-700'
            },
            { 
              id: 'broadcaster', 
              label: 'Broadcaster', 
              icon: Sparkles, 
              badge: 'Config',
              color: isAdminAutumnActive ? 'text-amber-900' : 'text-purple-700'
            },
          ].map((tab) => {
            const isActive = adminTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id as any)}
                className={`flex items-center justify-between gap-2.5 px-4 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 md:w-full border ${
                  isActive
                    ? isAdminAutumnActive
                      ? 'bg-gradient-to-r from-amber-800 to-orange-600 text-white border-amber-900 shadow-md translate-x-0.5'
                      : 'bg-slate-900 text-white border-slate-800 shadow-md translate-x-0.5'
                    : isAdminAutumnActive
                      ? 'bg-white/95 hover:bg-white text-stone-950 border-amber-300/90 shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-xs'
                }`}
                id={`admin-nav-tab-${tab.id}`}
              >
                <div className="flex items-center space-x-2.5 shrink-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : tab.color}`} />
                  <span className="font-black text-xs sm:text-sm whitespace-nowrap">{tab.label}</span>
                </div>
                {tab.badge && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-black ml-1.5 shrink-0 border ${
                    isActive 
                      ? 'bg-black/30 text-white border-white/30' 
                      : isAdminAutumnActive
                        ? 'bg-amber-200 text-amber-950 border-amber-400'
                        : 'bg-slate-100 text-slate-800 border-slate-300'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Main Content Viewport */}
        <div className="col-span-12 md:col-span-9 lg:col-span-10 space-y-6">

          {/* TAB 1: LIVE MONITOR & WEIGHT ANALYTICS */}
          {adminTab === 'monitor' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
              {/* Real-Time Monitor */}
              <div className="lg:col-span-6 space-y-6">
                <section className={`rounded-[32px] p-6 shadow-sm ${
                  isAdminAutumnActive 
                    ? 'bg-white/85 backdrop-blur-md border border-amber-200/90 shadow-amber-950/5' 
                    : 'bg-white border border-slate-100'
                }`}>
                  <div className={`flex items-center justify-between mb-4 border-b pb-3 ${
                    isAdminAutumnActive ? 'border-amber-200/80' : 'border-slate-100'
                  }`}>
                    <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center space-x-2 ${
                      isAdminAutumnActive ? 'text-stone-800' : 'text-slate-400'
                    }`}>
                      <CalendarIcon className={`w-4 h-4 ${isAdminAutumnActive ? 'text-amber-700' : 'text-emerald-600'}`} />
                      <span>Bunny Live Monitor</span>
                    </h3>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      isAdminAutumnActive 
                        ? 'bg-amber-100 text-amber-950 border border-amber-300' 
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      REAL-TIME
                    </span>
                  </div>

                  {bunnyProfile ? (
                    <div className="space-y-5">
                      <div className={`flex items-center space-x-3 p-4 rounded-2xl border ${
                        isAdminAutumnActive 
                          ? 'bg-amber-50/70 border-amber-200/80' 
                          : 'bg-slate-50 border-slate-100'
                      }`}>
                        <div className={`w-11 h-11 rounded-full overflow-hidden bg-white flex items-center justify-center border shadow-sm ${
                          isAdminAutumnActive ? 'border-amber-400' : 'border-slate-200'
                        }`}>
                          {bunnyProfile.photoUrl ? (
                            <img src={bunnyProfile.photoUrl} alt="Bunny avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <Users className={`w-5 h-5 ${isAdminAutumnActive ? 'text-amber-700' : 'text-slate-400'}`} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className={`text-sm font-black truncate ${isAdminAutumnActive ? 'text-stone-900' : 'text-slate-800'}`}>
                            {bunnyProfile.name}
                          </h4>
                          <p className={`text-xs truncate ${isAdminAutumnActive ? 'text-stone-600 font-medium' : 'text-slate-400'}`}>
                            {bunnyProfile.email}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className={`p-3 rounded-2xl border text-center ${
                          isAdminAutumnActive 
                            ? 'bg-amber-50/70 border-amber-200/80' 
                            : 'bg-slate-50 border-slate-100'
                        }`}>
                          <span className={`text-[9px] font-mono block font-bold ${isAdminAutumnActive ? 'text-stone-700' : 'text-slate-400'}`}>
                            CURRENT STREAK
                          </span>
                          <span className={`text-lg font-black ${isAdminAutumnActive ? 'text-amber-950' : 'text-emerald-600'}`}>
                            🔥 {bunnyProfile.currentStreak || 0}d
                          </span>
                        </div>
                        <div className={`p-3 rounded-2xl border text-center ${
                          isAdminAutumnActive 
                            ? 'bg-amber-50/70 border-amber-200/80' 
                            : 'bg-slate-50 border-slate-100'
                        }`}>
                          <span className={`text-[9px] font-mono block font-bold ${isAdminAutumnActive ? 'text-stone-700' : 'text-slate-400'}`}>
                            HIGHEST STREAK
                          </span>
                          <span className={`text-lg font-black ${isAdminAutumnActive ? 'text-stone-900' : 'text-amber-600'}`}>
                            👑 {bunnyProfile.highestStreak || 0}d
                          </span>
                        </div>
                      </div>

                      {/* Micro Calendar Grid */}
                      <div>
                        <span className={`text-[10px] font-mono uppercase tracking-widest block mb-2 font-bold ${
                          isAdminAutumnActive ? 'text-stone-800' : 'text-slate-400'
                        }`}>
                          This Month's Record
                        </span>
                        {renderBunnyCalendarGrid()}
                      </div>
                    </div>
                  ) : (
                    <p className={`text-xs text-center py-8 ${isAdminAutumnActive ? 'text-stone-500 font-medium' : 'text-slate-400'}`}>
                      Bunny has not created her gym profile yet. Standing by...
                    </p>
                  )}
                </section>
              </div>

              {/* Weight Analytics line chart */}
              <div className="lg:col-span-6 space-y-6">
                <section className={`rounded-[32px] p-6 shadow-sm ${
                  isAdminAutumnActive 
                    ? 'bg-white/85 backdrop-blur-md border border-amber-200/90 shadow-amber-950/5' 
                    : 'bg-white border border-slate-100'
                }`}>
                  <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center space-x-2 mb-4 ${
                    isAdminAutumnActive ? 'text-stone-800' : 'text-slate-400'
                  }`}>
                    <Scale className={`w-4 h-4 ${isAdminAutumnActive ? 'text-amber-700' : 'text-emerald-600'}`} />
                    <span>Weight Progress Logs</span>
                  </h3>

                  {chartData.length === 0 ? (
                    <p className={`text-xs text-center py-12 italic ${isAdminAutumnActive ? 'text-stone-500 font-medium' : 'text-slate-400'}`}>
                      No Weight logs registered by Bunny yet. Weight logging must happen on Sundays.
                    </p>
                  ) : (
                    <div className="h-64 w-full" id="admin-weight-chart-container">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isAdminAutumnActive ? "#fed7aa" : "#f1f5f9"} />
                          <XAxis dataKey="date" stroke={isAdminAutumnActive ? "#78716c" : "#94a3b8"} fontSize={9} tickLine={false} />
                          <YAxis stroke={isAdminAutumnActive ? "#78716c" : "#94a3b8"} fontSize={9} tickLine={false} domain={['auto', 'auto']} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#ffffff', 
                              borderColor: isAdminAutumnActive ? '#fde68a' : '#e2e8f0', 
                              borderRadius: '12px', 
                              boxShadow: '0 4px 12px 0 rgba(0,0,0,0.08)' 
                            }}
                            labelClassName={`${isAdminAutumnActive ? 'text-stone-700' : 'text-slate-400'} font-mono text-[9px]`}
                            itemStyle={{ color: isAdminAutumnActive ? '#c2410c' : '#059669', fontWeight: 'bold', fontSize: '11px' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="weight" 
                            stroke={isAdminAutumnActive ? "#ea580c" : "#059669"} 
                            strokeWidth={3} 
                            dot={{ r: 4, stroke: isAdminAutumnActive ? '#f97316' : '#34d399', strokeWidth: 2, fill: '#ffffff' }}
                            activeDot={{ r: 6 }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}

          {/* TAB 2: MEDIA VAULT */}
          {adminTab === 'media' && (
            <div className="space-y-6 animate-fadeIn">
              <section className={`rounded-[32px] p-6 shadow-sm space-y-4 ${
                isAdminAutumnActive 
                  ? 'bg-white/85 backdrop-blur-md border border-amber-200/90 shadow-amber-950/5' 
                  : 'bg-white border border-slate-100'
              }`}>
                <div className={`flex items-center justify-between border-b pb-3 ${
                  isAdminAutumnActive ? 'border-amber-200/80' : 'border-slate-100'
                }`}>
                  <div className="flex items-center space-x-2">
                    <Video className={`w-5 h-5 ${isAdminAutumnActive ? 'text-amber-700' : 'text-emerald-600'}`} />
                    <h3 className={`text-sm font-extrabold ${isAdminAutumnActive ? 'text-stone-900' : 'text-slate-900'}`}>
                      Bunny's Uploaded Media Gallery
                    </h3>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase ${
                    isAdminAutumnActive ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {allUploadedMedia.length} Total Files
                  </span>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setMediaGalleryFilter('all')}
                    className={`px-3.5 py-2 rounded-xl font-black transition-all shrink-0 cursor-pointer whitespace-nowrap border ${
                      mediaGalleryFilter === 'all'
                        ? isAdminAutumnActive 
                          ? 'bg-gradient-to-r from-amber-800 to-orange-600 text-white border-amber-900 shadow-xs' 
                          : 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : isAdminAutumnActive
                          ? 'bg-white/95 text-stone-950 border-amber-300 hover:bg-amber-100 shadow-2xs'
                          : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-100 shadow-2xs'
                    }`}
                  >
                    All Media ({allUploadedMedia.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaGalleryFilter('cheer')}
                    className={`px-3.5 py-2 rounded-xl font-black transition-all shrink-0 cursor-pointer whitespace-nowrap border ${
                      mediaGalleryFilter === 'cheer'
                        ? isAdminAutumnActive 
                          ? 'bg-amber-600 text-white border-amber-700 shadow-xs' 
                          : 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : isAdminAutumnActive 
                          ? 'bg-amber-100 text-amber-950 border-amber-400 hover:bg-amber-200' 
                          : 'bg-emerald-50 text-emerald-950 border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    Cheer Vault ({allUploadedMedia.filter(m => m.source === 'cheer_vault').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaGalleryFilter('gym')}
                    className={`px-3.5 py-2 rounded-xl font-black transition-all shrink-0 cursor-pointer whitespace-nowrap border ${
                      mediaGalleryFilter === 'gym'
                        ? 'bg-orange-600 text-white border-orange-700 shadow-xs'
                        : 'bg-amber-100 text-amber-950 border-amber-400 hover:bg-amber-200'
                    }`}
                  >
                    Gym Spot Checks ({allUploadedMedia.filter(m => m.source === 'gym_proof').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaGalleryFilter('jog')}
                    className={`px-3.5 py-2 rounded-xl font-black transition-all shrink-0 cursor-pointer whitespace-nowrap border ${
                      mediaGalleryFilter === 'jog'
                        ? 'bg-pink-600 text-white border-pink-700 shadow-xs'
                        : 'bg-pink-100 text-pink-950 border-pink-300 hover:bg-pink-200'
                    }`}
                  >
                    Sunday Jogs ({allUploadedMedia.filter(m => m.source === 'sunday_jog').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaGalleryFilter('penalty')}
                    className={`px-3.5 py-2 rounded-xl font-black transition-all shrink-0 cursor-pointer whitespace-nowrap border ${
                      mediaGalleryFilter === 'penalty'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                        : 'bg-rose-100 text-rose-950 border-rose-300 hover:bg-rose-200'
                    }`}
                  >
                    Lockout Penalties ({allUploadedMedia.filter(m => m.source === 'penalty').length})
                  </button>
                </div>

                {/* Media Items Grid */}
                {filteredMediaList.length === 0 ? (
                  <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Video className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-700">No media uploaded in this category yet.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Photos and videos Bunny uploads from her phone, plus Cheer Vault broadcasts, will appear here with live streaming playback.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredMediaList.map((item) => {
                      const isVideo = item.fileType === 'video' || item.url.includes('video') || /\.(mp4|mov|webm|avi|m4v|3gp)/i.test(item.url) || item.url.includes('/video/upload/');
                      const isAudio = item.fileType === 'audio' || item.url.includes('audio') || /\.(mp3|wav|ogg|m4a|aac)/i.test(item.url);

                      return (
                        <div key={item.id} className={`rounded-2xl p-4 space-y-3 shadow-2xs flex flex-col justify-between border ${
                          isAdminAutumnActive 
                            ? 'bg-amber-50/70 border-amber-200/90' 
                            : 'bg-slate-50 border-slate-200/80'
                        }`}>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                                item.source === 'cheer_vault' 
                                  ? (isAdminAutumnActive ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-200') :
                                item.source === 'gym_proof' ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                                item.source === 'sunday_jog' ? 'bg-pink-100 text-pink-900 border border-pink-200' :
                                'bg-rose-100 text-rose-900 border border-rose-200'
                              }`}>
                                {item.categoryLabel}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 font-bold">
                                {item.dateStr}
                              </span>
                            </div>

                            <div>
                              <h4 className={`text-xs font-bold truncate ${isAdminAutumnActive ? 'text-stone-900' : 'text-slate-800'}`}>{item.title}</h4>
                              {item.fileName && <p className="text-[10px] text-slate-400 font-mono truncate">{item.fileName}</p>}
                            </div>

                            {/* Video / Audio Player or Image Viewer */}
                            <div className="rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                              {isVideo ? (
                                <video 
                                  src={item.url} 
                                  controls 
                                  playsInline 
                                  preload="metadata"
                                  className="w-full h-full object-contain"
                                  id={`admin-media-video-${item.id}`}
                                />
                              ) : isAudio ? (
                                <div className="p-4 flex flex-col items-center justify-center text-amber-400 space-y-2 w-full">
                                  <Music className="w-8 h-8" />
                                  <audio controls className="w-full max-w-[220px]">
                                    <source src={item.url} />
                                  </audio>
                                </div>
                              ) : (
                                <img 
                                  src={item.url} 
                                  alt={item.title} 
                                  className="w-full h-full object-cover" 
                                  referrerPolicy="no-referrer"
                                />
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className="py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
                            >
                              <Download className="w-3.5 h-3.5 text-slate-500" />
                              <span>Download</span>
                            </a>

                            <button
                              type="button"
                              onClick={() => handleDeleteGenericMedia(item)}
                              className="py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* TAB 3: PENALTY BOX & REVIEW */}
          {adminTab === 'penalties' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
              
              {/* Penalty Box Control */}
              <div className="lg:col-span-6 space-y-6">
                <section className={`rounded-[32px] p-6 shadow-sm ${
                  isAdminAutumnActive 
                    ? 'bg-white/85 backdrop-blur-md border border-amber-200/90 shadow-amber-950/5' 
                    : 'bg-white border border-slate-100'
                }`}>
                  <div className={`flex items-center justify-between mb-4 pb-2 border-b ${
                    isAdminAutumnActive ? 'border-amber-200/80' : 'border-slate-100'
                  }`}>
                    <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center space-x-2 ${
                      isAdminAutumnActive ? 'text-stone-800' : 'text-slate-400'
                    }`}>
                      <AlertOctagon className="w-4 h-4 text-rose-500 animate-pulse" />
                      <span>Penalty Box Control & Review</span>
                    </h3>

                    <button
                      onClick={() => handleCreateManualPenalty()}
                      className="py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-xl flex items-center space-x-1 cursor-pointer transition-all active:scale-95 shadow-xs"
                    >
                      <span>➕ Issue New Penalty</span>
                    </button>
                  </div>

                  {manualPenaltySuccess && (
                    <div className={`p-3 mb-4 border text-xs font-bold rounded-xl text-center ${
                      isAdminAutumnActive 
                        ? 'bg-amber-50 border-amber-300 text-amber-950' 
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}>
                      {manualPenaltySuccess}
                    </div>
                  )}

                  {/* Tabs for Active vs Cleared Penalties */}
                  <div className="flex items-center space-x-2 mb-4 bg-slate-100 p-1 rounded-2xl">
                    <button
                      onClick={() => setPenaltyTab('active')}
                      className={`flex-1 py-1.5 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
                        penaltyTab === 'active' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Active ({penalties.filter(p => p.status !== 'cleared').length})
                    </button>
                    <button
                      onClick={() => setPenaltyTab('cleared')}
                      className={`flex-1 py-1.5 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
                        penaltyTab === 'cleared' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Cleared History ({penalties.filter(p => p.status === 'cleared').length})
                    </button>
                  </div>

                  {penaltyTab === 'active' ? (
                    penalties.filter(p => p.status !== 'cleared').length === 0 ? (
                      <div className="text-center py-8 space-y-2">
                        <p className={`text-xs italic ${isAdminAutumnActive ? 'text-stone-600 font-medium' : 'text-slate-400'}`}>
                          Bunny has no running penalties! App is unlocked.
                        </p>
                        <button
                          onClick={() => handleCreateManualPenalty()}
                          className="text-xs text-rose-600 hover:underline font-bold"
                        >
                          Need to issue a penalty? Click here
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {penalties.filter(p => p.status !== 'cleared').map((penalty) => {
                          const hasVideos = 
                            penalty.outwardStartUrl || penalty.outwardMiddleUrl || penalty.outwardEndUrl ||
                            penalty.returnStartUrl || penalty.returnMiddleUrl || penalty.returnEndUrl;

                          return (
                            <div key={penalty.id} className={`border rounded-2xl p-4 space-y-4 ${
                              isAdminAutumnActive ? 'bg-amber-50/60 border-amber-200/80' : 'bg-slate-50 border-slate-100'
                            }`}>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono text-rose-600 font-bold uppercase bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                                  {penalty.status}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  {new Date(penalty.createdAt).toLocaleDateString()}
                                </span>
                              </div>

                              <p className={`text-xs font-semibold leading-relaxed ${isAdminAutumnActive ? 'text-stone-900' : 'text-slate-700'}`}>
                                Challenge: <span className="text-slate-500 font-sans italic font-normal">"{penalty.taskDescription}"</span>
                              </p>

                              {/* Video clip display list */}
                              {hasVideos && (
                                <div className="space-y-2 border-t border-slate-100 pt-3">
                                  <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold">
                                    Uploaded Video Proofs:
                                  </span>

                                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                                    {penalty.outwardStartUrl && (
                                      <a href={penalty.outwardStartUrl} target="_blank" rel="referrer noopener" className="p-2 bg-white border border-slate-100 hover:border-amber-400 rounded-xl flex items-center space-x-1.5 text-amber-700 font-bold shadow-xs">
                                        <Play className="w-3 h-3 shrink-0" />
                                        <span className="truncate">Outward Start</span>
                                      </a>
                                    )}
                                    {penalty.outwardMiddleUrl && (
                                      <a href={penalty.outwardMiddleUrl} target="_blank" rel="referrer noopener" className="p-2 bg-white border border-slate-100 hover:border-amber-400 rounded-xl flex items-center space-x-1.5 text-amber-700 font-bold shadow-xs">
                                        <Play className="w-3 h-3 shrink-0" />
                                        <span className="truncate">Outward Middle</span>
                                      </a>
                                    )}
                                    {penalty.outwardEndUrl && (
                                      <a href={penalty.outwardEndUrl} target="_blank" rel="referrer noopener" className="p-2 bg-white border border-slate-100 hover:border-amber-400 rounded-xl flex items-center space-x-1.5 text-amber-700 font-bold shadow-xs">
                                        <Play className="w-3 h-3 shrink-0" />
                                        <span className="truncate">Outward End</span>
                                      </a>
                                    )}
                                    {penalty.returnStartUrl && (
                                      <a href={penalty.returnStartUrl} target="_blank" rel="referrer noopener" className="p-2 bg-white border border-slate-100 hover:border-amber-400 rounded-xl flex items-center space-x-1.5 text-amber-700 font-bold shadow-xs">
                                        <Play className="w-3 h-3 shrink-0" />
                                        <span className="truncate">Return Start</span>
                                      </a>
                                    )}
                                    {penalty.returnMiddleUrl && (
                                      <a href={penalty.returnMiddleUrl} target="_blank" rel="referrer noopener" className="p-2 bg-white border border-slate-100 hover:border-amber-400 rounded-xl flex items-center space-x-1.5 text-amber-700 font-bold shadow-xs">
                                        <Play className="w-3 h-3 shrink-0" />
                                        <span className="truncate">Return Middle</span>
                                      </a>
                                    )}
                                    {penalty.returnEndUrl && (
                                      <a href={penalty.returnEndUrl} target="_blank" rel="referrer noopener" className="p-2 bg-white border border-slate-100 hover:border-amber-400 rounded-xl flex items-center space-x-1.5 text-amber-700 font-bold shadow-xs">
                                        <Play className="w-3 h-3 shrink-0" />
                                        <span className="truncate">Return End</span>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Decisive Actions */}
                              <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                                <button
                                  onClick={() => handlePenaltyApprove(penalty.id)}
                                  className={`py-2 px-3 text-white text-[10px] font-bold rounded-xl flex items-center justify-center space-x-1 transition-all active:scale-95 cursor-pointer shadow-xs ${
                                    isAdminAutumnActive 
                                      ? 'bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600' 
                                      : 'bg-emerald-600 hover:bg-emerald-700'
                                  }`}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Approve & Clear</span>
                                </button>

                                <button
                                  onClick={() => handlePenaltyReject(penalty.id)}
                                  className="py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-xl flex items-center justify-center space-x-1 transition-all active:scale-95 cursor-pointer shadow-xs"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Reject Proof</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )
                  ) : (
                    /* Cleared Penalties History */
                    penalties.filter(p => p.status === 'cleared').length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-8 italic">
                        No cleared penalties history.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {penalties.filter(p => p.status === 'cleared').map((penalty) => (
                          <div key={penalty.id} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase bg-slate-200 px-2 py-0.5 rounded-full">
                                Cleared / Resolved
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {new Date(penalty.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 leading-snug">
                              "{penalty.taskDescription}"
                            </p>

                            <button
                              onClick={() => handlePenaltyReinstate(penalty.id)}
                              className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Reinstate Penalty 🔄 (Lock Bunny's App)</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </section>
              </div>

              {/* Sunday Jog & Gym Submissions */}
              <div className="lg:col-span-6 space-y-6">
                
                {/* Sunday Jog 10s Video Reviewer */}
                <section className={`rounded-[32px] p-6 shadow-sm ${
                  isAdminAutumnActive 
                    ? 'bg-white/85 backdrop-blur-md border border-amber-200/90 shadow-amber-950/5' 
                    : 'bg-white border border-slate-100'
                }`}>
                  <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center space-x-2 mb-4 pb-2 border-b ${
                    isAdminAutumnActive ? 'border-amber-200/80 text-stone-800' : 'border-slate-100 text-slate-400'
                  }`}>
                    <Video className="w-4 h-4 text-pink-500" />
                    <span>Sunday Jog 10s Video Clips</span>
                  </h3>

                  {sundayJogs.length === 0 ? (
                    <p className={`text-xs text-center py-6 italic ${isAdminAutumnActive ? 'text-stone-500 font-medium' : 'text-slate-400'}`}>
                      No Sunday jog videos uploaded yet.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {sundayJogs.map((jog) => (
                        <div key={jog.id} className="bg-pink-50/40 border border-pink-200/80 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center justify-between text-xs font-bold text-pink-900">
                            <span>Jog Date: {jog.dateStr}</span>
                            <span className="text-[10px] font-mono text-slate-400">Expires: {jog.expiresAt}</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {/* Start Clip */}
                            <div className="bg-white p-2.5 rounded-xl border border-pink-100 text-[11px] space-y-1.5">
                              <span className="font-bold text-pink-800 block">1. Start Clip</span>
                              {jog.startUrl ? (
                                <>
                                  <video src={jog.startUrl} controls className="w-full h-20 object-cover rounded-lg bg-black" />
                                  <a 
                                    href={jog.startUrl} 
                                    download 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="w-full py-1.5 bg-pink-100 hover:bg-pink-200 text-pink-800 rounded-lg font-bold text-[10px] flex items-center justify-center space-x-1"
                                  >
                                    <span>Download Start Clip</span>
                                  </a>
                                </>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Not uploaded</span>
                              )}
                            </div>

                            {/* Middle Clip */}
                            <div className="bg-white p-2.5 rounded-xl border border-pink-100 text-[11px] space-y-1.5">
                              <span className="font-bold text-pink-800 block">2. Midpoint Clip</span>
                              {jog.middleUrl ? (
                                <>
                                  <video src={jog.middleUrl} controls className="w-full h-20 object-cover rounded-lg bg-black" />
                                  <a 
                                    href={jog.middleUrl} 
                                    download 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="w-full py-1.5 bg-pink-100 hover:bg-pink-200 text-pink-800 rounded-lg font-bold text-[10px] flex items-center justify-center space-x-1"
                                  >
                                    <span>Download Mid Clip</span>
                                  </a>
                                </>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Not uploaded</span>
                              )}
                            </div>

                            {/* Finish Clip */}
                            <div className="bg-white p-2.5 rounded-xl border border-pink-100 text-[11px] space-y-1.5">
                              <span className="font-bold text-pink-800 block">3. Finish Clip</span>
                              {jog.finishUrl ? (
                                <>
                                  <video src={jog.finishUrl} controls className="w-full h-20 object-cover rounded-lg bg-black" />
                                  <a 
                                    href={jog.finishUrl} 
                                    download 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="w-full py-1.5 bg-pink-100 hover:bg-pink-200 text-pink-800 rounded-lg font-bold text-[10px] flex items-center justify-center space-x-1"
                                  >
                                    <span>Download Finish Clip</span>
                                  </a>
                                </>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Not uploaded</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Random Gym Verification Proofs */}
                <section className={`rounded-[32px] p-6 shadow-sm ${
                  isAdminAutumnActive 
                    ? 'bg-white/85 backdrop-blur-md border border-amber-200/90 shadow-amber-950/5' 
                    : 'bg-white border border-slate-100'
                }`}>
                  <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center space-x-2 mb-4 pb-2 border-b ${
                    isAdminAutumnActive ? 'border-amber-200/80 text-stone-800' : 'border-slate-100 text-slate-400'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                    <span>Random Gym Proof Submissions</span>
                  </h3>

                  {gymProofs.length === 0 ? (
                    <p className={`text-xs text-center py-6 italic ${isAdminAutumnActive ? 'text-stone-500 font-medium' : 'text-slate-400'}`}>
                      No random gym proof photos/videos uploaded yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {gymProofs.map((proof) => (
                        <div key={proof.id} className="bg-amber-50/50 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between">
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-amber-950 block">Uploaded for {proof.dateStr}</span>
                            <span className="text-[10px] font-mono text-slate-400 block">{proof.fileName}</span>
                          </div>

                          <a 
                            href={proof.fileUrl} 
                            download 
                            target="_blank" 
                            rel="noreferrer"
                            className="py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                          >
                            Download Proof
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}

          {/* TAB 4: CHEER VAULT BROADCASTER */}
          {adminTab === 'cheer' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
              
              {/* Upload Form Column */}
              <div className="lg:col-span-6 space-y-6">
                <section className={`rounded-[32px] p-6 shadow-sm space-y-4 ${
                  isAdminAutumnActive 
                    ? 'bg-white/85 backdrop-blur-md border border-amber-200/90 shadow-amber-950/5' 
                    : 'bg-white border border-slate-100'
                }`}>
                  <div className={`flex items-center justify-between pb-3 border-b ${
                    isAdminAutumnActive ? 'border-amber-200/80' : 'border-slate-100'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <Award className={`w-5 h-5 ${isAdminAutumnActive ? 'text-amber-700' : 'text-emerald-600'}`} />
                      <h3 className={`text-sm font-extrabold ${isAdminAutumnActive ? 'text-stone-900' : 'text-slate-900'}`}>
                        Cheer Vault Broadcaster (Zambia Node 🇿🇲)
                      </h3>
                    </div>
                  </div>

                  <form onSubmit={handleCheerUpload} className="space-y-4">
                    {cheerError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-bold">
                        {cheerError}
                      </div>
                    )}

                    {cheerSuccess && (
                      <div className={`p-3 border text-xs rounded-xl font-bold text-center ${
                        isAdminAutumnActive 
                          ? 'bg-amber-50 border-amber-300 text-amber-950' 
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      }`}>
                        ✨ Cheer broadcast pushed to Bunny successfully!
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 block uppercase font-bold">Cheer Title</label>
                      <input
                        type="text"
                        required
                        value={cheerTitle}
                        onChange={(e) => setCheerTitle(e.target.value)}
                        placeholder="e.g. Keep going Bunny! Voice Note"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 focus:border-amber-400 rounded-xl text-xs text-slate-800 font-sans"
                        id="admin-cheer-title-input"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setCheerType('audio')}
                        className={`p-3.5 border-2 text-xs font-black rounded-xl text-center flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                          cheerType === 'audio' 
                            ? (isAdminAutumnActive ? 'bg-amber-200 border-amber-500 text-amber-950 shadow-sm' : 'bg-emerald-100 border-emerald-500 text-emerald-950 shadow-sm')
                            : (isAdminAutumnActive ? 'bg-white border-amber-200 hover:bg-amber-50 text-stone-900' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-800')
                        }`}
                      >
                        <Music className="w-4 h-4 shrink-0" />
                        <span className="whitespace-nowrap">Audio Voice Note</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCheerType('video')}
                        className={`p-3.5 border-2 text-xs font-black rounded-xl text-center flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                          cheerType === 'video' 
                            ? (isAdminAutumnActive ? 'bg-amber-200 border-amber-500 text-amber-950 shadow-sm' : 'bg-emerald-100 border-emerald-500 text-emerald-950 shadow-sm')
                            : (isAdminAutumnActive ? 'bg-white border-amber-200 hover:bg-amber-50 text-stone-900' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-800')
                        }`}
                      >
                        <Video className="w-4 h-4 shrink-0" />
                        <span className="whitespace-nowrap">Video Clip</span>
                      </button>
                    </div>

                    {/* Mode Toggle: File vs Link */}
                    <div className="flex items-center space-x-1.5 p-1 bg-amber-100/70 border border-amber-200 rounded-xl text-xs font-black">
                      <button
                        type="button"
                        onClick={() => setCheerInputMode('file')}
                        className={`flex-1 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                          cheerInputMode === 'file' 
                            ? 'bg-white text-stone-950 shadow-xs font-black border border-amber-300' 
                            : 'text-stone-700 hover:text-stone-950 font-bold'
                        }`}
                      >
                        📁 File Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => setCheerInputMode('link')}
                        className={`flex-1 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                          cheerInputMode === 'link' 
                            ? 'bg-white text-stone-950 shadow-xs font-black border border-amber-300' 
                            : 'text-stone-700 hover:text-stone-950 font-bold'
                        }`}
                      >
                        🔗 Paste Link
                      </button>
                    </div>

                    {cheerInputMode === 'file' ? (
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-400 block uppercase font-bold">Select Local File</label>
                        <label className="flex flex-col items-center justify-center p-6 border border-dashed border-amber-300 bg-amber-50/50 hover:bg-amber-100/60 rounded-2xl cursor-pointer transition-all">
                          <Upload className="w-6 h-6 text-amber-700 mb-1" />
                          <span className="text-xs text-stone-900 font-black truncate max-w-[220px]">
                            {cheerFile ? cheerFile.name : "Select audio or video..."}
                          </span>
                          <input
                            type="file"
                            accept={cheerType === 'audio' ? "audio/*" : "video/*"}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setCheerFile(e.target.files[0]);
                              }
                            }}
                            className="hidden"
                            id="admin-cheer-file-input"
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-400 block uppercase font-bold">Media Share Link (Drive / YouTube / Direct MP3)</label>
                        <input
                          type="url"
                          value={cheerLinkUrl}
                          onChange={(e) => setCheerLinkUrl(e.target.value)}
                          placeholder="https://drive.google.com/file/d/... or YouTube / MP3 link"
                          className="w-full px-3.5 py-2.5 bg-white border border-amber-300 focus:border-amber-500 rounded-xl text-xs text-stone-950 font-medium"
                          id="admin-cheer-link-input"
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={cheerUpload.loading}
                      className={`w-full py-3.5 text-white font-black rounded-2xl transition-all flex items-center justify-center space-x-2 text-xs sm:text-sm cursor-pointer shadow-md active:scale-95 disabled:bg-slate-200 disabled:text-slate-500 ${
                        isAdminAutumnActive 
                          ? 'bg-gradient-to-r from-amber-800 to-orange-600 hover:from-amber-900 hover:to-orange-700 border border-amber-900/40' 
                          : 'bg-emerald-600 hover:bg-emerald-700 border border-emerald-700'
                      }`}
                      id="submit-cheer-vault-btn"
                    >
                      {cheerUpload.loading ? (
                        <span className="animate-pulse">Broadcasting {cheerUpload.pct}%...</span>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 shrink-0" />
                          <span className="whitespace-nowrap font-black">Broadcast Cheer to Bunny</span>
                        </>
                      )}
                    </button>
                  </form>
                </section>
              </div>

              {/* Uploaded Cheer Vault Items List */}
              <div className="lg:col-span-6 space-y-6">
                <section className={`rounded-[32px] p-6 shadow-sm space-y-4 ${
                  isAdminAutumnActive 
                    ? 'bg-white/85 backdrop-blur-md border border-amber-200/90 shadow-amber-950/5' 
                    : 'bg-white border border-slate-100'
                }`}>
                  <div className={`flex items-center justify-between border-b pb-3 ${
                    isAdminAutumnActive ? 'border-amber-200/80' : 'border-slate-100'
                  }`}>
                    <h3 className={`text-sm font-extrabold flex items-center space-x-2 ${
                      isAdminAutumnActive ? 'text-stone-900' : 'text-slate-900'
                    }`}>
                      <Music className={`w-4 h-4 ${isAdminAutumnActive ? 'text-amber-700' : 'text-emerald-600'}`} />
                      <span>Cheer Vault Items Sent to Bunny</span>
                    </h3>
                  </div>

                  {cheerVault.length === 0 ? (
                    <div className={`text-center py-12 px-4 rounded-2xl border border-dashed space-y-2 ${
                      isAdminAutumnActive ? 'bg-amber-50/50 border-amber-300' : 'bg-emerald-50/40 border-emerald-200'
                    }`}>
                      <Sparkles className={`w-8 h-8 mx-auto animate-pulse ${isAdminAutumnActive ? 'text-amber-500' : 'text-emerald-400'}`} />
                      <p className={`text-xs font-bold ${isAdminAutumnActive ? 'text-stone-800' : 'text-slate-700'}`}>No cheers broadcasted yet.</p>
                      <p className={`text-[11px] ${isAdminAutumnActive ? 'text-stone-500 font-medium' : 'text-slate-400'}`}>
                        Upload audio voice notes and video cheers here to motivate Bunny on her dashboard.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[30rem] overflow-y-auto pr-1">
                      {cheerVault.map((item) => (
                        <div key={item.id} className={`border rounded-2xl p-4 shadow-xs space-y-3 ${
                          isAdminAutumnActive ? 'bg-amber-50/70 border-amber-200/80' : 'bg-slate-50 border-slate-200/80'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2.5">
                              {item.fileType === 'audio' ? (
                                <div className={`p-2 rounded-xl ${isAdminAutumnActive ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>
                                  <Music className="w-4 h-4" />
                                </div>
                              ) : (
                                <div className="p-2 bg-teal-100 text-teal-700 rounded-xl">
                                  <Play className="w-4 h-4" />
                                </div>
                              )}
                              <div>
                                <h4 className={`text-xs font-bold ${isAdminAutumnActive ? 'text-stone-900' : 'text-slate-800'}`}>{item.title}</h4>
                                <span className="text-[9px] text-slate-400 uppercase font-mono font-bold">
                                  {item.fileType === 'audio' ? '🎵 Voice Note' : '🎬 Video Cheer'}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          {item.fileType === 'audio' ? (
                            <audio controls className="w-full h-10 mt-1">
                              <source src={item.fileUrl} />
                              Your browser does not support audio playback.
                            </audio>
                          ) : (
                            <video controls playsInline className="w-full rounded-2xl overflow-hidden aspect-video bg-black">
                              <source src={item.fileUrl} />
                              Your browser does not support video playback.
                            </video>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                            <a
                              href={item.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className="text-[11px] font-bold text-slate-600 hover:text-slate-800 flex items-center space-x-1"
                            >
                              <Download className="w-3.5 h-3.5 text-slate-400" />
                              <span>Download</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDeleteCheer(item.id)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold flex items-center space-x-1 transition-all cursor-pointer active:scale-95"
                            >
                              <Trash2 className="w-3 h-3 text-rose-500" />
                              <span>Delete Broadcast</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}

          {/* TAB 5: BROADCASTER & SERVER CONFIG */}
          {adminTab === 'broadcaster' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
              
              {/* Daily Tip & Punishments Column */}
              <div className="lg:col-span-6 space-y-6">
                
                {/* Form 1: Daily Broadcaster Tip */}
                <section className={`rounded-[32px] p-6 shadow-sm ${
                  isAdminAutumnActive 
                    ? 'bg-white/85 backdrop-blur-md border border-amber-200/90 shadow-amber-950/5' 
                    : 'bg-white border border-slate-100'
                }`}>
                  <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center justify-between mb-4 pb-2 border-b ${
                    isAdminAutumnActive ? 'border-amber-200/80 text-stone-800' : 'border-slate-100 text-slate-400'
                  }`}>
                    <span className="flex items-center space-x-2">
                      <MessageSquare className={`w-4 h-4 ${isAdminAutumnActive ? 'text-amber-700' : 'text-emerald-600'}`} />
                      <span>Daily Tip Broadcast</span>
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                      isAdminAutumnActive ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-50 text-emerald-700'
                    }`}>Standalone</span>
                  </h3>

                  <form onSubmit={handleSaveDailyTip} className="space-y-4">
                    {tipSuccess && (
                      <div className={`p-3 border text-xs font-semibold rounded-xl text-center ${
                        isAdminAutumnActive 
                          ? 'bg-amber-50 border-amber-300 text-amber-950' 
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      }`}>
                        ✨ Daily Tip broadcasted successfully!
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-400 block uppercase font-bold">
                        Daily Broadcaster Tip Content
                      </label>
                      <textarea
                        value={dailyTip}
                        onChange={(e) => setDailyTip(e.target.value)}
                        placeholder="e.g., Do 20 extra pushups today!"
                        rows={2.5}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-2xl text-xs text-slate-800 placeholder-slate-400 outline-none transition-all font-sans"
                        id="admin-daily-tip-input"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingTip}
                      className={`w-full py-2.5 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-2xl transition-all flex items-center justify-center space-x-2 text-xs cursor-pointer shadow-xs ${
                        isAdminAutumnActive 
                          ? 'bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600' 
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                      id="save-daily-tip-btn"
                    >
                      {savingTip ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Broadcast Daily Tip Only</span>
                        </>
                      )}
                    </button>
                  </form>
                </section>

                {/* Form 2: Punishment & Penalty Settings */}
                <section className={`rounded-[32px] p-6 shadow-sm space-y-4 ${
                  isAdminAutumnActive 
                    ? 'bg-white/85 backdrop-blur-md border border-amber-200/90 shadow-amber-950/5' 
                    : 'bg-white border border-slate-100'
                }`}>
                  <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center justify-between pb-2 border-b ${
                    isAdminAutumnActive ? 'border-amber-200/80 text-stone-800' : 'border-slate-100 text-slate-400'
                  }`}>
                    <span className="flex items-center space-x-2">
                      <AlertOctagon className="w-4 h-4 text-rose-500" />
                      <span>Punishments & Ego Deflater</span>
                    </span>
                    <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-mono font-bold">Standalone</span>
                  </h3>

                  <form onSubmit={handleSavePunishmentSettings} className="space-y-4">
                    {punishmentSuccess && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl text-center">
                        ⚠️ Punishment settings broadcasted successfully!
                      </div>
                    )}

                    {/* Ego Deflater Msg */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-400 block uppercase font-bold">
                        Ego Deflater Disappointment Message
                      </label>
                      <textarea
                        value={egoDeflaterMsg}
                        onChange={(e) => setEgoDeflaterMsg(e.target.value)}
                        placeholder="e.g., You skipped! The Penguin is heavily disappointed."
                        rows={2.5}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 focus:border-rose-300 focus:ring-1 focus:ring-rose-300 rounded-2xl text-xs text-slate-800 placeholder-slate-400 outline-none transition-all font-sans"
                        id="admin-ego-deflater-input"
                      />
                    </div>

                    {/* Penalty Task Description */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-mono text-slate-400 block uppercase font-bold">
                          Default Lockout Penalty Challenge
                        </label>
                        <span className="text-[10px] text-rose-600 font-bold">Quick Preset:</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pb-1">
                        {WEIGHT_LOSS_PENALTIES.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setPenaltyTaskDesc(preset)}
                            className="px-2 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-[10px] font-medium rounded-lg transition-all cursor-pointer border border-slate-200"
                          >
                            {preset.split('&')[0]}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setPenaltyTaskDesc("random")}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold rounded-lg transition-all cursor-pointer border border-rose-200"
                        >
                          🎲 Auto-Randomize
                        </button>
                      </div>

                      <textarea
                        value={penaltyTaskDesc}
                        onChange={(e) => setPenaltyTaskDesc(e.target.value)}
                        placeholder="e.g., 2 KM (1.24 Miles) Outdoor Run & Video Clips"
                        rows={2.5}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 focus:border-rose-300 focus:ring-1 focus:ring-rose-300 rounded-2xl text-xs text-slate-800 placeholder-slate-400 outline-none transition-all font-sans"
                        id="admin-penalty-desc-input"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingPunishment}
                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-2xl transition-all flex items-center justify-center space-x-2 text-xs cursor-pointer shadow-xs"
                      id="save-punishments-btn"
                    >
                      {savingPunishment ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Broadcast Punishments Only</span>
                        </>
                      )}
                    </button>
                  </form>
                </section>
              </div>

              {/* Quiz Questions & Cloudinary Column */}
              <div className="lg:col-span-6 space-y-6">
                
                {/* Form 3: 3-Stage Psychological Quiz Questions */}
                <section className={`rounded-[32px] p-6 shadow-sm space-y-4 ${
                  isAdminAutumnActive 
                    ? 'bg-white/85 backdrop-blur-md border border-amber-200/90 shadow-amber-950/5' 
                    : 'bg-white border border-slate-100'
                }`}>
                  <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center justify-between pb-2 border-b ${
                    isAdminAutumnActive ? 'border-amber-200/80 text-stone-800' : 'border-slate-100 text-slate-400'
                  }`}>
                    <span className="flex items-center space-x-2">
                      <HelpCircle className="w-4 h-4 text-cyan-600" />
                      <span>3-Stage Quiz Questions</span>
                    </span>
                    <span className="text-[10px] bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full font-mono font-bold">Standalone</span>
                  </h3>

                  <form onSubmit={handleSaveQuizQuestions} className="space-y-4">
                    {quizSuccess && (
                      <div className="p-3 bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-semibold rounded-xl text-center">
                        🧠 Quiz questions broadcasted successfully!
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-slate-400 uppercase block font-bold">Step 1 Question (Yes/No)</label>
                        <input
                          type="text"
                          value={q1}
                          onChange={(e) => setQ1(e.target.value)}
                          placeholder="Did you step foot in the gym today?"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-100 focus:border-cyan-300 rounded-xl text-xs text-slate-800"
                          id="admin-q1-input"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-slate-400 uppercase block font-bold">Step 2 Question (Proceed/Cancel)</label>
                        <input
                          type="text"
                          value={q2}
                          onChange={(e) => setQ2(e.target.value)}
                          placeholder="Are you absolutely sure you gave 100%?"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-100 focus:border-cyan-300 rounded-xl text-xs text-slate-800"
                          id="admin-q2-input"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-slate-400 uppercase block font-bold">Step 3 Warning Banner Text</label>
                        <input
                          type="text"
                          value={q3}
                          onChange={(e) => setQ3(e.target.value)}
                          placeholder="WARNING: Once confirmed, this day is permanently locked green."
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-100 focus:border-cyan-300 rounded-xl text-xs text-slate-800"
                          id="admin-q3-input"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={savingQuiz}
                      className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-2xl transition-all flex items-center justify-center space-x-2 text-xs cursor-pointer shadow-xs"
                      id="save-quiz-btn"
                    >
                      {savingQuiz ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Broadcast Quiz Questions Only</span>
                        </>
                      )}
                    </button>
                  </form>
                </section>

                {/* Form 4: Cloudinary Media Storage Integration */}
                <CloudinaryConfigCard />
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Date Details Inspector Modal */}
      {selectedDateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-mono font-bold text-slate-800">
                DATE INSPECTOR: {selectedDateModal}
              </span>
              <button
                onClick={() => setSelectedDateModal(null)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {bunnyWorkouts[selectedDateModal] ? (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Workout Locked & Verified</span>
                </div>
                {bunnyWorkouts[selectedDateModal].proofUrl && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 block font-bold">PROOF MEDIA</span>
                    <a
                      href={bunnyWorkouts[selectedDateModal].proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-emerald-600 font-bold hover:underline break-all block p-2 bg-slate-50 rounded-xl border border-slate-100"
                    >
                      View Media Attachment ↗
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-2 text-rose-800 text-xs font-bold">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>No Workout Record Locked</span>
                </div>
                <p className="text-xs text-slate-500">
                  Bunny did not log or confirm a workout on this date.
                </p>
              </div>
            )}

            <button
              onClick={() => setSelectedDateModal(null)}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}

      {/* Issue Manual Penalty Modal */}
      {showIssuePenaltyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-mono font-bold text-rose-600 flex items-center space-x-1.5">
                <AlertOctagon className="w-4 h-4" />
                <span>ISSUE MANUAL LOCKOUT PENALTY</span>
              </span>
              <button
                onClick={() => setShowIssuePenaltyModal(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This will immediately lock Bunny's app with a mandatory workout challenge until she uploads video proofs and you approve them.
            </p>

            <div className="space-y-2">
              <label className="text-[10px] font-mono text-slate-400 uppercase block font-bold">
                Penalty Task Challenge Description
              </label>
              <textarea
                value={penaltyTaskDesc}
                onChange={(e) => setPenaltyTaskDesc(e.target.value)}
                placeholder="e.g., 2 KM Outdoor Run & 10s Video Proofs"
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-rose-300 rounded-2xl text-xs text-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowIssuePenaltyModal(false)}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowIssuePenaltyModal(false);
                  handleCreateManualPenalty();
                }}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              >
                Issue Lockout Now 🔒
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
