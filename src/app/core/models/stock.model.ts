export interface Stock {
  id: number;
  name: string;
  code: string;
  category: string;

  current_stock: number;
  minimum_stock: number;

  cost_price: number;
  selling_price: number;

  active: boolean;

  created_at: string;
}