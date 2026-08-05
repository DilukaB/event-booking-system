import api from './axios';

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// ─── Events API ───────────────────────────────────────────────────────────────
export const eventsAPI = {
  getAll: (params) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  create: (formData) =>
    api.post('/events', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id, formData) =>
    api.put(`/events/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id) => api.delete(`/events/${id}`),
};

// ─── Tickets API ──────────────────────────────────────────────────────────────
export const ticketsAPI = {
  book: (data) => api.post('/tickets', data),
  getMyTickets: (params) => api.get('/tickets/my-tickets', { params }),
  getById: (id) => api.get(`/tickets/${id}`),
  cancel: (id) => api.put(`/tickets/${id}/cancel`),
  delete: (id) => api.delete(`/tickets/${id}`),
};
