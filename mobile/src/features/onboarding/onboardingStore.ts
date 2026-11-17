import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../../api/supabase';
import { useAuthStore } from '../auth/authStore';
import { getLocalDateString } from '../../utils/date';
import {
  calculateTotalOpeningBalance,
  resolveEffectiveStartDate,
  clampStep,
} from './onboardingLogic';

export interface DraftAccount {
  id: string;
  name: string;
  type: 'BANK' | 'UPI' | 'CASH' | 'WALLET';
  opening_balance_paise: number;
  description?: string;
}

export type SmsPreference = 'SMS_ALLOWED' | 'PASTE_OR_MANUAL';

export type StartDateOption = 'TODAY' | 'FIRST_OF_MONTH' | 'CUSTOM';

interface OnboardingState {
  step: number; // 1 to 5
  accounts: DraftAccount[];
  smsPreference: SmsPreference;
  startDateOption: StartDateOption;
  customStartDate: string;
  isSubmitting: boolean;
  error: string | null;

  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  addAccount: (account: Omit<DraftAccount, 'id'>) => void;
  updateAccount: (id: string, partial: Partial<DraftAccount>) => void;
  removeAccount: (id: string) => void;
  setSmsPreference: (pref: SmsPreference) => void;
  setStartDateOption: (option: StartDateOption, customDate?: string) => void;
  getEffectiveStartDate: () => string;
  getTotalOpeningBalancePaise: () => number;
  completeOnboarding: () => Promise<boolean>;
  reset: () => void;
}

const DEFAULT_ACCOUNTS: DraftAccount[] = [
  {
    id: 'draft-acc-1',
    name: 'Primary Bank Account',
    type: 'BANK',
    opening_balance_paise: 0,
    description: 'Savings or salary bank account',
  },
  {
    id: 'draft-acc-2',
    name: 'Cash in Hand',
    type: 'CASH',
    opening_balance_paise: 0,
    description: 'Physical cash for daily spending',
  },
];

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  step: 1,
  accounts: DEFAULT_ACCOUNTS,
  smsPreference: 'PASTE_OR_MANUAL',
  startDateOption: 'TODAY',
  customStartDate: getLocalDateString(),
  isSubmitting: false,
  error: null,

  setStep: (step) => set({ step: clampStep(step, 0) }),
  nextStep: () => set((state) => ({ step: clampStep(state.step, 1) })),
  prevStep: () => set((state) => ({ step: clampStep(state.step, -1) })),

  addAccount: (acc) => {
    const newAcc: DraftAccount = {
      ...acc,
      id: `draft-acc-${Date.now()}`,
    };
    set((state) => ({ accounts: [...state.accounts, newAcc] }));
  },

  updateAccount: (id, partial) => {
    set((state) => ({
      accounts: state.accounts.map((acc) =>
        acc.id === id ? { ...acc, ...partial } : acc
      ),
    }));
  },

  removeAccount: (id) => {
    set((state) => ({
      accounts: state.accounts.filter((acc) => acc.id !== id),
    }));
  },

  setSmsPreference: (smsPreference) => set({ smsPreference }),

  setStartDateOption: (startDateOption, customDate) => {
    set({
      startDateOption,
      customStartDate: customDate || get().customStartDate,
    });
  },

  getEffectiveStartDate: () => {
    const { startDateOption, customStartDate } = get();
    return resolveEffectiveStartDate(startDateOption, customStartDate);
  },

  getTotalOpeningBalancePaise: () => {
    return calculateTotalOpeningBalance(get().accounts);
  },

  completeOnboarding: async () => {
    set({ isSubmitting: true, error: null });
    const { accounts, smsPreference, getEffectiveStartDate } = get();
    const user = useAuthStore.getState().user;

    const startDate = getEffectiveStartDate();
    const smsStatus = smsPreference === 'SMS_ALLOWED' ? 'GRANTED' : 'SKIPPED';

    try {
      if (isSupabaseConfigured && user?.id) {
        // 1. Insert accounts into Supabase
        const accountsToInsert = accounts.map((acc) => ({
          user_id: user.id,
          name: acc.name.trim(),
          type: acc.type,
          opening_balance_paise: acc.opening_balance_paise,
          description: acc.description || null,
        }));

        if (accountsToInsert.length > 0) {
          const { error: accError } = await supabase
            .from('accounts')
            .insert(accountsToInsert);

          if (accError) {
            console.warn('Could not insert accounts:', accError.message);
          }
        }

        // 2. Update user profile
        const { error: profError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            name: user.name || 'User',
            tracking_start_date: startDate,
            sms_permission_status: smsStatus,
            onboarding_done: true,
            updated_at: new Date().toISOString(),
          });

        if (profError) {
          console.warn('Could not update profile:', profError.message);
        }
      }

      set({ isSubmitting: false });
      return true;
    } catch (err: any) {
      set({
        isSubmitting: false,
        error: err?.message || 'Failed to save onboarding data',
      });
      return false;
    }
  },

  reset: () =>
    set({
      step: 1,
      accounts: DEFAULT_ACCOUNTS,
      smsPreference: 'PASTE_OR_MANUAL',
      startDateOption: 'TODAY',
      customStartDate: getLocalDateString(),
      isSubmitting: false,
      error: null,
    }),
}));
