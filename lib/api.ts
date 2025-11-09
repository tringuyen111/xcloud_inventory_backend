
const API_BASE_URL = 'https://zebldzhybnmhttcsgdat.supabase.co/functions/v1/make-server-09bd407a';
// This key is from lib/supabase.ts
const PUBLIC_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplYmxkemh5Ym5taHR0Y3NnZGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1ODg5NzQsImV4cCI6MjA3ODE2NDk3NH0.HQVvmC3M_mVA31xkrMxax5YgFM7Rju_5Zlm4XOZA3SE';

export async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PUBLIC_ANON_KEY}`,
        ...options.headers,
    };

    const config: RequestInit = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(url, config);
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { error: 'An unknown error occurred', details: response.statusText };
            }
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}
