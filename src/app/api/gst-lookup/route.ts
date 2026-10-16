import { NextRequest, NextResponse } from 'next/server';

interface GstCompanyData {
  companyName?: string;
  tradeName?: string;
  address?: string;
  legalName?: string;
  registrationDate?: string;
  constitution?: string;
  natureOfBusiness?: string;
  email?: string;
  phone?: string;
}

// GST Number Validation & Company Details Fetcher
// Uses multiple methods: Local parse → Public API → AI fallback

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gstNumber } = body;

    if (!gstNumber || gstNumber.length !== 15) {
      return NextResponse.json({ error: 'Invalid GST number' }, { status: 400 });
    }

    const gst = gstNumber.toUpperCase().trim();

    // Step 1: Parse GST number locally
    const stateCode = gst.slice(0, 2);
    const pan = gst.slice(2, 12);
    const entityCode = gst.slice(12, 13);
    const checkDigit = gst.slice(14, 15);

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
      'C': 'pvt_ltd',
      'F': 'llp',
      'G': 'government',
      'H': 'huf',
      'J': 'artificial',
      'L': 'public_ltd',
      'P': 'partnership',
      'T': 'trust',
    };

    const stateName = STATE_CODES[stateCode] || 'Unknown';
    const entityType = PAN_ENTITY[pan.charAt(3)] || 'proprietorship';

    // Step 2: Try real GST APIs (appyflow.in has 50 free requests)
    let apiData: GstCompanyData | null = null;
    
    // Attempt 1: Appyflow.in (50 free requests, no monthly charges)
    try {
      const appyflowKey = process.env.APPYFLOW_KEY;
      if (appyflowKey) {
        const apiRes = await fetch(`https://appyflow.in/api/verifyGST?gstNo=${gst}&key_secret=${appyflowKey}`, {
          signal: AbortSignal.timeout(8000),
        });
        if (apiRes.ok) {
          const result = await apiRes.json();
          if (result?.taxpayerInfo && !result?.error) {
            const info = result.taxpayerInfo;
            const addr = info.pradr?.addr;
            apiData = {
              companyName: info.lgnm || null,
              tradeName: info.tradeNam || null,
              address: addr ? `${addr.bno || ''} ${addr.st || ''}, ${addr.loc || ''}, ${addr.city || addr.dst || ''}, ${addr.stcd || ''} - ${addr.pncd || ''}`.replace(/,\s*,/g, ',').trim() : null,
              legalName: info.lgnm || null,
              registrationDate: info.rgdt || null,
              constitution: info.ctb || info.ctj || null,
              natureOfBusiness: Array.isArray(info.nba) ? info.nba.join(', ') : (info.nba || null),
              email: null, // Appyflow doesn't return email
              phone: null, // Appyflow doesn't return phone
            };
          }
        } else {
          console.log('appyflow.in returned:', apiRes.status);
        }
      }
    } catch (err) {
      console.log('appyflow.in failed');
    }
    
    // Attempt 2: gstinapi.in (if appyflow didn't work)
    if (!apiData) {
      try {
        const gstinApiKey = process.env.GSTINAPI_KEY;
        if (gstinApiKey) {
          const apiRes = await fetch(`https://gstinapi.in/v1/gstin/${gst}`, {
            headers: { 'x-api-key': gstinApiKey },
            signal: AbortSignal.timeout(8000),
          });
          if (apiRes.ok) {
            const result = await apiRes.json();
            if (result?.data && result?.success) {
              const data = result.data;
              const addrDetails = data.address_details;
              const fullAddress = addrDetails
                ? `${addrDetails.building_number || ''}, ${addrDetails.street || ''}, ${addrDetails.locality || ''}, ${data.city || ''} - ${addrDetails.pincode || data.pincode || ''}`.replace(/,\s*,/g, ',').trim()
                : data.address || null;
              apiData = {
                companyName: data.legal_name || data.companyName || null,
                tradeName: data.trade_name || data.tradeName || null,
                address: fullAddress,
                legalName: data.legal_name || null,
                registrationDate: data.registration_date || null,
                constitution: data.business_constitution || null,
                natureOfBusiness: data.nature_of_business || null,
                email: data.email || null,
                phone: data.phone || null,
              };
            }
          }
        }
      } catch (err) {
        console.log('gstinapi.in failed');
      }
    }

    // Step 3: Return real API data only (no mock data)
    const companyDetails = {
      gstNumber: gst,
      pan: pan,
      stateName: stateName,
      stateCode: stateCode,
      entityType: entityType,
      entityCode: entityCode,
      
      // Only real API data
      companyName: apiData?.companyName || null,
      tradeName: apiData?.tradeName || null,
      address: apiData?.address || null,
      legalName: apiData?.legalName || null,
      registrationDate: apiData?.registrationDate || null,
      constitution: apiData?.constitution || null,
      natureOfBusiness: apiData?.natureOfBusiness || null,
      email: apiData?.email || null,
      phone: apiData?.phone || null,
      
      // Metadata
      fetchedAt: new Date().toISOString(),
      source: apiData ? 'gst-api' : 'local-parse-only',
      
      // Status
      success: true,
      message: apiData 
        ? 'Complete details fetched from GST API' 
        : 'Only basic GST structure parsed. Company details require valid GST number and API credits.',
    };

    return NextResponse.json(companyDetails);
  } catch (error) {
    console.error('GST fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch GST details' }, { status: 500 });
  }
}
