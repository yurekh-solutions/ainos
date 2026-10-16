import { prisma } from './prisma'
import { deductCredits } from './credits'

export interface ToolExecutionResult {
  success: boolean
  output?: unknown
  error?: string
  creditsUsed: number
  newBalance: number
}

interface ToolContext {
  companyId: string
  userId: string
  prisma: typeof prisma
}

type ToolHandler = (input: Record<string, unknown>, ctx: ToolContext) => Promise<unknown>

/* ---------------- shared helpers ---------------- */

async function fetchImageAsBase64(url: string): Promise<string> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return ''
    const buffer = await res.arrayBuffer()
    return 'data:image/png;base64,' + Buffer.from(buffer).toString('base64')
  } catch {
    return ''
  }
}

async function aiText(prompt: string): Promise<string> {
  const res = await fetch('https://text.pollinations.ai/' + encodeURIComponent(prompt), {
    signal: AbortSignal.timeout(60000),
  })
  if (!res.ok) throw new Error('AI provider error (status ' + res.status + ')')
  return (await res.text()).trim()
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  return [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))].join('\n')
}

/* ---------------- real handlers ---------------- */

const contentWriter: ToolHandler = async input => {
  const topic = String(input.topic || 'your business').trim()
  const details = String(input.details || '').trim()
  const prompt =
    `Write a professional, engaging blog post about: ${topic}.` +
    (details ? `\nContext: ${details}` : '') +
    `\n\nRequirements: catchy headline on the first line, 4-6 short readable paragraphs, end with one clear call to action. Plain text only, no markdown symbols.`
  const content = await aiText(prompt)
  return { content, wordCount: content.split(/\s+/).filter(Boolean).length }
}

const socialGenerator: ToolHandler = async input => {
  const topic = String(input.topic || 'your business').trim()
  const rules: Record<string, string> = {
    Twitter: 'under 260 characters, punchy and direct',
    LinkedIn: 'professional tone, 3-5 short paragraphs, strong hook on the first line',
    Instagram: 'casual and friendly, use emojis, end with exactly 5 relevant hashtags',
    Facebook: 'warm community tone, 1-2 emojis, ask a question at the end to drive comments',
  }
  const posts = await Promise.all(
    Object.entries(rules).map(async ([platform, rule]) => {
      const content = await aiText(
        `Write ONE ${platform} post about: ${topic}. Rule: ${rule}. Return ONLY the post text, nothing else.`
      )
      return { platform, content }
    })
  )
  return { topic, posts }
}

const leadScoring: ToolHandler = async (input, ctx) => {
  const leadId = input.leadId ? String(input.leadId) : undefined
  const leads = await ctx.prisma.lead.findMany({
    where: { companyId: ctx.companyId, ...(leadId ? { id: leadId } : {}) },
  })
  if (!leads.length) {
    return { message: 'No leads found yet. Add leads in the CRM first, then run scoring.', scored: 0 }
  }
  const SOURCE: Record<string, number> = {
    referral: 30, website: 25, organic: 20, social: 15, walkin: 12, manual: 10, cold: 5,
  }
  const STATUS: Record<string, number> = {
    new: 5, contacted: 10, qualified: 20, negotiation: 25, won: 30, lost: 0,
  }
  const scoreOf = (l: (typeof leads)[number]) => {
    let s = SOURCE[l.source?.toLowerCase()] ?? 10
    s += STATUS[l.status?.toLowerCase()] ?? 5
    if (l.email) s += 10
    if (l.phone) s += 10
    const age = Date.now() - new Date(l.createdAt).getTime()
    if (age <= 7 * 86400000) s += 20
    else if (age <= 30 * 86400000) s += 10
    return Math.min(100, s)
  }
  const results = []
  for (const l of leads) {
    const score = scoreOf(l)
    await ctx.prisma.lead.update({ where: { id: l.id }, data: { score } })
    results.push({
      id: l.id,
      name: l.name,
      company: l.company || '',
      score,
      priority: score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low',
    })
  }
  results.sort((a, b) => b.score - a.score)
  return { scored: results.length, leads: results }
}

const invoiceGenerator: ToolHandler = async (input, ctx) => {
  const customerName = String(input.customerName || '').trim()
  if (!customerName) throw new Error('Customer name is required')

  const rawItems = Array.isArray(input.items) ? (input.items as Record<string, unknown>[]) : []
  const items = rawItems
    .map(it => ({
      description: String(it.description || 'Item').trim(),
      quantity: Math.max(1, Number(it.quantity) || 1),
      price: Math.max(0, Number(it.price) || 0),
    }))
    .filter(it => it.description && it.price > 0)
  if (!items.length) throw new Error('Add at least one item with a description and price')

  const taxRate = Math.max(0, Number(input.taxRate ?? 18))
  const subtotal = items.reduce((sum, it) => sum + it.quantity * it.price, 0)
  const tax = +(subtotal * (taxRate / 100)).toFixed(2)
  const total = +(subtotal + tax).toFixed(2)

  const year = new Date().getFullYear()
  let seq = (await ctx.prisma.invoice.count()) + 1
  let invoiceNumber = `AIN-${String(seq).padStart(4, '0')}-${year}`
  while (await ctx.prisma.invoice.findUnique({ where: { invoiceNumber } })) {
    seq++
    invoiceNumber = `AIN-${String(seq).padStart(4, '0')}-${year}`
  }

  const invoice = await ctx.prisma.invoice.create({
    data: {
      invoiceNumber,
      customerName,
      customerEmail: input.customerEmail ? String(input.customerEmail) : null,
      items: JSON.parse(JSON.stringify(items)),
      subtotal,
      tax,
      taxRate,
      taxTotal: tax,
      total,
      totalAmount: total,
      cgstAmount: +(tax / 2).toFixed(2),
      sgstAmount: +(tax / 2).toFixed(2),
      igstAmount: 0,
      status: 'draft',
      invoiceDate: new Date(),
      companyId: ctx.companyId,
      createdBy: ctx.userId,
    },
  })

  return {
    invoiceId: invoice.id,
    invoiceNumber,
    customerName,
    subtotal,
    tax,
    total,
    status: 'draft',
    viewUrl: '/invoices',
  }
}

const emailCampaign: ToolHandler = async (input, ctx) => {
  const subject = String(input.subject || input.topic || '').trim()
  const body = String(input.body || input.details || '').trim()
  if (!subject) throw new Error('Subject is required')
  if (!body) throw new Error('Message is required')
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('Email service is not configured')

  const customers = await ctx.prisma.customer.findMany({
    where: { companyId: ctx.companyId, email: { not: null } },
  })
  const recipients = customers.filter(c => c.email && /\S+@\S+\.\S+/.test(c.email))
  if (!recipients.length) {
    return {
      message: 'No customers with a valid email address found. Add customer emails first.',
      sent: 0,
      failed: 0,
    }
  }

  const from = process.env.RESEND_FROM || 'AINOS <onboarding@resend.dev>'
  const html =
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">` +
    `<h2 style="color:#111827">${escapeHtml(subject)}</h2>` +
    `<p style="white-space:pre-wrap;line-height:1.6;color:#374151">${escapeHtml(body)}</p>` +
    `<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />` +
    `<p style="font-size:12px;color:#9ca3af">Sent via AINOS Business Suite</p></div>`

  const campaign = await ctx.prisma.emailCampaign.create({
    data: {
      name: subject.slice(0, 80),
      subject,
      content: body,
      recipients: JSON.parse(JSON.stringify(recipients.map(r => r.email))),
      status: 'sending',
      companyId: ctx.companyId,
    },
  })

  let sent = 0
  let failed = 0
  const failures: string[] = []
  let domainHint = false

  await Promise.all(
    recipients.map(async r => {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from, to: [r.email], subject, html }),
          signal: AbortSignal.timeout(15000),
        })
        if (res.ok) {
          sent++
        } else {
          failed++
          if (res.status === 403) domainHint = true
          failures.push(`${r.email} (HTTP ${res.status})`)
        }
      } catch {
        failed++
        failures.push(`${r.email} (network error)`)
      }
    })
  )

  await ctx.prisma.emailCampaign.update({
    where: { id: campaign.id },
    data: {
      status: sent > 0 ? 'sent' : 'failed',
      sentCount: sent,
      sentAt: sent > 0 ? new Date() : null,
    },
  })

  return {
    campaignId: campaign.id,
    total: recipients.length,
    sent,
    failed,
    failures: failures.slice(0, 5),
    ...(domainHint
      ? {
          hint: 'Some emails were rejected (403). Verify your own sending domain at resend.com/domains — until then Resend only delivers to the account owner email.',
        }
      : {}),
  }
}

const dataExport: ToolHandler = async (input, ctx) => {
  const dataset = String(input.dataset || 'customers')
  const format = String(input.format || 'csv').toLowerCase()

  let rows: Record<string, unknown>[] = []
  let filename = 'export'

  if (dataset === 'customers') {
    filename = 'customers'
    rows = (await ctx.prisma.customer.findMany({ where: { companyId: ctx.companyId }, orderBy: { createdAt: 'desc' } })).map(c => ({
      Name: c.name, Email: c.email, Phone: c.phone, Company: c.company,
      GST: c.gstNumber, State: c.state, Status: c.status,
      Created: c.createdAt ? new Date(c.createdAt).toISOString().slice(0, 10) : '',
    }))
  } else if (dataset === 'leads') {
    filename = 'leads'
    rows = (await ctx.prisma.lead.findMany({ where: { companyId: ctx.companyId }, orderBy: { createdAt: 'desc' } })).map(l => ({
      Name: l.name, Email: l.email, Phone: l.phone, Company: l.company,
      Source: l.source, Status: l.status, Score: l.score,
      Created: l.createdAt ? new Date(l.createdAt).toISOString().slice(0, 10) : '',
    }))
  } else if (dataset === 'invoices') {
    filename = 'invoices'
    rows = (await ctx.prisma.invoice.findMany({ where: { companyId: ctx.companyId }, orderBy: { createdAt: 'desc' } })).map(i => ({
      Number: i.invoiceNumber, Customer: i.customerName, Subtotal: i.subtotal,
      Tax: i.tax, Total: i.total ?? i.totalAmount, Status: i.status,
      Date: i.invoiceDate ? new Date(i.invoiceDate).toISOString().slice(0, 10) : '',
    }))
  } else {
    throw new Error('Unknown dataset. Use customers, leads or invoices.')
  }

  if (!rows.length) {
    return { dataset, recordCount: 0, message: 'No records found for this dataset yet.' }
  }

  const stamp = new Date().toISOString().slice(0, 10)
  if (format === 'json') {
    return {
      dataset,
      recordCount: rows.length,
      filename: `${filename}-${stamp}.json`,
      content: JSON.stringify(rows, null, 2),
      mime: 'application/json',
    }
  }
  return {
    dataset,
    recordCount: rows.length,
    filename: `${filename}-${stamp}.csv`,
    content: toCsv(rows),
    mime: 'text/csv',
  }
}

const invoiceExtractor: ToolHandler = async (input, ctx) => {
  const fileUrl = String(input.fileUrl || '').trim()
  const base64 = String(input.base64 || '').trim()

  if (!fileUrl && !base64) {
    throw new Error('Provide either fileUrl or base64 of the invoice image/PDF')
  }

  let extractedText = ''
  let extractionMethod = 'unknown'

  // ── MULTI-ENGINE EXTRACTION SYSTEM ──
  // Try multiple methods in order of reliability
  
  // METHOD 1: Gemini AI Vision (reads images directly, no OCR needed)
  try {
    const geminiKeys = (process.env.GEMINI_API_KEYS || '').split(',').filter(k => k.trim())
    if (geminiKeys.length > 0) {
      const apiKey = geminiKeys[Math.floor(Math.random() * geminiKeys.length)]
      const imageData = base64 || (fileUrl ? await fetchImageAsBase64(fileUrl) : '')
      
      if (imageData) {
        const visionRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: 'Extract all text from this invoice image. Return ONLY the raw text, no analysis.' },
                  { inline_data: { mime_type: 'image/png', data: imageData.replace(/^data:image\/\w+;base64,/, '') } }
                ]
              }]
            }),
            signal: AbortSignal.timeout(30000),
          }
        )
        
        if (visionRes.ok) {
          const visionData = await visionRes.json()
          extractedText = visionData.candidates?.[0]?.content?.parts?.[0]?.text || ''
          if (extractedText) {
            extractionMethod = 'gemini-vision'
          }
        }
      }
    }
  } catch (err) {
    // Gemini failed, continue to next method
    console.log('Gemini Vision failed, trying OCR:', err instanceof Error ? err.message : String(err))
  }

  // METHOD 2: OCR.space (fallback if Gemini fails)
  if (!extractedText) {
    try {
      const ocrApiKey = process.env.OCR_SPACE_API_KEY || 'helloworld'
      const formData = new URLSearchParams()
      formData.append('apikey', ocrApiKey)
      formData.append('language', 'eng')
      formData.append('isOverlayRequired', 'false')
      formData.append('OCREngine', '2')

      if (base64) {
        formData.append('base64Image', base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`)
      } else {
        formData.append('url', fileUrl)
      }

      const ocrRes = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
        signal: AbortSignal.timeout(30000),
      })

      if (ocrRes.ok) {
        const ocrData = await ocrRes.json() as { ParsedResults?: { ParsedText?: string }[]; ErrorMessage?: string }
        if (ocrData.ErrorMessage) throw new Error('OCR error: ' + ocrData.ErrorMessage)
        extractedText = ocrData.ParsedResults?.[0]?.ParsedText || ''
        if (extractedText) {
          extractionMethod = 'ocr-space'
        }
      }
    } catch (err) {
      console.log('OCR.space failed:', err instanceof Error ? err.message : String(err))
    }
  }

  // If both methods failed
  if (!extractedText) {
    throw new Error('All extraction methods failed. Please try a clearer image or PDF.')
  }

  // Step 2: Structure with AI — extract TEMPLATE DESIGN (not invoice data)
  const prompt = `Analyze this invoice OCR text and extract the TEMPLATE DESIGN structure as JSON. Return ONLY valid JSON, no markdown.
Extract:
- company header text (name, tagline)
- address block text
- color scheme (identify from text like "green", "blue", "red" or infer from company style)
- layout structure (table columns, sections, alignment)
- font style
- terms/conditions text
- signature block text
- table columns present
- form fields needed (identify ALL input fields from the invoice: PO Number, Validity Date, Payment Terms, Document Type, Reference Number, etc.)

Return this JSON structure:
{
  "companyName": "header company name",
  "tagline": "tagline or subtitle",
  "headerText": "full header block text",
  "addressBlock": "office address text",
  "colorScheme": "green|blue|red|black|purple|orange",
  "primaryColor": "#228B22|#1e40af|#dc2626|#000000|#7c3aed|#ea580c",
  "fontFamily": "helvetica|times|courier",
  "layout": "bordered-table|minimal|classic",
  "tableColumns": ["Sr.No", "Description", "Qty", "Rate", "Amount"],
  "hasConsignee": true,
  "hasTerms": true,
  "termsText": "1. Payment by cheque\n2. Not responsible...",
  "signatureText": "For COMPANY\n(Owner Name)",
  "hasLogo": false,
  "sections": ["header", "address", "consignee", "invoice-meta", "items-table", "totals", "terms", "signature"],
  "formFields": [
    {"label": "PO Number", "key": "poNumber", "type": "text", "required": false, "placeholder": "Purchase Order Number"},
    {"label": "Validity Date", "key": "validityDate", "type": "date", "required": false},
    {"label": "Payment Terms", "key": "paymentTerms", "type": "select", "required": false, "options": ["Net 30", "Net 60", "Due on Receipt"]},
    {"label": "Document Type", "key": "documentType", "type": "select", "required": false, "options": ["Invoice", "Proforma Invoice", "Quotation"]}
  ]
}

OCR Text:
${extractedText.slice(0, 3000)}`

  const aiResponse = await aiText(prompt)

  // Parse JSON from AI response
  let extracted: Record<string, unknown> = {}
  try {
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      extracted = JSON.parse(jsonMatch[0])
    }
  } catch {
    throw new Error('AI failed to analyze template design')
  }

  return {
    success: true,
    extractedText: extractedText.slice(0, 500),
    extractionMethod,
    extracted,
    message: `Template design analyzed using ${extractionMethod}. Review and save as your invoice template.`,
  }
}

/* ---------------- registry ---------------- */

const HANDLERS: Record<string, ToolHandler> = {
  'ai-content-writer': contentWriter,
  'social-media-generator': socialGenerator,
  'lead-scoring-ai': leadScoring,
  'invoice-generator': invoiceGenerator,
  'invoice-extractor': invoiceExtractor,
  'email-campaign-sender': emailCampaign,
  'data-export': dataExport,
}

export async function executeTool(
  companyId: string,
  userId: string,
  toolSlug: string,
  input: Record<string, unknown>
): Promise<ToolExecutionResult> {
  // Find the tool
  const tool = await prisma.tool.findUnique({ where: { slug: toolSlug } })
  if (!tool || !tool.isActive) {
    return { success: false, error: 'Tool not found or inactive', creditsUsed: 0, newBalance: 0 }
  }

  // Check credits
  const currentBalance = await prisma.creditBalance.findUnique({ where: { companyId } })
  if (!currentBalance || currentBalance.balance < tool.creditCost) {
    return {
      success: false,
      error: 'Insufficient credits',
      creditsUsed: 0,
      newBalance: currentBalance?.balance ?? 0
    }
  }

  // Execute: typed registry first, DB handlerCode as fallback
  let output: unknown
  try {
    const registered = HANDLERS[tool.slug]
    if (registered) {
      output = await registered(input, { companyId, userId, prisma })
    } else {
      return {
        success: false,
        error: 'No handler implemented for this tool yet',
        creditsUsed: 0,
        newBalance: currentBalance.balance
      }
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Tool execution failed'
    return { success: false, error: errorMessage, creditsUsed: 0, newBalance: currentBalance.balance }
  }

  // Deduct credits
  const result = await deductCredits(companyId, tool.creditCost, `Tool: ${tool.name}`)
  if (!result.success) {
    return { success: false, error: result.error, creditsUsed: 0, newBalance: result.balance }
  }

  // Log the tool run
  await prisma.toolRun.create({
    data: {
      tool: tool.slug,
      toolName: tool.name,
      input: JSON.parse(JSON.stringify(input)),
      inputs: JSON.parse(JSON.stringify(input)),
      output: JSON.parse(JSON.stringify(output)),
      status: 'completed',
      userId,
      createdBy: userId,
      companyId
    }
  })

  return {
    success: true,
    output,
    creditsUsed: tool.creditCost,
    newBalance: result.balance
  }
}

export async function getAllTools() {
  return prisma.tool.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  })
}

export async function getToolBySlug(slug: string) {
  return prisma.tool.findUnique({ where: { slug } })
}

export async function getToolsByCategory(category: string) {
  return prisma.tool.findMany({
    where: { isActive: true, category },
    orderBy: { name: 'asc' }
  })
}
