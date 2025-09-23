import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create permissions
  const permissions = [
    { name: 'user.read', resource: 'user', action: 'read', description: 'Read users' },
    { name: 'user.write', resource: 'user', action: 'write', description: 'Create and update users' },
    { name: 'user.delete', resource: 'user', action: 'delete', description: 'Delete users' },
    { name: 'role.read', resource: 'role', action: 'read', description: 'Read roles' },
    { name: 'role.write', resource: 'role', action: 'write', description: 'Create and update roles' },
    { name: 'role.delete', resource: 'role', action: 'delete', description: 'Delete roles' },
    { name: 'resource.read', resource: 'resource', action: 'read', description: 'Read resources' },
    { name: 'resource.write', resource: 'resource', action: 'write', description: 'Create and update resources' },
    { name: 'resource.delete', resource: 'resource', action: 'delete', description: 'Delete resources' },
  ];

  console.log('📝 Creating permissions...');
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }

  // Create roles
  const roles = [
    {
      name: 'ADMIN',
      description: 'Full system access',
      permissions: ['user.read', 'user.write', 'user.delete', 'role.read', 'role.write', 'role.delete', 'resource.read', 'resource.write', 'resource.delete'],
    },
    {
      name: 'MANAGER',
      description: 'User management access',
      permissions: ['user.read', 'user.write', 'role.read', 'resource.read'],
    },
    {
      name: 'VIEWER',
      description: 'Read-only access',
      permissions: ['user.read', 'role.read', 'resource.read'],
    },
  ];

  console.log('👥 Creating roles...');
  for (const roleData of roles) {
    const { permissions, ...role } = roleData;
    
    const createdRole = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });

    // Assign permissions to role
    for (const permissionName of permissions) {
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName },
      });

      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: createdRole.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: createdRole.id,
            permissionId: permission.id,
          },
        });
      }
    }
  }

  // Create users
  const users = [
    {
      email: 'admin@accessgate.com',
      password: 'Admin123!',
      firstName: 'Admin',
      lastName: 'User',
      roleName: 'ADMIN',
    },
    {
      email: 'manager@accessgate.com',
      password: 'Manager123!',
      firstName: 'Manager',
      lastName: 'User',
      roleName: 'MANAGER',
    },
    {
      email: 'viewer@accessgate.com',
      password: 'Viewer123!',
      firstName: 'Viewer',
      lastName: 'User',
      roleName: 'VIEWER',
    },
  ];

  console.log('👤 Creating users...');
  for (const userData of users) {
    const { roleName, ...user } = userData;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(user.password, 12);
    
    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        ...user,
        password: hashedPassword,
      },
    });

    // Assign role to user
    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (role) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: createdUser.id,
            roleId: role.id,
          },
        },
        update: {},
        create: {
          userId: createdUser.id,
          roleId: role.id,
          assignedBy: createdUser.id, // Self-assigned for seed data
        },
      });
    }
  }

  console.log('✅ Database seed completed successfully!');
  console.log('\n📋 Created users:');
  console.log('  - admin@accessgate.com (ADMIN)');
  console.log('  - manager@accessgate.com (MANAGER)');
  console.log('  - viewer@accessgate.com (VIEWER)');
  console.log('\n🔑 All users have password: [Role]123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
