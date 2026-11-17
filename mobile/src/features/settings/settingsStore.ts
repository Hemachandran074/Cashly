import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../../api/supabase.ts';
import { useAuthStore } from '../auth/authStore.ts';
import type { Account, Category } from '../../types/domain.ts';
import { getLocalDateString } from '../../utils/date.ts';
import { useTransactionStore } from '../transactions/transactionStore.ts';

export type ThemeMode = 'dark' | 'light';
export type CardStylePreference = 'white' | 'black';

interface SettingsState {
  name: string;
  trackingStartDate: string;
  smsPermissionStatus: 'GRANTED' | 'SKIPPED' | 'NOT_REQUESTED';
  themeMode: ThemeMode;
  homeCardStyle: CardStylePreference;
  accounts: Account[];
  customCategories: Category[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadSettings: () => Promise<void>;
  updateName: (newName: string) => Promise<boolean>;
  updateTrackingStartDate: (newDate: string) => Promise<boolean>;
  updateSmsPermission: (status: 'GRANTED' | 'SKIPPED') => Promise<boolean>;
  setThemeMode: (mode: ThemeMode) => void;
  setHomeCardStyle: (style: CardStylePreference) => void;
  addAccount: (acc: {
    name: string;
    type: Account['type'];
    opening_balance_paise: number;
    description?: string;
  }) => Promise<boolean>;
  updateAccount: (
    id: string,
    partial: { name?: string; type?: Account['type']; opening_balance_paise?: number }
  ) => Promise<boolean>;
  deleteAccount: (id: string) => Promise<boolean>;
  addCustomCategory: (
    name: string,
    icon: string,
    kind: 'EXPENSE' | 'INCOME'
  ) => Promise<boolean>;
  exportDataJson: () => string;
}

const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: 'acc-1',
    user_id: 'user-1',
    name: 'Primary Bank Account',
    type: 'BANK',
    opening_balance_paise: 724000, // ₹7,240.00 (balances to ₹5,000 with seed ledger transactions)
    current_balance_paise: 500000,
    archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'acc-2',
    user_id: 'user-1',
    name: 'Cash in Hand',
    type: 'CASH',
    opening_balance_paise: 0,
    current_balance_paise: 0,
    archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const useSettingsStore = create<SettingsState>((set, get) => ({
  name: 'Chandru',
  trackingStartDate: getLocalDateString(),
  smsPermissionStatus: 'GRANTED',
  themeMode: 'dark', // Whole app appearance theme ('dark' | 'light')
  homeCardStyle: 'white', // Inverted (vice-versa) by default in dark mode
  accounts: DEFAULT_ACCOUNTS,
  customCategories: [],
  isLoading: false,
  error: null,

  loadSettings: async () => {
    set({ isLoading: true, error: null });
    const user = useAuthStore.getState().user;

    if (user?.name) {
      set({ name: user.name });
    }

    if (!isSupabaseConfigured || !user?.id) {
      set({ isLoading: false });
      return;
    }

    try {
      // 1. Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        set({
          name: profile.name || user.name || 'Chandru',
          trackingStartDate: profile.tracking_start_date || getLocalDateString(),
          smsPermissionStatus: profile.sms_permission_status || 'GRANTED',
        });
      }

      // 2. Fetch user accounts
      const { data: accountsData } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('archived', false)
        .order('created_at', { ascending: true });

      if (accountsData && accountsData.length > 0) {
        set({ accounts: accountsData as Account[] });
      }

      // 3. Fetch custom categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (categoriesData) {
        set({ customCategories: categoriesData as Category[] });
      }

      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err?.message, isLoading: false });
    }
  },

  updateName: async (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return false;

    set({ name: trimmed });
    const user = useAuthStore.getState().user;

    // Update in authStore
    if (user) {
      useAuthStore.setState({
        user: { ...user, name: trimmed },
      });
    }

    if (isSupabaseConfigured && user?.id) {
      try {
        await supabase
          .from('profiles')
          .update({ name: trimmed, updated_at: new Date().toISOString() })
          .eq('id', user.id);
        await supabase.auth.updateUser({
          data: { name: trimmed },
        });
      } catch (err) {
        console.warn('Profile update error:', err);
      }
    }
    return true;
  },

  updateTrackingStartDate: async (newDate: string) => {
    set({ trackingStartDate: newDate });
    const user = useAuthStore.getState().user;

    if (isSupabaseConfigured && user?.id) {
      try {
        await supabase
          .from('profiles')
          .update({
            tracking_start_date: newDate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
      } catch (err) {
        console.warn('Tracking date update error:', err);
      }
    }
    return true;
  },

  updateSmsPermission: async (status: 'GRANTED' | 'SKIPPED') => {
    set({ smsPermissionStatus: status });
    const user = useAuthStore.getState().user;

    if (isSupabaseConfigured && user?.id) {
      try {
        await supabase
          .from('profiles')
          .update({
            sms_permission_status: status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
      } catch (err) {
        console.warn('SMS permission update error:', err);
      }
    }
    return true;
  },

  setThemeMode: (mode: ThemeMode) => {
    set({
      themeMode: mode,
      homeCardStyle: mode === 'light' ? 'black' : 'white',
    });
  },

  setHomeCardStyle: (style: CardStylePreference) => {
    set({ homeCardStyle: style });
  },

  addAccount: async (acc) => {
    const user = useAuthStore.getState().user;
    const newAccount: Account = {
      id: `acc-${Date.now()}`,
      user_id: user?.id || 'user-1',
      name: acc.name.trim(),
      type: acc.type,
      opening_balance_paise: acc.opening_balance_paise,
      current_balance_paise: acc.opening_balance_paise,
      description: acc.description || null,
      archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    set((state) => ({ accounts: [...state.accounts, newAccount] }));

    if (isSupabaseConfigured && user?.id) {
      try {
        const { data } = await supabase
          .from('accounts')
          .insert({
            user_id: user.id,
            name: acc.name.trim(),
            type: acc.type,
            opening_balance_paise: acc.opening_balance_paise,
            description: acc.description || null,
          })
          .select()
          .single();

        if (data) {
          set((state) => ({
            accounts: state.accounts.map((a) =>
              a.id === newAccount.id ? (data as Account) : a
            ),
          }));
        }
      } catch (err) {
        console.warn('Add account Supabase error:', err);
      }
    }
    return true;
  },

  updateAccount: async (id, partial) => {
    set((state) => ({
      accounts: state.accounts.map((acc) =>
        acc.id === id ? { ...acc, ...partial } : acc
      ),
    }));

    const user = useAuthStore.getState().user;
    if (isSupabaseConfigured && user?.id) {
      try {
        await supabase
          .from('accounts')
          .update({ ...partial, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', user.id);
      } catch (err) {
        console.warn('Update account error:', err);
      }
    }
    return true;
  },

  deleteAccount: async (id) => {
    set((state) => ({
      accounts: state.accounts.filter((acc) => acc.id !== id),
    }));

    const user = useAuthStore.getState().user;
    if (isSupabaseConfigured && user?.id) {
      try {
        await supabase
          .from('accounts')
          .update({ archived: true, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', user.id);
      } catch (err) {
        console.warn('Archive account error:', err);
      }
    }
    return true;
  },

  addCustomCategory: async (name, icon, kind) => {
    const user = useAuthStore.getState().user;
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: name.trim(),
      icon,
      kind,
      is_system: false,
    };

    set((state) => ({ customCategories: [...state.customCategories, newCat] }));

    if (isSupabaseConfigured && user?.id) {
      try {
        await supabase.from('categories').insert({
          user_id: user.id,
          name: name.trim(),
          icon,
          kind,
          is_system: false,
        });
      } catch (err) {
        console.warn('Add category error:', err);
      }
    }
    return true;
  },

  exportDataJson: () => {
    const state = get();
    const user = useAuthStore.getState().user;
    const exportObject = {
      exported_at: new Date().toISOString(),
      user: {
        id: user?.id,
        email: user?.email,
        name: state.name,
      },
      settings: {
        tracking_start_date: state.trackingStartDate,
        sms_permission_status: state.smsPermissionStatus,
        theme_mode: state.themeMode,
        home_card_style: state.homeCardStyle,
      },
      accounts: state.accounts,
      custom_categories: state.customCategories,
      transactions: useTransactionStore.getState().transactions,
    };
    return JSON.stringify(exportObject, null, 2);
  },
}));
