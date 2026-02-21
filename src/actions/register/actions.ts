'use server';

import { registerSchema, type RegisterFormValues } from '@/lib/schemas/auth';
import { createUser } from '@/server/auth/mutations';
import { getUserByEmail } from '@/server/auth/queries';
import bcrypt from 'bcryptjs';

type RegisterResult = { success: true } | { error: string };

export async function registerAction(values: RegisterFormValues): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(values);

  if (!parsed.success) {
    return { error: 'Invalid form data' };
  }

  const { name, email, password } = parsed.data;

  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return { error: 'User already exists' };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await createUser(name, email, hashedPassword);
    return { success: true };
  } catch (err) {
    // Handle unique constraint race (concurrent registrations)
    if (
      err instanceof Error &&
      /unique|duplicate/i.test(err.message) &&
      /email/i.test(err.message)
    ) {
      return { error: 'User already exists' };
    }

    // Unexpected error
    return {
      error: (err as Error)?.message ?? 'Registration failed',
    };
  }
}
