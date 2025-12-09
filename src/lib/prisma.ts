import { PrismaClient } from '@/generated/prisma';
import { withAccelerate } from '@prisma/extension-accelerate';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const createPrismaClient = () => {
	return new PrismaClient().$extends(withAccelerate());
};

type PrismaClientWithExtensions = ReturnType<typeof createPrismaClient>;

const globalForPrisma = global as unknown as {
	prisma: PrismaClientWithExtensions;
};

// Use a single Prisma Client instance
const prisma: PrismaClientWithExtensions = process.env.NODE_ENV === 'production' ? createPrismaClient() : globalForPrisma.prisma || (globalForPrisma.prisma = createPrismaClient());

export default prisma;
