import { motion } from 'motion/react';
import { Palette, Lock, CheckCircle2, Sparkles, Flame, Shield, ArrowRight } from 'lucide-react';
import { AppTheme, UserProfile } from '../types';

interface ThemesVaultProps {
  profile: UserProfile;
  currentStreak: number;
  activeTheme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
  onUseSkipDay?: () => void;
}

interface ThemeConfig {
  id: AppTheme;
  name: string;
  minStreak: number;
  previewBg: string;
  previewBorder: string;
  previewBadge: string;
  description: string;
}

export const THEME_CONFIGS: ThemeConfig[] = [
  {
    id: 'emerald',
    name: 'Default Emerald',
    minStreak: 0,
    previewBg: 'bg-emerald-500',
    previewBorder: 'border-emerald-300',
    previewBadge: 'bg-emerald-100 text-emerald-800',
    description: 'Clean classic gym control room layout.'
  },
  {
    id: 'silver',
    name: 'Silver Metallic',
    minStreak: 7,
    previewBg: 'bg-gradient-to-tr from-slate-400 to-slate-200',
    previewBorder: 'border-slate-300',
    previewBadge: 'bg-slate-200 text-slate-800',
    description: 'Unlocked at 7 Days Streak! Elegant cool metal aesthetics.'
  },
  {
    id: 'crystal',
    name: 'Crystal Quartz / Diamond',
    minStreak: 14,
    previewBg: 'bg-gradient-to-tr from-cyan-500 to-blue-400',
    previewBorder: 'border-cyan-300',
    previewBadge: 'bg-cyan-100 text-cyan-800',
    description: 'Unlocked at 14 Days Streak! Vibrant iridescent diamond blue.'
  },
  {
    id: 'sunrise',
    name: 'Sunrise Yellow / Gold Glow',
    minStreak: 21,
    previewBg: 'bg-gradient-to-tr from-amber-400 to-yellow-300',
    previewBorder: 'border-amber-300',
    previewBadge: 'bg-amber-100 text-amber-900',
    description: 'Unlocked at 21 Days Streak! Energetic warm sunrise aura.'
  },
  {
    id: 'gold',
    name: 'Gold Emperor',
    minStreak: 30,
    previewBg: 'bg-gradient-to-tr from-yellow-500 via-amber-400 to-amber-600',
    previewBorder: 'border-yellow-400',
    previewBadge: 'bg-yellow-100 text-yellow-900',
    description: 'Unlocked at 30 Days Streak! Prestigious gold with fireworks!'
  },
  {
    id: 'pink_floral',
    name: 'White & Pink Floral Jogger',
    minStreak: 0, // Unlocked automatically on Sundays
    previewBg: 'bg-gradient-to-tr from-pink-400 to-rose-300',
    previewBorder: 'border-pink-300',
    previewBadge: 'bg-pink-100 text-pink-800',
    description: 'Sunday Jogging Day theme with running emojis & flowers.'
  },
  {
    id: 'autumn',
    name: 'September Fall Foliage 🍁',
    minStreak: 0, // Unlocked for Fall Season
    previewBg: 'bg-gradient-to-tr from-amber-600 via-orange-500 to-red-600',
    previewBorder: 'border-amber-400',
    previewBadge: 'bg-amber-100 text-amber-900',
    description: 'Montana Autumn Harvest theme with falling leaves & golden maple aura.'
  }
];

export default function ThemesVault({ profile, currentStreak, activeTheme, onSelectTheme, onUseSkipDay }: ThemesVaultProps) {
  // Determine next milestone
  let nextMilestone = 7;
  let nextThemeName = "Silver Metallic";
  if (currentStreak >= 7 && currentStreak < 14) {
    nextMilestone = 14;
    nextThemeName = "Crystal Quartz";
  } else if (currentStreak >= 14 && currentStreak < 21) {
    nextMilestone = 21;
    nextThemeName = "Sunrise Yellow";
  } else if (currentStreak >= 21 && currentStreak < 30) {
    nextMilestone = 30;
    nextThemeName = "Gold Emperor";
  } else if (currentStreak >= 30 && currentStreak < 60) {
    nextMilestone = 60;
    nextThemeName = "2 Monthly Skip Days Perk";
  } else if (currentStreak >= 60) {
    nextMilestone = 60;
    nextThemeName = "Max Milestone Reached! 🎉";
  }

  const daysToNext = Math.max(0, nextMilestone - currentStreak);
  const progressPct = Math.min(100, Math.round((currentStreak / nextMilestone) * 100));

  const usedSkip = profile.usedSkipDaysThisMonth || 0;
  const skipUnlocked = currentStreak >= 60;

  return (
    <div className="space-y-6">
      {/* Milestone Progress Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[32px] p-6 text-white shadow-xl relative overflow-hidden border border-slate-700">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-500/20 text-amber-300 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-tight">Milestone Countdown</h3>
              <p className="text-xs text-slate-400">Current Streak: <span className="font-bold text-amber-400 font-mono">{currentStreak} Days 🔥</span></p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold bg-amber-400/20 text-amber-300 px-3 py-1 rounded-full border border-amber-400/30">
            Next: {nextThemeName}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs text-slate-300 font-mono">
            <span>Progress to Day {nextMilestone}</span>
            <span>{daysToNext === 0 ? "Milestone Reached! 🎉" : `${daysToNext} days remaining`}</span>
          </div>
          <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden p-0.5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Themes Vault Grid */}
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Themes Vault & Rewards</h3>
            <p className="text-xs text-slate-400">Unlock custom themes as you hit streak milestones</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {THEME_CONFIGS.map((theme) => {
            const isUnlocked = currentStreak >= theme.minStreak || theme.id === 'emerald' || theme.id === 'pink_floral' || theme.id === 'autumn';
            const isActive = activeTheme === theme.id;

            return (
              <div 
                key={theme.id}
                className={`p-4 rounded-2xl border transition-all relative flex flex-col justify-between ${
                  isActive 
                    ? 'border-2 border-emerald-500 bg-emerald-50/20 shadow-sm' 
                    : isUnlocked 
                      ? 'border-slate-200 bg-white hover:border-slate-300' 
                      : 'border-slate-150 bg-slate-50/60 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-5 h-5 rounded-full ${theme.previewBg} border ${theme.previewBorder} shadow-xs`} />
                      <span className="text-xs font-bold text-slate-900">{theme.name}</span>
                    </div>

                    {isActive ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    ) : isUnlocked ? (
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${theme.previewBadge}`}>
                        Unlocked
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Day {theme.minStreak}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {theme.description}
                  </p>
                </div>

                <div className="mt-4">
                  {isUnlocked ? (
                    <button
                      onClick={() => onSelectTheme(theme.id)}
                      disabled={isActive}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-slate-100 text-slate-400 cursor-default' 
                          : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs active:scale-95'
                      }`}
                    >
                      {isActive ? 'Currently Equipped' : 'Equip Theme'}
                    </button>
                  ) : (
                    <div className="w-full py-2 px-3 bg-slate-200/70 text-slate-500 rounded-xl text-[11px] font-mono text-center">
                      🔒 Reach {theme.minStreak} days streak to unlock
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Skip Days Perk Panel (Day 60) */}
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 space-y-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span>Protected Skip Days Perk</span>
              {!skipUnlocked && <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">Unlocks Day 60</span>}
            </h3>
            <p className="text-xs text-slate-400">
              Allows up to 2 rest days per month without breaking your active streak!
            </p>
          </div>
        </div>

        {skipUnlocked ? (
          <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-900 block">Monthly Protected Skip Days</span>
              <span className="text-xs text-amber-700">Used: {usedSkip} / 2 this month</span>
            </div>
            {onUseSkipDay && usedSkip < 2 && (
              <button
                onClick={onUseSkipDay}
                className="py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer active:scale-95"
              >
                Use Protected Skip Day
              </button>
            )}
          </div>
        ) : (
          <div className="p-3.5 bg-slate-50 border border-slate-200 text-slate-500 text-xs rounded-2xl font-mono leading-relaxed">
            🔒 Milestone locked until hitting 60 continuous streak days! ({60 - currentStreak} days remaining).
          </div>
        )}
      </div>
    </div>
  );
}
