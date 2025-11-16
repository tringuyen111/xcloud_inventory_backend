import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import useAuthStore from '../stores/authStore';
import { Database } from '../types/supabase';

export type UserProfile = Database['public']['Tables']['users']['Row'];

// Define a new type for the augmented profile that includes role and organization
export interface AugmentedUserProfile extends UserProfile {
  role: string | null;
  organization_id: number | null;
  // FIX: Added organization_uuid as an alias to prevent breaking changes in consuming components.
  organization_uuid: number | null;
}

export function useUserProfile() {
  const user = useAuthStore((state) => state.user);
  const [profile, setProfile] = useState<AugmentedUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfileData = useCallback(async () => {
    if (!user) {
        setProfile(null);
        setLoading(false);
        setError(null);
        return;
    }
    
    setLoading(true);
    setError(null);
    try {
      // Fetch the user's base profile, their role, and their organization in parallel
      const [profileRes, roleRes, orgRes] = await Promise.all([
          supabase.from('users').select('*').eq('id', user.id).single(),
          supabase.from('user_roles').select('roles(code)').eq('user_id', user.id),
          supabase.from('user_organizations').select('organization_id').eq('user_id', user.id).limit(1).single()
      ]);
      
      if (profileRes.error) {
        if (profileRes.error.code === 'PGRST116') throw new Error("User profile not found in public.users.");
        throw profileRes.error;
      }
      if (roleRes.error) throw new Error(`Failed to fetch user role: ${roleRes.error.message}`);
      // Org error is ignored if user has no org assigned yet

      const userProfileData = profileRes.data;

      // Assuming the first role found is the primary role for the app's logic
      let userRole = roleRes.data?.[0]?.roles?.code || null;
      const userOrgId = orgRes.data?.organization_id || null;

      // If the user is the primary developer and has no role assigned,
      // default to ADMIN to allow access during setup/development.
      // This is a common issue when setting up a new DB where the user
      // exists in auth.users but hasn't been linked in user_roles yet.
      if (user.email === 'nguyenmanhtri2907@gmail.com' && !userRole) {
          userRole = 'ADMIN';
      }

      if (userProfileData) {
        const augmentedProfile: AugmentedUserProfile = {
          ...userProfileData,
          role: userRole,
          organization_id: userOrgId,
          organization_uuid: userOrgId,
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
  }, [user]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  return { profile, loading, error, refetch: fetchProfileData };
}
