const { PrismaClient } = require('@prisma/client');

const url = 'postgresql://postgres@127.0.0.1:5433/magizhvagam?schema=public';
console.log(`Checking database details on port 5433 using url: ${url}\n`);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: url
    }
  }
});

async function run() {
  try {
    await prisma.$connect();
    console.log("✅ Prisma Client connected successfully to port 5433!\n");

    const checks = [
      { name: 'User', model: prisma.user },
      { name: 'Product', model: prisma.product },
      { name: 'Category', model: prisma.category },
      { name: 'Order', model: prisma.order },
      { name: 'Setting', model: prisma.setting },
      { name: 'FooterConfig', model: prisma.footerConfig },
      { name: 'Enquiry', model: prisma.enquiry }
    ];

    for (const check of checks) {
      try {
        const count = await check.model.count();
        console.log(`👉 Table for model '${check.name}': EXISTS, count = ${count}`);
        
        // Fetch up to 2 sample records
        const samples = await check.model.findMany({ take: 2 });
        if (samples.length > 0) {
          console.log(`   Sample records key/identifiers:`, samples.map(s => {
            if (s.id) return `id: ${s.id}`;
            if (s.key) return `key: ${s.key}`;
            return JSON.stringify(s).substring(0, 100);
          }));
        } else {
          console.log(`   (Table is empty)`);
        }
      } catch (err) {
        console.log(`❌ Table for model '${check.name}': ERROR: ${err.message}`);
      }
      console.log();
    }

  } catch (err) {
    console.error("❌ Prisma Client connection failed:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
