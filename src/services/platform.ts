import { api } from "@/lib/api";
import type { Paginated } from "@/types/auth";
import type { Invoice, Subscription } from "@/services/billing";

/*
 * Super Admin Portal client.
 *
 * Everything lives under /platform, which the API only serves on a central
 * host. There is no tenant header here on purpose: sending one would resolve a
 * tenant and make every one of these endpoints 404.
 */

export type PlatformRole = "super_admin" | "billing" | "support";

export type TenantStatus =
  | "provisioning"
  | "provision_failed"
  | "active"
  | "suspended"
  | "archived";

export interface PlatformUser {
  id: number;
  name: string;
  email: string;
  role: PlatformRole;
  status: string;
  last_login_at: string | null;
  created_at: string | null;
  abilities?: string[];
}

export interface TenantDomain {
  id: number;
  hostname: string;
  is_primary: boolean;
  verified_at: string | null;
  is_verified: boolean;
}

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  database: string;
  status: TenantStatus;
  is_active: boolean;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  timezone: string;
  currency: string;
  locale: string;
  provisioned_at: string | null;
  provision_error: string | null;
  suspended_at: string | null;
  suspension_reason: string | null;
  archived_at: string | null;
  purge_after: string | null;
  created_at: string | null;
  primary_domain?: string | null;
  domains?: TenantDomain[];
  subscription?: Subscription | null;
}

export interface Package {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  currency: string;
  billing_period: string;
  billing_period_label: string;
  trial_days: number;
  grace_days: number;
  features: Record<string, number | boolean | null>;
  is_active: boolean;
  is_public: boolean;
  sort_order: number;
  subscriptions_count?: number;
}

export interface FeatureCatalog {
  limits: Array<{ feature: string; label: string; default: number | null }>;
  flags: Array<{ feature: string; label: string; default: boolean }>;
}

export interface Dashboard {
  tenants: Record<string, number>;
  subscriptions: Record<string, number>;
  mrr: string;
  outstanding_total: string;
  trials_ending_soon: Array<{
    subscription_id: number;
    tenant: { id: number; name: string; slug: string };
    trial_ends_at: string | null;
  }>;
  overdue_invoices: Array<{
    id: number;
    number: string;
    tenant: { id: number; name: string };
    total: string;
    balance: string;
    currency: string;
    due_at: string | null;
  }>;
  provisioning_failures: Array<{
    id: number;
    name: string;
    slug: string;
    error: string | null;
    failed_at: string | null;
  }>;
}

export interface PlatformAuditEntry {
  id: number;
  action: string;
  auditable_type: string | null;
  auditable_id: number | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ip: string | null;
  created_at: string;
  platform_user?: { id: number; name: string; email: string } | null;
  tenant?: { id: number; name: string; slug: string } | null;
}

export interface CreateTenantPayload {
  name: string;
  slug: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  timezone?: string;
  currency?: string;
  admin: {
    name: string;
    email: string;
    password?: string | null;
    invite?: boolean;
  };
}

function query(params: Record<string, string | number | boolean | undefined>) {
  return new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== "")
      .map(([key, value]) => [key, String(value)]),
  ).toString();
}

export const platformService = {
  // --- auth -------------------------------------------------------------
  login: (email: string, password: string) =>
    api.post<PlatformUser>("/platform/auth/login", { email, password }),
  logout: () => api.post<null>("/platform/auth/logout"),
  me: () => api.get<PlatformUser>("/platform/me"),
  updateProfile: (payload: { name?: string; email?: string }) =>
    api.patch<PlatformUser>("/platform/me", payload),
  updatePassword: (payload: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) => api.patch<null>("/platform/me/password", payload),

  // --- dashboard --------------------------------------------------------
  dashboard: () => api.get<Dashboard>("/platform/dashboard"),
  auditLogs: (params: { tenant_id?: number; per_page?: number } = {}) =>
    api.get<Paginated<PlatformAuditEntry>>(`/platform/audit-logs?${query(params)}`),

  // --- tenants ----------------------------------------------------------
  tenants: (params: { status?: string; q?: string; per_page?: number } = {}) =>
    api.get<Paginated<Tenant>>(`/platform/tenants?${query(params)}`),
  tenant: (id: number) => api.get<Tenant>(`/platform/tenants/${id}`),
  createTenant: (payload: CreateTenantPayload) =>
    api.post<Tenant>("/platform/tenants", payload),
  updateTenant: (id: number, payload: Partial<Tenant>) =>
    api.patch<Tenant>(`/platform/tenants/${id}`, payload),
  suspendTenant: (id: number, reason: string) =>
    api.post<Tenant>(`/platform/tenants/${id}/suspend`, { reason }),
  restoreTenant: (id: number) => api.post<Tenant>(`/platform/tenants/${id}/restore`),
  archiveTenant: (id: number, confirmSlug: string) =>
    api.delete<Tenant>(`/platform/tenants/${id}`, {
      body: JSON.stringify({ confirm_slug: confirmSlug }),
      headers: { "Content-Type": "application/json" },
    }),
  retryProvisioning: (id: number) =>
    api.post<Tenant>(`/platform/tenants/${id}/retry-provisioning`),
  tenantUsage: (id: number) =>
    api.get<{
      limits: Array<{
        feature: string;
        label: string;
        limit: number | null;
        used: number;
        remaining: number | null;
        unlimited: boolean;
      }>;
    }>(`/platform/tenants/${id}/usage`),
  tenantAdmins: (id: number) =>
    api.get<{
      items: Array<{
        id: number;
        name: string;
        email: string;
        status: string;
        last_login_at: string | null;
        roles: Array<{ name: string; label: string }>;
      }>;
    }>(`/platform/tenants/${id}/admins`),
  createTenantAdmin: (
    id: number,
    payload: { name: string; email: string; password?: string },
  ) => api.post<{ id: number }>(`/platform/tenants/${id}/admins`, payload),

  // --- domains ----------------------------------------------------------
  addDomain: (tenantId: number, hostname: string) =>
    api.post<TenantDomain>(`/platform/tenants/${tenantId}/domains`, { hostname }),
  makeDomainPrimary: (tenantId: number, domainId: number) =>
    api.post<TenantDomain>(`/platform/tenants/${tenantId}/domains/${domainId}/primary`),
  removeDomain: (tenantId: number, domainId: number) =>
    api.delete<null>(`/platform/tenants/${tenantId}/domains/${domainId}`),

  // --- packages ---------------------------------------------------------
  packages: () =>
    api.get<{ items: Package[]; catalog: FeatureCatalog }>("/platform/packages"),
  createPackage: (payload: Partial<Package>) =>
    api.post<Package>("/platform/packages", payload),
  updatePackage: (id: number, payload: Partial<Package>) =>
    api.patch<Package>(`/platform/packages/${id}`, payload),
  togglePackage: (id: number) => api.post<Package>(`/platform/packages/${id}/toggle`),
  deletePackage: (id: number) => api.delete<null>(`/platform/packages/${id}`),

  // --- subscriptions ----------------------------------------------------
  subscriptions: (params: { status?: string; tenant_id?: number } = {}) =>
    api.get<Paginated<Subscription>>(`/platform/subscriptions?${query(params)}`),
  assignPackage: (
    tenantId: number,
    payload: { package_id: number; trial?: boolean; trial_days?: number; price?: string },
  ) => api.post<Subscription>(`/platform/tenants/${tenantId}/subscription`, payload),
  changePackage: (subscriptionId: number, packageId: number) =>
    api.post<Subscription>(`/platform/subscriptions/${subscriptionId}/change-package`, {
      package_id: packageId,
    }),
  resyncFeatures: (subscriptionId: number, includePrice = false) =>
    api.post<Subscription>(`/platform/subscriptions/${subscriptionId}/resync-features`, {
      include_price: includePrice,
    }),
  cancelSubscription: (subscriptionId: number, reason?: string) =>
    api.post<Subscription>(`/platform/subscriptions/${subscriptionId}/cancel`, { reason }),
  reactivateSubscription: (subscriptionId: number) =>
    api.post<Subscription>(`/platform/subscriptions/${subscriptionId}/reactivate`),
  extendTrial: (subscriptionId: number, days: number) =>
    api.post<Subscription>(`/platform/subscriptions/${subscriptionId}/extend-trial`, { days }),

  // --- invoices ---------------------------------------------------------
  invoices: (params: { status?: string; tenant_id?: number; outstanding?: boolean } = {}) =>
    api.get<Paginated<Invoice>>(`/platform/invoices?${query(params)}`),
  invoice: (id: number) => api.get<Invoice>(`/platform/invoices/${id}`),
  issueInvoice: (id: number, dueAt?: string) =>
    api.post<Invoice>(`/platform/invoices/${id}/issue`, { due_at: dueAt }),
  voidInvoice: (id: number, reason: string) =>
    api.post<Invoice>(`/platform/invoices/${id}/void`, { reason }),
  recordPayment: (
    id: number,
    payload: { amount: string; method: string; reference?: string; note?: string },
  ) => api.post<Invoice>(`/platform/invoices/${id}/payments`, payload),

  // --- staff ------------------------------------------------------------
  users: () =>
    api.get<{
      items: PlatformUser[];
      roles: Array<{ role: PlatformRole; abilities: string[] }>;
    }>("/platform/users"),
  createUser: (payload: {
    name: string;
    email: string;
    password: string;
    role: PlatformRole;
  }) => api.post<PlatformUser>("/platform/users", payload),
  updateUser: (id: number, payload: Partial<PlatformUser> & { password?: string }) =>
    api.patch<PlatformUser>(`/platform/users/${id}`, payload),
  deleteUser: (id: number) => api.delete<null>(`/platform/users/${id}`),

  // --- impersonation ----------------------------------------------------
  impersonate: (tenantId: number, userId: number, reason: string) =>
    api.post<{ session_id: number; url: string; expires_at: string }>(
      `/platform/tenants/${tenantId}/impersonate`,
      { user_id: userId, reason },
    ),
};

/**
 * Whether the signed-in platform user holds an ability.
 *
 * A UI convenience only: the API enforces every one of these, and hiding a
 * control never stands in for authorization.
 */
export function canPlatform(
  user: PlatformUser | null,
  ability: string,
): boolean {
  if (!user) return false;
  if (user.role === "super_admin") return true;

  return user.abilities?.includes(ability) ?? false;
}
