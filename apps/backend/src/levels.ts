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
}

export const LEVELS: LevelDefinition[] = [
  { level: 1, symbol: '•', name: 'Il Punto', threshold: 0, question: "Cosa c'è, adesso, che non hai ancora detto a nessuno?" },
  { level: 2, symbol: '•', name: "L'Ascolto", threshold: 20, question: 'Quale parte di te chiede attenzione da più tempo?' },
  { level: 3, symbol: '◯', name: 'Il Cerchio', threshold: 50, question: 'Chi ti vede davvero? E tu, a chi ti mostri?' },
  { level: 4, symbol: '◯', name: 'Lo Specchio', threshold: 100, question: 'Cosa riconosci di te in ciò che ti irrita negli altri?' },
  { level: 5, symbol: '△', name: 'La Soglia', threshold: 170, question: 'Cosa faresti se non dovessi dimostrare niente a nessuno?' },
  { level: 6, symbol: '△', name: 'La Fiamma', threshold: 260, question: 'Cosa vuoi creare che esisterebbe solo grazie a te?' },
  { level: 7, symbol: '•◯△', name: 'La Forgia', threshold: 370, question: 'Cosa vuoi costruire insieme a qualcun altro?' },
];

export const RITUAL_LIGHT_POINTS = 5;

export function buildProgress(lightPoints: number, responses: Map<number, string>) {
  const unlocked = LEVELS.filter((l) => lightPoints >= l.threshold);
  const current = unlocked[unlocked.length - 1];
  const next = LEVELS.find((l) => lightPoints < l.threshold) || null;
  return {
    lightPoints,
    level: current.level,
    levelName: current.name,
    nextLevelAt: next ? next.threshold : null,
    levels: LEVELS.map((l) => {
      const isUnlocked = lightPoints >= l.threshold;
      return {
        level: l.level,
        symbol: l.symbol,
        name: l.name,
        threshold: l.threshold,
        unlocked: isUnlocked,
        // La domanda si scopre solo aprendo il livello.
        question: isUnlocked ? l.question : null,
        response: isUnlocked ? responses.get(l.level) || '' : '',
      };
    }),
  };
}
