import { getLocalDateString } from '../../utils/date.ts';

export type StartDateOption = 'TODAY' | 'FIRST_OF_MONTH' | 'CUSTOM';

export interface DraftAccountLike {
  opening_balance_paise?: number;
}

export function calculateTotalOpeningBalance(accounts: DraftAccountLike[]): number {
  return accounts.reduce((sum, acc) => sum + (acc.opening_balance_paise || 0), 0);
}

export function resolveEffectiveStartDate(
  option: StartDateOption,
  customDate?: string,
  referenceDate: Date = new Date()
): string {
  if (option === 'TODAY') {
    return getLocalDateString(referenceDate);
  }
  if (option === 'FIRST_OF_MONTH') {
    const firstOfMonth = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      1
    );
    return getLocalDateString(firstOfMonth);
  }
  return customDate || getLocalDateString(referenceDate);
}

export function clampStep(current: number, delta: number): number {
  const next = current + delta;
  if (next < 1) return 1;
  if (next > 5) return 5;
  return next;
}
