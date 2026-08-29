import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface Bunny {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  bounceHeight: number;
}

export default function BouncingBunnies() {
  const [bunnies, setBunnies] = useState<Bunny[]>([]);

  useEffect(() => {
    // Generate some randomized bunnies
    const list: Bunny[] = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: Math.random() * 90 + 5, // percentage
      y: Math.random() * 60 + 30, // percentage
      size: Math.random() * 20 + 16, // px size
      duration: Math.random() * 1.5 + 1.2, // seconds
      delay: Math.random() * 2,
      bounceHeight: Math.random() * 80 + 50, // px
    }));
    setBunnies(list);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {bunnies.map((bunny) => (
        <motion.div
          key={bunny.id}
          className="absolute text-center select-none"
          style={{
            left: `${bunny.x}%`,
            top: `${bunny.y}%`,
            fontSize: `${bunny.size}px`,
          }}
          animate={{
            y: [0, -bunny.bounceHeight, 0],
            rotate: [0, -8, 8, 0],
            scaleY: [1, 0.8, 1.1, 1],
          }}
          transition={{
            duration: bunny.duration,
            delay: bunny.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="flex flex-col items-center">
            <span>🐰</span>
            <span className="text-[6px] opacity-30 mt-[-2px] tracking-widest font-mono text-emerald-800">
              bounce
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
