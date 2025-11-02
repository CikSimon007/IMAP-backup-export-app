import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const ACCOUNTS_FILE = path.join(process.cwd(), 'accounts.json');

// Initialize accounts file if it doesn't exist
async function initAccountsFile() {
  try {
    await fs.access(ACCOUNTS_FILE);
  } catch {
    await fs.writeFile(ACCOUNTS_FILE, JSON.stringify([], null, 2));
  }
}

// Read all accounts
export async function getAllAccounts() {
  await initAccountsFile();
  const data = await fs.readFile(ACCOUNTS_FILE, 'utf-8');
  return JSON.parse(data);
}

// Get account by ID
export async function getAccountById(id) {
  const accounts = await getAllAccounts();
  return accounts.find(acc => acc.id === id);
}

// Add new account
export async function addAccount(accountData) {
  const accounts = await getAllAccounts();

  const newAccount = {
    id: uuidv4(),
    email: accountData.email,
    host: accountData.host,
    port: accountData.port,
    username: accountData.username,
    password: accountData.password,
    tls: accountData.tls !== false,
    createdAt: new Date().toISOString(),
    lastSync: null,
    status: 'active'
  };

  accounts.push(newAccount);
  await fs.writeFile(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));

  // Create data directory for this account
  const accountDir = path.join(process.cwd(), '..', 'data', newAccount.email);
  await fs.mkdir(accountDir, { recursive: true });

  return newAccount;
}

// Update account
export async function updateAccount(id, updates) {
  const accounts = await getAllAccounts();
  const index = accounts.findIndex(acc => acc.id === id);

  if (index === -1) {
    throw new Error('Account not found');
  }

  accounts[index] = { ...accounts[index], ...updates };
  await fs.writeFile(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));

  return accounts[index];
}

// Delete account
export async function deleteAccount(id) {
  const accounts = await getAllAccounts();
  const account = accounts.find(acc => acc.id === id);

  if (!account) {
    throw new Error('Account not found');
  }

  const filteredAccounts = accounts.filter(acc => acc.id !== id);
  await fs.writeFile(ACCOUNTS_FILE, JSON.stringify(filteredAccounts, null, 2));

  return account;
}
