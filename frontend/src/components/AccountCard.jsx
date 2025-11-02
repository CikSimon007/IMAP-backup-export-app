import { useState, useEffect } from 'react';
import { syncApi } from '../services/api';

export default function AccountCard({ account, onDelete }) {
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [error, setError] = useState(null);

  // Poll for sync status
  useEffect(() => {
    let interval;
    if (syncing) {
      interval = setInterval(async () => {
        try {
          const status = await syncApi.getStatus(account.id);
          setSyncStatus(status);

          if (status.status === 'completed' || status.status === 'failed') {
            setSyncing(false);
            if (status.status === 'failed') {
              setError(status.error);
            }
          }
        } catch (err) {
          console.error('Failed to get sync status:', err);
        }
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [syncing, account.id]);

  const handleSync = async () => {
    try {
      setError(null);
      setSyncStatus(null);
      setSyncing(true);
      await syncApi.start(account.id);
    } catch (err) {
      setError(err.message);
      setSyncing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
      <div className="p-6">
        {/* Account Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">{account.email}</h3>
              <p className="text-sm text-gray-500">
                {account.host}:{account.port}
              </p>
            </div>
          </div>
          <button
            onClick={() => onDelete(account.id)}
            className="text-gray-400 hover:text-red-600"
            title="Delete account"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>

        {/* Account Details */}
        <div className="mt-4 border-t border-gray-200 pt-4">
          <dl className="space-y-2">
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">Username:</dt>
              <dd className="text-gray-900 font-medium">{account.username}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">Last Sync:</dt>
              <dd className="text-gray-900">{formatDate(account.lastSync)}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">Status:</dt>
              <dd>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  account.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {account.status}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Sync Status */}
        {syncStatus && syncStatus.status !== 'idle' && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <div className="flex items-center">
              {syncStatus.status === 'running' && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              )}
              <span className="text-sm text-blue-800">
                {syncStatus.status === 'running' && 'Syncing...'}
                {syncStatus.status === 'completed' && `✓ Synced ${syncStatus.result?.totalMessages || 0} messages`}
                {syncStatus.status === 'failed' && `✗ Failed: ${syncStatus.error}`}
              </span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6">
          <button
            onClick={handleSync}
            disabled={syncing}
            className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              syncing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
          >
            {syncing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Syncing...
              </>
            ) : (
              <>
                <svg
                  className="mr-2 -ml-1 h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Start Sync
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
