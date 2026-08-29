import { useState, useEffect, FormEvent } from 'react';
import { Cloud, Check, Save, Sparkles, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';
import { getCloudinaryConfig, saveCloudinaryConfig, CloudinaryConfig } from '../lib/cloudinary';

export default function CloudinaryConfigCard() {
  const [config, setConfig] = useState<CloudinaryConfig>({
    cloudName: '',
    uploadPreset: '',
    enabled: false
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    getCloudinaryConfig().then(c => setConfig(c));
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    try {
      const updated = {
        cloudName: config.cloudName.trim(),
        uploadPreset: config.uploadPreset.trim(),
        enabled: Boolean(config.cloudName.trim() && config.uploadPreset.trim())
      };
      await saveCloudinaryConfig(updated);
      setConfig(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save Cloudinary settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-[32px] p-6 shadow-xs border border-slate-100 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-sky-50 text-sky-600">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Cloudinary Media Server Integration</h3>
            <p className="text-[11px] text-slate-400">
              High-Speed Video & Audio Hosting (Zero CORS / Infinite File Size)
            </p>
          </div>
        </div>

        <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase ${
          config.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
        }`}>
          {config.enabled ? 'Connected ☁️' : 'Optional'}
        </span>
      </div>

      <form onSubmit={handleSave} className="space-y-3.5">
        <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-2xl text-xs text-sky-950 space-y-1.5">
          <div className="font-bold flex items-center gap-1.5 text-sky-900">
            <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
            How to get FREE Cloudinary Credentials (2 Mins):
          </div>
          <ol className="list-decimal list-inside text-[11px] text-sky-800 space-y-1 pl-1">
            <li>Create a free account at <a href="https://cloudinary.com" target="_blank" rel="noreferrer" className="underline font-bold text-sky-900 inline-flex items-center gap-0.5">cloudinary.com <ExternalLink className="w-2.5 h-2.5 inline" /></a></li>
            <li>Copy your <strong>Cloud Name</strong> from your dashboard overview.</li>
            <li>In Cloudinary, go to <strong>Settings ⚙️ &rarr; Upload &rarr; Add Upload Preset</strong>, set Mode to <strong>Unsigned</strong>, and save!</li>
          </ol>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-mono text-slate-400 block uppercase font-bold mb-1">
              Cloud Name
            </label>
            <input
              type="text"
              value={config.cloudName}
              onChange={(e) => setConfig({ ...config, cloudName: e.target.value })}
              placeholder="e.g. dxyz123ab"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-sky-400 focus:bg-white rounded-xl text-xs font-mono text-slate-800 outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 block uppercase font-bold mb-1">
              Unsigned Upload Preset
            </label>
            <input
              type="text"
              value={config.uploadPreset}
              onChange={(e) => setConfig({ ...config, uploadPreset: e.target.value })}
              placeholder="e.g. ml_default or bunny_preset"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-sky-400 focus:bg-white rounded-xl text-xs font-mono text-slate-800 outline-none transition-all"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
          </div>
        )}

        {saved && (
          <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1.5">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" /> Cloudinary Credentials Saved to Firestore! All future video uploads will use Cloudinary CDN!
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 active:scale-95 disabled:bg-slate-200 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save Cloudinary Storage Config</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
