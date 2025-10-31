import axios from "axios";

export const API = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export const http = axios.create({
  baseURL: API,
});

// attach token from localStorage on every request
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");  // where your teammate stored it
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

export default http;
