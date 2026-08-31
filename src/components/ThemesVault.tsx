import React from 'react';
import { motion } from 'motion/react';
import { Palette, Lock, CheckCircle2, Sparkles, Shield, Leaf, Heart, Trophy, Crown, Sun, Diamond } from 'lucide-react';
import { AppTheme, UserProfile } from '../types';

interface ThemesVaultProps {
  profile: UserProfile;
  currentStreak: number;
  activeTheme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
  onUseSkipDay?: () => void;
}

interface ThemeVisualTheme {
  cardBgActive: string;
  cardBgUnlocked: string;
  cardBgLocked: string;
  borderActive: string;
  borderUnlocked: string;
  badgeActive: string;
  badgeUnlocked: string;
  badgeLocked: string;
  titleColor: string;
  descColor: string;
  equipBtnBg: string;
  equippedBtnBg: string;
  iconBg: string;
  accentIcon: React.ElementType;
}

const THEME_STYLES: Record<AppTheme, ThemeVisualTheme> = {
  autumn: {
    cardBgActive: 'bg-gradient-to-br from-amber-100 via-orange-100/90 to-amber-200/95',
    cardBgUnlocked: 'bg-gradient-to-br from-amber-50/90 via-orange-50/80 to-amber-100/70',
    cardBgLocked: 'bg-stone-100/90',
    borderActive: 'border-2 border-orange-600 shadow-lg shadow-orange-900/15 ring-4 ring-orange-400/40',
    borderUnlocked: 'border-2 border-amber-400 hover:border-amber-600 shadow-sm',
    badgeActive: 'bg-amber-900 text-amber-100 font-black',
    badgeUnlocked: 'bg-amber-200 text-amber-950 font-black border border-amber-400',
    badgeLocked: 'bg-stone-200 text-stone-700 font-black',
    titleColor: 'text-amber-950',
    descColor: 'text-amber-900',
    equipBtnBg: 'bg-gradient-to-r from-amber-700 to-orange-600 hover:from-amber-800 hover:to-orange-700 text-white font-black shadow-md border border-amber-950/40',
    equippedBtnBg: 'bg-gradient-to-r from-amber-900 to-orange-800 text-amber-100 font-black border-2 border-amber-950 shadow-md ring-2 ring-amber-400',
    iconBg: 'bg-gradient-to-tr from-amber-600 to-orange-500',
    accentIcon: Leaf
  },
  pink_floral: {
    cardBgActive: 'bg-gradient-to-br from-pink-100 via-rose-100/90 to-pink-200/95',
    cardBgUnlocked: 'bg-gradient-to-br from-pink-50/90 via-rose-50/80 to-pink-100/70',
    cardBgLocked: 'bg-stone-100/90',
    borderActive: 'border-2 border-pink-500 shadow-lg shadow-pink-900/15 ring-4 ring-pink-400/40',
    borderUnlocked: 'border-2 border-pink-300 hover:border-pink-500 shadow-sm',
    badgeActive: 'bg-pink-900 text-pink-100 font-black',
    badgeUnlocked: 'bg-pink-200 text-pink-950 font-black border border-pink-400',
    badgeLocked: 'bg-stone-200 text-stone-700 font-black',
    titleColor: 'text-pink-950',
    descColor: 'text-pink-900',
    equipBtnBg: 'bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-black shadow-md border border-pink-800/40',
    equippedBtnBg: 'bg-gradient-to-r from-pink-900 to-rose-800 text-pink-100 font-black border-2 border-pink-950 shadow-md ring-2 ring-pink-400',
    iconBg: 'bg-gradient-to-tr from-pink-500 to-rose-400',
    accentIcon: Heart
  },
  emerald: {
    cardBgActive: 'bg-gradient-to-br from-emerald-100 via-teal-100/90 to-emerald-200/95',
    cardBgUnlocked: 'bg-gradient-to-br from-emerald-50/90 via-teal-50/80 to-emerald-100/70',
    cardBgLocked: 'bg-stone-100/90',
    borderActive: 'border-2 border-emerald-600 shadow-lg shadow-emerald-900/15 ring-4 ring-emerald-400/40',
    borderUnlocked: 'border-2 border-emerald-300 hover:border-emerald-500 shadow-sm',
    badgeActive: 'bg-emerald-900 text-emerald-100 font-black',
    badgeUnlocked: 'bg-emerald-200 text-emerald-950 font-black border border-emerald-400',
    badgeLocked: 'bg-stone-200 text-stone-700 font-black',
    titleColor: 'text-emerald-950',
    descColor: 'text-emerald-900',
    equipBtnBg: 'bg-gradient-to-r from-emerald-700 to-teal-600 hover:from-emerald-800 hover:to-teal-700 text-white font-black shadow-md border border-emerald-900/40',
    equippedBtnBg: 'bg-gradient-to-r from-emerald-900 to-teal-800 text-emerald-100 font-black border-2 border-emerald-950 shadow-md ring-2 ring-emerald-400',
    iconBg: 'bg-gradient-to-tr from-emerald-600 to-teal-500',
    accentIcon: Trophy
  },
  silver: {
    cardBgActive: 'bg-gradient-to-br from-slate-200 via-zinc-200/90 to-slate-300/95',
    cardBgUnlocked: 'bg-gradient-to-br from-slate-100/90 via-zinc-100/80 to-slate-200/70',
    cardBgLocked: 'bg-stone-100/90',
    borderActive: 'border-2 border-slate-600 shadow-lg shadow-slate-900/15 ring-4 ring-slate-400/40',
    borderUnlocked: 'border-2 border-slate-300 hover:border-slate-500 shadow-sm',
    badgeActive: 'bg-slate-900 text-slate-100 font-black',
    badgeUnlocked: 'bg-slate-200 text-slate-950 font-black border border-slate-400',
    badgeLocked: 'bg-stone-200 text-stone-700 font-black',
    titleColor: 'text-slate-950',
    descColor: 'text-slate-900',
    equipBtnBg: 'bg-gradient-to-r from-slate-700 to-zinc-800 hover:from-slate-800 hover:to-zinc-900 text-white font-black shadow-md border border-slate-900',
    equippedBtnBg: 'bg-slate-900 text-white font-black border-2 border-slate-950 shadow-md ring-2 ring-slate-400',
    iconBg: 'bg-gradient-to-tr from-slate-600 to-slate-400',
    accentIcon: Sparkles
  },
  crystal: {
    cardBgActive: 'bg-gradient-to-br from-cyan-100 via-sky-100/90 to-blue-200/95',
    cardBgUnlocked: 'bg-gradient-to-br from-cyan-50/90 via-sky-50/80 to-blue-100/70',
    cardBgLocked: 'bg-stone-100/90',
    borderActive: 'border-2 border-cyan-600 shadow-lg shadow-cyan-900/15 ring-4 ring-cyan-400/40',
    borderUnlocked: 'border-2 border-cyan-300 hover:border-cyan-500 shadow-sm',
    badgeActive: 'bg-cyan-900 text-cyan-100 font-black',
    badgeUnlocked: 'bg-cyan-200 text-cyan-950 font-black border border-cyan-400',
    badgeLocked: 'bg-stone-200 text-stone-700 font-black',
    titleColor: 'text-cyan-950',
    descColor: 'text-cyan-900',
    equipBtnBg: 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-black shadow-md border border-cyan-900/40',
    equippedBtnBg: 'bg-gradient-to-r from-cyan-900 to-blue-900 text-cyan-100 font-black border-2 border-cyan-950 shadow-md ring-2 ring-cyan-400',
    iconBg: 'bg-gradient-to-tr from-cyan-600 to-blue-500',
    accentIcon: Diamond
  },
  sunrise: {
    cardBgActive: 'bg-gradient-to-br from-amber-100 via-yellow-100/90 to-amber-200/95',
    cardBgUnlocked: 'bg-gradient-to-br from-yellow-50/90 via-amber-50/80 to-yellow-100/70',
    cardBgLocked: 'bg-stone-100/90',
    borderActive: 'border-2 border-yellow-500 shadow-lg shadow-yellow-900/15 ring-4 ring-yellow-400/40',
    borderUnlocked: 'border-2 border-yellow-300 hover:border-yellow-500 shadow-sm',
    badgeActive: 'bg-amber-900 text-yellow-100 font-black',
    badgeUnlocked: 'bg-yellow-200 text-amber-950 font-black border border-yellow-400',
    badgeLocked: 'bg-stone-200 text-stone-700 font-black',
    titleColor: 'text-amber-950',
    descColor: 'text-amber-900',
    equipBtnBg: 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-stone-950 font-black shadow-md border border-amber-800/40',
    equippedBtnBg: 'bg-gradient-to-r from-amber-900 to-yellow-800 text-amber-100 font-black border-2 border-amber-950 shadow-md ring-2 ring-amber-400',
    iconBg: 'bg-gradient-to-tr from-amber-500 to-yellow-400',
    accentIcon: Sun
  },
  gold: {
    cardBgActive: 'bg-gradient-to-br from-yellow-200 via-amber-200/90 to-yellow-300/95',
    cardBgUnlocked: 'bg-gradient-to-br from-yellow-100/90 via-amber-100/80 to-yellow-200/70',
    cardBgLocked: 'bg-stone-100/90',
    borderActive: 'border-2 border-yellow-600 shadow-lg shadow-yellow-900/20 ring-4 ring-yellow-500/40',
    borderUnlocked: 'border-2 border-yellow-400 hover:border-yellow-600 shadow-sm',
    badgeActive: 'bg-amber-950 text-yellow-300 font-black',
    badgeUnlocked: 'bg-yellow-300 text-amber-950 font-black border border-yellow-500',
    badgeLocked: 'bg-stone-200 text-stone-700 font-black',
    titleColor: 'text-amber-950',
    descColor: 'text-amber-950',
    equipBtnBg: 'bg-gradient-to-r from-yellow-600 via-amber-600 to-amber-700 hover:from-yellow-700 hover:to-amber-800 text-stone-950 font-black shadow-md border border-amber-950/40',
    equippedBtnBg: 'bg-gradient-to-r from-yellow-950 to-amber-900 text-yellow-200 font-black border-2 border-yellow-950 shadow-md ring-2 ring-yellow-400',
    iconBg: 'bg-gradient-to-tr from-yellow-500 via-amber-500 to-amber-600',
    accentIcon: Crown
  }
};

/* 1. Autumn Foliage Illustrated Tree Preview */
function MiniAutumnTreePreview() {
  return (
    <div className="relative w-full h-24 my-2.5 rounded-xl bg-gradient-to-b from-amber-200/70 via-orange-100/60 to-amber-100/80 overflow-hidden border border-amber-300/80 flex items-center justify-center shadow-inner">
      {/* Sunbeam radiance */}
      <div className="absolute inset-0 bg-radial from-amber-300/40 via-orange-200/20 to-transparent blur-md pointer-events-none" />
      {/* Mini Autumn Tree SVG */}
      <svg viewBox="0 0 200 130" className="w-full h-full max-h-24 drop-shadow-xs">
        {/* Canopy Back Layers */}
        <ellipse cx="100" cy="55" rx="65" ry="38" fill="#e65100" opacity="0.9" />
        <ellipse cx="60" cy="62" rx="35" ry="26" fill="#f57c00" opacity="0.95" />
        <ellipse cx="140" cy="62" rx="35" ry="26" fill="#ef6c00" opacity="0.95" />
        
        {/* Trunk & Main Branches */}
        <path d="M92 130 L96 75 L85 55 L90 52 L99 70 L108 50 L113 53 L102 75 L108 130 Z" fill="#4e342e" />
        
        {/* Golden & Pumpkin Foliage Clusters */}
        <circle cx="100" cy="42" r="30" fill="#ffa726" />
        <circle cx="75" cy="48" r="24" fill="#fb8c00" />
        <circle cx="125" cy="48" r="24" fill="#f57c00" />
        <circle cx="60" cy="58" r="18" fill="#e65100" />
        <circle cx="140" cy="58" r="18" fill="#d84315" />
        <circle cx="85" cy="35" r="20" fill="#ffb74d" />
        <circle cx="115" cy="35" r="20" fill="#ffa726" />
        <circle cx="100" cy="28" r="16" fill="#ffd54f" />
        
        {/* Floating Mini Leaves */}
        <circle cx="45" cy="78" r="2.5" fill="#e65100" />
        <circle cx="155" cy="74" r="2.5" fill="#f57c00" />
        <circle cx="130" cy="92" r="2" fill="#ffd54f" />
        <circle cx="70" cy="96" r="2" fill="#d84315" />
        <circle cx="95" cy="112" r="2" fill="#ff9800" />
      </svg>
      {/* Falling Leaf label badge */}
      <span className="absolute bottom-1 right-2 text-[9px] font-black font-mono bg-amber-900/85 text-amber-100 px-1.5 py-0.5 rounded-md backdrop-blur-xs shadow-xs border border-amber-700/50">
        🍁 Autumn Tree & Leaves
      </span>
    </div>
  );
}

/* 2. Pink Floral Illustrated Preview */
function MiniFloralPreview() {
  return (
    <div className="relative w-full h-24 my-2.5 rounded-xl bg-gradient-to-b from-pink-200/70 via-rose-100/60 to-pink-100/80 overflow-hidden border border-pink-300/80 flex items-center justify-center shadow-inner">
      <div className="absolute inset-0 bg-radial from-pink-300/40 to-transparent blur-md pointer-events-none" />
      <svg viewBox="0 0 200 130" className="w-full h-full max-h-24 drop-shadow-xs">
        <path d="M0 130 Q50 95 100 115 T200 105 L200 130 Z" fill="#fbcfe8" />
        <path d="M0 130 Q60 110 120 120 T200 115 L200 130 Z" fill="#f472b6" opacity="0.4" />
        
        <path d="M94 130 L97 80 L88 62 L92 60 L99 75 L106 58 L110 60 L101 80 L106 130 Z" fill="#5c3d2e" />
        <circle cx="100" cy="50" r="28" fill="#f472b6" opacity="0.9" />
        <circle cx="78" cy="55" r="22" fill="#fb7185" opacity="0.9" />
        <circle cx="122" cy="55" r="22" fill="#f43f5e" opacity="0.8" />
        <circle cx="90" cy="40" r="18" fill="#fbcfe8" />
        <circle cx="110" cy="40" r="18" fill="#fda4af" />
        <circle cx="100" cy="32" r="14" fill="#fff1f2" />
        
        <circle cx="50" cy="70" r="2.5" fill="#f43f5e" />
        <circle cx="150" cy="65" r="2.5" fill="#fb7185" />
        <circle cx="130" cy="85" r="2" fill="#fda4af" />
        <circle cx="70" cy="90" r="2" fill="#f472b6" />
      </svg>
      <span className="absolute bottom-1 right-2 text-[9px] font-black font-mono bg-pink-900/85 text-pink-100 px-1.5 py-0.5 rounded-md backdrop-blur-xs shadow-xs border border-pink-700/50">
        🌸 Sunday Flowers & Jog
      </span>
    </div>
  );
}

/* 3. Emerald Classic Illustrated Preview */
function MiniEmeraldPreview() {
  return (
    <div className="relative w-full h-24 my-2.5 rounded-xl bg-gradient-to-b from-emerald-200/70 via-teal-100/60 to-emerald-100/80 overflow-hidden border border-emerald-300/80 flex items-center justify-center shadow-inner">
      <div className="absolute inset-0 bg-radial from-emerald-300/40 to-transparent blur-md pointer-events-none" />
      <svg viewBox="0 0 200 130" className="w-full h-full max-h-24 drop-shadow-xs">
        <path d="M0 130 Q60 100 120 115 T200 105 L200 130 Z" fill="#a7f3d0" />
        <polygon points="60,110 40,110 50,75" fill="#047857" />
        <polygon points="60,95 40,95 50,65" fill="#059669" />
        <polygon points="145,110 125,110 135,75" fill="#047857" />
        <polygon points="145,95 125,95 135,65" fill="#059669" />
        <polygon points="115,120 85,120 100,70" fill="#065f46" />
        <polygon points="112,98 88,98 100,55" fill="#047857" />
        <polygon points="108,78 92,78 100,40" fill="#10b981" />
        <polygon points="105,58 95,58 100,28" fill="#34d399" />
      </svg>
      <span className="absolute bottom-1 right-2 text-[9px] font-black font-mono bg-emerald-900/85 text-emerald-100 px-1.5 py-0.5 rounded-md backdrop-blur-xs shadow-xs border border-emerald-700/50">
        🌿 Evergreen Classic
      </span>
    </div>
  );
}

/* 4. Silver Metallic Illustrated Preview */
function MiniSilverPreview() {
  return (
    <div className="relative w-full h-24 my-2.5 rounded-xl bg-gradient-to-b from-slate-200 via-zinc-100 to-slate-200 overflow-hidden border border-slate-400 flex items-center justify-center shadow-inner">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent blur-xs pointer-events-none" />
      <div className="text-center space-y-1 relative z-10">
        <Sparkles className="w-7 h-7 text-slate-700 mx-auto animate-pulse" />
        <span className="text-[11px] font-black text-slate-900 block font-mono uppercase tracking-widest">
          Sleek Chrome Titanium
        </span>
      </div>
      <span className="absolute bottom-1 right-2 text-[9px] font-black font-mono bg-slate-900/85 text-slate-100 px-1.5 py-0.5 rounded-md backdrop-blur-xs shadow-xs">
        ⚡ 7-Day Silver
      </span>
    </div>
  );
}

/* 5. Crystal Quartz Illustrated Preview */
function MiniCrystalPreview() {
  return (
    <div className="relative w-full h-24 my-2.5 rounded-xl bg-gradient-to-b from-cyan-200 via-sky-100 to-blue-200 overflow-hidden border border-cyan-400 flex items-center justify-center shadow-inner">
      <div className="absolute inset-0 bg-radial from-cyan-300/60 to-transparent blur-md pointer-events-none" />
      <div className="text-center space-y-1 relative z-10">
        <Diamond className="w-7 h-7 text-cyan-800 mx-auto animate-bounce" />
        <span className="text-[11px] font-black text-cyan-950 block font-mono uppercase tracking-widest">
          Iridescent Diamond
        </span>
      </div>
      <span className="absolute bottom-1 right-2 text-[9px] font-black font-mono bg-cyan-900/85 text-cyan-100 px-1.5 py-0.5 rounded-md backdrop-blur-xs shadow-xs">
        💎 14-Day Diamond
      </span>
    </div>
  );
}

/* 6. Sunrise Yellow Illustrated Preview */
function MiniSunrisePreview() {
  return (
    <div className="relative w-full h-24 my-2.5 rounded-xl bg-gradient-to-b from-amber-200 via-yellow-100 to-amber-200 overflow-hidden border border-yellow-400 flex items-center justify-center shadow-inner">
      <div className="absolute inset-0 bg-radial from-yellow-300/60 to-transparent blur-md pointer-events-none" />
      <div className="text-center space-y-1 relative z-10">
        <Sun className="w-7 h-7 text-amber-700 mx-auto animate-spin" style={{ animationDuration: '12s' }} />
        <span className="text-[11px] font-black text-amber-950 block font-mono uppercase tracking-widest">
          Solar Horizon Radiance
        </span>
      </div>
      <span className="absolute bottom-1 right-2 text-[9px] font-black font-mono bg-amber-900/85 text-amber-100 px-1.5 py-0.5 rounded-md backdrop-blur-xs shadow-xs">
        🌅 21-Day Sunrise
      </span>
    </div>
  );
}

/* 7. Gold Emperor Illustrated Preview */
function MiniGoldEmperorPreview() {
  return (
    <div className="relative w-full h-24 my-2.5 rounded-xl bg-gradient-to-b from-yellow-200 via-amber-200 to-yellow-300 overflow-hidden border border-yellow-500 flex items-center justify-center shadow-inner">
      <div className="absolute inset-0 bg-radial from-yellow-400/60 to-transparent blur-md pointer-events-none" />
      <div className="text-center space-y-1 relative z-10">
        <Crown className="w-7 h-7 text-amber-900 mx-auto drop-shadow-sm" />
        <span className="text-[11px] font-black text-amber-950 block font-mono uppercase tracking-widest">
          24K Gold Royal Emperor
        </span>
      </div>
      <span className="absolute bottom-1 right-2 text-[9px] font-black font-mono bg-amber-950 text-yellow-200 px-1.5 py-0.5 rounded-md backdrop-blur-xs shadow-xs">
        👑 30-Day Emperor
      </span>
    </div>
  );
}

export const THEME_CONFIGS = [
  {
    id: 'autumn' as AppTheme,
    name: 'September Fall Foliage 🍁',
    minStreak: 0,
    description: 'Montana Autumn Harvest theme with falling leaves & golden maple aura.',
    previewComponent: MiniAutumnTreePreview
  },
  {
    id: 'pink_floral' as AppTheme,
    name: 'White & Pink Floral Jogger 🌸',
    minStreak: 0,
    description: 'Sunday Jogging Day theme with running emojis & flowers.',
    previewComponent: MiniFloralPreview
  },
  {
    id: 'emerald' as AppTheme,
    name: 'Default Emerald 🌿',
    minStreak: 0,
    description: 'Clean classic gym control room layout with evergreen energy.',
    previewComponent: MiniEmeraldPreview
  },
  {
    id: 'silver' as AppTheme,
    name: 'Silver Metallic ⚡',
    minStreak: 7,
    description: 'Unlocked at 7 Days Streak! Elegant cool metal aesthetics.',
    previewComponent: MiniSilverPreview
  },
  {
    id: 'crystal' as AppTheme,
    name: 'Crystal Quartz / Diamond 💎',
    minStreak: 14,
    description: 'Unlocked at 14 Days Streak! Vibrant iridescent diamond blue.',
    previewComponent: MiniCrystalPreview
  },
  {
    id: 'sunrise' as AppTheme,
    name: 'Sunrise Yellow / Gold Glow 🌅',
    minStreak: 21,
    description: 'Unlocked at 21 Days Streak! Energetic warm sunrise aura.',
    previewComponent: MiniSunrisePreview
  },
  {
    id: 'gold' as AppTheme,
    name: 'Gold Emperor 👑',
    minStreak: 30,
    description: 'Unlocked at 30 Days Streak! Prestigious 24k gold with fireworks!',
    previewComponent: MiniGoldEmperorPreview
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
      <div className="bg-gradient-to-br from-stone-900 via-amber-950 to-stone-900 rounded-[32px] p-6 text-white shadow-xl relative overflow-hidden border border-amber-600/40">
        <div className="absolute top-0 right-0 w-36 h-36 bg-orange-500/20 rounded-full blur-2xl" />
        
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-orange-500 text-white rounded-2xl shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black tracking-tight text-white">Milestone Progression Vault</h3>
              <p className="text-xs text-amber-200/90 font-bold">
                Current Streak: <span className="font-black text-amber-400 font-mono text-sm">{currentStreak} Days 🔥</span>
              </p>
            </div>
          </div>

          <span className="text-[11px] sm:text-xs font-mono font-black bg-amber-400/20 text-amber-300 px-3 py-1.5 rounded-full border border-amber-400/40 shadow-xs whitespace-nowrap">
            Next: {nextThemeName}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 space-y-1.5 relative z-10">
          <div className="flex justify-between text-xs text-amber-100 font-mono font-black">
            <span>Progress to Day {nextMilestone}</span>
            <span>{daysToNext === 0 ? "Milestone Reached! 🎉" : `${daysToNext} days remaining`}</span>
          </div>
          <div className="w-full bg-stone-800/90 h-3.5 rounded-full overflow-hidden p-0.5 border border-amber-500/30">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 rounded-full shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Themes Vault Grid */}
      <div className="bg-white/90 backdrop-blur-xs rounded-[32px] p-5 sm:p-6 shadow-md border border-amber-300/80 space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-amber-200">
          <div className="p-2.5 bg-gradient-to-tr from-amber-600 to-orange-500 text-white rounded-2xl shadow-sm">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-stone-950">Themes Vault & Rewards</h3>
            <p className="text-xs text-stone-700 font-bold">Select and equip custom themes to transform Bunny's Gym Record!</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {THEME_CONFIGS.map((theme) => {
            const isUnlocked = currentStreak >= theme.minStreak || theme.id === 'emerald' || theme.id === 'pink_floral' || theme.id === 'autumn';
            const isActive = activeTheme === theme.id;
            const style = THEME_STYLES[theme.id];
            const PreviewComp = theme.previewComponent;
            const AccentIcon = style.accentIcon;

            return (
              <div 
                key={theme.id}
                className={`p-4 sm:p-5 rounded-2xl transition-all relative flex flex-col justify-between ${
                  isActive 
                    ? `${style.cardBgActive} ${style.borderActive}` 
                    : isUnlocked 
                      ? `${style.cardBgUnlocked} ${style.borderUnlocked}` 
                      : `${style.cardBgLocked} border-2 border-stone-300 opacity-75`
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-6 h-6 rounded-full ${style.iconBg} flex items-center justify-center text-white shadow-xs`}>
                        <AccentIcon className="w-3.5 h-3.5" />
                      </div>
                      <span className={`text-xs sm:text-sm font-black ${style.titleColor}`}>{theme.name}</span>
                    </div>

                    {isActive ? (
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs ${style.badgeActive}`}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : isUnlocked ? (
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-2xs ${style.badgeUnlocked}`}>
                        Unlocked
                      </span>
                    ) : (
                      <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${style.badgeLocked}`}>
                        <Lock className="w-3 h-3" /> Day {theme.minStreak}
                      </span>
                    )}
                  </div>

                  {/* Illustrated Theme Preview Graphic */}
                  <PreviewComp />

                  <p className={`text-xs mt-2 leading-relaxed font-bold ${style.descColor}`}>
                    {theme.description}
                  </p>
                </div>

                <div className="mt-4 pt-2">
                  {isUnlocked ? (
                    <button
                      onClick={() => onSelectTheme(theme.id)}
                      disabled={isActive}
                      className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 active:scale-95 ${
                        isActive 
                          ? `${style.equippedBtnBg} cursor-default` 
                          : `${style.equipBtnBg}`
                      }`}
                    >
                      {isActive ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>✓ Currently Equipped</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 shrink-0" />
                          <span>Equip {theme.name.split(' ')[0]} Theme</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="w-full py-3 px-3 bg-stone-200/90 text-stone-900 font-black rounded-xl text-xs font-mono text-center border border-stone-300 flex items-center justify-center gap-1.5 shadow-2xs">
                      <Lock className="w-3.5 h-3.5 text-stone-700" />
                      <span>Reach Day {theme.minStreak} Streak to Unlock</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Skip Days Perk Panel (Day 60) */}
      <div className="bg-white/90 backdrop-blur-xs rounded-[32px] p-5 sm:p-6 shadow-md border border-amber-300/80 space-y-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-tr from-amber-600 to-orange-500 text-white rounded-2xl shadow-sm">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-stone-950 flex items-center gap-2">
              <span>Protected Skip Days Perk</span>
              {!skipUnlocked && <span className="text-[10px] font-mono bg-amber-100 text-amber-950 px-2 py-0.5 rounded-full font-black border border-amber-300">Unlocks Day 60</span>}
            </h3>
            <p className="text-xs text-stone-700 font-bold">
              Allows up to 2 rest days per month without breaking your active streak!
            </p>
          </div>
        </div>

        {skipUnlocked ? (
          <div className="p-4 bg-amber-100/90 border border-amber-300 rounded-2xl flex items-center justify-between shadow-xs">
            <div>
              <span className="text-xs font-black text-amber-950 block">Monthly Protected Skip Days</span>
              <span className="text-xs text-amber-900 font-bold">Used: {usedSkip} / 2 this month</span>
            </div>
            {onUseSkipDay && usedSkip < 2 && (
              <button
                onClick={onUseSkipDay}
                className="py-2.5 px-4 bg-gradient-to-r from-amber-700 to-orange-600 hover:from-amber-800 hover:to-orange-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer active:scale-95 border border-amber-950/40"
              >
                Use Protected Skip Day
              </button>
            )}
          </div>
        ) : (
          <div className="p-3.5 bg-stone-100 border border-stone-300 text-stone-800 text-xs rounded-2xl font-mono leading-relaxed font-bold">
            🔒 Milestone locked until hitting 60 continuous streak days! ({60 - currentStreak} days remaining).
          </div>
        )}
      </div>
    </div>
  );
}

