import express from 'express';
import {
  getAllAccounts,
  getAccountById,
  addAccount,
  updateAccount,
  deleteAccount
} from '../storage/accounts.js';

const router = express.Router();

// GET /api/accounts - List all accounts
router.get('/', async (req, res, next) => {
  try {
    const accounts = await getAllAccounts();
    // Don't send passwords to frontend
    const sanitized = accounts.map(acc => ({
      ...acc,
      password: undefined
    }));
    res.json(sanitized);
  } catch (err) {
    next(err);
  }
});

// GET /api/accounts/:id - Get specific account
router.get('/:id', async (req, res, next) => {
  try {
    const account = await getAccountById(req.params.id);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    res.json({ ...account, password: undefined });
  } catch (err) {
    next(err);
  }
});

// POST /api/accounts - Add new account
router.post('/', async (req, res, next) => {
  try {
    const { email, host, port, username, password, tls } = req.body;

    // Validation
    if (!email || !host || !port || !username || !password) {
      return res.status(400).json({
        error: 'Missing required fields: email, host, port, username, password'
      });
    }

    const account = await addAccount({
      email,
      host,
      port: parseInt(port),
      username,
      password,
      tls
    });

    res.status(201).json({ ...account, password: undefined });
  } catch (err) {
    next(err);
  }
});

// PUT /api/accounts/:id - Update account
router.put('/:id', async (req, res, next) => {
  try {
    const updates = req.body;
    delete updates.id; // Prevent ID changes
    delete updates.createdAt; // Prevent timestamp changes

    const account = await updateAccount(req.params.id, updates);
    res.json({ ...account, password: undefined });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/accounts/:id - Delete account
router.delete('/:id', async (req, res, next) => {
  try {
    const account = await deleteAccount(req.params.id);
    res.json({ message: 'Account deleted', account: { ...account, password: undefined } });
  } catch (err) {
    next(err);
  }
});

export default router;
