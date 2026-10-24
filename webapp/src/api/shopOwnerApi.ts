import { apiClient } from './client';
import { ApiResponse, ShopOwnerDashboard, ShopDetail, UpdateShopOwnerProfileRequest } from '../types';

export const shopOwnerApi = {
  getDashboard: async (): Promise<ShopOwnerDashboard> => {
    const res = await apiClient.get<ApiResponse<ShopOwnerDashboard>>('/shop/dashboard');
    return res.data.data;
  },

  getProfile: async (): Promise<ShopDetail> => {
    const res = await apiClient.get<ApiResponse<ShopDetail>>('/shop/profile');
    return res.data.data;
  },

  updateProfile: async (payload: UpdateShopOwnerProfileRequest): Promise<ShopDetail> => {
    const res = await apiClient.put<ApiResponse<ShopDetail>>('/shop/profile', payload);
    return res.data.data;
  },

  getInfo: async (): Promise<import('../types').ShopBasicInfo> => {
    const res = await apiClient.get<ApiResponse<import('../types').ShopBasicInfo>>('/shop/info');
    return res.data.data;
  },
};
