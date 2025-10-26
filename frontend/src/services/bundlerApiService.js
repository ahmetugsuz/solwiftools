import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api/bundler';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('jwt');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- Bundler Token API ---
export const bundlerTokens = {
  create: async (data) => {
    const response = await api.post('/tokens', data);
    return response.data;
  },
  getAll: async () => {
    const response = await api.get('/tokens');
    return response.data;
  },
  get: async (id) => {
    const response = await api.get(`/tokens/${id}`);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/tokens/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/tokens/${id}`);
    return response.data;
  },
  launch: async (id) => {
    const response = await api.post(`/tokens/${id}/launch`);
    return response.data;
  }
};

// --- Bundler Wallet API ---
export const bundlerWallets = {
  create: async (data) => {
    const response = await api.post('/wallets', data);
    return response.data;
  },
  getAll: async () => {
    const response = await api.get('/wallets');
    return response.data;
  },
  get: async (id) => {
    const response = await api.get(`/wallets/${id}`);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/wallets/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/wallets/${id}`);
    return response.data;
  }
};

// --- Bundler Bundle API ---
export const bundlerBundles = {
  create: async (data) => {
    const response = await api.post('/bundles', data);
    return response.data;
  },
  getAll: async () => {
    const response = await api.get('/bundles');
    return response.data;
  },
  get: async (id) => {
    const response = await api.get(`/bundles/${id}`);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/bundles/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/bundles/${id}`);
    return response.data;
  },
  execute: async (id) => {
    const response = await api.post(`/bundles/${id}/execute`);
    return response.data;
  }
};

export default {
  bundlerTokens,
  bundlerWallets,
  bundlerBundles
}; 