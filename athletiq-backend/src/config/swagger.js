// src/config/swagger.js
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Athletiq API',
      version: '1.0.0',
      description: 'A comprehensive sports tournament management system API',
      contact: {
        name: 'Athletiq Development Team',
        email: 'dev@athletiq.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.athletiq.com' 
          : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
          description: 'JWT token stored in HTTP-only cookie'
        }
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates if the request was successful'
            },
            message: {
              type: 'string',
              description: 'Human-readable message'
            },
            data: {
              type: 'object',
              description: 'Response data (null for errors)'
            },
            error: {
              type: 'string',
              description: 'Error message (present only for errors)'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Response timestamp'
            }
          },
          required: ['success', 'message', 'timestamp']
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID'
            },
            full_name: {
              type: 'string',
              description: 'Full name of the user'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address'
            },
            role: {
              type: 'string',
              enum: ['SuperAdmin', 'SchoolAdmin', 'TournamentAdmin'],
              description: 'User role'
            },
            school_id: {
              type: 'integer',
              description: 'Associated school ID (for SchoolAdmin)'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Tournament: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Tournament ID'
            },
            name: {
              type: 'string',
              description: 'Tournament name'
            },
            description: {
              type: 'string',
              description: 'Tournament description'
            },
            level: {
              type: 'string',
              enum: ['school', 'district', 'provincial', 'national', 'international'],
              description: 'Tournament level'
            },
            tournament_code: {
              type: 'string',
              description: 'Unique tournament code'
            },
            start_date: {
              type: 'string',
              format: 'date',
              description: 'Tournament start date'
            },
            end_date: {
              type: 'string',
              format: 'date',
              description: 'Tournament end date'
            },
            logo_url: {
              type: 'string',
              format: 'uri',
              description: 'Tournament logo URL'
            },
            status: {
              type: 'string',
              enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
              description: 'Tournament status'
            },
            sports_config: {
              type: 'array',
              items: {
                type: 'object'
              },
              description: 'Sports configuration'
            },
            created_by: {
              type: 'integer',
              description: 'User ID who created the tournament'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        School: {
          type: 'object',
          properties: {
            school_id: {
              type: 'integer',
              description: 'School ID'
            },
            school_code: {
              type: 'string',
              description: 'Unique school code'
            },
            name: {
              type: 'string',
              description: 'School name'
            },
            address: {
              type: 'string',
              description: 'School address'
            },
            country: {
              type: 'string',
              description: 'Country'
            },
            province: {
              type: 'string',
              description: 'Province/State'
            },
            district: {
              type: 'string',
              description: 'District'
            },
            city: {
              type: 'string',
              description: 'City'
            },
            ward: {
              type: 'string',
              description: 'Ward number'
            },
            phone: {
              type: 'string',
              description: 'Contact phone number'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'School email'
            },
            website: {
              type: 'string',
              format: 'uri',
              description: 'School website'
            },
            principal_name: {
              type: 'string',
              description: 'Principal name'
            },
            admin_user_id: {
              type: 'integer',
              description: 'Admin user ID'
            },
            onboarding_status: {
              type: 'string',
              enum: ['pending', 'completed'],
              description: 'Onboarding status'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Validation failed'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    description: 'Field name that failed validation'
                  },
                  message: {
                    type: 'string',
                    description: 'Validation error message'
                  }
                }
              }
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    },
    security: [
      {
        cookieAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js'
  ]
};

const specs = swaggerJSDoc(options);

module.exports = {
  specs,
  swaggerUi
};
