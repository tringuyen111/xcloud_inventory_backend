import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import useAuthStore from '../stores/authStore';

// Define a more accurate type for the user profile data returned by the RPC
export interface UserAccessProfile {
  id: string;
  email: string | null;
  full_name: string | null; // Assuming this might be added to RPC later, keep for compatibility
  organization_id: number | null;
  branch_id: number | null;
  warehouse_id: number | null;
  role: string;
  is_active: boolean | null;
}

export function useUserProfile() {
  const user = useAuthStore((state) => state.user);
  const [profile, setProfile] = useState<UserAccessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(!!user);

    if (user) {
      const fetchProfile = async () => {
        try {
          // FIX: Call the 'check_user_access' RPC function instead of a direct select.
          // This is more robust and avoids the schema/RLS conflict.
          const { data, error } = await supabase.rpc('check_user_access');

          if (error) {
            throw new Error(error.message);
          }
          
          if (data && data.length > 0) {
            const userAccess = data[0];
            // Map the RPC result to the profile structure used by the app.
            setProfile({
                id: userAccess.user_id,
                email: userAccess.user_email,
                role: userAccess.user_role,
                // Taking the first organization as the user's current context.
                organization_id: userAccess.organization_ids?.[0] || null,
                // These fields are not in the RPC but are kept for potential future use
                // and to maintain type compatibility with existing components.
                branch_id: userAccess.branch_ids?.[0] || null,
                warehouse_id: userAccess.warehouse_ids?.[0] || null,
                full_name: null, 
                is_active: null,
            });
          } else {
             throw new Error("User access information not found.");
          }

        } catch (err: any) {
          console.error('Error fetching user profile:', err);
          setError(err.message);
          setProfile(null);
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    } else {
        setLoading(false);
        setProfile(null);
    }
  }, [user]);

  return { profile, loading, error };
}
