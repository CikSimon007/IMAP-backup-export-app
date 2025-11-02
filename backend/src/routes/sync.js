import express from 'express';
import { getAccountById, updateAccount } from '../storage/accounts.js';
import { syncAccount, exportToAccount } from '../services/imapService.js';

const router = express.Router();

// Store active sync operations
const activeSyncs = new Map();

// Store active export operations
const activeExports = new Map();

// POST /api/sync/export - Export emails from one account to another
// NOTE: This must be defined BEFORE the /:accountId route to avoid matching conflicts
router.post('/export', async (req, res, next) => {
  try {
    const { sourceAccountId, targetAccountId, mailboxes } = req.body;

    if (!sourceAccountId || !targetAccountId) {
      return res.status(400).json({
        error: 'Missing required fields: sourceAccountId, targetAccountId'
      });
    }

    const sourceAccount = await getAccountById(sourceAccountId);
    const targetAccount = await getAccountById(targetAccountId);

    if (!sourceAccount || !targetAccount) {
      return res.status(404).json({ error: 'Source or target account not found' });
    }

    const exportId = `${sourceAccountId}->${targetAccountId}`;

    // Check if export is already running
    if (activeExports.has(exportId)) {
      return res.status(409).json({
        error: 'Export already in progress for these accounts'
      });
    }

    // Start export in background
    activeExports.set(exportId, { status: 'running', startedAt: new Date() });

    // Return immediately
    res.json({
      message: 'Export started',
      exportId,
      sourceEmail: sourceAccount.email,
      targetEmail: targetAccount.email
    });

    // Run export in background
    exportToAccount(sourceAccount.email, targetAccount, mailboxes)
      .then((result) => {
        activeExports.set(exportId, {
          status: 'completed',
          completedAt: new Date(),
          result
        });

        // Clear from active exports after 5 minutes
        setTimeout(() => activeExports.delete(exportId), 300000);
      })
      .catch((err) => {
        activeExports.set(exportId, {
          status: 'failed',
          completedAt: new Date(),
          error: err.message
        });

        // Clear from active exports after 5 minutes
        setTimeout(() => activeExports.delete(exportId), 300000);
      });
  } catch (err) {
    next(err);
  }
});

// GET /api/sync/export/:exportId/status - Get export status
router.get('/export/:exportId/status', (req, res) => {
  const exportId = decodeURIComponent(req.params.exportId);
  const exportStatus = activeExports.get(exportId);

  if (!exportStatus) {
    return res.json({ status: 'idle' });
  }

  res.json(exportStatus);
});

// POST /api/sync/:accountId - Trigger sync for an account
router.post('/:accountId', async (req, res, next) => {
  try {
    const accountId = req.params.accountId;

    // Check if sync is already running
    if (activeSyncs.has(accountId)) {
      return res.status(409).json({
        error: 'Sync already in progress for this account'
      });
    }

    const account = await getAccountById(accountId);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Start sync in background
    activeSyncs.set(accountId, { status: 'running', startedAt: new Date() });

    // Don't wait for sync to complete - return immediately
    res.json({
      message: 'Sync started',
      accountId,
      email: account.email
    });

    // Run sync in background
    syncAccount(account)
      .then(async (result) => {
        activeSyncs.set(accountId, {
          status: 'completed',
          completedAt: new Date(),
          result
        });

        // Update last sync time
        await updateAccount(accountId, {
          lastSync: new Date().toISOString()
        });

        // Clear from active syncs after 1 minute
        setTimeout(() => activeSyncs.delete(accountId), 60000);
      })
      .catch((err) => {
        activeSyncs.set(accountId, {
          status: 'failed',
          completedAt: new Date(),
          error: err.message
        });

        // Clear from active syncs after 1 minute
        setTimeout(() => activeSyncs.delete(accountId), 60000);
      });
  } catch (err) {
    next(err);
  }
});

// GET /api/sync/:accountId/status - Get sync status
router.get('/:accountId/status', (req, res) => {
  const accountId = req.params.accountId;
  const syncStatus = activeSyncs.get(accountId);

  if (!syncStatus) {
    return res.json({ status: 'idle' });
  }

  res.json(syncStatus);
});

export default router;
