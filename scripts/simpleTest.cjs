/**
 * AINOS Simple Test Script - Works without prisma generate
 * Creates 25 basic invoice templates to test the system
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const companyTemplates = [
  { name: 'Tech Solutions Pvt Ltd', industry: 'IT Services', hasLetterhead: true },
  { name: 'MB Crusher India', industry: 'Manufacturing', hasLetterhead: true },
  { name: 'SKY Vision Multimedia', industry: 'Advertising', hasLetterhead: true },
  { name: 'Sharma Medical Store', industry: 'Healthcare', hasLetterhead: true },
  { name: 'Gupta Traders', industry: 'Wholesale', hasLetterhead: true },
  { name: 'Royal Construction Co', industry: 'Construction', hasLetterhead: true },
  { name: 'Fresh Foods Restaurant', industry: 'Food & Beverage', hasLetterhead: true },
  { name: 'AutoCare Garage', industry: 'Automotive', hasLetterhead: true },
  { name: 'EduLearn Academy', industry: 'Education', hasLetterhead: true },
  { name: 'Legal Associates', industry: 'Legal Services', hasLetterhead: true },
  { name: 'Green Earth Landscaping', industry: 'Landscaping', hasLetterhead: true },
  { name: 'CloudNine Hosting', industry: 'Web Hosting', hasLetterhead: true },
  { name: 'FitLife Gym', industry: 'Fitness', hasLetterhead: true },
  { name: 'PrintMaster Studio', industry: 'Printing', hasLetterhead: true },
  { name: 'TravelEase Tours', industry: 'Travel', hasLetterhead: true },
  { name: 'Startup Hub', industry: 'Co-working', hasLetterhead: false },
  { name: 'Quick Fix Plumbing', industry: 'Home Services', hasLetterhead: false },
  { name: 'PetCare Clinic', industry: 'Veterinary', hasLetterhead: false },
  { name: 'Beauty Bliss Salon', industry: 'Beauty', hasLetterhead: false },
  { name: 'CodeCraft Software', industry: 'Software Development', hasLetterhead: false },
  { name: 'HomeStyle Interiors', industry: 'Interior Design', hasLetterhead: false },
  { name: 'EventPro Management', industry: 'Event Management', hasLetterhead: false },
  { name: 'FreshMart Grocery', industry: 'Retail', hasLetterhead: false },
  { name: 'SmartLearn Online', industry: 'E-Learning', hasLetterhead: false },
  { name: 'GreenLeaf Organic', industry: 'Organic Products', hasLetterhead: false },
];

async function main() {
  console.log('🧪 AINOS Test - 25 Company Templates\n');

  let user = await prisma.user.findFirst({
    where: { email: 'soniajaiswal2222@gmail.com' }
  });

  if (!user) {
    console.log('❌ User not found');
    process.exit(1);
  }

  console.log(`✓ User: ${user.email}`);

  let company = await prisma.company.findFirst({
    where: { createdBy: user.id }
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'AINOS Test Company',
        email: user.email,
        createdBy: user.id,
      }
    });
    console.log(`✓ Created company: ${company.name}`);
  } else {
    console.log(`✓ Company: ${company.name}`);
  }

  console.log('\n📋 Creating 25 templates...\n');

  let created = 0;
  let withLetterhead = 0;
  let withoutLetterhead = 0;

  for (const template of companyTemplates) {
    try {
      await prisma.invoiceTemplate.create({
        data: {
          name: template.name,
          company: { connect: { id: company.id } },
          isDefault: created === 0,
          primaryColor: '#6D28D9',
          secondaryColor: '#8B5CF6',
          backgroundColor: '#FFFFFF',
          textColor: '#1F2937',
          fontFamily: 'Helvetica',
          fontSize: 'medium',
          layout: 'standard',
          showLogo: true,
          logoSize: 'medium',
          logoPosition: 'left',
          showBankDetails: true,
          showTerms: true,
          terms: 'Payment due within 30 days.',
          footerText: 'Powered by AINOS',
          headerLayout: 'stacked',
          showDocInfoTable: false,
          paymentTermsLayout: 'text',
          termsNumbering: 'numbered',
          showValidityDate: false,
          signatureStyle: 'simple',
        }
      });

      created++;
      if (template.hasLetterhead) {
        withLetterhead++;
        console.log(`✓ [${created}/25] ${template.name} (${template.industry}) - WITH letterhead`);
      } else {
        withoutLetterhead++;
        console.log(`✓ [${created}/25] ${template.name} (${template.industry}) - WITHOUT letterhead`);
      }
    } catch (error) {
      console.error(`✗ ${template.name}:`, error.message.substring(0, 200));
    }
  }

  console.log('\n✅ Test Complete!');
  console.log(`\n📊 Summary:`);
  console.log(`   Total: ${created}/25`);
  console.log(`   With Letterhead: ${withLetterhead}`);
  console.log(`   Without Letterhead: ${withoutLetterhead}`);
  console.log(`\n🎯 Next Steps:`);
  console.log(`   1. Login: http://localhost:3000`);
  console.log(`   2. Templates: /finance/templates`);
  console.log(`   3. New Invoice: /invoices/new`);
  console.log(`   4. Test signature: Upload or draw signature`);
  console.log(`   5. Download PDF: Verify signature renders`);
}

main()
  .catch((e) => {
    console.error('❌ Failed:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
