const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createTestInvoice() {
  console.log('🧪 Creating test invoice...\n')

  const user = await prisma.user.findUnique({
    where: { email: 'soniajaiswal2222@gmail.com' },
    include: { company: true }
  })

  if (!user || !user.company) {
    console.log('❌ User or company not found')
    process.exit(1)
  }

  console.log(`✓ User: ${user.email}`)
  console.log(`✓ Company: ${user.company.name}\n`)

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: `TEST-${Date.now()}`,
      company: { connect: { id: user.company.id } },
      customerName: 'Test Customer Pvt Ltd',
      customerEmail: 'test@example.com',
      customerAddress: 'Mumbai, Maharashtra',
      customerGstNumber: '27AABCU9603R1ZM',
      customerPan: 'AABCU9603R',
      items: [
        {
          name: 'Test Service',
          description: 'Testing invoice system',
          hsnCode: '9983',
          quantity: 2,
          price: 5000,
          gstRate: 18,
          amount: 10000
        }
      ],
      subtotal: 10000,
      cgstAmount: 900,
      sgstAmount: 900,
      totalAmount: 11800,
      supplyType: 'intra',
      billingType: 'gst',
      status: 'draft',
      customFields: {
        poNumber: 'PO-2026-001',
        servicePeriod: 'Jan 2026 - Mar 2026'
      },
      signatureType: 'draw',
      signatureDate: new Date(),
      notes: 'Test invoice with custom fields and signature'
    }
  })

  console.log('✅ Invoice created!')
  console.log(`   Number: ${invoice.invoiceNumber}`)
  console.log(`   Customer: ${invoice.customerName}`)
  console.log(`   Total: ₹${invoice.totalAmount}`)
  console.log(`   Custom Fields: ${JSON.stringify(invoice.customFields)}`)
  console.log(`   Signature: ${invoice.signatureType}\n`)

  await prisma.$disconnect()
  console.log('🎉 Test complete!')
}

createTestInvoice().catch(err => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
