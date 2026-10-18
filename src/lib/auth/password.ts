import bcrypt from "bcryptjs";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

/** Passwords so common that accepting them on reset would be negligent. */
const BLOCKED_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "12345678",
  "123456789",
  "qwertyui",
  "qwerty123",
  "iloveyou",
  "letmein1",
  "welcome1",
  "admin123",
  "skillpath",
]);

/**
 * Validation for a *new* password on the reset flow.
 * Minimum length matches the existing signup rule so the two stay consistent;
 * obvious weak choices are rejected additionally.
 */
export function validateNewPassword(password: unknown): string | null {
  if (typeof password !== "string" || password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (password.length > 200) return "Password must be 200 characters or fewer.";
  if (!password.trim()) return "Password cannot be only spaces.";
  if (BLOCKED_PASSWORDS.has(password.toLowerCase())) {
    return "That password is too common. Choose something less predictable.";
  }
  return null;
}

export function validateCredentials(email: unknown, password: unknown, name?: unknown) {
  const errors: string[] = [];
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Enter a valid email address.");
  if (typeof password !== "string" || password.length < 8) errors.push("Password must be at least 8 characters.");
  if (name !== undefined && (typeof name !== "string" || name.trim().length < 2)) errors.push("Tell us your name (2+ characters).");
  return errors;
}
