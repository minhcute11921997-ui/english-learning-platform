import api from './axios';

export const userApi = {
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/password', data),
  setLearningGoal: (learning_goal) => api.put('/users/learning-goal', { learning_goal }),
  uploadAvatar: (formData) =>
    api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
};

export const topicApi = {
  getAll: () => api.get('/topics'),
  getById: (id) => api.get(`/topics/${id}`)
};

export const vocabApi = {
  getByTopic: (topicId, params) => api.get(`/vocabularies/topic/${topicId}`, { params }),
  getById: (id) => api.get(`/vocabularies/${id}`),
  markAsLearned: (id) => api.post(`/vocabularies/${id}/learn`),
  search: (q, params = {}) => api.get('/vocabularies/search', { params: { q, ...params } })
};

export const exerciseApi = {
  getVocabExercises: (topicId, count = 10, attemptId) => api.get(`/exercises/vocab/${topicId}`, { params: { count, attemptId } }),
  submitVocabExercises: (results, attempt_id) => api.post('/exercises/vocab/submit', { attempt_id, results })
};

export const reviewApi = {
  getDue: (limit = 30) => api.get('/reviews/due', { params: { limit } }),
  getLearning: (limit = 100) => api.get('/reviews/learning', { params: { limit } }),
  getUpcoming: (days = 7) => api.get('/reviews/upcoming', { params: { days } }),
  getStats: () => api.get('/reviews/stats'),
  answer: (vocabId, data) => api.post(`/reviews/${vocabId}/answer`, data),
  answerReview: (vocabId, data) => api.post(`/reviews/${vocabId}/answer`, data)
};

export const adminApi = {
  getUsers: (params) => api.get('/admin/users', { params }),
  updateRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  toggleStatus: (id) => api.put(`/admin/users/${id}/status`),
  createVocab: (data) => api.post('/admin/vocabularies', data),
  updateVocab: (id, data) => api.put(`/admin/vocabularies/${id}`, data),
  deleteVocab: (id) => api.delete(`/admin/vocabularies/${id}`)
};

export const statsApi = {
  getOverview: () => api.get('/stats/overview'),
  getMyProgress: () => api.get('/stats/my-progress'),
  getLearningTrends: () => api.get('/stats/learning-trends')
};

export const vocabListApi = {
  getAll: () => api.get('/vocab-lists'),
  getById: (id) => api.get(`/vocab-lists/${id}`),
  create: (data) => api.post('/vocab-lists', data),
  update: (id, data) => api.put(`/vocab-lists/${id}`, data),
  delete: (id) => api.delete(`/vocab-lists/${id}`),
  syncWord: (data) => api.post('/vocab-lists/words/sync', data),
  removeWord: (listId, vocabId) => api.delete(`/vocab-lists/${listId}/words/${vocabId}`),
  getWordMembership: (params) => api.get('/vocab-lists/words/membership', { params })
};
