import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { HelpCircle, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { QuizConfig } from '../types';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  quizConfig: QuizConfig;
}

export default function QuizModal({ isOpen, onClose, onConfirm, quizConfig }: QuizModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  if (!isOpen) return null;

  const handleYes = () => {
    setStep(2);
  };

  const handleProceed = () => {
    setStep(3);
  };

  const handleConfirm = () => {
    onConfirm();
    setStep(1); // reset for next time
    onClose();
  };

  const handleCancel = () => {
    setStep(1);
    onClose();
  };

  const q1 = quizConfig.q1 || "Did you step foot in the gym today and complete your planned session?";
  const q2 = quizConfig.q2 || "Are you absolutely sure you gave it 100% and aren't cheating yourself?";
  const q3 = quizConfig.q3 || "WARNING: Once confirmed, this day is permanently locked green. There are no takebacks. Confirm workout?";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-emerald-100 flex flex-col"
          id="quiz-modal-container"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <HelpCircle className="w-6 h-6 animate-pulse" />
              <h3 className="font-sans font-bold text-lg tracking-tight">Psychological Workout Quiz</h3>
            </div>
            <button 
              onClick={handleCancel}
              className="p-1 hover:bg-white/15 rounded-full transition-colors cursor-pointer"
              id="close-quiz-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-emerald-50 h-1.5 flex">
            <div className={`h-full bg-emerald-500 transition-all duration-300 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`} />
          </div>

          {/* Content */}
          <div className="p-8 flex-1 flex flex-col">
            <div className="flex justify-center mb-6">
              {step === 1 && (
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              )}
              {step === 2 && (
                <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center text-teal-500">
                  <HelpCircle className="w-8 h-8" />
                </div>
              )}
              {step === 3 && (
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 animate-bounce">
                  <AlertTriangle className="w-8 h-8" />
                </div>
              )}
            </div>

            <div className="text-center mb-8 min-h-[80px] flex items-center justify-center">
              {step === 1 && (
                <p className="text-gray-700 font-medium text-lg leading-relaxed">{q1}</p>
              )}
              {step === 2 && (
                <p className="text-gray-700 font-medium text-lg leading-relaxed">{q2}</p>
              )}
              {step === 3 && (
                <p className="text-rose-600 font-extrabold text-xl leading-relaxed tracking-tight uppercase">
                  {q3}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col space-y-3 mt-auto">
              {step === 1 && (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleYes}
                    className="py-3.5 px-5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold rounded-2xl transition-all shadow-md shadow-emerald-200 cursor-pointer text-center"
                    id="quiz-q1-yes"
                  >
                    Yes, I Smashed It!
                  </button>
                  <button
                    onClick={handleCancel}
                    className="py-3.5 px-5 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] text-gray-700 font-bold rounded-2xl transition-all cursor-pointer text-center"
                    id="quiz-q1-no"
                  >
                    No
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleProceed}
                    className="py-3.5 px-5 bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white font-bold rounded-2xl transition-all shadow-md shadow-teal-200 cursor-pointer text-center"
                    id="quiz-q2-proceed"
                  >
                    Proceed honestly
                  </button>
                  <button
                    onClick={handleCancel}
                    className="py-3.5 px-5 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] text-gray-700 font-bold rounded-2xl transition-all cursor-pointer text-center"
                    id="quiz-q2-cancel"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col space-y-3">
                  <button
                    onClick={handleConfirm}
                    className="py-4 px-6 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-extrabold text-lg rounded-2xl transition-all shadow-lg shadow-rose-200 cursor-pointer text-center animate-pulse"
                    id="quiz-q3-confirm"
                  >
                    CONFIRM & LOCK GREEN
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="py-3 px-5 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] text-gray-700 font-bold rounded-2xl transition-all cursor-pointer text-center"
                    id="quiz-q3-back"
                  >
                    Go Back
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
