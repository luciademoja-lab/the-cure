import { useTranslation } from '../i18n/I18nProvider';

export function GamingPage() {
  const { t } = useTranslation();

  return (
    <main className="page-shell">
      <section className="card">
        <h1>{t('gaming.title')}</h1>
        <p>{t('gaming.description')}</p>
        <p style={{ marginTop: '1.5rem', opacity: 0.7 }}>{t('gaming.comingSoon')}</p>
      </section>
    </main>
  );
}
