import axiosInstance from "../api/axios";
import { API_ENDPOINTS } from "../api/endpoints";

export const login = async (credentials) => {
  const response = await axiosInstance.post(
    API_ENDPOINTS.auth.login,
    credentials
  );
  const { token } = response.data;
  localStorage.setItem("token", token);
  return response.data;
};

export const register = async (userData) => {
  const response = await axiosInstance.post(
    API_ENDPOINTS.auth.register,
    userData
  );
  const { token } = response.data;
  localStorage.setItem("token", token);
  return response.data;
};

export const logout = () => {
  localStorage.removeItem("token");
};
