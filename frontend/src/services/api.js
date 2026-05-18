// src/services/api.js
// Centralized API service — sab components yahi use karein

import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// ── Axios instance with JWT auto-attach ──────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
});

// Interceptor — har request mein token auto-add
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor — 401 aaye toh auto logout
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ─────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => axios.post(`${BASE_URL}/auth/login`, data),
  register: (data) => axios.post(`${BASE_URL}/auth/register`, data),
};

// ── Calculate ────────────────────────────────────────────────────
export const calculateAPI = {
  // POST /api/calculate — full formData bhejo
  submit: (formData) => api.post('/calculate', formData),

  // GET /api/calculate/history — user ki past calculations
  getHistory: () => api.get('/calculate/history'),
};

// ── Auth helpers ─────────────────────────────────────────────────
export const getToken = () => localStorage.getItem('token');
export const getUser = () => {
  const u = localStorage.getItem('user');
  return u ? JSON.parse(u) : null;
};
export const isLoggedIn = () => !!getToken();
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

export default api;