import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { Avatar } from 'primeng/avatar';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterModule,
    DrawerModule,
    ButtonModule,
    Avatar
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css'
})
export class MainLayoutComponent {

  sidebarVisible = false;

  menus = [
  { label: 'Sales', route: '/sales', icon: 'pi pi-chart-line' },
  { label: 'Reports', route: '/reports', icon: 'pi pi-chart-bar' },
  { label: 'Stock', route: '/stock', icon: 'pi pi-cog' },
  { label: 'Admin', route: '/admin', icon: 'pi pi-cog' },
];
}