import { Injectable } from '@angular/core';
import { from } from 'rxjs';
import { SupabaseService } from './supabase.service';
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
  constructor(
    private supabase: SupabaseService,
    private stockService: StockService,
  ) {}

  // ------------------------
  // Save Sale
  // ------------------------

  saveSale(sale: any) {
    return from(this.supabase.client.from('sales').insert(sale).select().single());
  }

  // ------------------------
  // Save Sale Items
  // ------------------------

  saveSaleItems(items: SaleItem[]) {
    return from(this.supabase.client.from('sale_items').insert(items).select());
  }

  // ------------------------
  // Generate Invoice Number
  // ------------------------

  async generateInvoiceNo(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    const { data, error } = await this.supabase.client
      .from('sales')
      .select('id', { count: 'exact' })
      .eq('sale_date', today.toISOString().slice(0, 10));

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
  return from(
    this.supabase.client
      .from('products')
      .select(`
        id,
        name,
        selling_price,
        stock_transactions (
          quantity
        )
      `)
      .eq('active', true)
      .order('name')
  );
}

  // ------------------------
  // Get Products by ID
  // ------------------------

  getProductById(productId: number) {
    return from(this.supabase.client.from('products').select('*').eq('id', productId).single());
  }

  // ------------------------
  // Get Sales by Date (defaults to today)
  // ------------------------

  getTodaySales(date?: string) {
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
        .eq('sale_id', saleId),
    );
  }

  getSaleById(id: number) {
  return from(
    this.supabase.client
      .from('sales')
      .select(`
        *,
        sale_items (
          *,
          products (
            id,
            name
          )
        )
      `)
      .eq('id', id)
      .single()
  );
}

  // ------------------------
  // Sales report by date range
  // ------------------------

  getSalesByDateRange(fromDate: string, toDate: string) {
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
              code
            )
          )
          `,
        )
        .gte('sale_date', fromDate)
        .lte('sale_date', toDate)
        .order('sale_date', { ascending: false })
        .order('created_at', { ascending: false }),
    );
  }
}
