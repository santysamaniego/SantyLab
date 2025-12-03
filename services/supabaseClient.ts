import { createClient } from '@supabase/supabase-js';

// Prioritize Environment Variables from Render/Vite
// Fallback to the provided keys only if env vars are missing (useful for local dev without .env file)
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://yxyalgvmniftrzwwtdol.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4eWFsZ3ZtbmlmdHJ6d3d0ZG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NjU4OTMsImV4cCI6MjA4MDM0MTg5M30.45IdtHtZkMURxd_a24J5wg53xG4869H9kHVMuzGwp5U';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);