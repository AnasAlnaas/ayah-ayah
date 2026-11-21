import { computeStreak, dayCountLabel, type DayLog, pruneLog } from './streak';

const T = 20_000; // "today"
const log = (days: Record<number, number>): DayLog => Object.fromEntries(Object.entries(days).map(([k, v]) => [String(T + Number(k)), v]));

describe('computeStreak', () => {
  it('is zero with no reading', () => {
    expect(computeStreak({}, 20, T).streak).toBe(0);
  });

  it('counts today once the goal is met', () => {
    expect(computeStreak(log({ 0: 20 }), 20, T).streak).toBe(1);
    expect(computeStreak(log({ 0: 19 }), 20, T).streak).toBe(0);
  });

  it('keeps yesterday’s streak alive while today is still in progress', () => {
    expect(computeStreak(log({ [-1]: 20, [-2]: 25, 0: 3 }), 20, T).streak).toBe(2);
  });

  it('forgives one missed day', () => {
    const r = computeStreak(log({ 0: 20, [-1]: 0, [-2]: 20, [-3]: 20 }), 20, T);
    expect(r.streak).toBe(3);
    expect(r.states.get(T - 1)).toBe('free');
  });

  it('forgives a missed yesterday while today is still in progress', () => {
    expect(computeStreak(log({ [-2]: 20, [-3]: 20, 0: 4 }), 20, T).streak).toBe(2);
  });

  it('does not forgive two missed days in a row', () => {
    expect(computeStreak(log({ 0: 20, [-3]: 20 }), 20, T).streak).toBe(1);
  });

  it('forgives at most one day per week', () => {
    // misses on -2 and -5: only 3 days apart, so the second one ends the streak
    expect(computeStreak(log({ 0: 20, [-1]: 20, [-3]: 20, [-4]: 20, [-6]: 20 }), 20, T).streak).toBe(4);
    // misses on -2 and -9: a week apart, both forgiven
    const spaced: Record<number, number> = {};
    for (let d = 0; d >= -12; d--) if (d !== -2 && d !== -9) spaced[d] = 20;
    expect(computeStreak(log(spaced), 20, T).streak).toBe(11);
  });

  it('uses the current goal', () => {
    expect(computeStreak(log({ 0: 15, [-1]: 15 }), 10, T).streak).toBe(2);
  });
});

describe('helpers', () => {
  it('prunes old days', () => {
    expect(Object.keys(pruneLog(log({ 0: 1, [-500]: 1 }), T))).toEqual([String(T)]);
  });

  it.each([
    [1, 'يوم واحد'],
    [2, 'يومان'],
    [3, '٣ أيام'],
    [10, '١٠ أيام'],
    [11, '١١ يومًا'],
    [105, '١٠٥ أيام'],
  ])('%i days → %s', (n, s) => expect(dayCountLabel(n)).toBe(s));
});
