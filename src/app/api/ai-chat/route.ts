import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Build business context for AI
function buildContext(data: {
  invoices: any[]; contacts: any[]; deals: any[];
  employees: any[]; stockItems: any[]; expenses: any[];
  leads: any[]; quotes: any[];
}) {
  const { invoices, contacts, deals, employees, stockItems, expenses, leads, quotes } = data;
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.totalAmount || 0), 0);
  const pendingInvoices = invoices.filter(i => i.status === 'pending');
  const overdueInvoices = invoices.filter(i => i.status === 'overdue');
  const activeDeals = deals.filter(d => !['won', 'lost'].includes(d.stage));
  const lowStock = stockItems.filter(i => i.quantity <= (i.reorderLevel || 10));
  const activeEmployees = employees.filter(e => e.status === 'active');
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const newLeads = leads.filter(l => l.stage === 'new').length;

  return `You are AINOS AI Assistant, a business management AI. Here is the user's current business data:
- Revenue: Rs.${totalRevenue.toLocaleString('en-IN')} from ${invoices.filter(i => i.status === 'paid').length} paid invoices
- Pending invoices: ${pendingInvoices.length} worth Rs.${pendingInvoices.reduce((s, i) => s + (i.totalAmount || 0), 0).toLocaleString('en-IN')}
- Overdue invoices: ${overdueInvoices.length} worth Rs.${overdueInvoices.reduce((s, i) => s + (i.totalAmount || 0), 0).toLocaleString('en-IN')}
- Active deals: ${activeDeals.length} worth Rs.${activeDeals.reduce((s, d) => s + (d.value || 0), 0).toLocaleString('en-IN')}
- Total expenses: Rs.${totalExpenses.toLocaleString('en-IN')}
- Employees: ${activeEmployees.length} active across ${new Set(activeEmployees.map(e => e.department || 'General')).size} departments
- Low stock items: ${lowStock.length} items need reordering
- CRM contacts: ${contacts.length} total, ${newLeads} new leads
- Quotes: ${quotes.length} total
Answer business questions using this data. Be concise, professional, and helpful. Use Rs. for currency. If asked about something not in the data, give general business advice.`;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.user.id || session.user.email;

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    const companyId = user?.companyId;

    const sessions = await prisma.aIChatSession.findMany({
      where: companyId ? { companyId } : { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { message, sessionId } = await req.json();
    const userId = session.user.id || session.user.email;

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    const companyId = user?.companyId;

    const companyIdFilter = companyId ? { companyId } : {};
    const userFilter = companyId ? {} : { createdBy: userId };
    const [invoices, contacts, deals, employees, stockItems, expenses, leads, quotes] = await Promise.all([
      prisma.invoice.findMany({ where: { ...companyIdFilter, ...userFilter } }),
      prisma.contact.findMany({ where: { ...companyIdFilter, ...userFilter } }),
      prisma.deal.findMany({ where: { ...companyIdFilter, ...userFilter } }),
      prisma.employee.findMany({ where: { ...companyIdFilter, ...userFilter } }),
      prisma.stockItem.findMany({ where: { ...companyIdFilter, ...userFilter } }),
      prisma.expense.findMany({ where: { ...companyIdFilter, ...userFilter } }),
      prisma.lead.findMany({ where: { ...companyIdFilter, ...userFilter } }),
      prisma.quote.findMany({ where: { ...companyIdFilter, ...userFilter } }),
    ]);

    const context = buildContext({ invoices, contacts, deals, employees, stockItems, expenses, leads, quotes });

    // Call Pollinations.ai (free, no API key)
    const pollinationsRes = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai',
        messages: [
          { role: 'system', content: context },
          { role: 'user', content: message },
        ],
      }),
    });

    let response: string;
    if (pollinationsRes.ok) {
      response = await pollinationsRes.text();
    } else {
      // Fallback to keyword-based response
      const msg = message.toLowerCase();
      const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.totalAmount || 0), 0);
      const pendingInvoices = invoices.filter(i => i.status === 'pending');
      const activeDeals = deals.filter(d => !['won', 'lost'].includes(d.stage));
      const lowStock = stockItems.filter(i => i.quantity <= (i.reorderLevel || 10));
      const activeEmployees = employees.filter(e => e.status === 'active');

      if (msg.includes('revenue') || msg.includes('income')) {
        response = `Your total revenue is Rs.${totalRevenue.toLocaleString('en-IN')} from ${invoices.filter(i => i.status === 'paid').length} paid invoices.`;
      } else if (msg.includes('pending') && msg.includes('invoice')) {
        response = `You have ${pendingInvoices.length} pending invoices worth Rs.${pendingInvoices.reduce((s, i) => s + (i.totalAmount || 0), 0).toLocaleString('en-IN')}.`;
      } else if (msg.includes('deal') || msg.includes('pipeline')) {
        response = `You have ${activeDeals.length} active deals worth Rs.${activeDeals.reduce((s, d) => s + (d.value || 0), 0).toLocaleString('en-IN')}.`;
      } else if (msg.includes('stock') || msg.includes('inventory')) {
        response = lowStock.length ? `${lowStock.length} items are running low on stock.` : 'All stock items are above reorder levels.';
      } else if (msg.includes('employee') || msg.includes('team')) {
        response = `You have ${activeEmployees.length} active employees.`;
      } else {
        response = `Revenue: Rs.${totalRevenue.toLocaleString('en-IN')}, Active Deals: ${activeDeals.length}, Team: ${activeEmployees.length} employees, Low Stock: ${lowStock.length} items.`;
      }
    }

    // Save chat session
    let chatSession = sessionId ? await prisma.aIChatSession.findUnique({ where: { id: sessionId } }) : null;
    if (!chatSession) {
      chatSession = await prisma.aIChatSession.create({
        data: { userId, messages: [], context: ['invoices', 'crm', 'hr', 'inventory'] },
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
