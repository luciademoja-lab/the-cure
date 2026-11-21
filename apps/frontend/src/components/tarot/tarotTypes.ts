export type TarotPosition = 'past' | 'present' | 'path';
export type TarotCardData = { id: number; reversed: boolean; position: TarotPosition; name: { it: string; en: string } };
export type TarotReading = { day: string; cards: TarotCardData[]; reading: string; createdAt?: string };
