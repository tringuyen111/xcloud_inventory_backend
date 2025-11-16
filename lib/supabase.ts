import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'

const supabaseUrl = 'https://bjrhiusayalaywmyrmsh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqcmhpdXNheWFsYXl3bXlybXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzA1MDMsImV4cCI6MjA3ODY0NjUwM30.z65zfwpI0qXQJdiuSMixnAnPUiyOFsLTzjWe1fb6RyY'

// Main Supabase client with multi-schema support and enhanced options based on user feedback.
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'x-client-info': 'wms-frontend-v2',
    },
  },
});

// All tables are now in the 'public' schema. All schema-specific clients 
// are now aliases for the main 'supabase' client to maintain compatibility 
// with existing code that uses them (e.g., apiClient).
export const publicClient = supabase;
export const masterDataClient = supabase;
export const transactionsClient = supabase;
export const inventoryClient = supabase;
export const reportingClient = supabase;
