import { useEffect } from 'react';
import { useTranslation } from '../../i18n/I18nProvider';

/** Una stella appare al centro dello schermo e si accende sempre di più; poi lascia il posto alla lettura. */
export function TarotStar({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(onDone, reduce ? 600 : 4200);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="tarot-star-overlay" role="status" aria-live="polite">
      <div className="tarot-star-halo" aria-hidden="true" />
      <svg className="tarot-star" viewBox="0 0 100 100" aria-hidden="true">
        <polygon points="50,4 58,40 96,50 58,60 50,96 42,60 4,50 42,40" />
        <polygon points="50,22 54,46 78,50 54,54 50,78 46,54 22,50 46,46" className="tarot-star-inner" />
      </svg>
      <p className="tarot-star-text">{t('tarot.starText')}</p>
    </div>
  );
}
