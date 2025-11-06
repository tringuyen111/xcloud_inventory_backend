import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://thnlgskiaemfqpkjwynp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRobmxnc2tpYWVtZnFwa2p3eW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MDA1ODQsImV4cCI6MjA3Nzk3NjU4NH0.FSiwIHiGSt_BwD_vFsIJyuHRXKXIkRD46Tza8BQ3Fq0'

export const supabase = createClient(supabaseUrl, supabaseKey);
