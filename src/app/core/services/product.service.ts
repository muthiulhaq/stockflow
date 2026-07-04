import { Injectable } from '@angular/core';
import { from } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { Product, CreateProduct } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  constructor(private supabaseService: SupabaseService) {}

  getProducts() {
    return from(
      this.supabaseService.client
        .from('products')
        .select('*')
        .order('name')
    );
  }

  getProduct(id: number) {
    return from(
      this.supabaseService.client
        .from('products')
        .select('*')
        .eq('id', id)
        .single()
    );
  }

  addProduct(product: CreateProduct) {
    return from(
      this.supabaseService.client
        .from('products')
        .insert(product)
        .select()
        .single()
    );
  }

  updateProduct(id: number, product: Partial<CreateProduct>) {
    return from(
      this.supabaseService.client
        .from('products')
        .update(product)
        .eq('id', id)
        .select()
        .single()
    );
  }

  deleteProduct(id: number) {
    return from(
      this.supabaseService.client
        .from('products')
        .delete()
        .eq('id', id)
    );
  }
}