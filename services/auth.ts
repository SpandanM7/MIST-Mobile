import api from './api';
import { saveToken, getToken, clearToken } from './api';

export { getToken, clearToken };

export type LoginPayload = {
  email: string;
  password: string;
};

type ApiResponse<T> = {
  success: boolean;
  message: string | null;
  data: T;
};

export const loginWaiter = async (payload: LoginPayload): Promise<void> => {
  const res = await api.post<ApiResponse<{ token: string }>>('/auth/login', {
    email: payload.email,
    password: payload.password,
  });
  if (!res.data.success) throw new Error(res.data.message ?? 'Login failed');
  await saveToken(res.data.data.token);
};