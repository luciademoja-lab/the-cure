import { useEffect, useState } from 'react';
import { MorningRitual } from '../components/molecules/MorningRitual';
import { EveningRitual } from '../components/molecules/EveningRitual';
import { ElayraMessageCard } from '../components/molecules/ElayraMessageCard';
import { generateElayraWisdom, generateElayraEncouragement } from '../services/elayraService';
import { useJournalEntries } from '../hooks/useJournalEntries';
import { useTranslation } from '../i18n/I18nProvider';
import { useAuth } from '../contexts/AuthContext';
import { apiGet, apiPost } from '../lib/api';

type RitualKind = 'morning' | 'evening';
type SavedRitual = { kind: RitualKind; day: string; response: string; light_points: number };

/** Il giorno secondo l'orologio di chi usa l'app, come YYYY-MM-DD. */
export function localDay(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function DailyLightPracticePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { entries } = useJournalEntries(user?.id);
  const [elayraMessage, setElayraMessage] = useState(() => generateElayraWisdom(t));
  const [saved, setSaved] = useState<Record<RitualKind, SavedRitual | null>>({ morning: null, evening: null });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    apiGet<{ morning: SavedRitual | null; evening: SavedRitual | null }>(`/api/rituals?day=${localDay()}`)
      .then((data) => {
        if (active) setSaved({ morning: data.morning, evening: data.evening });
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : t('chat.error.generic'));
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const complete = async (kind: RitualKind, response: string) => {
    const text = (response || '').trim();
    if (!text) {
      setError(t('dailyLight.errors.empty'));
      return;
    }
    setError('');
    try {
      const { ritual } = await apiPost<{ ritual: SavedRitual }>('/api/rituals', { kind, day: localDay(), response: text });
      setSaved((prev) => ({ ...prev, [kind]: ritual }));
      if (kind === 'morning') setElayraMessage(generateElayraEncouragement(entries.length, t));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('chat.error.generic'));
    }
  };

  const done = (kind: RitualKind, messageKey: string) => (
    <div className="ritual-complete-message">
      <p>{t(messageKey)}</p>
      <blockquote className="ritual-saved-response">{saved[kind]?.response}</blockquote>
      <p className="ritual-points">{t('dailyLight.points', { points: saved[kind]?.light_points ?? 0 })}</p>
    </div>
  );

  return (
    <main className="page-shell">
      <section className="card daily-practice-header">
        <h1>{t('dailyLight.header')}</h1>
        <p className="daily-subtitle">{t('dailyLight.subtitle')}</p>
      </section>

      <ElayraMessageCard message={elayraMessage} />

      {error && (
        <p className="page-error" role="alert">
          {error}
        </p>
      )}

      <div className="daily-rituals-container">
        {saved.morning ? done('morning', 'dailyLight.morningReady') : <MorningRitual onComplete={(r) => complete('morning', r)} />}
        {saved.evening ? done('evening', 'dailyLight.eveningReady') : <EveningRitual onComplete={(r) => complete('evening', r)} />}
      </div>
    </main>
  );
}
