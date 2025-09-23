import request from 'supertest';
import app from './test-app';

describe('Smoke Tests', () => {
  describe('Application Health', () => {
    it('should start without errors', () => {
      expect(app).toBeDefined();
    });

    it('should respond to health check', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('API Endpoints', () => {
    it('should have working auth endpoints', async () => {
      // Test register endpoint
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'smoke@example.com',
          password: 'password123',
          firstName: 'Smoke',
          lastName: 'Test'
        })
        .expect(201);

      // Test login endpoint
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'smoke@example.com',
          password: 'password123'
        })
        .expect(200);
    });

    it('should have working user endpoints', async () => {
      // Test GET users
      await request(app)
        .get('/api/users')
        .expect(200);

      // Test POST users
      await request(app)
        .post('/api/users')
        .send({
          email: 'smoke-user@example.com',
          password: 'password123',
          firstName: 'Smoke',
          lastName: 'User'
        })
        .expect(201);

      // Test PATCH users
      await request(app)
        .patch('/api/users/test-id')
        .send({
          firstName: 'Updated'
        })
        .expect(200);

      // Test DELETE users
      await request(app)
        .delete('/api/users/test-id')
        .expect(200);
    });

    it('should handle role assignments', async () => {
      // Test role assignment
      await request(app)
        .post('/api/users/test-id/roles')
        .send({
          roleId: 'test-role-id'
        })
        .expect(200);

      // Test role removal
      await request(app)
        .delete('/api/users/test-id/roles/test-role-id')
        .expect(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid routes gracefully', async () => {
      await request(app)
        .get('/api/invalid-route')
        .expect(404);
    });

    it('should handle malformed JSON gracefully', async () => {
      await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });
  });

  describe('CORS and Security', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-credentials');
    });

    it('should include security headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });
  });
});
