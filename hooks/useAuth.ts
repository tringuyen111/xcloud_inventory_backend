import useAuthStore from '../stores/authStore';
import { useUserProfile } from './useUserProfile';

export const useAuth = () => {
    const { session, user, loading: authLoading } = useAuthStore();
    const { profile, loading: profileLoading, error: profileError } = useUserProfile();

    return {
        session,
        user,
        profile,
        role: profile?.role,
        isAuthenticated: !!session && !!user,
        isLoading: authLoading || profileLoading,
        error: profileError,
    };
};
