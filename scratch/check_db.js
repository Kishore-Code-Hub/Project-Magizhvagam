const { PrismaClient } = require('@prisma/client');

async function testPort(port) {
  const url = `postgresql://postgres@127.0.0.1:${port}/magizhvagam?schema=public`;
  console.log(`\nTesting connection to port ${port} using URL: ${url}`);
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: url
      }
    }
  });

  try {
    await prisma.$connect();
    console.log(`[Port ${port}] Successfully connected via Prisma Client!`);
    
    // Query users
    try {
      const userCount = await prisma.user.count();
      console.log(`[Port ${port}] Number of users:`, userCount);
    } catch (e) {
      console.log(`[Port ${port}] Failed to query users table:`, e.message);
    }
    
    // Query products
    try {
      const productCount = await prisma.product.count();
      console.log(`[Port ${port}] Number of products:`, productCount);
    } catch (e) {
      console.log(`[Port ${port}] Failed to query products table:`, e.message);
    }

    // Query categories
    try {
      const categoryCount = await prisma.category.count();
      console.log(`[Port ${port}] Number of categories:`, categoryCount);
    } catch (e) {
      console.log(`[Port ${port}] Failed to query categories table:`, e.message);
    }

    await prisma.$disconnect();
    return true;
  } catch (err) {
    console.log(`[Port ${port}] Connection failed:`, err.message);
    await prisma.$disconnect();
    return false;
  }
}

async function run() {
  const ports = [5432, 5433, 5435];
  for (const port of ports) {
    await testPort(port);
  }
}

run();
