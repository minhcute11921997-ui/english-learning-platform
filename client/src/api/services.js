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

export const assessmentApi = {
  getQuestions: () => api.get('/assessment/start'),
  submitAssessment: (answers) => api.post('/assessment/submit', { answers }),
  getHistory: () => api.get('/assessment/history')
};

export const topicApi = {
  getAll: () => api.get('/topics'),
  getById: (id) => api.get(`/topics/${id}`)
};

export const vocabApi = {
  getByTopic: (topicId, params) => api.get(`/vocabularies/topic/${topicId}`, { params }),
  getById: (id) => api.get(`/vocabularies/${id}`),
  markAsLearned: (id) => api.post(`/vocabularies/${id}/learn`),
  search: (q) => api.get('/vocabularies/search', { params: { q } })
};

export const exerciseApi = {
  getVocabExercises: (topicId, count = 10) => api.get(`/exercises/vocab/${topicId}`, { params: { count } }),
  submitVocabExercises: (results) => api.post('/exercises/vocab/submit', { results })
};

export const reviewApi = {
  getDue: (limit = 30) => api.get('/reviews/due', { params: { limit } }),
  getUpcoming: (days = 7) => api.get('/reviews/upcoming', { params: { days } }),
  getStats: () => api.get('/reviews/stats'),
  answerReview: (vocabId, data) => api.post(`/reviews/${vocabId}/answer`, data)
};

export const readingApi = {
  getAll: (params) => api.get('/readings', { params }),
  getById: (id) => api.get(`/readings/${id}`),
  submitAttempt: (id, data) => api.post(`/readings/${id}/attempt`, data),
  getResults: (id) => api.get(`/readings/${id}/results`),
  getRecommended: () => api.get('/readings/recommended')
};

export const groupApi = {
  getMyGroups: () => api.get('/groups/my'),
  getById: (id) => api.get(`/groups/${id}`),
  create: (data) => api.post('/groups', data),
  join: (invite_code) => api.post('/groups/join', { invite_code }),
  update: (id, data) => api.put(`/groups/${id}`, data),
  removeMember: (id, userId) => api.delete(`/groups/${id}/members/${userId}`),
  regenerateCode: (id) => api.post(`/groups/${id}/regenerate-code`),
  createVocabSet: (id, data) => api.post(`/groups/${id}/vocab-sets`, data),
  publishVocabSet: (id, setId) => api.post(`/groups/${id}/vocab-sets/${setId}/publish`),
  addReading: (id, reading_id) => api.post(`/groups/${id}/reading-sets`, { reading_id }),
  getProgress: (id) => api.get(`/groups/${id}/progress`)
};

export const communityApi = {
  getPosts: (params) => api.get('/community', { params }),
  submitPost: (data) => api.post('/community/submit', data),
  getMyPosts: () => api.get('/community/my-posts'),
  upvote: (id) => api.post(`/community/${id}/upvote`)
};

export const adminApi = {
  getUsers: (params) => api.get('/admin/users', { params }),
  updateRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  toggleStatus: (id) => api.put(`/admin/users/${id}/status`),
  createVocab: (data) => api.post('/admin/vocabularies', data),
  updateVocab: (id, data) => api.put(`/admin/vocabularies/${id}`, data),
  deleteVocab: (id) => api.delete(`/admin/vocabularies/${id}`),
  createReading: (data) => api.post('/admin/readings', data),
  updateReading: (id, data) => api.put(`/admin/readings/${id}`, data),
  deleteReading: (id) => api.delete(`/admin/readings/${id}`),
  getPendingPosts: () => api.get('/admin/community/pending'),
  reviewPost: (id, data) => api.put(`/admin/community/${id}/review`, data)
};

export const statsApi = {
  getOverview: () => api.get('/stats/overview'),
  getMyProgress: () => api.get('/stats/my-progress'),
  getLearningTrends: () => api.get('/stats/learning-trends')
};
