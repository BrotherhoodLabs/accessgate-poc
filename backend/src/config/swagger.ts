import swaggerJsdoc from 'swagger-jsdoc';
import { SwaggerOptions } from 'swagger-jsdoc';

const options: SwaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AccessGate PoC API',
      version: '1.0.0',
      description: 'API documentation for AccessGate RBAC PoC',
      contact: {
        name: 'BrotherhoodLabs',
        url: 'https://github.com/BrotherhoodLabs',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:8000/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User unique identifier',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            firstName: {
              type: 'string',
              description: 'User first name',
            },
            lastName: {
              type: 'string',
              description: 'User last name',
            },
            isActive: {
              type: 'boolean',
              description: 'User active status',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'User last update timestamp',
            },
          },
        },
        Role: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Role unique identifier',
            },
            name: {
              type: 'string',
              description: 'Role name',
              example: 'ADMIN',
            },
            description: {
              type: 'string',
              description: 'Role description',
            },
            isActive: {
              type: 'boolean',
              description: 'Role active status',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Role creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Role last update timestamp',
            },
          },
        },
        Permission: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Permission unique identifier',
            },
            name: {
              type: 'string',
              description: 'Permission name',
              example: 'user.read',
            },
            resource: {
              type: 'string',
              description: 'Resource name',
              example: 'user',
            },
            action: {
              type: 'string',
              description: 'Action name',
              example: 'read',
            },
            description: {
              type: 'string',
              description: 'Permission description',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Permission creation timestamp',
            },
          },
        },
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              description: 'JWT access token',
            },
            refreshToken: {
              type: 'string',
              description: 'JWT refresh token',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'Error message',
                },
                statusCode: {
                  type: 'integer',
                  description: 'HTTP status code',
                },
                stack: {
                  type: 'string',
                  description: 'Error stack trace (development only)',
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
