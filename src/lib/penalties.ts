export const WEIGHT_LOSS_PENALTIES = [
  "🏃‍♀️ 2 KM (1.24 Miles) Outdoor Run & Video Clips (Start, Middle & End)",
  "🏃‍♂️ 3 KM (1.86 Miles) Treadmill Incline Run/Walk & Screen Display Proof",
  "🪢 300 Jump Ropes + 50 Burpees & Video Clip Proof",
  "🔥 45-Minute High-Intensity Interval Training (HIIT) Cardio Workout",
  "🏋️‍♀️ 100 Deep Squats + 100 Jumping Jacks + 3-Minute Plank",
  "🚴‍♀️ 5 KM (3.1 Miles) High-Resistance Stationary Bike / Cycle Proof"
];

export function getRandomPenaltyTask(): string {
  const index = Math.floor(Math.random() * WEIGHT_LOSS_PENALTIES.length);
  return WEIGHT_LOSS_PENALTIES[index];
}
