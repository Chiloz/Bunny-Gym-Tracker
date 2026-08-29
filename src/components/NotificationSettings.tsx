import { useState, useEffect } from 'react';
import { Bell, BellOff, CheckCircle2, AlertCircle, Sparkles, Send } from 'lucide-react';
import { isTargetWorkoutDay } from '../lib/time';

interface NotificationSettingsProps {
  montanaToday: string;
  dailyTip?: string;
}

export default function NotificationSettings({ montanaToday, dailyTip }: NotificationSettingsProps) {
  const [permission, setPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );
  const [testSent, setTestSent] = useState(false);
  const isWorkoutDay = isTargetWorkoutDay(montanaToday);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Browser notifications are not supported in this browser.');
      return;
    }

    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res === 'granted') {
        sendLocalNotification(
          "Notifications Enabled! 🔔",
          isWorkoutDay 
            ? "You'll receive motivational workout reminders on exercise days!" 
            : "Off-Day Rest Active! You'll receive relaxational notifications on rest days."
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const sendLocalNotification = (title: string, body: string) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    try {
      new Notification(title, {
        body,
        icon: '/icon.svg',
        badge: '/icon.svg'
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendTestNotification = () => {
    if (permission !== 'granted') {
      requestPermission();
      return;
    }

    if (isWorkoutDay) {
      sendLocalNotification(
        "🔥 Workout Day Motivation! (2-3x Daily)",
        dailyTip || "Keep grinding Bunny! Step foot in the gym and smash your goals today!"
      );
    } else {
      sendLocalNotification(
        "🌸 Off-Day Relax & Recovery (Rest Day)",
        "Today is your scheduled off-day! Stretch, hydrate, relax, and let your muscles recover!"
      );
    }

    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-2xl ${permission === 'granted' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Push Notifications Hub</h3>
            <p className="text-[11px] text-slate-400">
              {isWorkoutDay ? '🏋️ Exercise Day: 2-3x Motivational Broadcasts' : '🌸 Off-Day: Relaxational Recovery Reminders'}
            </p>
          </div>
        </div>

        <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase ${
          permission === 'granted' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
        }`}>
          {permission === 'granted' ? 'Active 🔔' : 'Disabled 🔕'}
        </span>
      </div>

      <div className="space-y-3">
        {permission !== 'granted' ? (
          <button
            onClick={requestPermission}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-2xl transition-all shadow-md shadow-emerald-100 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span>Enable Push Notifications on Phone</span>
          </button>
        ) : (
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs rounded-2xl flex items-center justify-between">
            <span className="font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              Notifications enabled for this browser
            </span>
            <button
              onClick={handleSendTestNotification}
              className="py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <Send className="w-3 h-3" />
              <span>Test Push</span>
            </button>
          </div>
        )}

        {testSent && (
          <div className="p-2.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1">
            <Sparkles className="w-4 h-4" /> Notification pushed to phone center!
          </div>
        )}
      </div>
    </div>
  );
}
