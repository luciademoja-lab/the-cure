import { useState } from 'react';
import { EntryEditor } from '../components/organisms/EntryEditor';
import { EntryList } from '../components/organisms/EntryList';
import { EntryModal } from '../components/molecules/EntryModal';
import { useJournalEntries } from '../hooks/useJournalEntries';
import { useTranslation } from '../i18n/I18nProvider';
import { JournalEntry } from '../types/journal';

export function JournalPage() {
  const { t } = useTranslation();
  const { entries, addEntry } = useJournalEntries();
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  return (
    <main className="page-shell">
      <h1>{t('nav.journal')}</h1>
      <EntryEditor onSave={addEntry} />
      <EntryList entries={entries} onSelectEntry={setSelectedEntry} />
      
      {selectedEntry && (
        <EntryModal 
          entry={selectedEntry} 
          onClose={() => setSelectedEntry(null)} 
        />
      )}
    </main>
  );
}
