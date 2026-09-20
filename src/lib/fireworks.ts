import confetti from 'canvas-confetti';

export function launchFullCelebrationFireworks() {
  // 1. Center initial burst
  confetti({
    particleCount: 90,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#4B6650', '#E2A15D', '#B5666B', '#F59E0B', '#10B981', '#2B2620']
  });

  // 2. Left side cannon after 250ms
  setTimeout(() => {
    confetti({
      particleCount: 60,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ['#F59E0B', '#E2A15D', '#4B6650', '#FFFFFF']
    });
  }, 250);

  // 3. Right side cannon after 400ms
  setTimeout(() => {
    confetti({
      particleCount: 60,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ['#B5666B', '#E2A15D', '#4B6650', '#FFFFFF']
    });
  }, 400);

  // 4. Floating star particles after 650ms
  setTimeout(() => {
    confetti({
      particleCount: 40,
      spread: 100,
      origin: { y: 0.4 },
      shapes: ['star'],
      colors: ['#FFD700', '#FFA500', '#10B981']
    });
  }, 650);
}
