import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../core/services/auth.service';
import { TenantService } from '../core/services/tenant.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const tenant = inject(TenantService);
  const router = inject(Router);

  const { data } = await auth.getSession();

  if (!data.session) {
    return router.createUrlTree(['/login']);
  }

  if (tenant.tenantId) {
    return true;
  }

  try {
    await tenant.loadForCurrentUser();
    return true;
  } catch {
    await auth.logout();
    return router.createUrlTree(['/login']);
  }
};
