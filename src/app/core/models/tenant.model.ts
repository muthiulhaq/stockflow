export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  created_at?: string;
}

export interface UserProfile {
  id: string;
  role: string;
  full_name: string | null;
  tenant_id: string;
  created_at?: string;
  tenant?: Tenant | null;
}
