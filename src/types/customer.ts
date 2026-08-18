export interface Address {
  id: number;
  label: string | null;
  recipient_name: string;
  phone: string;
  district: string;
  area: string;
  address_line: string;
  postal_code: string | null;
  is_default_shipping: boolean;
  is_default_billing: boolean;
  created_at: string | null;
}

export type AddressPayload = Omit<
  Address,
  "id" | "is_default_shipping" | "is_default_billing" | "created_at"
>;

export type DefaultAddressType = "shipping" | "billing" | "both";

export interface CustomerGroup {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_default: boolean;
  customers_count?: number;
}

export interface CustomerTag {
  id: number;
  name: string;
  slug: string;
  customers_count?: number;
}

export interface CustomerNote {
  id: number;
  note: string;
  created_at: string;
  admin?: { id: number | null; name: string | null };
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: "active" | "inactive" | "banned";
  email_verified: boolean;
  marketing_consent: boolean;
  marketing_consent_at: string | null;
  last_login_at: string | null;
  created_at: string | null;
  group?: CustomerGroup | null;
  tags?: CustomerTag[];
  addresses?: Address[];
  notes?: CustomerNote[];
  addresses_count?: number;
}
