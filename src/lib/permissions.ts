export type Permission =
    | "dashboard"
    | "vision"
    | "transactions"
    | "budgets"
    | "accounts"
    | "reports"
    | "settings";

export interface UserPermissions {
    dashboard?: boolean;
    vision?: boolean;
    transactions?: boolean;
    budgets?: boolean;
    accounts?: boolean;
    reports?: boolean;
    settings?: boolean;
}

export const SECTION_NAMES: Record<Permission, string> = {
    dashboard: "Dashboard",
    vision: "IA Vision",
    transactions: "Movimientos",
    budgets: "Presupuestos",
    accounts: "Mis Cuentas",
    reports: "Reportes",
    settings: "Configuración"
};

/**
 * Checks if a user has a specific permission.
 * Admins always have all permissions.
 */
export const hasPermission = (user: any, permission: Permission): boolean => {
    if (!user) return false;
    if (user.role === "ADMIN") return true;

    const permissions = (user.permissions as UserPermissions) || {};
    return !!permissions[permission];
};

/**
 * Gets the default permissions for a new user.
 */
export const getDefaultPermissions = (): UserPermissions => ({
    dashboard: true,
    vision: true,
    transactions: false,
    budgets: false,
    accounts: false,
    reports: false,
    settings: false
});
