// prisma/seed.ts
import { PrismaClient, KenyanCounty, PickupPointType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed pickup points across major Kenyan cities
  const pickupPoints = [
    // Nairobi
    {
      name: 'SendIT Hub - CBD',
      type: PickupPointType.SENDIT_CENTER,
      address: 'Kimathi Street, City Hall Way',
      city: 'Nairobi',
      county: KenyanCounty.NAIROBI,
      latitude: -1.2864,
      longitude: 36.8172,
      hours: 'Mon-Fri: 8AM-8PM, Sat-Sun: 9AM-6PM',
      phone: '+254712345001',
      email: 'cbd@sendit.co.ke',
      services: [
        'Package pickup',
        'Returns',
        'Customer service',
        'Packaging supplies',
      ],
      rating: 4.8,
    },
    {
      name: 'SendIT Westlands',
      type: PickupPointType.SENDIT_CENTER,
      address: 'Westlands Road, Westgate Shopping Mall',
      city: 'Nairobi',
      county: KenyanCounty.NAIROBI,
      latitude: -1.263,
      longitude: 36.8063,
      hours: 'Daily: 10AM-10PM',
      phone: '+254712345002',
      email: 'westlands@sendit.co.ke',
      services: ['Package pickup', 'Returns', '24/7 locker access'],
      rating: 4.6,
    },
    {
      name: 'Corner Store Plus - Kilimani',
      type: PickupPointType.PARTNER_LOCATION,
      address: 'Argwings Kodhek Road, Kilimani',
      city: 'Nairobi',
      county: KenyanCounty.NAIROBI,
      latitude: -1.2921,
      longitude: 36.7833,
      hours: 'Daily: 7AM-11PM',
      phone: '+254712345003',
      services: ['Package pickup', 'Basic packaging supplies'],
      rating: 4.3,
    },

    // Mombasa
    {
      name: 'SendIT Mombasa Center',
      type: PickupPointType.SENDIT_CENTER,
      address: 'Moi Avenue, Mombasa Island',
      city: 'Mombasa',
      county: KenyanCounty.MOMBASA,
      latitude: -4.0435,
      longitude: 39.6682,
      hours: 'Mon-Fri: 8AM-7PM, Sat: 9AM-5PM',
      phone: '+254712345004',
      email: 'mombasa@sendit.co.ke',
      services: ['Package pickup', 'Returns', 'Customer service'],
      rating: 4.5,
    },

    // Kisumu
    {
      name: 'SendIT Kisumu',
      type: PickupPointType.SENDIT_CENTER,
      address: 'Oginga Odinga Street, Kisumu',
      city: 'Kisumu',
      county: KenyanCounty.KISUMU,
      latitude: -0.0917,
      longitude: 34.768,
      hours: 'Mon-Fri: 8AM-6PM, Sat: 9AM-4PM',
      phone: '+254712345005',
      email: 'kisumu@sendit.co.ke',
      services: ['Package pickup', 'Returns'],
      rating: 4.4,
    },

    // Nakuru
    {
      name: 'SendIT Nakuru',
      type: PickupPointType.SENDIT_CENTER,
      address: 'Kenyatta Avenue, Nakuru',
      city: 'Nakuru',
      county: KenyanCounty.NAKURU,
      latitude: -0.3031,
      longitude: 36.08,
      hours: 'Mon-Fri: 8AM-6PM, Sat: 9AM-4PM',
      phone: '+254712345006',
      email: 'nakuru@sendit.co.ke',
      services: ['Package pickup', 'Returns'],
      rating: 4.2,
    },

    // Eldoret
    {
      name: 'SendIT Eldoret',
      type: PickupPointType.SENDIT_CENTER,
      address: 'Uganda Road, Eldoret',
      city: 'Eldoret',
      county: KenyanCounty.UASIN_GISHU,
      latitude: 0.5143,
      longitude: 35.2698,
      hours: 'Mon-Fri: 8AM-6PM, Sat: 9AM-4PM',
      phone: '+254712345007',
      email: 'eldoret@sendit.co.ke',
      services: ['Package pickup', 'Returns'],
      rating: 4.1,
    },

    // Partner locations
    {
      name: 'Sarit Centre Pickup',
      type: PickupPointType.MALL_LOCKER,
      address: 'Sarit Centre, Westlands',
      city: 'Nairobi',
      county: KenyanCounty.NAIROBI,
      latitude: -1.2594,
      longitude: 36.8089,
      hours: 'Mall hours: 10AM-10PM',
      services: ['24/7 locker access', 'Package pickup'],
      rating: 4.3,
    },
    {
      name: 'Two Rivers Mall Pickup',
      type: PickupPointType.MALL_LOCKER,
      address: 'Two Rivers Mall, Ruaka',
      city: 'Nairobi',
      county: KenyanCounty.KIAMBU,
      latitude: -1.2079,
      longitude: 36.8308,
      hours: 'Mall hours: 10AM-10PM',
      services: ['24/7 locker access', 'Package pickup'],
      rating: 4.4,
    },
  ];

  console.log('📍 Creating pickup points...');
  for (const point of pickupPoints) {
    // Generate a unique id for each pickup point based on its name (or use your own logic)
    const id = `pickup-${point.name.toLowerCase().replace(/\s+/g, '-')}`;
    await prisma.pickupPoint.upsert({
      where: {
        id: id,
      },
      update: point,
      create: {
        id: id,
        ...point,
      },
    });
  }
  console.log(`✅ Created ${pickupPoints.length} pickup points`);

  // Create sample admin user if not exists
  console.log('👤 Creating admin user...');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@sendit.co.ke' },
    update: {},
    create: {
      email: 'admin@sendit.co.ke',
      name: 'SendIT Admin',
      phone: '+254712000000',
      password: '$2b$10$8vF7qGz9X1nC4uPqH6bLPeSfHtGxY3vM7kL2wE8dR5jT6nQ9sA1bC', // hashed 'admin123'
      role: 'ADMIN',
      isActive: true,
      welcomeEmailSent: true,
    },
  });
  console.log('✅ Admin user created/updated');

  // Create sample addresses for testing
  console.log('🏠 Creating sample addresses...');
  const sampleAddresses = [
    {
      name: 'CBD Office Building',
      street: 'Kimathi Street, Times Tower',
      area: 'CBD',
      city: 'Nairobi',
      county: KenyanCounty.NAIROBI,
      state: 'Nairobi',
      zipCode: '00100',
      country: 'Kenya',
      latitude: -1.2864,
      longitude: 36.8172,
      isValidated: true,
      validatedAt: new Date(),
    },
    {
      name: 'Westlands Shopping Center',
      street: 'Westlands Road, Sarit Centre',
      area: 'Westlands',
      city: 'Nairobi',
      county: KenyanCounty.NAIROBI,
      state: 'Nairobi',
      zipCode: '00600',
      country: 'Kenya',
      latitude: -1.2594,
      longitude: 36.8089,
      isValidated: true,
      validatedAt: new Date(),
    },
    {
      name: 'JKIA Terminal',
      street: 'Jomo Kenyatta International Airport',
      area: 'Airport',
      city: 'Nairobi',
      county: KenyanCounty.NAIROBI,
      state: 'Nairobi',
      zipCode: '00100',
      country: 'Kenya',
      latitude: -1.3192,
      longitude: 36.9278,
      isValidated: true,
      validatedAt: new Date(),
    },
  ];

  for (const address of sampleAddresses) {
    await prisma.address.upsert({
      where: {
        id: `sample-${address.name.toLowerCase().replace(/\s+/g, '-')}`,
      },
      update: address,
      create: {
        id: `sample-${address.name.toLowerCase().replace(/\s+/g, '-')}`,
        ...address,
      },
    });
  }
  console.log(`✅ Created ${sampleAddresses.length} sample addresses`);

  // Update package.json scripts if needed
  console.log('📦 Database seeding completed successfully!');
  console.log('');
  console.log('📋 Summary:');
  console.log(`   • ${pickupPoints.length} pickup points created`);
  console.log(`   • 1 admin user created`);
  console.log(`   • ${sampleAddresses.length} sample addresses created`);
  console.log('');
  console.log('🎯 Next steps:');
  console.log('   1. Start implementing the parcel workflow services');
  console.log('   2. Create the API endpoints');
  console.log('   3. Test the complete workflow');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
