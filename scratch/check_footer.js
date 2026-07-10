const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const footer = await prisma.footerConfig.findUnique({
    where: { id: 'active' }
  });
  console.log('Footer config in DB:', JSON.stringify(footer, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
