import { apiClient } from './client';
import { ApiResponse, PageResponse, Employee, EmployeeStats, CreateEmployeeRequest, UpdateEmployeeRequest } from '../types';

export const employeeApi = {
  getEmployees: async (params?: {
    search?: string;
    status?: string;
    designation?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<Employee>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<Employee>>>('/shop/employees', { params });
    return res.data.data;
  },

  getStats: async (): Promise<EmployeeStats> => {
    const res = await apiClient.get<ApiResponse<EmployeeStats>>('/shop/employees/stats');
    return res.data.data;
  },

  getEmployeeById: async (id: number): Promise<Employee> => {
    const res = await apiClient.get<ApiResponse<Employee>>(`/shop/employees/${id}`);
    return res.data.data;
  },

  createEmployee: async (data: CreateEmployeeRequest): Promise<Employee> => {
    const res = await apiClient.post<ApiResponse<Employee>>('/shop/employees', data);
    return res.data.data;
  },

  updateEmployee: async (id: number, data: UpdateEmployeeRequest): Promise<Employee> => {
    const res = await apiClient.put<ApiResponse<Employee>>(`/shop/employees/${id}`, data);
    return res.data.data;
  },

  changeStatus: async (id: number, status: string): Promise<Employee> => {
    const res = await apiClient.patch<ApiResponse<Employee>>(`/shop/employees/${id}/status`, null, {
      params: { status },
    });
    return res.data.data;
  },

  resetPassword: async (id: number, newPassword: string): Promise<void> => {
    await apiClient.post<ApiResponse<void>>(`/shop/employees/${id}/reset-password`, { newPassword });
  },
};
