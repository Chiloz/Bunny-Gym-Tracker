import React from 'react';
import { motion } from 'motion/react';
import { Palette, Lock, CheckCircle2, Sparkles, Shield, Leaf, Heart, Trophy, Crown, Sun, Diamond, Coffee } from 'lucide-react';
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
  pumpkin_spice: {
    cardBgActive: 'bg-[#ffedd5]/55 backdrop-blur-md',
    cardBgUnlocked: 'bg-white/40 backdrop-blur-md',
    cardBgLocked: 'bg-white/20 backdrop-blur-md',
    borderActive: 'border-2 border-[#ea580c] shadow-lg shadow-[#7c2d12]/20 ring-4 ring-[#fb923c]/50',
    borderUnlocked: 'border-2 border-[#ea580c]/60 hover:border-[#ea580c] shadow-sm',
    badgeActive: 'bg-[#7c2d12] text-[#ffedd5] font-black',
    badgeUnlocked: 'bg-[#fed7aa] text-[#7c2d12] font-black border border-[#ea580c]',
    badgeLocked: 'bg-stone-200 text-stone-800 font-black',
    titleColor: 'text-stone-950 font-black',
    descColor: 'text-stone-800 font-bold',
    equipBtnBg: 'bg-gradient-to-r from-[#9a3412] to-[#ea580c] hover:from-[#7c2d12] hover:to-[#c2410c] text-white font-black shadow-md border border-[#431407]/40',
    equippedBtnBg: 'bg-[#431407] text-[#fed7aa] font-black border-2 border-[#431407] shadow-md ring-2 ring-[#fb923c]',
    iconBg: 'bg-gradient-to-tr from-[#c2410c] to-[#ea580c]',
    accentIcon: Coffee
  },
  autumn: {
    cardBgActive: 'bg-amber-100/60 backdrop-blur-md',
    cardBgUnlocked: 'bg-white/40 backdrop-blur-md',
    cardBgLocked: 'bg-white/20 backdrop-blur-md',
    borderActive: 'border-2 border-orange-600 shadow-lg shadow-orange-900/15 ring-4 ring-orange-400/40',
    borderUnlocked: 'border-2 border-amber-400 hover:border-amber-600 shadow-sm',
    badgeActive: 'bg-amber-900 text-amber-100 font-black',
    badgeUnlocked: 'bg-amber-200 text-amber-950 font-black border border-amber-400',
    badgeLocked: 'bg-stone-200 text-stone-800 font-black',
    titleColor: 'text-stone-950 font-black',
    descColor: 'text-stone-800 font-bold',
    equipBtnBg: 'bg-gradient-to-r from-amber-700 to-orange-600 hover:from-amber-800 hover:to-orange-700 text-white font-black shadow-md border border-amber-950/40',
    equippedBtnBg: 'bg-amber-950 text-amber-100 font-black border-2 border-amber-950 shadow-md ring-2 ring-amber-400',
    iconBg: 'bg-gradient-to-tr from-amber-600 to-orange-500',
    accentIcon: Leaf
  },
  pink_floral: {
    cardBgActive: 'bg-pink-100/60 backdrop-blur-md',
    cardBgUnlocked: 'bg-white/40 backdrop-blur-md',
    cardBgLocked: 'bg-white/20 backdrop-blur-md',
    borderActive: 'border-2 border-pink-500 shadow-lg shadow-pink-900/15 ring-4 ring-pink-400/40',
    borderUnlocked: 'border-2 border-pink-300 hover:border-pink-500 shadow-sm',
    badgeActive: 'bg-pink-900 text-pink-100 font-black',
    badgeUnlocked: 'bg-pink-200 text-pink-950 font-black border border-pink-400',
    badgeLocked: 'bg-stone-200 text-stone-800 font-black',
    titleColor: 'text-stone-950 font-black',
    descColor: 'text-stone-800 font-bold',
    equipBtnBg: 'bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-black shadow-md border border-pink-800/40',
    equippedBtnBg: 'bg-pink-950 text-pink-100 font-black border-2 border-pink-950 shadow-md ring-2 ring-pink-400',
    iconBg: 'bg-gradient-to-tr from-pink-500 to-rose-400',
    accentIcon: Heart
  },
  emerald: {
    cardBgActive: 'bg-emerald-100/60 backdrop-blur-md',
    cardBgUnlocked: 'bg-white/40 backdrop-blur-md',
    cardBgLocked: 'bg-white/20 backdrop-blur-md',
    borderActive: 'border-2 border-emerald-600 shadow-lg shadow-emerald-900/15 ring-4 ring-emerald-400/40',
    borderUnlocked: 'border-2 border-emerald-300 hover:border-emerald-500 shadow-sm',
    badgeActive: 'bg-emerald-900 text-emerald-100 font-black',
    badgeUnlocked: 'bg-emerald-200 text-emerald-950 font-black border border-emerald-400',
    badgeLocked: 'bg-stone-200 text-stone-800 font-black',
    titleColor: 'text-stone-950 font-black',
    descColor: 'text-stone-800 font-bold',
    equipBtnBg: 'bg-gradient-to-r from-emerald-700 to-teal-600 hover:from-emerald-800 hover:to-teal-700 text-white font-black shadow-md border border-emerald-900/40',
    equippedBtnBg: 'bg-emerald-950 text-emerald-100 font-black border-2 border-emerald-950 shadow-md ring-2 ring-emerald-400',
    iconBg: 'bg-gradient-to-tr from-emerald-600 to-teal-500',
    accentIcon: Trophy
  },
  silver: {
    cardBgActive: 'bg-slate-200/60 backdrop-blur-md',
    cardBgUnlocked: 'bg-white/40 backdrop-blur-md',
    cardBgLocked: 'bg-white/20 backdrop-blur-md',
    borderActive: 'border-2 border-slate-600 shadow-lg shadow-slate-900/15 ring-4 ring-slate-400/40',
    borderUnlocked: 'border-2 border-slate-300 hover:border-slate-500 shadow-sm',
    badgeActive: 'bg-slate-900 text-slate-100 font-black',
    badgeUnlocked: 'bg-slate-200 text-slate-950 font-black border border-slate-400',
    badgeLocked: 'bg-stone-200 text-stone-800 font-black',
    titleColor: 'text-stone-950 font-black',
    descColor: 'text-stone-800 font-bold',
    equipBtnBg: 'bg-gradient-to-r from-slate-700 to-zinc-800 hover:from-slate-800 hover:to-zinc-900 text-white font-black shadow-md border border-slate-900',
    equippedBtnBg: 'bg-slate-950 text-white font-black border-2 border-slate-950 shadow-md ring-2 ring-slate-400',
    iconBg: 'bg-gradient-to-tr from-slate-600 to-slate-400',
    accentIcon: Sparkles
  },
  crystal: {
    cardBgActive: 'bg-cyan-100/60 backdrop-blur-md',
    cardBgUnlocked: 'bg-white/40 backdrop-blur-md',
    cardBgLocked: 'bg-white/20 backdrop-blur-md',
    borderActive: 'border-2 border-cyan-600 shadow-lg shadow-cyan-900/15 ring-4 ring-cyan-400/40',
    borderUnlocked: 'border-2 border-cyan-300 hover:border-cyan-500 shadow-sm',
    badgeActive: 'bg-cyan-900 text-cyan-100 font-black',
    badgeUnlocked: 'bg-cyan-200 text-cyan-950 font-black border border-cyan-400',
    badgeLocked: 'bg-stone-200 text-stone-800 font-black',
    titleColor: 'text-stone-950 font-black',
    descColor: 'text-stone-800 font-bold',
    equipBtnBg: 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-black shadow-md border border-cyan-900/40',
    equippedBtnBg: 'bg-cyan-950 text-cyan-100 font-black border-2 border-cyan-950 shadow-md ring-2 ring-cyan-400',
    iconBg: 'bg-gradient-to-tr from-cyan-600 to-blue-500',
    accentIcon: Diamond
  },
  sunrise: {
    cardBgActive: 'bg-amber-100/60 backdrop-blur-md',
    cardBgUnlocked: 'bg-white/40 backdrop-blur-md',
    cardBgLocked: 'bg-white/20 backdrop-blur-md',
    borderActive: 'border-2 border-yellow-500 shadow-lg shadow-yellow-900/15 ring-4 ring-yellow-400/40',
    borderUnlocked: 'border-2 border-yellow-300 hover:border-yellow-500 shadow-sm',
    badgeActive: 'bg-amber-900 text-yellow-100 font-black',
    badgeUnlocked: 'bg-yellow-200 text-amber-950 font-black border border-yellow-400',
    badgeLocked: 'bg-stone-200 text-stone-800 font-black',
    titleColor: 'text-stone-950 font-black',
    descColor: 'text-stone-800 font-bold',
    equipBtnBg: 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white font-black shadow-md border border-amber-800/40',
    equippedBtnBg: 'bg-amber-950 text-yellow-200 font-black border-2 border-amber-950 shadow-md ring-2 ring-amber-400',
    iconBg: 'bg-gradient-to-tr from-amber-500 to-yellow-400',
    accentIcon: Sun
  },
  gold: {
    cardBgActive: 'bg-yellow-200/60 backdrop-blur-md',
    cardBgUnlocked: 'bg-white/40 backdrop-blur-md',
    cardBgLocked: 'bg-white/20 backdrop-blur-md',
    borderActive: 'border-2 border-yellow-600 shadow-lg shadow-yellow-900/20 ring-4 ring-yellow-500/40',
    borderUnlocked: 'border-2 border-yellow-400 hover:border-yellow-600 shadow-sm',
    badgeActive: 'bg-amber-950 text-yellow-300 font-black',
    badgeUnlocked: 'bg-yellow-300 text-amber-950 font-black border border-yellow-500',
    badgeLocked: 'bg-stone-200 text-stone-800 font-black',
    titleColor: 'text-stone-950 font-black',
    descColor: 'text-stone-800 font-bold',
    equipBtnBg: 'bg-gradient-to-r from-yellow-600 via-amber-600 to-amber-700 hover:from-yellow-700 hover:to-amber-800 text-stone-950 font-black shadow-md border border-amber-950/40',
    equippedBtnBg: 'bg-amber-950 text-yellow-200 font-black border-2 border-yellow-950 shadow-md ring-2 ring-yellow-400',
    iconBg: 'bg-gradient-to-tr from-yellow-500 via-amber-500 to-amber-600',
    accentIcon: Crown
  }
};

/* 0. Starbucks Pumpkin Spice Latte Illustrated Preview */
function MiniPumpkinSpicePreview() {
  return (
    <div className="relative w-full h-24 my-2.5 rounded-xl bg-gradient-to-b from-[#ffedd5]/80 via-[#fed7aa]/70 to-[#fdba74]/80 overflow-hidden border border-[#ea580c]/50 flex items-center justify-center shadow-inner">
      <div className="absolute inset-0 bg-radial from-[#fb923c]/30 via-[#ea580c]/15 to-transparent blur-md pointer-events-none" />
      
      {/* SVG Illustration of Starbucks Iced Pumpkin Spice Latte */}
      <svg viewBox="0 0 200 120" className="w-full h-full max-h-24 drop-shadow-xs">
        {/* Left Pumpkin */}
        <g transform="translate(18, 50) scale(0.45)">
          <path d="M 90 20 Q 80 -10 60 -18 Q 75 -8 85 20 Z" fill="#3f4f1d" />
          <ellipse cx="90" cy="80" rx="75" ry="60" fill="#ea580c" />
          <ellipse cx="50" cy="80" rx="42" ry="54" fill="#f97316" />
          <ellipse cx="130" cy="80" rx="42" ry="54" fill="#f97316" />
        </g>

        {/* Stacked Frosted Cookies (Right) */}
        <g transform="translate(145, 60) scale(0.55)">
          <ellipse cx="40" cy="30" rx="36" ry="16" fill="#9a3412" />
          <ellipse cx="40" cy="24" rx="30" ry="12" fill="#fffbeb" />
          <ellipse cx="40" cy="14" rx="32" ry="14" fill="#9a3412" />
          <ellipse cx="40" cy="9" rx="26" ry="10" fill="#fffbeb" />
          <circle cx="36" cy="8" r="1.2" fill="#78350f" />
          <circle cx="44" cy="9" r="1.2" fill="#78350f" />
        </g>

        {/* Starbucks Iced PSL Cup (Center) */}
        <g transform="translate(75, 8) scale(0.3)">
          <ellipse cx="90" cy="385" rx="70" ry="15" fill="#451a03" opacity="0.4" />
          <path d="M 20 40 L 36 370 Q 38 385 90 385 Q 142 385 144 370 L 160 40 Z" fill="#92400e" />
          
          {/* Ice Cubes */}
          <rect x="45" y="100" width="35" height="30" rx="6" fill="#ffffff" opacity="0.4" />
          <rect x="95" y="120" width="35" height="30" rx="6" fill="#ffffff" opacity="0.4" />
          <rect x="55" y="180" width="35" height="30" rx="6" fill="#ffffff" opacity="0.35" />

          {/* Starbucks Siren Emblem */}
          <circle cx="90" cy="180" r="36" fill="#ffffff" opacity="0.3" stroke="#ffffff" strokeWidth="2" />
          <path d="M 90 156 L 92 163 L 99 163 L 94 167 L 96 174 L 90 170 L 84 174 L 86 167 L 81 163 L 88 163 Z" fill="#ffffff" opacity="0.95" />
          <circle cx="90" cy="180" r="14" fill="#ffffff" opacity="0.9" />

          {/* Thick Sweet Cream Cold Foam */}
          <path d="M 18 40 Q 90 52 162 40 L 164 12 Q 90 20 16 12 Z" fill="#fffbeb" />
          <ellipse cx="90" cy="14" rx="74" ry="14" fill="#fffbeb" stroke="#ffffff" strokeWidth="2" />
          <ellipse cx="90" cy="13" rx="65" ry="10" fill="#78350f" opacity="0.65" />
          <circle cx="70" cy="12" r="1.5" fill="#451a03" />
          <circle cx="90" cy="13" r="2" fill="#451a03" />
          <circle cx="110" cy="12" r="1.5" fill="#451a03" />
        </g>
      </svg>

      <span className="absolute bottom-1 right-2 text-[9px] font-black font-mono bg-[#431407] text-[#fed7aa] px-2 py-0.5 rounded-md shadow-xs border border-[#ea580c]/50">
        ☕ Starbucks PSL
      </span>
    </div>
  );
}

/* 1. Autumn Foliage Illustrated Tree Preview */
function MiniAutumnTreePreview() {
  return (
    <div className="relative w-full h-24 my-2.5 rounded-xl bg-gradient-to-b from-amber-200/70 via-orange-100/60 to-amber-100/80 overflow-hidden border border-amber-300/80 flex items-center justify-center shadow-inner">
      <div className="absolute inset-0 bg-radial from-amber-300/30 to-transparent blur-md pointer-events-none" />
      <svg viewBox="0 0 200 120" className="w-full h-full max-h-24 drop-shadow-xs">
        <ellipse cx="100" cy="50" rx="60" ry="35" fill="#e65100" opacity="0.9" />
        <ellipse cx="65" cy="58" rx="32" ry="24" fill="#f57c00" opacity="0.95" />
        <ellipse cx="135" cy="58" rx="32" ry="24" fill="#ef6c00" opacity="0.95" />
        <path d="M93 120 L96 70 L86 52 L91 49 L99 65 L107 47 L112 50 L102 70 L107 120 Z" fill="#4e342e" />
        <circle cx="100" cy="38" r="26" fill="#ffa726" />
        <circle cx="78" cy="44" r="20" fill="#fb8c00" />
        <circle cx="122" cy="44" r="20" fill="#f57c00" />
        <circle cx="100" cy="25" r="14" fill="#ffd54f" />
      </svg>
      <span className="absolute bottom-1 right-2 text-[9px] font-black font-mono bg-amber-950 text-amber-100 px-2 py-0.5 rounded-md shadow-xs border border-amber-700/50">
        🍁 Autumn Tree
      </span>
    </div>
  );
}

/* 2. Pink Floral Illustrated Preview */
function MiniFloralPreview() {
  return (
    <div className="relative w-full h-24 my-2.5 rounded-xl bg-gradient-to-b from-pink-200/70 via-rose-100/60 to-pink-100/80 overflow-hidden border border-pink-300/80 flex items-center justify-center shadow-inner">
      <div className="absolute inset-0 bg-radial from-pink-300/30 to-transparent blur-md pointer-events-none" />
      <svg viewBox="0 0 200 120" className="w-full h-full max-h-24 drop-shadow-xs">
        <path d="M0 120 Q50 90 100 105 T200 95 L200 120 Z" fill="#fbcfe8" />
        <path d="M94 120 L97 75 L88 58 L92 56 L99 70 L106 54 L110 56 L101 75 L106 120 Z" fill="#5c3d2e" />
        <circle cx="100" cy="46" r="25" fill="#f472b6" opacity="0.9" />
        <circle cx="80" cy="50" r="20" fill="#fb7185" opacity="0.9" />
        <circle cx="120" cy="50" r="20" fill="#f43f5e" opacity="0.8" />
        <circle cx="100" cy="30" r="13" fill="#fff1f2" />
      </svg>
      <span className="absolute bottom-1 right-2 text-[9px] font-black font-mono bg-pink-950 text-pink-100 px-2 py-0.5 rounded-md shadow-xs border border-pink-700/50">
        🌸 Sunday Floral
      </span>
    </div>
  );
}

/* 3. Emerald Classic Illustrated Preview */
function MiniEmeraldPreview() {
  return (
    <div className="relative w-full h-24 my-2.5 rounded-xl bg-gradient-to-b from-emerald-200/70 via-teal-100/60 to-emerald-100/80 overflow-hidden border border-emerald-300/80 flex items-center justify-center shadow-inner">
      <div className="absolute inset-0 bg-radial from-emerald-300/30 to-transparent blur-md pointer-events-none" />
      <svg viewBox="0 0 200 120" className="w-full h-full max-h-24 drop-shadow-xs">
        <path d="M0 120 Q60 95 120 108 T200 100 L200 120 Z" fill="#a7f3d0" />
        <polygon points="60,105 40,105 50,70" fill="#047857" />
        <polygon points="60,90 40,90 50,60" fill="#059669" />
        <polygon points="145,105 125,105 135,70" fill="#047857" />
        <polygon points="145,90 125,90 135,60" fill="#059669" />
        <polygon points="112,110 88,110 100,50" fill="#047857" />
        <polygon points="108,72 92,72 100,36" fill="#10b981" />
        <polygon points="105,52 95,52 100,24" fill="#34d399" />
      </svg>
      <span className="absolute bottom-1 right-2 text-[9px] font-black font-mono bg-emerald-950 text-emerald-100 px-2 py-0.5 rounded-md shadow-xs border border-emerald-700/50">
        🌿 Evergreen Classic
      </span>
    </div>
  );
}

/* 4. Silver Metallic Illustrated Preview (Fixed No Text Overlap) */
function MiniSilverPreview() {
  return (
    <div className="relative w-full h-24 my-2.5 rounded-xl bg-gradient-to-b from-slate-200 via-zinc-100 to-slate-200 overflow-hidden border border-slate-400 flex items-center justify-center shadow-inner">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent blur-xs pointer-events-none" />
      <div className="text-center relative z-10 flex flex-col items-center">
        <Sparkles className="w-8 h-8 text-slate-700 animate-pulse" />
      </div>
      <span className="absolute bottom-1 right-2 text-[9px] font-black font-mono bg-slate-900 text-slate-100 px-2 py-0.5 rounded-md shadow-xs border border-slate-700">
        ⚡ 7-Day Silver
      </span>
    </div>
  );
}

/* 5. Crystal Quartz Illustrated Preview (Fixed No Text Overlap) */
function MiniCrystalPreview() {
  return (
    <div className="relative w-full h-24 my-2.5 rounded-xl bg-gradient-to-b from-cyan-200 via-sky-100 to-blue-200 overflow-hidden border border-cyan-400 flex items-center justify-center shadow-inner">
      <div className="absolute inset-0 bg-radial from-cyan-300/50 to-transparent blur-md pointer-events-none" />
      <div className="text-center relative z-10 flex flex-col items-center">
        <Diamond className="w-8 h-8 text-cyan-800 animate-bounce" />
      </div>
      <span className="absolute bottom-1 right-2 text-[9px] font-black font-mono bg-cyan-950 text-cyan-100 px-2 py-0.5 rounded-md shadow-xs border border-cyan-700">
        💎 14-Day Diamond
      </span>
    </div>
  );
}

/* 6. Sunrise Yellow Illustrated Preview (Fixed No Text Overlap) */
function MiniSunrisePreview() {
  return (
    <div className="relative w-full h-24 my-2.5 rounded-xl bg-gradient-to-b from-amber-200 via-yellow-100 to-amber-200 overflow-hidden border border-yellow-400 flex items-center justify-center shadow-inner">
      <div className="absolute inset-0 bg-radial from-yellow-300/60 to-transparent blur-md pointer-events-none" />
      <div className="text-center relative z-10 flex flex-col items-center">
        <Sun className="w-8 h-8 text-amber-700 animate-spin" style={{ animationDuration: '14s' }} />
      </div>
      <span className="absolute bottom-1 right-2 text-[9px] font-black font-mono bg-amber-950 text-yellow-200 px-2 py-0.5 rounded-md shadow-xs border border-yellow-600">
        🌅 21-Day Sunrise
      </span>
    </div>
  );
}

/* 7. Gold Emperor Illustrated Preview (Fixed No Text Overlap) */
function MiniGoldEmperorPreview() {
  return (
    <div className="relative w-full h-24 my-2.5 rounded-xl bg-gradient-to-b from-yellow-200 via-amber-200 to-yellow-300 overflow-hidden border border-yellow-500 flex items-center justify-center shadow-inner">
      <div className="absolute inset-0 bg-radial from-yellow-400/60 to-transparent blur-md pointer-events-none" />
      <div className="text-center relative z-10 flex flex-col items-center">
        <Crown className="w-8 h-8 text-amber-900 drop-shadow-sm" />
      </div>
      <span className="absolute bottom-1 right-2 text-[9px] font-black font-mono bg-amber-950 text-yellow-200 px-2 py-0.5 rounded-md shadow-xs border border-yellow-600">
        👑 30-Day Emperor
      </span>
    </div>
  );
}

export const THEME_CONFIGS = [
  {
    id: 'pumpkin_spice' as AppTheme,
    name: 'Starbucks Pumpkin Spice Latte ☕🎃',
    shortName: 'Starbucks PSL',
    minStreak: 0,
    description: "Bunny's Traditional PSL",
    previewComponent: MiniPumpkinSpicePreview
  },
  {
    id: 'autumn' as AppTheme,
    name: 'September Fall Foliage 🍁',
    shortName: 'Fall Foliage',
    minStreak: 0,
    description: 'Montana Autumn Harvest theme with falling leaves & golden maple aura.',
    previewComponent: MiniAutumnTreePreview
  },
  {
    id: 'pink_floral' as AppTheme,
    name: 'White & Pink Floral Jogger 🌸',
    shortName: 'Pink Floral',
    minStreak: 0,
    description: 'Sunday Jogging Day theme with running emojis & flowers.',
    previewComponent: MiniFloralPreview
  },
  {
    id: 'emerald' as AppTheme,
    name: 'Default Emerald 🌿',
    shortName: 'Emerald',
    minStreak: 0,
    description: 'Clean classic gym control room layout with evergreen energy.',
    previewComponent: MiniEmeraldPreview
  },
  {
    id: 'silver' as AppTheme,
    name: 'Silver Metallic ⚡',
    shortName: 'Silver',
    minStreak: 7,
    description: 'Unlocked at 7 Days Streak! Elegant cool metal aesthetics.',
    previewComponent: MiniSilverPreview
  },
  {
    id: 'crystal' as AppTheme,
    name: 'Crystal Quartz / Diamond 💎',
    shortName: 'Crystal Diamond',
    minStreak: 14,
    description: 'Unlocked at 14 Days Streak! Vibrant iridescent diamond blue.',
    previewComponent: MiniCrystalPreview
  },
  {
    id: 'sunrise' as AppTheme,
    name: 'Sunrise Yellow / Gold Glow 🌅',
    shortName: 'Sunrise Gold',
    minStreak: 21,
    description: 'Unlocked at 21 Days Streak! Energetic warm sunrise aura.',
    previewComponent: MiniSunrisePreview
  },
  {
    id: 'gold' as AppTheme,
    name: 'Gold Emperor 👑',
    shortName: 'Gold Emperor',
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
      {/* Milestone Progress Card (iPhone Liquid Glass Tint) */}
      <div className="bg-stone-900/65 backdrop-blur-xl rounded-[32px] p-6 text-white shadow-xl relative overflow-hidden border border-white/30">
        <div className="absolute top-0 right-0 w-36 h-36 bg-orange-500/20 rounded-full blur-2xl" />
        
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-orange-500 text-white rounded-2xl shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black tracking-tight text-white">Milestone Progression Vault</h3>
              <p className="text-xs text-amber-200 font-bold">
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
          <div className="w-full bg-stone-800/80 h-3.5 rounded-full overflow-hidden p-0.5 border border-amber-500/30">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 rounded-full shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Themes Vault Grid (iPhone Liquid Glass Translucent) */}
      <div className="bg-white/35 backdrop-blur-xl rounded-[32px] p-5 sm:p-6 shadow-xl border border-white/60 space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-amber-950/15">
          <div className="p-2.5 bg-gradient-to-tr from-amber-600 to-orange-500 text-white rounded-2xl shadow-sm">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-stone-950">Themes Vault & Rewards</h3>
            <p className="text-xs text-stone-800 font-bold">Select and equip custom themes to transform Bunny's Gym Record!</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {THEME_CONFIGS.map((theme) => {
            const isUnlocked = currentStreak >= theme.minStreak || theme.id === 'emerald' || theme.id === 'pink_floral' || theme.id === 'autumn' || theme.id === 'pumpkin_spice';
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
                      : `${style.cardBgLocked} border-2 border-stone-300/80 opacity-75`
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-7 h-7 rounded-full ${style.iconBg} flex items-center justify-center text-white shadow-xs shrink-0`}>
                        <AccentIcon className="w-4 h-4 text-white" />
                      </div>
                      <span className={`text-xs sm:text-sm font-black ${style.titleColor}`}>{theme.name}</span>
                    </div>

                    {isActive ? (
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs shrink-0 ${style.badgeActive}`}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : isUnlocked ? (
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-2xs shrink-0 ${style.badgeUnlocked}`}>
                        Unlocked
                      </span>
                    ) : (
                      <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${style.badgeLocked}`}>
                        <Lock className="w-3 h-3 text-stone-800" /> Day {theme.minStreak}
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
                      className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 active:scale-95 shadow-md ${
                        isActive 
                          ? `${style.equippedBtnBg} cursor-default` 
                          : `${style.equipBtnBg}`
                      }`}
                    >
                      {isActive ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-300" />
                          <span className="text-[#fed7aa] font-black">✓ Currently Equipped</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 shrink-0 text-white" />
                          <span className="text-white font-black">Equip {theme.shortName} Theme</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="w-full py-3 px-3 bg-stone-200/90 text-stone-900 font-black rounded-xl text-xs font-mono text-center border border-stone-300 flex items-center justify-center gap-1.5 shadow-2xs">
                      <Lock className="w-3.5 h-3.5 text-stone-800" />
                      <span>Reach Day {theme.minStreak} Streak to Unlock</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Skip Days Perk Panel (iPhone Liquid Glass Translucent) */}
      <div className="bg-white/35 backdrop-blur-xl rounded-[32px] p-5 sm:p-6 shadow-xl border border-white/60 space-y-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-tr from-amber-600 to-orange-500 text-white rounded-2xl shadow-sm">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-stone-950 flex items-center gap-2">
              <span>Protected Skip Days Perk</span>
              {!skipUnlocked && <span className="text-[10px] font-mono bg-amber-100 text-amber-950 px-2 py-0.5 rounded-full font-black border border-amber-300">Unlocks Day 60</span>}
            </h3>
            <p className="text-xs text-stone-800 font-bold">
              Allows up to 2 rest days per month without breaking your active streak!
            </p>
          </div>
        </div>

        {skipUnlocked ? (
          <div className="p-4 bg-white/50 backdrop-blur-md border border-amber-300 rounded-2xl flex items-center justify-between shadow-xs">
            <div>
              <span className="text-xs font-black text-stone-950 block">Monthly Protected Skip Days</span>
              <span className="text-xs text-stone-800 font-bold">Used: {usedSkip} / 2 this month</span>
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
          <div className="p-3.5 bg-white/40 backdrop-blur-md border border-stone-300 text-stone-900 text-xs rounded-2xl font-mono leading-relaxed font-bold">
            🔒 Milestone locked until hitting 60 continuous streak days! ({60 - currentStreak} days remaining).
          </div>
        )}
      </div>
    </div>
  );
}
