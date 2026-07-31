import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { TenantService } from './tenant.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private supabase: SupabaseService,
    private tenantService: TenantService,
  ) {}

  async login(email: string, password: string) {
    const result = await this.supabase.client.auth.signInWithPassword({
      email,
      password,
    });

    if (result.error) {
      return result;
    }

    try {
      await this.tenantService.loadForCurrentUser();
      return result;
    } catch (profileError: any) {
      await this.supabase.client.auth.signOut();
      this.tenantService.clear();
      return {
        data: { user: null, session: null },
        error: {
          message:
            profileError?.message ||
            'Login succeeded but no tenant profile is assigned to this user.',
        },
      };
    }
  }

  async logout() {
    this.tenantService.clear();
    return this.supabase.client.auth.signOut();
  }

  getCurrentUser() {
    return this.supabase.client.auth.getUser();
  }

  getSession() {
    return this.supabase.client.auth.getSession();
  }
}
