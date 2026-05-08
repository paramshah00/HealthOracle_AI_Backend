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

    getProfile: async () => {
        const res = await api.get('/auth/profile');
        if (res.data) {
            localStorage.setItem('user', JSON.stringify(res.data));
        }
        return res.data;
    },

    updateProfile: async (data) => {
        const res = await api.put('/auth/profile', data);
        if (res.data) {
            localStorage.setItem('user', JSON.stringify(res.data));
        }
        return res.data;
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


// ═══════════════════════════════════════════════════
//  ADMIN SERVICE
// ═══════════════════════════════════════════════════

// Separate axios instance for admin — uses admin token
const adminApi = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

adminApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('admin_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const adminService = {
    login: async (admin_id, password) => {
        const res = await api.post('/admin/login', { admin_id, password });
        if (res.data.access_token) {
            localStorage.setItem('admin_token', res.data.access_token);
        }
        return res.data;
    },

    logout: () => {
        localStorage.removeItem('admin_token');
    },

    isAdmin: () => {
        return !!localStorage.getItem('admin_token');
    },
};


// ═══════════════════════════════════════════════════
//  DOCTOR SERVICE
// ═══════════════════════════════════════════════════

export const doctorService = {
    // User-facing
    listDoctors: async (specialization = '', search = '') => {
        const params = new URLSearchParams();
        if (specialization) params.append('specialization', specialization);
        if (search) params.append('search', search);
        const paramStr = params.toString();
        const res = await api.get(`/doctors/${paramStr ? '?' + paramStr : ''}`);
        return res.data;
    },

    getDoctorsByDisease: async (disease) => {
        const res = await api.get(`/doctors/by-disease/${disease}`);
        return res.data;
    },

    getDoctor: async (id) => {
        const res = await api.get(`/doctors/${id}`);
        return res.data;
    },

    getSpecializations: async () => {
        const res = await api.get('/doctors/specializations');
        return res.data.specializations;
    },

    // Admin-only
    listAllDoctors: async () => {
        const res = await adminApi.get('/doctors/all');
        return res.data;
    },

    enrollDoctor: async (data) => {
        const res = await adminApi.post('/doctors/', data);
        return res.data;
    },

    updateDoctor: async (id, data) => {
        const res = await adminApi.put(`/doctors/${id}`, data);
        return res.data;
    },

    deleteDoctor: async (id) => {
        const res = await adminApi.delete(`/doctors/${id}`);
        return res.data;
    },
};


// ═══════════════════════════════════════════════════
//  APPOINTMENT SERVICE
// ═══════════════════════════════════════════════════

export const appointmentService = {
    bookAppointment: async (data) => {
        const res = await api.post('/appointments/', data);
        return res.data;
    },

    getMyAppointments: async () => {
        const res = await api.get('/appointments/');
        return res.data;
    },

    getAppointment: async (id) => {
        const res = await api.get(`/appointments/${id}`);
        return res.data;
    },

    cancelAppointment: async (id) => {
        const res = await api.put(`/appointments/${id}/cancel`);
        return res.data;
    },
};


// ═══════════════════════════════════════════════════
//  DOCTOR AUTH SERVICE
// ═══════════════════════════════════════════════════

// Separate axios instance for doctor — uses doctor_token
const doctorApi = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

doctorApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('doctor_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const doctorAuthService = {
    login: async (email, password) => {
        const res = await api.post('/doctor-auth/login', { email, password });
        if (res.data.access_token) {
            localStorage.setItem('doctor_token', res.data.access_token);
            localStorage.setItem('doctor', JSON.stringify(res.data.doctor));
        }
        return res.data;
    },

    register: async (data) => {
        const res = await api.post('/doctor-auth/register', data);
        return res.data;
    },

    logout: () => {
        localStorage.removeItem('doctor_token');
        localStorage.removeItem('doctor');
    },

    getDoctor: () => {
        const doc = localStorage.getItem('doctor');
        return doc ? JSON.parse(doc) : null;
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('doctor_token');
    },
};


// ═══════════════════════════════════════════════════
//  DOCTOR PORTAL SERVICE (self-service)
// ═══════════════════════════════════════════════════

export const doctorPortalService = {
    getProfile: async () => {
        const res = await doctorApi.get('/doctors/me/profile');
        return res.data;
    },

    updateProfile: async (data) => {
        const res = await doctorApi.put('/doctors/me/profile', data);
        return res.data;
    },

    getMyAppointments: async () => {
        const res = await doctorApi.get('/doctors/me/appointments');
        return res.data;
    },

    updateAppointmentStatus: async (appointmentId, status) => {
        const res = await doctorApi.put(`/doctors/me/appointments/${appointmentId}/status?status=${status}`);
        return res.data;
    },
};
