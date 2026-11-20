import { ReactNode } from 'react';
import { useTranslation } from '../../i18n/I18nProvider';
import { LEGAL } from '../../lib/legal';

/** Contenitore comune delle pagine legali (testo in italiano, la lingua del titolare). */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  const { locale } = useTranslation();
  return (
    <main className="page-shell legal-page">
      <h1>{title}</h1>
      <p className="legal-updated">Ultimo aggiornamento: {LEGAL.updated}</p>
      {locale !== 'it' && (
        <p className="legal-lang">This page is in Italian, the language of the service provider. An English copy is available on request.</p>
      )}
      {children}
    </main>
  );
}

export function Mail() {
  return <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>;
}
