export const ROLES = {
  ADMIN: 'ADMIN',
  WAREHOUSE_MANAGER: 'WAREHOUSE_MANAGER',
  WAREHOUSE_STAFF: 'WAREHOUSE_STAFF',
} as const;

export type Role = keyof typeof ROLES;

// Define permissions for each role
// Structure: { [module]: { actions: Role[] } }
const permissions = {
  navigation: {
    viewDashboard: [ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.WAREHOUSE_STAFF],
    viewOperations: [ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.WAREHOUSE_STAFF],
    viewProduct: [ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER],
    viewMasterData: [ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER],
    viewReports: [ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER],
    viewSettings: [ROLES.ADMIN],
    // Granular permissions for operations sub-menus
    viewGR: [ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.WAREHOUSE_STAFF],
    viewPA: [ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.WAREHOUSE_STAFF],
    viewOnhand: [ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.WAREHOUSE_STAFF],
    viewIC: [ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.WAREHOUSE_STAFF],
    viewGI: [ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.WAREHOUSE_STAFF],
    viewGT: [ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.WAREHOUSE_STAFF],
  },
  masterData: {
    create: [ROLES.ADMIN],
    edit: [ROLES.ADMIN],
    delete: [ROLES.ADMIN],
  },
  operations: {
    create: [ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.WAREHOUSE_STAFF],
    approve: [ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER],
    execute: [ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.WAREHOUSE_STAFF],
    adjust: [ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER],
  },
  settings: {
    manageUsers: [ROLES.ADMIN],
  },
};

type Permissions = typeof permissions;
export type Module = keyof Permissions;
type Action<M extends Module> = keyof Permissions[M];

export const hasPermission = <M extends Module>(role: Role | undefined | null, module: M, action: Action<M>): boolean => {
  if (!role) return false;
  // This type assertion is necessary because TypeScript can't infer the specific action type for the module.
  const allowedRoles = permissions[module][action] as Role[];
  return allowedRoles?.includes(role);
};