import { create } from 'zustand';
import { authApi } from '../api/auth.api';

/**
 * Zustand store quản lý trạng thái authentication
 */
const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  /**
   * Đăng nhập
   */
  login: async (credentials) => {
    const response = await authApi.login(credentials);
    const { user, accessToken, refreshToken } = response.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    set({ user, isAuthenticated: true, isLoading: false });
    return response;
  },

  /**
   * Đăng ký
   */
  register: async (userData) => {
    const response = await authApi.register(userData);
    const { user, accessToken, refreshToken } = response.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    set({ user, isAuthenticated: true, isLoading: false });
    return response;
  },

  /**
   * Đăng xuất
   */
  logout: async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Ignore logout errors
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  /**
   * Kiểm tra trạng thái auth khi load app
   */
  checkAuth: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ isLoading: false });
      return;
    }

    try {
      const response = await authApi.getMe();
      set({ user: response.data, isAuthenticated: true, isLoading: false });
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  /**
   * Cập nhật thông tin user trong store
   */
  updateUser: (userData) => {
    set({ user: { ...get().user, ...userData } });
  }
}));

export default useAuthStore;
