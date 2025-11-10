import { useAuth } from './useAuth';
import { hasPermission, Module, Role } from '../config/roles';

export const usePermissions = (module: Module) => {
    const { role } = useAuth();

    const can = (action: string) => {
        // FIX: The original switch statement combined all cases, which prevented TypeScript
        // from narrowing the `module` type. This caused the generic type for `action` in
        // `hasPermission` to be inferred as `never`. By handling each module case
        // separately, TypeScript can correctly infer the types for each call.
        switch (module) {
            case 'navigation':
                return hasPermission(role as Role, module, action as any);
            case 'masterData':
                return hasPermission(role as Role, module, action as any);
            case 'operations':
                return hasPermission(role as Role, module, action as any);
            case 'settings':
                return hasPermission(role as Role, module, action as any);
            default:
                // This handles any future modules that might be added and ensures type safety.
                return false;
        }
    };

    return { can };
};
