import { Routes } from '@angular/router';

import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout';
import { MainLayoutComponent } from './layouts/main-layout/main-layout';

import { LoginComponent } from './pages/auth/login/login';

import { SalesComponent } from './pages/dashboard/sales/sales';
import { PurchaseComponent } from './pages/dashboard/purchase/purchase';
import { ReportsComponent } from './pages/dashboard/reports/reports';
import { AdminComponent } from './pages/dashboard/admin/admin';
import { StockComponent } from './pages/dashboard/stock/stock';

// Future pages
// import { ProductsComponent } from './pages/dashboard/products/products';
// import { SuppliersComponent } from './pages/dashboard/suppliers/suppliers';

// import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Default Route
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

  // ==========================
  // AUTH ROUTES
  // ==========================
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      {
        path: 'login',
        component: LoginComponent,
      },
    ],
  },

  // ==========================
  // MAIN APPLICATION ROUTES
  // ==========================
  {
    path: '',
    component: MainLayoutComponent,
    // canActivate: [authGuard],
    children: [
      {
        path: 'sales',
        component: SalesComponent,
      },

      {
        path: 'purchase',
        component: PurchaseComponent,
      },

      {
        path: 'reports',
        component: ReportsComponent,
      },

      {
        path: 'stock',
        component: StockComponent,
      },

      {
        path: 'admin',
        component: AdminComponent,
      },
      {
        path: 'invoice/:id',
        loadComponent: () =>
          import('./pages/dashboard/sales/daily-sales/invoice/invoice').then(
            (m) => m.InvoiceComponent,
          ),
      },

      // Enable after creating pages

      // {
      //   path: 'products',
      //   component: ProductsComponent
      // },

      // {
      //   path: 'suppliers',
      //   component: SuppliersComponent
      // }
    ],
  },

  // ==========================
  // FALLBACK
  // ==========================
  {
    path: '**',
    redirectTo: 'login',
  },
];
