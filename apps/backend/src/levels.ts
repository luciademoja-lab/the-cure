import { currentLocale, type Locale } from './locale';

/**
 * Il Percorso: i punti luce (diario + rituali) aprono sette livelli.
 * Ogni livello aperto consegna una domanda su cui fermarsi.
 * Nomi, soglie e domande si cambiano qui.
 */
export interface LevelDefinition {
  level: number;
  symbol: string;
  name: string;
  threshold: number;
  question: string;
  nameEn: string;
  questionEn: string;
}

export const LEVELS: LevelDefinition[] = [
  { level: 1, symbol: '•', name: 'Il Punto', threshold: 0, question: "Cosa c'è, adesso, che non hai ancora detto a nessuno?", nameEn: 'The Point', questionEn: "What is here, right now, that you haven't told anyone yet?" },
  { level: 2, symbol: '•', name: "L'Ascolto", threshold: 20, question: 'Quale parte di te chiede attenzione da più tempo?', nameEn: 'The Listening', questionEn: 'Which part of you has been asking for attention the longest?' },
  { level: 3, symbol: '◯', name: 'Il Cerchio', threshold: 50, question: 'Chi ti vede davvero? E tu, a chi ti mostri?', nameEn: 'The Circle', questionEn: 'Who truly sees you? And who do you show yourself to?' },
  { level: 4, symbol: '◯', name: 'Lo Specchio', threshold: 100, question: 'Cosa riconosci di te in ciò che ti irrita negli altri?', nameEn: 'The Mirror', questionEn: 'What do you recognise of yourself in what irritates you in others?' },
  { level: 5, symbol: '△', name: 'La Soglia', threshold: 170, question: 'Cosa faresti se non dovessi dimostrare niente a nessuno?', nameEn: 'The Threshold', questionEn: "What would you do if you didn't have to prove anything to anyone?" },
  { level: 6, symbol: '△', name: 'La Fiamma', threshold: 260, question: 'Cosa vuoi creare che esisterebbe solo grazie a te?', nameEn: 'The Flame', questionEn: 'What do you want to create that would exist only because of you?' },
  { level: 7, symbol: '•◯△', name: 'La Forgia', threshold: 370, question: 'Cosa vuoi costruire insieme a qualcun altro?', nameEn: 'The Forge', questionEn: 'What do you want to build together with someone else?' },
];

export const RITUAL_LIGHT_POINTS = 5;

export function buildProgress(lightPoints: number, responses: Map<number, string>, locale: Locale = currentLocale()) {
  const nameOf = (l: LevelDefinition) => (locale === 'en' ? l.nameEn : l.name);
  const questionOf = (l: LevelDefinition) => (locale === 'en' ? l.questionEn : l.question);
  const unlocked = LEVELS.filter((l) => lightPoints >= l.threshold);
  const current = unlocked[unlocked.length - 1];
  const next = LEVELS.find((l) => lightPoints < l.threshold) || null;
  return {
    lightPoints,
    level: current.level,
    levelName: nameOf(current),
    nextLevelAt: next ? next.threshold : null,
    levels: LEVELS.map((l) => {
      const isUnlocked = lightPoints >= l.threshold;
      return {
        level: l.level,
        symbol: l.symbol,
        name: nameOf(l),
        threshold: l.threshold,
        unlocked: isUnlocked,
        // La domanda si scopre solo aprendo il livello.
        question: isUnlocked ? questionOf(l) : null,
        response: isUnlocked ? responses.get(l.level) || '' : '',
      };
    }),
  };
}
