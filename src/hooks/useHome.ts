import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { productService, type GetProductsParams } from '@services/productService';
import { QUERY_KEYS } from '@constants/queryKeys';
import type { ProductsResponse } from '@typings/product';

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

export function useInfiniteProducts(
  params: Omit<GetProductsParams, 'page' | 'limit'>,
  enabled = true,
) {
  return useInfiniteQuery<ProductsResponse>({
    queryKey: [...QUERY_KEYS.products, 'infinite', params],
    queryFn: ({ pageParam }) =>
      productService.getProducts({ ...params, page: pageParam as number, limit: 12 }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page < last.totalPages ? last.page + 1 : undefined,
    staleTime: 1000 * 60 * 3,
    enabled,
  });
}
