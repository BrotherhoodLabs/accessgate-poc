// Test setup file
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: 'env.test' });

// Set default test environment variables
process.env['NODE_ENV'] = 'test';
process.env['JWT_SECRET'] = 'test-jwt-secret-key';
process.env['JWT_REFRESH_SECRET'] = 'test-jwt-refresh-secret-key';
process.env['JWT_EXPIRES_IN'] = '15m';
process.env['JWT_REFRESH_EXPIRES_IN'] = '7d';
process.env['DATABASE_URL'] = 'postgresql://test:test@localhost:5432/accessgate_test';
process.env['PORT'] = '8000';
process.env['CORS_ORIGINS'] = 'http://localhost:3000';
process.env['RATE_LIMIT_WINDOW_MS'] = '900000';
process.env['RATE_LIMIT_MAX_REQUESTS'] = '100';
