import { motion, AnimatePresence } from 'motion/react';
import { useState, FormEvent } from 'react';
import { AlertCircle, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

interface EgoDeflaterModalProps {
  isOpen: boolean;
  message: string;
  onAcknowledge: () => void;
}

export default function EgoDeflaterModal({ isOpen, message, onAcknowledge }: EgoDeflaterModalProps) {
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const requiredPhrase = "I failed my target and accept the Penguin's tax";

  // Normalize string to ignore smart apostrophes (iOS/Android ’ vs '), double quotes, and multiple spaces
  const normalizePhrase = (str: string) => {
    return str
      .toLowerCase()
      .trim()
      .replace(/[\u2018\u2019\u201A\u201B\u2039\u203A\u0027`']/g, "'") // Normalize all curly/smart apostrophes to standard '
      .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB"]/g, '"')
      .replace(/\s+/g, ' '); // Collapse spaces
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const normalizedInput = normalizePhrase(inputText);
    const normalizedRequired = normalizePhrase(requiredPhrase);

    if (normalizedInput === normalizedRequired) {
      setError('');
      onAcknowledge();
    } else {
      setError("Type the exact humbling phrase to unlock.");
    }
  };

  const handleAutoFill = () => {
    setInputText(requiredPhrase);
    setError('');
  };

  const defaultMsg = "Bunny, you skipped! Your streak is broken. The Penguin is disappointed. Your gym card is suspended, and you are hereby placed in the Penalty Box. Prepare to run!";

  const isMatched = normalizePhrase(inputText) === normalizePhrase(requiredPhrase);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-red-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-neutral-900 border-2 border-red-500 rounded-3xl p-6 max-w-md w-full shadow-2xl text-white relative my-auto"
          id="ego-deflater-container"
        >
          {/* Un-skippable Alert */}
          <div className="flex items-center space-x-3 mb-6 text-red-500 justify-center">
            <ShieldAlert className="w-8 h-8 animate-bounce" />
            <h2 className="text-xl font-sans font-extrabold tracking-wider uppercase">STREAK BROKEN</h2>
          </div>

          <div className="bg-red-950/30 border border-red-900/50 rounded-2xl p-5 mb-6 text-center">
            <span className="text-4xl block mb-3">🥶🐧</span>
            <p className="text-red-200 font-medium leading-relaxed italic text-base">
              "{message || defaultMsg}"
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-xs text-neutral-400 font-mono">
                To acknowledge your failure, type the following humbling statement:
              </p>
              <div className="bg-neutral-950/80 border border-neutral-800 p-3 rounded-xl">
                <span className="text-red-400 font-bold select-all text-xs sm:text-sm font-mono block">
                  "{requiredPhrase}"
                </span>
              </div>
              
              <button
                type="button"
                onClick={handleAutoFill}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer pt-1 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tap here to auto-fill exact phrase</span>
              </button>
            </div>

            <div>
              <div className="relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    setError('');
                  }}
                  placeholder="Type or auto-fill here..."
                  className={`w-full bg-neutral-800 border ${
                    isMatched ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-neutral-700 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                  } rounded-xl px-4 py-3.5 text-center text-sm font-sans text-white placeholder-neutral-500 outline-none transition-all pr-10`}
                  id="ego-deflater-input"
                  autoCapitalize="off"
                  autoCorrect="off"
                />
                {isMatched && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 absolute right-3 top-3.5" />
                )}
              </div>

              {error && (
                <p className="text-xs text-red-400 text-center mt-2 font-medium flex items-center justify-center gap-1 bg-red-950/40 py-1.5 px-3 rounded-lg border border-red-900/40">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> 
                  <span>{error}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className={`w-full py-4 ${
                isMatched ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40' : 'bg-red-600 hover:bg-red-700 shadow-red-900/30'
              } active:scale-[0.98] transition-all text-white font-extrabold rounded-xl text-center shadow-lg cursor-pointer flex items-center justify-center gap-2`}
              id="ego-deflater-submit-btn"
            >
              <span>I ACCEPT MY SLOTHFULNESS</span>
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
