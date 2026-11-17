/**
 * Money utilities for Cashly
 * Strict Rule: Money is always stored as integer paise (1 INR = 100 paise).
 * Floating-point arithmetic on currency is strictly prohibited.
 */

export interface FormatMoneyOptions {
  showSymbol?: boolean;
  showPaise?: boolean;
  signDisplay?: 'never' | 'auto' | 'always';
}

/**
 * Converts integer paise to decimal rupees.
 * @example paiseToRupees(12550) => 125.5
 */
export function paiseToRupees(paise: number): number {
  if (!Number.isFinite(paise)) return 0;
  return paise / 100;
}

/**
 * Converts decimal or whole rupees to integer paise safely without floating point drift.
 * @example rupeesToPaise(125.5) => 12550
 */
export function rupeesToPaise(rupees: number): number {
  if (!Number.isFinite(rupees)) return 0;
  return Math.round(rupees * 100);
}

/**
 * Parses user input string (e.g. "1,250.50" or "500") into integer paise.
 * Returns 0 if invalid.
 */
export function parseRupeesInput(input: string): number {
  if (!input) return 0;
  const sanitized = input.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(sanitized);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

/**
 * Formats a whole number part into the Indian Numbering System:
 * - The rightmost 3 digits are grouped, preceding digits are grouped in pairs of 2.
 * @example formatIndianGrouping("1234567") => "12,34,567"
 */
export function formatIndianGrouping(intString: string): string {
  if (intString.length <= 3) return intString;
  const lastThree = intString.slice(-3);
  const remaining = intString.slice(0, -3);
  const formattedRemaining = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${formattedRemaining},${lastThree}`;
}

/**
 * Formats integer paise into Indian Rupee string: ₹1,23,456.00 or ₹1,23,456
 * @param paise Integer paise amount
 * @param options Display options
 */
export function formatIndianRupees(
  paise: number,
  options: FormatMoneyOptions = {}
): string {
  const {
    showSymbol = true,
    showPaise = true,
    signDisplay = 'auto',
  } = options;

  if (!Number.isFinite(paise)) {
    paise = 0;
  }

  const isNegative = paise < 0;
  const absolutePaise = Math.abs(Math.round(paise));

  const wholeRupees = Math.floor(absolutePaise / 100);
  const paiseRemainder = absolutePaise % 100;

  const wholeRupeesString = formatIndianGrouping(wholeRupees.toString());
  const paiseString = paiseRemainder.toString().padStart(2, '0');

  let formattedNumber = showPaise
    ? `${wholeRupeesString}.${paiseString}`
    : wholeRupeesString;

  const symbol = showSymbol ? '₹' : '';

  let signPrefix = '';
  if (isNegative) {
    signPrefix = '-';
  } else if (signDisplay === 'always' && paise > 0) {
    signPrefix = '+';
  }

  return `${signPrefix}${symbol}${formattedNumber}`;
}

/**
 * Formats paise with a mandatory sign for transaction displays (+₹500 / -₹250).
 */
export function formatSignedPaise(
  paise: number,
  direction?: 'CREDIT' | 'DEBIT',
  options: Omit<FormatMoneyOptions, 'signDisplay'> = {}
): string {
  const absPaise = Math.abs(paise);
  const isCredit = direction ? direction === 'CREDIT' : paise > 0;
  const isDebit = direction ? direction === 'DEBIT' : paise < 0;

  const prefix = isCredit ? '+' : isDebit ? '-' : '';
  const formatted = formatIndianRupees(absPaise, {
    ...options,
    signDisplay: 'never',
  });

  return `${prefix}${formatted}`;
}

