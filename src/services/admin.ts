import { api } from "@/lib/api";
import type { Paginated, Permission, Role, User } from "@/types/auth";

export interface AuditLogEntry {
  id: number;
  action: string;
  auditable_type: string | null;
  auditable_id: number | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
  user?: { id: number; name: string; email: string } | null;
}

export const adminService = {
  users: (
    params: {
      type?: string;
      status?: string;
      q?: string;
      per_page?: number;
    } = {},
  ) => {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== "")
        .map(([key, value]) => [key, String(value)]),
    );

    return api.get<Paginated<User>>(`/admin/users?${query}`);
  },

  createUser: (payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    roles?: string[];
  }) => api.post<User>("/admin/users", payload),

  syncUserRoles: (id: number, roles: string[]) =>
    api.put<User>(`/admin/users/${id}/roles`, { roles }),

  deleteUser: (id: number) => api.delete<null>(`/admin/users/${id}`),

  roles: () => api.get<{ items: Role[] }>("/admin/roles"),

  permissions: () => api.get<{ items: Permission[] }>("/admin/permissions"),

  updateRolePermissions: (id: number, permissions: string[]) =>
    api.patch<Role>(`/admin/roles/${id}`, { permissions }),

  auditLogs: (params: { action?: string; per_page?: number } = {}) => {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== "")
        .map(([key, value]) => [key, String(value)]),
    );

    return api.get<Paginated<AuditLogEntry>>(`/admin/audit-logs?${query}`);
  },
};
