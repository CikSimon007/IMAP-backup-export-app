import { useState, useEffect } from 'react';
import { mailboxesApi } from '../services/api';

function MessageList({ accountEmail, mailboxName, onSelectMessage, selectedMessage }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!accountEmail || !mailboxName) {
      setSummary(null);
      return;
    }

    const fetchSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await mailboxesApi.getSummary(accountEmail, mailboxName);
        setSummary(data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching summary:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [accountEmail, mailboxName]);

  if (!accountEmail || !mailboxName) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <p>Select a mailbox to view messages</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600 text-sm">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-600">
        <div className="text-center">
          <p>Error loading messages</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!summary || !summary.messages || summary.messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="mt-4">No messages in this mailbox</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b bg-gray-50">
        <h3 className="font-semibold text-gray-900">
          {summary.boxName} ({summary.messageCount} message{summary.messageCount !== 1 ? 's' : ''})
        </h3>
        {summary.downloadedAt && (
          <p className="text-xs text-gray-500 mt-1">
            Last synced: {new Date(summary.downloadedAt).toLocaleString()}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {summary.messages.map((message) => (
          <div
            key={message.uid}
            onClick={() => onSelectMessage(message)}
            className={`
              p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors
              ${selectedMessage?.uid === message.uid ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}
            `}
          >
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-medium text-gray-900 truncate flex-1">
                {message.subject || '(No Subject)'}
              </h4>
              <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                {message.date ? new Date(message.date).toLocaleDateString() : ''}
              </span>
            </div>

            <p className="text-sm text-gray-600 truncate">
              {message.from || 'Unknown sender'}
            </p>

            {message.flags && Object.keys(message.flags).length > 0 && (
              <div className="flex gap-1 mt-2">
                {Object.keys(message.flags).map((flag) => (
                  <span
                    key={flag}
                    className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-xs"
                  >
                    {flag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MessageList;
