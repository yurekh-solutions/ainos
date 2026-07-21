// AINOS Scalability Configuration
// Optimized for 1000+ concurrent users

export const scalabilityConfig = {
  // Database
  database: {
    maxPoolSize: 100,
    minPoolSize: 10,
    maxIdleTimeMS: 60000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
  },

  // Redis Cache
  cache: {
    enabled: true,
    defaultTTL: 300,        // 5 minutes
    sessionTTL: 86400,      // 24 hours
    apiResponseTTL: 60,     // 1 minute for API responses
    reportTTL: 600,         // 10 minutes for reports
  },

  // Rate Limiting
  rateLimit: {
    default: { maxRequests: 100, windowMs: 60000 },   // 100 req/min
    api: { maxRequests: 200, windowMs: 60000 },        // 200 req/min for API
    auth: { maxRequests: 10, windowMs: 60000 },        // 10 login attempts/min
    ai: { maxRequests: 30, windowMs: 60000 },          // 30 AI requests/min
  },

  // Queue System
  queue: {
    maxConcurrentJobs: 10,
    maxRetries: 3,
    retryDelay: 5000,       // 5 seconds between retries
    jobTimeout: 300000,     // 5 minutes per job
  },

  // API Response
  api: {
    maxPageSize: 100,
    defaultPageSize: 20,
    maxBodySize: '10mb',
    requestTimeout: 30000,  // 30 seconds
  },

  // Session
  session: {
    maxAge: 86400,          // 24 hours
    rolling: true,
  },

  // Concurrency
  concurrency: {
    maxConcurrentUsers: 1000,
    maxConnectionsPerUser: 5,
    keepAliveTimeout: 65000,
    headersTimeout: 66000,
  },
};

// Database indexes for performance
export const databaseIndexes = {
  invoices: [
    { fields: { createdBy: 1, createdAt: -1 } },
    { fields: { customerId: 1, status: 1 } },
    { fields: { invoiceNumber: 1 }, unique: true },
    { fields: { dueDate: 1, status: 1 } },
  ],
  customers: [
    { fields: { createdBy: 1, name: 1 } },
    { fields: { email: 1 }, unique: true },
    { fields: { phone: 1 } },
  ],
  contacts: [
    { fields: { createdBy: 1, name: 1 } },
    { fields: { email: 1 } },
    { fields: { dealId: 1 } },
  ],
  deals: [
    { fields: { createdBy: 1, stage: 1, value: -1 } },
    { fields: { contactId: 1 } },
    { fields: { status: 1, createdAt: -1 } },
  ],
  employees: [
    { fields: { createdBy: 1, department: 1 } },
    { fields: { email: 1 }, unique: true },
    { fields: { employeeId: 1 }, unique: true },
  ],
  stock: [
    { fields: { createdBy: 1, name: 1 } },
    { fields: { sku: 1 }, unique: true },
    { fields: { warehouse: 1, quantity: 1 } },
    { fields: { quantity: 1 } }, // For low stock queries
  ],
  campaigns: [
    { fields: { createdBy: 1, status: 1, createdAt: -1 } },
  ],
  tickets: [
    { fields: { createdBy: 1, status: 1, priority: -1 } },
    { fields: { assignedTo: 1, status: 1 } },
  ],
};

// Health check endpoints
export const healthCheckConfig = {
  endpoints: [
    '/api/health',
    '/api/health/db',
    '/api/health/cache',
    '/api/health/queue',
  ],
  interval: 30000,  // Check every 30s
  timeout: 5000,    // 5s timeout
};
