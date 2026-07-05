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
  providedIn: 'root'
})
export class SalesService {

  constructor(
    private supabase: SupabaseService,
    private stockService: StockService
  ) { }

  // ------------------------
  // Save Sale
  // ------------------------

  saveSale(sale: any) {
    return from(
      this.supabase.client
        .from('sales')
        .insert(sale)
        .select()
        .single()
    );
  }

  // ------------------------
  // Save Sale Items
  // ------------------------

  saveSaleItems(items: SaleItem[]) {
    return from(
      this.supabase.client
        .from('sale_items')
        .insert(items)
        .select()
    );
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
        .select('id, name, selling_price')
        .eq('active', true)
        .order('name')
    );
  }

  // ------------------------
  // Get Product by ID
  // ------------------------

  getProductById(productId: number) {
    return from(
      this.supabase.client
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()
    );
  }
}
