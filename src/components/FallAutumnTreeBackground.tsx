import React, { useMemo } from 'react';
import { motion } from 'motion/react';

interface LeafParticle {
  id: number;
  startX: number;
  startY: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  swayAmount: number;
  leafType: 'maple' | 'oak' | 'aspen' | 'birch';
  rotationStart: number;
  rotationEnd: number;
}

const RICH_AUTUMN_PALETTE = [
  '#ff7b00', // Fiery glowing orange
  '#e85d04', // Rich pumpkin orange
  '#dc2f02', // Deep vibrant red-orange
  '#d00000', // Crimson maple
  '#faa307', // Golden amber
  '#ffba08', // Radiant sunlit yellow-gold
  '#9d0208', // Rich burgundy red
  '#f48c06', // Warm autumn amber
  '#e76f51', // Terracotta
  '#d4a373', // Warm golden sand
];

export default function FallAutumnTreeBackground() {
  // Generate random drifting leaves with organic properties
  const leaves: LeafParticle[] = useMemo(() => {
    const list: LeafParticle[] = [];
    const count = 22; // Rich density without cluttering UI
    
    for (let i = 0; i < count; i++) {
      list.push({
        id: i,
        startX: 3 + (i * (94 / count)) + ((i % 4) * 3), // Spanning full width
        startY: -30 - ((i % 5) * 20),
        size: 16 + (i % 5) * 5, // 16px to 36px
        color: RICH_AUTUMN_PALETTE[i % RICH_AUTUMN_PALETTE.length],
        duration: 8 + (i % 6) * 2, // 8s to 18s smooth drift
        delay: (i * 0.7) % 8,
        swayAmount: 30 + (i % 4) * 20, // 30px to 90px side-to-side sway
        leafType: i % 4 === 0 ? 'maple' : i % 4 === 1 ? 'oak' : i % 4 === 2 ? 'aspen' : 'birch',
        rotationStart: (i * 55) % 360,
        rotationEnd: (i * 55) + 360 + (i % 2 === 0 ? 360 : -360),
      });
    }
    return list;
  }, []);

  const renderLeafSvg = (type: string, color: string) => {
    if (type === 'maple') {
      return (
        <svg viewBox="0 0 24 24" fill={color} className="w-full h-full drop-shadow-md">
          <path d="M12 2L13.8 6.2L18.2 4.8L16.8 9.2L21.5 11.2L18.2 13.8L20.2 18.2L15.5 16.8L13.8 21.2L12 18.8L10.2 21.2L8.5 16.8L3.8 18.2L5.8 13.8L2.5 11.2L7.2 9.2L5.8 4.8L10.2 6.2L12 2Z" />
          <path d="M12 18.8V23.5" stroke="#5c2e0b" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    }
    if (type === 'oak') {
      return (
        <svg viewBox="0 0 24 24" fill={color} className="w-full h-full drop-shadow-md">
          <path d="M12 2C9.5 4.5 6.5 4.2 7.8 7.5C5.5 8.8 4.5 11.8 6.8 14C4.8 16.2 5.8 19.5 9 20.2C10.2 21.2 11.2 22 12 22.8C12.8 22 13.8 21.2 15 20.2C18.2 19.5 19.2 16.2 17.2 14C19.5 11.8 18.5 8.8 16.2 7.5C17.5 4.2 14.5 4.5 12 2Z" />
          <path d="M12 20.2V23.5" stroke="#5c2e0b" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    }
    if (type === 'aspen') {
      return (
        <svg viewBox="0 0 24 24" fill={color} className="w-full h-full drop-shadow-md">
          <path d="M12 2.5C7.5 5.5 4.5 10 5.5 15.5C6.5 20 10 21.5 12 21.5C14 21.5 17.5 20 18.5 15.5C19.5 10 16.5 5.5 12 2.5Z" />
          <path d="M12 17.5V23" stroke="#5c2e0b" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    }
    // Birch
    return (
      <svg viewBox="0 0 24 24" fill={color} className="w-full h-full drop-shadow-md">
        <path d="M12 2C8.5 7 5.5 12.5 7.5 17.5C9.5 21 11.5 21.5 12 21.5C12.5 21.5 14.5 21 16.5 17.5C18.5 12.5 15.5 7 12 2Z" />
        <path d="M12 18.5V23" stroke="#5c2e0b" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  };

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none" 
      aria-hidden="true"
      id="fall-autumn-tree-background"
    >
      {/* 1. Warm Golden Autumn Atmospheric Light & Sunbeams */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-200/40 via-orange-100/25 to-amber-50/40 pointer-events-none" />
      
      {/* Sunbeam Radiance in Upper Corner */}
      <div className="absolute -top-24 -left-24 w-[600px] h-[600px] bg-radial from-amber-300/45 via-orange-200/20 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-radial from-yellow-200/30 via-orange-100/15 to-transparent blur-3xl pointer-events-none" />

      {/* 2. Majestic Autumn Maple Tree in Top-Left / Spanning Header */}
      <div className="absolute -top-10 -left-12 sm:-left-6 w-[360px] sm:w-[520px] md:w-[680px] lg:w-[820px] h-[340px] sm:h-[460px] md:h-[540px] pointer-events-none opacity-95">
        <svg 
          viewBox="0 0 700 500" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full filter drop-shadow-xl"
        >
          <defs>
            {/* Trunk Wood Gradients */}
            <linearGradient id="barkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3d2110" />
              <stop offset="40%" stopColor="#5a3418" />
              <stop offset="70%" stopColor="#784724" />
              <stop offset="100%" stopColor="#2c170a" />
            </linearGradient>

            <linearGradient id="barkHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8d562e" />
              <stop offset="50%" stopColor="#5c381c" />
              <stop offset="100%" stopColor="#331c0c" />
            </linearGradient>

            {/* Rich Foliage Gradients */}
            <radialGradient id="foliageGoldGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffe66d" stopOpacity="1" />
              <stop offset="45%" stopColor="#ffb703" stopOpacity="0.95" />
              <stop offset="85%" stopColor="#fb8500" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#e85d04" stopOpacity="0.8" />
            </radialGradient>

            <radialGradient id="foliageFieryOrange" cx="45%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#ffb703" stopOpacity="1" />
              <stop offset="35%" stopColor="#fb8500" stopOpacity="0.95" />
              <stop offset="75%" stopColor="#e85d04" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#c1121f" stopOpacity="0.85" />
            </radialGradient>

            <radialGradient id="foliageCrimsonAmber" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f48c06" stopOpacity="1" />
              <stop offset="40%" stopColor="#dc2f02" stopOpacity="0.95" />
              <stop offset="80%" stopColor="#9d0208" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#6a040f" stopOpacity="0.85" />
            </radialGradient>

            <radialGradient id="foliageSunlitYellow" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#fff3b0" stopOpacity="1" />
              <stop offset="50%" stopColor="#ffba08" stopOpacity="0.95" />
              <stop offset="90%" stopColor="#f48c06" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#dc2f02" stopOpacity="0.75" />
            </radialGradient>
          </defs>

          {/* Majestic Main Tree Trunk with Natural Bark Curves */}
          <path 
            d="M -30 0 Q 40 80 90 160 Q 120 220 150 310 Q 170 390 180 500 L 125 500 Q 110 400 90 320 Q 60 230 20 140 Q -10 80 -40 0 Z" 
            fill="url(#barkGrad)" 
          />

          {/* Tree Trunk Bark Texture & Ridge Lines */}
          <path d="M 50 180 Q 75 250 100 350 Q 115 420 120 500" stroke="#784724" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
          <path d="M 75 140 Q 105 210 135 300 Q 150 380 155 500" stroke="#2c170a" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
          <path d="M 25 100 Q 55 170 80 260" stroke="#8d562e" strokeWidth="3" strokeLinecap="round" opacity="0.5" />

          {/* Spreading Heavy Primary & Secondary Autumn Branches */}
          {/* Main Top Horizontal Branch */}
          <path 
            d="M 80 150 Q 160 120 260 135 Q 360 150 460 125 Q 520 110 580 95 Q 500 135 380 165 Q 260 170 140 180 Z" 
            fill="url(#barkHighlight)" 
          />
          {/* Branch Sub-fork 1 */}
          <path 
            d="M 250 145 Q 320 95 400 85 Q 460 75 510 60 Q 440 90 360 115 Q 300 125 250 145 Z" 
            fill="url(#barkGrad)" 
          />
          {/* Branch Sub-fork 2 */}
          <path 
            d="M 360 155 Q 430 185 520 200 Q 590 210 650 195 Q 570 220 480 205 Q 410 190 360 155 Z" 
            fill="url(#barkGrad)" 
          />
          {/* Mid Lower Branch */}
          <path 
            d="M 120 230 Q 200 215 280 240 Q 360 270 440 260 Q 370 285 290 265 Q 210 250 135 255 Z" 
            fill="url(#barkHighlight)" 
          />
          {/* Lower Spreading Branch */}
          <path 
            d="M 140 300 Q 220 290 310 325 Q 380 350 450 340 Q 370 365 290 345 Q 210 325 150 320 Z" 
            fill="url(#barkGrad)" 
          />

          {/* Deep Rich Canopy Layers (Foliage Clouds like in the Reference Photo) */}
          
          {/* Layer 1: Deep Crimson & Burnt Amber Base Canopy (Shadows) */}
          <ellipse cx="140" cy="70" rx="90" ry="70" fill="url(#foliageCrimsonAmber)" opacity="0.95" />
          <ellipse cx="260" cy="80" rx="100" ry="75" fill="url(#foliageCrimsonAmber)" opacity="0.92" />
          <ellipse cx="390" cy="95" rx="110" ry="80" fill="url(#foliageCrimsonAmber)" opacity="0.9" />
          <ellipse cx="520" cy="110" rx="95" ry="70" fill="url(#foliageCrimsonAmber)" opacity="0.88" />
          <ellipse cx="320" cy="220" rx="90" ry="65" fill="url(#foliageCrimsonAmber)" opacity="0.9" />
          <ellipse cx="430" cy="240" rx="80" ry="60" fill="url(#foliageCrimsonAmber)" opacity="0.88" />

          {/* Layer 2: Vibrant Fiery Orange & Pumpkin Mid-Canopy */}
          <ellipse cx="110" cy="50" rx="80" ry="65" fill="url(#foliageFieryOrange)" opacity="0.95" />
          <ellipse cx="210" cy="60" rx="90" ry="70" fill="url(#foliageFieryOrange)" opacity="0.96" />
          <ellipse cx="330" cy="70" rx="95" ry="75" fill="url(#foliageFieryOrange)" opacity="0.95" />
          <ellipse cx="460" cy="85" rx="90" ry="70" fill="url(#foliageFieryOrange)" opacity="0.94" />
          <ellipse cx="570" cy="100" rx="80" ry="60" fill="url(#foliageFieryOrange)" opacity="0.92" />
          
          <ellipse cx="260" cy="180" rx="85" ry="60" fill="url(#foliageFieryOrange)" opacity="0.95" />
          <ellipse cx="370" cy="190" rx="85" ry="65" fill="url(#foliageFieryOrange)" opacity="0.95" />
          <ellipse cx="490" cy="205" rx="75" ry="55" fill="url(#foliageFieryOrange)" opacity="0.9" />
          <ellipse cx="320" cy="290" rx="80" ry="55" fill="url(#foliageFieryOrange)" opacity="0.92" />

          {/* Layer 3: Radiant Golden Yellow & Amber Top Highlights (Sunlit Canopy Edge) */}
          <ellipse cx="80" cy="35" rx="65" ry="50" fill="url(#foliageGoldGlow)" opacity="0.96" />
          <ellipse cx="170" cy="30" rx="75" ry="55" fill="url(#foliageSunlitYellow)" opacity="0.98" />
          <ellipse cx="280" cy="40" rx="85" ry="60" fill="url(#foliageGoldGlow)" opacity="0.98" />
          <ellipse cx="400" cy="50" rx="80" ry="55" fill="url(#foliageSunlitYellow)" opacity="0.97" />
          <ellipse cx="510" cy="65" rx="70" ry="50" fill="url(#foliageGoldGlow)" opacity="0.95" />
          <ellipse cx="610" cy="80" rx="60" ry="45" fill="url(#foliageSunlitYellow)" opacity="0.92" />

          <ellipse cx="220" cy="150" rx="65" ry="45" fill="url(#foliageSunlitYellow)" opacity="0.95" />
          <ellipse cx="330" cy="155" rx="70" ry="50" fill="url(#foliageGoldGlow)" opacity="0.96" />
          <ellipse cx="440" cy="165" rx="65" ry="45" fill="url(#foliageSunlitYellow)" opacity="0.94" />
          <ellipse cx="540" cy="180" rx="55" ry="40" fill="url(#foliageGoldGlow)" opacity="0.9" />

          {/* Dappled Leaf Clusters for Organic Textured Silhouette */}
          {[
            { cx: 60, cy: 30, r: 24, c: '#ffba08' },
            { cx: 120, cy: 20, r: 28, c: '#ff7b00' },
            { cx: 190, cy: 15, r: 32, c: '#ffba08' },
            { cx: 250, cy: 25, r: 30, c: '#e85d04' },
            { cx: 320, cy: 30, r: 28, c: '#ffba08' },
            { cx: 380, cy: 25, r: 32, c: '#ff7b00' },
            { cx: 450, cy: 40, r: 26, c: '#ffba08' },
            { cx: 520, cy: 50, r: 28, c: '#dc2f02' },
            { cx: 580, cy: 65, r: 24, c: '#ffba08' },
            { cx: 640, cy: 80, r: 20, c: '#ff7b00' },
            // Lower Cluster Accents
            { cx: 160, cy: 120, r: 22, c: '#ffba08' },
            { cx: 270, cy: 130, r: 26, c: '#ff7b00' },
            { cx: 390, cy: 140, r: 25, c: '#ffba08' },
            { cx: 480, cy: 150, r: 24, c: '#dc2f02' },
            { cx: 560, cy: 165, r: 20, c: '#ffba08' },
            { cx: 280, cy: 250, r: 24, c: '#ff7b00' },
            { cx: 380, cy: 265, r: 22, c: '#ffba08' },
            { cx: 460, cy: 275, r: 20, c: '#dc2f02' },
          ].map((cluster, idx) => (
            <circle 
              key={idx} 
              cx={cluster.cx} 
              cy={cluster.cy} 
              r={cluster.r} 
              fill={cluster.c} 
              opacity="0.9" 
              className="drop-shadow-xs"
            />
          ))}
        </svg>
      </div>

      {/* 3. Secondary Warm Autumn Background Trees for Depth (Right Side) */}
      <div className="hidden md:block absolute -top-8 -right-16 w-[420px] h-[440px] pointer-events-none opacity-55">
        <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Background Tree Trunk */}
          <path d="M 420 0 Q 360 90 310 180 Q 280 260 270 400 L 310 400 Q 320 280 350 200 Q 390 100 440 0 Z" fill="#3d2110" />
          <ellipse cx="280" cy="80" rx="90" ry="70" fill="#dc2f02" opacity="0.8" />
          <ellipse cx="220" cy="95" rx="85" ry="65" fill="#ff7b00" opacity="0.85" />
          <ellipse cx="250" cy="150" rx="90" ry="70" fill="#e85d04" opacity="0.85" />
          <ellipse cx="180" cy="160" rx="75" ry="55" fill="#ffba08" opacity="0.9" />
          <ellipse cx="290" cy="220" rx="80" ry="60" fill="#dc2f02" opacity="0.8" />
        </svg>
      </div>

      {/* 4. Golden Carpet of Autumn Leaves along Bottom Viewport (matching the reference photo) */}
      <div className="absolute bottom-0 left-0 right-0 h-28 sm:h-36 pointer-events-none z-0">
        {/* Soft Golden Ground Carpet Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-amber-400/40 via-orange-300/20 to-transparent" />
        
        {/* Ground Foliage & Leaf Layering */}
        <svg 
          viewBox="0 0 1200 120" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className="absolute bottom-0 w-full h-full opacity-60 preserve-3d"
          preserveAspectRatio="none"
        >
          {/* Base Grass + Leaf Mound */}
          <path d="M 0 120 Q 300 80 600 95 Q 900 75 1200 90 L 1200 120 L 0 120 Z" fill="#b08968" opacity="0.5" />
          <path d="M 0 120 Q 200 90 500 100 Q 800 85 1200 105 L 1200 120 L 0 120 Z" fill="#d4a373" opacity="0.6" />
          <path d="M 0 120 Q 400 95 800 100 Q 1050 90 1200 110 L 1200 120 L 0 120 Z" fill="#e85d04" opacity="0.4" />
          
          {/* Dappled Fallen Leaves on the Ground */}
          {[
            { cx: 80, cy: 105, r: 12, c: '#ff7b00' },
            { cx: 160, cy: 112, r: 9, c: '#ffba08' },
            { cx: 240, cy: 100, r: 14, c: '#dc2f02' },
            { cx: 320, cy: 108, r: 11, c: '#ff7b00' },
            { cx: 410, cy: 114, r: 8, c: '#e85d04' },
            { cx: 500, cy: 104, r: 13, c: '#ffba08' },
            { cx: 590, cy: 110, r: 10, c: '#dc2f02' },
            { cx: 680, cy: 102, r: 12, c: '#ff7b00' },
            { cx: 770, cy: 112, r: 9, c: '#ffba08' },
            { cx: 860, cy: 106, r: 14, c: '#e85d04' },
            { cx: 950, cy: 114, r: 10, c: '#dc2f02' },
            { cx: 1040, cy: 103, r: 13, c: '#ff7b00' },
            { cx: 1130, cy: 110, r: 11, c: '#ffba08' },
          ].map((leaf, idx) => (
            <ellipse key={idx} cx={leaf.cx} cy={leaf.cy} rx={leaf.r * 1.6} ry={leaf.r * 0.7} fill={leaf.c} opacity="0.85" />
          ))}
        </svg>
      </div>

      {/* 5. Smoothly Drifting, Swaying & Twirling Autumn Maple Leaves */}
      {leaves.map((leaf) => (
        <motion.div
          key={leaf.id}
          className="absolute"
          style={{
            width: leaf.size,
            height: leaf.size,
            left: `${leaf.startX}%`,
            top: -40,
          }}
          initial={{
            y: leaf.startY,
            x: 0,
            rotate: leaf.rotationStart,
            opacity: 0,
          }}
          animate={{
            y: ['0vh', '118vh'],
            x: [
              0,
              leaf.swayAmount,
              -leaf.swayAmount,
              leaf.swayAmount * 0.9,
              -leaf.swayAmount * 0.6,
              leaf.swayAmount * 0.3,
              0
            ],
            rotate: [leaf.rotationStart, leaf.rotationEnd],
            opacity: [0, 0.95, 0.95, 0.9, 0.75, 0],
          }}
          transition={{
            duration: leaf.duration,
            repeat: Infinity,
            delay: leaf.delay,
            ease: "easeInOut",
            times: [0, 0.15, 0.35, 0.6, 0.8, 0.95, 1],
          }}
        >
          {renderLeafSvg(leaf.leafType, leaf.color)}
        </motion.div>
      ))}

      {/* 6. Charming Autumn Accent Emojis */}
      <div className="absolute bottom-12 left-10 text-2xl opacity-50 animate-pulse">🍂</div>
      <div className="absolute top-1/3 right-12 text-3xl opacity-45 animate-bounce" style={{ animationDuration: '6s' }}>🍁</div>
      <div className="absolute bottom-28 right-20 text-2xl opacity-40 animate-pulse">🌾</div>
      <div className="absolute top-1/2 left-8 text-xl opacity-35 animate-bounce" style={{ animationDuration: '8s' }}>✨</div>
    </div>
  );
}
