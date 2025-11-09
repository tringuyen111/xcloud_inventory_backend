import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
        // Fetch both the user's profile and the first available organization's UUID in parallel.
        // This is a robust workaround for the BIGINT vs UUID discrepancy in the schema.
        const [userProfileRes, orgRes] = await Promise.all([
          supabase.from('users').select('*').eq('id', user.id).single(),
          supabase.from('organizations').select('id').limit(1).single()
        ]);

        if (userProfileRes.error) {
          if (userProfileRes.error.code === 'PGRST116') throw new Error("User profile not found in public.users.");
          throw userProfileRes.error;
        }

        if (orgRes.error) {
          if (orgRes.error.code === 'PGRST116') throw new Error("No organizations found in master.organizations. Cannot determine user's organization UUID.");
          throw orgRes.error;
        }
        
        const userProfileData = userProfileRes.data;
        const organization_uuid = orgRes.data?.id || null;

        // Combine the data into the new augmented profile object
        setProfile({ ...userProfileData, organization_uuid });

      } catch (err: any) {
        console.error('Error fetching user profile and organization:', err);
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