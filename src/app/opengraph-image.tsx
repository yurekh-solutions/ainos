import { ImageResponse } from 'next/og';

// Shared social preview card for every page that does not ship its own image.
export const alt = 'AINOS Business Suite — CRM, Finance, HR, Marketing & AI in One Platform';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #2e1065 0%, #5b21b6 55%, #a78bfa 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: -2 }}>AINOS</div>
        <div style={{ fontSize: 44, fontWeight: 600, marginTop: 16, maxWidth: 980, lineHeight: 1.2 }}>
          The business operating suite for Indian businesses
        </div>
        <div style={{ fontSize: 30, marginTop: 36, opacity: 0.85 }}>
          GST Invoicing · CRM · HR & Payroll · Inventory · Marketing · AI
        </div>
      </div>
    ),
    size
  );
}
