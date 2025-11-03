import { useState, useEffect } from 'react';
import AccountList from './components/AccountList';
import AddAccountForm from './components/AddAccountForm';
import ExportModal from './components/ExportModal';
import MailboxViewer from './components/MailboxViewer';
import { accountsApi } from './services/api';

function App() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [activeTab, setActiveTab] = useState('accounts'); // 'accounts' or 'viewer'

  // Load accounts on mount
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await accountsApi.getAll();
      setAccounts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async (accountData) => {
    try {
      await accountsApi.create(accountData);
      setShowAddForm(false);
      loadAccounts();
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteAccount = async (id) => {
    if (!confirm('Are you sure you want to delete this account?')) {
      return;
    }

    try {
      await accountsApi.delete(id);
      loadAccounts();
    } catch (err) {
      alert(`Failed to delete account: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">IMAP Backup</h1>
              <p className="mt-1 text-sm text-gray-500">
                Backup and manage your email accounts
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowExportModal(true)}
                disabled={accounts.length < 2}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
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
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
                Export
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Account
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('accounts')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === 'accounts'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                Accounts
              </button>
              <button
                onClick={() => setActiveTab('viewer')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === 'viewer'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                Mailbox Viewer
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {activeTab === 'accounts' ? (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
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
              <h3 className="mt-2 text-sm font-medium text-gray-900">No accounts</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding your first email account.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Account
                </button>
              </div>
            </div>
          ) : (
            <AccountList
              accounts={accounts}
              onDelete={handleDeleteAccount}
              onRefresh={loadAccounts}
            />
          )}
        </main>
      ) : (
        <MailboxViewer />
      )}

      {/* Add Account Modal */}
      {showAddForm && (
        <AddAccountForm
          onSubmit={handleAddAccount}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          accounts={accounts}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}

export default App;
