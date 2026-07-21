// AINOS Load Testing Configuration
// Use with Artillery: npm install -g artillery && artillery run load-test.yml

export const loadTestConfig = {
  // Target URL
  target: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  // Test scenarios
  scenarios: [
    {
      name: 'Authentication Flow',
      weight: 20, // 20% of traffic
      flow: [
        { post: { url: '/api/auth/signin', json: { email: 'test@ainos.com', password: 'test123' } } },
        { get: { url: '/api/auth/session' } },
      ],
    },
    {
      name: 'Dashboard Load',
      weight: 30, // 30% of traffic
      flow: [
        { get: { url: '/dashboard' } },
        { get: { url: '/api/invoices' } },
        { get: { url: '/api/customers' } },
      ],
    },
    {
      name: 'CRM Operations',
      weight: 15,
      flow: [
        { get: { url: '/api/crm/contacts' } },
        { get: { url: '/api/crm/deals' } },
        { post: { url: '/api/crm/contacts', json: { name: 'Test Contact', email: 'test@example.com' } } },
      ],
    },
    {
      name: 'Invoice Operations',
      weight: 15,
      flow: [
        { get: { url: '/api/invoices' } },
        { get: { url: '/api/invoices?status=pending' } },
      ],
    },
    {
      name: 'Inventory Check',
      weight: 10,
      flow: [
        { get: { url: '/api/inventory/stock' } },
        { get: { url: '/api/inventory/stock?lowStock=true' } },
      ],
    },
    {
      name: 'Reports & Analytics',
      weight: 10,
      flow: [
        { get: { url: '/api/reports/summary' } },
        { get: { url: '/api/reports/revenue' } },
      ],
    },
  ],

  // Load phases
  phases: [
    { duration: 60, arrivalRate: 10, name: 'Warm up' },         // 10 users/sec for 60s
    { duration: 120, arrivalRate: 50, name: 'Ramp up' },        // 50 users/sec for 120s
    { duration: 300, arrivalRate: 100, name: 'Sustained load' }, // 100 users/sec for 5min
    { duration: 60, arrivalRate: 200, name: 'Peak load' },      // 200 users/sec for 60s
    { duration: 120, arrivalRate: 50, name: 'Cool down' },      // 50 users/sec for 120s
  ],

  // Success criteria
  thresholds: {
    'http.response_time.p95': 500,   // 95% of requests under 500ms
    'http.response_time.p99': 1000,  // 99% of requests under 1s
    'http.errors': 5,                 // Less than 5% errors
  },
};

// Quick benchmark targets for 1000 concurrent users:
// - API response time: < 200ms (p50), < 500ms (p95), < 1s (p99)
// - Throughput: > 1000 requests/sec
// - Error rate: < 1%
// - Database query time: < 50ms (with indexes)
// - Cache hit rate: > 80%
