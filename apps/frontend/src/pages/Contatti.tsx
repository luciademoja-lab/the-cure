import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/I18nProvider';
import { LEGAL, ownerLine } from '../lib/legal';

export function Contatti() {
  const { t } = useTranslation();
  return (
    <main className="page-shell legal-page">
      <h1>{t('contact.title')}</h1>
      <section className="card">
        <p>{t('contact.lead')}</p>
        <p className="contact-mail">
          <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
        </p>
        <p className="profile-muted">{ownerLine()}</p>
        <p className="profile-muted profile-small">
          {t('contact.faqHint')} <Link to="/faq">{t('footer.faq')}</Link>
        </p>
      </section>
    </main>
  );
}
