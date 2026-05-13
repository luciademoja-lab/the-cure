import { JournalEntry } from '../../types/journal';
import { useTranslation } from '../../i18n/I18nProvider';

type EntryListProps = {
  entries: JournalEntry[];
  onSelectEntry?: (entry: JournalEntry) => void;
};

export function EntryList({ entries, onSelectEntry }: EntryListProps) {
  const { t } = useTranslation();

  const getMoodEmoji = (mood: number) => {
    if (mood <= 3) return '🌧️';
    if (mood <= 5) return '🌙';
    if (mood <= 7) return '☀️';
    return '✨';
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${weekday} ${day}/${month}`;
  };

  if (entries.length === 0) {
    return (
      <div className="entry-list-empty">
        <p>{t('entryList.empty')}</p>
      </div>
    );
  }

  return (
    <div className="entry-list">
      <h3>{t('entryList.heading')}</h3>
      <div className="entries-container">
        {entries.map((entry) => (
          <article
            key={entry.id}
            className="entry-item"
            onClick={() => onSelectEntry?.(entry)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSelectEntry?.(entry);
            }}
          >
            <div className="entry-header">
              <span className="entry-date">{formatDate(entry.timestamp)}</span>
              <span className="entry-mood">{getMoodEmoji(entry.mood)}</span>
            </div>
            <p className="entry-preview">{entry.content.substring(0, 120)}...</p>
            {entry.aiTags.length > 0 && (
              <div className="entry-tags">
                {entry.aiTags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
