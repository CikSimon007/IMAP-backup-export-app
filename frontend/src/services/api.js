const API_BASE = '/api';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Account API
export const accountsApi = {
  getAll: () => apiCall('/accounts'),

  getById: (id) => apiCall(`/accounts/${id}`),

  create: (accountData) => apiCall('/accounts', {
    method: 'POST',
    body: JSON.stringify(accountData),
  }),

  update: (id, updates) => apiCall(`/accounts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),

  delete: (id) => apiCall(`/accounts/${id}`, {
    method: 'DELETE',
  }),
};

// Sync API
export const syncApi = {
  start: (accountId) => apiCall(`/sync/${accountId}`, {
    method: 'POST',
  }),

  getStatus: (accountId) => apiCall(`/sync/${accountId}/status`),

  export: (sourceAccountId, targetAccountId, mailboxes = []) => apiCall('/sync/export', {
    method: 'POST',
    body: JSON.stringify({ sourceAccountId, targetAccountId, mailboxes }),
  }),

  getExportStatus: (exportId) => apiCall(`/sync/export/${encodeURIComponent(exportId)}/status`),
};

// Health check
export const healthCheck = () => apiCall('/health');
