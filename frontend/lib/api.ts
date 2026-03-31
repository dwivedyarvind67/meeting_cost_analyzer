import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
});

// 🔥 REQUEST INTERCEPTOR — auto-attach Bearer token
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 🔥 RESPONSE INTERCEPTOR — auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      const refresh = typeof window !== "undefined" ? localStorage.getItem("refresh") : null;

      if (refresh) {
        try {
          const res = await axios.post(`${API_URL}/refresh`, {
            refresh_token: refresh,
          });

          const newToken = res.data.access_token;
          localStorage.setItem("access", newToken);

          // Retry original request with new token
          err.config.headers.Authorization = `Bearer ${newToken}`;
          return axios(err.config);
        } catch {
          localStorage.clear();
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }
      }
    }

    return Promise.reject(err);
  }
);

export default api;
export { API_URL };