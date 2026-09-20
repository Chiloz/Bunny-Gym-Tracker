import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Gmail credentials provided by user
const GMAIL_USER = process.env.GMAIL_USER || 'josaphatkychiloz@gmail.com';
const GMAIL_APP_PASSWORD = (process.env.GMAIL_APP_PASSWORD || 'fphc gcou jvtv rmjg').replace(/\s+/g, '');
let RECIPIENT_EMAIL = 'spikesam019@gmail.com';

function getTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // SSL
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD
    }
  });
}

function getMontanaTimeInfo() {
  const now = new Date();
  const formatterDate = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Denver',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatterDate.formatToParts(now);
  const year = parts.find(p => p.type === 'year')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const day = parts.find(p => p.type === 'day')?.value || '';
  const dateStr = `${year}-${month}-${day}`;

  const dayOfWeek = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Denver',
    weekday: 'long'
  }).format(now);

  const hourStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Denver',
    hour: 'numeric',
    hour12: false
  }).format(now);

  const minuteStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Denver',
    minute: 'numeric'
  }).format(now);

  const timeString = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Denver',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(now);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Denver',
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(now);

  const isTargetDay = ['Tuesday', 'Wednesday', 'Friday', 'Saturday', 'Sunday'].includes(dayOfWeek);

  return {
    dateStr,
    dayOfWeek,
    currentHour: parseInt(hourStr, 10),
    currentMinute: parseInt(minuteStr, 10),
    timeString,
    formattedDate,
    isTargetDay
  };
}

// Track sent status per date
// Structure: { [dateStr]: Set<string> }
const sentScheduledReminders: Record<string, Set<string>> = {};

// -------------------------------------------------------------
// VINTAGE EMAIL TEMPLATE BUILDER
// -------------------------------------------------------------
function buildVintageEmailHtml(options: {
  headline: string;
  badge: string;
  subtitle: string;
  bodyParagraphs: string[];
  calloutBox?: { title: string; content: string };
  button?: { text: string; link: string };
  quote?: string;
  dateFormatted: string;
}) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${options.headline}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F4EFE2;
      font-family: 'Courier New', Courier, 'Special Elite', Georgia, serif;
      color: #2B2620;
    }
    .wrapper {
      max-width: 560px;
      margin: 28px auto;
      background: #FBF8F0;
      border: 2px solid #2B2620;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 6px 6px 0px rgba(43, 38, 32, 0.25);
    }
    .vintage-top-bar {
      background-color: #2B2620;
      color: #F4EFE2;
      padding: 12px 24px;
      font-size: 11px;
      letter-spacing: 2px;
      text-transform: uppercase;
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #2B2620;
    }
    .header {
      background: #4B6650;
      border-bottom: 2px dashed #2B2620;
      padding: 28px 24px;
      text-align: center;
      color: #FFFFFF;
      position: relative;
    }
    .stamp-badge {
      display: inline-block;
      border: 2px dashed #F4EFE2;
      color: #F4EFE2;
      padding: 4px 14px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-bottom: 12px;
      border-radius: 4px;
    }
    .header h1 {
      margin: 0;
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: #FBF8F0;
    }
    .header p {
      margin: 8px 0 0;
      font-size: 13px;
      color: #DDE8D8;
      font-style: italic;
    }
    .body-content {
      padding: 30px 26px;
      line-height: 1.7;
    }
    .greeting {
      font-size: 19px;
      font-weight: 700;
      font-family: Georgia, serif;
      color: #2B2620;
      margin-bottom: 14px;
    }
    .paragraph {
      font-size: 14.5px;
      color: #38322B;
      margin-bottom: 18px;
    }
    .callout-card {
      background: #F4EFE2;
      border: 1.5px solid #2B2620;
      border-radius: 6px;
      padding: 16px 20px;
      margin: 22px 0;
      box-shadow: 3px 3px 0px rgba(43, 38, 32, 0.15);
    }
    .callout-title {
      font-weight: 700;
      font-size: 13.5px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #2B2620;
      margin-bottom: 6px;
      display: block;
    }
    .callout-content {
      font-size: 14px;
      color: #4A4237;
      line-height: 1.6;
    }
    .btn-container {
      text-align: center;
      margin: 28px 0 16px;
    }
    .btn-vintage {
      display: inline-block;
      background-color: #2B2620;
      color: #FBF8F0 !important;
      text-decoration: none;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 1px;
      padding: 14px 28px;
      border-radius: 6px;
      border: 2px solid #2B2620;
      box-shadow: 4px 4px 0px #4B6650;
      text-transform: uppercase;
    }
    .vintage-quote {
      border-top: 1px solid rgba(43,38,32,0.18);
      border-bottom: 1px solid rgba(43,38,32,0.18);
      padding: 14px 10px;
      margin: 24px 0;
      text-align: center;
      font-style: italic;
      color: #4B6650;
      font-weight: 600;
      font-size: 14px;
    }
    .fallback-box {
      background: #FFFFFF;
      border: 1px dashed rgba(43, 38, 32, 0.25);
      border-radius: 6px;
      padding: 12px 16px;
      font-size: 11.5px;
      color: #6B6255;
      word-break: break-all;
      margin-top: 20px;
    }
    .footer {
      border-top: 2px solid #2B2620;
      padding: 18px 22px;
      text-align: center;
      font-size: 12px;
      color: #6B6255;
      background: #F4EFE2;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="vintage-top-bar">
      <span>★ DISPATCH FROM PENGUIN ★</span>
      <span>${options.dateFormatted}</span>
    </div>

    <div class="header">
      <div class="stamp-badge">${options.badge}</div>
      <h1>${options.headline}</h1>
      <p>${options.subtitle}</p>
    </div>

    <div class="body-content">
      <div class="greeting">Dearest Bunny,</div>

      ${options.bodyParagraphs.map(p => `<p class="paragraph">${p}</p>`).join('')}

      ${options.calloutBox ? `
      <div class="callout-card">
        <span class="callout-title">${options.calloutBox.title}</span>
        <div class="callout-content">${options.calloutBox.content}</div>
      </div>
      ` : ''}

      ${options.button ? `
      <div class="btn-container">
        <a href="${options.button.link}" class="btn-vintage" target="_blank">
          ${options.button.text}
        </a>
      </div>
      ` : ''}

      ${options.quote ? `
      <div class="vintage-quote">
        "${options.quote}"
      </div>
      ` : ''}

      ${options.button ? `
      <div class="fallback-box">
        Direct link: <a href="${options.button.link}" style="color: #4B6650;">${options.button.link}</a>
      </div>
      ` : ''}
    </div>

    <div class="footer">
      Sent with boundless love from Penguin 🐧 to Bunny 🐰 &bull; Montana Postal Routine
    </div>
  </div>
</body>
</html>
  `;
}

// -------------------------------------------------------------
// DYNAMIC EMAIL TEMPLATES (Defaults + Coach Overrides)
// -------------------------------------------------------------
interface ScheduledTemplateDef {
  id: 'morning_6am' | 'hydrated_1pm' | 'movement_4pm' | 'checkin_930pm';
  timeLabel: string;
  title: string;
  defaultSubject: string;
  defaultHeadline: string;
  defaultBadge: string;
  defaultSubtitle: string;
  defaultParagraphs: string[];
  defaultCalloutTitle?: string;
  defaultCalloutContent?: string;
  defaultQuote?: string;
  hasCheckinLink?: boolean;
}

const DEFAULT_SCHEDULED_TEMPLATES: Record<string, ScheduledTemplateDef> = {
  morning_6am: {
    id: 'morning_6am',
    timeLabel: '06:00 AM MT',
    title: 'Morning Routine & Breakfast',
    defaultSubject: 'Rise & Shine, Bunny! 🌅 Jumping Jacks, Squats & Breakfast Time 🍳',
    defaultHeadline: 'Rise & Shine, Bunny!',
    defaultBadge: '06:00 AM • Morning Routine',
    defaultSubtitle: 'Ignite your fire for the brand new day',
    defaultParagraphs: [
      'Good morning, cookie! The sun is up, and it is time to feel alive and fill your body with radiant energy before the world gets busy.',
      'Drop what you are doing for just 3 minutes right now: give me 20 jumping jacks and 15 deep, intentional bodyweight squats! Get that blood flowing through your veins so you feel awake, unstoppable, and vibrant as you start your day.'
    ],
    defaultCalloutTitle: '✍🏾 Crucial Note from Penguin',
    defaultCalloutContent: 'Do NOT forget to have your breakfast — it is very important! Fuel your body with good nutrition this morning. You need that stamina and energy!',
    defaultQuote: 'Go Bunny, go! Penguin is so proud of you already this morning. Make today count!'
  },
  hydrated_1pm: {
    id: 'hydrated_1pm',
    timeLabel: '01:00 PM MT',
    title: 'Midday Hydration Alert',
    defaultSubject: 'Hydration Check, Bunny! 💧 Sip some cool water',
    defaultHeadline: 'Hydration Check 💧',
    defaultBadge: '01:00 PM • Midday Renewal',
    defaultSubtitle: 'Keep your body crisp, clear, and glowing',
    defaultParagraphs: [
      'Hey cookie, it is 1:00 PM! Pause for a second and check in on yourself.',
      'Have you had enough water today? Grab a tall, cold glass of water right now and take some long, refreshing sips. Hydration is key to keeping your energy smooth, your focus sharp, and your muscles happy.'
    ],
    defaultCalloutTitle: "💧 Penguin's Hydration Target",
    defaultCalloutContent: 'Take at least 5 big sips right this second. Keep a water bottle near your desk or bag so you can sip through the afternoon.',
    defaultQuote: 'You are doing amazing today, cookie! Stay hydrated and keep that smile glowing.'
  },
  movement_4pm: {
    id: 'movement_4pm',
    timeLabel: '04:00 PM MT',
    title: 'Movement & Gym Check',
    defaultSubject: '4:00 PM Movement Time, Bunny! 🏃‍♀️ Light exercise or Gym day',
    defaultHeadline: 'Movement & Gym Time Awaits! 🤸‍♀️',
    defaultBadge: '04:00 PM • Movement Alert',
    defaultSubtitle: 'Lace up those shoes — let\'s keep that body active',
    defaultParagraphs: [
      'Hey Bunny, 4:00 PM has arrived! Time for our afternoon workout check.',
      'If today is gym day on your schedule: pack your water bottle, grab your gym gear, and get ready to hit the gym. If today is rest day: take 15 to 20 minutes for some light exercises like a breezy jog, squats, jumping jacks, or light home workouts to keep your energy high!'
    ],
    defaultCalloutTitle: '✨ Penguin\'s Movement Mission',
    defaultCalloutContent: 'Show up, be present in each movement, and don\'t rush. Consistency is your superpower and Penguin is cheering you on every step of the way!',
    defaultQuote: 'Go cookie! Consistency is your secret weapon, and Penguin is cheering so loud for you!'
  },
  checkin_930pm: {
    id: 'checkin_930pm',
    timeLabel: '09:30 PM MT',
    title: 'The Main Event: Question Box',
    defaultSubject: 'The Main Event 💌 Today\'s Question Box is Ready for You, Bunny!',
    defaultHeadline: 'The Main Event 💌',
    defaultBadge: '09:30 PM • Question Box',
    defaultSubtitle: 'Two quick minutes on paper for your coach',
    defaultParagraphs: [
      'The day is wrapping up, and it is time for the main event — today\'s Question Box page!',
      'Click the button below to open today\'s journal. Tell me about your meals, your movement, your water, your evening energy, and anything on your heart. Remember: nothing but the truth, even if it was a tired or messy day.'
    ],
    defaultCalloutTitle: '📜 Today\'s Pledge',
    defaultCalloutContent: 'Remember: This log goes straight to Penguin\'s desk. It is not judged, just tracked with care.',
    defaultQuote: 'Go Bunny, Penguin is so proud of you! Sleep like a champion tonight. 🐧❤️',
    hasCheckinLink: true
  }
};

const TEMPLATES_FILE = path.join(process.cwd(), 'email-template-overrides.json');
let templateOverrides: Record<string, any> = {};

function loadTemplateOverrides() {
  try {
    if (fs.existsSync(TEMPLATES_FILE)) {
      const raw = fs.readFileSync(TEMPLATES_FILE, 'utf-8');
      templateOverrides = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Could not read email template overrides file:', e);
  }
}

function saveTemplateOverrides() {
  try {
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templateOverrides, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not write email template overrides file:', e);
  }
}

loadTemplateOverrides();

function getMergedTemplate(type: string, dynamicParams?: { checkinLink?: string; dateFormatted?: string }) {
  const def = DEFAULT_SCHEDULED_TEMPLATES[type] || DEFAULT_SCHEDULED_TEMPLATES.checkin_930pm;
  const custom = templateOverrides[type] || {};

  const subject = custom.subject?.trim() || def.defaultSubject;
  const headline = custom.headline?.trim() || def.defaultHeadline;
  const badge = custom.badge?.trim() || def.defaultBadge;
  const subtitle = custom.subtitle?.trim() || def.defaultSubtitle;
  const bodyParagraphs = (Array.isArray(custom.paragraphs) && custom.paragraphs.length > 0)
    ? custom.paragraphs.filter((p: string) => Boolean(p && p.trim()))
    : def.defaultParagraphs;
  const calloutTitle = custom.calloutTitle !== undefined ? custom.calloutTitle : def.defaultCalloutTitle;
  const calloutContent = custom.calloutContent !== undefined ? custom.calloutContent : def.defaultCalloutContent;
  const quote = custom.quote !== undefined ? custom.quote : def.defaultQuote;

  const html = buildVintageEmailHtml({
    headline,
    badge,
    subtitle,
    dateFormatted: dynamicParams?.dateFormatted || getMontanaTimeInfo().formattedDate,
    bodyParagraphs,
    calloutBox: (calloutTitle || calloutContent) ? {
      title: calloutTitle || '✍🏾 Note from Penguin',
      content: calloutContent || ''
    } : undefined,
    button: def.hasCheckinLink ? {
      text: "Open Today's Question Box 📝",
      link: dynamicParams?.checkinLink || '#'
    } : undefined,
    quote
  });

  return {
    subject,
    headline,
    badge,
    subtitle,
    bodyParagraphs,
    calloutTitle,
    calloutContent,
    quote,
    html,
    isCustomized: Boolean(templateOverrides[type])
  };
}

// -------------------------------------------------------------
// 4 DISTINCT REMINDER DISPATCH LOGIC
// -------------------------------------------------------------
async function sendScheduledReminderType(type: 'morning_6am' | 'hydrated_1pm' | 'movement_4pm' | 'checkin_930pm', customRecipient?: string, appUrl?: string) {
  const toEmail = customRecipient || RECIPIENT_EMAIL;
  const timeInfo = getMontanaTimeInfo();
  const baseUrl = appUrl || process.env.APP_URL || 'https://ais-dev-g2pjvif4lajubgeokcgbxz-480042107319.europe-west2.run.app';
  const checkinLink = `${baseUrl}/?view=checkin&date=${encodeURIComponent(timeInfo.dateStr)}`;

  const merged = getMergedTemplate(type, { checkinLink, dateFormatted: timeInfo.formattedDate });

  const transporter = getTransporter();
  const info = await transporter.sendMail({
    from: `"Penguin Coach 🐧" <${GMAIL_USER}>`,
    to: toEmail,
    subject: merged.subject,
    html: merged.html
  });

  console.log(`[Scheduled Email] Sent ${type} to ${toEmail} - Subject: "${merged.subject}" - MessageID: ${info.messageId}`);
  return { success: true, messageId: info.messageId, type, toEmail, subject: merged.subject };
}

// -------------------------------------------------------------
// AUTOMATED MONTANA BACKGROUND CHECKER (Runs every 30 seconds)
// -------------------------------------------------------------
setInterval(async () => {
  try {
    const timeInfo = getMontanaTimeInfo();
    const { dateStr, currentHour, currentMinute } = timeInfo;

    if (!sentScheduledReminders[dateStr]) {
      sentScheduledReminders[dateStr] = new Set<string>();
    }

    const todaySet = sentScheduledReminders[dateStr];

    // 1. 06:00 AM MT (Window: 06:00 - 06:05)
    if (currentHour === 6 && currentMinute >= 0 && currentMinute <= 5 && !todaySet.has('morning_6am')) {
      console.log(`[Scheduler] Triggering 06:00 AM Morning reminder for ${dateStr}...`);
      todaySet.add('morning_6am');
      await sendScheduledReminderType('morning_6am');
    }

    // 2. 01:00 PM MT (Window: 13:00 - 13:05)
    if (currentHour === 13 && currentMinute >= 0 && currentMinute <= 5 && !todaySet.has('hydrated_1pm')) {
      console.log(`[Scheduler] Triggering 01:00 PM Hydration reminder for ${dateStr}...`);
      todaySet.add('hydrated_1pm');
      await sendScheduledReminderType('hydrated_1pm');
    }

    // 3. 04:00 PM MT (Window: 16:00 - 16:05)
    if (currentHour === 16 && currentMinute >= 0 && currentMinute <= 5 && !todaySet.has('movement_4pm')) {
      console.log(`[Scheduler] Triggering 04:00 PM Movement reminder for ${dateStr}...`);
      todaySet.add('movement_4pm');
      await sendScheduledReminderType('movement_4pm');
    }

    // 4. 09:30 PM MT (Window: 21:30 - 21:35)
    if (currentHour === 21 && currentMinute >= 30 && currentMinute <= 35 && !todaySet.has('checkin_930pm')) {
      console.log(`[Scheduler] Triggering 09:30 PM Main Event Check-in reminder for ${dateStr}...`);
      todaySet.add('checkin_930pm');
      await sendScheduledReminderType('checkin_930pm');
    }
  } catch (err) {
    console.error('[Scheduler Error]', err);
  }
}, 30000);


// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 2. Email system status
app.get('/api/email-status', async (req, res) => {
  try {
    const transporter = getTransporter();
    // Quick verify without sending
    await transporter.verify();
    res.json({
      connected: true,
      senderEmail: GMAIL_USER,
      montanaTime: getMontanaTimeInfo()
    });
  } catch (err: any) {
    res.json({
      connected: false,
      senderEmail: GMAIL_USER,
      error: err?.message || 'Failed to connect to Gmail SMTP',
      montanaTime: getMontanaTimeInfo()
    });
  }
});

// 3. Send reminder email
app.post('/api/send-reminder', async (req, res) => {
  const { toEmail, customNote, customSubject, checkinDate, appUrl } = req.body;

  if (!toEmail) {
    return res.status(400).json({ error: 'Recipient email is required.' });
  }

  const timeInfo = getMontanaTimeInfo();
  const targetDateStr = checkinDate || timeInfo.dateStr;
  const targetFormattedDate = timeInfo.formattedDate;

  // Resolve base app URL
  const baseUrl = appUrl || process.env.APP_URL || (req.headers.origin as string) || `https://${req.headers.host}`;
  const checkinLink = `${baseUrl}/?view=checkin&date=${encodeURIComponent(targetDateStr)}`;

  const subject = customSubject || `Hey Bunny 🐰 - Today's Gym Check-in & Question Box 📝`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Daily Check-in for Bunny</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F4EFE2;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #2B2620;
    }
    .wrapper {
      max-width: 540px;
      margin: 30px auto;
      background: #FBF8F0;
      border: 1px solid rgba(43, 38, 32, 0.14);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(43, 38, 32, 0.08);
    }
    .header {
      background: #4B6650;
      padding: 30px 24px;
      text-align: center;
      color: #FFFFFF;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 6px 0 0;
      font-size: 13px;
      color: #E2ECD5;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .body-content {
      padding: 32px 28px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #2B2620;
      margin-bottom: 12px;
    }
    .subtext {
      font-size: 15px;
      line-height: 1.6;
      color: #6B6255;
      margin-bottom: 24px;
    }
    .note-card {
      background: #F4EFE2;
      border-left: 4px solid #4B6650;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 26px;
      font-style: italic;
      color: #34473A;
      font-size: 14px;
      line-height: 1.5;
    }
    .btn-container {
      text-align: center;
      margin: 30px 0;
    }
    .btn-primary {
      display: inline-block;
      background-color: #4B6650;
      color: #FFFFFF !important;
      text-decoration: none;
      font-size: 16px;
      font-weight: 700;
      padding: 15px 32px;
      border-radius: 12px;
      box-shadow: 0 4px 14px rgba(75, 102, 80, 0.35);
    }
    .fallback-box {
      background: #FFFFFF;
      border: 1px solid rgba(43, 38, 32, 0.1);
      border-radius: 10px;
      padding: 12px 16px;
      font-size: 12px;
      color: #6B6255;
      word-break: break-all;
      margin-top: 20px;
    }
    .footer {
      border-top: 1px solid rgba(43, 38, 32, 0.1);
      padding: 20px 24px;
      text-align: center;
      font-size: 12px;
      color: #8C8275;
      background: #F4EFE2;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div style="font-size: 32px; margin-bottom: 8px;">🐰 💌 🐧</div>
      <h1>Daily Check-In & Question Box</h1>
      <p>${targetFormattedDate}</p>
    </div>

    <div class="body-content">
      <div class="greeting">Hey Bunny,</div>
      <div class="subtext">
        Penguin is checking in on you! Take 2 quick minutes to fill in today's page — let him know if you hit the gym, how you ate, and how your energy is feeling today.
      </div>

      ${customNote ? `
      <div class="note-card">
        <strong>Penguin's note:</strong><br>
        "${customNote}"
      </div>
      ` : ''}

      <div class="btn-container">
        <a href="${checkinLink}" class="btn-primary" target="_blank">
          Open Today's Page 📝
        </a>
      </div>

      <div class="fallback-box">
        If the button doesn't open, copy and paste this link in your browser:<br>
        <a href="${checkinLink}" style="color: #4B6650; text-decoration: underline;">${checkinLink}</a>
      </div>
    </div>

    <div class="footer">
      Sent with ❤️ from Penguin via your personal gym record &bull; Not judged, just tracked.
    </div>
  </div>
</body>
</html>
  `;

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: `"Penguin Coach 🐧" <${GMAIL_USER}>`,
      to: toEmail,
      subject,
      html: htmlContent
    });

    console.log(`[Email] Reminder sent to ${toEmail} - MessageID: ${info.messageId}`);
    return res.json({
      success: true,
      messageId: info.messageId,
      sentTo: toEmail,
      link: checkinLink,
      date: targetDateStr
    });
  } catch (err: any) {
    console.error('[Email Error]', err);
    return res.status(500).json({
      error: 'Failed to send email through Gmail.',
      details: err?.message || String(err)
    });
  }
});

// 4. Send specific scheduled reminder immediately (for testing or manual dispatch)
app.post('/api/send-scheduled-reminder', async (req, res) => {
  const type = req.body.type || req.body.reminderId;
  const { toEmail, appUrl } = req.body;
  if (!['morning_6am', 'hydrated_1pm', 'movement_4pm', 'checkin_930pm'].includes(type)) {
    return res.status(400).json({ error: 'Invalid reminder type.' });
  }

  try {
    const result = await sendScheduledReminderType(type, toEmail, appUrl);
    return res.json(result);
  } catch (err: any) {
    console.error('[Scheduled Email Error]', err);
    return res.status(500).json({
      error: `Failed to dispatch ${type} reminder email.`,
      details: err?.message || String(err)
    });
  }
});

// 5. Get all email templates (with defaults, custom overrides, and active state)
app.get('/api/email-templates', (req, res) => {
  const list = Object.keys(DEFAULT_SCHEDULED_TEMPLATES).map(key => {
    const def = DEFAULT_SCHEDULED_TEMPLATES[key as keyof typeof DEFAULT_SCHEDULED_TEMPLATES];
    const custom = templateOverrides[key] || {};
    return {
      id: def.id,
      timeLabel: def.timeLabel,
      title: def.title,
      defaultSubject: def.defaultSubject,
      defaultHeadline: def.defaultHeadline,
      defaultBadge: def.defaultBadge,
      defaultSubtitle: def.defaultSubtitle,
      defaultParagraphs: def.defaultParagraphs,
      defaultCalloutTitle: def.defaultCalloutTitle || '',
      defaultCalloutContent: def.defaultCalloutContent || '',
      defaultQuote: def.defaultQuote || '',
      hasCheckinLink: Boolean(def.hasCheckinLink),
      customSubject: custom.subject || '',
      customHeadline: custom.headline || '',
      customSubtitle: custom.subtitle || '',
      customBadge: custom.badge || '',
      customParagraphs: custom.paragraphs || [],
      customCalloutTitle: custom.calloutTitle || '',
      customCalloutContent: custom.calloutContent || '',
      customQuote: custom.quote || '',
      isCustomized: Boolean(templateOverrides[key])
    };
  });

  res.json({ templates: list });
});

// 6. Save custom template override
app.post('/api/email-templates', (req, res) => {
  const {
    id,
    subject,
    headline,
    subtitle,
    badge,
    paragraphs,
    calloutTitle,
    calloutContent,
    quote
  } = req.body;

  if (!id || !DEFAULT_SCHEDULED_TEMPLATES[id as keyof typeof DEFAULT_SCHEDULED_TEMPLATES]) {
    return res.status(400).json({ error: 'Invalid template id' });
  }

  templateOverrides[id] = {
    subject: subject ? String(subject).trim() : undefined,
    headline: headline ? String(headline).trim() : undefined,
    subtitle: subtitle ? String(subtitle).trim() : undefined,
    badge: badge ? String(badge).trim() : undefined,
    paragraphs: Array.isArray(paragraphs) ? paragraphs.map((p: any) => String(p).trim()).filter(Boolean) : undefined,
    calloutTitle: calloutTitle !== undefined ? String(calloutTitle).trim() : undefined,
    calloutContent: calloutContent !== undefined ? String(calloutContent).trim() : undefined,
    quote: quote !== undefined ? String(quote).trim() : undefined,
    updatedAt: new Date().toISOString()
  };

  saveTemplateOverrides();
  console.log(`[Email Templates] Saved custom override for "${id}"`);
  return res.json({ success: true, id, override: templateOverrides[id] });
});

// 7. Reset a template back to factory default
app.post('/api/reset-email-template', (req, res) => {
  const { id } = req.body;
  if (id && templateOverrides[id]) {
    delete templateOverrides[id];
    saveTemplateOverrides();
    console.log(`[Email Templates] Reset "${id}" back to default`);
  }
  return res.json({ success: true, id });
});

// 8. Send Surprise Email anytime
app.post('/api/send-surprise-email', async (req, res) => {
  const {
    toEmail,
    subject,
    headline,
    subtitle,
    badge,
    messageText,
    calloutTitle,
    calloutContent,
    quote,
    includeCheckinLink,
    appUrl
  } = req.body;

  const targetRecipient = (toEmail && String(toEmail).trim()) || RECIPIENT_EMAIL;
  if (!targetRecipient || !targetRecipient.includes('@')) {
    return res.status(400).json({ error: 'Valid recipient email required.' });
  }

  const timeInfo = getMontanaTimeInfo();
  const baseUrl = appUrl || process.env.APP_URL || 'https://ais-dev-g2pjvif4lajubgeokcgbxz-480042107319.europe-west2.run.app';
  const checkinLink = `${baseUrl}/?view=checkin&date=${encodeURIComponent(timeInfo.dateStr)}`;

  const finalSubject = (subject && String(subject).trim()) || `Surprise Love Note from Penguin 💌🐧`;
  const finalHeadline = (headline && String(headline).trim()) || 'Thinking of You, Bunny! ✨';
  const finalBadge = (badge && String(badge).trim()) || 'Surprise Dispatch • Just Because';
  const finalSubtitle = (subtitle && String(subtitle).trim()) || 'A little reminder of how loved you are today';

  const paragraphs = messageText
    ? String(messageText).split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
    : ['Penguin just wanted to drop into your inbox and surprise you right now!'];

  const html = buildVintageEmailHtml({
    headline: finalHeadline,
    badge: finalBadge,
    subtitle: finalSubtitle,
    dateFormatted: timeInfo.formattedDate,
    bodyParagraphs: paragraphs,
    calloutBox: (calloutTitle || calloutContent) ? {
      title: calloutTitle ? String(calloutTitle).trim() : '✍🏾 Note from Penguin',
      content: calloutContent ? String(calloutContent).trim() : ''
    } : undefined,
    button: includeCheckinLink ? {
      text: "Open Today's Question Box 📝",
      link: checkinLink
    } : undefined,
    quote: quote ? String(quote).trim() : 'You are amazing and unstoppable. Penguin loves you so much! 🐧❤️'
  });

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: `"Penguin Coach 🐧" <${GMAIL_USER}>`,
      to: targetRecipient,
      subject: finalSubject,
      html
    });

    console.log(`[Surprise Email] Sent to ${targetRecipient} - Subject: "${finalSubject}" - MessageID: ${info.messageId}`);
    return res.json({
      success: true,
      messageId: info.messageId,
      toEmail: targetRecipient,
      subject: finalSubject
    });
  } catch (err: any) {
    console.error('[Surprise Email Error]', err);
    return res.status(500).json({
      error: 'Failed to send surprise email via Gmail.',
      details: err?.message || String(err)
    });
  }
});

// 9. Preview exact rendered HTML of scheduled or surprise email
app.post('/api/preview-email-html', (req, res) => {
  const { mode, type, overrides, surpriseData, appUrl } = req.body;
  const timeInfo = getMontanaTimeInfo();
  const baseUrl = appUrl || process.env.APP_URL || 'https://ais-dev-g2pjvif4lajubgeokcgbxz-480042107319.europe-west2.run.app';
  const checkinLink = `${baseUrl}/?view=checkin&date=${encodeURIComponent(timeInfo.dateStr)}`;

  if (mode === 'surprise' && surpriseData) {
    const finalSubject = surpriseData.subject?.trim() || 'Surprise Love Note from Penguin 💌🐧';
    const paragraphs = surpriseData.messageText
      ? String(surpriseData.messageText).split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
      : ['Penguin just wanted to drop into your inbox and surprise you right now!'];

    const html = buildVintageEmailHtml({
      headline: surpriseData.headline?.trim() || 'Thinking of You, Bunny! ✨',
      badge: surpriseData.badge?.trim() || 'Surprise Dispatch • Just Because',
      subtitle: surpriseData.subtitle?.trim() || 'A little reminder of how loved you are today',
      dateFormatted: timeInfo.formattedDate,
      bodyParagraphs: paragraphs,
      calloutBox: (surpriseData.calloutTitle || surpriseData.calloutContent) ? {
        title: surpriseData.calloutTitle?.trim() || '✍🏾 Note from Penguin',
        content: surpriseData.calloutContent?.trim() || ''
      } : undefined,
      button: surpriseData.includeCheckinLink ? {
        text: "Open Today's Question Box 📝",
        link: checkinLink
      } : undefined,
      quote: surpriseData.quote?.trim() || 'You are amazing and unstoppable. Penguin loves you so much! 🐧❤️'
    });

    return res.json({ subject: finalSubject, html });
  }

  // Scheduled preview
  const scheduledType = type || 'morning_6am';
  const def = DEFAULT_SCHEDULED_TEMPLATES[scheduledType as keyof typeof DEFAULT_SCHEDULED_TEMPLATES] || DEFAULT_SCHEDULED_TEMPLATES.checkin_930pm;
  const activeCustom = overrides || templateOverrides[scheduledType] || {};

  const subject = activeCustom.subject?.trim() || def.defaultSubject;
  const headline = activeCustom.headline?.trim() || def.defaultHeadline;
  const badge = activeCustom.badge?.trim() || def.defaultBadge;
  const subtitle = activeCustom.subtitle?.trim() || def.defaultSubtitle;
  const bodyParagraphs = (Array.isArray(activeCustom.paragraphs) && activeCustom.paragraphs.length > 0)
    ? activeCustom.paragraphs.filter((p: string) => Boolean(p && p.trim()))
    : def.defaultParagraphs;
  const calloutTitle = activeCustom.calloutTitle !== undefined ? activeCustom.calloutTitle : def.defaultCalloutTitle;
  const calloutContent = activeCustom.calloutContent !== undefined ? activeCustom.calloutContent : def.defaultCalloutContent;
  const quote = activeCustom.quote !== undefined ? activeCustom.quote : def.defaultQuote;

  const html = buildVintageEmailHtml({
    headline,
    badge,
    subtitle,
    dateFormatted: timeInfo.formattedDate,
    bodyParagraphs,
    calloutBox: (calloutTitle || calloutContent) ? {
      title: calloutTitle || '✍🏾 Note from Penguin',
      content: calloutContent || ''
    } : undefined,
    button: def.hasCheckinLink ? {
      text: "Open Today's Question Box 📝",
      link: checkinLink
    } : undefined,
    quote
  });

  return res.json({ subject, html });
});

// 5. Get current scheduler status and history
app.get('/api/schedule-status', (req, res) => {
  const timeInfo = getMontanaTimeInfo();
  const todaySent = sentScheduledReminders[timeInfo.dateStr] 
    ? Array.from(sentScheduledReminders[timeInfo.dateStr]) 
    : [];

  res.json({
    recipientEmail: RECIPIENT_EMAIL,
    montanaTime: timeInfo,
    todaySent,
    schedules: [
      {
        id: 'morning_6am',
        timeLabel: '06:00 AM MT',
        title: 'Morning Energy & Breakfast',
        description: 'Jumping jacks & squats wakeup + reminder to eat breakfast',
        sentToday: todaySent.includes('morning_6am')
      },
      {
        id: 'hydrated_1pm',
        timeLabel: '01:00 PM MT',
        title: 'Midday Hydration',
        description: 'Drink water and stay crisp throughout the afternoon',
        sentToday: todaySent.includes('hydrated_1pm')
      },
      {
        id: 'movement_4pm',
        timeLabel: '04:00 PM MT',
        title: 'Afternoon Movement / Gym',
        description: 'Gym session alert (or light jogging/squats if rest day)',
        sentToday: todaySent.includes('movement_4pm')
      },
      {
        id: 'checkin_930pm',
        timeLabel: '09:30 PM MT',
        title: 'The Main Event: Question Box',
        description: 'Link to daily check-in with truth pledge and note to coach',
        sentToday: todaySent.includes('checkin_930pm')
      }
    ]
  });
});

// 6. Update recipient email address
app.post('/api/update-recipient', (req, res) => {
  const { email } = req.body;
  if (email && email.includes('@')) {
    RECIPIENT_EMAIL = email.trim();
    return res.json({ success: true, recipientEmail: RECIPIENT_EMAIL });
  }
  return res.status(400).json({ error: 'Valid email required' });
});

// -------------------------------------------------------------
// VITE DEV / PRODUCTION MIDDLEWARE
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bunny's Gym App server running on http://0.0.0.0:${PORT}`);
    console.log(`Gmail sender configured: ${GMAIL_USER}`);
  });
}

startServer();
