import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

const TEMPLATE_EXTRACTOR_URL = process.env.TEMPLATE_EXTRACTOR_URL || 'http://localhost:5003';

export async function POST(req: NextRequest) {
  // Authenticated use only: this proxies an uploaded file to the internal
  // extractor service, so gate it behind a signed-in session to stop anonymous
  // abuse of the backend.
  const session = await getServerSession(req);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Forward to Python template extractor service
    const extractFormData = new FormData();
    extractFormData.append('file', file, file.name);

    const response = await fetch(`${TEMPLATE_EXTRACTOR_URL}/api/v1/extract`, {
      method: 'POST',
      body: extractFormData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(
        { success: false, error: errorData.error || 'Template extraction failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Template extraction proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to connect to template extractor service' },
      { status: 500 }
    );
  }
}
