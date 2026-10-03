import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Tenant, UserProfile } from '../models/tenant.model';

@Injectable({
  providedIn: 'root',
})
export class TenantService {
  private readonly profileSignal = signal<UserProfile | null>(null);
  private readonly tenantSignal = signal<Tenant | null>(null);

  readonly profile = this.profileSignal.asReadonly();
  readonly tenant = this.tenantSignal.asReadonly();

  constructor(private supabase: SupabaseService) {}

  get tenantId(): string | null {
    return this.profileSignal()?.tenant_id ?? null;
  }

  get role(): string | null {
    return this.profileSignal()?.role ?? null;
  }

  hasRole(...roles: string[]): boolean {
    const current = this.role?.trim().toLowerCase();
    if (!current) {
      return false;
    }
    return roles.some((role) => role.trim().toLowerCase() === current);
  }

  isManager(): boolean {
    return this.hasRole('Manager');
  }

  /** Throws if tenant context is missing — use in data services. */
  requireTenantId(): string {
    const id = this.tenantId;
    if (!id) {
      throw new Error('No tenant assigned. Contact your administrator.');
    }
    return id;
  }

  /** Auth user id (same as profiles.id). */
  requireUserId(): string {
    const id = this.profileSignal()?.id;
    if (!id) {
      throw new Error('Not authenticated. Sign in again.');
    }
    return id;
  }

  /**
   * Loads profiles + tenants for the signed-in auth user.
   * Expects a profiles row you created manually (id = auth.users.id).
   */
  async loadForCurrentUser(): Promise<UserProfile> {
    const {
      data: { user },
      error: userError,
    } = await this.supabase.client.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      this.clear();
      throw new Error('Not authenticated');
    }

    // Load profile first (no join) so RLS on tenants cannot block login.
    const { data: profileRow, error: profileError } = await this.supabase.client
      .from('profiles')
      .select('id, role, full_name, tenant_id, created_at')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      this.clear();
      throw profileError;
    }

    if (!profileRow?.tenant_id) {
      this.clear();
      throw new Error(
        'No profile or tenant found for this user. Ask an admin to add your profile.',
      );
    }

    const { data: tenantRow, error: tenantError } = await this.supabase.client
      .from('tenants')
      .select('id, name, slug, logo, created_at')
      .eq('id', profileRow.tenant_id)
      .maybeSingle();

    if (tenantError) {
      console.warn('Tenant lookup failed:', tenantError);
    }

    const tenant: Tenant | null = tenantRow
      ? {
          id: tenantRow.id,
          name: tenantRow.name,
          slug: tenantRow.slug,
          logo: tenantRow.logo,
          created_at: tenantRow.created_at,
        }
      : {
          id: profileRow.tenant_id,
          name: 'Workspace',
          slug: '',
          logo: null,
        };

    const profile: UserProfile = {
      id: profileRow.id,
      role: profileRow.role,
      full_name: profileRow.full_name,
      tenant_id: profileRow.tenant_id,
      created_at: profileRow.created_at,
      tenant,
    };

    this.profileSignal.set(profile);
    this.tenantSignal.set(tenant);
    return profile;
  }

  clear(): void {
    this.profileSignal.set(null);
    this.tenantSignal.set(null);
  }
}
