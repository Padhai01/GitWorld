import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:4000/api',
    timeout: 10000,
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('gw_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    res => res,
    err => {
        if (err.response?.status === 401) {
            localStorage.removeItem('gw_token');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export const authApi = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    me: () => api.get('/auth/me'),
    updateProfile: (data) => api.patch('/auth/profile', data),
};

export const usersApi = {
    getGlobe: () => api.get('/users/globe'),
    getAll: (params) => api.get('/users', { params }),
    getByName: (username) => api.get(`/users/${username}`),
};

export const reposApi = {
    create: (data) => api.post('/repos', data),
    update: (id, data) => api.patch(`/repos/${id}`, data),
    delete: (id) => api.delete(`/repos/${id}`),
    forUser: (userId) => api.get(`/repos/user/${userId}`),
};

export const warsApi = {
    getAll: (params) => api.get('/wars', { params }),
    forUser: (userId) => api.get(`/wars/user/${userId}`),
    declare: (data) => api.post('/wars/declare', data),
    respond: (warId, data) => api.post(`/wars/${warId}/respond`, data),
};

export const leaderboardApi = {
    get: (category) => api.get('/leaderboard', { params: { category } }),
    globeEvents: () => api.get('/leaderboard/globe-events'),
    notifications: () => api.get('/leaderboard/notifications'),
    readAll: () => api.post('/leaderboard/notifications/read-all'),
};

export default api;