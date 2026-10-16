const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

const formFieldsByName = {
  'Tech Solutions Pvt Ltd': [
    { label: 'PO Number', key: 'poNumber', type: 'text', required: true, placeholder: 'Purchase Order Number' },
    { label: 'Service Period', key: 'servicePeriod', type: 'text', required: false, placeholder: 'e.g., Jan 2026 - Mar 2026' },
    { label: 'SLA Terms', key: 'slaTerms', type: 'select', required: false, options: ['Standard', 'Premium', 'Enterprise'] }
  ],
  'MB Crusher India': [
    { label: 'Delivery Date', key: 'deliveryDate', type: 'date', required: true },
    { label: 'Shipping Mode', key: 'shippingMode', type: 'select', required: false, options: ['Road', 'Rail', 'Air', 'Sea'] },
    { label: 'Warranty Period', key: 'warranty', type: 'text', required: false, placeholder: 'e.g., 12 months' }
  ],
  'SKY Vision Multimedia': [
    { label: 'Campaign Name', key: 'campaignName', type: 'text', required: false, placeholder: 'Campaign/Project Name' },
    { label: 'Delivery Format', key: 'deliveryFormat', type: 'select', required: false, options: ['Digital', 'Print', 'Both'] }
  ],
  'Sharma Medical Store': [
    { label: 'Prescription Ref', key: 'prescriptionRef', type: 'text', required: false, placeholder: 'Doctor Prescription Ref' },
    { label: 'Patient ID', key: 'patientId', type: 'text', required: false, placeholder: 'Patient ID (optional)' }
  ],
  'Gupta Traders': [
    { label: 'Order Number', key: 'orderNumber', type: 'text', required: true, placeholder: 'Wholesale Order Number' },
    { label: 'Payment Terms', key: 'paymentTerms', type: 'select', required: false, options: ['Net 30', 'Net 60', 'COD', 'Advance'] }
  ],
  'Royal Construction Co': [
    { label: 'Project Name', key: 'projectName', type: 'text', required: true, placeholder: 'Construction Project' },
    { label: 'Site Address', key: 'siteAddress', type: 'text', required: false, placeholder: 'Work Site Address' },
    { label: 'Completion Date', key: 'completionDate', type: 'date', required: false }
  ],
  'Fresh Foods Restaurant': [
    { label: 'Order Type', key: 'orderType', type: 'select', required: false, options: ['Dine-in', 'Catering', 'Bulk Order'] },
    { label: 'Delivery Time', key: 'deliveryTime', type: 'text', required: false, placeholder: 'Preferred delivery time' }
  ],
  'AutoCare Garage': [
    { label: 'Vehicle Number', key: 'vehicleNumber', type: 'text', required: true, placeholder: 'e.g., MH-02-AB-1234' },
    { label: 'Service Type', key: 'serviceType', type: 'select', required: false, options: ['General Service', 'Repair', 'Modification'] },
    { label: 'Warranty', key: 'warranty', type: 'text', required: false, placeholder: 'Service warranty period' }
  ],
  'EduLearn Academy': [
    { label: 'Course/Batch', key: 'courseBatch', type: 'text', required: false, placeholder: 'Course name and batch' },
    { label: 'Student ID', key: 'studentId', type: 'text', required: false, placeholder: 'Student ID (optional)' }
  ],
  'Legal Associates': [
    { label: 'Case Reference', key: 'caseRef', type: 'text', required: true, placeholder: 'Case/ Matter Number' },
    { label: 'Billable Hours', key: 'billableHours', type: 'number', required: false, placeholder: 'Hours billed' }
  ],
  'Green Earth Landscaping': [
    { label: 'Project Site', key: 'projectSite', type: 'text', required: false, placeholder: 'Work location' },
    { label: 'Maintenance Period', key: 'maintenancePeriod', type: 'text', required: false, placeholder: 'e.g., 3 months' }
  ],
  'CloudNine Hosting': [
    { label: 'Hosting Plan', key: 'hostingPlan', type: 'select', required: false, options: ['Basic', 'Business', 'Enterprise'] },
    { label: 'Billing Cycle', key: 'billingCycle', type: 'select', required: false, options: ['Monthly', 'Quarterly', 'Annual'] }
  ],
  'FitLife Gym': [
    { label: 'Membership Type', key: 'membershipType', type: 'select', required: false, options: ['Monthly', 'Quarterly', 'Annual'] },
    { label: 'Member ID', key: 'memberId', type: 'text', required: false, placeholder: 'Gym Member ID' }
  ],
  'PrintMaster Studio': [
    { label: 'Job Number', key: 'jobNumber', type: 'text', required: true, placeholder: 'Print Job Number' },
    { label: 'Print Specs', key: 'printSpecs', type: 'text', required: false, placeholder: 'Paper type, size, finish' }
  ],
  'TravelEase Tours': [
    { label: 'Booking Ref', key: 'bookingRef', type: 'text', required: true, placeholder: 'Booking Reference' },
    { label: 'Travel Dates', key: 'travelDates', type: 'text', required: false, placeholder: 'Departure - Return' }
  ],
  'Startup Hub': [
    { label: 'Desk/Room', key: 'deskRoom', type: 'text', required: false, placeholder: 'Desk or Room Number' },
    { label: 'Membership Period', key: 'membershipPeriod', type: 'text', required: false, placeholder: 'e.g., 1 month' }
  ],
  'Quick Fix Plumbing': [
    { label: 'Service Address', key: 'serviceAddress', type: 'text', required: true, placeholder: 'Service Location' },
    { label: 'Appointment Date', key: 'appointmentDate', type: 'date', required: false }
  ],
  'PetCare Clinic': [
    { label: 'Pet Name', key: 'petName', type: 'text', required: false, placeholder: 'Pet Name' },
    { label: 'Pet Type', key: 'petType', type: 'select', required: false, options: ['Dog', 'Cat', 'Bird', 'Other'] }
  ],
  'Beauty Bliss Salon': [
    { label: 'Appointment Ref', key: 'appointmentRef', type: 'text', required: false, placeholder: 'Appointment Number' },
    { label: 'Service Type', key: 'serviceType', type: 'select', required: false, options: ['Hair', 'Skin', 'Nails', 'Makeup', 'Spa'] }
  ],
  'CodeCraft Software': [
    { label: 'Project Code', key: 'projectCode', type: 'text', required: true, placeholder: 'Project Code' },
    { label: 'Sprint/Milestone', key: 'sprint', type: 'text', required: false, placeholder: 'Sprint or Milestone' },
    { label: 'Delivery Type', key: 'deliveryType', type: 'select', required: false, options: ['MVP', 'Full Release', 'Maintenance'] }
  ],
  'HomeStyle Interiors': [
    { label: 'Project Name', key: 'projectName', type: 'text', required: true, placeholder: 'Design Project' },
    { label: 'Room/Area', key: 'roomArea', type: 'text', required: false, placeholder: 'Rooms/areas being designed' }
  ],
  'EventPro Management': [
    { label: 'Event Name', key: 'eventName', type: 'text', required: true, placeholder: 'Event Name' },
    { label: 'Event Date', key: 'eventDate', type: 'date', required: true },
    { label: 'Guest Count', key: 'guestCount', type: 'number', required: false, placeholder: 'Expected guests' }
  ],
  'FreshMart Grocery': [
    { label: 'Order Number', key: 'orderNumber', type: 'text', required: true, placeholder: 'Order Number' },
    { label: 'Delivery Mode', key: 'deliveryMode', type: 'select', required: false, options: ['Pickup', 'Home Delivery', 'Ship'] }
  ],
  'SmartLearn Online': [
    { label: 'Course Name', key: 'courseName', type: 'text', required: false, placeholder: 'Course/Program' },
    { label: 'Access Period', key: 'accessPeriod', type: 'text', required: false, placeholder: 'e.g., 6 months' }
  ],
  'GreenLeaf Organic': [
    { label: 'Order Number', key: 'orderNumber', type: 'text', required: true, placeholder: 'Order Number' },
    { label: 'Delivery Schedule', key: 'deliverySchedule', type: 'select', required: false, options: ['One-time', 'Weekly', 'Monthly'] }
  ]
}

async function updateTemplates() {
  const templates = await p.invoiceTemplate.findMany({ select: { id: true, name: true } })
  
  console.log(`Updating ${templates.length} templates with formFields...\n`)
  
  let updated = 0
  for (const t of templates) {
    const fields = formFieldsByName[t.name] || []
    if (fields.length > 0) {
      await p.invoiceTemplate.update({
        where: { id: t.id },
        data: { formFields: fields }
      })
      console.log(`  ✓ ${t.name} - ${fields.length} fields added`)
      updated++
    } else {
      console.log(`  ✗ ${t.name} - no mapping`)
    }
  }
  
  console.log(`\n✅ Done! ${updated}/${templates.length} templates updated with custom form fields.`)
  console.log('\n🎯 Now test at: http://localhost:3000/invoices/new')
  console.log('   Select a template and see dynamic custom fields!')
  
  await p.$disconnect()
}

updateTemplates().catch(e => { console.error(e); process.exit(1) })
