import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('shopease_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Handle 401 globally — redirect to login
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('shopease_token');
            localStorage.removeItem('shopease_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// AUTH
export const signup = (data) => API.post('/auth/signup', data);
export const login = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');

// PRODUCTS
export const getProducts = () => API.get('/products');
export const getLowStockProducts = () => API.get('/products/low-stock');
export const addProduct = (data) => API.post('/products', data);
export const updateProduct = (id, data) => API.put(`/products/${id}`, data);
export const deleteProduct = (id) => API.delete(`/products/${id}`);

// BILLS
export const createBill = (data) => API.post('/bills', data);
export const getBills = (params) => API.get('/bills', { params });
export const getBillById = (id) => API.get(`/bills/${id}`);
export const getTodayStats = () => API.get('/bills/stats/today');
export const deleteBill = (id) => API.delete(`/bills/${id}`);

export default API;
