import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { Avatar } from 'primeng/avatar';
import { AuthService } from '../../core/services/auth.service';
import { TenantService } from '../../core/services/tenant.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterModule, DrawerModule, ButtonModule, Avatar],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayoutComponent {
  constructor(
    private authService: AuthService,
    private tenantService: TenantService,
    private router: Router,
  ) {}

  sidebarVisible = false;

  private readonly allMenus = [
    { label: 'Sales', route: '/sales', icon: 'pi pi-chart-line' },
    { label: 'Reports', route: '/reports', icon: 'pi pi-chart-bar', roles: ['Manager'] },
    { label: 'Stock', route: '/stock', icon: 'pi pi-cog' },
    { label: 'Admin', route: '/admin', icon: 'pi pi-cog' },
  ];

  get menus() {
    return this.allMenus.filter(
      (menu) => !menu.roles?.length || this.tenantService.hasRole(...menu.roles),
    );
  }

  get tenantName(): string {
    return this.tenantService.tenant()?.name ?? '';
  }

  get tenantLogo(): string {
    return this.tenantService.tenant()?.logo || '/images/imobile.png';
  }

  get userName(): string {
    return this.tenantService.profile()?.full_name ?? '';
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
