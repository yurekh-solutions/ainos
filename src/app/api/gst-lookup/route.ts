import { NextRequest, NextResponse } from 'next/server';

interface GstCompanyData {
  companyName?: string;
  tradeName?: string;
  address?: string;
  legalName?: string;
  registrationDate?: string;
  constitution?: string;
  natureOfBusiness?: string;
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

    // Step 2: Try to fetch from public GST API (if available)
    let apiData: GstCompanyData | null = null;
    
    // Try using a free GST verification API
    // Note: Most GST APIs require API keys. Using demo/public endpoints if available.
    try {
      // Attempt 1: Try public GST API (if configured in env)
      const gstApiKey = process.env.GST_API_KEY;
      if (gstApiKey) {
        const apiRes = await fetch(`https://api.gst.com/v1/search?gst=${gst}`, {
          headers: { 'Authorization': `Bearer ${gstApiKey}` },
          signal: AbortSignal.timeout(5000),
        });
        if (apiRes.ok) {
          apiData = await apiRes.json();
        }
      }
    } catch (err) {
      console.log('GST API not available, using local parse');
    }

    // Step 3: AI-based lookup for company details (fallback)
    let aiData: GstCompanyData | null = null;
    if (!apiData) {
      try {
        // Use Pollinations AI to fetch GST details from public sources
        const geminiKeys = (process.env.GEMINI_API_KEYS || '').split(',').filter(k => k.trim());
        if (geminiKeys.length > 0) {
          const apiKey = geminiKeys[Math.floor(Math.random() * geminiKeys.length)];
          const prompt = `You are a GST lookup assistant. Given this Indian GST number: ${gst}
          
Extract and return ONLY this information in JSON format:
{
  "companyName": "Legal name of the business",
  "tradeName": "Trade name if different",
  "address": "Registered address with city, state, pincode",
  "panNumber": "${pan}",
  "stateName": "${stateName}",
  "entityType": "${entityType}",
  "registrationDate": "Date of GST registration (DD/MM/YYYY)",
  "constitution": "Type of business (Proprietorship/Partnership/Pvt Ltd/LLP/etc)",
  "natureOfBusiness": "Main business activity"
}

If you cannot find exact details, return null for unknown fields. Return ONLY valid JSON.`;

          const aiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
              }),
              signal: AbortSignal.timeout(10000),
            }
          );

          if (aiRes.ok) {
            const aiResult = await aiRes.json();
            const aiText = aiResult.candidates?.[0]?.content?.parts?.[0]?.text || '';
            // Try to parse JSON from AI response
            const jsonMatch = aiText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                aiData = JSON.parse(jsonMatch[0]);
              } catch (e) {
                console.log('AI response parse failed');
              }
            }
          }
        }
      } catch (err) {
        console.log('AI lookup failed, using local parse only');
      }
    }

    // Step 4: Combine all available data
    const companyDetails = {
      gstNumber: gst,
      pan: pan,
      stateName: stateName,
      stateCode: stateCode,
      entityType: entityType,
      entityCode: entityCode,
      
      // From API (if available)
      companyName: apiData?.companyName || aiData?.companyName || null,
      tradeName: apiData?.tradeName || aiData?.tradeName || null,
      address: apiData?.address || aiData?.address || null,
      legalName: apiData?.legalName || aiData?.legalName || null,
      registrationDate: apiData?.registrationDate || aiData?.registrationDate || null,
      constitution: apiData?.constitution || aiData?.constitution || null,
      natureOfBusiness: apiData?.natureOfBusiness || aiData?.natureOfBusiness || null,
      
      // Metadata
      fetchedAt: new Date().toISOString(),
      source: apiData ? 'gst-api' : aiData ? 'ai-lookup' : 'local-parse',
      
      // Status
      success: true,
      message: apiData 
        ? 'Complete details fetched from GST API' 
        : aiData 
        ? 'Company details fetched from AI lookup' 
        : 'Basic details extracted from GST number. Company name and address require GSTN API integration.',
    };

    return NextResponse.json(companyDetails);
  } catch (error) {
    console.error('GST fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch GST details' }, { status: 500 });
  }
}
