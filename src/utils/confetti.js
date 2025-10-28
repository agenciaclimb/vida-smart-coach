import confetti from 'canvas-confetti';

/**
 * Dispara confetti animation
 * @param {string} type - Tipo de celebração: 'default', 'milestone', 'epic'
 */
export function celebrateWithConfetti(type = 'default') {
  const configs = {
    default: {
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    },
    milestone: {
      particleCount: 150,
      spread: 120,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#FF6347', '#4169E1', '#9370DB']
    },
    epic: {
      particleCount: 200,
      spread: 160,
      origin: { y: 0.5 },
      startVelocity: 45,
      colors: ['#FFD700', '#FFA500', '#FF6347'],
      shapes: ['star', 'circle']
    },
    streak: {
      particleCount: 100,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#FF6347', '#FFA500', '#FFD700']
    }
  };

  const config = configs[type] || configs.default;

  // Para efeitos épicos, dispara múltiplas vezes
  if (type === 'epic') {
    const count = 3;
    const interval = setInterval(() => {
      confetti({
        ...config,
        origin: { 
          x: Math.random() * 0.3 + 0.35, 
          y: Math.random() * 0.3 + 0.4 
        }
      });
    }, 200);

    setTimeout(() => clearInterval(interval), 200 * count);
  } else if (type === 'streak') {
    // Efeito de streak vindo dos lados
    confetti({
      ...config,
      origin: { x: 0 }
    });
    confetti({
      ...config,
      angle: 120,
      origin: { x: 1 }
    });
  } else {
    confetti(config);
  }
}

/**
 * Celebração ao completar item do plano
 */
export function celebratePlanCompletion() {
  celebrateWithConfetti('default');
}

/**
 * Celebração ao atingir milestone
 * @param {number} milestone - Valor do milestone (7, 14, 30, etc)
 */
export function celebrateMilestone(milestone) {
  if (milestone >= 90) {
    celebrateWithConfetti('epic');
  } else if (milestone >= 30) {
    celebrateWithConfetti('milestone');
  } else {
    celebrateWithConfetti('streak');
  }
}

/**
 * Celebração ao subir de nível
 */
export function celebrateLevelUp() {
  celebrateWithConfetti('epic');
}

/**
 * Celebração ao resgatar recompensa
 */
export function celebrateRewardRedemption() {
  celebrateWithConfetti('milestone');
}
