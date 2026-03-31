import { useQuery } from '@tanstack/react-query';
import { productService, type GetProductsParams } from '@services/productService';
import { QUERY_KEYS } from '@constants/queryKeys';

export function useCategories() {
  return useQuery({
    queryKey: QUERY_KEYS.categories,
    queryFn: productService.getCategories,
    staleTime: 1000 * 60 * 10,
  });
}

export function usePromotions() {
  return useQuery({
    queryKey: QUERY_KEYS.promotions,
    queryFn: productService.getPromotions,
    staleTime: 1000 * 60 * 5,
  });
}

export function useProducts(params: GetProductsParams = {}, enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEYS.products, params],
    queryFn: () => productService.getProducts(params),
    staleTime: 1000 * 60 * 3,
    enabled,
  });
}
