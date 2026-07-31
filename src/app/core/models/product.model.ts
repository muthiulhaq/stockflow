export interface Product {
  id: number;
  code?: string;
  name: string;
  cost_price: number;
  selling_price: number;
  stock?: number;
  active: boolean;
  tenant_id?: string;
}

export type CreateProduct = Omit<Product, 'id' | 'tenant_id'>;
