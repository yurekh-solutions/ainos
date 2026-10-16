const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function verify() {
  const total = await p.invoiceTemplate.count()
  console.log('Total templates:', total)

  const templates = await p.invoiceTemplate.findMany({
    take: 5,
    select: { id: true, name: true, formFields: true }
  })
  templates.forEach(x => {
    const ff = x.formFields ? JSON.parse(JSON.stringify(x.formFields)) : []
    console.log(`  ${x.name} - formFields: ${ff.length}`)
  })

  // Check invoices with signature fields
  const invoices = await p.invoice.findMany({
    take: 3,
    select: { id: true, invoiceNumber: true, signatureImage: true, signatureType: true, customFields: true }
  })
  console.log('\nRecent invoices:')
  invoices.forEach(i => {
    console.log(`  ${i.invoiceNumber} - sig: ${i.signatureType || 'none'}, customFields: ${i.customFields ? 'yes' : 'no'}`)
  })

  await p.$disconnect()
}

verify().catch(e => { console.error(e); process.exit(1) })
