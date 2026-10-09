import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export type Role = 'Cliente' | 'Administrador' | 'Ventas' | 'Producción';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  name: string;
  phone?: string;
  address?: string;
  favorites?: string[];
  cart?: { productId: string; quantity: number }[];
}

const DB_PATH = path.join(process.cwd(), 'data', 'users.json');

async function ensureDb() {
  try {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    try {
      await fs.access(DB_PATH);
    } catch {
      // Create with a default admin user for testing if empty
      const defaultAdmin: User = {
        id: crypto.randomUUID(),
        email: 'admin@admin.com',
        passwordHash: hashPassword('admin123'),
        role: 'Administrador',
        name: 'Administrador Inicial'
      };
      await fs.writeFile(DB_PATH, JSON.stringify([defaultAdmin], null, 2));
    }
  } catch (err) {
    console.error("Error setting up DB:", err);
  }
}

export async function getUsers(): Promise<User[]> {
  await ensureDb();
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function saveUser(user: User) {
  const users = await getUsers();
  users.push(user);
  await fs.writeFile(DB_PATH, JSON.stringify(users, null, 2));
}

export async function getUserByEmail(email: string) {
  const users = await getUsers();
  return users.find(u => u.email === email);
}

export async function getUserById(id: string) {
  const users = await getUsers();
  return users.find(u => u.id === id);
}

export async function updateUser(id: string, updates: Partial<Omit<User, 'id' | 'email' | 'role' | 'passwordHash'>> & { passwordHash?: string }) {
  const users = await getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) throw new Error("User not found");
  
  users[index] = { ...users[index], ...updates };
  await fs.writeFile(DB_PATH, JSON.stringify(users, null, 2));
  return users[index];
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return key === hash;
  } catch {
    return false;
  }
}
