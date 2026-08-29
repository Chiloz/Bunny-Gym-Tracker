import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { UserProfile } from './types';

import AuthView from './views/AuthView';
import BunnyDashboard from './views/BunnyDashboard';
import PenguinAdmin from './views/PenguinAdmin';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Fetch user profile from Firestore
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          } else {
            // Profile doesn't exist yet, we'll wait for AuthView to create it
            setProfile(null);
          }
        } catch (e) {
          console.error("Failed to load user profile:", e);
          setProfile(null);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = (newProfile: UserProfile) => {
    setProfile(newProfile);
    setUser(auth.currentUser);
  };

  const handleLogout = () => {
    setUser(null);
    setProfile(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-16 h-16 relative">
          <div className="w-16 h-16 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
          <span className="absolute inset-0 flex items-center justify-center text-xl select-none">🐰</span>
        </div>
        <h2 className="text-sm font-bold text-emerald-800 tracking-wider uppercase mt-4 animate-pulse">
          Bunny's Control Room
        </h2>
        <p className="text-xs text-neutral-400 mt-1">Connecting securely to Gym Database...</p>
      </div>
    );
  }

  // If not logged in, show Auth Screen
  if (!user || !profile) {
    return <AuthView onAuthSuccess={handleAuthSuccess} />;
  }

  // If logged in, route by role
  if (profile.role === 'admin') {
    return <PenguinAdmin profile={profile} onLogout={handleLogout} />;
  }

  return <BunnyDashboard profile={profile} onLogout={handleLogout} />;
}

