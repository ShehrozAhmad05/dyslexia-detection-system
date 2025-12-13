import api from './api';

// Authentication APIs
export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => {
    localStorage.removeItem('token');
    return Promise.resolve();
  },
  getCurrentUser: () => api.get('/auth/me'),
};

// Handwriting Analysis APIs
export const handwritingService = {
  upload: (formData) => api.post('/handwriting/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  analyze: (resultId) => api.post(`/handwriting/analyze/${resultId}`),
  getResults: (resultId) => api.get(`/handwriting/results/${resultId}`),
  getHistory: () => api.get('/handwriting/history'),
  delete: (resultId) => api.delete(`/handwriting/${resultId}`),
};

// Keystroke Analysis APIs
export const keystrokeService = {
  submitData: (keystrokeData) => api.post('/keystroke/analyze', keystrokeData),
  getResults: (assessmentId) => api.get(`/keystroke/results/${assessmentId}`),
};

// Reading Assessment APIs
export const readingService = {
  submitData: (readingData) => api.post('/reading/analyze', readingData),
  getResults: (assessmentId) => api.get(`/reading/results/${assessmentId}`),
};

// Assessment APIs
export const assessmentService = {
  getAll: () => api.get('/assessments'),
  getById: (id) => api.get(`/assessments/${id}`),
  getFinalScore: (id) => api.get(`/assessments/${id}/final-score`),
};

// User APIs
export const userService = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getProgress: () => api.get('/users/progress'),
};

// Therapy APIs
export const therapyService = {
  getRecommendations: (assessmentId) => api.get(`/therapy/recommendations/${assessmentId}`),
  getExercises: () => api.get('/therapy/exercises'),
  completeExercise: (exerciseId) => api.post(`/therapy/exercises/${exerciseId}/complete`),
};
