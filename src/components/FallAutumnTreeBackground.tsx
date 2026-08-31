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

const AUTUMN_COLORS = [
  '#d94e1f', // Vibrant maple red-orange
  '#e76f51', // Terracotta orange
  '#f4a261', // Warm pumpkin gold
  '#e9c46a', // Golden harvest yellow
  '#c85a17', // Burnt amber
  '#b02a30', // Deep crimson
  '#e07a5f', // Coral autumn rust
  '#d4a373', // Warm golden sand
];

export default function FallAutumnTreeBackground() {
  // Generate random drifting leaves with organic properties
  const leaves: LeafParticle[] = useMemo(() => {
    const list: LeafParticle[] = [];
    const count = 18; // Balanced density without cluttering
    
    for (let i = 0; i < count; i++) {
      list.push({
        id: i,
        startX: 5 + (i * (90 / count)) + ((i % 3) * 4), // Distributed across width
        startY: -20 - (i * 12),
        size: 14 + (i % 4) * 5, // 14px to 29px
        color: AUTUMN_COLORS[i % AUTUMN_COLORS.length],
        duration: 9 + (i % 5) * 2.5, // 9s to 19s smooth drift
        delay: (i * 0.9) % 10,
        swayAmount: 25 + (i % 4) * 15, // 25px to 70px side-to-side sway
        leafType: i % 4 === 0 ? 'maple' : i % 4 === 1 ? 'oak' : i % 4 === 2 ? 'aspen' : 'birch',
        rotationStart: (i * 45) % 360,
        rotationEnd: (i * 45) + 360 + (i % 2 === 0 ? 180 : -180),
      });
    }
    return list;
  }, []);

  const renderLeafSvg = (type: string, color: string) => {
    if (type === 'maple') {
      return (
        <svg viewBox="0 0 24 24" fill={color} className="w-full h-full drop-shadow-xs">
          <path d="M12 2L13.5 6.5L17.5 5L16.5 9L21 11L18 13.5L20 17.5L15.5 16.5L14 20.5L12 18.5L10 20.5L8.5 16.5L4 17.5L6 13.5L3 11L7.5 9L6.5 5L10.5 6.5L12 2Z" />
          <path d="M12 18.5V23" stroke="#8b4513" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    }
    if (type === 'oak') {
      return (
        <svg viewBox="0 0 24 24" fill={color} className="w-full h-full drop-shadow-xs">
          <path d="M12 2C10 4 7 4 8 7C6 8 5 11 7 13C5 15 6 18 9 19C10 20 11 21 12 22C13 21 14 20 15 19C18 18 19 15 17 13C19 11 18 8 16 7C17 4 14 4 12 2Z" />
          <path d="M12 19V23" stroke="#8b4513" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    }
    if (type === 'aspen') {
      return (
        <svg viewBox="0 0 24 24" fill={color} className="w-full h-full drop-shadow-xs">
          <path d="M12 3C8 6 5 10 6 15C7 19 10 21 12 21C14 21 17 19 18 15C19 10 16 6 12 3Z" />
          <path d="M12 17V22" stroke="#8b4513" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    }
    // Birch
    return (
      <svg viewBox="0 0 24 24" fill={color} className="w-full h-full drop-shadow-xs">
        <path d="M12 2C9 7 6 12 8 17C10 20 12 21 12 21C12 21 14 20 16 17C18 12 15 7 12 2Z" />
        <path d="M12 18V23" stroke="#8b4513" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  };

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none" 
      aria-hidden="true"
      id="fall-autumn-tree-background"
    >
      {/* Background Soft Atmospheric Warm Hue */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-100/30 via-orange-50/20 to-transparent pointer-events-none" />

      {/* Stylized Autumn Tree in Top-Left / Side */}
      <div className="absolute -top-6 -left-12 sm:-left-6 w-80 sm:w-96 md:w-[480px] h-[380px] sm:h-[440px] pointer-events-none opacity-85">
        <svg 
          viewBox="0 0 400 360" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full filter drop-shadow-sm"
        >
          {/* Main Tree Trunk & Branches */}
          <path 
            d="M -20 0 Q 30 60 70 120 Q 90 160 110 220 Q 120 280 130 360 L 95 360 Q 80 270 65 210 Q 40 150 -20 100 Z" 
            fill="#4a2e18" 
          />
          <path 
            d="M 60 110 Q 110 90 170 100 Q 210 110 250 95 Q 210 120 160 120 Q 100 130 60 110 Z" 
            fill="#5c3a21" 
          />
          <path 
            d="M 90 160 Q 140 150 190 170 Q 230 190 270 180 Q 220 200 170 190 Q 120 185 90 160 Z" 
            fill="#4a2e18" 
          />
          <path 
            d="M 40 70 Q 80 40 130 45 Q 170 50 200 40 Q 160 65 120 65 Q 70 70 40 70 Z" 
            fill="#5c3a21" 
          />

          {/* Organic Autumn Canopy Clusters (Warm Red, Orange, Amber, Gold) */}
          {/* Top Main Canopy */}
          <circle cx="90" cy="40" r="55" fill="#d94e1f" opacity="0.9" />
          <circle cx="140" cy="45" r="48" fill="#e76f51" opacity="0.92" />
          <circle cx="180" cy="50" r="40" fill="#f4a261" opacity="0.88" />
          
          {/* Mid Branch Canopy */}
          <circle cx="160" cy="100" r="50" fill="#e76f51" opacity="0.9" />
          <circle cx="210" cy="95" r="42" fill="#e9c46a" opacity="0.9" />
          <circle cx="245" cy="90" r="35" fill="#f4a261" opacity="0.85" />
          <circle cx="120" cy="115" r="45" fill="#d94e1f" opacity="0.92" />
          
          {/* Lower Branch Canopy */}
          <circle cx="180" cy="170" r="44" fill="#c85a17" opacity="0.9" />
          <circle cx="230" cy="180" r="38" fill="#e76f51" opacity="0.88" />
          <circle cx="265" cy="175" r="30" fill="#e9c46a" opacity="0.85" />
          <circle cx="140" cy="180" r="36" fill="#b02a30" opacity="0.9" />

          {/* Leaf Accents & Highlights on Tree */}
          <circle cx="70" cy="55" r="28" fill="#e9c46a" opacity="0.75" />
          <circle cx="195" cy="40" r="24" fill="#d94e1f" opacity="0.8" />
          <circle cx="165" cy="85" r="26" fill="#e9c46a" opacity="0.8" />
          <circle cx="225" cy="105" r="22" fill="#d94e1f" opacity="0.75" />
          <circle cx="240" cy="190" r="20" fill="#f4a261" opacity="0.8" />
        </svg>
      </div>

      {/* Second Subtle Autumn Tree Silhouette in Top-Right Background */}
      <div className="hidden lg:block absolute -top-10 -right-16 w-72 h-80 pointer-events-none opacity-45">
        <svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M 320 0 Q 270 70 230 140 Q 210 200 200 300 L 230 300 Q 240 210 260 150 Q 290 80 320 30 Z" fill="#5c3a21" />
          <circle cx="220" cy="70" r="50" fill="#e9c46a" opacity="0.85" />
          <circle cx="170" cy="80" r="42" fill="#f4a261" opacity="0.8" />
          <circle cx="190" cy="130" r="45" fill="#e76f51" opacity="0.85" />
          <circle cx="140" cy="140" r="35" fill="#d94e1f" opacity="0.75" />
        </svg>
      </div>

      {/* Smoothly Dropping & Swaying Autumn Leaves */}
      {leaves.map((leaf) => (
        <motion.div
          key={leaf.id}
          className="absolute"
          style={{
            width: leaf.size,
            height: leaf.size,
            left: `${leaf.startX}%`,
            top: -30,
          }}
          initial={{
            y: leaf.startY,
            x: 0,
            rotate: leaf.rotationStart,
            opacity: 0,
          }}
          animate={{
            y: ['0vh', '115vh'],
            x: [
              0,
              leaf.swayAmount,
              -leaf.swayAmount,
              leaf.swayAmount * 0.8,
              -leaf.swayAmount * 0.5,
              0
            ],
            rotate: [leaf.rotationStart, leaf.rotationEnd],
            opacity: [0, 0.95, 0.95, 0.9, 0],
          }}
          transition={{
            duration: leaf.duration,
            repeat: Infinity,
            delay: leaf.delay,
            ease: "easeInOut",
            times: [0, 0.2, 0.4, 0.7, 0.9, 1],
          }}
        >
          {renderLeafSvg(leaf.leafType, leaf.color)}
        </motion.div>
      ))}

      {/* Gentle Floating Emoticons for Extra Fall Charm */}
      <div className="absolute bottom-10 left-8 text-2xl opacity-40 animate-pulse">🍂</div>
      <div className="absolute top-1/3 right-10 text-2xl opacity-35 animate-bounce" style={{ animationDuration: '6s' }}>🍁</div>
      <div className="absolute bottom-24 right-16 text-xl opacity-30 animate-pulse">🌾</div>
    </div>
  );
}
