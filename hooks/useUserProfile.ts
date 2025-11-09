import { useState, useEffect } from 'react';
import { supabase, masterDataClient } from '../lib/supabase'; // Import the new client
import useAuthStore from '../stores/authStore';
import { Database } from '../types/supabase';

export type UserProfile = Database['public']['Tables']['users']['Row'];

// Define a new type for the augmented profile that includes the correct organization UUID
export interface AugmentedUserProfile extends UserProfile {
  organization_uuid: string | null;
}

export function useUserProfile() {
  const user = useAuthStore((state) => state.user);
  const [profile, setProfile] = useState<AugmentedUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchProfileData = async () => {
      setLoading(true);
      setError(null);
      try {
        // First, fetch the user's base profile from the public.users table.
        const { data: userProfileData, error: userProfileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (userProfileError) {
          if (userProfileError.code === 'PGRST116') throw new Error("User profile not found in public.users.");
          throw userProfileError;
        }

        let organization_uuid: string | null = null;
        
        // Then, attempt to fetch the organization UUID. This might fail due to RLS.
        // Instead of throwing a fatal error, we'll handle it gracefully.
        const { data: orgData, error: orgError } = await masterDataClient
          .from('organizations')
          .select('id')
          .limit(1)
          .single();
        
        if (orgError) {
          // Log a warning for debugging but don't crash the app.
          const warningMessage = "No organizations found in master.organizations. Cannot determine user's organization UUID. This is likely an RLS policy issue or an empty table.";
          console.warn(`Warning in useUserProfile: ${warningMessage} (Supabase error: ${orgError.message})`);
          setError(warningMessage); // Set error state for components to optionally display.
        } else if (orgData) {
          organization_uuid = orgData.id;
        }

        // Combine the data into the new augmented profile object.
        if (userProfileData) {
          setProfile({ ...userProfileData, organization_uuid });
        }

      } catch (err: any) {
        // This will now primarily catch errors from the user profile fetch.
        console.error('Error fetching user profile:', err);
        setError(err.message);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  return { profile, loading, error };
}
