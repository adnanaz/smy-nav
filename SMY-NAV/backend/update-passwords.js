// Create initial users and agencies after database reset
import bcrypt from 'bcryptjs';
import prisma from './src/config/database.js';

async function createInitialData() {
  try {
    console.log('🚀 Creating initial data after database reset...');
    
    // Generate hash for "password123"
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);
    
    console.log('✅ Generated password hash for all users');
    
    // Create Super Admin Agency first
    const superAdminAgency = await prisma.agency.create({
      data: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'SMY-NAV Administration',
        code: 'SMY',
        email: 'admin@smy-nav.com',
        phone: '+62-21-12345678',
        address: 'Jakarta Maritime Training Center',
        contactPerson: 'System Administrator',
        status: 'active',
        maxParticipants: 1000
      }
    });
    console.log('✅ Created Super Admin Agency');
    
    // Create Super Admin User
    const superAdmin = await prisma.user.create({
      data: {
        id: '660e8400-e29b-41d4-a716-446655440000',
        agencyId: superAdminAgency.id,
        username: 'superadmin',
        email: 'admin@smy-nav.com',
        passwordHash,
        fullName: 'Super Administrator',
        role: 'super_admin',
        isActive: true,
        emailVerified: true
      }
    });
    console.log('✅ Created Super Admin User');
    
    // Create Sample Agency 1: Maritime Solutions
    const agency1 = await prisma.agency.create({
      data: {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Maritime Solutions Indonesia',
        code: 'MSI',
        email: 'admin@maritime-solutions.com',
        phone: '+62-21-87654321',
        address: 'Jl. Pelabuhan Raya No. 123, Jakarta Utara',
        contactPerson: 'Budi Santoso',
        status: 'active',
        maxParticipants: 100
      }
    });
    console.log('✅ Created Maritime Solutions Agency');
    
    // Create Admin for Agency 1
    const admin1 = await prisma.user.create({
      data: {
        id: '660e8400-e29b-41d4-a716-446655440001',
        agencyId: agency1.id,
        username: 'admin_msi',
        email: 'admin@maritime-solutions.com',
        passwordHash,
        fullName: 'Admin Maritime Solutions',
        role: 'admin',
        isActive: true,
        emailVerified: true
      }
    });
    console.log('✅ Created Admin for Maritime Solutions');
    
    // Create Agent for Agency 1
    const agent1 = await prisma.user.create({
      data: {
        id: '660e8400-e29b-41d4-a716-446655440003',
        agencyId: agency1.id,
        username: 'agent1_msi',
        email: 'agent1@maritime-solutions.com',
        passwordHash,
        fullName: 'Agent MSI 1',
        role: 'agent',
        isActive: true,
        emailVerified: true
      }
    });
    console.log('✅ Created Agent 1 for Maritime Solutions');
    
    // Create Sample Agency 2: Ocean Careers
    const agency2 = await prisma.agency.create({
      data: {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Ocean Careers International',
        code: 'OCI',
        email: 'admin@ocean-careers.com',
        phone: '+62-21-11223344',
        address: 'Jl. Maritim Sejahtera No. 456, Surabaya',
        contactPerson: 'Sari Dewi',
        status: 'active',
        maxParticipants: 80
      }
    });
    console.log('✅ Created Ocean Careers Agency');
    
    // Create Admin for Agency 2
    await prisma.user.create({
      data: {
        agencyId: agency2.id,
        username: 'admin_oci',
        email: 'admin@ocean-careers.com',
        passwordHash,
        fullName: 'Admin Ocean Careers',
        role: 'admin',
        isActive: true,
        emailVerified: true
      }
    });
    console.log('✅ Created Admin for Ocean Careers');
    
    // Create Agent for Agency 2
    await prisma.user.create({
      data: {
        agencyId: agency2.id,
        username: 'agent1_oci',
        email: 'agent1@ocean-careers.com',
        passwordHash,
        fullName: 'Agent OCI 1',
        role: 'agent',
        isActive: true,
        emailVerified: true
      }
    });
    console.log('✅ Created Agent 1 for Ocean Careers');
    
    console.log('\n🎉 All initial data created successfully!');
    console.log('\n📋 Login credentials (all use password: password123):');
    console.log('👑 Super Admin: admin@smy-nav.com');
    console.log('🏢 MSI Admin: admin@maritime-solutions.com');
    console.log('👤 MSI Agent: agent1@maritime-solutions.com');
    console.log('🏢 OCI Admin: admin@ocean-careers.com');
    console.log('👤 OCI Agent: agent1@ocean-careers.com');
    
  } catch (error) {
    console.error('❌ Error creating initial data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createInitialData();