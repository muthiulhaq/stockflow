import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class StockService {
  constructor(private supabase: SupabaseService) {}

  getActiveProducts() {
    return from(
      this.supabase.client.from('products').select('*').eq('active', true).order('name'),
    );
  }

  /**
   * Balance rows live in stock_transactions (one logical balance per product_id).
   * Keep the query on this table so existing data still loads.
   */
  getStocks() {
    return from(
      this.supabase.client
        .from('stock_transactions')
        .select('id, product_id, name, quantity, created_at')
        .order('id', { ascending: true }),
    );
  }

  addStockTransaction(transaction: any) {
    return from(
      this.supabase.client.from('stock_transactions').insert(transaction).select().single(),
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
    const { data: rows, error: selectError } = await this.supabase.client
      .from('stock_transactions')
      .select('id, quantity, name')
      .eq('product_id', productId)
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
        })
        .select()
        .single();
    }

    return this.supabase.client
      .from('stock_transactions')
      .update({ quantity: newStock })
      .eq('id', balance.id)
      .select()
      .single();
  }
}
