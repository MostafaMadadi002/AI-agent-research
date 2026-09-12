import { createClient } from '@supabase/supabase-js';

// Use a placeholder URL if the environment variable is missing to prevent the app from crashing on startup.
// The user will still need to provide valid credentials in the AI Studio Secrets panel for functionality to work.
const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Clean the values
const cleanUrl = rawUrl?.replace(/['"]/g, '').trim();
const cleanKey = rawKey?.replace(/['"]/g, '').trim();

const isValidUrl = typeof cleanUrl === 'string' && cleanUrl.startsWith('http');
const isValidKey = typeof cleanKey === 'string' && cleanKey.length > 10;

export const isSupabaseConfigured = isValidUrl && isValidKey;

if (isSupabaseConfigured) {
  console.log('✅ Supabase configured successfully with URL:', cleanUrl);
} else {
  console.warn('⚠️ Supabase not configured. Please check your .env or Secrets.');
}

const supabaseUrl = isSupabaseConfigured ? cleanUrl : 'https://placeholder-project.supabase.co';
const supabaseAnonKey = isSupabaseConfigured ? cleanKey : 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
