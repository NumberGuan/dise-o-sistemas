import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export type Role = 'Cliente' | 'Administrador' | 'Ventas' | 'Producción';
export type CustomerStatus = 'Activo' | 'Inactivo';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  sessions?: { tokenHash: string; expiresAt: number }[];
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

export type PublicUser = Pick<User, "name" | "role" | "cart">;

const DB_PATH = path.join(process.cwd(), 'data', 'users.json');

let initialization: Promise<void> | undefined;

async function initializeDb() {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  try {
    await fs.access(DB_PATH);
    return;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }

  try {
    await fs.writeFile(DB_PATH, '[]', { flag: 'wx', mode: 0o600 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
  }
}

export async function getUsers(): Promise<User[]> {
  initialization ??= initializeDb().catch(error => {
    initialization = undefined;
    throw error;
  });
  await initialization;
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
    await fs.writeFile(temporaryPath, JSON.stringify(users, null, 2), { encoding: 'utf-8', flag: 'wx', mode: 0o600 });
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

export async function configureAdministrator(emailInput: string, password: string) {
  const email = emailInput.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || password.length < 16 || password.length > 128) {
    throw new Error("Indicá un correo válido y una contraseña de entre 16 y 128 caracteres.");
  }
  await serialized(async () => {
    const users = await getUsers();
    const existing = users.find(user => user.email.toLowerCase() === email);
    if (existing && existing.role !== "Administrador") {
      throw new Error("El correo ya pertenece a una cuenta con otro rol.");
    }
    const passwordHash = hashPassword(password);
    if (existing) {
      existing.passwordHash = passwordHash;
      delete existing.sessions;
    } else {
      users.push({ id: crypto.randomUUID(), email, passwordHash, role: "Administrador", name: "Administrador" });
    }
    await writeUsersAtomically(users);
  });
}

export async function mutateUser(id: string, mutate: (current: User, users: readonly User[]) => User | void): Promise<User> {
  return serialized(async () => {
    const users = await getUsers();
    const index = users.findIndex((user) => user.id === id);
    if (index === -1) throw new Error('User not found');
    const current = users[index];
    const original = JSON.stringify(current);
    const { role, passwordHash } = current;
    const replacement = mutate(current, users);
    const updated = replacement ?? current;
    if (updated.id !== id) throw new Error('A user mutation cannot change the user id');
    if (updated.role !== role || updated.passwordHash !== passwordHash || updated.customerStatus === 'Inactivo') delete updated.sessions;
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
    const [salt, key, extra] = storedHash.split(':');
    if (extra !== undefined || !/^[0-9a-f]{128}$/.test(key ?? "") || !/^[0-9a-f]{32}$/.test(salt)) return false;
    const hash = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(Buffer.from(key, 'hex'), hash);
  } catch {
    return false;
  }
}

const legacyAdminPasswords = new Map<string, boolean>();

export function canAccessAccount(user: User) {
  if (user.role === 'Cliente') return user.customerStatus !== 'Inactivo';
  if (user.role === 'Ventas' || user.role === 'Producción') return true;
  if (user.role !== 'Administrador') return false;

  if (!legacyAdminPasswords.has(user.passwordHash)) {
    legacyAdminPasswords.set(user.passwordHash, verifyPassword('admin123', user.passwordHash));
  }
  return !legacyAdminPasswords.get(user.passwordHash);
}
