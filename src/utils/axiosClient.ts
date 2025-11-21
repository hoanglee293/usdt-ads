import axios from "axios"
import { useAuthStore } from "@/hooks/useAuth"

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const axiosClient = axios.create({
  baseURL: `${apiUrl}/api/v1`,
  withCredentials: true,
})

axiosClient.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)
axiosClient.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Gọi API refresh token với withCredentials
        await axios.post(`${apiUrl}/api/v1/users/refresh-token`, {}, {
          withCredentials: true,
        });   
        // Retry request gốc
        return axiosClient(originalRequest);
      } catch (refreshError: any) {
        // Nếu refresh token trả về 419, tự động logout
        if (refreshError?.response?.status === 419) {
          // Chỉ logout nếu đang ở client-side
          if (typeof window !== "undefined") {
            useAuthStore.getState().logout();
            // Redirect về trang login nếu chưa ở đó
            if (window.location.pathname !== "/login") {
              window.location.href = "/login";
            }
          }
        }
        console.warn("Refresh token failed:", refreshError);
      }
    } else if (error.code === "ERR_NETWORK") {
      console.warn("Máy chủ đang gặp sự cố !")
    }
    return Promise.reject(error)
  },
)

export default axiosClient
