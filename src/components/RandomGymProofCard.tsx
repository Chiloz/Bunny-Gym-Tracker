import { useState, ChangeEvent } from 'react';
import { Camera, Video, Upload, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { storage, db } from '../lib/firebase';
import { GymProof } from '../types';
import { getCloudinaryConfig, uploadToCloudinary } from '../lib/cloudinary';

interface RandomGymProofCardProps {
  uid: string;
  dateStr: string;
  existingProof: GymProof | null;
  onProofUploaded: () => void;
}

export default function RandomGymProofCard({ uid, dateStr, existingProof, onProofUploaded }: RandomGymProofCardProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [pastedLink, setPastedLink] = useState('');

  const saveProofDoc = async (url: string, fileType: 'image' | 'video', fileName: string) => {
    const proofData: GymProof = {
      uid,
      dateStr,
      fileUrl: url,
      fileType,
      fileName,
      uploadedAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'gym_proofs', `${uid}_${dateStr}`), proofData);
    setUploading(false);
    onProofUploaded();
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|heic|webp|gif)$/i.test(file.name);
    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|avi|webm|mkv|3gp)$/i.test(file.name) || file.type === '';

    if (!isImage && !isVideo) {
      setErrorMsg("Please upload an image or video file.");
      return;
    }

    setUploading(true);
    setProgress(5);

    // 1. Check if Cloudinary is active
    try {
      const cConfig = await getCloudinaryConfig();
      if (cConfig.enabled) {
        const cloudRes = await uploadToCloudinary(
          file, 
          cConfig.cloudName, 
          cConfig.uploadPreset, 
          'auto',
          (pct) => setProgress(pct || 10)
        );
        await saveProofDoc(cloudRes.url, isImage ? 'image' : 'video', file.name);
        return;
      }
    } catch (cErr: any) {
      console.warn("Cloudinary gym proof upload failed, trying Firebase Storage:", cErr);
    }

    try {
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `gym_proofs/${uid}/${dateStr}_${Date.now()}_${cleanName}`;
      const proofRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(proofRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setProgress(pct || 10);
        },
        async (err) => {
          console.error("Upload error:", err);
          if (file.size <= 700 * 1024) {
            const reader = new FileReader();
            reader.onload = async (evt) => {
              const dataUrl = evt.target?.result as string;
              if (dataUrl && dataUrl.length < 950000) {
                await saveProofDoc(dataUrl, isImage ? 'image' : 'video', file.name);
              } else {
                setErrorMsg(`Storage upload failed (${err.message}). Click "Paste Link" to attach a share link.`);
                setUploading(false);
              }
            };
            reader.readAsDataURL(file);
          } else {
            setErrorMsg(`Storage upload error (${err.message}). Click "Paste Link" below to attach Google Drive/iCloud link!`);
            setUploading(false);
          }
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            await saveProofDoc(downloadUrl, isImage ? 'image' : 'video', file.name);
          } catch (e: any) {
            setErrorMsg(`Error: ${e.message}`);
            setUploading(false);
          }
        }
      );
    } catch (e: any) {
      console.error(e);
      setErrorMsg(`Failed: ${e.message}`);
      setUploading(false);
    }
  };

  const handleSavePastedLink = async () => {
    if (!pastedLink.trim()) return;
    try {
      setUploading(true);
      await saveProofDoc(pastedLink.trim(), 'video', 'Pasted Media Link');
      setPastedLink('');
      setShowLinkInput(false);
    } catch (e: any) {
      setErrorMsg(`Error saving link: ${e.message}`);
      setUploading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 rounded-[32px] p-6 shadow-sm border border-amber-200/80 my-5 relative overflow-hidden">
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
          <Camera className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-amber-950 flex items-center gap-1.5">
            <span>Random Gym Verification Day! ⚡</span>
            <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full uppercase font-mono font-bold">Admin Spot Check</span>
          </h3>
          <p className="text-xs text-amber-800 font-medium mt-0.5">
            Penguin requested a quick gym photo or 30s video proof today!
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {existingProof ? (
        <div className="p-4 bg-white/80 rounded-2xl border border-amber-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Proof Uploaded for Today!
            </span>
            <span className="text-[10px] font-mono text-slate-400">{existingProof.fileName}</span>
          </div>

          {existingProof.fileType === 'image' ? (
            <img src={existingProof.fileUrl} alt="Gym Proof" className="w-full h-40 object-cover rounded-xl shadow-xs" />
          ) : (
            <video src={existingProof.fileUrl} controls className="w-full h-40 object-cover rounded-xl bg-black shadow-xs" />
          )}
        </div>
      ) : (
        <div className="mt-3">
          {uploading ? (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono font-bold text-amber-800">
                <span>Uploading Proof...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-amber-200 h-2.5 rounded-full overflow-hidden">
                <div className="bg-amber-600 h-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {!showLinkInput ? (
                <div className="flex items-center space-x-2">
                  <label className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-sm shadow-amber-200">
                    <Upload className="w-4 h-4" />
                    <span>Upload Photo/Video File</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={() => setShowLinkInput(true)}
                    className="py-3 px-3 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer"
                  >
                    🔗 Paste Link
                  </button>
                </div>
              ) : (
                <div className="space-y-2 bg-white/90 p-3 rounded-2xl border border-amber-300">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-amber-900 uppercase">Paste Google Drive / YouTube / iCloud Link</span>
                    <button onClick={() => setShowLinkInput(false)} className="text-[10px] text-slate-400 font-bold">Cancel</button>
                  </div>
                  <input
                    type="url"
                    value={pastedLink}
                    onChange={(e) => setPastedLink(e.target.value)}
                    placeholder="https://drive.google.com/file/d/... or YouTube / iCloud link"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-amber-400 rounded-xl text-xs text-slate-800"
                  />
                  <button
                    onClick={handleSavePastedLink}
                    disabled={!pastedLink.trim()}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Save Media Link
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
