import { PrismaClient } from '@prisma/client';
import { testLogger } from '../utils/logger';

// Configuration des tests
process.env['NODE_ENV'] = 'test';
process.env['JWT_SECRET'] = 'test-jwt-secret-key-for-testing-only';
process.env['JWT_REFRESH_SECRET'] = 'test-jwt-refresh-secret-key-for-testing-only';
process.env['DATABASE_URL'] = 'postgresql://test:test@localhost:5432/accessgate_test';
process.env['LOG_LEVEL'] = 'error'; // Réduire les logs pendant les tests

const prisma = new PrismaClient();

// Nettoyer la base de données avant chaque test
beforeEach(async () => {
  try {
    await prisma.userRole.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.role.deleteMany();
    await prisma.user.deleteMany();
  } catch (error) {
    testLogger.warn('Error cleaning test database:', error);
  }
});

// Nettoyer la base de données après tous les tests
afterAll(async () => {
  try {
    await prisma.userRole.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.role.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  } catch (error) {
    testLogger.warn('Error cleaning up test database:', error);
  }
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  testLogger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  testLogger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Augmenter le timeout pour les tests d'intégration
jest.setTimeout(30000);