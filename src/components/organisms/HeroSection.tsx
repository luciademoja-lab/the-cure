import { Button } from '../atoms/Button';
import { useTranslation } from '../../i18n/I18nProvider';

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="grid-columns" aria-label={t('hero.ariaLabel')}>
      <div>
        <div className="hero-eyebrow">
          <span />
        </div>
        <h1 className="hero-title">{t('hero.title')}</h1>
        <p className="hero-copy">{t('hero.copy')}</p>
        <div className="cta-area">
          <Button label={t('hero.joinButton')} variant="primary" />
          <Button label={t('hero.viewButton')} variant="secondary" />
        </div>
      </div>
      <div className="hero-visual" role="img" aria-label={t('hero.visualAriaLabel')}>
        <div className="visual-card">
          <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.82 }}>
            {t('hero.visualCopy')}
          </p>
          <div className="visual-symbols">
            <div className="symbol-pill">•</div>
            <div className="symbol-pill">◯</div>
            <div className="symbol-pill">△</div>
          </div>
        </div>
      </div>
    </section>
  );
}
