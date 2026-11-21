import { formatNumber, type Numerals } from './arabic';

/** Ayahs read per local day, keyed by day number (days since 1970-01-01, local time). */
export type DayLog = Record<string, number>;

export type DayState = 'met' | 'free' | 'missed' | 'pending';

/** A missed day is forgiven at most once in any 7 days. */
const FREE_WINDOW = 7;

export function dayNumber(date = new Date()): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

/**
 * Walks back from today. Today only counts once the goal is met; until then the
 * streak shows what yesterday left you with. A single missed day is forgiven
 * (a "free day") if no other free day was used in the 7 days after it.
 */
export function computeStreak(log: DayLog, goal: number, today: number): { streak: number; states: Map<number, DayState> } {
  const states = new Map<number, DayState>();
  const met = (d: number) => (log[d] ?? 0) >= goal;
  const firstDay = Math.min(...Object.keys(log).map(Number), today);

  let streak = 0;
  let lastFree = Infinity;
  let day = today;
  if (met(today)) {
    states.set(today, 'met');
    streak = 1;
  } else {
    states.set(today, 'pending');
  }
  day = today - 1;

  while (day >= firstDay) {
    if (met(day)) {
      states.set(day, 'met');
      streak++;
    } else if (lastFree - day >= FREE_WINDOW && met(day - 1) && (streak > 0 || day === today - 1)) {
      // Forgiven only between two read days, so a gap of two days still ends it.
      states.set(day, 'free');
      lastFree = day;
    } else {
      break;
    }
    day--;
  }
  // Days before the streak broke are simply missed (for the week strip).
  for (let d = today - 6; d < today; d++) if (!states.has(d)) states.set(d, met(d) ? 'met' : 'missed');
  return { streak, states };
}

/** Keeps the log small: only the last 400 days. */
export function pruneLog(log: DayLog, today: number): DayLog {
  const out: DayLog = {};
  for (const [k, v] of Object.entries(log)) if (Number(k) > today - 400) out[k] = v;
  return out;
}

/** ١ يوم · يومان · ٣–١٠ أيام · ١١ يومًا … (last two digits decide above 100) */
export function dayCountLabel(count: number, numerals: Numerals = 'arabic'): string {
  if (count === 1) return 'يوم واحد';
  if (count === 2) return 'يومان';
  const lastTwo = count % 100;
  const noun = lastTwo >= 3 && lastTwo <= 10 ? 'أيام' : 'يومًا';
  return `${formatNumber(count, numerals)} ${noun}`;
}
