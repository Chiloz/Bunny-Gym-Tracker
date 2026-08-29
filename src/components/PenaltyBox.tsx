import { useState, ChangeEvent } from 'react';
import { motion } from 'motion/react';

import { 
  Upload, Check, Play, Lock, AlertOctagon, 
  Film, Navigation, Compass, Landmark, RefreshCw, Dumbbell, Flame, Link2, X
} from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, db } from '../lib/firebase';
import { Penalty } from '../types';
import { getCloudinaryConfig, uploadToCloudinary } from '../lib/cloudinary';

interface PenaltyBoxProps {
  penalty: Penalty;
  onRefresh: () => void;
  isPreviewMode?: boolean;
  onExitPreview?: () => void;
}

interface UploadProgress {
  [key: string]: number; // field name -> progress percentage
}

export default function PenaltyBox({ penalty, onRefresh, isPreviewMode, onExitPreview }: PenaltyBoxProps) {
  const [progress, setProgress] = useState<UploadProgress>({});
  const [loadingField, setLoadingField] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  
  // Link input state for pasting shared video/photo URLs
  const [linkSlot, setLinkSlot] = useState<{ id: string; nameField: string; title: string } | null>(null);
  const [pastedUrl, setPastedUrl] = useState<string>('');

  const isOutdoorRun = penalty.taskDescription?.toLowerCase().includes('outdoor') || penalty.taskDescription?.toLowerCase().includes('outward') || penalty.taskDescription?.toLowerCase().includes('2 km');

  const outdoorSlots = [
    {
      id: 'outwardStartUrl',
      nameField: 'outwardStartName',
      title: '1. Outward: Start of Run',
      description: '1-min video or photo showing start of outward run.',
      icon: Navigation,
      category: 'Outward Journey'
    },
    {
      id: 'outwardMiddleUrl',
      nameField: 'outwardMiddleName',
      title: '2. Outward: Midpoint',
      description: '1-min video or photo showing midpoint distance.',
      icon: Compass,
      category: 'Outward Journey'
    },
    {
      id: 'outwardEndUrl',
      nameField: 'outwardEndName',
      title: '3. Outward: Turnaround',
      description: '1-min video or photo showing 1 KM (0.62 Mi) turnaround.',
      icon: Landmark,
      category: 'Outward Journey'
    },
    {
      id: 'returnStartUrl',
      nameField: 'returnStartName',
      title: '4. Return: Start Journey',
      description: '1-min video or photo starting return trip.',
      icon: Navigation,
      category: 'Return Journey Home'
    },
    {
      id: 'returnMiddleUrl',
      nameField: 'returnMiddleName',
      title: '5. Return: Midpoint',
      description: '1-min video or photo on return midpoint.',
      icon: Compass,
      category: 'Return Journey Home'
    },
    {
      id: 'returnEndUrl',
      nameField: 'returnEndName',
      title: '6. Return: Finish Line',
      description: '1-min video or photo finished safe at home.',
      icon: Landmark,
      category: 'Return Journey Home'
    }
  ];

  const gymSlots = [
    {
      id: 'outwardStartUrl',
      nameField: 'outwardStartName',
      title: '1. Workout Start Proof',
      description: 'Video clip or photo showing start of exercise routine.',
      icon: Dumbbell,
      category: 'Workout Execution'
    },
    {
      id: 'outwardMiddleUrl',
      nameField: 'outwardMiddleName',
      title: '2. In-Progress Proof',
      description: 'Video clip or photo mid-workout (sweat/rep count).',
      icon: Flame,
      category: 'Workout Execution'
    },
    {
      id: 'outwardEndUrl',
      nameField: 'outwardEndName',
      title: '3. Workout Completion / Display Proof',
      description: 'Photo/video of machine screen (treadmill/bike/watch) or finish pose.',
      icon: Check,
      category: 'Workout Execution'
    }
  ];

  const uploadSlots = isOutdoorRun ? outdoorSlots : gymSlots;

  // Flexible check for media files (video/image) even if mobile browser MIME type is empty or generic
  const isMediaFile = (file: File) => {
    if (!file) return false;
    if (file.type.startsWith('video/') || file.type.startsWith('image/')) return true;
    const name = file.name.toLowerCase();
    const mediaExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.3gp', '.webm', '.m4v', '.jpg', '.jpeg', '.png', '.heic', '.webp', '.gif'];
    return mediaExtensions.some(ext => name.endsWith(ext)) || file.type === '' || file.type === 'application/octet-stream';
  };

  // Save reference directly to Firestore
  const saveProofReference = async (fieldId: string, nameField: string, url: string, fileName: string) => {
    const penaltyDocRef = doc(db, 'penalties', penalty.id);
    await updateDoc(penaltyDocRef, {
      [fieldId]: url,
      [nameField]: fileName
    });
    setLoadingField(null);
    onRefresh();
  };

  const handleFileUpload = async (fieldId: string, nameField: string, file: File) => {
    if (!file) return;
    
    // Check if it's a video or image file
    if (!isMediaFile(file)) {
      setError('Invalid file format. Please select a video or image file.');
      return;
    }

    setError('');
    setLoadingField(fieldId);
    setProgress((prev) => ({ ...prev, [fieldId]: 5 }));

    // 1. Check if Cloudinary integration is active
    try {
      const cConfig = await getCloudinaryConfig();
      if (cConfig.enabled) {
        const cloudRes = await uploadToCloudinary(
          file, 
          cConfig.cloudName, 
          cConfig.uploadPreset, 
          'auto',
          (pct) => setProgress((prev) => ({ ...prev, [fieldId]: pct || 10 }))
        );
        await saveProofReference(fieldId, nameField, cloudRes.url, file.name);
        return;
      }
    } catch (cErr: any) {
      console.warn("Cloudinary upload failed, falling back to Firebase Storage:", cErr);
    }
    
    // 2. Sanitize filename for storage ref
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageRef = ref(storage, `penalties/${penalty.id}/${fieldId}_${Date.now()}_${cleanFileName}`);
    
    try {
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setProgress((prev) => ({ ...prev, [fieldId]: percent || 10 }));
        },
        async (err) => {
          console.warn("Storage upload failed, attempting fallback...", err);
          
          // Safe Fallback: Only convert small photos/files (<700KB) to Data URL to respect Firestore's 1MB doc limit
          if (file.size <= 700 * 1024) {
            try {
              setProgress((prev) => ({ ...prev, [fieldId]: 50 }));
              const reader = new FileReader();
              reader.onload = async (e) => {
                const dataUrl = e.target?.result as string;
                if (dataUrl && dataUrl.length < 950000) {
                  await saveProofReference(fieldId, nameField, dataUrl, file.name);
                } else {
                  setError(`Storage error: ${err.message}. Please use the "Paste Link" button below to link a video/photo (Google Drive, iCloud, etc.).`);
                  setLoadingField(null);
                }
              };
              reader.readAsDataURL(file);
            } catch (fallbackErr: any) {
              setError(`Upload failed: ${err.message}. Please use "Paste Link" below.`);
              setLoadingField(null);
            }
          } else {
            setError(`Upload error: ${err.message}. For large videos/files (>700KB), please click "Paste Link" below to attach a Google Drive, iCloud, or YouTube link.`);
            setLoadingField(null);
          }
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            await saveProofReference(fieldId, nameField, downloadUrl, file.name);
          } catch (e: any) {
            setError(`Saving reference failed: ${e.message}`);
            setLoadingField(null);
          }
        }
      );
    } catch (err: any) {
      console.error("Direct storage error", err);
      // Fallback to FileReader DataURL
      if (file.size <= 12 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const dataUrl = e.target?.result as string;
          if (dataUrl) {
            await saveProofReference(fieldId, nameField, dataUrl, file.name);
          }
        };
        reader.readAsDataURL(file);
      } else {
        setError(`Storage connection failed: ${err.message}. Try the "Paste Link" option.`);
        setLoadingField(null);
      }
    }
  };

  const handleSavePastedUrl = async () => {
    if (!linkSlot || !pastedUrl.trim()) return;
    try {
      setLoadingField(linkSlot.id);
      setError('');
      let cleanUrl = pastedUrl.trim();
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = 'https://' + cleanUrl;
      }
      await saveProofReference(linkSlot.id, linkSlot.nameField, cleanUrl, 'Shared Proof Link');
      setLinkSlot(null);
      setPastedUrl('');
    } catch (e: any) {
      setError(`Failed to save link: ${e.message}`);
      setLoadingField(null);
    }
  };

  const handleFileChange = (fieldId: string, nameField: string) => (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(fieldId, nameField, e.target.files[0]);
    }
  };

  const allUploaded = uploadSlots.every(slot => !!(penalty as any)[slot.id]);

  const handleSubmitProof = async () => {
    if (!allUploaded) return;
    try {
      const penaltyDocRef = doc(db, 'penalties', penalty.id);
      await updateDoc(penaltyDocRef, {
        status: 'submitted'
      });
      onRefresh();
    } catch (e: any) {
      setError(`Submission failed: ${e.message}`);
    }
  };

  const getSlotUrl = (fieldId: string) => (penalty as any)[fieldId];
  const getSlotName = (nameField: string) => (penalty as any)[nameField];

  return (
    <div className="min-h-screen bg-rose-50/40 relative flex flex-col font-sans text-slate-800" id="penalty-box-view">
      
      {/* Top Preview Banner when viewed from Admin */}
      {isPreviewMode && (
        <div className="bg-slate-900 text-white px-6 py-2.5 text-xs font-bold font-mono flex items-center justify-between sticky top-0 z-50 shadow-md border-b border-rose-500/40">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="tracking-wide">🚨 PREVIEW MODE: Bunny is currently locked in Penalty Mode (Admin View)</span>
          </div>
          {onExitPreview && (
            <button 
              onClick={onExitPreview}
              className="px-3.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-bold cursor-pointer transition-all active:scale-95 shadow-xs"
            >
              Exit Preview ✕
            </button>
          )}
        </div>
      )}

      {/* Premium sticky warning header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-rose-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-30 shadow-sm" id="penalty-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-200 animate-pulse">
            <AlertOctagon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-rose-900">Bunny’s App Lockdown</h1>
            <p className="text-[10px] font-semibold text-rose-600 uppercase tracking-widest">Active Gym Tax Penalty Verification</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-rose-100 text-rose-700 text-[10px] rounded-full font-mono font-bold uppercase tracking-wider border border-rose-200">
            TAX PENDING
          </span>
          <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] rounded-full font-mono font-bold uppercase tracking-wider">
            Zambia Node
          </span>
        </div>
      </header>

      {/* Main 12-Column Responsive Grid */}
      <main className="flex-1 p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 w-full max-w-7xl mx-auto relative z-10">
        
        {/* Left Side: Challenge Instructions & Penalty Details (col-span-5) */}
        <section className="col-span-12 md:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-rose-100/60 space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-rose-600 tracking-widest block uppercase font-bold">
                Assigned Task from Penguin Admin
              </span>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 leading-snug">
                {penalty.taskDescription || "Run 5 Kilometers and upload GPS timeline segments + video proof of start, middle, and end."}
              </h2>
            </div>

            <hr className="border-rose-50" />

            <div className="space-y-4">
              <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-bold text-rose-800 uppercase tracking-wider font-mono">Impenetrable Lockout Rules</p>
                <p className="text-xs text-rose-700 leading-relaxed">
                  Montana-Zambia synchronous contract is in active breach. Every calendar day has permanently locked. To reactivate the record, you must supply video proof of completion. No text description is valid.
                </p>
              </div>

              <div className="flex justify-between items-center text-xs p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-bold font-mono">CHALLENGE ID</span>
                <span className="font-mono text-slate-600 font-bold">{penalty.id.slice(0, 8).toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Supportive guidance illustration mock */}
          <div className="bg-emerald-900 rounded-[32px] p-6 text-white overflow-hidden relative shadow-lg">
            <div className="absolute right-[-20px] bottom-[-20px] text-white/5 text-9xl font-black select-none pointer-events-none">
              RUN
            </div>
            <div className="relative z-10 space-y-2">
              <span className="text-[9px] font-mono tracking-widest text-emerald-300 block uppercase font-bold">Encouragement Engine</span>
              <p className="text-sm font-semibold">"Come on Bunny! You smashed your highest streak of target days. Pay the penalty tax, clear your record, and build it up even bigger!"</p>
            </div>
          </div>
        </section>

        {/* Right Side: Step-by-Step Proof Upload Panels (col-span-7) */}
        <section className="col-span-12 md:col-span-7 flex flex-col gap-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs text-center font-bold">
              {error}
            </div>
          )}

          {penalty.status === 'submitted' ? (
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-rose-100 flex-1 flex flex-col justify-center items-center text-center space-y-4 min-h-[400px]">
              <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center text-amber-600 animate-pulse">
                <Film className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wider">
                Proof Pending Review
              </h3>
              <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
                Bunny, you have successfully uploaded all 6 video segments! Your proof has been submitted to the Admin in Zambia for rigorous inspection.
              </p>
              <div className="text-xs bg-amber-50 text-amber-700 font-mono px-4 py-2 rounded-full border border-amber-200 font-bold">
                Waiting for Approval
              </div>
              <button 
                onClick={onRefresh}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all flex items-center space-x-2 text-xs font-bold cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-slate-500 animate-spin" />
                <span>Check Status</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-rose-100/60 flex flex-col justify-between space-y-6 flex-1">
              
              {/* Auto-Approval Notice */}
              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-center justify-between text-amber-900 text-[11px] font-medium">
                <span>⏱️ <strong>Auto-Approval at Reset:</strong> If Penguin is away, your submitted proofs will automatically clear at daily reset!</span>
              </div>

              <div className="space-y-6">
                {/* Phase 1 or Gym Proofs */}
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 px-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <h3 className="text-xs font-mono font-bold text-rose-600 uppercase tracking-wider">
                      {isOutdoorRun ? 'Phase 1: Outward Journey Run (3 clips)' : 'Required Workout Verification Proofs'}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {(isOutdoorRun ? uploadSlots.slice(0, 3) : uploadSlots).map((slot) => {
                      const url = getSlotUrl(slot.id);
                      const name = getSlotName(slot.nameField);
                      const isUploading = loadingField === slot.id;
                      const pct = progress[slot.id] || 0;

                      return (
                        <div 
                          key={slot.id} 
                          className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                            <div className={`p-2.5 rounded-xl ${url ? 'bg-emerald-50 border border-emerald-200 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                              <slot.icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate">{slot.title}</h4>
                              <p className="text-[11px] text-slate-400 truncate">{name || slot.description}</p>
                            </div>
                          </div>

                          <div className="ml-4 flex items-center shrink-0">
                            {url ? (
                              <div className="flex items-center space-x-2">
                                <a 
                                  href={url} 
                                  target="_blank" 
                                  rel="referrer noopener"
                                  className="p-2 bg-slate-100 hover:bg-slate-200 text-emerald-600 rounded-xl transition-colors cursor-pointer"
                                >
                                  <Play className="w-3.5 h-3.5 fill-emerald-600" />
                                </a>
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                  <Check className="w-3.5 h-3.5" />
                                </div>
                              </div>
                            ) : isUploading ? (
                              <div className="flex flex-col items-end space-y-1">
                                <span className="text-[10px] font-mono text-rose-600 animate-pulse">
                                  Uploading {pct}%
                                </span>
                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                  <div className="h-full bg-rose-500 transition-all duration-300" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <label className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl transition-all cursor-pointer flex items-center space-x-1 text-xs font-bold active:scale-95">
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>Upload</span>
                                  <input 
                                    type="file" 
                                    accept="video/*,image/*" 
                                    className="hidden" 
                                    onChange={handleFileChange(slot.id, slot.nameField)}
                                    disabled={!!loadingField}
                                  />
                                </label>
                                
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLinkSlot({ id: slot.id, nameField: slot.nameField, title: slot.title });
                                    setPastedUrl('');
                                  }}
                                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl transition-all cursor-pointer flex items-center space-x-1 text-xs font-bold active:scale-95"
                                  title="Paste shared link (Google Drive, iCloud, YouTube, etc.)"
                                >
                                  <Link2 className="w-3.5 h-3.5 text-slate-500" />
                                  <span className="hidden sm:inline">Link</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Return Journey (Only for Outdoor Run) */}
                {isOutdoorRun && (
                  <div className="space-y-3.5">
                    <div className="flex items-center gap-2 px-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      <h3 className="text-xs font-mono font-bold text-rose-600 uppercase tracking-wider">
                        Phase 2: Return Journey Home (3 clips)
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {uploadSlots.slice(3).map((slot) => {
                        const url = getSlotUrl(slot.id);
                        const name = getSlotName(slot.nameField);
                        const isUploading = loadingField === slot.id;
                        const pct = progress[slot.id] || 0;

                        return (
                          <div 
                            key={slot.id} 
                            className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                              <div className={`p-2.5 rounded-xl ${url ? 'bg-emerald-50 border border-emerald-200 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                                <slot.icon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate">{slot.title}</h4>
                                <p className="text-[11px] text-slate-400 truncate">{name || slot.description}</p>
                              </div>
                            </div>

                            <div className="ml-4 flex items-center shrink-0">
                              {url ? (
                                <div className="flex items-center space-x-2">
                                  <a 
                                    href={url} 
                                    target="_blank" 
                                    rel="referrer noopener"
                                    className="p-2 bg-slate-100 hover:bg-slate-200 text-emerald-600 rounded-xl transition-colors cursor-pointer"
                                  >
                                    <Play className="w-3.5 h-3.5 fill-emerald-600" />
                                  </a>
                                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                    <Check className="w-3.5 h-3.5" />
                                  </div>
                                </div>
                              ) : isUploading ? (
                                <div className="flex flex-col items-end space-y-1">
                                  <span className="text-[10px] font-mono text-rose-600 animate-pulse">
                                    Uploading {pct}%
                                  </span>
                                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                    <div className="h-full bg-rose-500 transition-all duration-300" style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <label className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl transition-all cursor-pointer flex items-center space-x-1 text-xs font-bold active:scale-95">
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>Upload</span>
                                    <input 
                                      type="file" 
                                      accept="video/*,image/*" 
                                      className="hidden" 
                                      onChange={handleFileChange(slot.id, slot.nameField)}
                                      disabled={!!loadingField}
                                    />
                                  </label>
                                  
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setLinkSlot({ id: slot.id, nameField: slot.nameField, title: slot.title });
                                      setPastedUrl('');
                                    }}
                                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl transition-all cursor-pointer flex items-center space-x-1 text-xs font-bold active:scale-95"
                                    title="Paste shared link (Google Drive, iCloud, YouTube, etc.)"
                                  >
                                    <Link2 className="w-3.5 h-3.5 text-slate-500" />
                                    <span className="hidden sm:inline">Link</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Submission Unlock Trigger */}
              <motion.button
                onClick={handleSubmitProof}
                disabled={!allUploaded}
                whileTap={allUploaded ? { scale: 0.98 } : {}}
                className={`w-full py-4 rounded-2xl text-center font-bold tracking-wide uppercase transition-all shadow-md text-sm cursor-pointer ${
                  allUploaded 
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 animate-pulse' 
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
                id="submit-penalty-proof-btn"
              >
                {allUploaded ? 'Submit Proof to Penguin' : 'Upload All 6 Videos to Submit'}
              </motion.button>
            </div>
          )}
        </section>
      </main>

      {/* Footer Mini Banner */}
      <footer className="h-8 bg-rose-900 flex items-center justify-center mt-auto shrink-0" id="penalty-footer">
        <span className="text-[10px] font-bold text-rose-300 tracking-[0.2em] uppercase">VERIFY TO REGAIN FULL SYSTEM ACCESS</span>
      </footer>

      {/* Modal for Pasting Video / Proof Link */}
      {linkSlot && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Link2 className="w-5 h-5 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-800">Paste Video or Proof Link</h3>
              </div>
              <button 
                onClick={() => setLinkSlot(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700">{linkSlot.title}</p>
              <p className="text-[11px] text-slate-500">
                Paste a link to your recorded video or photo (e.g., Google Drive, iCloud, YouTube, Streamable, Loom, or direct file link).
              </p>
            </div>

            <div className="space-y-1">
              <input
                type="url"
                value={pastedUrl}
                onChange={(e) => setPastedUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl text-xs text-slate-800 font-mono outline-none"
                autoFocus
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setLinkSlot(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePastedUrl}
                disabled={!pastedUrl.trim() || !!loadingField}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                {loadingField ? 'Saving...' : 'Save Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
