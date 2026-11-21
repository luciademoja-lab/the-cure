import { useTranslation } from '../../i18n/I18nProvider';
import { TarotCardBack, TarotCardFront, cardName } from './TarotCardArt';
import type { TarotCardData, TarotPosition } from './tarotTypes';

const POSITIONS: TarotPosition[] = ['past', 'present', 'path'];

/** Le tre carte sul tavolo. `revealed` dice quante sono già girate. */
export function TarotSpread({ cards, revealed, small = false }: { cards: TarotCardData[]; revealed: number; small?: boolean }) {
  const { t, locale } = useTranslation();
  return (
    <div className={`tarot-spread ${small ? 'tarot-spread--small' : ''}`}>
      {POSITIONS.map((position, i) => {
        const card = cards.find((c) => c.position === position);
        const open = Boolean(card) && i < revealed;
        return (
          <figure key={position} className="tarot-slot">
            <div className={`tarot-card ${open ? 'is-open' : ''}`} style={{ transitionDelay: `${i * 0.15}s` }}>
              <div className="tarot-card-face tarot-card-face--back">
                <TarotCardBack />
              </div>
              <div className="tarot-card-face tarot-card-face--front">
                {card && open && <TarotCardFront id={card.id} name={cardName(card, locale)} reversed={card.reversed} />}
              </div>
            </div>
            <figcaption>
              <span className="tarot-position">{t(`tarot.position.${position}`)}</span>
              {open && card && (
                <span className="tarot-card-label">
                  {cardName(card, locale)}
                  {card.reversed ? ` · ${t('tarot.reversed')}` : ''}
                </span>
              )}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}

/** Il testo di Elayra in paragrafi. */
export function TarotText({ text }: { text: string }) {
  return (
    <div className="tarot-text">
      {text
        .split(/\n+/)
        .filter((p) => p.trim())
        .map((p, i) => (
          <p key={i}>{p}</p>
        ))}
    </div>
  );
}
