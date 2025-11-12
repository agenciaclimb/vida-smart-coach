export type ProgressionTracker = {
  stage: string;
  substage: number;
  questionsAsked: string[];
  topicsCovered: string[];
  lastProgressAt: string;
  stagnationCount: number;
};

export function shouldForceProgression(tracker: ProgressionTracker, userMessage: string, aiReply: string): boolean {
  // Regras:
  // - Mais de 5 minutos no mesmo substágio
  // - 3+ perguntas sobre o mesmo tópico
  // - 75% dos tópicos obrigatórios cobertos
  // - Usuário demonstra frustração
  const now = Date.now();
  const lastProgress = new Date(tracker.lastProgressAt).getTime();
  const minutesStagnant = (now - lastProgress) / 60000;
  const repeatedTopic = tracker.questionsAsked.length >= 3 && tracker.questionsAsked.slice(-3).every(q => q === tracker.questionsAsked[tracker.questionsAsked.length - 1]);
  const topicsPercent = tracker.topicsCovered.length / 4; // 4 tópicos: físico, alimentar, emocional, espiritual
  const userFrustration = /(cansado|frustrado|não aguento|repete|de novo|já falei)/i.test(userMessage);

  return (
    minutesStagnant > 5 ||
    repeatedTopic ||
    topicsPercent >= 0.75 ||
    userFrustration
  );
}
