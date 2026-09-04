import crypto from "crypto";
import { db } from "./db";

const TOKEN_TTL_MIN = 60; // 1 hour

export function randomToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function createEmailVerification(userId: string) {
  const token = randomToken();
  await db.emailVerificationToken.deleteMany({ where: { userId } });
  await db.emailVerificationToken.create({
    data: { userId, token, expiresAt: new Date(Date.now() + TOKEN_TTL_MIN * 60_000) },
  });
  return token;
}

export async function consumeEmailVerification(token: string): Promise<string | null> {
  const record = await db.emailVerificationToken.findUnique({ where: { token } });
  if (!record) return null;
  if (record.expiresAt < new Date()) {
    await db.emailVerificationToken.delete({ where: { id: record.id } });
    return null;
  }
  await db.emailVerificationToken.delete({ where: { id: record.id } });
  return record.userId;
}

export async function createPasswordReset(userId: string) {
  const token = randomToken();
  await db.passwordResetToken.deleteMany({ where: { userId } });
  await db.passwordResetToken.create({
    data: { userId, token, expiresAt: new Date(Date.now() + TOKEN_TTL_MIN * 60_000) },
  });
  return token;
}

export async function consumePasswordReset(token: string): Promise<string | null> {
  const record = await db.passwordResetToken.findUnique({ where: { token } });
  if (!record) return null;
  if (record.expiresAt < new Date()) {
    await db.passwordResetToken.delete({ where: { id: record.id } });
    return null;
  }
  await db.passwordResetToken.delete({ where: { id: record.id } });
  return record.userId;
}
