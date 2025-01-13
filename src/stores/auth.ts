import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  phone: string;
  phone_verified: boolean;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (phone: string) => Promise<void>;
  signUp: (phone: string) => Promise<void>;
  signOut: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,
  signIn: async (phone: string) => {
    try {
      // Format phone number to ensure consistent format
      const formattedPhone = `+1${phone.replace(/[^\d]/g, '')}`;
      
      // Get the user data from the monkeys table first
      const { data: existingUser, error: userError } = await supabase
        .from('monkeys')
        .select('id, phone, phone_verified')
        .eq('phone', formattedPhone)
        .maybeSingle();

      if (userError) throw userError;
      if (!existingUser) {
        throw new Error('Account not found. Please sign up first.');
      }

      // Update phone_verified status if not already verified
      if (!existingUser.phone_verified) {
        const { error: updateError } = await supabase
          .from('monkeys')
          .update({ phone_verified: true })
          .eq('id', existingUser.id);

        if (updateError) throw updateError;
        existingUser.phone_verified = true;
      }

      // Set the user in state
      set({ user: existingUser });
      localStorage.setItem('user', JSON.stringify(existingUser));
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error('Authentication failed');
    }
  },
  signUp: async (phone: string) => {
    try {
      // Format phone number to ensure consistent format
      const formattedPhone = `+1${phone.replace(/[^\d]/g, '')}`;
      
      // Check if phone number already exists
      const { data: existing } = await supabase
        .from('monkeys')
        .select('id')
        .eq('phone', formattedPhone)
        .maybeSingle();

      if (existing) {
        throw new Error('Phone number already registered');
      }

      // Create new user in monkeys table
      const { data, error } = await supabase
        .from('monkeys')
        .insert([{ 
          phone: formattedPhone,
          phone_verified: true
        }])
        .select('id, phone, phone_verified')
        .single();

      if (error) throw error;
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
          .select('id, phone, phone_verified')
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