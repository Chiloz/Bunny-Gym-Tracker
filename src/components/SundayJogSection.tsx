import { useState, ChangeEvent } from 'react';
import { motion } from 'motion/react';
import { Upload, Video, CheckCircle2, AlertCircle, Download, Clock, Sparkles } from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { storage, db } from '../lib/firebase';
import { SundayJogLog } from '../types';
import { getCloudinaryConfig, uploadToCloudinary } from '../lib/cloudinary';

interface SundayJogSectionProps {
  uid: string;
  sundayDateStr: string;
  currentJogLog: SundayJogLog | null;
  onLogUpdated: () => void;
}

export default function SundayJogSection({ uid, sundayDateStr, currentJogLog, onLogUpdated }: SundayJogSectionProps) {
  const [uploadingSlot, setUploadingSlot] = useState<'start' | 'middle' | 'finish' | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const handleVideoUpload = async (e: ChangeEvent<HTMLInputElement>, slot: 'start' | 'middle' | 'finish') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    const isVideo = file.type.startsWith('video/') || file.type === '' || file.type === 'application/octet-stream' || /\.(mp4|mov|avi|webm|mkv|3gp|m4v)$/i.test(file.name);
    if (!isVideo) {
      setErrorMsg("Please upload a video clip file (e.g., mp4, mov, webm).");
      return;
    }

    setUploadingSlot(slot);
    setUploadProgress(5);

    // 1. Check if Cloudinary is enabled
    try {
      const cConfig = await getCloudinaryConfig();
      if (cConfig.enabled) {
        const cloudRes = await uploadToCloudinary(
          file, 
          cConfig.cloudName, 
          cConfig.uploadPreset, 
          'auto',
          (pct) => setUploadProgress(pct || 10)
        );
        await saveJogUrl(slot, cloudRes.url, file.name);
        return;
      }
    } catch (cErr: any) {
      console.warn("Cloudinary jog upload failed, trying Firebase Storage:", cErr);
    }

    try {
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `sunday_jogs/${uid}/${sundayDateStr}_${slot}_${Date.now()}_${cleanName}`;
      const videoRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(videoRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(pct || 10);
        },
        async (err) => {
          console.error("Upload error:", err);
          if (file.size <= 700 * 1024) {
            // Small file fallback to DataURL
            const reader = new FileReader();
            reader.onload = async (evt) => {
              const dataUrl = evt.target?.result as string;
              if (dataUrl && dataUrl.length < 900000) {
                await saveJogUrl(slot, dataUrl, file.name);
              } else {
                setErrorMsg(`Storage upload failed (${err.message}). You can also paste a Google Drive/iCloud link using "Paste Link".`);
                setUploadingSlot(null);
              }
            };
            reader.readAsDataURL(file);
          } else {
            setErrorMsg(`Storage upload failed (${err.message}). Please use the "Paste Link" option for videos >1MB.`);
            setUploadingSlot(null);
          }
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            await saveJogUrl(slot, downloadUrl, file.name);
          } catch (e: any) {
            setErrorMsg(`Error getting download link: ${e.message}`);
            setUploadingSlot(null);
          }
        }
      );
    } catch (e: any) {
      console.error(e);
      setErrorMsg(`Failed: ${e.message}`);
      setUploadingSlot(null);
    }
  };

  const saveJogUrl = async (slot: 'start' | 'middle' | 'finish', url: string, name: string) => {
    const sundayObj = new Date(sundayDateStr);
    const expiryObj = new Date(sundayObj);
    expiryObj.setDate(expiryObj.getDate() + 6);
    const expiresAtStr = expiryObj.toISOString().split('T')[0];

    const docRef = doc(db, 'sunday_jogs', `${uid}_${sundayDateStr}`);
    const updatedData: Partial<SundayJogLog> = {
      uid,
      dateStr: sundayDateStr,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAtStr,
      ...(slot === 'start' ? { startUrl: url, startName: name } : {}),
      ...(slot === 'middle' ? { middleUrl: url, middleName: name } : {}),
      ...(slot === 'finish' ? { finishUrl: url, finishName: name } : {}),
    };

    await setDoc(docRef, updatedData, { merge: true });
    setUploadingSlot(null);
    onLogUpdated();
  };

  const slots = [
    { key: 'start' as const, label: '1. Starting Point Clip (10s)', url: currentJogLog?.startUrl, name: currentJogLog?.startName },
    { key: 'middle' as const, label: '2. Midpoint Clip (10s)', url: currentJogLog?.middleUrl, name: currentJogLog?.middleName },
    { key: 'finish' as const, label: '3. Finish Line Clip (10s)', url: currentJogLog?.finishUrl, name: currentJogLog?.finishName },
  ];

  return (
    <div className="bg-white/25 sm:bg-white/30 backdrop-blur-xs rounded-[32px] p-6 shadow-xl border border-white/60 relative overflow-hidden my-6">
      {/* Decorative header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-pink-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white flex items-center justify-center shadow-sm">
            <span className="text-lg">🏃‍♀️</span>
          </div>
          <div>
            <h3 className="text-sm font-black text-stone-950 tracking-tight flex items-center gap-1.5">
              <span>Sunday Jogging Video Hub</span>
              <span className="text-[10px] bg-pink-100 text-pink-900 px-2 py-0.5 rounded-full uppercase font-mono font-black border border-pink-300">Pink Theme</span>
            </h3>
            <p className="text-xs text-pink-950 font-bold mt-0.5">
              Post 10-second video clips of your jog for Penguin's review
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-1 text-xs text-stone-900 font-mono font-black">
          <Clock className="w-3.5 h-3.5 text-pink-600" />
          <span>Auto-clears next Saturday</span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 mb-4 bg-rose-50/90 border border-rose-300 text-rose-950 text-xs rounded-2xl flex items-center space-x-2 font-bold">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 3 Upload slots */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {slots.map((slot) => (
          <div key={slot.key} className="bg-white/40 backdrop-blur-md border border-pink-200 rounded-2xl p-4 flex flex-col justify-between relative shadow-xs">
            <div>
              <span className="text-xs font-black text-stone-950 block mb-1 font-sans">{slot.label}</span>
              {slot.url ? (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center space-x-1.5 text-emerald-700 font-black text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="truncate">{slot.name || 'Video Clip Uploaded'}</span>
                  </div>
                  <video src={slot.url} controls className="w-full h-28 object-cover rounded-xl bg-black shadow-inner" />
                </div>
              ) : (
                <p className="text-[11px] text-pink-950 font-bold mt-1">
                  Record a short 10-second clip showing your location/pace.
                </p>
              )}
            </div>

            <div className="mt-4">
              {uploadingSlot === slot.key ? (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-mono font-black text-pink-900">
                    <span>Uploading Clip...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-pink-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-pink-600 h-full transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              ) : (
                <label className="w-full py-2.5 px-3 bg-white/80 hover:bg-white border border-pink-300 text-pink-900 rounded-xl text-xs font-black flex items-center justify-center space-x-2 cursor-pointer transition-all shadow-xs active:scale-95">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{slot.url ? 'Replace Video Clip' : 'Upload 10s Clip'}</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleVideoUpload(e, slot.key)}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-pink-200 text-[10px] text-pink-950 font-mono font-bold flex items-center justify-between">
        <span>🛡️ Automatic Storage Management: Clips remain accessible until next Saturday before Sunday.</span>
        <span className="font-black uppercase bg-pink-100 text-pink-950 px-2 py-0.5 rounded-md border border-pink-300">10s max clips</span>
      </div>
    </div>
  );
}
