# Getting Started with IMAP Backup Application

## Quick Start

### 1. Start the Backend Server

```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:3001`

### 2. Start the Frontend Development Server

In a new terminal:

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173`

### 3. Open the Application

Navigate to `http://localhost:5173` in your web browser.

## Using the Application

### Adding an Email Account

1. Click the "Add Account" button
2. Fill in the following information:
   - **Email Address**: Your email address
   - **IMAP Host**: Your email provider's IMAP server (e.g., `imap.gmail.com`)
   - **Port**: Usually `993` for SSL/TLS
   - **Username**: Your email username (often the same as email)
   - **Password**: Your email password or app-specific password
   - **Use TLS/SSL**: Keep this checked (recommended)

### Common IMAP Settings

**Gmail:**
- Host: `imap.gmail.com`
- Port: `993`
- Note: You'll need to create an [App Password](https://support.google.com/accounts/answer/185833)

**Outlook/Hotmail:**
- Host: `outlook.office365.com`
- Port: `993`

**Yahoo:**
- Host: `imap.mail.yahoo.com`
- Port: `993`

**iCloud:**
- Host: `imap.mail.me.com`
- Port: `993`

### Syncing Email

1. Once an account is added, click the "Start Sync" button on the account card
2. The sync will run in the background
3. Progress will be shown on the account card
4. Emails are saved to `./data/<email-address>/`

### Viewing Downloaded Emails

Downloaded emails are stored in the `data` directory:

```
data/
└── your-email@example.com/
    ├── INBOX/
    │   ├── messages.json    # Full message data
    │   └── summary.json     # Message summary
    ├── Sent/
    │   ├── messages.json
    │   └── summary.json
    └── ...
```

## API Endpoints

The backend provides the following REST API endpoints:

### Accounts
- `GET /api/accounts` - List all accounts
- `GET /api/accounts/:id` - Get specific account
- `POST /api/accounts` - Add new account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account

### Sync
- `POST /api/sync/:accountId` - Start sync for account
- `GET /api/sync/:accountId/status` - Get sync status

### Health
- `GET /api/health` - Check server status

## Troubleshooting

### Connection Issues

If you're having trouble connecting to your email provider:

1. **Check IMAP is enabled** in your email settings
2. **Use App-Specific Passwords** (required for Gmail, recommended for others)
3. **Check firewall settings** - ensure port 993 is not blocked
4. **Verify credentials** - double-check username and password

### Gmail Specific

For Gmail, you need to:
1. Enable 2-factor authentication
2. Generate an App Password at https://myaccount.google.com/apppasswords
3. Use the App Password instead of your regular password

## Development

### Backend Development

```bash
cd backend
npm run dev    # Starts server with auto-reload
```

### Frontend Development

```bash
cd frontend
npm run dev    # Starts Vite dev server with HMR
```

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`

## Project Structure

```
imap-backup-app/
├── backend/
│   ├── src/
│   │   ├── index.js           # Express server entry point
│   │   ├── routes/
│   │   │   ├── accounts.js    # Account management routes
│   │   │   └── sync.js        # Sync operation routes
│   │   ├── services/
│   │   │   └── imapService.js # IMAP connection & sync logic
│   │   └── storage/
│   │       └── accounts.js    # Account storage (JSON file)
│   ├── package.json
│   └── accounts.json          # Account data (created on first use)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AccountCard.jsx
│   │   │   ├── AccountList.jsx
│   │   │   └── AddAccountForm.jsx
│   │   ├── services/
│   │   │   └── api.js         # API client
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
└── data/                      # Email backup storage
    └── .gitkeep
```

## Security Notes

- **Passwords are stored in plain text** in `backend/accounts.json`
- For production use, implement proper encryption
- Consider using environment variables for sensitive configuration
- The `accounts.json` file is in `.gitignore` to prevent accidental commits

## Next Steps

- Implement email export functionality
- Add search and filtering for downloaded emails
- Create email viewer UI
- Add encryption for stored passwords
- Implement incremental sync (only new messages)
- Add support for multiple mailbox selection
