import { useState, useEffect } from 'react';
import { MorningRitual } from '../components/molecules/MorningRitual';
import { EveningRitual } from '../components/molecules/EveningRitual';
import { ElayraMessageCard } from '../components/molecules/ElayraMessageCard';
import { generateElayraWisdom, generateElayraEncouragement } from '../services/elayraService';
import { useJournalEntries } from '../hooks/useJournalEntries';
import { useTranslation } from '../i18n/I18nProvider';

export function DailyLightPracticePage() {
  const { t } = useTranslation();
  const { entries } = useJournalEntries();
  const [elayraMessage, setElayraMessage] = useState(generateElayraWisdom(t));
  const [morningComplete, setMorningComplete] = useState(false);
  const [eveningComplete, setEveningComplete] = useState(false);

  useEffect(() => {
    const today = new Date().toDateString();
    const todaysMorning = sessionStorage.getItem(`ritual-morning-${today}`);
    const todaysEvening = sessionStorage.getItem(`ritual-evening-${today}`);

    if (todaysMorning) setMorningComplete(true);
    if (todaysEvening) setEveningComplete(true);
  }, []);

  const handleMorningComplete = (response: string) => {
    const today = new Date().toDateString();
    sessionStorage.setItem(`ritual-morning-${today}`, response);
    setMorningComplete(true);
    setElayraMessage(generateElayraEncouragement(entries.length, t));
  };

  const handleEveningComplete = (response: string) => {
    const today = new Date().toDateString();
    sessionStorage.setItem(`ritual-evening-${today}`, response);
    setEveningComplete(true);
  };

  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - 7);
  const weekEntries = entries.filter((e) => new Date(e.timestamp) >= thisWeekStart);

  return (
    <main className="page-shell">
      <section className="card daily-practice-header">
        <h1>{t('dailyLight.header')}</h1>
        <p className="daily-subtitle">{t('dailyLight.subtitle')}</p>
      </section>

      <ElayraMessageCard message={elayraMessage} />

      <div className="daily-rituals-container">
        {!morningComplete ? (
          <MorningRitual onComplete={handleMorningComplete} />
        ) : (
          <div className="ritual-complete-message">
            <p>{t('dailyLight.morningReady')}</p>
          </div>
        )}

        {!eveningComplete ? (
          <EveningRitual onComplete={handleEveningComplete} />
        ) : (
          <div className="ritual-complete-message">
            <p>{t('dailyLight.eveningReady')}</p>
          </div>
        )}
      </div>
    </main>
  );
}
