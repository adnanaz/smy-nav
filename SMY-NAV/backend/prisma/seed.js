import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash password yang akan digunakan untuk semua akun
  const hashedPassword = await bcrypt.hash('password123', 12);

  try {
    // 1. Buat Super Admin
    console.log('👑 Creating Super Admin...');
    const superAdmin = await prisma.user.upsert({
      where: { username: 'superadmin' },
      update: {},
      create: {
        username: 'superadmin',
        email: 'admin@smy-nav.com',
        passwordHash: hashedPassword,
        fullName: 'Super Admin SMY-NAV',
        role: 'super_admin',
        phone: '081234567890',
        isActive: true,
        emailVerified: true
      }
    });
    console.log('✅ Super Admin created:', superAdmin.email);

    // 2. Data Agensi
    const agencies = [
      { name: 'JUDI PINTEN', contact: 'Judi Pinten', phone: '081234567801' },
      { name: 'NURCHOLISH', contact: 'Nurcholish', phone: '081234567802' },
      { name: 'MANDIRI', contact: 'Mandiri Agency', phone: '081234567803' },
      { name: 'CDP', contact: 'CDP Agency', phone: '081234567804' },
      { name: 'BENNY', contact: 'Benny', phone: '081234567805' },
      { name: 'OVC', contact: 'OVC Agency', phone: '081234567806' },
      { name: 'EDI', contact: 'Edi', phone: '081234567807' },
      { name: 'SOLEH', contact: 'Soleh', phone: '081234567808' },
      { name: 'PUTRA', contact: 'Putra Agency', phone: '081234567809' },
      { name: 'KARMAN', contact: 'Karman', phone: '081234567810' },
      { name: 'PLATINUM MAGELANG', contact: 'Platinum Magelang', phone: '081234567811' },
      { name: 'BAMS', contact: 'Bams', phone: '081234567812' },
      { name: 'YUDHA', contact: 'Yudha', phone: '081234567813' },
      { name: 'BLUE', contact: 'Blue Agency', phone: '081234567814' },
      { name: 'SUKARMAN', contact: 'Sukarman', phone: '081234567815' },
      { name: 'HERMAWAN', contact: 'Hermawan', phone: '081234567816' },
      { name: 'LOTUS', contact: 'Lotus Agency', phone: '081234567817' },
      { name: 'JEMMY', contact: 'Jemmy', phone: '081234567818' },
      { name: 'FJM', contact: 'FJM Agency', phone: '081234567819' },
      { name: 'BASYID', contact: 'Basyid', phone: '081234567820' },
      { name: 'SUGIARTO', contact: 'Sugiarto', phone: '081234567821' }
    ];

    console.log('🏢 Creating Agencies and Agent Users...');

    // 3. Buat setiap agensi beserta agent user-nya
    for (let i = 0; i < agencies.length; i++) {
      const agency = agencies[i];
      
      // Buat agensi
      const agencyCode = agency.name.toLowerCase().replace(/\s+/g, '').substring(0, 10);
      const agencyEmail = `${agency.name.toLowerCase().replace(/\s+/g, '')}@maritime-agency.com`;
      const createdAgency = await prisma.agency.upsert({
        where: { code: agencyCode },
        update: {},
        create: {
          name: agency.name,
          code: agencyCode,
          contactPerson: agency.contact,
          phone: agency.phone,
          email: agencyEmail,
          address: `Alamat ${agency.name}, Jakarta, Indonesia`,
          status: 'active'
        }
      });

      // Buat agent user untuk agensi
      const agentEmail = `agent@${agency.name.toLowerCase().replace(/\s+/g, '')}.com`;
      const agentUsername = `agent_${agency.name.toLowerCase().replace(/\s+/g, '')}`;
      const agentUser = await prisma.user.upsert({
        where: { username: agentUsername },
        update: {},
        create: {
          username: agentUsername,
          email: agentEmail,
          passwordHash: hashedPassword,
          fullName: `${agency.name}`,
          role: 'agent',
          phone: agency.phone,
          isActive: true,
          emailVerified: true,
          agencyId: createdAgency.id
        }
      });

      console.log(`✅ Created agency: ${agency.name} with agent: ${agentEmail}`);
    }



    console.log('\n🎉 Database seed completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👑 SUPER ADMIN (role: super_admin):');
    console.log('   Email: admin@smy-nav.com');
    console.log('   Username: superadmin');
    console.log('   Password: password123');
    console.log('\n🏢 AGENCY ACCOUNTS (role: agent - bisa akses menu agency):');
    console.log('   Email: agent@judipinten.com (JUDI PINTEN)');
    console.log('   Email: agent@nurcholish.com (NURCHOLISH)');
    console.log('   Email: agent@mandiri.com (MANDIRI)');
    console.log('   Email: agent@cdp.com (CDP)');
    console.log('   Email: agent@benny.com (BENNY)');
    console.log('   ... dan 16 agensi lainnya');
    console.log('   Password: password123 (semua sama)');
    console.log('\n� Note: User biasa bisa register sendiri di aplikasi');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error during seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });