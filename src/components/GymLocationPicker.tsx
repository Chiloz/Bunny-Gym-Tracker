import { useState } from 'react';
import { MapPin, ShieldCheck, Navigation, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { GymLocation } from '../types';

interface GymLocationPickerProps {
  currentGymLocation?: GymLocation;
  onSaveGymLocation: (location: GymLocation) => Promise<void>;
}

// Calculate distance in meters between two lat/lng points using Haversine formula
function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
}

export default function GymLocationPicker({ currentGymLocation, onSaveGymLocation }: GymLocationPickerProps) {
  const [addressInput, setAddressInput] = useState(currentGymLocation?.address || '');
  const [locating, setLocating] = useState(false);
  const [checkingArrival, setCheckingArrival] = useState(false);
  const [arrivalMessage, setArrivalMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleDetectCurrentLocation = () => {
    if (!navigator.geolocation) {
      setArrivalMessage({ type: 'error', text: 'Geolocation is not supported by your browser.' });
      return;
    }

    setLocating(true);
    setArrivalMessage(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation: GymLocation = {
          lat: latitude,
          lng: longitude,
          address: addressInput.trim() || `Gym Coordinates (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
        };

        await onSaveGymLocation(newLocation);
        setLocating(false);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      },
      (err) => {
        console.error(err);
        setLocating(false);
        setArrivalMessage({ type: 'error', text: 'Could not fetch location. Please ensure location permissions are granted.' });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleVerifyGymArrival = () => {
    if (!currentGymLocation) {
      setArrivalMessage({ type: 'error', text: 'Please set your Gym Location first in settings below!' });
      return;
    }

    if (!navigator.geolocation) {
      setArrivalMessage({ type: 'error', text: 'Geolocation is not supported by your browser.' });
      return;
    }

    setCheckingArrival(true);
    setArrivalMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const distanceMeters = getHaversineDistance(
          latitude,
          longitude,
          currentGymLocation.lat,
          currentGymLocation.lng
        );

        setCheckingArrival(false);

        if (distanceMeters <= 250) {
          setArrivalMessage({
            type: 'success',
            text: `🎉 Welcome to the Gym! You are within ${Math.round(distanceMeters)}m of your saved gym location. Ready for today's challenge!`
          });

          // Also trigger browser push notification if supported
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification("Gym Arrival Confirmed! 🏋️‍♀️", {
              body: "You've arrived at the gym! Today's challenge is ready for you, Bunny!",
              icon: "https://api.iconify.design/lucide:dumbbell.svg?color=%23059669"
            });
          }
        } else {
          setArrivalMessage({
            type: 'info',
            text: `📍 You are currently ${Math.round(distanceMeters)} meters away from your saved gym. Step closer to trigger gym arrival bonuses!`
          });
        }
      },
      (err) => {
        console.error(err);
        setCheckingArrival(false);
        setArrivalMessage({ type: 'error', text: 'Location access failed. Please enable location permissions.' });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
          <MapPin className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Gym Geofence & Location</h3>
          <p className="text-xs text-slate-400">Set gym coordinates for automatic arrival check-ins</p>
        </div>
      </div>

      {/* Privacy Notice Card */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs rounded-2xl flex items-start space-x-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-extrabold uppercase tracking-wide block text-[11px]">Strict Privacy Guarantee</span>
          <p className="leading-relaxed font-medium text-emerald-800">
            This app ONLY checks your location on active gym days and ONLY looks specifically for your saved gym location. All other locations and off-days are completely off-limits and private.
          </p>
        </div>
      </div>

      {/* Arrival check button */}
      <div className="pt-2">
        <button
          onClick={handleVerifyGymArrival}
          disabled={checkingArrival}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-2xl transition-all shadow-md shadow-emerald-100 flex items-center justify-center space-x-2 cursor-pointer"
        >
          <Navigation className="w-4 h-4 animate-bounce" />
          <span>{checkingArrival ? 'Checking Geofence Coordinates...' : 'Verify Gym Arrival 📍'}</span>
        </button>

        {arrivalMessage && (
          <div className={`mt-3 p-3.5 rounded-2xl text-xs font-semibold flex items-center space-x-2 ${
            arrivalMessage.type === 'success' ? 'bg-emerald-50 border border-emerald-300 text-emerald-800' :
            arrivalMessage.type === 'info' ? 'bg-sky-50 border border-sky-200 text-sky-800' :
            'bg-rose-50 border border-rose-200 text-rose-800'
          }`}>
            {arrivalMessage.type === 'success' ? <Sparkles className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{arrivalMessage.text}</span>
          </div>
        )}
      </div>

      {/* Location Input & Set */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <label className="text-xs font-bold uppercase text-slate-400 tracking-wider block font-mono">
          Enter Gym Location / Address Name
        </label>
        
        <div className="space-y-2">
          <input
            type="text"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            placeholder="e.g. Olympic Gym, Kabulonga, Lusaka"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-emerald-500 font-medium"
          />

          <button
            onClick={handleDetectCurrentLocation}
            disabled={locating}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
          >
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>{locating ? 'Detecting GPS Location...' : '📍 Save Current GPS as Gym Location'}</span>
          </button>
        </div>

        {currentGymLocation && (
          <div className="p-3 bg-slate-50 rounded-xl text-[11px] font-mono text-slate-500 flex justify-between items-center">
            <span>Saved: {currentGymLocation.address}</span>
            <span className="text-emerald-600 font-bold">({currentGymLocation.lat.toFixed(3)}, {currentGymLocation.lng.toFixed(3)})</span>
          </div>
        )}

        {savedSuccess && (
          <div className="text-center text-xs font-bold text-emerald-600 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Gym Location Saved Successfully!
          </div>
        )}
      </div>
    </div>
  );
}
