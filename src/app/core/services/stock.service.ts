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

  getStocks() {
    return from(
      this.supabase.client
        .from('stock_transactions')
        .select('*')
        .order('name')
    );
  }

 
}