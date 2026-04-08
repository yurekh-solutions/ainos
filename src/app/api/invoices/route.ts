import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import User from '@/models/User';
import Customer from '@/models/Customer';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const user = await User.findOne({ email: session.user.email });
    if (!user?.companyId) {
      return NextResponse.json([]);
    }

    const invoices = await Invoice.find({ companyId: user.companyId })
      .sort({ createdAt: -1 });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const user = await User.findOne({ email: session.user.email });
    if (!user?.companyId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const body = await req.json();
    
    // Validate required fields
    if (!body.customerName) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }
    
    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
    }
    
    // Find or create customer
    let customer = null;
    if (body.customerEmail) {
      customer = await Customer.findOne({ 
        companyId: user.companyId,
        email: body.customerEmail 
      });
    }
    
    if (!customer) {
      customer = await Customer.create({
        companyId: user.companyId,
        name: body.customerName,
        email: body.customerEmail || null,
        createdBy: user._id.toString(),
      });
    }

    // Calculate invoice items with custom GST rate
    // Use provided GST rate (can be 0 for no tax), default to 18 only if undefined/null
    const GST_RATE = body.gstRate !== undefined && body.gstRate !== null ? body.gstRate : 18;
    const items = body.items.map((item: { productName: string; description: string; quantity: number; price: number }) => {
      const itemSubtotal = item.price * item.quantity;
      const taxAmount = GST_RATE > 0 ? (itemSubtotal * GST_RATE) / 100 : 0;
      const total = itemSubtotal + taxAmount;
      
      return {
        productId: 'manual-' + Date.now(),
        productName: item.productName || item.description || 'Item',
        description: item.description || item.productName || 'Item',
        quantity: item.quantity,
        price: item.price,
        taxRate: GST_RATE,
        taxAmount,
        total,
      };
    });

    const subtotal = items.reduce((sum: number, item: { price: number; quantity: number }) => 
      sum + (item.price * item.quantity), 0);
    const taxTotal = items.reduce((sum: number, item: { taxAmount: number }) => sum + item.taxAmount, 0);
    const totalAmount = subtotal + taxTotal;

    // Generate unique invoice number based on timestamp
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const invoiceNumber = `INV-${timestamp}-${randomSuffix}`;

    const invoice = await Invoice.create({
      companyId: user.companyId,
      customerId: customer._id.toString(),
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerAddress: body.customerAddress,
      customerGstNumber: body.customerGst,
      invoiceNumber,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      items,
      subtotal,
      taxTotal,
      totalAmount,
      taxRate: GST_RATE,
      status: 'draft',
      createdBy: user._id.toString(),
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}

