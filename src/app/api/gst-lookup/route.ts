import { NextRequest, NextResponse } from 'next/server';

// GST Number Validation & Company Details Fetcher
// Uses public GST API or AI-based lookup

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gstNumber } = body;

    if (!gstNumber || gstNumber.length !== 15) {
      return NextResponse.json({ error: 'Invalid GST number' }, { status: 400 });
    }

    const gst = gstNumber.toUpperCase().trim();

    // Parse GST number locally first
    const stateCode = gst.slice(0, 2);
    const pan = gst.slice(2, 12);
    const entityCode = gst.slice(12, 13);

    const STATE_CODES: Record<string, string> = {
      '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
      '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi',
      '08': 'Rajasthan', '09': 'Uttar Pradesh', '10': 'Bihar', '11': 'Sikkim',
      '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
      '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal',
      '20': 'Jharkhand', '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh',
      '24': 'Gujarat', '26': 'Dadra & Nagar Haveli', '27': 'Maharashtra',
      '28': 'Andhra Pradesh', '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep',
      '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry',
      '35': 'Andaman & Nicobar', '36': 'Telangana', '37': 'Andhra Pradesh', '38': 'Ladakh',
    };

    const PAN_ENTITY: Record<string, string> = {
      'A': 'proprietorship',
      'B': 'partnership',
      'C': 'company', // Company (Private Ltd)
      'F': 'llp',
      'G': 'government',
      'H': 'huf',
      'J': 'artificial',
      'L': 'company', // Company (Public Ltd)
      'P': 'partnership', // Partnership (Registered)
      'T': 'trust',
    };

    const stateName = STATE_CODES[stateCode] || 'Unknown';
    const entityType = PAN_ENTITY[pan.charAt(3)] || 'proprietorship';

    // Try to fetch from public GST API (if available)
    // For now, return parsed data + suggestion to use AI for more details
    const companyDetails = {
      gstNumber: gst,
      pan: pan,
      stateName: stateName,
      stateCode: stateCode,
      entityType: entityType,
      entityCode: entityCode,
      
      // These would come from a real GST API
      // For demo, we provide what we can parse
      companyName: null, // Would need GSTN API
      address: null, // Would need GSTN API
      legalName: null, // Would need GSTN API
      registrationDate: null, // Would need GSTN API
      
      // Metadata
      fetchedAt: new Date().toISOString(),
      source: 'local-parse',
      
      // Message to user
      message: 'Basic details extracted from GST number. For complete company details, a GSTN API integration is required.',
    };

    return NextResponse.json(companyDetails);
  } catch (error) {
    console.error('GST fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch GST details' }, { status: 500 });
  }
}
