import { api } from './api';
import type { Product, Category, Promotion, ProductsResponse } from '@types/product';

export interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sort?: 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popular';
  featured?: boolean;
  trending?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export const productService = {
  getProducts: async (params: GetProductsParams = {}): Promise<ProductsResponse> => {
    const res = await api.get<ProductsResponse>('/api/v1/products', { params });
    return res.data;
  },

  getCategories: async (): Promise<Category[]> => {
    const res = await api.get<{ categories: Category[] }>('/api/v1/categories');
    return res.data.categories;
  },

  getPromotions: async (): Promise<Promotion[]> => {
    const res = await api.get<{ promotions: Promotion[] }>('/api/v1/products/promotions');
    return res.data.promotions;
  },

  getProductById: async (id: string): Promise<Product> => {
    const res = await api.get<{ product: Product }>(`/api/v1/products/${id}`);
    return res.data.product;
  },
};
