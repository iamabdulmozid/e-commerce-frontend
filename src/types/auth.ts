export interface Role {
  id: number;
  name: string;
  label: string;
  is_system: boolean;
  users_count?: number;
  permissions?: string[];
}

export interface Permission {
  id: number;
  name: string;
  label: string;
  group: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  type: "customer" | "admin";
  status: "active" | "inactive" | "banned";
  email_verified: boolean;
  marketing_consent?: boolean;
  marketing_consent_at?: string | null;
  last_login_at: string | null;
  created_at: string | null;
  roles?: Role[];
  /** Present for the authenticated admin only. `["*"]` means Super Admin. */
  permissions?: string[];
}

export interface AuthSession {
  id: string;
  ip: string | null;
  user_agent: string | null;
  last_active_at: string;
  is_current: boolean;
}

export interface Paginated<T> {
  items: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

/** Mirrors the server-side check; the API still enforces every permission. */
export function can(user: User | null, permission: string): boolean {
  if (!user?.permissions) return false;
  return (
    user.permissions.includes("*") || user.permissions.includes(permission)
  );
}
