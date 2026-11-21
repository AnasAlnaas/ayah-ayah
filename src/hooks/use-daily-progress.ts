import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { useAppStore } from '@/store/app-store';
import { computeStreak, type DayState, dayNumber } from '@/utils/streak';

export type DailyProgress = {
  goal: number;
  readToday: number;
  done: boolean;
  streak: number;
  /** The last 7 days, oldest first, ending today */
  week: { day: number; state: DayState; count: number }[];
};

/** Today's reading, the streak and the week strip. Re-checks the date when the app comes back. */
export function useDailyProgress(): DailyProgress {
  const goal = useAppStore((s) => s.dailyGoal);
  const log = useAppStore((s) => s.readLog);
  const [today, setToday] = useState(dayNumber);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setToday(dayNumber());
    });
    return () => sub.remove();
  }, []);

  return useMemo(() => {
    const { streak, states } = computeStreak(log, goal, today);
    const readToday = log[today] ?? 0;
    const week = Array.from({ length: 7 }, (_, i) => {
      const day = today - 6 + i;
      return { day, state: states.get(day) ?? 'missed', count: log[day] ?? 0 };
    });
    return { goal, readToday, done: readToday >= goal, streak, week };
  }, [log, goal, today]);
}
