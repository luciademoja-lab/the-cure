import { ReactNode } from 'react';
import { useTranslation } from '../../i18n/I18nProvider';
import { LEGAL } from '../../lib/legal';

/** Contenitore comune delle pagine legali, in italiano e in inglese. In caso di dubbio vale l'italiano. */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  const { locale } = useTranslation();
  const it = locale === 'it';
  const updated = new Date(LEGAL.updated).toLocaleDateString(it ? 'it-IT' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return (
    <main className="page-shell legal-page">
      <h1>{title}</h1>
      <p className="legal-updated">
        {it ? 'Ultimo aggiornamento' : 'Last updated'}: {updated}
      </p>
      {!it && (
        <p className="legal-lang">
          This is an English translation. If the two versions differ, the Italian version prevails.
        </p>
      )}
      {children}
    </main>
  );
}

export function Mail() {
  return <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>;
}
