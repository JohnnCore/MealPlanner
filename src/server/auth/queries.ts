import prisma from '@/lib/prisma';

export async function getUserByEmail(email: string) {
  return await prisma.user.findUnique({ where: { email } });
}

export async function getUserById(id: string) {
  return await prisma.user.findUnique({ where: { id } });
}
