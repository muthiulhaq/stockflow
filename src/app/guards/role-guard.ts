import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { TenantService } from '../core/services/tenant.service';

export const roleGuard: CanActivateFn = (route) => {
  const tenant = inject(TenantService);
  const router = inject(Router);
  const allowed = (route.data['roles'] as string[] | undefined) ?? [];

  if (allowed.length === 0 || tenant.hasRole(...allowed)) {
    return true;
  }

  return router.createUrlTree(['/sales']);
};
