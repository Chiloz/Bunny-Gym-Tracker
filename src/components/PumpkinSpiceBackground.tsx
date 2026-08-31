import React, { useMemo } from 'react';
import { motion } from 'motion/react';

interface SpiceParticle {
  id: number;
  startX: number;
  startY: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  swayAmount: number;
  type: 'cinnamon_flake' | 'star_anise' | 'sparkle' | 'spice_dust' | 'mini_leaf';
  rotationStart: number;
  rotationEnd: number;
}

const PSL_WARM_SPICE_PALETTE = [
  '#c2410c', // Spiced pumpkin orange
  '#9a3412', // Warm cinnamon brown
  '#d97706', // Golden spice
  '#b45309', // Roasted coffee caramel
  '#ea580c', // Bright pumpkin
  '#78350f', // Deep espresso
  '#f59e0b', // Radiant amber
  '#fdba74', // Creamy pumpkin whip
];

export default function PumpkinSpiceBackground() {
  // Generate floating spice particles & cinnamon dusting
  const spices: SpiceParticle[] = useMemo(() => {
    const list: SpiceParticle[] = [];
    const count = 30;

    for (let i = 0; i < count; i++) {
      const typeChoice: SpiceParticle['type'] = 
        i % 5 === 0 ? 'star_anise' :
        i % 5 === 1 ? 'cinnamon_flake' :
        i % 5 === 2 ? 'sparkle' :
        i % 5 === 3 ? 'mini_leaf' : 'spice_dust';

      list.push({
        id: i,
        startX: 3 + (i * (94 / count)) + ((i % 3) * 2),
        startY: -20 - ((i % 5) * 20),
        size: typeChoice === 'star_anise' ? 22 + (i % 3) * 4 :
              typeChoice === 'sparkle' ? 14 + (i % 3) * 3 :
              typeChoice === 'mini_leaf' ? 18 + (i % 3) * 4 :
              8 + (i % 4) * 4,
        color: PSL_WARM_SPICE_PALETTE[i % PSL_WARM_SPICE_PALETTE.length],
        duration: 8 + (i % 5) * 2,
        delay: (i * 0.4) % 6,
        swayAmount: 25 + (i % 4) * 20,
        type: typeChoice,
        rotationStart: (i * 45) % 360,
        rotationEnd: (i * 45) + 360 + (i % 2 === 0 ? 180 : -180),
      });
    }
    return list;
  }, []);

  const renderSpiceSvg = (type: SpiceParticle['type'], color: string) => {
    if (type === 'star_anise') {
      return (
        <svg viewBox="0 0 24 24" fill={color} className="w-full h-full drop-shadow-md">
          {/* 8-pointed star anise spice */}
          <path d="M12 2L13.5 7.5L19 6L15.5 10.5L20 14L14.5 14.5L14 20L10.5 15.5L6 18L7.5 12.5L2 11L6.5 7.5L5 2L10.5 4.5L12 2Z" />
          <circle cx="12" cy="12" r="2.5" fill="#451a03" />
        </svg>
      );
    }
    if (type === 'cinnamon_flake') {
      return (
        <svg viewBox="0 0 24 24" fill={color} className="w-full h-full drop-shadow-sm">
          <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(35 12 12)" />
          <path d="M6 15 C8 13 14 11 18 9" stroke="#451a03" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        </svg>
      );
    }
    if (type === 'mini_leaf') {
      return (
        <svg viewBox="0 0 24 24" fill={color} className="w-full h-full drop-shadow-md">
          <path d="M12 2C9 5 5 9 7 14C9 19 12 21 12 21C12 21 15 19 17 14C19 9 15 5 12 2Z" />
          <path d="M12 2V21" stroke="#451a03" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
        </svg>
      );
    }
    if (type === 'sparkle') {
      return (
        <svg viewBox="0 0 24 24" fill="#fbbf24" className="w-full h-full drop-shadow-md">
          <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
        </svg>
      );
    }
    // Spice dust
    return (
      <div 
        className="w-full h-full rounded-full shadow-xs" 
        style={{ backgroundColor: color, opacity: 0.85 }} 
      />
    );
  };

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none" 
      aria-hidden="true"
      id="pumpkin-spice-latte-background"
    >
      {/* 1. Terracotta Warm Café Atmosphere & Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#ffedd5]/85 via-[#fed7aa]/55 to-[#ffedd5]/90 pointer-events-none" />
      
      {/* Subtle Terracotta Ceramic Tiles Backdrop Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.14] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #9a3412 1px, transparent 1px),
            linear-gradient(to bottom, #9a3412 1px, transparent 1px)
          `,
          backgroundSize: '120px 120px',
        }}
      />

      {/* Warm Golden Cinnamon Sunbeam Radiance */}
      <div className="absolute top-48 sm:top-20 md:top-10 left-1/2 -translate-x-1/2 w-[750px] sm:w-[950px] h-[550px] bg-radial from-[#fb923c]/35 via-[#ea580c]/20 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-52 sm:top-28 left-1/4 w-[450px] h-[450px] bg-radial from-[#fdba74]/30 via-[#fed7aa]/15 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-52 sm:top-28 right-1/4 w-[450px] h-[450px] bg-radial from-[#fdba74]/30 via-[#fed7aa]/15 to-transparent blur-3xl pointer-events-none" />

      {/* 2. Centerpiece Starbucks Iced Pumpkin Spice Latte Artwork (Carefully position on laptop & phone) */}
      <div className="absolute top-48 sm:top-24 md:top-14 lg:top-16 left-1/2 -translate-x-1/2 w-[95vw] sm:w-[90vw] max-w-[840px] h-[420px] sm:h-[500px] md:h-[580px] pointer-events-none opacity-[0.92]">
        <svg 
          viewBox="0 0 800 600" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full filter drop-shadow-2xl"
        >
          <defs>
            {/* Terracotta Tile Wall Lighting */}
            <linearGradient id="tileGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ea580c" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#9a3412" stopOpacity="0.2" />
            </linearGradient>

            {/* Iced PSL Coffee Layers Gradient */}
            <linearGradient id="pslIcedLiquid" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="25%" stopColor="#b45309" />
              <stop offset="55%" stopColor="#92400e" />
              <stop offset="85%" stopColor="#78350f" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>

            {/* Thick Pumpkin Sweet Cream Cold Foam */}
            <linearGradient id="sweetCreamColdFoam" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="35%" stopColor="#fef3c7" />
              <stop offset="75%" stopColor="#fde68a" />
              <stop offset="100%" stopColor="#fcd34d" />
            </linearGradient>

            {/* Cinnamon Dusting Gradient */}
            <radialGradient id="cinnamonDust" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#78350f" stopOpacity="0.85" />
              <stop offset="60%" stopColor="#9a3412" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#c2410c" stopOpacity="0.3" />
            </radialGradient>

            {/* Pumpkin Orange Gradients */}
            <radialGradient id="pumpkinShade" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="50%" stopColor="#ea580c" />
              <stop offset="85%" stopColor="#c2410c" />
              <stop offset="100%" stopColor="#7c2d12" />
            </radialGradient>

            {/* Spiced Cookie Texture */}
            <radialGradient id="cookieBase" cx="45%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="60%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#78350f" />
            </radialGradient>

            {/* Swirled Cream Cheese Frosting */}
            <radialGradient id="cookieFrosting" cx="50%" cy="45%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#fffbeb" />
              <stop offset="90%" stopColor="#fef3c7" />
              <stop offset="100%" stopColor="#fde68a" />
            </radialGradient>

            {/* Clear Cup Glass Highlight */}
            <linearGradient id="cupGlassSheen" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
              <stop offset="25%" stopColor="#ffffff" stopOpacity="0.2" />
              <stop offset="70%" stopColor="#ffffff" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* ======================================================== */}
          {/* BACK LAYER: Autumn Pumpkins & Spiced Cookies on Left/Right */}
          {/* ======================================================== */}
          
          {/* Large Autumn Pumpkin (Left Background) */}
          <g transform="translate(110, 230) scale(1.15)">
            {/* Pumpkin Stem */}
            <path d="M 90 20 Q 80 -10 60 -18 Q 75 -8 85 20 Z" fill="#3f4f1d" stroke="#2d3814" strokeWidth="2" />
            {/* Pumpkin Ribs */}
            <ellipse cx="90" cy="80" rx="75" ry="60" fill="url(#pumpkinShade)" />
            <ellipse cx="50" cy="80" rx="42" ry="54" fill="url(#pumpkinShade)" />
            <ellipse cx="130" cy="80" rx="42" ry="54" fill="url(#pumpkinShade)" />
            <ellipse cx="25" cy="80" rx="30" ry="46" fill="url(#pumpkinShade)" />
            <ellipse cx="155" cy="80" rx="30" ry="46" fill="url(#pumpkinShade)" />
            <ellipse cx="90" cy="80" rx="32" ry="58" fill="#ea580c" opacity="0.9" />
          </g>

          {/* Stack of Frosted Pumpkin Spice Cookies (Left Midground) */}
          {/* Cookie 1 (Bottom of stack) */}
          <g transform="translate(180, 420)">
            <ellipse cx="60" cy="40" rx="55" ry="24" fill="url(#cookieBase)" />
            {/* Frosting Swirl */}
            <ellipse cx="60" cy="34" rx="46" ry="18" fill="url(#cookieFrosting)" />
            <path d="M 28 32 Q 60 18 92 32 Q 60 42 28 32 Z" fill="#ffffff" opacity="0.9" />
            {/* Cinnamon dust on frosting */}
            <circle cx="50" cy="30" r="1.5" fill="#78350f" />
            <circle cx="65" cy="28" r="1.2" fill="#9a3412" />
            <circle cx="75" cy="35" r="1.5" fill="#78350f" />
            <circle cx="42" cy="36" r="1.2" fill="#9a3412" />
          </g>

          {/* Cookie 2 (Middle of stack) */}
          <g transform="translate(185, 365)">
            <ellipse cx="55" cy="36" rx="52" ry="22" fill="url(#cookieBase)" />
            <ellipse cx="55" cy="30" rx="43" ry="16" fill="url(#cookieFrosting)" />
            <path d="M 26 28 Q 55 16 84 28 Q 55 36 26 28 Z" fill="#ffffff" opacity="0.9" />
            <circle cx="48" cy="26" r="1.5" fill="#78350f" />
            <circle cx="60" cy="24" r="1.2" fill="#9a3412" />
            <circle cx="70" cy="31" r="1.5" fill="#78350f" />
          </g>

          {/* Cookie 3 (Top of stack) */}
          <g transform="translate(190, 310)">
            <ellipse cx="50" cy="32" rx="48" ry="20" fill="url(#cookieBase)" />
            <ellipse cx="50" cy="26" rx="40" ry="15" fill="url(#cookieFrosting)" />
            <path d="M 24 24 Q 50 14 76 24 Q 50 32 24 24 Z" fill="#ffffff" opacity="0.9" />
            <circle cx="44" cy="22" r="1.5" fill="#78350f" />
            <circle cx="56" cy="20" r="1.2" fill="#9a3412" />
            <circle cx="64" cy="27" r="1.5" fill="#78350f" />
          </g>

          {/* Mini Pumpkin (Foreground Left) */}
          <g transform="translate(70, 430) scale(0.75)">
            <path d="M 80 15 Q 70 -5 50 -10 Q 65 -2 75 15 Z" fill="#3f4f1d" stroke="#2d3814" strokeWidth="2" />
            <ellipse cx="80" cy="65" rx="60" ry="46" fill="url(#pumpkinShade)" />
            <ellipse cx="50" cy="65" rx="35" ry="42" fill="url(#pumpkinShade)" />
            <ellipse cx="110" cy="65" rx="35" ry="42" fill="url(#pumpkinShade)" />
            <ellipse cx="80" cy="65" rx="25" ry="45" fill="#ea580c" />
          </g>

          {/* Mini Pumpkin (Foreground Right) */}
          <g transform="translate(560, 410) scale(0.9)">
            {/* Long Curled Stem */}
            <path d="M 90 20 Q 95 -15 125 -30 Q 115 -10 95 20 Z" fill="#3f4f1d" stroke="#2d3814" strokeWidth="2" />
            <ellipse cx="90" cy="75" rx="70" ry="54" fill="url(#pumpkinShade)" />
            <ellipse cx="55" cy="75" rx="40" ry="48" fill="url(#pumpkinShade)" />
            <ellipse cx="125" cy="75" rx="40" ry="48" fill="url(#pumpkinShade)" />
            <ellipse cx="30" cy="75" rx="28" ry="40" fill="url(#pumpkinShade)" />
            <ellipse cx="150" cy="75" rx="28" ry="40" fill="url(#pumpkinShade)" />
            <ellipse cx="90" cy="75" rx="30" ry="52" fill="#ea580c" />
          </g>

          {/* Frosted Cookie (Right Background) */}
          <g transform="translate(630, 310)">
            <ellipse cx="50" cy="30" rx="46" ry="20" fill="url(#cookieBase)" />
            <ellipse cx="50" cy="24" rx="38" ry="14" fill="url(#cookieFrosting)" />
            <path d="M 22 22 Q 50 12 78 22 Q 50 30 22 22 Z" fill="#ffffff" opacity="0.9" />
            <circle cx="45" cy="20" r="1.5" fill="#78350f" />
            <circle cx="58" cy="18" r="1.2" fill="#9a3412" />
          </g>


          {/* ======================================================== */}
          {/* CENTERPIECE: Starbucks Iced Pumpkin Spice Latte Cup */}
          {/* ======================================================== */}
          <g transform="translate(290, 80) scale(1.18)">
            
            {/* Shadow under the cup */}
            <ellipse cx="100" cy="405" rx="78" ry="18" fill="#451a03" opacity="0.45" />

            {/* Clear Starbucks Iced Cup Silhouette */}
            {/* Main Cup Body Path */}
            <path 
              d="M 20 50 L 38 385 Q 40 400 100 400 Q 160 400 162 385 L 180 50 Z" 
              fill="url(#pslIcedLiquid)" 
            />

            {/* Ribbed cup horizontal bands */}
            <path d="M 23 80 L 177 80" stroke="#ffffff" strokeWidth="1.5" opacity="0.3" />
            <path d="M 27 150 L 173 150" stroke="#ffffff" strokeWidth="1.5" opacity="0.25" />
            <path d="M 31 220 L 169 220" stroke="#ffffff" strokeWidth="1.5" opacity="0.2" />
            <path d="M 35 290 L 165 290" stroke="#ffffff" strokeWidth="1.5" opacity="0.2" />

            {/* Realistic Floating Ice Cubes in Liquid */}
            {/* Ice Cube 1 */}
            <g transform="translate(45, 120) rotate(15)">
              <rect x="0" y="0" width="36" height="32" rx="6" fill="#ffffff" opacity="0.35" stroke="#ffffff" strokeWidth="1.5" />
              <path d="M 4 8 L 32 8" stroke="#ffffff" strokeWidth="1" opacity="0.5" />
            </g>
            {/* Ice Cube 2 */}
            <g transform="translate(110, 140) rotate(-20)">
              <rect x="0" y="0" width="38" height="34" rx="6" fill="#ffffff" opacity="0.35" stroke="#ffffff" strokeWidth="1.5" />
            </g>
            {/* Ice Cube 3 */}
            <g transform="translate(60, 200) rotate(8)">
              <rect x="0" y="0" width="34" height="30" rx="5" fill="#ffffff" opacity="0.3" stroke="#ffffff" strokeWidth="1.5" />
            </g>
            {/* Ice Cube 4 */}
            <g transform="translate(105, 235) rotate(-12)">
              <rect x="0" y="0" width="38" height="32" rx="6" fill="#ffffff" opacity="0.28" stroke="#ffffff" strokeWidth="1.5" />
            </g>

            {/* Starbucks Iconic Circular Siren Logo Emblem */}
            <g transform="translate(100, 210)">
              {/* Outer circle with frosted translucent background */}
              <circle cx="0" cy="0" r="42" fill="#ffffff" opacity="0.28" stroke="#ffffff" strokeWidth="2" />
              <circle cx="0" cy="0" r="38" fill="#ffffff" opacity="0.15" />
              
              {/* Starbucks Siren Crown & Star */}
              <path d="M 0 -28 L 3 -20 L 11 -20 L 5 -15 L 7 -7 L 0 -12 L -7 -7 L -5 -15 L -11 -20 L -3 -20 Z" fill="#ffffff" opacity="0.95" />
              <path d="M -18 -18 L -12 -12 L -8 -20 L -12 -25 Z" fill="#ffffff" opacity="0.9" />
              <path d="M 18 -18 L 12 -12 L 8 -20 L 12 -25 Z" fill="#ffffff" opacity="0.9" />

              {/* Siren Face Silhouette */}
              <path d="M -7 -6 Q 0 -9 7 -6 Q 7 5 0 9 Q -7 5 -7 -6 Z" fill="#ffffff" opacity="0.95" />
              {/* Siren Hair Waves */}
              <path d="M -16 -6 Q -22 6 -12 16 Q -22 22 -30 14" stroke="#ffffff" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.95" />
              <path d="M 16 -6 Q 22 6 12 16 Q 22 22 30 14" stroke="#ffffff" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.95" />
              <path d="M -8 10 Q -15 20 -24 24" stroke="#ffffff" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.9" />
              <path d="M 8 10 Q 15 20 24 24" stroke="#ffffff" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.9" />
              
              {/* Starbucks Wordmark / Registered icon */}
              <circle cx="28" cy="26" r="2.5" stroke="#ffffff" strokeWidth="0.8" fill="none" opacity="0.8" />
              <text x="28" y="27.5" fill="#ffffff" fontSize="2.8" textAnchor="middle" fontWeight="bold" opacity="0.8">R</text>
            </g>

            {/* Pumpkin Spice Cold Foam Layer on Top (Rich Creamy Froth) */}
            <path 
              d="M 18 50 Q 100 62 182 50 L 186 16 Q 100 24 14 16 Z" 
              fill="url(#sweetCreamColdFoam)" 
            />
            {/* Foam Dripping Texture */}
            <path 
              d="M 18 50 Q 40 68 60 55 Q 85 70 110 56 Q 140 72 165 54 Q 175 60 182 50" 
              fill="url(#sweetCreamColdFoam)" 
            />

            {/* Cup Rim & Froth Top Surface */}
            <ellipse cx="100" cy="18" rx="86" ry="18" fill="url(#sweetCreamColdFoam)" stroke="#ffffff" strokeWidth="2.5" />
            <ellipse cx="100" cy="17" rx="80" ry="15" fill="url(#cinnamonDust)" />

            {/* Cinnamon & Nutmeg Spice Dusting Specks across top */}
            {[
              { cx: 65, cy: 15, r: 1.6 }, { cx: 80, cy: 12, r: 1.4 }, { cx: 95, cy: 14, r: 1.8 },
              { cx: 110, cy: 12, r: 1.5 }, { cx: 125, cy: 16, r: 1.4 }, { cx: 140, cy: 18, r: 1.6 },
              { cx: 75, cy: 20, r: 1.5 }, { cx: 90, cy: 22, r: 1.8 }, { cx: 105, cy: 21, r: 1.6 },
              { cx: 120, cy: 23, r: 1.4 }, { cx: 100, cy: 18, r: 2.0 }, { cx: 85, cy: 16, r: 1.7 },
              { cx: 115, cy: 17, r: 1.5 }, { cx: 130, cy: 13, r: 1.3 }, { cx: 55, cy: 18, r: 1.2 },
            ].map((speck, idx) => (
              <circle key={idx} cx={speck.cx} cy={speck.cy} r={speck.r} fill="#5c2e0b" opacity="0.85" />
            ))}

            {/* Glass Highlights & Reflections (Vertical Sheen) */}
            <path 
              d="M 28 50 L 44 380 Q 48 390 65 390 L 52 50 Z" 
              fill="url(#cupGlassSheen)" 
            />
            <path 
              d="M 160 50 L 148 385 Q 155 385 160 380 L 172 50 Z" 
              fill="url(#cupGlassSheen)" 
              opacity="0.6" 
            />

            {/* Frosted clear lid border */}
            <ellipse cx="100" cy="14" rx="88" ry="12" fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.75" />
            <path d="M 12 14 L 14 18 Q 100 28 186 18 L 188 14" stroke="#ffffff" strokeWidth="2.5" fill="none" opacity="0.8" />
          </g>

          {/* Gentle Aroma Steam Wisps Rising from the Latte */}
          <path 
            d="M 370 70 Q 355 40 375 15 Q 395 -10 375 -35" 
            stroke="#ffffff" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            fill="none" 
            opacity="0.35" 
            className="animate-pulse"
          />
          <path 
            d="M 430 75 Q 450 45 435 20 Q 420 -5 440 -30" 
            stroke="#ffffff" 
            strokeWidth="3" 
            strokeLinecap="round" 
            fill="none" 
            opacity="0.3" 
            className="animate-pulse"
          />
        </svg>
      </div>

      {/* 3. Golden Cinnamon Spiced Hearth Floor Banner along Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-28 sm:h-36 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-t from-[#c2410c]/35 via-[#ea580c]/15 to-transparent" />
        
        <svg 
          viewBox="0 0 1200 120" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className="absolute bottom-0 w-full h-full opacity-55 preserve-3d"
          preserveAspectRatio="none"
        >
          <path d="M 0 120 Q 300 85 600 95 Q 900 80 1200 90 L 1200 120 L 0 120 Z" fill="#7c2d12" opacity="0.6" />
          <path d="M 0 120 Q 200 90 500 100 Q 800 85 1200 105 L 1200 120 L 0 120 Z" fill="#9a3412" opacity="0.65" />
          <path d="M 0 120 Q 400 95 800 102 Q 1050 90 1200 110 L 1200 120 L 0 120 Z" fill="#ea580c" opacity="0.45" />
          
          {/* Cinnamon powder & autumn leaves on the table */}
          {[
            { cx: 120, cy: 105, r: 8, c: '#78350f' },
            { cx: 200, cy: 112, r: 12, c: '#c2410c' },
            { cx: 340, cy: 102, r: 10, c: '#d97706' },
            { cx: 520, cy: 108, r: 14, c: '#ea580c' },
            { cx: 680, cy: 104, r: 11, c: '#78350f' },
            { cx: 840, cy: 112, r: 13, c: '#c2410c' },
            { cx: 1020, cy: 106, r: 9, c: '#b45309' },
          ].map((item, idx) => (
            <ellipse key={idx} cx={item.cx} cy={item.cy} rx={item.r * 1.5} ry={item.r * 0.7} fill={item.c} opacity="0.8" />
          ))}
        </svg>
      </div>

      {/* 4. Drifting, Swaying Cinnamon Spices & Golden Stars */}
      {spices.map((spice) => (
        <motion.div
          key={spice.id}
          className="absolute"
          style={{
            width: spice.size,
            height: spice.size,
            left: `${spice.startX}%`,
            top: -40,
          }}
          initial={{
            y: spice.startY,
            x: 0,
            rotate: spice.rotationStart,
            opacity: 0,
          }}
          animate={{
            y: ['0vh', '118vh'],
            x: [
              0,
              spice.swayAmount,
              -spice.swayAmount,
              spice.swayAmount * 0.8,
              -spice.swayAmount * 0.5,
              spice.swayAmount * 0.2,
              0
            ],
            rotate: [spice.rotationStart, spice.rotationEnd],
            opacity: [0, 0.95, 0.95, 0.9, 0.75, 0],
          }}
          transition={{
            duration: spice.duration,
            repeat: Infinity,
            delay: spice.delay,
            ease: "easeInOut",
            times: [0, 0.15, 0.35, 0.6, 0.8, 0.95, 1],
          }}
        >
          {renderSpiceSvg(spice.type, spice.color)}
        </motion.div>
      ))}

      {/* 5. Cozy Starbucks PSL Emojis Floating Gently */}
      <div className="absolute top-1/4 left-8 text-2xl opacity-50 animate-bounce" style={{ animationDuration: '5s' }}>☕</div>
      <div className="absolute top-1/3 right-10 text-3xl opacity-45 animate-bounce" style={{ animationDuration: '6s' }}>🎃</div>
      <div className="absolute bottom-28 left-12 text-2xl opacity-40 animate-pulse">🍪</div>
      <div className="absolute bottom-36 right-16 text-2xl opacity-40 animate-pulse">✨</div>
      <div className="absolute top-1/2 right-6 text-xl opacity-35 animate-bounce" style={{ animationDuration: '7s' }}>🍂</div>
    </div>
  );
}
