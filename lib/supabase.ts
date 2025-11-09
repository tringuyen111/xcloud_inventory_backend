import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'

const supabaseUrl = 'https://zebldzhybnmhttcsgdat.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplYmxkemh5Ym5taHR0Y3NnZGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1ODg5NzQsImV4cCI6MjA3ODE2NDk3NH0.HQVvmC3M_mVA31xkrMxax5YgFM7Rju_5Zlm4XOZA3SE'

// Main Supabase client with multi-schema support and enhanced options based on user feedback.
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  // NOTE: The 'db.schema' property is omitted as it causes build errors with the current TypeScript setup.
  // The client is aware of all schemas via the generic `Database` type.
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // Added from suggestion
  },
  global: {
    headers: {
      'x-my-custom-header': 'wms-app',
      'x-client-info': 'wms-frontend', // Added from suggestion
    },
  },
  realtime: { // Added from suggestion
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Schema-specific clients for better organization, using correct schema names from types/supabase.ts
// The '@ts-ignore' is necessary as the `.schema()` method is not strongly typed in the base client.
// @ts-ignore
export const publicClient = supabase.schema('public');
// @ts-ignore
export const masterDataClient = supabase.schema('master'); // Corrected from 'master_data' to 'master'
// @ts-ignore
export const transactionsClient = supabase.schema('transactions');
// @ts-ignore
export const inventoryClient = supabase.schema('inventory');
// @ts-ignore
export const reportingClient = supabase.schema('reporting');