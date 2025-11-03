import express from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

// Get all mailboxes for an account
router.get('/:accountEmail/mailboxes', async (req, res) => {
  try {
    const { accountEmail } = req.params;
    const accountDir = path.join(process.cwd(), '..', 'data', accountEmail);

    // Check if account data exists
    try {
      await fs.access(accountDir);
    } catch (err) {
      return res.status(404).json({ error: 'Account data not found' });
    }

    // Read all directories (mailboxes) in the account folder
    const entries = await fs.readdir(accountDir, { withFileTypes: true });
    const mailboxes = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);

    res.json({ mailboxes });
  } catch (err) {
    console.error('Error fetching mailboxes:', err);
    res.status(500).json({ error: 'Failed to fetch mailboxes' });
  }
});

// Get summary for a specific mailbox
router.get('/:accountEmail/mailboxes/:mailboxName/summary', async (req, res) => {
  try {
    const { accountEmail, mailboxName } = req.params;
    const summaryPath = path.join(
      process.cwd(),
      '..',
      'data',
      accountEmail,
      mailboxName,
      'summary.json'
    );

    try {
      const data = await fs.readFile(summaryPath, 'utf-8');
      const summary = JSON.parse(data);
      res.json(summary);
    } catch (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({ error: 'Summary not found' });
      }
      throw err;
    }
  } catch (err) {
    console.error('Error fetching summary:', err);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// Get full message details by UID
router.get('/:accountEmail/mailboxes/:mailboxName/messages/:uid', async (req, res) => {
  try {
    const { accountEmail, mailboxName, uid } = req.params;
    const messagesPath = path.join(
      process.cwd(),
      '..',
      'data',
      accountEmail,
      mailboxName,
      'messages.json'
    );

    try {
      const data = await fs.readFile(messagesPath, 'utf-8');
      const messages = JSON.parse(data);
      const message = messages.find(m => m.uid === parseInt(uid));

      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      res.json(message);
    } catch (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({ error: 'Messages file not found' });
      }
      throw err;
    }
  } catch (err) {
    console.error('Error fetching message:', err);
    res.status(500).json({ error: 'Failed to fetch message' });
  }
});

export default router;
