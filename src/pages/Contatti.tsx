import { useTranslation } from '../i18n/I18nProvider';

export function Contatti() {
  const { t } = useTranslation();

  return (
    <main className="page-shell">
      <section className="card">
        <h1>{t('contact.title')}</h1>
        <p>{t('contact.description')}</p>
        <p style={{ marginTop: '1.5rem', opacity: 0.7 }}>{t('contact.comingSoon')}</p>
      </section>
    </main>
  );
}
