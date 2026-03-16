export interface Product {
  _id?: string;
  id: string;
  companyId: string;
  name: string;
  description?: string;
  price: number;
  taxRate: number;
  sku?: string;
  category?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormData {
  name: string;
  description?: string;
  price: number;
  taxRate: number;
  sku?: string;
  category?: string;
}
