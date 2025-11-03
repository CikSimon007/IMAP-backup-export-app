import { useState, useEffect } from 'react';
import { accountsApi, mailboxesApi } from '../services/api';
import MessageList from './MessageList';
import MessagePreview from './MessagePreview';

function MailboxViewer() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [mailboxes, setMailboxes] = useState([]);
  const [selectedMailbox, setSelectedMailbox] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load accounts on mount
  useEffect(() => {
    loadAccounts();
  }, []);

  // Load mailboxes when account is selected
  useEffect(() => {
    if (selectedAccount) {
      loadMailboxes(selectedAccount.email);
    } else {
      setMailboxes([]);
      setSelectedMailbox(null);
      setSelectedMessage(null);
    }
  }, [selectedAccount]);

  const loadAccounts = async () => {
    try {
      const data = await accountsApi.getAll();
      setAccounts(data);
    } catch (err) {
      console.error('Error loading accounts:', err);
    }
  };

  const loadMailboxes = async (email) => {
    setLoading(true);
    setError(null);
    try {
      const data = await mailboxesApi.getMailboxes(email);
      setMailboxes(data.mailboxes || []);
      setSelectedMailbox(null);
      setSelectedMessage(null);
    } catch (err) {
      setError(err.message);
      console.error('Error loading mailboxes:', err);
      setMailboxes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountChange = (e) => {
    const accountId = e.target.value;
    if (accountId) {
      const account = accounts.find((a) => a.id === accountId);
      setSelectedAccount(account);
    } else {
      setSelectedAccount(null);
    }
  };

  const handleMailboxSelect = (mailboxName) => {
    setSelectedMailbox(mailboxName);
    setSelectedMessage(null);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Mailbox Viewer</h1>

          {/* Account Selector */}
          <div className="flex items-center gap-3">
            <label htmlFor="account-select" className="text-sm font-medium text-gray-700">
              Account:
            </label>
            <select
              id="account-select"
              value={selectedAccount?.id || ''}
              onChange={handleAccountChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select an account...</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.email}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Mailbox List */}
        <div className="w-64 bg-white border-r flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900">Folders</h2>
          </div>

          {!selectedAccount ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm px-4 text-center">
              Select an account to view mailboxes
            </div>
          ) : loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center text-red-600 text-sm px-4 text-center">
              <div>
                <p>Error loading folders</p>
                <p className="text-xs mt-1">{error}</p>
              </div>
            </div>
          ) : mailboxes.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm px-4 text-center">
              No mailboxes found. Try syncing the account first.
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {mailboxes.map((mailbox) => (
                <button
                  key={mailbox}
                  onClick={() => handleMailboxSelect(mailbox)}
                  className={`
                    w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b
                    ${selectedMailbox === mailbox ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}
                  `}
                >
                  <div className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                    <span className="text-sm font-medium text-gray-900">{mailbox}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message List */}
        <div className="w-80 bg-white border-r flex flex-col overflow-hidden">
          <MessageList
            accountEmail={selectedAccount?.email}
            mailboxName={selectedMailbox}
            onSelectMessage={setSelectedMessage}
            selectedMessage={selectedMessage}
          />
        </div>

        {/* Message Preview */}
        <MessagePreview
          accountEmail={selectedAccount?.email}
          mailboxName={selectedMailbox}
          selectedMessage={selectedMessage}
        />
      </div>
    </div>
  );
}

export default MailboxViewer;
