import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'

// Hardcoding credentials to resolve the "Supabase URL and Anon Key must be provided" error,
// as environment variables are not available in this execution environment.
const supabaseUrl = 'https://zebldzhybnmhttcsgdat.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplYmxkemh5Ym5taHR0Y3NnZGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1ODg5NzQsImV4cCI6MjA3ODE2NDk3NH0.HQVvmC3M_mVA31xkrMxax5YgFM7Rju_5Zlm4XOZA3SE'

// SỬA LỖI: Khai báo cho Supabase biết TẤT CẢ các schema của bạn
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public, master, transactions, inventory, reporting'
  }
})