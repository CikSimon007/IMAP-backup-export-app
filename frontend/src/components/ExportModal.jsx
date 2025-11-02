import { useState, useEffect } from 'react';
import { syncApi } from '../services/api';

export default function ExportModal({ accounts, onClose }) {
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [targetAccountId, setTargetAccountId] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);
  const [exportId, setExportId] = useState(null);
  const [error, setError] = useState(null);

  // Poll for export status
  useEffect(() => {
    let interval;
    if (exporting && exportId) {
      interval = setInterval(async () => {
        try {
          const status = await syncApi.getExportStatus(exportId);
          setExportStatus(status);

          if (status.status === 'completed' || status.status === 'failed') {
            setExporting(false);
            if (status.status === 'failed') {
              setError(status.error);
            }
          }
        } catch (err) {
          console.error('Failed to get export status:', err);
        }
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [exporting, exportId]);

  const handleExport = async (e) => {
    e.preventDefault();

    if (sourceAccountId === targetAccountId) {
      setError('Source and target accounts must be different');
      return;
    }

    try {
      setError(null);
      setExportStatus(null);
      setExporting(true);

      const result = await syncApi.export(sourceAccountId, targetAccountId);
      setExportId(result.exportId);
    } catch (err) {
      setError(err.message);
      setExporting(false);
    }
  };

  const getAccountEmail = (id) => {
    return accounts.find(acc => acc.id === id)?.email || '';
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Export Emails</h3>
            <button
              onClick={onClose}
              disabled={exporting}
              className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleExport} className="px-6 py-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {exportStatus && exportStatus.status !== 'idle' && (
            <div className={`p-4 rounded-md ${
              exportStatus.status === 'running' ? 'bg-blue-50' :
              exportStatus.status === 'completed' ? 'bg-green-50' :
              'bg-red-50'
            }`}>
              <div className="flex items-start">
                {exportStatus.status === 'running' && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3 mt-0.5"></div>
                )}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    exportStatus.status === 'running' ? 'text-blue-800' :
                    exportStatus.status === 'completed' ? 'text-green-800' :
                    'text-red-800'
                  }`}>
                    {exportStatus.status === 'running' && 'Exporting emails...'}
                    {exportStatus.status === 'completed' && (
                      <>
                        ✓ Export completed!
                        <div className="mt-2 text-sm">
                          <p>Mailboxes: {exportStatus.result?.mailboxCount || 0}</p>
                          <p>Messages exported: {exportStatus.result?.totalExported || 0}</p>
                        </div>
                      </>
                    )}
                    {exportStatus.status === 'failed' && `✗ Export failed: ${exportStatus.error}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="source" className="block text-sm font-medium text-gray-700">
              Source Account
            </label>
            <select
              id="source"
              required
              value={sourceAccountId}
              onChange={(e) => setSourceAccountId(e.target.value)}
              disabled={exporting}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border disabled:bg-gray-100"
            >
              <option value="">Select source account...</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.email}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Account to export emails from
            </p>
          </div>

          <div>
            <label htmlFor="target" className="block text-sm font-medium text-gray-700">
              Target Account
            </label>
            <select
              id="target"
              required
              value={targetAccountId}
              onChange={(e) => setTargetAccountId(e.target.value)}
              disabled={exporting}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border disabled:bg-gray-100"
            >
              <option value="">Select target account...</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.email}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Account to export emails to
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex">
              <svg className="h-5 w-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-yellow-800">
                This will copy all emails from the source account to the target account. Make sure both accounts are synced first.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={exporting}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exportStatus?.status === 'completed' ? 'Close' : 'Cancel'}
            </button>
            {exportStatus?.status !== 'completed' && (
              <button
                type="submit"
                disabled={exporting || !sourceAccountId || !targetAccountId}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  exporting || !sourceAccountId || !targetAccountId
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                }`}
              >
                {exporting ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Exporting...
                  </>
                ) : (
                  'Start Export'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
