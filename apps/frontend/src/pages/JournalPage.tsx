import { EntryEditor } from '../components/organisms/EntryEditor';
import { useTranslation } from '../i18n/I18nProvider';

/**
 * La pagina Elayra: la conversazione di oggi. Ogni giorno riparte vuota;
 * a mezzanotte quella del giorno diventa da sola una pagina del Diario.
 */
export function JournalPage() {
  const { t } = useTranslation();
  return (
    <main className="page-shell">
      <h1>{t('nav.journal')}</h1>
      <EntryEditor />
    </main>
  );
}
