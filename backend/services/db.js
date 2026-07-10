const prisma = require('./prisma');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  console.log('Initiating connection to PostgreSQL via Prisma...');
  try {
    // Verify database connectivity
    await prisma.$connect();
    console.log('PostgreSQL Connected Successfully via Prisma.');

    // 1. Auto-seed or verify development admin account
    try {
      const adminEmail = 'admin@magizhvagam.com';
      const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail }
      });

      const adminPasswordHash = await bcrypt.hash('MagizhvagamSecure2026!', 10);

      if (!existingAdmin) {
        console.log(`Admin user ${adminEmail} does not exist. Seeding default admin...`);
        const seededAdmin = await prisma.user.create({
          data: {
            name: 'Magizhvagam Admin',
            email: adminEmail,
            password: adminPasswordHash,
            passwordHash: adminPasswordHash,
            role: 'admin',
            emailVerified: true,
            phoneVerified: true,
            isActive: true,
            accountActive: true,
            addresses: {
              create: [
                {
                  fullName: 'Magizhvagam',
                  phone: '9894086929',
                  city: 'Chennai',
                  state: 'Tamil Nadu',
                  isDefault: true
                }
              ]
            }
          }
        });
        console.log('Admin user seeded successfully with a secure password.');
      } else {
        // Enforce verified admin role and password reset for dev stability
        await prisma.user.update({
          where: { email: adminEmail },
          data: {
            role: 'admin',
            password: adminPasswordHash,
            passwordHash: adminPasswordHash,
            isActive: true,
            accountActive: true
          }
        });
        console.log('Admin user exists. Password verified/reset to the secure admin password.');
      }
    } catch (seedErr) {
      console.error('Failed to seed/verify admin user:', seedErr.message);
    }

    // 2. Auto-seed active footer configuration if not present or empty
    try {
      const existingFooter = await prisma.footerConfig.findUnique({
        where: { id: 'active' }
      });

      const defaultBrand = {
        logoText: 'MAGIZHVAGAM',
        tagline: 'Place of Happiness — மகிழ்வகம்',
        originStatement: 'Handcrafted with love in Tamil Nadu, India.'
      };
      const defaultColumns = [
        {
          heading: 'Quick Links',
          links: [
            { label: 'Shop All', url: '/products' },
            { label: 'New Arrivals', url: '/products?sort=newest' },
            { label: 'Best Sellers', url: '/products?sort=bestSelling' },
            { label: 'About Us', url: '/about' }
          ]
        },
        {
          heading: 'Customer Care',
          links: [
            { label: 'Contact Us', url: '/contact' },
            { label: 'FAQs', url: '/about#faq' },
            { label: 'Track Your Order', url: '/account' },
            { label: 'Return & Refund Policy', url: '/about#returns' },
            { label: 'Cancellation Policy', url: '/about#cancellation' },
            { label: 'Shipping Information', url: '/about#shipping' },
            { label: 'Privacy Policy', url: '/about#privacy' },
            { label: 'Terms & Conditions', url: '/about#terms' },
            { label: 'Bulk Orders & Corporate Gifts', url: '/contact' }
          ]
        },
        {
          heading: 'Categories',
          links: [
            { label: 'Wedding Return Gifts', url: '/products?category=wedding-return-gifts' },
            { label: 'Birthday Gifts', url: '/products?category=birthday-gifts' },
            { label: 'Eco-Friendly', url: '/products?category=eco-friendly-gifts' },
            { label: 'Gift Hampers', url: '/products?category=gift-hampers' }
          ]
        }
      ];
      const defaultSocial = [
        { platform: 'instagram', url: '#', visible: true },
        { platform: 'facebook', url: '#', visible: true },
        { platform: 'whatsapp', url: '#', visible: true },
        { platform: 'youtube', url: '#', visible: false }
      ];
      const defaultContact = {
        address: { value: 'Chennai, Tamil Nadu', visible: true },
        phone: { value: '+91 98940 86929', visible: true },
        email: { value: 'hellomagizhvagam@gmail.com', visible: true }
      };
      const defaultNewsletter = {
        heading: 'Join Our WhatsApp Community',
        placeholder: 'Enter your Email',
        ctaLabel: 'Join WhatsApp Community',
        incentive: 'Get Latest Updates, New Arrivals, Festival Collections & Special Announcements.'
      };
      const defaultCopyright = {
        text: '© {YEAR} Magizhvagam. All rights reserved.',
        autoYear: true
      };

      const isEmpty = !existingFooter || !existingFooter.brand || Object.keys(existingFooter.brand).length === 0;

      if (isEmpty) {
        console.log('Active footer configuration is empty or not found. Seeding default footer config...');
        if (existingFooter) {
          await prisma.footerConfig.delete({
            where: { id: 'active' }
          });
        }

        await prisma.footerConfig.create({
          data: {
            id: 'active',
            brand: defaultBrand,
            columnCount: 3,
            columns: defaultColumns,
            social: defaultSocial,
            contact: defaultContact,
            newsletter: defaultNewsletter,
            copyright: defaultCopyright
          }
        });
        console.log('Default footer configuration seeded successfully.');
      } else {
        console.log('Active footer configuration exists. Skipped seeding to preserve customizations.');
      }

    } catch (footerSeedErr) {
      console.error('Failed to seed active footer configuration:', footerSeedErr.message);
    }

    // 3. Auto-seed default settings keys (general, seo, analytics, integrations) if not present
    try {
      const keysToSeed = [
        { key: 'general', value: { name: 'MAGIZHVAGAM', tagline: 'Place of Happiness — மகிழ்வகம்', currency: '₹', email: 'hellomagizhvagam@gmail.com' } },
        { key: 'seo', value: { title: 'MAGIZHVAGAM | Premium Return Gifts', desc: 'Handcrafted premium return gifts.', keywords: 'gifts, return gifts' } },
        { key: 'analytics', value: { ga: '', pixel: '' } },
        { key: 'integrations', value: { paymentMode: 'Sandbox', shippingUrl: '' } },
        { key: 'apiKey', value: { token: '', generatedAt: null } }
      ];

      for (const item of keysToSeed) {
        const existing = await prisma.setting.findUnique({
          where: { key: item.key }
        });
        if (!existing) {
          console.log(`Seeding default setting key: ${item.key}...`);
          await prisma.setting.create({
            data: {
              key: item.key,
              value: item.value
            }
          });
        }
      }
    } catch (settingSeedErr) {
      console.error('Failed to seed settings keys:', settingSeedErr.message);
    }

  } catch (error) {
    console.error(`CRITICAL: PostgreSQL connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
