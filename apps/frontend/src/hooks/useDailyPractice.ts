import { useState, useEffect } from 'react';
import { DailyRitual, DailyPracticeData } from '../types/dailyPractice';

const DAILY_PRACTICE_STORAGE_KEY = 'the-cure-daily-practice';

export function useDailyPractice() {
  const [monthlyData, setMonthlyData] = useState<DailyPracticeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(DAILY_PRACTICE_STORAGE_KEY);
    if (saved) {
      try {
        setMonthlyData(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load daily practice data:', e);
      }
    }
    setIsLoading(false);
  }, []);

  const getTodaysPractice = (): DailyPracticeData => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return monthlyData.find((d) => new Date(d.date).toDateString() === today.toDateString()) || { date: new Date() };
  };

  const saveMorningRitual = (ritual: DailyRitual) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toDateString();

    const updated = monthlyData.filter((d) => new Date(d.date).toDateString() !== todayStr);
    const todayData = getTodaysPractice();

    const newData: DailyPracticeData = {
      ...todayData,
      date: today,
      morningRitual: ritual,
    };

    const newMonthly = [...updated, newData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setMonthlyData(newMonthly);
    localStorage.setItem(DAILY_PRACTICE_STORAGE_KEY, JSON.stringify(newMonthly));
  };

  const saveEveningRitual = (ritual: DailyRitual) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toDateString();

    const updated = monthlyData.filter((d) => new Date(d.date).toDateString() !== todayStr);
    const todayData = getTodaysPractice();

    const newData: DailyPracticeData = {
      ...todayData,
      date: today,
      eveningRitual: ritual,
    };

    const newMonthly = [...updated, newData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setMonthlyData(newMonthly);
    localStorage.setItem(DAILY_PRACTICE_STORAGE_KEY, JSON.stringify(newMonthly));
  };

  return { monthlyData, isLoading, getTodaysPractice, saveMorningRitual, saveEveningRitual };
}
