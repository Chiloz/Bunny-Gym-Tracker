import { useState, useEffect, useMemo } from 'react';
import { doc, getDoc, setDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DailyCheckinEntry, UserProfile, CheckinQuestionItem } from '../types';
import { getMontanaDate, getMontanaDayOfWeek } from '../lib/time';
import { Check, Heart, ArrowLeft, Send, Sparkles, Play, Film, Video, RotateCcw } from 'lucide-react';
import { getDailyCheeringPhrase, CHEERING_PHRASES } from '../data/cheeringPhrases';
import { launchFullCelebrationFireworks } from '../lib/fireworks';

interface DailyCheckinViewProps {
  profile?: UserProfile | null;
  initialDate?: string;
  onBackToApp?: () => void;
  onSwitchToAdmin?: () => void;
  showAdminSwitch?: boolean;
  isTestMode?: boolean;
  onResetTest?: () => void;
}

export default function DailyCheckinView({
  profile,
  initialDate,
  onBackToApp,
  onSwitchToAdmin,
  showAdminSwitch = false,
  isTestMode = false,
  onResetTest
}: DailyCheckinViewProps) {
  // Determine date
  const targetDateStr = initialDate || getMontanaDate();
  
  // Format target date for eyebrow display
  const formattedDate = useMemo(() => {
    try {
      const d = new Date(`${targetDateStr}T12:00:00`);
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      }).format(d);
    } catch {
      return targetDateStr;
    }
  }, [targetDateStr]);

  // Stage: 'gate' | 'form' | 'submitted'
  const [stage, setStage] = useState<'gate' | 'form' | 'submitted'>('gate');

  // Gate pledges
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeTruth, setAgreeTruth] = useState(false);

  // Form Fields
  const [ate, setAte] = useState<boolean | null>(null);
  const [mealCount, setMealCount] = useState<number>(0);
  const [whatAte, setWhatAte] = useState<string>('');

  const [morningExercise, setMorningExercise] = useState<boolean | null>(null);
  const [gym, setGym] = useState<boolean | null>(null);
  const [caloriesBurned, setCaloriesBurned] = useState<string>('');
  const [water, setWater] = useState<boolean | null>(null);

  const [lostWeight, setLostWeight] = useState<boolean | null>(null);
  const [weightDelta, setWeightDelta] = useState<string>('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');

  const [energyMorning, setEnergyMorning] = useState<number>(5);
  const [energyNow, setEnergyNow] = useState<number>(5);
  const [goodDay, setGoodDay] = useState<boolean | null>(null);

  const [note, setNote] = useState<string>('');

  // Configured questions from Coach/Admin
  const [questionToggles, setQuestionToggles] = useState<Record<string, boolean>>({
    ate: true,
    mealCount: true,
    whatAte: true,
    morningExercise: true,
    gym: true,
    caloriesBurned: true,
    water: true,
    lostWeight: true,
    energy: true,
    goodDay: true,
    note: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [alreadySubmittedToday, setAlreadySubmittedToday] = useState(false);

  // Cheering phrase & video player state
  const [penguinVideoUrl, setPenguinVideoUrl] = useState<string>('');

  // Daily Cheering phrase selected deterministically for today (unique for each date, no spoiler shuffle)
  const currentCheeringPhrase = useMemo(() => {
    return getDailyCheeringPhrase(targetDateStr);
  }, [targetDateStr]);

  // Trigger fireworks whenever submitted stage is reached
  useEffect(() => {
    if (stage === 'submitted') {
      launchFullCelebrationFireworks();
    }
  }, [stage]);

  // Load existing check-in if one exists for today
  useEffect(() => {
    async function loadExistingCheckin() {
      try {
        const docRef = doc(db, 'daily_checkins', targetDateStr);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as DailyCheckinEntry;
          setAte(data.ate);
          setMealCount(data.mealCount ?? 0);
          setWhatAte(data.whatAte || '');
          setMorningExercise(data.morningExercise);
          setGym(data.gym);
          setCaloriesBurned(data.caloriesBurned ? String(data.caloriesBurned) : '');
          setWater(data.water);
          setLostWeight(data.lostWeight);
          setWeightDelta(data.weightDelta ? String(data.weightDelta) : '');
          setWeightUnit(data.weightUnit || 'kg');
          setEnergyMorning(data.energyMorning ?? 5);
          setEnergyNow(data.energyNow ?? 5);
          setGoodDay(data.goodDay);
          setNote(data.note || '');
          setAlreadySubmittedToday(true);
        }

        // Load custom questions config if present
        const settingsRef = doc(db, 'checkin_settings', 'questions');
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists() && settingsSnap.data().items) {
          const items = settingsSnap.data().items as CheckinQuestionItem[];
          const toggles: Record<string, boolean> = {};
          items.forEach(q => {
            toggles[q.id] = q.on;
          });
          setQuestionToggles(prev => ({ ...prev, ...toggles }));
        }

        // Load Penguin Celebration Video config if present
        const videoRef = doc(db, 'config', 'penguinCelebration');
        const videoSnap = await getDoc(videoRef);
        if (videoSnap.exists() && videoSnap.data().videoUrl) {
          setPenguinVideoUrl(videoSnap.data().videoUrl);
        }
      } catch (err) {
        console.warn('Note loading checkin data:', err);
      }
    }

    loadExistingCheckin();
  }, [targetDateStr]);

  // Dynamic progress calculation
  const progressPercent = useMemo(() => {
    let total = 0;
    let answered = 0;

    if (questionToggles.ate) { total++; if (ate !== null) answered++; }
    if (questionToggles.morningExercise) { total++; if (morningExercise !== null) answered++; }
    if (questionToggles.gym) { total++; if (gym !== null) answered++; }
    if (questionToggles.water) { total++; if (water !== null) answered++; }
    if (questionToggles.lostWeight) { total++; if (lostWeight !== null) answered++; }
    if (questionToggles.goodDay) { total++; if (goodDay !== null) answered++; }
    if (questionToggles.energy) { total++; answered++; } // Sliders default to 5

    return total > 0 ? Math.round((answered / total) * 100) : 0;
  }, [ate, morningExercise, gym, water, lostWeight, goodDay, questionToggles]);

  // Energy difference description
  const energyDiff = energyNow - energyMorning;
  const energyDiffText = useMemo(() => {
    if (energyDiff > 0) return `Up ${energyDiff} point${energyDiff > 1 ? 's' : ''} since this morning ✨`;
    if (energyDiff < 0) return `Down ${Math.abs(energyDiff)} point${Math.abs(energyDiff) > 1 ? 's' : ''} since this morning`;
    return 'Same energy as this morning';
  }, [energyDiff]);

  // Handle Submit
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const entry: DailyCheckinEntry = {
        id: targetDateStr,
        dateStr: targetDateStr,
        dateFormatted: formattedDate,
        submittedAt: new Date().toISOString(),
        uid: profile?.uid || 'bunny-user',
        userName: profile?.name || 'Bunny',
        ate: ate ?? false,
        mealCount: mealCount || 0,
        whatAte: whatAte.trim(),
        morningExercise: morningExercise ?? false,
        gym: gym ?? false,
        caloriesBurned: caloriesBurned ? parseFloat(caloriesBurned) : null,
        water: water ?? false,
        lostWeight: lostWeight ?? false,
        weightDelta: weightDelta ? parseFloat(weightDelta) : null,
        weightUnit,
        energyMorning,
        energyNow,
        energyDiff,
        goodDay: goodDay ?? true,
        note: note.trim()
      };

      // 1. Save check-in document
      await setDoc(doc(db, 'daily_checkins', targetDateStr), entry);

      // 2. If Gym was marked YES and user is authenticated, sync workout log & streak
      if (gym === true && profile?.uid) {
        try {
          await setDoc(doc(db, 'users', profile.uid, 'workouts', targetDateStr), {
            dateStr: targetDateStr,
            status: 'attended',
            loggedAt: new Date().toISOString(),
            note: note.trim() || 'Logged via Daily Question Box'
          });
        } catch (e) {
          console.warn('Could not sync user workout subcollection directly:', e);
        }
      }

      setStage('submitted');
    } catch (err: any) {
      console.error('Error submitting daily checkin:', err);
      setSubmitError(err?.message || 'Could not save check-in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="min-h-screen relative font-['Inter',sans-serif] text-[#2B2620] selection:bg-[#4B6650]/20 pb-20"
      style={{
        backgroundColor: '#F4EFE2',
        backgroundImage: 'radial-gradient(rgba(43,38,32,0.035) 1px, transparent 1px)',
        backgroundSize: '3px 3px'
      }}
      id="daily-checkin-wrapper"
    >
      {/* Coach Test Mode Banner */}
      {isTestMode && (
        <div className="w-full bg-[#E2A15D]/20 border-b border-[#E2A15D]/60 px-4 py-2 text-xs flex items-center justify-between font-['Courier_Prime',monospace] text-[#2B2620] sticky top-0 z-50 backdrop-blur-xs">
          <span className="font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E2A15D] animate-ping" />
            <span>COACH TEST RUN ACTIVE:</span>
            <span className="text-[#6B6255] font-normal hidden sm:inline">You are previewing Bunny's exact screen</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setStage('gate');
                setAgreeTerms(false);
                setAgreeTruth(false);
                if (onResetTest) onResetTest();
              }}
              className="px-2.5 py-1 bg-white hover:bg-stone-100 border border-[rgba(43,38,32,0.2)] rounded text-[11px] font-bold text-[#2B2620] transition-all cursor-pointer shadow-2xs"
            >
              Reset to Beginning ↺
            </button>
            <button
              type="button"
              onClick={() => {
                setStage('submitted');
                launchFullCelebrationFireworks();
              }}
              className="px-2.5 py-1 bg-[#4B6650] hover:bg-[#34473A] text-white rounded text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
            >
              Jump to Fireworks 🎆
            </button>
          </div>
        </div>
      )}

      {/* Top Demo / Navigation Switcher */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-1.5 bg-[#FBF8F0] border border-[rgba(43,38,32,0.14)] rounded-full p-1 shadow-md">
        {onBackToApp && (
          <button
            onClick={onBackToApp}
            className="text-xs font-semibold text-[#6B6255] hover:text-[#2B2620] px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Return to Main Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Gym Dashboard</span>
          </button>
        )}

        <button
          onClick={() => setStage(stage === 'submitted' ? 'form' : stage === 'gate' ? 'form' : 'gate')}
          className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all cursor-pointer ${
            stage !== 'submitted' ? 'bg-[#4B6650] text-white' : 'text-[#6B6255] hover:text-[#2B2620]'
          }`}
        >
          {alreadySubmittedToday ? 'Review Page' : 'Fill-in view'}
        </button>

        {showAdminSwitch && onSwitchToAdmin && (
          <button
            onClick={onSwitchToAdmin}
            className="text-xs font-semibold text-[#6B6255] hover:text-[#2B2620] px-3 py-1.5 rounded-full transition-colors cursor-pointer"
          >
            Admin view
          </button>
        )}
      </div>

      {/* ======================================================== */}
      {/* 1. COVER / GATE VIEW */}
      {/* ======================================================== */}
      {stage === 'gate' && (
        <div className="min-h-screen flex items-center justify-center p-5 animate-in fade-in duration-300">
          <div className="w-full max-w-[460px] bg-[#FBF8F0] rounded-[22px] shadow-[0_8px_24px_rgba(43,38,32,0.08)] p-8 sm:p-10 border border-[rgba(43,38,32,0.14)] relative">
            
            {/* Stamp / Mark */}
            <div className="w-11 h-11 rounded-full bg-[#4B6650] mb-6 flex items-center justify-center text-white shadow-sm">
              <Heart className="w-5 h-5 fill-white" />
            </div>

            <h1 className="font-['Fraunces',serif] text-2xl sm:text-[28px] font-semibold text-[#2B2620] leading-tight mb-2">
              Before today's page
            </h1>
            <p className="text-[#6B6255] text-[14.5px] leading-relaxed mb-7">
              Two quick things, then we get into it — same as always.
            </p>

            {/* Pledge 1 */}
            <div className="py-3.5 border-t border-[rgba(43,38,32,0.14)] flex items-start gap-3">
              <input
                type="checkbox"
                id="agreeTerms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded-md border-[1.5px] border-[#6B6255] text-[#4B6650] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#4B6650]"
              />
              <label htmlFor="agreeTerms" className="text-sm cursor-pointer select-none">
                <b className="block text-[14.5px] text-[#2B2620] mb-0.5">I know how this works</b>
                <span className="text-[#6B6255] text-[13px] leading-snug block">
                  This log goes to your coach, once a month it's talked through together — not judged, just tracked.
                </span>
              </label>
            </div>

            {/* Pledge 2 */}
            <div className="py-3.5 border-t border-b border-[rgba(43,38,32,0.14)] mb-7 flex items-start gap-3">
              <input
                type="checkbox"
                id="agreeTruth"
                checked={agreeTruth}
                onChange={(e) => setAgreeTruth(e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded-md border-[1.5px] border-[#6B6255] text-[#4B6650] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#4B6650]"
              />
              <label htmlFor="agreeTruth" className="text-sm cursor-pointer select-none">
                <b className="block text-[14.5px] text-[#2B2620] mb-0.5">Nothing but the truth today</b>
                <span className="text-[#6B6255] text-[13px] leading-snug block">
                  Even the "I forgot to eat again" kind of true. That's the whole point of this thing.
                </span>
              </label>
            </div>

            <button
              onClick={() => setStage('form')}
              disabled={!agreeTerms || !agreeTruth}
              className="w-full py-3.5 px-5 rounded-xl bg-[#4B6650] hover:bg-[#34473A] disabled:opacity-35 disabled:cursor-not-allowed text-white font-semibold text-[15px] transition-all duration-150 cursor-pointer shadow-sm active:scale-[0.98]"
              id="open-checkin-form-btn"
            >
              Open today's page
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. FORM VIEW */}
      {/* ======================================================== */}
      {stage === 'form' && (
        <div className="max-w-[560px] mx-auto px-5 pt-14 pb-24 animate-in fade-in duration-300">
          
          {/* Header */}
          <div className="mb-9">
            <div className="text-[#B5666B] font-semibold text-xs sm:text-[13px] uppercase tracking-wider mb-2 font-mono">
              {formattedDate}
            </div>
            <h1 className="font-['Fraunces',serif] text-3xl sm:text-[34px] font-semibold text-[#2B2620] mb-2 leading-tight">
              Today's check-in
            </h1>
            <p className="text-[#6B6255] text-[14.5px] leading-relaxed max-w-[46ch]">
              Answer as-is, not as you wish it looked. Takes about two minutes.
            </p>

            {/* Progress Track */}
            <div className="h-1.5 w-full bg-[rgba(43,38,32,0.12)] rounded-full mt-6 overflow-hidden">
              <div
                className="h-full transition-all duration-300 ease-out"
                style={{
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, #4B6650, #E2A15D)'
                }}
              />
            </div>
          </div>

          {/* SECTION: FOOD */}
          <div className="bg-[#FBF8F0] border border-[rgba(43,38,32,0.14)] rounded-[18px] p-6 sm:p-7 mb-5 shadow-xs">
            <div className="flex items-center gap-2.5 text-[16.5px] font-semibold text-[#2B2620] mb-1">
              <span className="w-2 h-2 rounded-full bg-[#4B6650]" />
              Food
            </div>
            <p className="text-[#6B6255] text-[13px] mb-5">The basics — no need to be exact on portions.</p>

            {/* Did you eat today? */}
            {questionToggles.ate && (
              <div className="mb-5">
                <label className="block text-[14.5px] font-medium text-[#2B2620] mb-2.5">
                  Did you eat today?
                </label>
                <div className="inline-flex bg-[#F4EFE2] rounded-xl p-1 border border-[rgba(43,38,32,0.14)]">
                  <button
                    type="button"
                    onClick={() => setAte(true)}
                    className={`px-5 py-2 rounded-lg text-[13.5px] font-semibold transition-all cursor-pointer ${
                      ate === true ? 'bg-[#4B6650] text-white shadow-xs' : 'text-[#6B6255] hover:text-[#2B2620]'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setAte(false)}
                    className={`px-5 py-2 rounded-lg text-[13.5px] font-semibold transition-all cursor-pointer ${
                      ate === false ? 'bg-[#B5666B] text-white shadow-xs' : 'text-[#6B6255] hover:text-[#2B2620]'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            )}

            {/* How many times did you eat? */}
            {questionToggles.mealCount && (
              <div className="mb-5">
                <label className="block text-[14.5px] font-medium text-[#2B2620] mb-2.5">
                  How many times did you eat?
                </label>
                <div className="inline-flex items-center gap-3.5 bg-[#F4EFE2] border border-[rgba(43,38,32,0.14)] rounded-xl p-1.5">
                  <button
                    type="button"
                    onClick={() => setMealCount(prev => Math.max(0, prev - 1))}
                    className="w-8 h-8 rounded-lg bg-[#FBF8F0] border border-[rgba(43,38,32,0.14)] font-semibold text-lg flex items-center justify-center text-[#2B2620] hover:bg-white cursor-pointer active:scale-95"
                  >
                    –
                  </button>
                  <span className="min-w-6 text-center font-bold text-[15px] font-mono">
                    {mealCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMealCount(prev => Math.min(8, prev + 1))}
                    className="w-8 h-8 rounded-lg bg-[#FBF8F0] border border-[rgba(43,38,32,0.14)] font-semibold text-lg flex items-center justify-center text-[#2B2620] hover:bg-white cursor-pointer active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* What did you eat? */}
            {questionToggles.whatAte && (
              <div>
                <label className="block text-[14.5px] font-medium text-[#2B2620] mb-2.5">
                  What did you eat?
                </label>
                <textarea
                  value={whatAte}
                  onChange={(e) => setWhatAte(e.target.value)}
                  placeholder="e.g. oats + banana, chicken and rice, a very sad sandwich"
                  rows={2}
                  className="w-full bg-[#F4EFE2] border border-[rgba(43,38,32,0.14)] rounded-xl p-3.5 text-[14.5px] text-[#2B2620] placeholder-[#6B6255]/60 focus:outline-none focus:border-[#4B6650] focus:ring-3 focus:ring-[#4B6650]/15 resize-y transition-all"
                />
              </div>
            )}
          </div>

          {/* SECTION: MOVEMENT */}
          <div className="bg-[#FBF8F0] border border-[rgba(43,38,32,0.14)] rounded-[18px] p-6 sm:p-7 mb-5 shadow-xs">
            <div className="flex items-center gap-2.5 text-[16.5px] font-semibold text-[#2B2620] mb-1">
              <span className="w-2 h-2 rounded-full bg-[#4B6650]" />
              Movement
            </div>
            <p className="text-[#6B6255] text-[13px] mb-5">Whatever you actually did — walking counts.</p>

            {/* Morning exercise done? */}
            {questionToggles.morningExercise && (
              <div className="mb-5">
                <label className="block text-[14.5px] font-medium text-[#2B2620] mb-2.5">
                  Morning exercise done?
                </label>
                <div className="inline-flex bg-[#F4EFE2] rounded-xl p-1 border border-[rgba(43,38,32,0.14)]">
                  <button
                    type="button"
                    onClick={() => setMorningExercise(true)}
                    className={`px-5 py-2 rounded-lg text-[13.5px] font-semibold transition-all cursor-pointer ${
                      morningExercise === true ? 'bg-[#4B6650] text-white shadow-xs' : 'text-[#6B6255] hover:text-[#2B2620]'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setMorningExercise(false)}
                    className={`px-5 py-2 rounded-lg text-[13.5px] font-semibold transition-all cursor-pointer ${
                      morningExercise === false ? 'bg-[#B5666B] text-white shadow-xs' : 'text-[#6B6255] hover:text-[#2B2620]'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            )}

            {/* Gym today? */}
            {questionToggles.gym && (
              <div className="mb-5">
                <label className="block text-[14.5px] font-medium text-[#2B2620] mb-2.5">
                  Gym today?
                </label>
                <div className="inline-flex bg-[#F4EFE2] rounded-xl p-1 border border-[rgba(43,38,32,0.14)]">
                  <button
                    type="button"
                    onClick={() => setGym(true)}
                    className={`px-5 py-2 rounded-lg text-[13.5px] font-semibold transition-all cursor-pointer ${
                      gym === true ? 'bg-[#4B6650] text-white shadow-xs' : 'text-[#6B6255] hover:text-[#2B2620]'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setGym(false)}
                    className={`px-5 py-2 rounded-lg text-[13.5px] font-semibold transition-all cursor-pointer ${
                      gym === false ? 'bg-[#B5666B] text-white shadow-xs' : 'text-[#6B6255] hover:text-[#2B2620]'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            )}

            {/* Calories burned */}
            {questionToggles.caloriesBurned && (
              <div className="mb-5">
                <label className="block text-[14.5px] font-medium text-[#2B2620] mb-2.5">
                  Calories burned (if you know it)
                </label>
                <input
                  type="number"
                  value={caloriesBurned}
                  onChange={(e) => setCaloriesBurned(e.target.value)}
                  placeholder="e.g. 320"
                  className="w-full bg-[#F4EFE2] border border-[rgba(43,38,32,0.14)] rounded-xl p-3 text-[14.5px] text-[#2B2620] focus:outline-none focus:border-[#4B6650] focus:ring-3 focus:ring-[#4B6650]/15"
                />
              </div>
            )}

            {/* Drank water today? */}
            {questionToggles.water && (
              <div>
                <label className="block text-[14.5px] font-medium text-[#2B2620] mb-2.5">
                  Drank water today?
                </label>
                <div className="inline-flex bg-[#F4EFE2] rounded-xl p-1 border border-[rgba(43,38,32,0.14)]">
                  <button
                    type="button"
                    onClick={() => setWater(true)}
                    className={`px-5 py-2 rounded-lg text-[13.5px] font-semibold transition-all cursor-pointer ${
                      water === true ? 'bg-[#4B6650] text-white shadow-xs' : 'text-[#6B6255] hover:text-[#2B2620]'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setWater(false)}
                    className={`px-5 py-2 rounded-lg text-[13.5px] font-semibold transition-all cursor-pointer ${
                      water === false ? 'bg-[#B5666B] text-white shadow-xs' : 'text-[#6B6255] hover:text-[#2B2620]'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION: PROGRESS */}
          <div className="bg-[#FBF8F0] border border-[rgba(43,38,32,0.14)] rounded-[18px] p-6 sm:p-7 mb-5 shadow-xs">
            <div className="flex items-center gap-2.5 text-[16.5px] font-semibold text-[#2B2620] mb-1">
              <span className="w-2 h-2 rounded-full bg-[#4B6650]" />
              Progress
            </div>
            <p className="text-[#6B6255] text-[13px] mb-5">Only fill the second one in if the first is yes.</p>

            {/* Did you lose weight? */}
            {questionToggles.lostWeight && (
              <div className="mb-5">
                <label className="block text-[14.5px] font-medium text-[#2B2620] mb-2.5">
                  Did you lose weight since last check-in?
                </label>
                <div className="inline-flex bg-[#F4EFE2] rounded-xl p-1 border border-[rgba(43,38,32,0.14)]">
                  <button
                    type="button"
                    onClick={() => setLostWeight(true)}
                    className={`px-5 py-2 rounded-lg text-[13.5px] font-semibold transition-all cursor-pointer ${
                      lostWeight === true ? 'bg-[#4B6650] text-white shadow-xs' : 'text-[#6B6255] hover:text-[#2B2620]'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setLostWeight(false)}
                    className={`px-5 py-2 rounded-lg text-[13.5px] font-semibold transition-all cursor-pointer ${
                      lostWeight === false ? 'bg-[#B5666B] text-white shadow-xs' : 'text-[#6B6255] hover:text-[#2B2620]'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            )}

            {/* How much? */}
            {lostWeight === true && (
              <div>
                <label className="block text-[14.5px] font-medium text-[#2B2620] mb-2.5">
                  How much?
                </label>
                <div className="flex gap-2.5 items-center">
                  <input
                    type="number"
                    step="0.1"
                    value={weightDelta}
                    onChange={(e) => setWeightDelta(e.target.value)}
                    placeholder="0.0"
                    className="flex-1 bg-[#F4EFE2] border border-[rgba(43,38,32,0.14)] rounded-xl p-3 text-[14.5px] text-[#2B2620] focus:outline-none focus:border-[#4B6650] focus:ring-3 focus:ring-[#4B6650]/15"
                  />
                  <div className="flex border border-[rgba(43,38,32,0.14)] rounded-xl overflow-hidden bg-[#F4EFE2]">
                    <button
                      type="button"
                      onClick={() => setWeightUnit('kg')}
                      className={`px-3.5 py-2.5 text-xs font-semibold cursor-pointer transition-colors ${
                        weightUnit === 'kg' ? 'bg-[#E2A15D] text-white' : 'text-[#6B6255]'
                      }`}
                    >
                      kg
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeightUnit('lb')}
                      className={`px-3.5 py-2.5 text-xs font-semibold cursor-pointer transition-colors ${
                        weightUnit === 'lb' ? 'bg-[#E2A15D] text-white' : 'text-[#6B6255]'
                      }`}
                    >
                      lb
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION: ENERGY */}
          {questionToggles.energy && (
            <div className="bg-[#FBF8F0] border border-[rgba(43,38,32,0.14)] rounded-[18px] p-6 sm:p-7 mb-5 shadow-xs">
              <div className="flex items-center gap-2.5 text-[16.5px] font-semibold text-[#2B2620] mb-1">
                <span className="w-2 h-2 rounded-full bg-[#4B6650]" />
                Energy
              </div>
              <p className="text-[#6B6255] text-[13px] mb-5">
                How it felt this morning, versus right now, filling this in.
              </p>

              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-[13px] text-[#6B6255] mb-2">
                    <span>This morning</span>
                    <b className="text-[#2B2620] font-mono text-sm">{energyMorning}/10</b>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={energyMorning}
                    onChange={(e) => setEnergyMorning(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-[rgba(43,38,32,0.14)] rounded-lg appearance-none cursor-pointer accent-[#4B6650]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[13px] text-[#6B6255] mb-2">
                    <span>Right now</span>
                    <b className="text-[#2B2620] font-mono text-sm">{energyNow}/10</b>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={energyNow}
                    onChange={(e) => setEnergyNow(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-[rgba(43,38,32,0.14)] rounded-lg appearance-none cursor-pointer accent-[#E2A15D]"
                  />
                </div>
              </div>

              {/* Energy comparison badge */}
              <div className="mt-4 flex items-center gap-2 text-[13px] text-[#6B6255] bg-[#F4EFE2] rounded-xl p-3 border border-[rgba(43,38,32,0.08)]">
                <span className="text-base">{energyDiff > 0 ? '📈' : energyDiff < 0 ? '📉' : '⚖️'}</span>
                <span>{energyDiffText}</span>
              </div>

              {/* Good day overall? */}
              {questionToggles.goodDay && (
                <div className="mt-5 pt-5 border-t border-[rgba(43,38,32,0.1)]">
                  <label className="block text-[14.5px] font-medium text-[#2B2620] mb-2.5">
                    Would you say it was a good day overall?
                  </label>
                  <div className="inline-flex bg-[#F4EFE2] rounded-xl p-1 border border-[rgba(43,38,32,0.14)]">
                    <button
                      type="button"
                      onClick={() => setGoodDay(true)}
                      className={`px-5 py-2 rounded-lg text-[13.5px] font-semibold transition-all cursor-pointer ${
                        goodDay === true ? 'bg-[#4B6650] text-white shadow-xs' : 'text-[#6B6255] hover:text-[#2B2620]'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setGoodDay(false)}
                      className={`px-5 py-2 rounded-lg text-[13.5px] font-semibold transition-all cursor-pointer ${
                        goodDay === false ? 'bg-[#B5666B] text-white shadow-xs' : 'text-[#6B6255] hover:text-[#2B2620]'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION: NOTE / ANYTHING ELSE */}
          {questionToggles.note && (
            <div className="bg-[#FBF8F0] border border-[rgba(43,38,32,0.14)] rounded-[18px] p-6 sm:p-7 mb-7 shadow-xs">
              <div className="flex items-center gap-2.5 text-[16.5px] font-semibold text-[#2B2620] mb-1">
                <span className="w-2 h-2 rounded-full bg-[#4B6650]" />
                Anything else
              </div>
              <p className="text-[#6B6255] text-[13px] mb-4">
                Feelings, a rough patch, something you need from him, whatever's on your mind.
              </p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Write as much or as little as you want..."
                rows={5}
                className="w-full bg-[#F4EFE2] border border-[rgba(43,38,32,0.14)] rounded-xl p-3.5 text-[14.5px] text-[#2B2620] placeholder-[#6B6255]/60 focus:outline-none focus:border-[#4B6650] focus:ring-3 focus:ring-[#4B6650]/15 resize-y transition-all"
              />
            </div>
          )}

          {submitError && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
              {submitError}
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <div className="mt-8">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-xl bg-[#4B6650] hover:bg-[#34473A] text-white font-semibold text-[15.5px] transition-all duration-150 cursor-pointer shadow-md active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
              id="submit-checkin-page-btn"
            >
              {isSubmitting ? (
                <span>Sending today's page...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send today's page</span>
                </>
              )}
            </button>
            <p className="text-center text-[12.5px] text-[#6B6255] mt-3">
              He'll see this in the coach dashboard — nothing sent anywhere else.
            </p>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 3. SUBMITTED / CELEBRATION VIEW */}
      {/* ======================================================== */}
      {stage === 'submitted' && (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 animate-in zoom-in-95 duration-300">
          <div className="w-full max-w-[560px] bg-[#FBF8F0] rounded-2xl shadow-[6px_6px_0px_#2B2620] p-6 sm:p-9 border-2 border-[#2B2620] text-center relative overflow-hidden">
            
            {/* Vintage Top Header Strip */}
            <div className="border-b-2 border-dashed border-[#2B2620] pb-3 mb-6 flex items-center justify-between text-[11px] font-['Special_Elite',monospace] uppercase text-[#6B6255] tracking-wider">
              <span>★ PENGUIN POSTAL SERVICE ★</span>
              <span>CERTIFIED DISPATCH</span>
            </div>

            {/* Wax Seal / Heart Icon */}
            <div className="relative inline-block mb-3">
              <div className="w-16 h-16 rounded-full bg-[#4B6650] text-white mx-auto flex items-center justify-center border-2 border-[#2B2620] shadow-[3px_3px_0px_#2B2620]">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-amber-400 text-stone-900 border border-[#2B2620] rounded-full p-1 text-xs shadow-xs">
                ✨
              </div>
            </div>

            {/* Vintage Stamp Badge */}
            <div className="mb-2">
              <span className="inline-block border-2 border-dashed border-[#4B6650] text-[#4B6650] px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest font-['Courier_Prime',monospace] rounded-sm">
                DELIVERED TO PENGUIN'S DESK
              </span>
            </div>

            <h2 className="font-['Playfair_Display',serif] text-2xl sm:text-3xl font-bold text-[#2B2620] mb-2 leading-tight">
              Today's Page is Officially Sealed!
            </h2>
            <p className="text-[#6B6255] text-xs font-['Courier_Prime',monospace] mb-5">
              Logged on {formattedDate} &bull; No excuses, nothing but the truth.
            </p>

            {/* ------------------------------------------------------------- */}
            {/* DAILY CHEERING CATCHPHRASE CARD (DETERMINISTIC FOR TODAY) */}
            {/* ------------------------------------------------------------- */}
            <div className="bg-[#F4EFE2] border-2 border-[#2B2620] rounded-xl p-5 sm:p-6 mb-6 text-left relative shadow-[4px_4px_0px_rgba(43,38,32,0.15)]">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] uppercase font-['Special_Elite',monospace] tracking-wider px-2 py-0.5 rounded-sm bg-[#4B6650] text-white font-bold">
                  ★ {currentCheeringPhrase.tag} ★
                </span>
                <span className="text-xs text-[#6B6255] font-['Courier_Prime',monospace] italic">
                  Daily Word of Encouragement
                </span>
              </div>

              <div className="text-xl sm:text-2xl font-['Playfair_Display',serif] font-bold text-[#2B2620] leading-snug mb-2">
                "{currentCheeringPhrase.phrase}"
              </div>

              <p className="text-[#4B6650] font-['Fraunces',serif] italic text-[14px] leading-relaxed mb-4">
                {currentCheeringPhrase.subtext}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-[rgba(43,38,32,0.15)]">
                <span className="text-[11.5px] text-[#6B6255] font-['Courier_Prime',monospace]">
                  From Penguin with boundless love 🐧❤️
                </span>
                <button
                  type="button"
                  onClick={launchFullCelebrationFireworks}
                  className="px-3 py-1.5 rounded-lg bg-[#2B2620] hover:bg-black text-[#FBF8F0] text-xs font-bold font-['Courier_Prime',monospace] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                  title="Pop fireworks again"
                >
                  <Sparkles className="w-3 h-3 text-[#E2A15D]" />
                  <span>Pop fireworks! 🎆</span>
                </button>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* PENGUIN CELEBRATION VIDEO REEL (ONLY SHOWN ONCE UPLOADED) */}
            {/* ------------------------------------------------------------- */}
            {penguinVideoUrl && (
              <div className="bg-[#2B2620] text-[#FBF8F0] border-2 border-[#2B2620] rounded-xl p-4 sm:p-5 mb-6 text-left shadow-[4px_4px_0px_#4B6650] animate-fadeIn">
                <div className="flex items-center justify-between mb-3 text-[11px] font-['Special_Elite',monospace] tracking-widest text-[#E2A15D] border-b border-stone-700 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-[#E2A15D]" />
                    <span>PENGUIN'S VICTORY REEL • BROADCAST TAPE</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded-xs bg-[#4B6650] text-[10px] text-white uppercase font-bold">
                    PLAYING NOW
                  </span>
                </div>

                <div className="relative rounded-lg overflow-hidden border border-stone-700 bg-black aspect-video flex items-center justify-center shadow-inner">
                  <video
                    src={penguinVideoUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TODAY'S SUMMARY RECEIPT (VINTAGE TYPEWRITER STYLE) */}
            {/* ------------------------------------------------------------- */}
            <div className="bg-[#F4EFE2] rounded-xl p-4 border border-[rgba(43,38,32,0.14)] text-left mb-6 font-['Courier_Prime',monospace] text-xs text-[#4A4237] space-y-1.5 shadow-xs">
              <div className="font-bold text-[#2B2620] pb-1 border-b border-[rgba(43,38,32,0.1)] flex justify-between">
                <span>ACCOUNTABILITY RECEIPT:</span>
                <span>{targetDateStr}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span>Food Eaten Today:</span>
                <b className="text-[#2B2620]">{ate ? `Yes (${mealCount} meals)` : 'Not logged / Skipped'}</b>
              </div>
              <div className="flex justify-between">
                <span>Morning Movement:</span>
                <b className="text-[#2B2620]">{morningExercise ? 'Completed ✨' : 'None'}</b>
              </div>
              <div className="flex justify-between">
                <span>Gym Attended:</span>
                <b className="text-[#2B2620]">{gym ? 'Yes 🏋️‍♀️' : 'Rest / Off-day'}</b>
              </div>
              <div className="flex justify-between">
                <span>Hydration (Water):</span>
                <b className="text-[#2B2620]">{water ? 'Drank water 💧' : 'Need more'}</b>
              </div>
              <div className="flex justify-between">
                <span>Evening Energy:</span>
                <b className="text-[#2B2620] font-mono">{energyNow}/10 ({energyDiffText})</b>
              </div>
              {note && (
                <div className="pt-2 border-t border-[rgba(43,38,32,0.1)] text-[11px] italic text-[#6B6255]">
                  <strong>Note to Penguin:</strong> "{note}"
                </div>
              )}
            </div>

            {/* ------------------------------------------------------------- */}
            {/* ACTIONS */}
            {/* ------------------------------------------------------------- */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setStage('form')}
                className="flex-1 py-3 px-4 rounded-xl border-2 border-[#2B2620] bg-white hover:bg-[#F4EFE2] text-xs font-bold font-['Courier_Prime',monospace] text-[#2B2620] transition-colors cursor-pointer shadow-[2px_2px_0px_#2B2620] active:scale-95"
              >
                Edit Today's Answers 📝
              </button>
              {onBackToApp && (
                <button
                  type="button"
                  onClick={onBackToApp}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#4B6650] hover:bg-[#34473A] border-2 border-[#2B2620] text-xs font-bold font-['Courier_Prime',monospace] text-white transition-colors cursor-pointer shadow-[2px_2px_0px_#2B2620] active:scale-95"
                >
                  Return to Dashboard 🏃‍♀️
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
