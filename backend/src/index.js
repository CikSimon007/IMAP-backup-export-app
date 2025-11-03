import express from 'express';
import cors from 'cors';
import accountsRouter from './routes/accounts.js';
import syncRouter from './routes/sync.js';
import mailboxesRouter from './routes/mailboxes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/accounts', accountsRouter);
app.use('/api/sync', syncRouter);
app.use('/api/mailboxes', mailboxesRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'IMAP Backup Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
