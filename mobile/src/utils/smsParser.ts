import { rupeesToPaise, paiseToRupees } from './money.ts';
import { getLocalDateString } from './date.ts';

export type SmsParseStatus =
  | 'SUCCESS'
  | 'SECURITY_OTP_IGNORED'
  | 'NON_FINANCIAL_IGNORED'
  | 'UNRECOGNIZED_FORMAT';

export interface ParsedSmsResult {
  status: SmsParseStatus;
  rawText: string;
  ignoreReason?: string;
  amountPaise?: number;
  amountRupees?: number;
  direction?: 'DEBIT' | 'CREDIT';
  occurredAt?: string; // ISO 8601 string
  localDate?: string; // YYYY-MM-DD
  timeStr?: string; // e.g. "02:30 PM"
  counterpartyName?: string;
  categoryName?: string;
  accountRef?: string; // e.g. "A/c **4321"
  referenceNumber?: string; // UPI ref / UTR
  balancePaise?: number; // available balance if detected
}

// Security / OTP patterns that must be ignored
const OTP_SECURITY_PATTERNS = [
  /\b(?:otp|one[- ]time[- ]password|verification[- ]code|security[- ]code|secret[- ]code|passcode)\b/i,
  /\b(?:login[- ]otp|auth[- ]code|authorisation[- ]code|authentication[- ]code|2fa)\b/i,
  /\bdo not share (?:this |your )?(?:otp|code|password|pin|credentials)\b/i,
  /\bnever share (?:this |your )?(?:otp|code|password|pin)\b/i,
  /\bvalid (?:for|till) \d+\s*(?:mins?|minutes?|seconds?|secs?)\b/i,
  /\buse code \d{4,8} to (?:verify|login|reset)\b/i,
  /\b(?:google|microsoft|amazon|apple|whatsapp|facebook|instagram|twitter|uber|ola) verification code\b/i,
];

// Non-financial patterns (promotional, telecom alerts, conversational)
const NON_FINANCIAL_PATTERNS = [
  /\b(?:data quota|high[- ]speed data|daily \d+(\.\d+)?\s*(?:gb|mb)|pack expired|plan validity)\b/i,
  /\b(?:free caller tune|pre[- ]approved loan|pre[- ]approved credit|apply now|win up to)\b/i,
  /\b(?:flat \d+% off|use coupon|use code [A-Z0-9_]+ for \d+|cashback voucher)\b/i,
  /\b(?:job alert|interview scheduled|congratulations you won)\b/i,
  /\b(?:courier has been delivered|out for delivery|shipment dispatched)\b/i,
  /\b(?:happy birthday|good morning|hello|hey there|how are you)\b/i,
];

// Month map for flexible parsing
const MONTH_MAP: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

/**
 * Parses an incoming or pasted SMS message to detect:
 * - Transaction amount (in integer paise and rupees)
 * - Direction (DEBIT vs CREDIT)
 * - Transaction date & time
 * - Counterparty/merchant and smart category
 * - Account reference and balance
 *
 * Explicitly ignores security OTPs and non-financial promotional/chat messages.
 */
export function parseFinancialSms(rawText: string): ParsedSmsResult {
  const text = (rawText || '').trim();

  if (!text) {
    return {
      status: 'UNRECOGNIZED_FORMAT',
      rawText: text,
      ignoreReason: 'Message is empty.',
    };
  }

  // 1. Check for Security / OTP messages — HIGHEST PRIORITY: Must be ignored
  for (const pattern of OTP_SECURITY_PATTERNS) {
    if (pattern.test(text)) {
      return {
        status: 'SECURITY_OTP_IGNORED',
        rawText: text,
        ignoreReason:
          'Security OTP or authorization code detected. Cashly ignores non-transactional security verification codes for your privacy and safety.',
      };
    }
  }

  // 2. Check for explicit non-financial alerts (telecom alerts, promotions, spam)
  for (const pattern of NON_FINANCIAL_PATTERNS) {
    if (pattern.test(text)) {
      return {
        status: 'NON_FINANCIAL_IGNORED',
        rawText: text,
        ignoreReason:
          'Non-financial notification detected (telecom quota, promotional advertisement, or general update).',
      };
    }
  }

  // 3. Check for Financial Keywords
  const debitRegex = /\b(?:debited|debited by|debited with|paid|spent|transferred to|withdrawn|purchase of|charged to|dr\.?)\b/i;
  const creditRegex = /\b(?:credited|credited to|credited by|credited with|received|deposited|refund of|added to|cashback of|cr\.?)\b/i;

  const hasDebit = debitRegex.test(text);
  const hasCredit = creditRegex.test(text);

  // If message lacks any financial debit or credit keywords
  if (!hasDebit && !hasCredit) {
    return {
      status: 'NON_FINANCIAL_IGNORED',
      rawText: text,
      ignoreReason:
        'No financial transaction detected. Message does not contain standard debit or credit keywords.',
    };
  }

  // Determine Direction
  let direction: 'DEBIT' | 'CREDIT' = 'DEBIT';
  if (hasCredit && !hasDebit) {
    direction = 'CREDIT';
  } else if (hasDebit && !hasCredit) {
    direction = 'DEBIT';
  } else {
    // Both words might appear (e.g. "credited from a/c ... for debit txn")
    // Check first occurrence index
    const debitIdx = text.search(debitRegex);
    const creditIdx = text.search(creditRegex);
    direction = creditIdx < debitIdx ? 'CREDIT' : 'DEBIT';
  }

  // 4. Extract Amount
  // We must isolate the transaction amount and avoid catching the remaining balance amount.
  // First, extract Available Balance if present so we can exclude it.
  let balancePaise: number | undefined;
  const balMatch = text.match(
    /(?:bal(?:ance)?|avl(?:\.?\s*bal)?|available balance|avail limit|avl limit)\s*(?:is|:)?\s*(?:INR|Rs\.?|₹)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i
  );
  if (balMatch && balMatch[1]) {
    const rawBal = parseFloat(balMatch[1].replace(/,/g, ''));
    if (!isNaN(rawBal)) {
      balancePaise = rupeesToPaise(rawBal);
    }
  }

  let amountPaise: number | undefined;
  let amountRupees: number | undefined;

  // Pattern A: (debited/credited/spent/paid/withdrawn) [by/with/of] (INR/Rs/₹) 1,500.00
  const verbAmountMatch = text.match(
    /(?:debited(?:\s+by|\s+with)?|credited(?:\s+by|\s+with|\s+to)?|paid|spent|withdrawn|refund of|cashback of|purchase of|charged)\s*(?:for\s*)?(?:INR|Rs\.?|₹)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i
  );

  // Pattern B: (INR/Rs/₹) 1,500.00 (debited/credited/spent/paid/transferred)
  const currencyVerbMatch = text.match(
    /(?:INR|Rs\.?|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:is\s*)?(?:debited|credited|spent|paid|withdrawn|transferred)/i
  );

  // Pattern C: General (INR/Rs/₹) 1,500.00 before balance
  const generalCurrencyMatch = text.match(/(?:INR|Rs\.?|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);

  let rawAmountStr: string | null = null;
  if (verbAmountMatch && verbAmountMatch[1]) {
    rawAmountStr = verbAmountMatch[1];
  } else if (currencyVerbMatch && currencyVerbMatch[1]) {
    rawAmountStr = currencyVerbMatch[1];
  } else if (generalCurrencyMatch && generalCurrencyMatch[1]) {
    rawAmountStr = generalCurrencyMatch[1];
  }

  if (rawAmountStr) {
    const cleaned = rawAmountStr.replace(/,/g, '');
    const num = parseFloat(cleaned);
    if (!isNaN(num) && num > 0) {
      amountRupees = num;
      amountPaise = rupeesToPaise(num);
    }
  }

  if (!amountPaise || amountPaise <= 0) {
    return {
      status: 'UNRECOGNIZED_FORMAT',
      rawText: text,
      ignoreReason: 'Could not reliably detect a transaction amount from this message.',
    };
  }

  // 5. Extract Date
  let localDate: string = getLocalDateString();
  let parsedYear: number | undefined;
  let parsedMonth: number | undefined;
  let parsedDay: number | undefined;

  // Date Pattern 1: DD-MM-YY or DD-MM-YYYY or DD/MM/YY or DD/MM/YYYY
  const numDateMatch = text.match(/\b([0-3]?[0-9])[-/]([0-1]?[0-9])[-/](20\d{2}|\d{2})\b/);
  // Date Pattern 2: 03-Nov-26 or 03 Nov 2026 or 03Nov26 or 03-Nov-2026
  const alphaDateMatch = text.match(
    /\b([0-3]?[0-9])[- ]?([A-Za-z]{3,9})[- ]?(20\d{2}|\d{2})\b/
  );

  if (alphaDateMatch) {
    const day = parseInt(alphaDateMatch[1], 10);
    const monthKey = alphaDateMatch[2].toLowerCase();
    let yr = parseInt(alphaDateMatch[3], 10);
    if (yr < 100) yr += 2000;
    const m = MONTH_MAP[monthKey];
    if (m && day >= 1 && day <= 31) {
      parsedDay = day;
      parsedMonth = m;
      parsedYear = yr;
      localDate = `${yr}-${m.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }
  } else if (numDateMatch) {
    const day = parseInt(numDateMatch[1], 10);
    const m = parseInt(numDateMatch[2], 10);
    let yr = parseInt(numDateMatch[3], 10);
    if (yr < 100) yr += 2000;
    if (m >= 1 && m <= 12 && day >= 1 && day <= 31) {
      parsedDay = day;
      parsedMonth = m;
      parsedYear = yr;
      localDate = `${yr}-${m.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }
  }

  // 6. Extract Time
  let timeStr = '12:00 PM';
  let hour = 12;
  let minute = 0;
  let second = 0;

  // Time patterns: "at 14:32:10", "at 04:45 PM", "10:15 AM", "14:22:15"
  const timeMatch = text.match(/\b([0-1]?[0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?\s*(AM|PM|am|pm)?\b/);
  if (timeMatch) {
    let h = parseInt(timeMatch[1], 10);
    const m = parseInt(timeMatch[2], 10);
    const s = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
    const ampm = timeMatch[4] ? timeMatch[4].toUpperCase() : null;

    if (ampm) {
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      timeStr = `${(h % 12 || 12).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
    } else {
      timeStr = `${(h % 12 || 12).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
    }
    hour = h;
    minute = m;
    second = s;
  }

  // Combine into ISO 8601 occurredAt
  let occurredAt: string;
  try {
    const yr = parsedYear || parseInt(localDate.split('-')[0], 10);
    const mo = parsedMonth || parseInt(localDate.split('-')[1], 10);
    const dy = parsedDay || parseInt(localDate.split('-')[2], 10);
    const dObj = new Date(Date.UTC(yr, mo - 1, dy, hour, minute, second));
    occurredAt = dObj.toISOString();
  } catch {
    occurredAt = new Date().toISOString();
  }

  // 7. Extract Counterparty / Merchant
  let counterpartyName: string | undefined;

  // Patterns for VPA or merchant names
  // Pattern 1: to VPA xxx@xxx
  const vpaMatch = text.match(/\bto\s+VPA\s+([A-Za-z0-9.\-_@]+)/i);
  // Pattern 2: Info: UPI*Merchant* or Info: UPI-Merchant-
  const infoMatch = text.match(/info:\s*UPI[*-]([A-Za-z0-9 &._-]+?)[*-]/i);
  // Pattern 3: UPI/CR/xxx/Merchant or UPI/DR/xxx/Merchant
  const upiSlashMatch = text.match(/UPI\/(?:CR|DR)\/[0-9]+\/([A-Za-z0-9 &._-]+)/i);
  // Pattern 4: at <Merchant> (e.g. at BHARAT PETROLEUM. or at STARBUCKS)
  const atMatch = text.match(/\bat\s+([A-Za-z0-9 &._'-]{2,35}?)(?=[.,;!?]|\s+(?:on|via|using|at|\(|ref|bal|avail|avl|$)|$)/i);
  // Pattern 5: to / paid to <Name>
  const toMatch = text.match(/\b(?:paid to|to)\s+([A-Za-z0-9 &._'-]{2,35}?)(?=[.,;!?]|\s+(?:on|via|using|at|\(|ref|bal|avail|avl|$)|$)/i);
  // Pattern 6: from <Name>
  const fromMatch = text.match(/\bfrom\s+([A-Za-z0-9 &._'-]{2,35}?)(?=[.,;!?]|\s+(?:on|via|using|at|\(|ref|bal|avail|avl|$)|$)/i);

  const isValidEntity = (s?: string) => {
    if (!s) return false;
    const trimmed = s.trim();
    // Exclude times like "11:30 AM", accounts, VPAs, card
    if (/^(?:[0-9]{1,2}:[0-9]{2}|a\/c|account|card|vpa|inr|rs\.?|₹)/i.test(trimmed)) return false;
    if (trimmed.length < 2) return false;
    return true;
  };

  if (vpaMatch && vpaMatch[1]) {
    // e.g. swiggy@icici -> "Swiggy"
    const handle = vpaMatch[1].split('@')[0];
    counterpartyName = formatEntityName(handle);
  } else if (infoMatch && infoMatch[1]) {
    counterpartyName = formatEntityName(infoMatch[1]);
  } else if (upiSlashMatch && upiSlashMatch[1]) {
    counterpartyName = formatEntityName(upiSlashMatch[1]);
  } else if (atMatch && isValidEntity(atMatch[1])) {
    counterpartyName = formatEntityName(atMatch[1]);
  } else if (toMatch && isValidEntity(toMatch[1])) {
    counterpartyName = formatEntityName(toMatch[1]);
  } else if (fromMatch && isValidEntity(fromMatch[1])) {
    counterpartyName = formatEntityName(fromMatch[1]);
  }

  // Default counterparty fallback
  if (!counterpartyName) {
    counterpartyName = direction === 'DEBIT' ? 'Card / UPI Expense' : 'Bank Credit';
  }

  // 8. Extract Account Reference
  let accountRef: string | undefined;
  const accMatch = text.match(/\b(?:A\/c|account|card)\s*(?:no\.?)?\s*(?:ending\s*)?(?:with\s*)?([*xX0-9]{3,16})\b/i);
  if (accMatch && accMatch[1]) {
    accountRef = `A/c ${accMatch[1].toUpperCase()}`;
  }

  // 9. Extract Reference Number (UPI / UTR)
  let referenceNumber: string | undefined;
  const refMatch = text.match(/\b(?:UPI\s*Ref(?:\s*no\.?)?|Ref\s*no\.?|UTR(?:\s*no\.?)?)\s*[:#]?\s*([0-9A-Za-z]{6,20})\b/i);
  if (refMatch && refMatch[1]) {
    referenceNumber = refMatch[1];
  }

  // 10. Infer Category
  const categoryName = inferCategory(counterpartyName, text, direction);

  return {
    status: 'SUCCESS',
    rawText: text,
    amountPaise,
    amountRupees,
    direction,
    occurredAt,
    localDate,
    timeStr,
    counterpartyName,
    categoryName,
    accountRef,
    referenceNumber,
    balancePaise,
  };
}

/**
 * Clean up raw counterparty strings into neat title-cased names
 */
function formatEntityName(raw: string): string {
  let cleaned = raw
    .replace(/[._\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // If uppercase, title-case words
  return cleaned
    .split(' ')
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ''))
    .join(' ');
}

/**
 * Intelligent categorization based on counterparty and message context
 */
function inferCategory(
  counterparty: string,
  fullText: string,
  direction: 'DEBIT' | 'CREDIT'
): string {
  if (direction === 'CREDIT') {
    const lower = `${counterparty} ${fullText}`.toLowerCase();
    if (lower.includes('salary') || lower.includes('payroll') || lower.includes('stipend')) {
      return 'Salary';
    }
    if (lower.includes('interest') || lower.includes('dividend') || lower.includes('mutual fund')) {
      return 'Investment';
    }
    if (lower.includes('refund')) {
      return 'Refund';
    }
    return 'Other';
  }

  const lower = `${counterparty} ${fullText}`.toLowerCase();

  // Food & Dining
  if (
    lower.includes('swiggy') ||
    lower.includes('zomato') ||
    lower.includes('restaurant') ||
    lower.includes('cafe') ||
    lower.includes('coffee') ||
    lower.includes('starbucks') ||
    lower.includes('mess') ||
    lower.includes('bakery') ||
    lower.includes('mcdonalds') ||
    lower.includes('burger') ||
    lower.includes('pizza') ||
    lower.includes('tea') ||
    lower.includes('chai') ||
    lower.includes('dining') ||
    lower.includes('hotel')
  ) {
    return 'Food & Dining';
  }

  // Transport & Fuel
  if (
    lower.includes('uber') ||
    lower.includes('ola') ||
    lower.includes('rapido') ||
    lower.includes('metro') ||
    lower.includes('petrol') ||
    lower.includes('fuel') ||
    lower.includes('diesel') ||
    lower.includes('bharat petroleum') ||
    lower.includes('hpcl') ||
    lower.includes('bpcl') ||
    lower.includes('indian oil') ||
    lower.includes('irctc') ||
    lower.includes('fastag') ||
    lower.includes('toll')
  ) {
    return 'Transport';
  }

  // Groceries
  if (
    lower.includes('blinkit') ||
    lower.includes('zepto') ||
    lower.includes('instamart') ||
    lower.includes('bigbasket') ||
    lower.includes('grocer') ||
    lower.includes('supermarket') ||
    lower.includes('dmart') ||
    lower.includes('nature basket') ||
    lower.includes('provision') ||
    lower.includes('mart')
  ) {
    return 'Groceries';
  }

  // Bills & Utilities
  if (
    lower.includes('electricity') ||
    lower.includes('bescom') ||
    lower.includes('tneb') ||
    lower.includes('airtel') ||
    lower.includes('jio') ||
    lower.includes('vodafone') ||
    lower.includes('recharge') ||
    lower.includes('broadband') ||
    lower.includes('wifi') ||
    lower.includes('gas') ||
    lower.includes('water') ||
    lower.includes('bill')
  ) {
    return 'Bills & Utilities';
  }

  // Shopping
  if (
    lower.includes('amazon') ||
    lower.includes('flipkart') ||
    lower.includes('myntra') ||
    lower.includes('ajio') ||
    lower.includes('zara') ||
    lower.includes('h&m') ||
    lower.includes('croma') ||
    lower.includes('reliance digital') ||
    lower.includes('retail') ||
    lower.includes('mall') ||
    lower.includes('clothing')
  ) {
    return 'Shopping';
  }

  // Entertainment
  if (
    lower.includes('bookmyshow') ||
    lower.includes('netflix') ||
    lower.includes('spotify') ||
    lower.includes('hotstar') ||
    lower.includes('prime') ||
    lower.includes('pvr') ||
    lower.includes('inox') ||
    lower.includes('movie') ||
    lower.includes('cinema') ||
    lower.includes('gaming')
  ) {
    return 'Entertainment';
  }

  // Health
  if (
    lower.includes('pharmacy') ||
    lower.includes('apollo') ||
    lower.includes('medplus') ||
    lower.includes('1mg') ||
    lower.includes('hospital') ||
    lower.includes('clinic') ||
    lower.includes('doctor') ||
    lower.includes('diagnostic') ||
    lower.includes('lab')
  ) {
    return 'Health';
  }

  return 'Other';
}
