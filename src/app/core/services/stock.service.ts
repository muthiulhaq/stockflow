import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { TenantService } from './tenant.service';

@Injectable({
  providedIn: 'root',
})
export class StockService {
  constructor(
    private supabase: SupabaseService,
    private tenantService: TenantService,
  ) {}

  getActiveProducts() {
    const tenantId = this.tenantService.requireTenantId();

    return from(
      this.supabase.client
        .from('products')
        .select('*')
        .eq('active', true)
        .eq('tenant_id', tenantId)
        .order('name'),
    );
  }

  /**
   * Balance rows live in stock_transactions (one logical balance per product_id).
   * Keep the query on this table so existing data still loads.
   */
  getStocks() {
    const tenantId = this.tenantService.requireTenantId();

    return from(
      this.supabase.client
        .from('stock_transactions')
        .select('id, product_id, name, quantity, created_at')
        .eq('tenant_id', tenantId)
        .order('id', { ascending: true }),
    );
  }

  addStockTransaction(transaction: any) {
    const tenantId = this.tenantService.requireTenantId();
    const createdBy = this.tenantService.requireUserId();

    return from(
      this.supabase.client
        .from('stock_transactions')
        .insert({ ...transaction, tenant_id: tenantId, created_by: createdBy })
        .select()
        .single(),
    );
  }

  /**
   * Apply a quantity delta to the product's balance row.
   * Creates the row if it does not exist yet.
   */
  updateProductStock(productId: number, delta: number, productName?: string): Observable<any> {
    return from(this.applyStockDelta(productId, delta, productName));
  }

  private async applyStockDelta(productId: number, delta: number, productName?: string) {
    const tenantId = this.tenantService.requireTenantId();

    const { data: rows, error: selectError } = await this.supabase.client
      .from('stock_transactions')
      .select('id, quantity, name')
      .eq('product_id', productId)
      .eq('tenant_id', tenantId)
      .order('id', { ascending: true });

    if (selectError) {
      throw selectError;
    }

    const balance = rows?.[0];
    const currentStock = Number(balance?.quantity) || 0;
    const newStock = currentStock + delta;

    if (newStock < 0) {
      throw new Error('Stock cannot be negative');
    }

    if (!balance) {
      return this.supabase.client
        .from('stock_transactions')
        .insert({
          product_id: productId,
          quantity: newStock,
          type: 'ADD',
          name: productName ?? String(productId),
          remarks: 'Opening balance',
          tenant_id: tenantId,
          created_by: this.tenantService.requireUserId(),
        })
        .select()
        .single();
    }

    return this.supabase.client
      .from('stock_transactions')
      .update({ quantity: newStock })
      .eq('id', balance.id)
      .eq('tenant_id', tenantId)
      .select()
      .single();
  }
}
