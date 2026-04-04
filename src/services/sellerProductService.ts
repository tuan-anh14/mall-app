import { api } from './api';
import type {
  SellerProduct,
  CreateProductDto,
  UpdateProductDto,
} from '@typings/seller';

const BASE = '/api/v1/seller/products';

export const sellerProductService = {
  getProducts: async (search?: string): Promise<SellerProduct[]> => {
    const res = await api.get<{ products: SellerProduct[] }>(BASE, {
      params: search ? { search } : undefined,
    });
    return res.data.products;
  },

  createProduct: async (data: CreateProductDto): Promise<SellerProduct> => {
    const res = await api.post<{ product: SellerProduct }>(BASE, data);
    return res.data.product;
  },

  updateProduct: async (
    productId: string,
    data: UpdateProductDto,
  ): Promise<SellerProduct> => {
    const res = await api.put<{ product: SellerProduct }>(
      `${BASE}/${productId}`,
      data,
    );
    return res.data.product;
  },

  deleteProduct: async (productId: string): Promise<void> => {
    await api.delete(`${BASE}/${productId}`);
  },

  uploadImages: async (formData: FormData): Promise<string[]> => {
    const res = await api.post<{ urls: string[] }>('/api/v1/upload/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.urls;
  },
};
