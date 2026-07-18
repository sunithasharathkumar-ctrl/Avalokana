import { createClient } from '@supabase/supabase-js';

const fallbackUrl = 'https://eoojknstseevgnurigzg.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvb2prbnN0c2VldmdudXJpZ3pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NjM5NzQsImV4cCI6MjA5NjMzOTk3NH0.xnzj97ZrOef2q7eDMBWTC7Q3ZaThsErneMh0IlU43Sc';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Use actual fallback credentials if variables are empty or contain placeholders
const finalUrl = (!supabaseUrl || supabaseUrl.includes('placeholder') || supabaseUrl.includes('your-supabase-url')) ? fallbackUrl : supabaseUrl;
const finalKey = (!supabaseAnonKey || supabaseAnonKey.includes('placeholder') || supabaseAnonKey.includes('your-key-here')) ? fallbackKey : supabaseAnonKey;

// Initialize Supabase Client
export const supabase = createClient(finalUrl, finalKey);
