import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../../api/supabase.ts';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  user: UserProfile | null;
  session: any | null;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      if (!isSupabaseConfigured) {
        set({ isLoading: false });
        return;
      }

      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }

      if (session?.user) {
        set({
          session,
          user: {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || '',
          },
          isLoading: false,
        });
      } else {
        set({ user: null, session: null, isLoading: false });
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange((_event, currentSession) => {
        if (currentSession?.user) {
          set({
            session: currentSession,
            user: {
              id: currentSession.user.id,
              email: currentSession.user.email || '',
              name: currentSession.user.user_metadata?.name || '',
            },
          });
        } else {
          set({ user: null, session: null });
        }
      });
    } catch (err: any) {
      set({ error: err?.message || 'Failed to initialize session', isLoading: false });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return { success: false, error: error.message };
      }

      if (data.session && data.user) {
        set({
          session: data.session,
          user: {
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name || '',
          },
          isLoading: false,
        });
        return { success: true };
      }

      set({ isLoading: false });
      return { success: false, error: 'Failed to sign in' };
    } catch (err: any) {
      const message = err?.message || 'An unexpected error occurred';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  signUp: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim(),
          },
        },
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Also create user profile row in database
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            name: name.trim(),
            timezone: 'Asia/Kolkata',
            tracking_start_date: new Date().toISOString().split('T')[0],
            onboarding_done: false,
          });
        } catch {
          // Non-blocking if profiles table not ready
        }

        if (data.session) {
          set({
            session: data.session,
            user: {
              id: data.user.id,
              email: data.user.email || '',
              name: name.trim(),
            },
            isLoading: false,
          });
        } else {
          set({ isLoading: false });
        }
        return { success: true };
      }

      set({ isLoading: false });
      return { success: false, error: 'Sign up failed' };
    } catch (err: any) {
      const message = err?.message || 'An unexpected error occurred';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await supabase.auth.signOut();
      set({ user: null, session: null, isLoading: false, error: null });
    } catch {
      set({ user: null, session: null, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

