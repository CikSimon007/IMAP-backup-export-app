import { useState, useEffect } from 'react';
import { mailboxesApi } from '../services/api';

function MessagePreview({ accountEmail, mailboxName, selectedMessage }) {
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedMessage || !accountEmail || !mailboxName) {
      setMessage(null);
      return;
    }

    const fetchMessage = async () => {
      setLoading(true);
      setError(null);
      try {
        const fullMessage = await mailboxesApi.getMessage(
          accountEmail,
          mailboxName,
          selectedMessage.uid
        );
        setMessage(fullMessage);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching message:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessage();
  }, [selectedMessage, accountEmail, mailboxName]);

  if (!selectedMessage) {
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
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-4">Select a message to view</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading message...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-red-600 text-center">
          <p>Error loading message</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!message) return null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <div className="border-b p-6 space-y-3">
        <h2 className="text-2xl font-semibold text-gray-900">{message.subject || '(No Subject)'}</h2>

        <div className="space-y-2 text-sm">
          <div className="flex items-start">
            <span className="font-medium text-gray-500 w-16">From:</span>
            <span className="text-gray-900">{message.from || 'Unknown'}</span>
          </div>

          {message.to && (
            <div className="flex items-start">
              <span className="font-medium text-gray-500 w-16">To:</span>
              <span className="text-gray-900">{message.to}</span>
            </div>
          )}

          <div className="flex items-start">
            <span className="font-medium text-gray-500 w-16">Date:</span>
            <span className="text-gray-900">
              {message.date ? new Date(message.date).toLocaleString() : 'Unknown'}
            </span>
          </div>
        </div>

        {message.flags && Object.keys(message.flags).length > 0 && (
          <div className="flex gap-2">
            {Object.keys(message.flags).map((flag) => (
              <span
                key={flag}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
              >
                {flag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-6">
        {message.html ? (
          <iframe
            srcDoc={message.html}
            className="w-full h-full border-0 bg-white"
            sandbox="allow-same-origin"
            title="Email content"
          />
        ) : message.text ? (
          <pre className="whitespace-pre-wrap font-sans text-gray-900">
            {message.text}
          </pre>
        ) : (
          <p className="text-gray-500 italic">(No content)</p>
        )}
      </div>

      {message.attachments && message.attachments.length > 0 && (
        <div className="border-t p-4 bg-gray-50">
          <h3 className="font-medium text-gray-900 mb-2">
            Attachments ({message.attachments.length})
          </h3>
          <div className="space-y-1">
            {message.attachments.map((attachment, index) => (
              <div
                key={index}
                className="flex items-center text-sm text-gray-700 bg-white p-2 rounded border"
              >
                <svg
                  className="h-4 w-4 mr-2 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
                <span className="font-medium">{attachment.filename}</span>
                {attachment.size && (
                  <span className="ml-2 text-gray-500">
                    ({(attachment.size / 1024).toFixed(1)} KB)
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MessagePreview;
