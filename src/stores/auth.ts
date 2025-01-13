import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  phone: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (phone: string, pin: string) => Promise<void>;
  signUp: (phone: string, pin: string) => Promise<void>;
  signOut: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,
  signIn: async (phone: string, pin: string) => {
    try {
      const { data, error } = await supabase
        .from('monkeys')
        .select('id, phone')
        .eq('phone', phone)
        .eq('pin_hash', pin)
        .single();

      if (error) throw new Error('Authentication failed');
      if (!data) throw new Error('Invalid phone number or PIN');

      set({ user: data });
      localStorage.setItem('user', JSON.stringify(data));
    } catch (err) {
      throw new Error('Invalid phone number or PIN');
    }
  },
  signUp: async (phone: string, pin: string) => {
    try {
      const { data: existing } = await supabase
        .from('monkeys')
        .select('id')
        .eq('phone', phone)
        .maybeSingle();

      if (existing) {
        throw new Error('Phone number already registered');
      }

      const { data, error } = await supabase
        .from('monkeys')
        .insert([{ 
          phone, 
          pin_hash: pin 
        }])
        .select('id, phone')
        .single();

      if (error) throw new Error('Failed to create account');
      if (!data) throw new Error('Failed to create account');

      set({ user: data });
      localStorage.setItem('user', JSON.stringify(data));
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error('Failed to create account');
    }
  },
  signOut: () => {
    set({ user: null });
    localStorage.removeItem('user');
  },
  checkAuth: async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const { data } = await supabase
          .from('monkeys')
          .select('id, phone')
          .eq('id', user.id)
          .single();

        if (data) {
          set({ user: data });
        } else {
          localStorage.removeItem('user');
          set({ user: null });
        }
      }
    } catch (err) {
      localStorage.removeItem('user');
      set({ user: null });
    } finally {
      set({ loading: false });
    }
  },
}));