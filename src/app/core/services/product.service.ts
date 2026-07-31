import { Injectable } from '@angular/core';
import { from } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { TenantService } from './tenant.service';
import { Product, CreateProduct } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  constructor(
    private supabaseService: SupabaseService,
    private tenantService: TenantService,
  ) {}

  getProducts() {
    const tenantId = this.tenantService.requireTenantId();

    return from(
      this.supabaseService.client
        .from('products')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name'),
    );
  }

  getProduct(id: number) {
    const tenantId = this.tenantService.requireTenantId();

    return from(
      this.supabaseService.client
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single(),
    );
  }

  addProduct(product: CreateProduct) {
    const tenantId = this.tenantService.requireTenantId();

    return from(
      this.supabaseService.client
        .from('products')
        .insert({ ...product, tenant_id: tenantId })
        .select()
        .single(),
    );
  }

  updateProduct(id: number, product: Partial<CreateProduct>) {
    const tenantId = this.tenantService.requireTenantId();

    return from(
      this.supabaseService.client
        .from('products')
        .update(product)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single(),
    );
  }

  deleteProduct(id: number) {
    const tenantId = this.tenantService.requireTenantId();

    return from(
      this.supabaseService.client.from('products').delete().eq('id', id).eq('tenant_id', tenantId),
    );
  }
}
