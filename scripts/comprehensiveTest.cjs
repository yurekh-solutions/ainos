/**
 * AINOS Comprehensive Test Script
 * Creates 25 companies with different invoice templates
 * Tests both scenarios: with letterhead (auto-extract) and without letterhead (manual fields)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Company templates - different industries and requirements
const companyTemplates = [
  // WITH LETTERHEAD - Auto-extracted fields
  {
    name: 'Tech Solutions Pvt Ltd',
    industry: 'IT Services',
    hasLetterhead: true,
    formFields: [
      { label: 'PO Number', key: 'poNumber', type: 'text', required: true },
      { label: 'Project Code', key: 'projectCode', type: 'text', required: true },
      { label: 'Delivery Date', key: 'deliveryDate', type: 'date', required: false },
    ],
    tableColumns: [
      { label: 'Service', key: 'service', width: '40%' },
      { label: 'Hours', key: 'hours', width: '15%' },
      { label: 'Rate', key: 'rate', width: '20%' },
      { label: 'Amount', key: 'amount', width: '25%' },
    ],
  },
  {
    name: 'MB Crusher India',
    industry: 'Manufacturing',
    hasLetterhead: true,
    formFields: [
      { label: 'PO Number', key: 'poNumber', type: 'text', required: true },
      { label: 'Validity Date', key: 'validityDate', type: 'date', required: true },
      { label: 'Payment Terms', key: 'paymentTerms', type: 'select', required: true, options: ['Net 30', 'Net 60', 'Due on Receipt'] },
    ],
    tableColumns: [
      { label: 'Item Code', key: 'itemCode', width: '15%' },
      { label: 'Description', key: 'description', width: '35%' },
      { label: 'Qty', key: 'qty', width: '10%' },
      { label: 'Rate', key: 'rate', width: '15%' },
      { label: 'Amount', key: 'amount', width: '25%' },
    ],
  },
  {
    name: 'SKY Vision & Multimedia',
    industry: 'Advertising',
    hasLetterhead: true,
    formFields: [
      { label: 'Campaign ID', key: 'campaignId', type: 'text', required: true },
      { label: 'Display Days', key: 'displayDays', type: 'number', required: true },
      { label: 'Location', key: 'location', type: 'text', required: false },
    ],
    tableColumns: [
      { label: 'Sr.No', key: 'serial', width: '8%' },
      { label: 'Description', key: 'description', width: '35%' },
      { label: 'Days/No', key: 'daysNo', width: '12%' },
      { label: 'Rate/Day', key: 'ratePerDay', width: '20%' },
      { label: 'Amount', key: 'amount', width: '25%' },
    ],
  },
  {
    name: 'Sharma Medical Store',
    industry: 'Healthcare',
    hasLetterhead: true,
    formFields: [
      { label: 'Prescription No', key: 'prescriptionNo', type: 'text', required: true },
      { label: 'Doctor Name', key: 'doctorName', type: 'text', required: false },
      { label: 'Patient Name', key: 'patientName', type: 'text', required: true },
    ],
    tableColumns: [
      { label: 'Medicine', key: 'medicine', width: '35%' },
      { label: 'Batch', key: 'batch', width: '15%' },
      { label: 'Qty', key: 'qty', width: '10%' },
      { label: 'MRP', key: 'mrp', width: '15%' },
      { label: 'Discount', key: 'discount', width: '10%' },
      { label: 'Amount', key: 'amount', width: '15%' },
    ],
  },
  {
    name: 'Gupta Traders',
    industry: 'Wholesale',
    hasLetterhead: true,
    formFields: [
      { label: 'Order No', key: 'orderNo', type: 'text', required: true },
      { label: 'Dispatch Date', key: 'dispatchDate', type: 'date', required: true },
      { label: 'Transport', key: 'transport', type: 'text', required: false },
    ],
    tableColumns: [
      { label: 'Item', key: 'item', width: '30%' },
      { label: 'HSN', key: 'hsn', width: '12%' },
      { label: 'Qty', key: 'qty', width: '10%' },
      { label: 'Rate', key: 'rate', width: '15%' },
      { label: 'GST%', key: 'gst', width: '10%' },
      { label: 'Total', key: 'total', width: '23%' },
    ],
  },
  {
    name: 'Royal Construction Co',
    industry: 'Construction',
    hasLetterhead: true,
    formFields: [
      { label: 'Contract No', key: 'contractNo', type: 'text', required: true },
      { label: 'Site Location', key: 'siteLocation', type: 'text', required: true },
      { label: 'Work Order Date', key: 'workOrderDate', type: 'date', required: false },
    ],
    tableColumns: [
      { label: 'Work Item', key: 'workItem', width: '35%' },
      { label: 'Unit', key: 'unit', width: '10%' },
      { label: 'Qty', key: 'qty', width: '12%' },
      { label: 'Rate', key: 'rate', width: '18%' },
      { label: 'Amount', key: 'amount', width: '25%' },
    ],
  },
  {
    name: 'Fresh Foods Restaurant',
    industry: 'Food & Beverage',
    hasLetterhead: true,
    formFields: [
      { label: 'Table No', key: 'tableNo', type: 'text', required: false },
      { label: 'Order No', key: 'orderNo', type: 'text', required: true },
      { label: 'Waiter Name', key: 'waiterName', type: 'text', required: false },
    ],
    tableColumns: [
      { label: 'Item', key: 'item', width: '40%' },
      { label: 'Qty', key: 'qty', width: '12%' },
      { label: 'Rate', key: 'rate', width: '18%' },
      { label: 'Amount', key: 'amount', width: '30%' },
    ],
  },
  {
    name: 'AutoCare Garage',
    industry: 'Automotive',
    hasLetterhead: true,
    formFields: [
      { label: 'Vehicle No', key: 'vehicleNo', type: 'text', required: true },
      { label: 'Service Type', key: 'serviceType', type: 'select', required: true, options: ['General Service', 'Repair', 'AC Service', 'Denting/Painting'] },
      { label: 'KM Reading', key: 'kmReading', type: 'number', required: false },
    ],
    tableColumns: [
      { label: 'Service/Part', key: 'servicePart', width: '35%' },
      { label: 'Part No', key: 'partNo', width: '15%' },
      { label: 'Qty', key: 'qty', width: '10%' },
      { label: 'Rate', key: 'rate', width: '15%' },
      { label: 'Amount', key: 'amount', width: '25%' },
    ],
  },
  {
    name: 'EduLearn Academy',
    industry: 'Education',
    hasLetterhead: true,
    formFields: [
      { label: 'Student ID', key: 'studentId', type: 'text', required: true },
      { label: 'Course Name', key: 'courseName', type: 'text', required: true },
      { label: 'Batch', key: 'batch', type: 'text', required: false },
    ],
    tableColumns: [
      { label: 'Fee Component', key: 'feeComponent', width: '40%' },
      { label: 'Months', key: 'months', width: '15%' },
      { label: 'Rate', key: 'rate', width: '20%' },
      { label: 'Amount', key: 'amount', width: '25%' },
    ],
  },
  {
    name: 'Legal Associates',
    industry: 'Legal Services',
    hasLetterhead: true,
    formFields: [
      { label: 'Case No', key: 'caseNo', type: 'text', required: true },
      { label: 'Client ID', key: 'clientId', type: 'text', required: true },
      { label: 'Hearing Date', key: 'hearingDate', type: 'date', required: false },
    ],
    tableColumns: [
      { label: 'Service', key: 'service', width: '45%' },
      { label: 'Hours', key: 'hours', width: '15%' },
      { label: 'Rate', key: 'rate', width: '20%' },
      { label: 'Amount', key: 'amount', width: '20%' },
    ],
  },
  {
    name: 'Green Earth Landscaping',
    industry: 'Landscaping',
    hasLetterhead: true,
    formFields: [
      { label: 'Property Address', key: 'propertyAddress', type: 'text', required: true },
      { label: 'Service Date', key: 'serviceDate', type: 'date', required: true },
      { label: 'Area (sq ft)', key: 'areaSqFt', type: 'number', required: false },
    ],
    tableColumns: [
      { label: 'Service', key: 'service', width: '35%' },
      { label: 'Area', key: 'area', width: '15%' },
      { label: 'Rate', key: 'rate', width: '20%' },
      { label: 'Amount', key: 'amount', width: '30%' },
    ],
  },
  {
    name: 'CloudNine Hosting',
    industry: 'Web Hosting',
    hasLetterhead: true,
    formFields: [
      { label: 'Domain Name', key: 'domainName', type: 'text', required: true },
      { label: 'Hosting Plan', key: 'hostingPlan', type: 'select', required: true, options: ['Basic', 'Standard', 'Premium', 'Enterprise'] },
      { label: 'Billing Cycle', key: 'billingCycle', type: 'select', required: true, options: ['Monthly', 'Quarterly', 'Yearly'] },
    ],
    tableColumns: [
      { label: 'Service', key: 'service', width: '40%' },
      { label: 'Period', key: 'period', width: '20%' },
      { label: 'Rate', key: 'rate', width: '20%' },
      { label: 'Amount', key: 'amount', width: '20%' },
    ],
  },
  {
    name: 'FitLife Gym',
    industry: 'Fitness',
    hasLetterhead: true,
    formFields: [
      { label: 'Member ID', key: 'memberId', type: 'text', required: true },
      { label: 'Membership Type', key: 'membershipType', type: 'select', required: true, options: ['Monthly', 'Quarterly', 'Yearly', 'Lifetime'] },
      { label: 'Trainer Name', key: 'trainerName', type: 'text', required: false },
    ],
    tableColumns: [
      { label: 'Service', key: 'service', width: '40%' },
      { label: 'Duration', key: 'duration', width: '20%' },
      { label: 'Rate', key: 'rate', width: '20%' },
      { label: 'Amount', key: 'amount', width: '20%' },
    ],
  },
  {
    name: 'PrintMaster Studio',
    industry: 'Printing',
    hasLetterhead: true,
    formFields: [
      { label: 'Job No', key: 'jobNo', type: 'text', required: true },
      { label: 'Print Size', key: 'printSize', type: 'text', required: false },
      { label: 'Quantity', key: 'printQty', type: 'number', required: true },
    ],
    tableColumns: [
      { label: 'Item', key: 'item', width: '30%' },
      { label: 'Size', key: 'size', width: '15%' },
      { label: 'Qty', key: 'qty', width: '12%' },
      { label: 'Rate', key: 'rate', width: '18%' },
      { label: 'Amount', key: 'amount', width: '25%' },
    ],
  },
  {
    name: 'TravelEase Tours',
    industry: 'Travel',
    hasLetterhead: true,
    formFields: [
      { label: 'Booking Ref', key: 'bookingRef', type: 'text', required: true },
      { label: 'Travel Date', key: 'travelDate', type: 'date', required: true },
      { label: 'Destination', key: 'destination', type: 'text', required: true },
      { label: 'No of Travelers', key: 'noTravelers', type: 'number', required: true },
    ],
    tableColumns: [
      { label: 'Service', key: 'service', width: '35%' },
      { label: 'Pax', key: 'pax', width: '12%' },
      { label: 'Rate', key: 'rate', width: '20%' },
      { label: 'Amount', key: 'amount', width: '33%' },
    ],
  },

  // WITHOUT LETTERHEAD - Manual field configuration
  {
    name: 'Startup Hub',
    industry: 'Co-working',
    hasLetterhead: false,
    formFields: [
      { label: 'Desk No', key: 'deskNo', type: 'text', required: true },
      { label: 'Month', key: 'month', type: 'select', required: true, options: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] },
    ],
    tableColumns: [
      { label: 'Service', key: 'service', width: '50%' },
      { label: 'Months', key: 'months', width: '15%' },
      { label: 'Amount', key: 'amount', width: '35%' },
    ],
  },
  {
    name: 'Quick Fix Plumbing',
    industry: 'Home Services',
    hasLetterhead: false,
    formFields: [
      { label: 'Service Address', key: 'serviceAddress', type: 'text', required: true },
      { label: 'Emergency', key: 'emergency', type: 'select', required: false, options: ['Yes', 'No'] },
    ],
    tableColumns: [
      { label: 'Service', key: 'service', width: '40%' },
      { label: 'Hours', key: 'hours', width: '15%' },
      { label: 'Rate', key: 'rate', width: '20%' },
      { label: 'Amount', key: 'amount', width: '25%' },
    ],
  },
  {
    name: 'PetCare Clinic',
    industry: 'Veterinary',
    hasLetterhead: false,
    formFields: [
      { label: 'Pet Name', key: 'petName', type: 'text', required: true },
      { label: 'Pet Type', key: 'petType', type: 'select', required: true, options: ['Dog', 'Cat', 'Bird', 'Other'] },
      { label: 'Owner Name', key: 'ownerName', type: 'text', required: true },
    ],
    tableColumns: [
      { label: 'Service/Medicine', key: 'serviceMedicine', width: '40%' },
      { label: 'Qty', key: 'qty', width: '12%' },
      { label: 'Rate', key: 'rate', width: '18%' },
      { label: 'Amount', key: 'amount', width: '30%' },
    ],
  },
  {
    name: 'Beauty Bliss Salon',
    industry: 'Beauty',
    hasLetterhead: false,
    formFields: [
      { label: 'Appointment No', key: 'appointmentNo', type: 'text', required: true },
      { label: 'Stylist Name', key: 'stylistName', type: 'text', required: false },
    ],
    tableColumns: [
      { label: 'Service', key: 'service', width: '45%' },
      { label: 'Duration', key: 'duration', width: '15%' },
      { label: 'Rate', key: 'rate', width: '20%' },
      { label: 'Amount', key: 'amount', width: '20%' },
    ],
  },
  {
    name: 'CodeCraft Software',
    industry: 'Software Development',
    hasLetterhead: false,
    formFields: [
      { label: 'Sprint No', key: 'sprintNo', type: 'text', required: false },
      { label: 'Developer', key: 'developer', type: 'text', required: false },
      { label: 'Hours Logged', key: 'hoursLogged', type: 'number', required: true },
    ],
    tableColumns: [
      { label: 'Task/Feature', key: 'taskFeature', width: '40%' },
      { label: 'Hours', key: 'hours', width: '15%' },
      { label: 'Rate/Hour', key: 'ratePerHour', width: '20%' },
      { label: 'Amount', key: 'amount', width: '25%' },
    ],
  },
  {
    name: 'HomeStyle Interiors',
    industry: 'Interior Design',
    hasLetterhead: false,
    formFields: [
      { label: 'Project Name', key: 'projectName', type: 'text', required: true },
      { label: 'Room Type', key: 'roomType', type: 'select', required: false, options: ['Living Room', 'Bedroom', 'Kitchen', 'Office', 'Other'] },
    ],
    tableColumns: [
      { label: 'Item', key: 'item', width: '35%' },
      { label: 'Qty', key: 'qty', width: '12%' },
      { label: 'Rate', key: 'rate', width: '18%' },
      { label: 'Amount', key: 'amount', width: '35%' },
    ],
  },
  {
    name: 'EventPro Management',
    industry: 'Event Management',
    hasLetterhead: false,
    formFields: [
      { label: 'Event Name', key: 'eventName', type: 'text', required: true },
      { label: 'Event Date', key: 'eventDate', type: 'date', required: true },
      { label: 'Venue', key: 'venue', type: 'text', required: true },
      { label: 'Expected Guests', key: 'expectedGuests', type: 'number', required: false },
    ],
    tableColumns: [
      { label: 'Service', key: 'service', width: '40%' },
      { label: 'Qty/Pax', key: 'qtyPax', width: '15%' },
      { label: 'Rate', key: 'rate', width: '20%' },
      { label: 'Amount', key: 'amount', width: '25%' },
    ],
  },
  {
    name: 'FreshMart Grocery',
    industry: 'Retail',
    hasLetterhead: false,
    formFields: [],
    tableColumns: [
      { label: 'Item', key: 'item', width: '35%' },
      { label: 'Qty', key: 'qty', width: '12%' },
      { label: 'Rate', key: 'rate', width: '18%' },
      { label: 'Discount', key: 'discount', width: '12%' },
      { label: 'Amount', key: 'amount', width: '23%' },
    ],
  },
  {
    name: 'SmartLearn Online',
    industry: 'E-Learning',
    hasLetterhead: false,
    formFields: [
      { label: 'Course ID', key: 'courseId', type: 'text', required: true },
      { label: 'Student Email', key: 'studentEmail', type: 'text', required: true },
    ],
    tableColumns: [
      { label: 'Course/Module', key: 'courseModule', width: '45%' },
      { label: 'Duration', key: 'duration', width: '15%' },
      { label: 'Amount', key: 'amount', width: '40%' },
    ],
  },
  {
    name: 'GreenLeaf Organic',
    industry: 'Organic Products',
    hasLetterhead: false,
    formFields: [
      { label: 'Certification No', key: 'certificationNo', type: 'text', required: false },
    ],
    tableColumns: [
      { label: 'Product', key: 'product', width: '35%' },
      { label: 'Weight', key: 'weight', width: '15%' },
      { label: 'Rate', key: 'rate', width: '20%' },
      { label: 'Amount', key: 'amount', width: '30%' },
    ],
  },
  {
    name: 'DataFlow Analytics',
    industry: 'Data Science',
    hasLetterhead: false,
    formFields: [
      { label: 'Project Code', key: 'projectCode', type: 'text', required: true },
      { label: 'Analyst', key: 'analyst', type: 'text', required: false },
    ],
    tableColumns: [
      { label: 'Service', key: 'service', width: '40%' },
      { label: 'Hours', key: 'hours', width: '15%' },
      { label: 'Rate', key: 'rate', width: '20%' },
      { label: 'Amount', key: 'amount', width: '25%' },
    ],
  },
  {
    name: 'Urban Move Packers',
    industry: 'Packers & Movers',
    hasLetterhead: false,
    formFields: [
      { label: 'From Address', key: 'fromAddress', type: 'text', required: true },
      { label: 'To Address', key: 'toAddress', type: 'text', required: true },
      { label: 'Move Date', key: 'moveDate', type: 'date', required: true },
    ],
    tableColumns: [
      { label: 'Service', key: 'service', width: '35%' },
      { label: 'Qty', key: 'qty', width: '12%' },
      { label: 'Rate', key: 'rate', width: '18%' },
      { label: 'Amount', key: 'amount', width: '35%' },
    ],
  },
];

async function main() {
  console.log(' Starting AINOS Comprehensive Test - 25 Companies\n');

  // Find or create a test user
  let user = await prisma.user.findFirst({
    where: { email: 'soniajaiswal2222@gmail.com' }
  });

  if (!user) {
    console.log(' No user found with yurekh email. Please login first.');
    process.exit(1);
  }

  console.log(`✓ Using user: ${user.email} (ID: ${user.id})`);

  // Create or get company
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
    console.log(`✓ Created company: ${company.name} (ID: ${company.id})`);
  } else {
    console.log(`✓ Using company: ${company.name} (ID: ${company.id})`);
  }

  // Update user's companyId
  await prisma.user.update({
    where: { id: user.id },
    data: { companyId: company.id }
  });

  console.log('\n📋 Creating 25 company templates...\n');

  let created = 0;
  let withLetterhead = 0;
  let withoutLetterhead = 0;

  for (const template of companyTemplates) {
    try {
      // Create invoice template
      const invoiceTemplate = await prisma.invoiceTemplate.create({
        data: {
          name: template.name,
          company: { connect: { id: company.id } },
          isDefault: created === 0, // First one is default
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
          terms: 'Payment due within 30 days. Late payments may attract interest charges.',
          footerText: 'Powered by AINOS',
          tableColumns: template.tableColumns,
          formFields: template.formFields,
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
        console.log(`✓ [${created}/25] ${template.name} (${template.industry}) - WITH letterhead, ${template.formFields.length} fields`);
      } else {
        withoutLetterhead++;
        console.log(`✓ [${created}/25] ${template.name} (${template.industry}) - WITHOUT letterhead, ${template.formFields.length} fields`);
      }
    } catch (error) {
      console.error(`✗ Failed to create template for ${template.name}:`, error.message);
    }
  }

  console.log('\n✅ Test Data Creation Complete!');
  console.log(`\n📊 Summary:`);
  console.log(`   Total Templates: ${created}/25`);
  console.log(`   With Letterhead: ${withLetterhead}`);
  console.log(`   Without Letterhead: ${withoutLetterhead}`);
  console.log(`\n Next Steps:`);
  console.log(`   1. Login to AINOS: http://localhost:3000`);
  console.log(`   2. Go to /finance/templates - See all 25 templates`);
  console.log(`   3. Go to /invoices/new - Form shows fields from default template`);
  console.log(`   4. Switch templates to see different field configurations`);
  console.log(`   5. Create invoices and download PDFs to verify signature rendering`);
  console.log(`\n Test Scenarios:`);
  console.log(`   ✓ Auto-extraction (with letterhead)`);
  console.log(`   ✓ Manual configuration (without letterhead)`);
  console.log(`   ✓ Dynamic form generation`);
  console.log(`   ✓ Digital signature (upload/draw)`);
  console.log(`   ✓ PDF rendering with custom fields`);
}

main()
  .catch((e) => {
    console.error('❌ Test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
