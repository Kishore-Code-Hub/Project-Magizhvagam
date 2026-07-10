const { PrismaClient } = require('@prisma/client');

// Initialize Prisma client with log output enabled for dev
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
});

module.exports = prisma;
