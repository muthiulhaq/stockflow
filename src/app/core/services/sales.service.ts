import { Injectable } from '@angular/core';
import { firstValueFrom, from, Subject } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { TenantService } from './tenant.service';
import { StockService } from './stock.service';

export interface Sale {
  invoice_no: string;
  sale_date: string;
  subtotal: number;
  discount: number;
  total: number;
  notes?: string;
}

export interface SaleItem {
  sale_id: number;
  product_id: number;
  quantity: number;
  price: number;
  total: number;
}

@Injectable({
  providedIn: 'root',
})
export class SalesService {
  private salesChangedSubject = new Subject<void>();
  readonly salesChanged$ = this.salesChangedSubject.asObservable();

  constructor(
    private supabase: SupabaseService,
    private stockService: StockService,
    private tenantService: TenantService,
  ) {}

  notifySalesChanged(): void {
    this.salesChangedSubject.next();
  }

  // ------------------------
  // Save Sale
  // ------------------------

  saveSale(sale: any) {
    const tenantId = this.tenantService.requireTenantId();
    const createdBy = this.tenantService.requireUserId();

    return from(
      this.supabase.client
        .from('sales')
        .insert({ ...sale, tenant_id: tenantId, created_by: createdBy })
        .select()
        .single(),
    );
  }

  // ------------------------
  // Save Sale Items
  // ------------------------

  saveSaleItems(items: SaleItem[]) {
    const tenantId = this.tenantService.requireTenantId();
    const createdBy = this.tenantService.requireUserId();

    const rows = items.map((item) => ({
      ...item,
      tenant_id: tenantId,
      created_by: createdBy,
    }));

    return from(this.supabase.client.from('sale_items').insert(rows).select());
  }

  deleteSale(saleId: number) {
    return from(this.deleteSaleAndRestoreStock(saleId));
  }

  private async deleteSaleAndRestoreStock(saleId: number) {
    const tenantId = this.tenantService.requireTenantId();

    const { data: items, error: itemsError } = await this.supabase.client
      .from('sale_items')
      .select('product_id, quantity')
      .eq('sale_id', saleId)
      .eq('tenant_id', tenantId);

    if (itemsError) {
      throw itemsError;
    }

    const { error: deleteItemsError } = await this.supabase.client
      .from('sale_items')
      .delete()
      .eq('sale_id', saleId)
      .eq('tenant_id', tenantId);

    if (deleteItemsError) {
      throw deleteItemsError;
    }

    const { error: deleteSaleError } = await this.supabase.client
      .from('sales')
      .delete()
      .eq('id', saleId)
      .eq('tenant_id', tenantId);

    if (deleteSaleError) {
      throw deleteSaleError;
    }

    for (const item of items ?? []) {
      const result = await firstValueFrom(
        this.stockService.updateProductStock(item.product_id, item.quantity),
      );

      if (result?.error) {
        throw result.error;
      }
    }

    this.notifySalesChanged();
  }

  // ------------------------
  // Generate Invoice Number
  // ------------------------

  async generateInvoiceNo(): Promise<string> {
    const tenantId = this.tenantService.requireTenantId();
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const saleDate = today.toISOString().slice(0, 10);

    const { data, error } = await this.supabase.client
      .from('sales')
      .select('id', { count: 'exact' })
      .eq('sale_date', saleDate)
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
    }

    const count = (data?.length || 0) + 1;
    const sequence = String(count).padStart(4, '0');

    return `INV-${dateStr}-${sequence}`;
  }

  // ------------------------
  // Get Products
  // ------------------------

  getProducts() {
    const tenantId = this.tenantService.requireTenantId();

    return from(
      this.supabase.client
        .from('products')
        .select(
          `
        id,
        name,
        selling_price,
        stock_transactions (
          quantity
        )
      `,
        )
        .eq('active', true)
        .eq('tenant_id', tenantId)
        .order('name'),
    );
  }

  // ------------------------
  // Get Products by ID
  // ------------------------

  getProductById(productId: number) {
    const tenantId = this.tenantService.requireTenantId();

    return from(
      this.supabase.client
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('tenant_id', tenantId)
        .single(),
    );
  }

  // ------------------------
  // Get Sales by Date (defaults to today)
  // ------------------------

  getTodaySales(date?: string) {
    const tenantId = this.tenantService.requireTenantId();
    const saleDate = date ?? this.toLocalDateString(new Date());

    return from(
      this.supabase.client
        .from('sales')
        .select(
          `
          id,
          invoice_no,
          created_at,
          sale_date,
          customer_name,
          customer_phone,
          discount,
          total,
          notes,
          sale_items (
            id,
            quantity,
            product_id
          )
          `,
        )
        .eq('sale_date', saleDate)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false }),
    );
  }

  private toLocalDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  //get sales detials for the Dialog

  getSaleItemsBySaleId(saleId: number) {
    const tenantId = this.tenantService.requireTenantId();

    return from(
      this.supabase.client
        .from('sale_items')
        .select(
          `
        *,
        products (
          id,
          code,
          name,
          selling_price
        )
      `,
        )
        .eq('sale_id', saleId)
        .eq('tenant_id', tenantId),
    );
  }

  getSaleById(id: number) {
    const tenantId = this.tenantService.requireTenantId();

    return from(
      this.supabase.client
        .from('sales')
        .select(
          `
        *,
        sale_items (
          *,
          products (
            id,
            name
          )
        )
      `,
        )
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single(),
    );
  }

  // ------------------------
  // Sales report by date range
  // ------------------------

  getSalesByDateRange(fromDate: string, toDate: string) {
    const tenantId = this.tenantService.requireTenantId();

    return from(
      this.supabase.client
        .from('sales')
        .select(
          `
          id,
          invoice_no,
          sale_date,
          created_at,
          customer_name,
          customer_phone,
          subtotal,
          discount,
          total,
          notes,
          sale_items (
            id,
            quantity,
            price,
            total,
            product_id,
            products (
              id,
              name,
              code,
              cost_price
            )
          )
          `,
        )
        .eq('tenant_id', tenantId)
        .gte('sale_date', fromDate)
        .lte('sale_date', toDate)
        .order('sale_date', { ascending: false })
        .order('created_at', { ascending: false }),
    );
  }
}
