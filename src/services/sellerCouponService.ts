import { api } from './api';
import type { SellerCoupon, CreateCouponDto, UpdateCouponDto } from '@typings/seller';

const BASE = '/api/v1/seller/coupons';

export const sellerCouponService = {
  getCoupons: async (): Promise<SellerCoupon[]> => {
    const res = await api.get<{ coupons: any[] }>(BASE);
    return res.data.coupons.map((c) => ({
      ...c,
      discountType: c.type,
      discountValue: c.value,
      usageCount: c._count?.usages ?? c.usages ?? 0,
    })) as SellerCoupon[];
  },

  createCoupon: async (data: CreateCouponDto): Promise<SellerCoupon> => {
    const payload = {
      ...data,
      type: data.discountType,
      value: data.discountValue,
    };
    const res = await api.post<any>(BASE, payload);
    return {
      ...res.data,
      discountType: res.data.type,
      discountValue: res.data.value,
    };
  },

  updateCoupon: async (
    couponId: string,
    data: UpdateCouponDto,
  ): Promise<SellerCoupon> => {
    const payload = {
      ...data,
      type: data.discountType,
      value: data.discountValue,
    };
    const res = await api.patch<any>(
      `${BASE}/${couponId}`,
      payload,
    );
    return {
      ...res.data,
      discountType: res.data.type,
      discountValue: res.data.value,
    };
  },

  deleteCoupon: async (couponId: string): Promise<void> => {
    await api.delete(`${BASE}/${couponId}`);
  },
};
