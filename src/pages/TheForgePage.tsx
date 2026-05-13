import { useTranslation } from '../i18n/I18nProvider';

export function TheForge() {
  const { t } = useTranslation();

  return (
    <main className="page-shell">
      <section className="card">
        <h1>{t('forge.title')}</h1>
        <p>{t('forge.description')}</p>
        <p style={{ marginTop: '1.5rem', opacity: 0.7 }}>{t('forge.comingSoon')}</p>
      </section>
    </main>
  );
}
