import { useState, useEffect, useId } from 'react';
import { 
  Mail, Send, Clock, Sparkles, RefreshCw, Check, AlertCircle, 
  Eye, Heart, RotateCcw, Smartphone, Monitor, ChevronDown, 
  ChevronUp, ExternalLink, Film, CheckCircle2
} from 'lucide-react';
import { EmailTemplateItem, ScheduledEmailType, SurpriseEmailPayload } from '../types';

interface EmailManagerTabProps {
  recipientEmail: string;
  onUpdateRecipient: (newEmail: string) => Promise<void>;
  onOpenBunnyCheckinPreview?: () => void;
  penguinVideoUrl: string;
  setPenguinVideoUrl: (val: string) => void;
  onSaveVideoUrl: () => Promise<void>;
  isSavingVideo: boolean;
  videoSaveFeedback: string | null;
}

const SURPRISE_PRESETS = [
  {
    label: '💖 Spontaneous Love Note',
    subject: 'Just popping into your inbox to say I love you, Bunny 🐰💖',
    headline: 'Thinking of You This Second! ✨',
    subtitle: 'No reason at all — just a random love dispatch from Penguin',
    badge: 'Surprise Dispatch • Out of the Blue',
    messageText: 'Hey cookie,\n\nI was just sitting here thinking about how incredible you are and how lucky I am to have you in my corner. You bring so much sunshine into my world.\n\nTake a deep breath, drop your shoulders, and smile! Penguin loves you to the moon and back.',
    calloutTitle: '🐧 Penguin\'s Spontaneous Truth',
    calloutContent: 'You are capable of doing hard things and looking completely radiant while doing them!',
    quote: 'Always in your corner, cheering the loudest. Go Bunny!'
  },
  {
    label: '🏆 Proud of Your Hustle',
    subject: 'So proud of your dedication and strength, Bunny! 🏆💪',
    headline: 'You Are Crushing It! 🔥',
    subtitle: 'Penguin sees every bit of work you are putting in',
    badge: 'Coach Recognition • Elite Mindset',
    messageText: 'Bunny, I know building discipline and staying consistent is not easy. Some days feel effortless and other days feel heavy.\n\nI want you to know how proud I am of your commitment. You show up, you try, and you never quit. That grit is rare and beautiful.',
    calloutTitle: '⭐ Daily Victory Medal',
    calloutContent: 'Never forget why you started. Every drop of sweat and every healthy choice is building the strongest, happiest version of you.',
    quote: 'You are stronger than any doubt. Penguin is so proud of you!'
  },
  {
    label: '☕ Afternoon Energy Recharge',
    subject: 'Afternoon Pick-Me-Up for Bunny ☕✨ Shake off any tiredness',
    headline: 'Halfway Through the Day! ☀️',
    subtitle: 'Reset your posture, breathe deep, and finish strong',
    badge: 'Midday Motivation • Energy Boost',
    messageText: 'Hey Bunny!\n\nIf the afternoon slump is creeping in, this is your reminder to stand up, roll your shoulders back, stretch your arms high, and take 3 deep breaths.\n\nYou have accomplished so much already today. Let\'s conquer the rest of this afternoon with style and joy!',
    calloutTitle: '⚡ Quick 60-Second Challenge',
    calloutContent: 'Stand up, shake your hands out, grab a glass of water, and give yourself a little smile in the mirror.',
    quote: 'Go cookie! The finish line of today is close. Keep that rhythm going!'
  }
];

export default function EmailManagerTab({
  recipientEmail,
  onUpdateRecipient,
  onOpenBunnyCheckinPreview,
  penguinVideoUrl,
  setPenguinVideoUrl,
  onSaveVideoUrl,
  isSavingVideo,
  videoSaveFeedback
}: EmailManagerTabProps) {
  const [subTab, setSubTab] = useState<'scheduled' | 'surprise' | 'settings'>('scheduled');
  const [templates, setTemplates] = useState<EmailTemplateItem[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>('morning_6am');
  
  // Custom edited forms
  const [editForms, setEditForms] = useState<Record<string, {
    subject: string;
    headline: string;
    subtitle: string;
    badge: string;
    paragraphsText: string;
    calloutTitle: string;
    calloutContent: string;
    quote: string;
  }>>({});

  // Recipient input
  const [localRecipient, setLocalRecipient] = useState(recipientEmail);
  const [savingRecipient, setSavingRecipient] = useState(false);

  // Sending status
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Scheduler status
  const [scheduleStatus, setScheduleStatus] = useState<any>(null);

  // Preview Modal
  const [previewModal, setPreviewModal] = useState<{
    open: boolean;
    title: string;
    subject: string;
    html: string;
    targetType?: string;
    isSurprise?: boolean;
    deviceMode: 'desktop' | 'mobile';
  } | null>(null);

  // Surprise form
  const [surpriseForm, setSurpriseForm] = useState<SurpriseEmailPayload>({
    subject: SURPRISE_PRESETS[0].subject,
    headline: SURPRISE_PRESETS[0].headline,
    subtitle: SURPRISE_PRESETS[0].subtitle,
    badge: SURPRISE_PRESETS[0].badge,
    messageText: SURPRISE_PRESETS[0].messageText,
    calloutTitle: SURPRISE_PRESETS[0].calloutTitle,
    calloutContent: SURPRISE_PRESETS[0].calloutContent,
    quote: SURPRISE_PRESETS[0].quote,
    includeCheckinLink: false
  });

  // Keep local recipient in sync
  useEffect(() => {
    setLocalRecipient(recipientEmail);
  }, [recipientEmail]);

  // Load email templates
  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch('/api/email-templates');
      const data = await res.json();
      if (data.templates) {
        setTemplates(data.templates);
        
        // Populate edit forms
        const forms: Record<string, any> = {};
        data.templates.forEach((t: EmailTemplateItem) => {
          forms[t.id] = {
            subject: t.customSubject || t.defaultSubject,
            headline: t.customHeadline || t.defaultHeadline,
            subtitle: t.customSubtitle || t.defaultSubtitle,
            badge: t.customBadge || t.defaultBadge,
            paragraphsText: (t.customParagraphs && t.customParagraphs.length > 0)
              ? t.customParagraphs.join('\n\n')
              : t.defaultParagraphs.join('\n\n'),
            calloutTitle: t.customCalloutTitle !== undefined ? t.customCalloutTitle : (t.defaultCalloutTitle || ''),
            calloutContent: t.customCalloutContent !== undefined ? t.customCalloutContent : (t.defaultCalloutContent || ''),
            quote: t.customQuote !== undefined ? t.customQuote : (t.defaultQuote || '')
          };
        });
        setEditForms(forms);
      }
    } catch (e) {
      console.warn('Failed to load email templates:', e);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Load scheduler status
  const loadScheduleStatus = async () => {
    try {
      const res = await fetch('/api/schedule-status');
      const data = await res.json();
      setScheduleStatus(data);
    } catch (e) {
      console.warn('Failed to load schedule status:', e);
    }
  };

  useEffect(() => {
    loadTemplates();
    loadScheduleStatus();
  }, []);

  // Save recipient email
  const handleSaveRecipient = async () => {
    if (!localRecipient || !localRecipient.includes('@')) {
      setActionFeedback({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }
    setSavingRecipient(true);
    try {
      await onUpdateRecipient(localRecipient);
      setActionFeedback({ type: 'success', message: `Recipient updated to ${localRecipient}` });
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (e: any) {
      setActionFeedback({ type: 'error', message: e.message || 'Failed to update recipient.' });
    } finally {
      setSavingRecipient(false);
    }
  };

  // Save custom template override
  const handleSaveTemplateOverride = async (id: ScheduledEmailType) => {
    const form = editForms[id];
    if (!form) return;

    setSendingId(`save_${id}`);
    try {
      const paragraphs = form.paragraphsText.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
      const res = await fetch('/api/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          subject: form.subject,
          headline: form.headline,
          subtitle: form.subtitle,
          badge: form.badge,
          paragraphs,
          calloutTitle: form.calloutTitle,
          calloutContent: form.calloutContent,
          quote: form.quote
        })
      });

      if (!res.ok) throw new Error('Failed to save template');
      
      setActionFeedback({ 
        type: 'success', 
        message: `Saved custom content for this reminder! The next automated dispatch will use this new text.` 
      });
      setTimeout(() => setActionFeedback(null), 5000);
      await loadTemplates();
    } catch (e: any) {
      setActionFeedback({ type: 'error', message: e.message || 'Error saving template' });
    } finally {
      setSendingId(null);
    }
  };

  // Reset template override
  const handleResetTemplate = async (id: ScheduledEmailType) => {
    setSendingId(`reset_${id}`);
    try {
      const res = await fetch('/api/reset-email-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error('Failed to reset template');

      setActionFeedback({ 
        type: 'success', 
        message: `Reset to factory default content!` 
      });
      setTimeout(() => setActionFeedback(null), 4000);
      await loadTemplates();
    } catch (e: any) {
      setActionFeedback({ type: 'error', message: e.message || 'Error resetting template' });
    } finally {
      setSendingId(null);
    }
  };

  // Preview scheduled email
  const handlePreviewScheduled = async (id: ScheduledEmailType) => {
    const form = editForms[id];
    const paragraphs = form?.paragraphsText ? form.paragraphsText.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean) : undefined;
    
    try {
      const res = await fetch('/api/preview-email-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'scheduled',
          type: id,
          appUrl: window.location.origin,
          overrides: form ? {
            subject: form.subject,
            headline: form.headline,
            subtitle: form.subtitle,
            badge: form.badge,
            paragraphs,
            calloutTitle: form.calloutTitle,
            calloutContent: form.calloutContent,
            quote: form.quote
          } : undefined
        })
      });

      const data = await res.json();
      const targetDef = templates.find(t => t.id === id);
      setPreviewModal({
        open: true,
        title: targetDef?.title || 'Scheduled Email Preview',
        subject: data.subject,
        html: data.html,
        targetType: id,
        isSurprise: false,
        deviceMode: 'desktop'
      });
    } catch (e: any) {
      setActionFeedback({ type: 'error', message: 'Failed to generate preview: ' + e.message });
    }
  };

  // Preview surprise email
  const handlePreviewSurprise = async () => {
    try {
      const res = await fetch('/api/preview-email-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'surprise',
          appUrl: window.location.origin,
          surpriseData: surpriseForm
        })
      });

      const data = await res.json();
      setPreviewModal({
        open: true,
        title: 'Surprise Love Note Preview',
        subject: data.subject,
        html: data.html,
        isSurprise: true,
        deviceMode: 'desktop'
      });
    } catch (e: any) {
      setActionFeedback({ type: 'error', message: 'Failed to generate preview: ' + e.message });
    }
  };

  // Dispatch scheduled reminder test now
  const handleSendScheduledTest = async (id: ScheduledEmailType) => {
    setSendingId(`send_${id}`);
    setActionFeedback(null);
    try {
      const res = await fetch('/api/send-scheduled-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: id,
          toEmail: localRecipient,
          appUrl: window.location.origin
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch email');

      setActionFeedback({
        type: 'success',
        message: `Dispatched test email to ${localRecipient}! Check inbox or spam.`
      });
      loadScheduleStatus();
    } catch (e: any) {
      setActionFeedback({ type: 'error', message: e.message || 'Failed to dispatch email' });
    } finally {
      setSendingId(null);
    }
  };

  // Dispatch surprise email now
  const handleSendSurpriseNow = async () => {
    if (!surpriseForm.messageText.trim()) {
      setActionFeedback({ type: 'error', message: 'Please write a message before sending.' });
      return;
    }

    setSendingId('surprise_send');
    setActionFeedback(null);
    try {
      const res = await fetch('/api/send-surprise-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...surpriseForm,
          toEmail: localRecipient,
          appUrl: window.location.origin
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch surprise email');

      setActionFeedback({
        type: 'success',
        message: `Surprise email successfully sent to ${localRecipient}! 💌 Bunny will love it.`
      });
      if (previewModal) setPreviewModal(null);
    } catch (e: any) {
      setActionFeedback({ type: 'error', message: e.message || 'Failed to dispatch surprise email' });
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="space-y-6" id="email-manager-tab-container">
      {/* Top Banner: Status & Quick Info */}
      <div className="bg-[#F4EFE2] border border-[rgba(43,38,32,0.1)] rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#4B6650]/20 text-[#4B6650] flex items-center justify-center shrink-0 shadow-xs">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#2B2620]">Email Dispatch &amp; Scheduler Center</h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Automated • 30s Check
              </span>
            </div>
            <p className="text-xs text-[#6B6255] mt-0.5">
              Deliver to: <span className="font-mono font-bold text-[#2B2620]">{localRecipient}</span> &bull; 
              Sender: <span className="font-mono text-[#2B2620]">josaphatkychiloz@gmail.com</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
          {scheduleStatus?.montanaTime && (
            <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-white border border-[rgba(43,38,32,0.15)] text-[#2B2620]">
              🕒 MT: {scheduleStatus.montanaTime.formattedDate}
            </span>
          )}
          <button
            onClick={() => {
              loadTemplates();
              loadScheduleStatus();
            }}
            className="p-2 rounded-xl bg-white border border-[rgba(43,38,32,0.15)] text-[#6B6255] hover:text-[#2B2620] cursor-pointer transition-all"
            title="Refresh templates and scheduler status"
          >
            <RefreshCw className={`w-4 h-4 ${loadingTemplates ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {actionFeedback && (
        <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 transition-all animate-fadeIn ${
          actionFeedback.type === 'success'
            ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
            : 'bg-rose-50 text-rose-900 border border-rose-300'
        }`}>
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* Secondary Sub-tabs */}
      <div className="flex gap-2 border-b border-[rgba(43,38,32,0.12)] pb-2 overflow-x-auto">
        <button
          onClick={() => setSubTab('scheduled')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            subTab === 'scheduled'
              ? 'bg-[#4B6650] text-white shadow-sm'
              : 'bg-[#F4EFE2] text-[#6B6255] hover:text-[#2B2620]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>4 Automated Emails &amp; Content Editor</span>
        </button>

        <button
          onClick={() => setSubTab('surprise')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            subTab === 'surprise'
              ? 'bg-[#4B6650] text-white shadow-sm'
              : 'bg-[#F4EFE2] text-[#6B6255] hover:text-[#2B2620]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Send Surprise Note Anytime 💌</span>
        </button>

        <button
          onClick={() => setSubTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            subTab === 'settings'
              ? 'bg-[#4B6650] text-white shadow-sm'
              : 'bg-[#F4EFE2] text-[#6B6255] hover:text-[#2B2620]'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Recipient &amp; Celebration Video</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* SUB-TAB 1: 4 AUTOMATED SCHEDULED EMAILS & INLINE EDITOR */}
      {/* ========================================================= */}
      {subTab === 'scheduled' && (
        <div className="space-y-5">
          <div className="bg-[#F4EFE2] border border-[rgba(43,38,32,0.1)] rounded-2xl p-4 text-xs text-[#6B6255] leading-relaxed">
            <p>
              💡 <strong>How Automated Emails Work:</strong> The background scheduler sends these 4 emails at exact Montana local times every day.
              If you customize any email below and click <strong>"Save Custom Content"</strong>, the next automated email will automatically pick up your edits! If you haven't edited anything, it sends the factory default reminder.
            </p>
          </div>

          <div className="space-y-4">
            {templates.map((tpl) => {
              const isExpanded = expandedId === tpl.id;
              const form = editForms[tpl.id] || {
                subject: tpl.defaultSubject,
                headline: tpl.defaultHeadline,
                subtitle: tpl.defaultSubtitle,
                badge: tpl.defaultBadge,
                paragraphsText: tpl.defaultParagraphs.join('\n\n'),
                calloutTitle: tpl.defaultCalloutTitle || '',
                calloutContent: tpl.defaultCalloutContent || '',
                quote: tpl.defaultQuote || ''
              };

              const isSaving = sendingId === `save_${tpl.id}`;
              const isResetting = sendingId === `reset_${tpl.id}`;
              const isSending = sendingId === `send_${tpl.id}`;
              const isSentToday = scheduleStatus?.todaySent?.includes(tpl.id);

              return (
                <div 
                  key={tpl.id}
                  className={`bg-white border rounded-2xl transition-all overflow-hidden ${
                    tpl.isCustomized ? 'border-[#4B6650]/40 shadow-sm' : 'border-[rgba(43,38,32,0.12)]'
                  }`}
                >
                  {/* Card Header */}
                  <div 
                    onClick={() => setExpandedId(isExpanded ? null : tpl.id)}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer hover:bg-[#FBF8F0] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-[#F4EFE2] text-[#2B2620] border border-[rgba(43,38,32,0.15)] shrink-0">
                        {tpl.timeLabel}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#2B2620]">{tpl.title}</h4>
                          {tpl.isCustomized ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#4B6650]/15 text-[#34473A] border border-[#4B6650]/30">
                              Custom Text Active ✨
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              Default Text
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#6B6255] line-clamp-1 mt-0.5">
                          Subject: {form.subject}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {(() => {
                        const schedItem = scheduleStatus?.schedules?.find((s: any) => s.id === tpl.id);
                        const sentAt = schedItem?.sentAt || scheduleStatus?.sentDetails?.[tpl.id]?.sentAtMontana;
                        return (
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 ${
                            isSentToday 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs' 
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {isSentToday ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                                <span>✓ Sent Today {sentAt ? `(${sentAt})` : ''}</span>
                              </>
                            ) : (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                <span>⏳ Pending ({tpl.timeLabel})</span>
                              </>
                            )}
                          </span>
                        );
                      })()}
                      <div className="p-1 rounded-lg text-[#6B6255]">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Card Expanded Content Editor */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 border-t border-[rgba(43,38,32,0.08)] bg-[#FDFCF7] space-y-4">
                      {/* Top quick controls */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[rgba(43,38,32,0.08)]">
                        <div className="text-xs text-[#6B6255]">
                          Editing template: <span className="font-semibold text-[#2B2620]">{tpl.title}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Live Preview Button */}
                          <button
                            type="button"
                            onClick={() => handlePreviewScheduled(tpl.id)}
                            className="px-3 py-1.5 rounded-xl bg-white border border-[rgba(43,38,32,0.18)] text-xs font-semibold text-[#2B2620] hover:bg-[#F4EFE2] flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#4B6650]" />
                            <span>Preview What She Sees</span>
                          </button>

                          {/* Send Test Now Button */}
                          <button
                            type="button"
                            onClick={() => handleSendScheduledTest(tpl.id)}
                            disabled={isSending}
                            className="px-3 py-1.5 rounded-xl bg-white border border-[rgba(43,38,32,0.18)] text-xs font-semibold text-[#2B2620] hover:bg-[#F4EFE2] flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95 disabled:opacity-50"
                          >
                            <Send className="w-3.5 h-3.5 text-[#4B6650]" />
                            <span>{isSending ? 'Dispatching...' : 'Dispatch Test Now ✉️'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Subject Line */}
                      <div>
                        <label className="block text-xs font-bold text-[#2B2620] mb-1">
                          Email Subject Line
                        </label>
                        <input
                          type="text"
                          value={form.subject}
                          onChange={(e) => {
                            setEditForms(prev => ({
                              ...prev,
                              [tpl.id]: { ...prev[tpl.id], subject: e.target.value }
                            }));
                          }}
                          placeholder={tpl.defaultSubject}
                          className="w-full p-2.5 bg-white border border-[rgba(43,38,32,0.15)] rounded-xl text-xs text-[#2B2620] font-medium focus:outline-none focus:border-[#4B6650]"
                        />
                      </div>

                      {/* Headline & Subtitle */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#2B2620] mb-1">
                            Greeting Headline (H1)
                          </label>
                          <input
                            type="text"
                            value={form.headline}
                            onChange={(e) => {
                              setEditForms(prev => ({
                                ...prev,
                                [tpl.id]: { ...prev[tpl.id], headline: e.target.value }
                              }));
                            }}
                            placeholder={tpl.defaultHeadline}
                            className="w-full p-2.5 bg-white border border-[rgba(43,38,32,0.15)] rounded-xl text-xs text-[#2B2620] font-medium focus:outline-none focus:border-[#4B6650]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#2B2620] mb-1">
                            Subtitle / Tagline
                          </label>
                          <input
                            type="text"
                            value={form.subtitle}
                            onChange={(e) => {
                              setEditForms(prev => ({
                                ...prev,
                                [tpl.id]: { ...prev[tpl.id], subtitle: e.target.value }
                              }));
                            }}
                            placeholder={tpl.defaultSubtitle}
                            className="w-full p-2.5 bg-white border border-[rgba(43,38,32,0.15)] rounded-xl text-xs text-[#2B2620] font-medium focus:outline-none focus:border-[#4B6650]"
                          />
                        </div>
                      </div>

                      {/* Message Paragraphs */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-[#2B2620]">
                            Message Body Paragraphs
                          </label>
                          <span className="text-[10px] text-[#6B6255]">
                            Separate paragraphs with a blank line
                          </span>
                        </div>
                        <textarea
                          rows={4}
                          value={form.paragraphsText}
                          onChange={(e) => {
                            setEditForms(prev => ({
                              ...prev,
                              [tpl.id]: { ...prev[tpl.id], paragraphsText: e.target.value }
                            }));
                          }}
                          placeholder={tpl.defaultParagraphs.join('\n\n')}
                          className="w-full p-3 bg-white border border-[rgba(43,38,32,0.15)] rounded-xl text-xs text-[#2B2620] leading-relaxed focus:outline-none focus:border-[#4B6650]"
                        />
                      </div>

                      {/* Callout Box Note */}
                      <div className="p-3.5 bg-[#F4EFE2] border border-[rgba(43,38,32,0.12)] rounded-xl space-y-2.5">
                        <div className="text-xs font-bold text-[#2B2620] flex items-center gap-1.5">
                          <span>✍🏾 Penguin's Callout Highlight Card</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={form.calloutTitle}
                            onChange={(e) => {
                              setEditForms(prev => ({
                                ...prev,
                                [tpl.id]: { ...prev[tpl.id], calloutTitle: e.target.value }
                              }));
                            }}
                            placeholder="e.g. ✍🏾 Crucial Note from Penguin"
                            className="p-2 bg-white border border-[rgba(43,38,32,0.15)] rounded-lg text-xs text-[#2B2620] focus:outline-none focus:border-[#4B6650]"
                          />
                          <input
                            type="text"
                            value={form.calloutContent}
                            onChange={(e) => {
                              setEditForms(prev => ({
                                ...prev,
                                [tpl.id]: { ...prev[tpl.id], calloutContent: e.target.value }
                              }));
                            }}
                            placeholder="e.g. Do NOT forget to have your breakfast its very important"
                            className="sm:col-span-2 p-2 bg-white border border-[rgba(43,38,32,0.15)] rounded-lg text-xs text-[#2B2620] focus:outline-none focus:border-[#4B6650]"
                          />
                        </div>
                      </div>

                      {/* Bottom Cheering Quote */}
                      <div>
                        <label className="block text-xs font-bold text-[#2B2620] mb-1">
                          Closing Cheering Quote / Signoff
                        </label>
                        <input
                          type="text"
                          value={form.quote}
                          onChange={(e) => {
                            setEditForms(prev => ({
                              ...prev,
                              [tpl.id]: { ...prev[tpl.id], quote: e.target.value }
                            }));
                          }}
                          placeholder={tpl.defaultQuote}
                          className="w-full p-2.5 bg-white border border-[rgba(43,38,32,0.15)] rounded-xl text-xs text-[#2B2620] focus:outline-none focus:border-[#4B6650]"
                        />
                      </div>

                      {/* Action Bar */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveTemplateOverride(tpl.id)}
                            disabled={isSaving}
                            className="px-5 py-2 rounded-xl bg-[#4B6650] hover:bg-[#34473A] text-white text-xs font-semibold cursor-pointer shadow-xs transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isSaving ? 'Saving...' : 'Save Custom Content'}</span>
                          </button>

                          {tpl.isCustomized && (
                            <button
                              type="button"
                              onClick={() => handleResetTemplate(tpl.id)}
                              disabled={isResetting}
                              className="px-3.5 py-2 rounded-xl border border-[rgba(43,38,32,0.2)] bg-white text-xs font-semibold text-[#6B6255] hover:text-[#2B2620] cursor-pointer transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>{isResetting ? 'Resetting...' : 'Revert to Default'}</span>
                            </button>
                          )}
                        </div>

                        <span className="text-[11px] text-[#6B6255]">
                          Next scheduled dispatch at: <strong className="text-[#2B2620]">{tpl.timeLabel}</strong>
                        </span>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 2: SEND A SURPRISE NOTE ANYTIME */}
      {/* ========================================================= */}
      {subTab === 'surprise' && (
        <div className="bg-white border border-[rgba(43,38,32,0.12)] rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-[#2B2620]">Spontaneous Surprise Dispatcher 💌</h4>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                Anytime of Day
              </span>
            </div>
            <p className="text-xs text-[#6B6255] mt-1">
              Send Bunny a surprise love letter, motivational boost, or spontaneous cheer right to her inbox whenever you want to brighten her day!
            </p>
          </div>

          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-bold text-[#2B2620] mb-2">
              Quick Inspiration Presets (Click to autofill):
            </label>
            <div className="flex flex-wrap gap-2">
              {SURPRISE_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSurpriseForm(prev => ({
                      ...prev,
                      subject: p.subject,
                      headline: p.headline,
                      subtitle: p.subtitle,
                      badge: p.badge,
                      messageText: p.messageText,
                      calloutTitle: p.calloutTitle,
                      calloutContent: p.calloutContent,
                      quote: p.quote
                    }));
                  }}
                  className="px-3 py-1.5 rounded-xl border border-[rgba(43,38,32,0.18)] bg-[#F4EFE2] hover:bg-[#EAE2D2] text-xs font-semibold text-[#2B2620] transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4 pt-2 border-t border-[rgba(43,38,32,0.08)]">
            <div>
              <label className="block text-xs font-bold text-[#2B2620] mb-1">
                Surprise Email Subject
              </label>
              <input
                type="text"
                value={surpriseForm.subject}
                onChange={(e) => setSurpriseForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="e.g. Just popping into your inbox to say I love you, Bunny 🐰💖"
                className="w-full p-2.5 bg-white border border-[rgba(43,38,32,0.18)] rounded-xl text-xs text-[#2B2620] font-medium focus:outline-none focus:border-[#4B6650]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#2B2620] mb-1">
                  Card Headline (H1)
                </label>
                <input
                  type="text"
                  value={surpriseForm.headline}
                  onChange={(e) => setSurpriseForm(prev => ({ ...prev, headline: e.target.value }))}
                  placeholder="e.g. Thinking of You This Second! ✨"
                  className="w-full p-2.5 bg-white border border-[rgba(43,38,32,0.18)] rounded-xl text-xs text-[#2B2620] font-medium focus:outline-none focus:border-[#4B6650]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B2620] mb-1">
                  Tagline / Subtitle
                </label>
                <input
                  type="text"
                  value={surpriseForm.subtitle || ''}
                  onChange={(e) => setSurpriseForm(prev => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="e.g. A random little love dispatch from Penguin"
                  className="w-full p-2.5 bg-white border border-[rgba(43,38,32,0.18)] rounded-xl text-xs text-[#2B2620] font-medium focus:outline-none focus:border-[#4B6650]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2B2620] mb-1">
                Surprise Message Content
              </label>
              <textarea
                rows={5}
                value={surpriseForm.messageText}
                onChange={(e) => setSurpriseForm(prev => ({ ...prev, messageText: e.target.value }))}
                placeholder="Write your note to Bunny here..."
                className="w-full p-3 bg-white border border-[rgba(43,38,32,0.18)] rounded-xl text-xs text-[#2B2620] leading-relaxed focus:outline-none focus:border-[#4B6650]"
              />
            </div>

            {/* Optional Callout & Quote */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-[#F4EFE2] rounded-xl space-y-2 border border-[rgba(43,38,32,0.1)]">
                <span className="block text-xs font-bold text-[#2B2620]">Highlight Callout Card</span>
                <input
                  type="text"
                  value={surpriseForm.calloutTitle || ''}
                  onChange={(e) => setSurpriseForm(prev => ({ ...prev, calloutTitle: e.target.value }))}
                  placeholder="Callout Title"
                  className="w-full p-2 bg-white border border-[rgba(43,38,32,0.15)] rounded-lg text-xs"
                />
                <input
                  type="text"
                  value={surpriseForm.calloutContent || ''}
                  onChange={(e) => setSurpriseForm(prev => ({ ...prev, calloutContent: e.target.value }))}
                  placeholder="Callout Message"
                  className="w-full p-2 bg-white border border-[rgba(43,38,32,0.15)] rounded-lg text-xs"
                />
              </div>

              <div className="p-3 bg-[#F4EFE2] rounded-xl space-y-2 border border-[rgba(43,38,32,0.1)]">
                <span className="block text-xs font-bold text-[#2B2620]">Closing Cheering Quote</span>
                <input
                  type="text"
                  value={surpriseForm.quote || ''}
                  onChange={(e) => setSurpriseForm(prev => ({ ...prev, quote: e.target.value }))}
                  placeholder="Closing Quote"
                  className="w-full p-2 bg-white border border-[rgba(43,38,32,0.15)] rounded-lg text-xs"
                />
                
                <label className="flex items-center gap-2 pt-1 text-xs text-[#2B2620] cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={Boolean(surpriseForm.includeCheckinLink)}
                    onChange={(e) => setSurpriseForm(prev => ({ ...prev, includeCheckinLink: e.target.checked }))}
                    className="rounded text-[#4B6650] focus:ring-0"
                  />
                  <span>Include direct link to Question Box</span>
                </label>
              </div>
            </div>

            {/* Surprise Action Buttons */}
            <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(43,38,32,0.08)]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePreviewSurprise}
                  className="px-4 py-2.5 rounded-xl bg-white border border-[rgba(43,38,32,0.2)] hover:bg-[#F4EFE2] text-xs font-bold text-[#2B2620] flex items-center gap-2 cursor-pointer shadow-xs transition-all active:scale-95"
                >
                  <Eye className="w-4 h-4 text-[#4B6650]" />
                  <span>Preview Live HTML</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendSurpriseNow}
                  disabled={sendingId === 'surprise_send'}
                  className="px-6 py-2.5 rounded-xl bg-[#4B6650] hover:bg-[#34473A] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-white" />
                  <span>{sendingId === 'surprise_send' ? 'Sending...' : 'Send Surprise Note to Bunny Now 🚀'}</span>
                </button>
              </div>

              <span className="text-xs text-[#6B6255]">
                Delivering directly to: <strong className="text-[#2B2620]">{localRecipient}</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 3: RECIPIENT & CELEBRATION VIDEO CONFIG */}
      {/* ========================================================= */}
      {subTab === 'settings' && (
        <div className="space-y-5">
          {/* Recipient Config */}
          <div className="bg-white border border-[rgba(43,38,32,0.12)] rounded-2xl p-5 space-y-3 shadow-xs">
            <h4 className="text-sm font-bold text-[#2B2620]">Recipient Configuration</h4>
            <p className="text-xs text-[#6B6255]">
              All 4 automated daily reminders and surprise notes are delivered to this mailbox.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <input
                type="email"
                value={localRecipient}
                onChange={(e) => setLocalRecipient(e.target.value)}
                placeholder="spikesam019@gmail.com"
                className="flex-1 bg-[#FBF8F0] border border-[rgba(43,38,32,0.15)] rounded-xl p-3 text-xs text-[#2B2620] font-mono focus:outline-none focus:border-[#4B6650]"
              />
              <button
                type="button"
                onClick={handleSaveRecipient}
                disabled={savingRecipient}
                className="px-5 py-3 rounded-xl bg-[#4B6650] hover:bg-[#34473A] text-white text-xs font-semibold cursor-pointer shadow-xs transition-all shrink-0 disabled:opacity-50"
              >
                {savingRecipient ? 'Saving...' : 'Save Recipient Address'}
              </button>
            </div>
          </div>

          {/* Penguin Video Configuration */}
          <div className="bg-white border border-[rgba(43,38,32,0.12)] rounded-2xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-[#2B2620] flex items-center gap-2">
                <Film className="w-4 h-4 text-[#4B6650]" />
                <span>Penguin Celebration Video (Plays on Completion)</span>
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#4B6650]/15 text-[#34473A]">
                Surprise Celebration
              </span>
            </div>

            <p className="text-xs text-[#6B6255] leading-relaxed">
              When you upload or host your personal video cheering her up, paste the video URL here. 
              As soon as she completes today's Question Box, fireworks will burst and this video will automatically play for her!
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <input
                type="url"
                value={penguinVideoUrl}
                onChange={(e) => setPenguinVideoUrl(e.target.value)}
                placeholder="https://your-domain.com/cheering_video.mp4"
                className="flex-1 bg-[#FBF8F0] border border-[rgba(43,38,32,0.15)] rounded-xl p-3 text-xs text-[#2B2620] font-mono focus:outline-none focus:border-[#4B6650]"
              />
              <button
                type="button"
                onClick={onSaveVideoUrl}
                disabled={isSavingVideo}
                className="px-5 py-3 rounded-xl bg-[#4B6650] hover:bg-[#34473A] text-white text-xs font-semibold cursor-pointer shadow-xs transition-all shrink-0 disabled:opacity-50"
              >
                {isSavingVideo ? 'Saving...' : 'Save Video URL'}
              </button>
            </div>

            {videoSaveFeedback && (
              <div className="text-xs font-semibold text-[#4B6650] bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg">
                {videoSaveFeedback}
              </div>
            )}

            {penguinVideoUrl && (
              <div className="pt-2 border-t border-[rgba(43,38,32,0.08)]">
                <span className="block text-xs font-bold text-[#2B2620] mb-2">Video Preview:</span>
                <div className="max-w-[420px] rounded-xl overflow-hidden border-2 border-[#2B2620] bg-black">
                  <video
                    src={penguinVideoUrl}
                    controls
                    className="w-full aspect-video object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* LIVE EMAIL PREVIEW MODAL (Exact What She Sees Rendering) */}
      {/* ========================================================= */}
      {previewModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 overflow-y-auto p-3 sm:p-6 flex justify-center items-start animate-fadeIn">
          <div className="relative w-full max-w-3xl bg-[#2B2620] rounded-3xl p-4 sm:p-6 shadow-2xl border border-white/10 my-4 text-white space-y-4">
            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    LIVE PREVIEW
                  </span>
                  <h3 className="text-base font-bold text-white">{previewModal.title}</h3>
                </div>
                <p className="text-xs text-stone-300 mt-1">
                  Subject: <strong className="text-amber-300 font-mono">"{previewModal.subject}"</strong>
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                {/* Viewport switcher */}
                <div className="flex items-center bg-stone-800 p-1 rounded-xl border border-stone-700">
                  <button
                    onClick={() => setPreviewModal(prev => prev ? { ...prev, deviceMode: 'desktop' } : null)}
                    className={`p-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      previewModal.deviceMode === 'desktop' ? 'bg-[#4B6650] text-white' : 'text-stone-400 hover:text-white'
                    }`}
                    title="Desktop Preview (540px)"
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewModal(prev => prev ? { ...prev, deviceMode: 'mobile' } : null)}
                    className={`p-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      previewModal.deviceMode === 'mobile' ? 'bg-[#4B6650] text-white' : 'text-stone-400 hover:text-white'
                    }`}
                    title="Mobile Viewport (375px)"
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>

                {/* Send button directly in preview */}
                {previewModal.isSurprise ? (
                  <button
                    onClick={handleSendSurpriseNow}
                    disabled={sendingId === 'surprise_send'}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Surprise Now</span>
                  </button>
                ) : (
                  previewModal.targetType && (
                    <button
                      onClick={() => {
                        handleSendScheduledTest(previewModal.targetType as ScheduledEmailType);
                        setPreviewModal(null);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send This Test Now</span>
                    </button>
                  )
                )}

                {/* Close */}
                <button
                  onClick={() => setPreviewModal(null)}
                  className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold cursor-pointer transition-all"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Email client chrome simulation */}
            <div className="bg-stone-900/80 rounded-xl p-3 text-xs space-y-1 font-mono text-stone-300 border border-stone-800">
              <div className="flex gap-2">
                <span className="text-stone-500 w-16">From:</span>
                <span className="text-emerald-400 font-bold">Penguin Coach 🐧 &lt;josaphatkychiloz@gmail.com&gt;</span>
              </div>
              <div className="flex gap-2">
                <span className="text-stone-500 w-16">To:</span>
                <span className="text-amber-200">Bunny 🐰 &lt;{localRecipient}&gt;</span>
              </div>
              <div className="flex gap-2">
                <span className="text-stone-500 w-16">Subject:</span>
                <span className="text-white font-bold">{previewModal.subject}</span>
              </div>
            </div>

            {/* Rendered iframe */}
            <div className="flex justify-center bg-[#241F1A] p-4 rounded-2xl border border-stone-800 overflow-x-auto min-h-[500px]">
              <iframe
                title="Email Preview"
                srcDoc={previewModal.html}
                style={{
                  width: previewModal.deviceMode === 'desktop' ? '560px' : '375px',
                  height: '620px',
                  border: 'none',
                  borderRadius: '16px',
                  backgroundColor: '#F4EFE2',
                  transition: 'width 0.2s ease-in-out'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
