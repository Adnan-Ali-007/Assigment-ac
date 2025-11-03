/**
 * Database utilities and Prisma client
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Create a demo user for testing
 */
export async function createDemoUser() {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: 'demo@example.com' },
    });

    if (existingUser) {
      return existingUser;
    }

    const user = await prisma.user.create({
      data: {
        id: 'demo-user-123',
        email: 'demo@example.com',
        name: 'Demo User',
      },
    });

    console.log('Created demo user:', user);
    return user;
  } catch (error) {
    console.error('Error creating demo user:', error);
    throw error;
  }
}