import { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/I18nProvider';

const HIDE_KEY = 'elayra-liria-popup-hidden';
const LIRIA_URL = 'https://secretaryliria.com/';
const LIRIA_PHOTO = 'https://secretaryliria.com/videos/secretary-liria-loop-poster.jpg';

function hiddenForever(): boolean {
  try {
    return window.localStorage.getItem(HIDE_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Secretary Liria si presenta appena si entra nella Forgia, con lo stile del suo sito.
 * Ricompare a ogni visita finché la persona non sceglie "Non mostrare più".
 */
export function LiriaPopup() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(() => !hiddenForever());

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  const neverAgain = () => {
    try {
      window.localStorage.setItem(HIDE_KEY, '1');
    } catch {
      /* senza archivio locale si chiude solo per questa visita */
    }
    setOpen(false);
  };

  return (
    <div className="liria-overlay" role="presentation" onClick={() => setOpen(false)}>
      <div
        className="liria-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="liria-popup-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="liria-close" aria-label={t('liriaPopup.close')} onClick={() => setOpen(false)}>
          ×
        </button>
        <img className="liria-photo" src={LIRIA_PHOTO} alt="Secretary Liria" width={132} height={132} />
        <p className="liria-eyebrow">{t('liriaPopup.eyebrow')}</p>
        <h2 id="liria-popup-title">Secretary Liria</h2>
        <p className="liria-lead">{t('liriaPopup.lead')}</p>
        <ul className="liria-points">
          <li>{t('liriaPopup.point1')}</li>
          <li>{t('liriaPopup.point2')}</li>
          <li>{t('liriaPopup.point3')}</li>
        </ul>
        <a className="liria-cta" href={LIRIA_URL} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>
          Hire your Secretary Now
        </a>
        <button type="button" className="liria-never" onClick={neverAgain}>
          {t('liriaPopup.never')}
        </button>
      </div>
    </div>
  );
}
