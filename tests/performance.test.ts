import request from 'supertest';
import app from './test-app';

describe('Performance Tests', () => {
  describe('API Response Times', () => {
    it('should respond to health check within 100ms', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/api/health')
        .expect(200);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should handle multiple concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        request(app)
          .get('/api/health')
          .expect(200)
      );

      const start = Date.now();
      await Promise.all(requests);
      const duration = Date.now() - start;

      // All 10 requests should complete within 1 second
      expect(duration).toBeLessThan(1000);
    });

    it('should handle auth endpoints efficiently', async () => {
      const start = Date.now();
      
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'perf@example.com',
          password: 'password123',
          firstName: 'Perf',
          lastName: 'Test'
        })
        .expect(201);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(200);
    });

    it('should handle user endpoints efficiently', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/api/users')
        .expect(200);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(150);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory during multiple requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Make 50 requests
      const requests = Array(50).fill(null).map(() =>
        request(app)
          .get('/api/health')
          .expect(200)
      );
      
      await Promise.all(requests);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });
});
