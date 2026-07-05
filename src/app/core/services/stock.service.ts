import { Injectable } from '@angular/core';
import { from } from 'rxjs';
import { SupabaseService } from './supabase.service';

import { Stock } from '../models/stock.model';
import { StockTransaction } from '../models/stock-transaction.model';

@Injectable({
  providedIn: 'root'
})
export class StockService {

  constructor(
    private supabase: SupabaseService
  ) { }

    // ------------------------
  // Get Stocks (Observable)
  // ------------------------

getActiveProducts() {
  return from(
    this.supabase.client
      .from('products')
      .select('*')
      .eq('active', true)
      .order('name')
  );
}

  // ------------------------
  // Get Stocks (Observable)
  // ------------------------

  getStocks() {
    return from(
      this.supabase.client
        .from('stock_transactions')
        .select('*')
        .order('name')
    );
  }

  // ------------------------
  // Add Stock Transaction
  // ------------------------

  addStockTransaction(transaction: any) {
    return from(
      this.supabase.client
        .from('stock_transactions')
        .insert(transaction)
        .select()
        .single()
    );
  }

  // ------------------------
  // Update Product Stock
  // ------------------------

  updateProductStock(productId: number, quantity: number) {
    return from(
      this.supabase.client
        .from('stock_transactions')
        .select('quantity')
        .eq('id', productId)
        .single()
        .then((result: any) => {
          // const currentStock = result.data?.quantity || 0;
          // const newStock = currentStock + quantity;

          return this.supabase.client
            .from('stock_transactions')
            .update({ quantity: quantity })
            .eq('id', productId);
        })
    );
  }
}