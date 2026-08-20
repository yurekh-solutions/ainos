import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { message, sessionId } = await req.json();
    const userId = session.user.id || session.user.email;

    // Get user's company for data isolation
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    const companyId = user?.companyId;

    // Gather business data for context
    const companyIdFilter = companyId ? { companyId } : {};
    const userFilter = companyId ? {} : { createdBy: userId };
    const [invoices, contacts, deals, employees, stockItems] = await Promise.all([
      prisma.invoice.findMany({ where: { ...companyIdFilter, ...userFilter } }),
      prisma.contact.findMany({ where: { ...companyIdFilter, ...userFilter } }),
      prisma.deal.findMany({ where: { ...companyIdFilter, ...userFilter } }),
      prisma.employee.findMany({ where: { ...companyIdFilter, ...userFilter } }),
      prisma.stockItem.findMany({ where: { ...companyIdFilter, ...userFilter } }),
    ]);

    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.totalAmount || 0), 0);
    const pendingInvoices = invoices.filter(i => i.status === 'pending');
    const overdueInvoices = invoices.filter(i => i.status === 'overdue');
    const activeDeals = deals.filter(d => !['won', 'lost'].includes(d.stage));
    const lowStock = stockItems.filter(i => i.quantity <= i.reorderLevel);
    const activeEmployees = employees.filter(e => e.status === 'active');

    // Simple keyword-based response generation
    const msg = message.toLowerCase();
    let response = '';

    if (msg.includes('revenue') || msg.includes('income') || msg.includes('earn')) {
      response = `Your total revenue is Rs.${totalRevenue.toLocaleString('en-IN')} from ${invoices.filter(i => i.status === 'paid').length} paid invoices.`;
    } else if (msg.includes('pending') && msg.includes('invoice')) {
      response = `You have ${pendingInvoices.length} pending invoices worth Rs.${pendingInvoices.reduce((s, i) => s + (i.totalAmount || 0), 0).toLocaleString('en-IN')}.`;
    } else if (msg.includes('overdue')) {
      response = `You have ${overdueInvoices.length} overdue invoices worth Rs.${overdueInvoices.reduce((s, i) => s + (i.totalAmount || 0), 0).toLocaleString('en-IN')}. Consider sending payment reminders.`;
    } else if (msg.includes('deal') || msg.includes('pipeline')) {
      response = `You have ${activeDeals.length} active deals in the pipeline worth Rs.${activeDeals.reduce((s, d) => s + (d.value || 0), 0).toLocaleString('en-IN')}.`;
    } else if (msg.includes('stock') || msg.includes('inventory') || msg.includes('low')) {
      response = lowStock.length ? `${lowStock.length} items are running low on stock. Consider reordering soon.` : 'All stock items are above reorder levels.';
    } else if (msg.includes('employee') || msg.includes('team') || msg.includes('staff')) {
      response = `You have ${activeEmployees.length} active employees across ${new Set(activeEmployees.map(e => e.department)).size} departments.`;
    } else if (msg.includes('contact') || msg.includes('lead') || msg.includes('customer')) {
      response = `You have ${contacts.length} contacts in your CRM. ${contacts.filter(c => c.stage === 'lead').length} are new leads.`;
    } else if (msg.includes('help') || msg.includes('what can')) {
      response = 'I can help you with: revenue summary, pending invoices, overdue payments, deal pipeline, stock levels, team info, and contact management. Just ask!';
    } else {
      response = `I understand you're asking about "${message}". Here's a quick overview: Revenue: Rs.${totalRevenue.toLocaleString('en-IN')}, Active Deals: ${activeDeals.length}, Team: ${activeEmployees.length} employees, Low Stock Items: ${lowStock.length}. Ask me about any specific area!`;
    }

    // Save or update session
    let chatSession = sessionId ? await prisma.aIChatSession.findUnique({ where: { id: sessionId } }) : null;
    if (!chatSession) {
      chatSession = await prisma.aIChatSession.create({
        data: {
          userId,
          messages: [],
          context: ['invoices', 'crm', 'hr', 'inventory'],
        },
      });
    }
    const existingMessages = (chatSession.messages as Array<Record<string, unknown>>) || [];
    const updatedMessages = [
      ...existingMessages,
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: response, timestamp: new Date().toISOString() },
    ];
    await prisma.aIChatSession.update({
      where: { id: chatSession.id },
      data: { messages: updatedMessages as any },
    });

    return NextResponse.json({ response, sessionId: chatSession.id });
  } catch (error) {
    console.error('Error in AI chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
