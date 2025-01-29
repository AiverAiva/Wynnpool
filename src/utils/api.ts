const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_API_URL || 'https://api.wynnpool.com';

const api = (endpoint: string) => `${API_BASE_URL}${endpoint}`;

export default api;
