import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function downloadPdf() {
  const token = localStorage.getItem('token');
  return fetch('/api/reports/pdf', {
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).then(async (res) => {
    if (!res.ok) throw new Error('Failed to download PDF');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'smartbudget-report.pdf';
    a.click();
    URL.revokeObjectURL(url);
  });
}

export function downloadCsv() {
  const token = localStorage.getItem('token');
  return fetch('/api/transactions/export/csv', {
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).then(async (res) => {
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'smartbudget-transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  });
}

export default api;
