import { api } from "@/lib/api";
import type { Paginated, User } from "@/types/auth";
import type {
  Address,
  AddressPayload,
  Customer,
  CustomerGroup,
  CustomerNote,
  CustomerTag,
  DefaultAddressType,
} from "@/types/customer";

function query(params: Record<string, string | number | undefined>): string {
  return new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== "")
      .map(([key, value]) => [key, String(value)]),
  ).toString();
}

/** Customer-facing address book and preferences. */
export const addressService = {
  list: () => api.get<{ items: Address[] }>("/me/addresses"),

  create: (payload: AddressPayload) =>
    api.post<Address>("/me/addresses", payload),

  update: (id: number, payload: Partial<AddressPayload>) =>
    api.patch<Address>(`/me/addresses/${id}`, payload),

  remove: (id: number) => api.delete<null>(`/me/addresses/${id}`),

  setDefault: (id: number, type: DefaultAddressType) =>
    api.put<Address>(`/me/addresses/${id}/default`, { type }),

  districts: () => api.get<{ items: string[] }>("/districts"),

  setMarketingConsent: (consent: boolean) =>
    api.patch<User>("/me/marketing-consent", { marketing_consent: consent }),
};

/** Admin-facing customer management. */
export const customerService = {
  list: (params: {
    q?: string;
    status?: string;
    group?: string;
    tag?: string;
    per_page?: number;
  }) => api.get<Paginated<Customer>>(`/admin/customers?${query(params)}`),

  show: (id: number) => api.get<Customer>(`/admin/customers/${id}`),

  update: (
    id: number,
    payload: Partial<{
      name: string;
      phone: string | null;
      status: string;
      customer_group_id: number | null;
    }>,
  ) => api.patch<Customer>(`/admin/customers/${id}`, payload),

  syncTags: (id: number, tags: string[]) =>
    api.put<Customer>(`/admin/customers/${id}/tags`, { tags }),

  addNote: (id: number, note: string) =>
    api.post<CustomerNote>(`/admin/customers/${id}/notes`, { note }),

  groups: () => api.get<{ items: CustomerGroup[] }>("/admin/customer-groups"),

  createGroup: (name: string, description?: string) =>
    api.post<CustomerGroup>("/admin/customer-groups", { name, description }),

  deleteGroup: (id: number) => api.delete<null>(`/admin/customer-groups/${id}`),

  tags: () => api.get<{ items: CustomerTag[] }>("/admin/customer-tags"),

  createTag: (name: string) =>
    api.post<CustomerTag>("/admin/customer-tags", { name }),
};
