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
        // Fetch the user's base profile from the public.users table.
        const { data: userProfileData, error: userProfileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (userProfileError) {
          if (userProfileError.code === 'PGRST116') throw new Error("User profile not found in public.users.");
          throw userProfileError;
        }

        // The user's organization ID is directly available on their profile.
        // We augment the profile with an `organization_uuid` property for consistency with other parts of the app.
        if (userProfileData) {
          const augmentedProfile: AugmentedUserProfile = {
            ...userProfileData,
            organization_uuid: userProfileData.organization_id || null,
          };
          setProfile(augmentedProfile);
        } else {
            setProfile(null);
        }

      } catch (err: any) {
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