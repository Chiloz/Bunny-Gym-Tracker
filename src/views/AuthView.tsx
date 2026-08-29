import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';

import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, runTransaction } from 'firebase/firestore';
import { Mail, Lock, User, Dumbbell, ShieldAlert } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthViewProps {
  onAuthSuccess: (profile: UserProfile) => void;
}

export default function AuthView({ onAuthSuccess }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Sign in
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Load profile
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          onAuthSuccess(userDoc.data() as UserProfile);
        } else {
          // If no profile, check if they are the admin
          const adminDocRef = doc(db, 'config', 'admin');
          const adminDoc = await getDoc(adminDocRef);
          
          let role: 'admin' | 'user' = 'user';
          if (adminDoc.exists() && adminDoc.data().adminUid === user.uid) {
            role = 'admin';
          }
          
          const newProfile: UserProfile = {
            uid: user.uid,
            name: user.displayName || 'Bunny',
            email: user.email || email,
            role,
            joinedAt: new Date().toISOString(),
            currentStreak: 0,
            highestStreak: 0
          };
          
          await setDoc(userDocRef, newProfile);
          onAuthSuccess(newProfile);
        }
      } else {
        // Sign up
        if (!name.trim()) {
          throw new Error('Name is required for registration.');
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Transaction to register and secure First-In Admin Lockout
        const adminDocRef = doc(db, 'config', 'admin');
        const userDocRef = doc(db, 'users', user.uid);

        let finalProfile: UserProfile | null = null;

        await runTransaction(db, async (transaction) => {
          const adminSnap = await transaction.get(adminDocRef);
          let assignedRole: 'admin' | 'user' = 'user';

          if (!adminSnap.exists() || !adminSnap.data()?.adminUid) {
            // No admin assigned yet! The first registering user becomes permanent admin
            transaction.set(adminDocRef, {
              adminUid: user.uid,
              adminEmail: email,
              assignedAt: new Date().toISOString()
            });
            assignedRole = 'admin';
          }

          finalProfile = {
            uid: user.uid,
            name: name,
            email: email,
            role: assignedRole,
            joinedAt: new Date().toISOString(),
            currentStreak: 0,
            highestStreak: 0
          };

          transaction.set(userDocRef, finalProfile);
        });

        if (finalProfile) {
          onAuthSuccess(finalProfile);
        } else {
          throw new Error('Registration failed, could not save profile.');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50/40 relative flex items-center justify-center p-4 font-sans text-slate-850" id="auth-screen">
      
      {/* Decorative clean ambient nodes */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-teal-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-[32px] shadow-sm border border-emerald-100/60 overflow-hidden relative z-10">
        
        {/* Clean minimal visual header */}
        <div className="p-8 pb-4 text-center relative border-b border-slate-50">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl mx-auto flex items-center justify-center mb-4 border border-emerald-400 shadow-sm overflow-hidden">
            <img src="/icon.svg" alt="Bunny Icon" className="w-full h-full object-cover" />
          </div>
          
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center justify-center gap-1.5" id="auth-app-title">
            <span>Bunny's Gym Record</span>
            <span className="text-lg">🐰</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
            Synchronous Montana-Zambia Fitness Registry
          </p>
        </div>

        {/* Form Container */}
        <div className="p-8 pt-6">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-2xl flex items-start gap-2.5 mb-5 font-semibold">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-400 block uppercase font-bold tracking-wider">Full Name</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 focus:border-emerald-300 focus:bg-white rounded-2xl text-xs outline-none transition-all font-sans text-slate-800 font-medium"
                    id="auth-name-input"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-400 block uppercase font-bold tracking-wider">Email Address</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 focus:border-emerald-300 focus:bg-white rounded-2xl text-xs outline-none transition-all font-sans text-slate-800 font-medium"
                  id="auth-email-input"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-400 block uppercase font-bold tracking-wider">Password</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 focus:border-emerald-300 focus:bg-white rounded-2xl text-xs outline-none transition-all font-sans text-slate-800 font-medium"
                  id="auth-password-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-750 active:scale-[0.98] disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold rounded-2xl transition-all shadow-sm flex items-center justify-center space-x-2 cursor-pointer mt-6 text-xs uppercase tracking-wide"
              id="auth-submit-btn"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>{isLogin ? 'Log In to Profile' : 'Register & Assign Role'}</span>
              )}
            </button>
          </form>

          {/* Toggle Login/Signup */}
          <div className="mt-5 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-750 cursor-pointer"
              id="auth-toggle-btn"
            >
              {isLogin ? "First time? Register here" : "Already have an account? Log In"}
            </button>
          </div>
        </div>

        {/* First-In lockout notice footer */}
        <div className="bg-slate-50 border-t border-slate-100 px-8 py-4 text-center">
          <p className="text-[9px] text-slate-400 font-mono leading-normal font-semibold">
            🛡️ FIRST-IN SECURITY: The first registered account is assigned permanently as the Head Admin. Subsequent accounts are locked as standard users.
          </p>
        </div>
      </div>
    </div>
  );
}
