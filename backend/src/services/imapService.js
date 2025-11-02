import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import fs from 'fs/promises';
import path from 'path';

// Flatten mailbox tree into a flat array
function flattenMailboxTree(mailboxTree) {
  const result = [];

  function traverse(mailboxes) {
    for (const mailbox of mailboxes) {
      result.push(mailbox);
    }
  }

  traverse(mailboxTree);
  return result;
}

// Auto-discover IMAP host for a given email domain
async function discoverImapHost(email) {
  const domain = email.split('@')[1];
  const commonHosts = [
    `imap.${domain}`,
    `mail.${domain}`,
    domain
  ];

  console.log(`🔍 Attempting to discover IMAP host for ${domain}...`);

  for (const host of commonHosts) {
    try {
      console.log(`   Trying ${host}...`);
      // Try to connect with a short timeout
      const client = new ImapFlow({
        host,
        port: 993,
        secure: true,
        auth: {
          user: email,
          pass: 'test' // Will fail but we just want to check if host exists
        },
        logger: false,
        tls: {
          rejectUnauthorized: false
        }
      });

      // Try to connect (will fail with auth error if host is valid)
      await client.connect().catch(() => {});
      await client.logout().catch(() => {});

      console.log(`   ✅ Found IMAP host: ${host}`);
      return host;
    } catch (err) {
      // If it's an auth error, the host is valid
      if (err.message?.includes('auth') || err.responseText?.includes('auth')) {
        console.log(`   ✅ Found IMAP host: ${host}`);
        return host;
      }
      // Otherwise, try next host
      continue;
    }
  }

  // Default to imap.<domain> if nothing works
  console.log(`   ⚠️  Could not auto-discover, defaulting to imap.${domain}`);
  return `imap.${domain}`;
}

// Download all messages from a mailbox
async function downloadMailboxMessages(client, mailbox, accountEmail) {
  try {
    const lock = await client.getMailboxLock(mailbox.path);

    try {
      // Get the actual mailbox status after acquiring the lock
      const mailboxStatus = client.mailbox;
      const messageCount = mailboxStatus?.exists || 0;

      if (messageCount === 0) {
        console.log(`📭 ${mailbox.path}: No messages`);
        return { boxName: mailbox.path, count: 0, messages: [] };
      }

      console.log(`📬 ${mailbox.path}: ${messageCount} messages`);

      const messages = [];

      // Fetch all messages
      for await (const message of client.fetch('1:*', {
        source: true,
        uid: true,
        flags: true,
        envelope: true,
        bodyStructure: true
      })) {
        try {
          const parsed = await simpleParser(message.source);
          messages.push({
            uid: message.uid,
            flags: message.flags,
            subject: parsed.subject,
            from: parsed.from?.text,
            to: parsed.to?.text,
            date: parsed.date,
            text: parsed.text,
            html: parsed.html,
            attachments: parsed.attachments?.map(att => ({
              filename: att.filename,
              contentType: att.contentType,
              size: att.size
            }))
          });
        } catch (err) {
          console.error(`Error parsing message ${message.uid}:`, err.message);
        }
      }

      console.log(`✅ ${mailbox.path}: Downloaded ${messages.length} messages`);
      return { boxName: mailbox.path, count: messages.length, messages };
    } finally {
      lock.release();
    }
  } catch (err) {
    console.error(`❌ Error downloading ${mailbox.path}:`, err.message);
    throw err;
  }
}

// Save messages to file system
async function saveMessages(accountEmail, boxName, messages) {
  const sanitizedBoxName = boxName.replace(/[/\\:*?"<>|]/g, '_');
  const boxDir = path.join(process.cwd(), '..', 'data', accountEmail, sanitizedBoxName);

  await fs.mkdir(boxDir, { recursive: true });

  // Save messages as JSON
  const messagesFile = path.join(boxDir, 'messages.json');
  await fs.writeFile(messagesFile, JSON.stringify(messages, null, 2));

  // Save summary
  const summary = {
    boxName,
    messageCount: messages.length,
    downloadedAt: new Date().toISOString(),
    messages: messages.map(m => ({
      uid: m.uid,
      subject: m.subject,
      from: m.from,
      date: m.date,
      flags: m.flags
    }))
  };

  const summaryFile = path.join(boxDir, 'summary.json');
  await fs.writeFile(summaryFile, JSON.stringify(summary, null, 2));

  return { boxDir, messageCount: messages.length };
}

// Main function to sync an account
export async function syncAccount(account) {
  console.log(`\n🔄 Starting sync for ${account.email}...`);

  // Auto-discover host if not provided
  let host = account.host;
  if (!host) {
    host = await discoverImapHost(account.email);
  }

  const imapConfig = {
    host,
    port: account.port || 993,
    secure: true,
    auth: {
      user: account.username || account.email,
      pass: account.password
    },
    logger: false
  };

  const client = new ImapFlow(imapConfig);

  try {
    // Connect to IMAP
    await client.connect();
    console.log(`✅ Connected to ${host}`);

    // Get all mailboxes
    const mailboxTree = await client.list();
    const mailboxes = flattenMailboxTree(mailboxTree);
    console.log(`📂 Found ${mailboxes.length} mailboxes`);

    // Download messages from each mailbox
    const results = [];
    for (const mailbox of mailboxes) {
      try {
        const result = await downloadMailboxMessages(client, mailbox, account.email);
        await saveMessages(account.email, mailbox.path, result.messages);
        results.push(result);
      } catch (err) {
        console.error(`❌ Error processing ${mailbox.path}:`, err.message);
        results.push({ boxName: mailbox.path, error: err.message });
      }
    }

    await client.logout();

    const totalMessages = results.reduce((sum, r) => sum + (r.count || 0), 0);
    console.log(`\n✅ Sync completed for ${account.email}`);
    console.log(`📊 Total messages downloaded: ${totalMessages}`);

    return {
      success: true,
      email: account.email,
      mailboxCount: mailboxes.length,
      totalMessages,
      results
    };
  } catch (err) {
    await client.logout().catch(() => {});
    console.error(`❌ Sync failed for ${account.email}:`, err.message);
    throw err;
  }
}

// Read messages from local storage
async function readLocalMessages(accountEmail, mailboxName) {
  const sanitizedBoxName = mailboxName.replace(/[/\\:*?"<>|]/g, '_');
  const boxDir = path.join(process.cwd(), '..', 'data', accountEmail, sanitizedBoxName);

  try {
    const messagesFile = path.join(boxDir, 'messages.json');
    const data = await fs.readFile(messagesFile, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.warn(`⚠️  Could not read messages from ${mailboxName}: ${err.message}`);
    return [];
  }
}

// Get list of mailboxes from local storage
async function getLocalMailboxes(accountEmail) {
  const foldersDir = path.join(process.cwd(), '..', 'data', accountEmail);

  try {
    const entries = await fs.readdir(foldersDir);
    return entries;
  } catch (err) {
    console.error(`❌ Could not read folders for ${accountEmail}: ${err.message}`);
    return [];
  }
}

// Convert parsed message back to RFC822 format for IMAP APPEND
function messageToRFC822(message) {
  const lines = [];

  // Add headers
  if (message.from) lines.push(`From: ${message.from}`);
  if (message.to) lines.push(`To: ${message.to}`);
  if (message.subject) lines.push(`Subject: ${message.subject}`);
  if (message.date) lines.push(`Date: ${new Date(message.date).toUTCString()}`);
  lines.push('MIME-Version: 1.0');

  // Add content
  if (message.html) {
    lines.push('Content-Type: text/html; charset=utf-8');
    lines.push('');
    lines.push(message.html);
  } else if (message.text) {
    lines.push('Content-Type: text/plain; charset=utf-8');
    lines.push('');
    lines.push(message.text);
  } else {
    lines.push('Content-Type: text/plain; charset=utf-8');
    lines.push('');
    lines.push('(No content)');
  }

  return lines.join('\r\n');
}

// Export messages from one account to another
export async function exportToAccount(sourceEmail, targetAccount, mailboxes = []) {
  console.log(`\n📤 Exporting from ${sourceEmail} to ${targetAccount.email}...`);

  // Auto-discover target host if not provided
  let targetHost = targetAccount.host;
  if (!targetHost) {
    targetHost = await discoverImapHost(targetAccount.email);
  }

  const targetConfig = {
    host: targetHost,
    port: targetAccount.port || 993,
    secure: true,
    auth: {
      user: targetAccount.username || targetAccount.email,
      pass: targetAccount.password
    },
    logger: false
  };

  const client = new ImapFlow(targetConfig);

  try {
    // Connect to target IMAP
    await client.connect();
    console.log(`✅ Connected to target: ${targetHost}`);

    // Get mailboxes to export
    const mailboxesToExport = mailboxes && mailboxes.length > 0
      ? mailboxes
      : await getLocalMailboxes(sourceEmail);

    if (mailboxesToExport.length === 0) {
      console.log('⚠️  No mailboxes to export');
      return {
        success: false,
        message: 'No mailboxes found to export'
      };
    }

    console.log(`📂 Found ${mailboxesToExport.length} mailboxes to export`);

    const results = [];
    let totalExported = 0;

    // Export each mailbox
    for (const mailboxName of mailboxesToExport) {
      try {
        console.log(`\n📦 Processing ${mailboxName}...`);

        // Read messages from local storage
        const messages = await readLocalMessages(sourceEmail, mailboxName);

        if (messages.length === 0) {
          console.log(`   ⏭️  Skipping ${mailboxName} - no messages`);
          results.push({
            mailbox: mailboxName,
            exported: 0,
            status: 'skipped'
          });
          continue;
        }

        console.log(`   📧 Found ${messages.length} messages`);

        // Create mailbox on target if it doesn't exist
        try {
          await client.mailboxCreate(mailboxName);
          console.log(`   ✅ Created mailbox: ${mailboxName}`);
        } catch (err) {
          // Mailbox might already exist, that's okay
          if (!err.message?.includes('exists') && !err.responseText?.includes('EXISTS')) {
            console.log(`   ℹ️  Mailbox might already exist: ${mailboxName}`);
          }
        }

        // Upload messages to target
        let uploaded = 0;
        for (const message of messages) {
          try {
            const rfc822 = messageToRFC822(message);
            const flags = message.flags || [];
            const date = message.date ? new Date(message.date) : new Date();

            await client.append(mailboxName, rfc822, flags, date);
            uploaded++;
          } catch (err) {
            console.error(`   ⚠️  Failed to upload message: ${err.message}`);
          }
        }

        console.log(`   ✅ Exported ${uploaded}/${messages.length} messages to ${mailboxName}`);
        totalExported += uploaded;

        results.push({
          mailbox: mailboxName,
          total: messages.length,
          exported: uploaded,
          status: 'success'
        });
      } catch (err) {
        console.error(`   ❌ Error exporting ${mailboxName}: ${err.message}`);
        results.push({
          mailbox: mailboxName,
          error: err.message,
          status: 'failed'
        });
      }
    }

    await client.logout();

    console.log(`\n✅ Export completed`);
    console.log(`📊 Total messages exported: ${totalExported}`);

    return {
      success: true,
      sourceEmail,
      targetEmail: targetAccount.email,
      mailboxCount: mailboxesToExport.length,
      totalExported,
      results
    };
  } catch (err) {
    await client.logout().catch(() => {});
    console.error(`❌ Export failed: ${err.message}`);
    throw err;
  }
}
