import useAuthStore from '../stores/authStore';

// The base URL for all API calls to the Supabase Edge Function.
// The function name is being changed to 'main' as another common convention,
// since previous attempts ('api', 'server', 'make-server-09bd407a') have failed.
const API_BASE_URL = 'https://zebldzhybnmhttcsgdat.supabase.co/functions/v1/main';
const PUBLIC_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplYmxkemh5Ym5taHR0Y3NnZGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1ODg5NzQsImV4cCI6MjA3ODE2NDk3NH0.HQVvmC3M_mVA31xkrMxax5YgFM7Rju_5Zlm4XOZA3SE';

/**
 * A wrapper for the fetch API to make authenticated calls to the Supabase Edge Functions.
 * It automatically includes the user's JWT for authorization.
 * 
 * @param endpoint The API endpoint to call (e.g., '/dashboard/summary').
 * @param options Standard fetch options.
 * @returns The JSON response from the API.
 */
export async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Non-hook access to the Zustand store to get the current session.
    const session = useAuthStore.getState().session;

    // Supabase Edge Functions require the 'apikey' header for project identification
    // and the 'Authorization' header with the user's JWT for authentication and RLS.
    const token = session?.access_token || PUBLIC_ANON_KEY;

    const headers = {
        'Content-Type': 'application/json',
        'apikey': PUBLIC_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        ...options.headers,
    };

    const config: RequestInit = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(url, config);
        
        // Handle successful but empty responses (e.g., 204 No Content for DELETE requests)
        if (response.status === 204) {
            return {} as T;
        }

        const responseText = await response.text();
        const data = responseText ? JSON.parse(responseText) : {};

        if (!response.ok) {
            // Use the error message from the response body if available.
            const errorMessage = data.error || data.message || `API Error: ${response.status} ${response.statusText}`;
            throw new Error(errorMessage);
        }
        
        return data as T;

    } catch (error: any) {
        console.error(`API call to '${endpoint}' failed:`, error);
        
        // Provide a more specific and helpful error message for network/CORS issues.
        if (error.message.includes('Failed to fetch')) {
            throw new Error(
                `Network error when calling '${endpoint}'. This is often a CORS issue. ` +
                `Please check your internet connection and verify the API_BASE_URL in 'lib/api.ts' is correct. ` +
                `Also, ensure the Supabase Edge Function ('main') is deployed and has the correct CORS headers set up to allow requests from this origin.`
            );
        }
        
        // Re-throw other errors so they can be caught by the calling component.
        throw error;
    }
}
