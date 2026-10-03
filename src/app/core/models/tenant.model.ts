export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  created_at?: string;
}

export type UserRole = 'User' | 'Manager';

export interface UserProfile {
  id: string;
  role: UserRole | string;
  full_name: string | null;
  tenant_id: string;
  created_at?: string;
  tenant?: Tenant | null;
}
