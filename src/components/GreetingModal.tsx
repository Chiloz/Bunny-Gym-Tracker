import { motion } from 'motion/react';
import { Dumbbell, Sparkles, Heart, Zap } from 'lucide-react';

interface GreetingModalProps {
  isOpen: boolean;
  name?: string;
  isSunday?: boolean;
  onClose: () => void;
}

export default function GreetingModal({ isOpen, name = 'Bunny', isSunday = false, onClose }: GreetingModalProps) {
  if (!isOpen) return null;

  const firstName = name ? name.split(' ')[0] : 'Bunny';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" id="greeting-modal-overlay">
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        className="w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl border border-emerald-100 text-center relative overflow-hidden"
      >
        {/* Decorative background glow */}
        <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl ${isSunday ? 'bg-pink-300/40' : 'bg-emerald-300/40'}`} />
        <div className={`absolute -bottom-12 -left-12 w-32 h-32 rounded-full blur-2xl ${isSunday ? 'bg-rose-200/40' : 'bg-teal-200/40'}`} />

        {/* Animated Avatar Icon */}
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-3xl shadow-md border mb-4 relative z-10 ${
            isSunday 
              ? 'bg-gradient-to-tr from-pink-500 to-rose-400 text-white border-pink-200' 
              : 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white border-emerald-200'
          }`}
        >
          {isSunday ? '🌸' : '🐰'}
        </motion.div>

        <h3 className="text-xl font-extrabold text-slate-850 tracking-tight">
          Hi {firstName}! 💕
        </h3>
        <p className="text-sm font-semibold text-slate-500 mt-1">
          Welcome back to your fitness control room!
        </p>

        <div className={`my-5 p-4 rounded-2xl border text-left flex items-start space-x-3 ${
          isSunday 
            ? 'bg-pink-50/80 border-pink-200 text-pink-900' 
            : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
        }`}>
          <div className="p-2 rounded-xl bg-white shadow-xs shrink-0 mt-0.5">
            {isSunday ? <Heart className="w-4 h-4 text-pink-500" /> : <Zap className="w-4 h-4 text-emerald-600" />}
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider">
              {isSunday ? "Sunday Jogging Day! 🏃‍♀️" : "Ready for Gym Today? 💪"}
            </h4>
            <p className="text-xs mt-0.5 opacity-90 leading-relaxed font-medium">
              {isSunday 
                ? "Sunday is for jogging! The theme is White & Pink. Don't forget to post your 10-second start, middle, and finish clips!" 
                : "Consistency is your superpower! Step in, smash your goals, and keep your streak alive."}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className={`w-full py-3.5 rounded-2xl text-xs font-bold text-white shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-95 ${
            isSunday 
              ? 'bg-pink-600 hover:bg-pink-700 shadow-pink-200' 
              : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
          }`}
          id="dismiss-greeting-modal-btn"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isSunday ? "Let's Go For A Jog! 🏃‍♀️" : "Ready For Gym! Let's Go 💪"}</span>
        </button>
      </motion.div>
    </div>
  );
}
