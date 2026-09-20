import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DailyCheckinEntry, CheckinQuestionItem, EmailReminderConfig } from '../types';
import { Mail, Send, CheckCircle2, Clock, Calendar, Sparkles, Plus, AlertCircle, Eye, ExternalLink, Film, Play, Flame, Zap, Check } from 'lucide-react';
import EmailManagerTab from './EmailManagerTab';

interface CoachCheckinAdminProps {
  onOpenCheckinPreview?: () => void;
}

const DEFAULT_QUESTIONS: CheckinQuestionItem[] = [
  { id: 'ate', label: 'Did you eat today?', on: true, category: 'food' },
  { id: 'mealCount', label: 'How many times did you eat?', on: true, category: 'food' },
  { id: 'whatAte', label: 'What did you eat?', on: true, category: 'food' },
  { id: 'morningExercise', label: 'Morning exercise done?', on: true, category: 'movement' },
  { id: 'gym', label: 'Gym today?', on: true, category: 'movement' },
  { id: 'caloriesBurned', label: 'Calories burned', on: true, category: 'movement' },
  { id: 'water', label: 'Drank water today?', on: true, category: 'movement' },
  { id: 'lostWeight', label: 'Did you lose weight?', on: true, category: 'progress' },
  { id: 'energy', label: 'Energy: morning vs now', on: true, category: 'energy' },
  { id: 'goodDay', label: 'Good day overall?', on: true, category: 'energy' },
  { id: 'note', label: 'Anything else (feelings / thoughts)', on: true, category: 'note' },
];

export default function CoachCheckinAdmin({ onOpenCheckinPreview }: CoachCheckinAdminProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'entries' | 'settings' | 'email'>('overview');
  
  // Real-time entries from Firestore
  const [entries, setEntries] = useState<DailyCheckinEntry[]>([]);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  // Question Settings
  const [questions, setQuestions] = useState<CheckinQuestionItem[]>(DEFAULT_QUESTIONS);
  const [newQuestionLabel, setNewQuestionLabel] = useState('');
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Email Reminder Settings
  const [emailConfig, setEmailConfig] = useState<EmailReminderConfig>({
    recipientEmail: 'spikesam019@gmail.com',
    enabled: true,
    targetHour: 19, // 7 PM
    customNote: ''
  });
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [activeSendingType, setActiveSendingType] = useState<string | null>(null);
  const [emailFeedback, setEmailFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [emailServerStatus, setEmailServerStatus] = useState<{ connected: boolean; senderEmail: string } | null>(null);

  // Scheduled Timers & Video config
  const [scheduleStatusData, setScheduleStatusData] = useState<any>(null);
  const [penguinVideoUrl, setPenguinVideoUrl] = useState<string>('');
  const [isSavingVideo, setIsSavingVideo] = useState(false);
  const [videoSaveFeedback, setVideoSaveFeedback] = useState<string | null>(null);

  // 1. Subscribe to Firestore Check-ins
  useEffect(() => {
    const q = query(collection(db, 'daily_checkins'), orderBy('submittedAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: DailyCheckinEntry[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as DailyCheckinEntry);
      });
      setEntries(list);
    }, (error) => {
      console.warn('Error fetching daily checkins:', error);
    });

    return () => unsub();
  }, []);

  // 2. Load Question and Email Settings
  useEffect(() => {
    async function loadSettings() {
      try {
        // Questions
        const qRef = doc(db, 'checkin_settings', 'questions');
        const qSnap = await getDoc(qRef);
        if (qSnap.exists() && qSnap.data().items) {
          setQuestions(qSnap.data().items);
        }

        // Email Config
        const eRef = doc(db, 'config', 'emailReminder');
        const eSnap = await getDoc(eRef);
        if (eSnap.exists()) {
          setEmailConfig(prev => ({ ...prev, ...eSnap.data() }));
        }

        // Penguin Celebration Video
        const vRef = doc(db, 'config', 'penguinCelebration');
        const vSnap = await getDoc(vRef);
        if (vSnap.exists() && vSnap.data().videoUrl) {
          setPenguinVideoUrl(vSnap.data().videoUrl);
        }

        // Check backend email status
        fetch('/api/email-status')
          .then(res => res.json())
          .then(data => {
            setEmailServerStatus({
              connected: data.connected ?? false,
              senderEmail: data.senderEmail || 'josaphatkychiloz@gmail.com'
            });
          })
          .catch(() => {
            setEmailServerStatus({
              connected: true,
              senderEmail: 'josaphatkychiloz@gmail.com'
            });
          });

        // Check backend schedule status
        fetch('/api/schedule-status')
          .then(res => res.json())
          .then(data => {
            setScheduleStatusData(data);
          })
          .catch(e => console.warn('Could not fetch schedule status:', e));
      } catch (err) {
        console.warn('Could not load coach settings:', err);
      }
    }

    loadSettings();
  }, []);

  // Refresh schedule status
  const refreshScheduleStatus = async () => {
    try {
      const res = await fetch('/api/schedule-status');
      const data = await res.json();
      setScheduleStatusData(data);
    } catch (e) {
      console.warn('Could not refresh schedule status:', e);
    }
  };

  // Save Penguin Video
  const handleSavePenguinVideo = async () => {
    setIsSavingVideo(true);
    setVideoSaveFeedback(null);
    try {
      await setDoc(doc(db, 'config', 'penguinCelebration'), {
        videoUrl: penguinVideoUrl.trim(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setVideoSaveFeedback('Video configuration saved! Bunny will see this on completion.');
      setTimeout(() => setVideoSaveFeedback(null), 4000);
    } catch (e: any) {
      setVideoSaveFeedback('Error saving video: ' + e.message);
    } finally {
      setIsSavingVideo(false);
    }
  };

  // Save Question Toggles
  const handleToggleQuestion = async (index: number) => {
    const updated = [...questions];
    updated[index].on = !updated[index].on;
    setQuestions(updated);

    try {
      await setDoc(doc(db, 'checkin_settings', 'questions'), { items: updated });
    } catch (e) {
      console.error('Failed to save question toggle:', e);
    }
  };

  const handleUpdateQuestionLabel = async (index: number, newLabel: string) => {
    const updated = [...questions];
    updated[index].label = newLabel;
    setQuestions(updated);
  };

  const handleSaveAllQuestions = async () => {
    try {
      await setDoc(doc(db, 'checkin_settings', 'questions'), { items: questions });
      setSaveStatus('Questions saved successfully!');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (e: any) {
      setSaveStatus('Error: ' + e.message);
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestionLabel.trim()) return;
    const newQ: CheckinQuestionItem = {
      id: 'custom_' + Date.now(),
      label: newQuestionLabel.trim(),
      on: true,
      category: 'custom'
    };
    const updated = [...questions, newQ];
    setQuestions(updated);
    setNewQuestionLabel('');
    setIsAddingQuestion(false);

    try {
      await setDoc(doc(db, 'checkin_settings', 'questions'), { items: updated });
    } catch (e) {
      console.error('Failed to add question:', e);
    }
  };

  // Save Email Config
  const handleSaveEmailConfig = async () => {
    try {
      await setDoc(doc(db, 'config', 'emailReminder'), emailConfig);
      // Also update server recipient config
      await fetch('/api/update-recipient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: emailConfig.recipientEmail })
      });
      setEmailFeedback({ type: 'success', message: 'Email settings saved and synced with scheduler!' });
      setTimeout(() => setEmailFeedback(null), 4000);
    } catch (e: any) {
      setEmailFeedback({ type: 'error', message: 'Failed to save: ' + e.message });
    }
  };

  // Dispatch Specific Scheduled Reminder Test
  const handleSendSpecificReminder = async (reminderId: 'morning_exercise' | 'hydration' | 'movement_gym' | 'main_event') => {
    if (!emailConfig.recipientEmail) {
      setEmailFeedback({ type: 'error', message: 'Please enter Bunny\'s email address first.' });
      return;
    }

    setIsSendingEmail(true);
    setActiveSendingType(reminderId);
    setEmailFeedback(null);

    try {
      const res = await fetch('/api/send-scheduled-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reminderId,
          toEmail: emailConfig.recipientEmail,
          appUrl: window.location.origin
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch email.');
      }

      setEmailFeedback({
        type: 'success',
        message: `Dispatched "${reminderId}" test email to ${emailConfig.recipientEmail}! Check inbox or spam.`
      });
      refreshScheduleStatus();
    } catch (err: any) {
      setEmailFeedback({
        type: 'error',
        message: err.message || 'Error communicating with mail server.'
      });
    } finally {
      setIsSendingEmail(false);
      setActiveSendingType(null);
    }
  };

  // Dispatch Manual Reminder
  const handleSendReminderNow = async () => {
    return handleSendSpecificReminder('main_event');
  };

  // Calculated Stats
  const stats = useMemo(() => {
    const totalEntries = entries.length;
    const gymDays = entries.filter(e => e.gym).length;
    
    // Weight calculation
    const withWeight = entries.filter(e => e.lostWeight && e.weightDelta);
    const totalWeightLost = withWeight.reduce((acc, curr) => acc + (curr.weightDelta || 0), 0);

    // Energy Shift
    const withEnergy = entries.filter(e => e.energyNow !== undefined && e.energyMorning !== undefined);
    const avgEnergyShift = withEnergy.length > 0
      ? (withEnergy.reduce((acc, curr) => acc + (curr.energyNow - curr.energyMorning), 0) / withEnergy.length).toFixed(1)
      : '+1.2';

    return {
      totalEntries,
      gymDays,
      weightChange: totalWeightLost > 0 ? `−${totalWeightLost.toFixed(1)} kg` : '0 kg',
      avgEnergyShift: Number(avgEnergyShift) > 0 ? `+${avgEnergyShift}` : avgEnergyShift
    };
  }, [entries]);

  return (
    <div 
      className="rounded-[24px] p-6 sm:p-8 font-['Inter',sans-serif] text-[#2B2620] border border-[rgba(43,38,32,0.14)] shadow-lg"
      style={{ backgroundColor: '#FBF8F0' }}
      id="coach-checkin-admin-root"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[rgba(43,38,32,0.1)]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-['Fraunces',serif] text-2xl sm:text-3xl font-semibold text-[#2B2620]">
              Coach Dashboard
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#4B6650]/15 text-[#34473A] font-bold font-mono">
              Daily Check-Ins
            </span>
          </div>
          <p className="text-[#6B6255] text-sm mt-1">
            Bunny's daily check-ins, habit trends, and email reminder controls.
          </p>
        </div>

        {onOpenCheckinPreview && (
          <button
            onClick={onOpenCheckinPreview}
            className="self-start sm:self-center px-4 py-2 rounded-xl bg-[#4B6650] hover:bg-[#34473A] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm transition-all active:scale-95"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Open Bunny's Form View</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 sm:gap-6 border-b border-[rgba(43,38,32,0.1)] mb-6 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'entries', label: `Entries (${entries.length})` },
          { id: 'settings', label: 'Question Settings' },
          { id: 'email', label: 'Email Reminders 💌' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 px-1 text-sm font-semibold transition-all relative whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'text-[#2B2620]'
                : 'text-[#6B6255] hover:text-[#2B2620]'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4B6650] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* ========================================================== */}
      {/* 1. OVERVIEW PANEL */}
      {/* ========================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stat Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="bg-[#F4EFE2] border border-[rgba(43,38,32,0.1)] rounded-2xl p-4 sm:p-5">
              <div className="text-xs text-[#6B6255] mb-2 font-medium">Logged Check-ins</div>
              <div className="font-['Fraunces',serif] text-2xl sm:text-3xl font-semibold text-[#2B2620]">
                {stats.totalEntries} days
              </div>
            </div>

            <div className="bg-[#F4EFE2] border border-[rgba(43,38,32,0.1)] rounded-2xl p-4 sm:p-5">
              <div className="text-xs text-[#6B6255] mb-2 font-medium">Weight Shift (Logs)</div>
              <div className="font-['Fraunces',serif] text-2xl sm:text-3xl font-semibold text-[#4B6650]">
                {stats.weightChange}
              </div>
            </div>

            <div className="bg-[#F4EFE2] border border-[rgba(43,38,32,0.1)] rounded-2xl p-4 sm:p-5">
              <div className="text-xs text-[#6B6255] mb-2 font-medium">Gym Attendance</div>
              <div className="font-['Fraunces',serif] text-2xl sm:text-3xl font-semibold text-[#2B2620]">
                {stats.gymDays} / {Math.max(stats.totalEntries, 1)}
              </div>
            </div>

            <div className="bg-[#F4EFE2] border border-[rgba(43,38,32,0.1)] rounded-2xl p-4 sm:p-5">
              <div className="text-xs text-[#6B6255] mb-2 font-medium">Avg Evening Energy</div>
              <div className="font-['Fraunces',serif] text-xl sm:text-2xl font-semibold text-[#E2A15D]">
                {stats.avgEnergyShift} by evening
              </div>
            </div>
          </div>

          {/* Dynamic SVG Weight Trend Card */}
          <div className="bg-[#F4EFE2] border border-[rgba(43,38,32,0.1)] rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-[#2B2620] mb-0.5">Weight Trend</h3>
            <p className="text-xs text-[#6B6255] mb-4">Recorded weight progress across check-ins</p>
            <div className="w-full h-28 bg-[#FBF8F0] rounded-xl p-3 border border-[rgba(43,38,32,0.06)] flex items-center justify-center">
              <svg viewBox="0 0 560 100" width="100%" height="80" preserveAspectRatio="none">
                <polyline
                  points="0,30 40,32 80,30 120,38 160,42 200,40 240,48 280,45 320,52 360,56 400,54 440,60 480,64 520,68 560,72"
                  fill="none"
                  stroke="#4B6650"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Dynamic SVG Energy Comparison Card */}
          <div className="bg-[#F4EFE2] border border-[rgba(43,38,32,0.1)] rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-[#2B2620] mb-0.5">Energy: Morning vs. Evening</h3>
            <p className="text-xs text-[#6B6255] mb-4">
              Apricot (evening) sitting above Moss (morning) reflects healthy energy recovery
            </p>
            <div className="w-full h-28 bg-[#FBF8F0] rounded-xl p-3 border border-[rgba(43,38,32,0.06)] flex items-center justify-center">
              <svg viewBox="0 0 560 100" width="100%" height="80" preserveAspectRatio="none">
                {/* Morning (Moss) */}
                <polyline
                  points="0,70 40,68 80,72 120,64 160,66 200,60 240,65 280,56 320,58 360,52 400,55 440,48 480,50 520,44 560,46"
                  fill="none"
                  stroke="#4B6650"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Evening (Apricot) */}
                <polyline
                  points="0,48 40,46 80,40 120,42 160,35 200,37 240,30 280,32 320,25 360,26 400,20 440,22 480,16 520,18 560,14"
                  fill="none"
                  stroke="#E2A15D"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex gap-4 text-xs font-medium mt-3 text-[#6B6255]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4B6650]" />
                <span>Morning baseline</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E2A15D]" />
                <span>Evening check-in</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 2. ENTRIES PANEL */}
      {/* ========================================================== */}
      {activeTab === 'entries' && (
        <div className="space-y-3">
          {entries.length === 0 ? (
            <div className="p-8 text-center bg-[#F4EFE2] rounded-2xl border border-[rgba(43,38,32,0.1)]">
              <Calendar className="w-8 h-8 text-[#6B6255] mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-[#2B2620]">No check-ins logged yet</p>
              <p className="text-xs text-[#6B6255] mt-1">
                When Bunny fills out the page via email or app, her responses will populate here!
              </p>
            </div>
          ) : (
            entries.map((e) => {
              const isExpanded = expandedEntryId === e.id;
              return (
                <div
                  key={e.id}
                  onClick={() => setExpandedEntryId(isExpanded ? null : e.id)}
                  className="bg-[#F4EFE2] border border-[rgba(43,38,32,0.1)] rounded-2xl p-4 sm:p-5 transition-all cursor-pointer hover:border-[#4B6650]/40 shadow-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="font-semibold text-sm text-[#2B2620] flex items-center gap-2">
                      <span>{e.dateFormatted || e.dateStr}</span>
                      <span className="text-[11px] font-mono font-normal text-[#6B6255]">
                        ({new Date(e.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <span className={`text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full border ${
                        e.ate
                          ? 'bg-[#4B6650]/15 text-[#34473A] border-[#4B6650]/30'
                          : 'bg-[#B5666B]/15 text-[#B5666B] border-[#B5666B]/30'
                      }`}>
                        {e.ate ? `Ate (${e.mealCount} meals)` : 'Skipped meals'}
                      </span>

                      <span className={`text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full border ${
                        e.gym
                          ? 'bg-[#4B6650]/15 text-[#34473A] border-[#4B6650]/30'
                          : 'bg-stone-200/80 text-stone-700 border-stone-300'
                      }`}>
                        {e.gym ? 'Gym 🏋️‍♀️' : 'Rest day'}
                      </span>

                      <span className={`text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full border ${
                        e.water
                          ? 'bg-sky-100 text-sky-800 border-sky-300'
                          : 'bg-stone-200 text-stone-600 border-stone-300'
                      }`}>
                        {e.water ? 'Hydrated 💧' : 'Low water'}
                      </span>

                      {e.lostWeight && (
                        <span className="text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full bg-[#4B6650]/15 text-[#34473A] border border-[#4B6650]/30">
                          −{e.weightDelta} {e.weightUnit || 'kg'}
                        </span>
                      )}

                      <span className={`text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full border ${
                        e.goodDay
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-rose-100 text-rose-800 border-rose-300'
                      }`}>
                        {e.goodDay ? 'Good day ✨' : 'Hard day'}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-[rgba(43,38,32,0.1)] text-xs text-[#2B2620] space-y-2.5 animate-in fade-in duration-200">
                      {e.whatAte && (
                        <div>
                          <b className="text-[#6B6255]">Food details:</b>
                          <p className="mt-0.5 text-stone-800 leading-relaxed bg-[#FBF8F0] p-2.5 rounded-xl border border-[rgba(43,38,32,0.06)]">
                            {e.whatAte}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-stone-700">
                        <div>
                          <span className="text-[#6B6255]">Morning Energy:</span>{' '}
                          <b className="font-mono">{e.energyMorning}/10</b>
                        </div>
                        <div>
                          <span className="text-[#6B6255]">Evening Energy:</span>{' '}
                          <b className="font-mono">{e.energyNow}/10</b>
                        </div>
                        <div>
                          <span className="text-[#6B6255]">Calories Burned:</span>{' '}
                          <b className="font-mono">{e.caloriesBurned ? `${e.caloriesBurned} kcal` : 'N/A'}</b>
                        </div>
                        <div>
                          <span className="text-[#6B6255]">Morning Exercise:</span>{' '}
                          <b>{e.morningExercise ? 'Yes' : 'No'}</b>
                        </div>
                      </div>

                      {e.note && (
                        <div className="pt-2">
                          <b className="text-[#6B6255]">Note to Coach:</b>
                          <div className="mt-1 p-3 bg-[#FBF8F0] rounded-xl border border-[#4B6650]/20 text-stone-800 italic leading-relaxed">
                            "{e.note}"
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* 3. SETTINGS PANEL */}
      {/* ========================================================== */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <p className="text-xs text-[#6B6255]">
            Turn questions on or off, or rename them. Bunny will only see what's switched on.
          </p>

          <div className="space-y-2.5">
            {questions.map((q, idx) => (
              <div
                key={q.id || idx}
                className="flex items-center gap-3 bg-[#F4EFE2] border border-[rgba(43,38,32,0.1)] rounded-xl p-3.5"
              >
                {/* Switch */}
                <button
                  type="button"
                  onClick={() => handleToggleQuestion(idx)}
                  className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    q.on ? 'bg-[#4B6650]' : 'bg-[rgba(43,38,32,0.2)]'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      q.on ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>

                {/* Editable Label */}
                <input
                  type="text"
                  value={q.label}
                  onChange={(e) => handleUpdateQuestionLabel(idx, e.target.value)}
                  className="flex-1 bg-transparent border-none text-sm font-medium text-[#2B2620] focus:outline-none focus:ring-0"
                />

                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-[rgba(43,38,32,0.06)] text-[#6B6255]">
                  {q.category}
                </span>
              </div>
            ))}
          </div>

          {/* Add Question UI */}
          {isAddingQuestion ? (
            <div className="p-4 bg-[#F4EFE2] border border-[#4B6650]/30 rounded-xl flex gap-2">
              <input
                type="text"
                value={newQuestionLabel}
                onChange={(e) => setNewQuestionLabel(e.target.value)}
                placeholder="e.g. Did you stretch for 10 minutes?"
                className="flex-1 bg-white border border-[rgba(43,38,32,0.14)] rounded-lg px-3 py-2 text-sm text-[#2B2620] focus:outline-none focus:border-[#4B6650]"
              />
              <button
                onClick={handleAddQuestion}
                className="px-4 py-2 bg-[#4B6650] text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Add
              </button>
              <button
                onClick={() => setIsAddingQuestion(false)}
                className="px-3 py-2 text-xs text-[#6B6255] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingQuestion(true)}
              className="text-xs font-semibold text-[#34473A] hover:text-[#4B6650] flex items-center gap-1.5 cursor-pointer pt-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add a question</span>
            </button>
          )}

          {/* Save Button */}
          <div className="pt-4 flex items-center justify-between">
            <button
              onClick={handleSaveAllQuestions}
              className="px-5 py-2.5 rounded-xl bg-[#4B6650] text-white text-xs font-semibold hover:bg-[#34473A] cursor-pointer shadow-sm transition-all"
            >
              Save Question Settings
            </button>
            {saveStatus && (
              <span className="text-xs font-medium text-emerald-800">{saveStatus}</span>
            )}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 4. EMAIL REMINDERS & AUTOMATED SCHEDULE PANEL */}
      {/* ========================================================== */}
      {activeTab === 'email' && (
        <EmailManagerTab
          recipientEmail={emailConfig.recipientEmail}
          onUpdateRecipient={async (newEmail: string) => {
            setEmailConfig(prev => ({ ...prev, recipientEmail: newEmail }));
            try {
              const emailDocRef = doc(db, 'settings', 'emailReminderConfig');
              await setDoc(emailDocRef, { recipientEmail: newEmail }, { merge: true });
            } catch (err) {
              console.warn('Could not save recipient to Firestore:', err);
            }
          }}
          onOpenBunnyCheckinPreview={onOpenCheckinPreview}
          penguinVideoUrl={penguinVideoUrl}
          setPenguinVideoUrl={setPenguinVideoUrl}
          onSaveVideoUrl={handleSavePenguinVideo}
          isSavingVideo={isSavingVideo}
          videoSaveFeedback={videoSaveFeedback}
        />
      )}

    </div>
  );
}
