import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export type Role = 'Cliente' | 'Administrador' | 'Ventas' | 'Producción';
export type CustomerStatus = 'Activo' | 'Inactivo';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  name: string;
  phone?: string;
  additionalPhones?: string[];
  address?: string;
  customerData?: {
    balance?: number;
    addresses?: import("~/data/sales").ClientAddress[];
    street?: string;
    streetNumber?: string;
    type: string;
    documentType: string;
    cuitCuil: string;
    ivaType: string;
    floor: string;
    apartment: string;
    locality: string;
    province: string;
    notes: string;
  };
  customerStatus?: CustomerStatus;
  favorites?: string[];
  cart?: { productId: string; quantity: number }[];
  customerOrders?: import('~/data/sales').Order[];
}

export type PublicUser = Omit<User, "passwordHash">;

const DB_PATH = path.join(process.cwd(), 'data', 'users.json');

async function ensureDb() {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  try {
    await fs.access(DB_PATH);
    return;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }

  const defaultAdmin: User = {
    id: crypto.randomUUID(),
    email: 'admin@admin.com',
    passwordHash: hashPassword('admin123'),
    role: 'Administrador',
    name: 'Administrador Inicial'
  };
  try {
    await fs.writeFile(DB_PATH, JSON.stringify([defaultAdmin], null, 2), { flag: 'wx' });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
  }
}

export async function getUsers(): Promise<User[]> {
  await ensureDb();
  const data: unknown = JSON.parse(await fs.readFile(DB_PATH, 'utf-8'));
  if (!Array.isArray(data)) throw new Error('User database must contain an array');
  return data as User[];
}

let writeQueue: Promise<void> = Promise.resolve();

function serialized<T>(operation: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(operation);
  writeQueue = result.then(() => undefined, () => undefined);
  return result;
}

async function writeUsersAtomically(users: User[]) {
  const temporaryPath = `${DB_PATH}.${process.pid}.${crypto.randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporaryPath, JSON.stringify(users, null, 2), { encoding: 'utf-8', flag: 'wx' });
    await fs.rename(temporaryPath, DB_PATH);
  } catch (error) {
    await fs.rm(temporaryPath, { force: true }).catch(() => undefined);
    throw error;
  }
}

export async function saveUser(user: User): Promise<void> {
  await serialized(async () => {
    const users = await getUsers();
    if (users.some((existing) => existing.id === user.id || existing.email.toLowerCase() === user.email.toLowerCase())) {
      throw new Error('User already exists');
    }
    await writeUsersAtomically([...users, user]);
  });
}

export async function getUserByEmail(email: string) {
  const users = await getUsers();
  return users.find(u => u.email === email);
}

export async function getUserById(id: string) {
  const users = await getUsers();
  return users.find(u => u.id === id);
}

export async function mutateUser(id: string, mutate: (current: User, users: readonly User[]) => User | void): Promise<User> {
  return serialized(async () => {
    const users = await getUsers();
    const index = users.findIndex((user) => user.id === id);
    if (index === -1) throw new Error('User not found');
    const current = users[index];
    const original = JSON.stringify(current);
    const replacement = mutate(current, users);
    const updated = replacement ?? current;
    if (updated.id !== id) throw new Error('A user mutation cannot change the user id');
    if (JSON.stringify(updated) === original) return current;
    users[index] = updated;
    await writeUsersAtomically(users);
    return updated;
  });
}

export async function updateUser(id: string, updates: Partial<Omit<User, 'id' | 'email' | 'role' | 'passwordHash'>> & { passwordHash?: string }) {
  return mutateUser(id, (current) => ({ ...current, ...updates }));
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
