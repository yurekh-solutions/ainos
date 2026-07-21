// Run this script to create database indexes for optimal performance
// Usage: npx tsx src/scripts/setup-indexes.ts

import connectDB from '../lib/mongodb';
import mongoose from 'mongoose';

const indexes = {
  Invoice: [
    { keys: { createdBy: 1, createdAt: -1 }, options: {} },
    { keys: { customerId: 1, status: 1 }, options: {} },
    { keys: { invoiceNumber: 1 }, options: { unique: true } },
    { keys: { dueDate: 1, status: 1 }, options: {} },
  ],
  Customer: [
    { keys: { createdBy: 1, name: 1 }, options: {} },
    { keys: { email: 1 }, options: { unique: true, sparse: true } },
    { keys: { phone: 1 }, options: { sparse: true } },
  ],
  Contact: [
    { keys: { createdBy: 1, name: 1 }, options: {} },
    { keys: { email: 1 }, options: { sparse: true } },
    { keys: { dealId: 1 }, options: {} },
  ],
  Deal: [
    { keys: { createdBy: 1, stage: 1, value: -1 }, options: {} },
    { keys: { contactId: 1 }, options: {} },
    { keys: { status: 1, createdAt: -1 }, options: {} },
  ],
  Employee: [
    { keys: { createdBy: 1, department: 1 }, options: {} },
    { keys: { email: 1 }, options: { unique: true } },
    { keys: { employeeId: 1 }, options: { unique: true } },
  ],
  StockItem: [
    { keys: { createdBy: 1, name: 1 }, options: {} },
    { keys: { sku: 1 }, options: { unique: true, sparse: true } },
    { keys: { warehouse: 1, quantity: 1 }, options: {} },
    { keys: { quantity: 1 }, options: {} },
  ],
  Campaign: [
    { keys: { createdBy: 1, status: 1, createdAt: -1 }, options: {} },
  ],
  Ticket: [
    { keys: { createdBy: 1, status: 1, priority: -1 }, options: {} },
    { keys: { assignedTo: 1, status: 1 }, options: {} },
  ],
  LeaveRequest: [
    { keys: { createdBy: 1, employee: 1, status: 1 }, options: {} },
    { keys: { startDate: 1, endDate: 1 }, options: {} },
  ],
  PayrollRecord: [
    { keys: { createdBy: 1, employee: 1, month: 1, year: 1 }, options: {} },
  ],
  AttendanceRecord: [
    { keys: { createdBy: 1, employee: 1, date: 1 }, options: {} },
  ],
  ComplianceTask: [
    { keys: { createdBy: 1, dueDate: 1, status: 1 }, options: {} },
    { keys: { category: 1, status: 1 }, options: {} },
  ],
};

async function setupIndexes() {
  console.log('Setting up database indexes...');
  await connectDB();

  for (const [modelName, modelIndexes] of Object.entries(indexes)) {
    const Model = mongoose.models[modelName];
    if (!Model) {
      console.warn(`Model ${modelName} not found, skipping`);
      continue;
    }

    console.log(`\nCreating indexes for ${modelName}...`);
    try {
      for (const { keys, options } of modelIndexes) {
        await Model.collection.createIndex(keys as Record<string, 1 | -1>, options);
        console.log(`  ✓ ${JSON.stringify(keys)}`);
      }
    } catch (error) {
      console.error(`  ✗ Error creating indexes for ${modelName}:`, error);
    }
  }

  console.log('\nIndex setup complete!');
  process.exit(0);
}

setupIndexes().catch((error) => {
  console.error('Failed to setup indexes:', error);
  process.exit(1);
});
