export interface StockTransaction {
  id?: number;

  product_id: number;

  type: 'ADD' | 'REMOVE' | 'SALE' | 'RETURN';

  quantity: number;

  remarks?: string;

  reference_id?: string;

  created_at?: string;
}