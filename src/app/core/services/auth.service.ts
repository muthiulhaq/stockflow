import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private supabase: SupabaseService) {}

  login(email: string, password: string) {
    return this.supabase.client.auth.signInWithPassword({
      email,
      password,
    });
  }

  logout() {
    return this.supabase.client.auth.signOut();
  }

  getCurrentUser() {
    return this.supabase.client.auth.getUser();
  }

  getSession() {
    return this.supabase.client.auth.getSession();
  }
}
