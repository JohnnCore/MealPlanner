import prisma from '@/lib/prisma';

export async function createUser(name: string, email: string, hashedPassword: string) {
  return await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });
}
