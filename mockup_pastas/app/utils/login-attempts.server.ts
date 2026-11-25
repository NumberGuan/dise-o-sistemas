const windowMs = 5 * 60 * 1000;
const maxAttempts = 10;
const maxAccounts = 10_000;
const attempts = new Map<string, { count: number; expiresAt: number }>();

export function reserveLoginAttempt(email: string): number {
  const now = Date.now();
  const previous = attempts.get(email);
  if (previous && previous.expiresAt > now) {
    if (previous.count >= maxAttempts) return Math.ceil((previous.expiresAt - now) / 1000);
    previous.count++;
    return 0;
  }

  if (attempts.size >= maxAccounts) {
    for (const [key, entry] of attempts) {
      if (entry.expiresAt <= now) attempts.delete(key);
    }
    if (attempts.size >= maxAccounts) return Math.ceil(windowMs / 1000);
  }
  attempts.set(email, { count: 1, expiresAt: now + windowMs });
  return 0;
}

export function clearLoginAttempts(email: string) {
  attempts.delete(email);
}
