import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/I18nProvider';

type Group = { title: string; items: string[] };

/** Domande frequenti: come si usa Elayra e perché ha senso raccontarle ciò che si sente e si sogna. */
const GROUPS: Group[] = [
  { title: 'faq.group.why', items: ['why1', 'why2', 'why3', 'why4'] },
  { title: 'faq.group.how', items: ['how1', 'how2', 'how3', 'how4', 'how5', 'how6', 'how7'] },
  { title: 'faq.group.forge', items: ['forge1', 'forge2', 'forge3', 'forge4'] },
  { title: 'faq.group.account', items: ['acc1', 'acc2', 'acc3', 'acc4', 'acc5', 'acc6'] },
];

export function FaqPage() {
  const { t } = useTranslation();
  return (
    <main className="page-shell faq-page">
      <h1>{t('faq.title')}</h1>
      <p className="forge-lead">{t('faq.lead')}</p>
      {GROUPS.map((g) => (
        <section key={g.title} className="faq-group" aria-labelledby={g.title}>
          <h2 id={g.title}>{t(g.title)}</h2>
          {g.items.map((id) => (
            <details key={id} className="faq-item">
              <summary>{t(`faq.${id}.q`)}</summary>
              <p>{t(`faq.${id}.a`)}</p>
            </details>
          ))}
        </section>
      ))}
      <p className="faq-more">
        {t('faq.more')} <Link to="/contatti">{t('footer.contact')}</Link>
      </p>
    </main>
  );
}
