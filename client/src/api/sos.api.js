import api from './axios';

export const sosApi = {
  getAll: async () => {
    const res = await api.get('/sos');
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/sos/${id}`);
    return res.data;
  },
  trigger: async (latitude, longitude, address) => {
    const res = await api.post('/sos', { latitude, longitude, address });
    return res.data;
  },
  acknowledge: async (id) => {
    const res = await api.patch(`/sos/${id}/acknowledge`);
    return res.data;
  },
  dispatch: async (id, officerUserId) => {
    const res = await api.patch(`/sos/${id}/dispatch`, { officerUserId });
    return res.data;
  },
  resolve: async (id) => {
    const res = await api.patch(`/sos/${id}/resolve`);
    return res.data;
  },
  escalate: async (id) => {
    const res = await api.patch(`/sos/${id}/escalate`);
    return res.data;
  }
};
