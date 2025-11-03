/**
 * Database seeding script
 * Creates demo user for testing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  try {
    // Create demo user
    const demoUser = await prisma.user.upsert({
      where: { email: 'demo@example.com' },
      update: {},
      create: {
        id: 'demo-user-123',
        email: 'demo@example.com',
        name: 'Demo User',
      },
    });

    console.log('Demo user created:', demoUser);
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();