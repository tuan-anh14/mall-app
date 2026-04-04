import { api } from './api';
import type { SellerCoupon, CreateCouponDto, UpdateCouponDto } from '@typings/seller';

const BASE = '/api/v1/seller/coupons';

export const sellerCouponService = {
  getCoupons: async (): Promise<SellerCoupon[]> => {
    const res = await api.get<{ coupons: SellerCoupon[] }>(BASE);
    return res.data.coupons;
  },

  createCoupon: async (data: CreateCouponDto): Promise<SellerCoupon> => {
    const res = await api.post<SellerCoupon>(BASE, data);
    return res.data;
  },

  updateCoupon: async (
    couponId: string,
    data: UpdateCouponDto,
  ): Promise<SellerCoupon> => {
    const res = await api.patch<SellerCoupon>(
      `${BASE}/${couponId}`,
      data,
    );
    return res.data;
  },

  deleteCoupon: async (couponId: string): Promise<void> => {
    await api.delete(`${BASE}/${couponId}`);
  },
};
