import axios from 'axios';

const API_URL = '/api';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to attach the auth token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const authService = {
    login: async (username, password) => {
        const response = await api.post('/auth/login', { username, password });
        if (response.data.access_token) {
            localStorage.setItem('access_token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    register: async ({ full_name, email, phone, age, gender, password }) => {
        const response = await api.post('/auth/register', {
            full_name,
            email,
            phone,  // Backend strips +91 if present
            age: age ? parseInt(age) : null,
            gender: gender || null,
            password,
        });
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
    },

    getUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('access_token');
    },
};

export const predictionService = {
    getDiseases: async () => {
        const res = await api.get('/predict/diseases');
        return res.data.diseases;
    },

    getFeatures: async (disease) => {
        const res = await api.get(`/predict/diseases/${disease}/features`);
        return res.data;
    },

    predict: async (disease, featureData) => {
        const res = await api.post(`/predict/${disease}`, featureData);
        return res.data;
    },

    getHistory: async () => {
        const res = await api.get('/predict/history');
        return res.data;
    },

    getDetail: async (id) => {
        const res = await api.get(`/predict/history/${id}`);
        return res.data;
    },
};

export const analyticsService = {
    getPersonalAnalytics: async () => {
        const res = await api.get('/analytics/personal');
        return res.data;
    },

    getPublicAnalytics: async () => {
        const res = await api.get('/analytics/public');
        return res.data;
    },
};

export const assistantService = {
    chat: async (message, predictionId = null, history = []) => {
        const payload = { message, history };
        if (predictionId) payload.prediction_id = predictionId;
        const res = await api.post('/assistant/chat', payload);
        return res.data;
    },
};
