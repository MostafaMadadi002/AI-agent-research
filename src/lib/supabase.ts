import { createClient } from '@supabase/supabase-js';

// Use a placeholder URL if the environment variable is missing to prevent the app from crashing on startup.
// The user will still need to provide valid credentials in the AI Studio Secrets panel for functionality to work.
// Default credentials provided by the user
const DEFAULT_URL = 'https://jjlufvljhsoxtbumpqhx.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqbHVmdmxqaHNveHRidW1wcWh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxNzYyNzEsImV4cCI6MjEwNDc1MjI3MX0.5j_WRCMyDqoXn6D-ExOw0w4EdNAL091QY-Wzlew3VyI';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Clean the values
const cleanUrl = rawUrl?.replace(/['"]/g, '').trim();
const cleanKey = rawKey?.replace(/['"]/g, '').trim();

const envValid = typeof cleanUrl === 'string' && cleanUrl.startsWith('http') && typeof cleanKey === 'string' && cleanKey.length > 10;

// Use env variables if valid, otherwise fallback to hardcoded defaults
export const supabaseUrl = envValid ? cleanUrl : DEFAULT_URL;
export const supabaseAnonKey = envValid ? cleanKey : DEFAULT_KEY;

// Since we have hardcoded fallbacks, it's always "configured" now
export const isSupabaseConfigured = true;

if (envValid) {
  console.log('✅ Supabase configured using Environment Variables');
} else {
  console.log('✅ Supabase configured using Hardcoded Fallbacks');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
