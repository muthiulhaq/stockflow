import { Injectable } from '@angular/core';
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
  // Products
  // ------------------------

  async getProducts(search: string = '') {

    let query = this.supabase.client
      .from('products')
      .select('*')
      .eq('active', true)
      .order('name');

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,code.ilike.%${search}%`
      );
    }

    return await query;

  }

  async getProduct(id: number) {

    return await this.supabase.client
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

  }

  async updateCurrentStock(
    productId: number,
    stock: number
  ) {

    return await this.supabase.client
      .from('products')
      .update({
        current_stock: stock
      })
      .eq('id', productId);

  }

  // ------------------------
  // History
  // ------------------------

  async getHistory(productId: number) {

    return await this.supabase.client
      .from('stock_transactions')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', {
        ascending: false
      });

  }

  // ------------------------
  // Save Transaction
  // ------------------------

  async saveTransaction(
    transaction: StockTransaction
  ) {

    return await this.supabase.client
      .from('stock_transactions')
      .insert(transaction);

  }

  // ------------------------
  // Move Stock
  // ------------------------

  async moveStock(
    productId: number,
    type: 'ADD' | 'REMOVE',
    quantity: number,
    remarks?: string
  ) {

    const { data: product, error } =
      await this.getProduct(productId);

    if (error) {
      throw error;
    }

    let newStock = Number(product.current_stock);

    if (type === 'ADD') {
      newStock += quantity;
    }
    else {

      if (newStock < quantity) {
        throw new Error('Insufficient stock.');
      }

      newStock -= quantity;

    }

    const { error: updateError } =
      await this.updateCurrentStock(
        productId,
        newStock
      );

    if (updateError) {
      throw updateError;
    }

    const { error: transactionError } =
      await this.saveTransaction({

        product_id: productId,

        type,

        quantity:
          type === 'ADD'
            ? quantity
            : -quantity,

        remarks

      });

    if (transactionError) {
      throw transactionError;
    }

    return true;

  }

}