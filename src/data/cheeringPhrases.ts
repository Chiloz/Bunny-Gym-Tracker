export interface CheeringPhrase {
  id: number;
  phrase: string;
  subtext: string;
  tag: string;
}

export const CHEERING_PHRASES: CheeringPhrase[] = [
  {
    id: 1,
    phrase: "Go Bunny, Penguin is proud of you! 🐧❤️🐰",
    subtext: "Showing up is 90% of victory, and you showed up completely today.",
    tag: "Coach Love"
  },
  {
    id: 2,
    phrase: "Go cookie! 🍪 Another day conquered with heart and grit!",
    subtext: "Every small step today is paving the road to your biggest goals.",
    tag: "Pure Grit"
  },
  {
    id: 3,
    phrase: "Look at you crushing another day! You make discipline look effortless! ✨",
    subtext: "Penguin is smiling from ear to ear seeing you keep your word.",
    tag: "Discipline"
  },
  {
    id: 4,
    phrase: "Go Bunny! A true champion in every sense of the word! 🏆",
    subtext: "The hard work you put in when no one is watching is what makes you shine.",
    tag: "Champion"
  },
  {
    id: 5,
    phrase: "Go cookie! Penguin is cheering so loud for you right now! 📣🐧",
    subtext: "Sending you the biggest standing ovation from across the miles.",
    tag: "High Energy"
  },
  {
    id: 6,
    phrase: "You did that! Strength, beauty, and unstoppable determination! 💪🐰",
    subtext: "Never doubt how much power and resilience you carry inside you.",
    tag: "Strength"
  },
  {
    id: 7,
    phrase: "Gold star in the ledger today! Penguin is insanely proud of you! 🌟",
    subtext: "Consistency is your superpower, and nobody does it better than Bunny.",
    tag: "Accountability"
  },
  {
    id: 8,
    phrase: "Certified Rock Star! Keep that brilliant fire burning, cookie! 🔥",
    subtext: "You turned another ordinary day into a masterclass in commitment.",
    tag: "Momentum"
  },
  {
    id: 9,
    phrase: "Go Bunny! The sweetest victory is knowing you gave your honest best! 🍯",
    subtext: "Rest easy tonight knowing your coach has got your back 100%.",
    tag: "Heart"
  },
  {
    id: 10,
    phrase: "High five across the distance! You smashed it today, cookie! ✋🐧",
    subtext: "No excuses, no shortcuts — just pure, honest, gorgeous effort.",
    tag: "High Five"
  },
  {
    id: 11,
    phrase: "One more brick laid in your fortress of success! Proud of you, Bunny! 🏰",
    subtext: "Every workout, every meal logged, every glass of water builds your future.",
    tag: "Building"
  },
  {
    id: 12,
    phrase: "Go cookie! Penguin is doing a little happy victory waddle! 🐧💃",
    subtext: "Seeing you stay on track makes Penguin the happiest coach alive.",
    tag: "Joy"
  },
  {
    id: 13,
    phrase: "Queen of showing up! Take a bow, Bunny! 👑✨",
    subtext: "True greatness isn't born in a day; it is forged by days exactly like today.",
    tag: "Royalty"
  },
  {
    id: 14,
    phrase: "Look at that streak! Bunny and Penguin against the world! 🐰🤝🐧",
    subtext: "Together as a team, nothing can stop us. Sleep like a champion tonight!",
    tag: "Teamwork"
  },
  {
    id: 15,
    phrase: "Go Bunny, you absolute powerhouse! Nothing stands in your way! ⚡",
    subtext: "You faced today head-on, and you came out victorious.",
    tag: "Powerhouse"
  },
  {
    id: 16,
    phrase: "Sweet cookie victory! Today is officially stamped as a WIN! 🎯",
    subtext: "Penguin's official seal of approval is stamped right on your record.",
    tag: "Stamped Win"
  },
  {
    id: 17,
    phrase: "You inspire Penguin every single day, Bunny. Never forget that! 💖",
    subtext: "Your dedication is radiant and contagious. Keep shining bright.",
    tag: "Inspiration"
  },
  {
    id: 18,
    phrase: "Boom! Another day wrapped up with integrity and style! 💥",
    subtext: "Go cookie! Close this book, take a deep breath, and relax.",
    tag: "Style"
  },
  {
    id: 19,
    phrase: "Penguin is sending you the biggest, warmest polar hug! 🐧🤗",
    subtext: "You handled business today. Proud of your sweat, your honesty, and your smile.",
    tag: "Polar Hug"
  },
  {
    id: 20,
    phrase: "Go Bunny, go! Today proves once again what an incredible force you are! 🚀",
    subtext: "Tomorrow is lucky to have you, but tonight the victory is all yours.",
    tag: "Unstoppable"
  },
  {
    id: 21,
    phrase: "Cookie on a mission! No one can slow you down! 🍪💨",
    subtext: "Penguin is marking today with a giant checkmark and a big heart.",
    tag: "Mission"
  },
  {
    id: 22,
    phrase: "The ledger doesn't lie: Bunny came, Bunny conquered! 📜🏅",
    subtext: "Checked in, accounted for, and celebrated. Penguin loves your dedication!",
    tag: "Victory"
  }
];

export function getDailyCheeringPhrase(dateStr: string, seedOffset: number = 0): CheeringPhrase {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash + seedOffset) % CHEERING_PHRASES.length;
  return CHEERING_PHRASES[index];
}
