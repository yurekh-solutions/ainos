import { prisma } from './prisma'
import { deductCredits } from './credits'
import { runTool as runAiTool, type ToolId } from './ai-tools'

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

async function aiText(prompt: string, attempt = 0): Promise<string> {
  const res = await fetch('https://text.pollinations.ai/' + encodeURIComponent(prompt), {
    signal: AbortSignal.timeout(60000),
  })
  if (!res.ok) {
    // The public text endpoint rejects bursts with 402/429; one paced retry clears it.
    if ((res.status === 402 || res.status === 429) && attempt < 2) {
      await new Promise(resolve => setTimeout(resolve, 1500 * (attempt + 1)))
      return aiText(prompt, attempt + 1)
    }
    throw new Error('AI provider error (status ' + res.status + ')')
  }
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

// The text provider sometimes wraps HTML in markdown fences or adds chatter
// before/after the document — keep only the real document body.
function cleanGeneratedHtml(raw: string): string {
  let html = raw.replace(/```[a-zA-Z]*\s*/g, '').trim()
  const doctype = html.search(/<!DOCTYPE\s+html/i)
  const htmlTag = html.search(/<html[\s>]/i)
  const start = doctype >= 0 ? doctype : htmlTag
  if (start > 0) html = html.slice(start)
  const end = html.toLowerCase().lastIndexOf('</html>')
  if (end >= 0) html = html.slice(0, end + '</html>'.length)
  return html.trim()
}

/* ---------------- AI Studio adapters ---------------- */

// The AI Studio engines in ai-tools.ts already produce the finished deliverable;
// this adapter only normalises the tool-runner input into their flat string map.
const aiToolAdapter = (toolId: ToolId): ToolHandler => async input => {
  const inputs: Record<string, string> = {}
  for (const [k, v] of Object.entries(input)) {
    inputs[k] = String(v ?? '')
  }
  return runAiTool(toolId, inputs)
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
  const posts: { platform: string; content: string }[] = []
  const failed: { platform: string; error: string }[] = []
  // The text provider rejects concurrent bursts, so the calls are paced one at a
  // time. A platform that still fails is reported instead of sinking the batch.
  for (const [platform, rule] of Object.entries(rules)) {
    try {
      const content = await aiText(
        `Write ONE ${platform} post about: ${topic}. Rule: ${rule}. Return ONLY the post text, nothing else.`
      )
      posts.push({ platform, content })
    } catch (err) {
      failed.push({ platform, error: err instanceof Error ? err.message : 'generation failed' })
    }
  }
  if (!posts.length) throw new Error(failed[0]?.error || 'Post generation failed')
  return { topic, posts, ...(failed.length ? { failed } : {}) }
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

/* ---------------- business suite handlers ---------------- */

const autoBlog: ToolHandler = async input => {
  const topic = String(input.topic || '').trim()
  if (!topic) throw new Error('Topic is required')
  const tone = String(input.tone || 'professional').trim()
  const targetAudience = String(input.targetAudience || 'small business owners').trim()

  const raw = await aiText(
    `You are a senior content strategist writing for a business blog.\n` +
      `Topic: ${topic}\nTone: ${tone}\nTarget audience: ${targetAudience}\n\n` +
      `Return ONLY valid JSON, no markdown fences:\n` +
      `{"title":"headline under 62 characters","body":"700-900 word article in plain text, paragraphs separated by one blank line, section headings on their own line ending with a colon, no markdown symbols","metaDescription":"search description under 155 characters"}`
  )

  let parsed: { title?: string; body?: string; metaDescription?: string } = {}
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      parsed = JSON.parse(jsonMatch[0]) as typeof parsed
    } catch {
      // provider returned prose — the salvage path below recovers the article
    }
  }

  let title = String(parsed.title || '').trim()
  let body = String(parsed.body || '').trim()
  let metaDescription = String(parsed.metaDescription || '').trim()

  if (!body) {
    const lines = raw
      .replace(/```[a-zA-Z]*/g, '')
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
    if (!title && lines.length) {
      title = lines[0].replace(/^#+\s*/, '').replace(/^title\s*[:\-]\s*/i, '').slice(0, 90)
    }
    const rest = title && lines[0]?.includes(title.slice(0, 40)) ? lines.slice(1) : lines
    body = rest.join('\n\n')
  }

  if (!body) throw new Error('The AI did not return a usable article. Try a more specific topic.')
  if (!title) title = topic.charAt(0).toUpperCase() + topic.slice(1)
  if (!metaDescription) {
    const flat = body.replace(/\s+/g, ' ').trim()
    metaDescription = flat.length > 155 ? flat.slice(0, 152).replace(/[ ,;:.\-]+$/, '') + '…' : flat
  }

  return {
    title,
    body,
    metaDescription,
    wordCount: body.split(/\s+/).filter(Boolean).length,
  }
}

const aiAssistant: ToolHandler = async input => {
  const question = String(input.question || '').trim()
  if (!question) throw new Error('A question is required')
  const context = String(input.context || '').trim()

  const answer = await aiText(
    `You are AINOS, a sharp operations assistant for a growing business.\n` +
      (context ? `Business context: ${context}\n` : '') +
      `Answer practically, in under 220 words. Use short paragraphs or numbered steps where it helps. No markdown symbols.\n\nQuestion: ${question}`
  )
  if (!answer) throw new Error('The assistant returned an empty answer. Please try again.')

  return { question, answer }
}

// Deterministic fallback used when the model returns something that is not a
// complete document — guarantees a usable, responsive single-page site.
function buildFallbackSite(o: {
  businessName: string
  industry: string
  description: string
  primaryColor: string
}): string {
  const name = escapeHtml(o.businessName)
  const ind = escapeHtml(o.industry)
  const desc = escapeHtml(o.description)
  const initial = escapeHtml(o.businessName.trim().charAt(0).toUpperCase() || 'B')
  const slug = o.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'business'
  const email = 'hello@' + slug + '.com'
  const brand = o.primaryColor

  const services = [
    { title: 'Strategy & scoping', copy: 'We start with the outcome you need, then map the shortest honest path to it — before anything is built or billed.' },
    { title: 'Design & build', copy: `Work made for ${ind} buyers: clear thinking, considered detail and a finish that holds up on every screen.` },
    { title: 'Delivery you can track', copy: 'Agreed dates, visible progress and a weekly note. You always know exactly where the work stands.' },
    { title: 'One named contact', copy: 'No ticket queues and no rotating cast. The person who scoped the work is the person who answers.' },
    { title: 'Transparent pricing', copy: 'Fixed quotes, itemised invoices and zero hidden charges. You approve the number before we begin.' },
    { title: 'After-care', copy: 'We stay on after handover, watch what the work produces and tune it against the number that matters.' },
  ]
  const cards = services
    .map(
      (s, i) =>
        `        <article class="card" data-reveal>\n` +
        `          <span class="card-no">${String(i + 1).padStart(2, '0')}</span>\n` +
        `          <h3>${s.title}</h3>\n` +
        `          <p>${s.copy}</p>\n` +
        `        </article>`
    )
    .join('\n')

  const steps: [string, string][] = [
    ['Conversation', 'A short call to understand the goal, the constraints and what success looks like.'],
    ['Plan & quote', 'A written scope with a fixed price and a date. No retainer gymnastics.'],
    ['Delivery', 'Work in the open, reviewed in milestones, handed over ready to use.'],
  ]
  const stepMarkup = steps
    .map(([t, d], i) => `        <li data-reveal><span class="step-no">0${i + 1}</span><h3>${t}</h3><p>${d}</p></li>`)
    .join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${name} — ${ind}</title>
<meta name="description" content="${desc}" />
<style>
:root{
  --brand:${brand};
  --ink:#0b0b12;
  --paper:#ffffff;
  --cream:#f6f4ef;
  --muted:#5d5d6e;
  --line:rgba(11,11,18,.10);
  --display:"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Georgia,serif;
  --body:"Segoe UI",Helvetica,Arial,sans-serif;
  --max:1160px;
}
*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;font-family:var(--body);color:var(--ink);background:var(--paper);line-height:1.62;-webkit-font-smoothing:antialiased}
h1,h2,h3{font-family:var(--display);line-height:1.1;letter-spacing:-.02em;margin:0}
p{margin:0}
a{color:inherit;text-decoration:none}
.wrap{width:min(100% - 48px,var(--max));margin-inline:auto}
.eyebrow{font-size:.74rem;letter-spacing:.22em;text-transform:uppercase;font-weight:700;color:var(--brand)}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 26px;border-radius:999px;background:var(--brand);color:#fff;font-weight:600;font-size:.95rem;border:1px solid transparent;transition:transform .25s ease,box-shadow .25s ease,background .25s ease}
.btn:hover{transform:translateY(-2px);box-shadow:0 16px 34px -14px var(--brand)}
.btn-ghost{background:transparent;border-color:rgba(255,255,255,.38);color:#fff}
.btn-ghost:hover{background:rgba(255,255,255,.10)}
.head{position:sticky;top:0;z-index:40;backdrop-filter:blur(14px);background:rgba(255,255,255,.84);border-bottom:1px solid var(--line)}
.head-in{position:relative;display:flex;align-items:center;justify-content:space-between;gap:20px;min-height:74px}
.brand{display:flex;align-items:center;gap:12px;font-family:var(--display);font-size:1.15rem}
.brand-mark{display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:var(--brand);color:#fff;font-family:var(--body);font-weight:700}
.nav{display:flex;align-items:center;gap:28px;font-size:.94rem;color:#2a2a34}
.nav a:hover{color:var(--brand)}
.btn-sm{min-height:42px;padding:0 20px;font-size:.88rem}
.menu{display:none;width:44px;height:44px;border:1px solid var(--line);border-radius:12px;background:#fff;cursor:pointer;padding:0;align-items:center;justify-content:center;flex-direction:column;gap:5px}
.menu span{display:block;width:18px;height:2px;background:var(--ink)}
.hero{position:relative;overflow:hidden;background:linear-gradient(160deg,#0a0a12 0%,#121220 48%,#0a0a12 100%);color:#fff;padding:clamp(72px,11vw,132px) 0 clamp(80px,10vw,120px)}
.glow{position:absolute;display:block;border-radius:50%;filter:blur(90px);opacity:.5;pointer-events:none}
.glow-a{width:min(52vw,620px);aspect-ratio:1;background:var(--brand);top:-22%;right:-8%}
.glow-b{width:min(46vw,520px);aspect-ratio:1;background:color-mix(in srgb,var(--brand) 55%,#00e0c6);bottom:-32%;left:-10%;opacity:.32}
.hero .wrap{position:relative;z-index:1;max-width:920px}
.hero .eyebrow{color:color-mix(in srgb,var(--brand) 45%,#ffffff)}
.hero h1{font-size:clamp(2.4rem,6.2vw,4.4rem);margin:18px 0 22px;max-width:19ch}
.lede{font-size:clamp(1.02rem,1.6vw,1.2rem);color:rgba(255,255,255,.78);max-width:60ch}
.cta-row{display:flex;flex-wrap:wrap;gap:14px;margin:34px 0 40px}
.chips{display:flex;flex-wrap:wrap;gap:10px;list-style:none;margin:0;padding:0}
.chips li{font-size:.82rem;color:rgba(255,255,255,.82);border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:8px 16px;background:rgba(255,255,255,.04)}
.section{padding:clamp(64px,9vw,110px) 0}
.section-head{max-width:720px;margin-bottom:clamp(34px,5vw,54px)}
.section-head h2{font-size:clamp(1.9rem,3.6vw,2.9rem);margin:14px 0 16px}
.section-head p{color:var(--muted);font-size:1.02rem}
.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}
.card{padding:30px 26px 28px;border:1px solid var(--line);border-radius:22px;background:#fff;transition:transform .35s ease,box-shadow .35s ease,border-color .35s ease}
.card:hover{transform:translateY(-5px);box-shadow:0 26px 50px -30px rgba(11,11,18,.45);border-color:color-mix(in srgb,var(--brand) 40%,transparent)}
.card-no{font-size:.76rem;font-weight:700;letter-spacing:.16em;color:var(--brand)}
.card h3{font-size:1.22rem;margin:16px 0 10px}
.card p{color:var(--muted);font-size:.96rem}
.about{background:var(--cream)}
.about-in{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:clamp(32px,6vw,72px);align-items:start}
.about h2{font-size:clamp(1.9rem,3.4vw,2.8rem);margin-top:14px}
.about-copy p{color:#33333f;margin-bottom:18px}
.stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin:32px 0 0;padding:0;list-style:none}
.stats li{border-top:2px solid var(--brand);padding-top:16px}
.stats b{display:block;font-family:var(--display);font-size:1.6rem;line-height:1.15}
.stats span{font-size:.82rem;color:var(--muted)}
.steps{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}
.steps li{border-top:1px solid var(--line);padding-top:22px}
.step-no{font-family:var(--display);font-size:2.2rem;color:color-mix(in srgb,var(--brand) 55%,#b9b9c6)}
.steps h3{font-size:1.1rem;margin:10px 0 8px}
.steps p{color:var(--muted);font-size:.94rem}
.quote{margin:clamp(38px,6vw,64px) 0 0;border-left:3px solid var(--brand);padding:6px 0 6px 26px;font-family:var(--display);font-size:clamp(1.2rem,2.2vw,1.6rem);line-height:1.4}
.quote span{display:block;margin-top:14px;font-family:var(--body);font-size:.86rem;color:var(--muted)}
.contact{background:linear-gradient(165deg,#0a0a12,#12121d 60%,#0a0a12);color:#fff}
.contact .eyebrow{color:color-mix(in srgb,var(--brand) 55%,#ffffff)}
.contact-in{display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);gap:clamp(32px,6vw,70px)}
.contact h2{font-size:clamp(1.9rem,3.4vw,2.7rem);margin:14px 0 16px}
.contact p{color:rgba(255,255,255,.74)}
.contact-details{list-style:none;padding:0;margin:30px 0 0;display:grid;gap:14px;font-size:.95rem;color:rgba(255,255,255,.74)}
.contact-details a{border-bottom:1px solid rgba(255,255,255,.28);padding-bottom:2px;color:#fff}
.contact-details a:hover{border-color:var(--brand)}
.form{display:grid;gap:16px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:clamp(22px,3vw,32px)}
.form label{font-size:.78rem;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.6)}
.form input,.form textarea{width:100%;margin-top:8px;min-height:48px;padding:12px 16px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#fff;font:inherit;font-size:.95rem;outline:none}
.form input:focus,.form textarea:focus{border-color:var(--brand);box-shadow:0 0 0 3px color-mix(in srgb,var(--brand) 35%,transparent)}
.form textarea{min-height:120px;resize:vertical}
.form .btn{width:100%;margin-top:4px}
.form-note{font-size:.78rem;color:rgba(255,255,255,.5)}
.foot{border-top:1px solid var(--line);padding:34px 0;background:#fff}
.foot-in{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;font-size:.86rem;color:var(--muted)}
.foot nav{display:flex;gap:20px}
.foot a:hover{color:var(--brand)}
[data-reveal]{opacity:0;transform:translateY(20px);transition:opacity .7s ease,transform .7s ease}
[data-reveal].in{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){[data-reveal]{opacity:1;transform:none;transition:none}html{scroll-behavior:auto}}
@media (max-width:900px){
  .grid,.steps,.stats{grid-template-columns:repeat(2,minmax(0,1fr))}
  .about-in,.contact-in{grid-template-columns:minmax(0,1fr)}
  .nav{position:absolute;top:74px;left:0;right:0;flex-direction:column;align-items:flex-start;gap:4px;padding:18px 24px 24px;background:#fff;border-bottom:1px solid var(--line);display:none;box-shadow:0 20px 30px -24px rgba(11,11,18,.5)}
  .nav.open{display:flex}
  .nav a{width:100%;padding:12px 0}
  .nav .btn-sm{margin-top:10px;width:100%}
  .menu{display:flex}
}
@media (max-width:620px){
  .grid,.stats,.steps{grid-template-columns:minmax(0,1fr)}
  .wrap{width:min(100% - 32px,var(--max))}
}
</style>
</head>
<body>
<header class="head">
  <div class="wrap head-in">
    <a class="brand" href="#top"><span class="brand-mark">${initial}</span>${name}</a>
    <nav class="nav" id="nav" aria-label="Primary">
      <a href="#services">Services</a>
      <a href="#about">About</a>
      <a href="#process">Process</a>
      <a href="#contact">Contact</a>
      <a class="btn btn-sm" href="#contact">Get a quote</a>
    </nav>
    <button class="menu" id="menu" type="button" aria-label="Toggle navigation" aria-expanded="false"><span></span><span></span></button>
  </div>
</header>

<main id="top">
  <section class="hero">
    <span class="glow glow-a" aria-hidden="true"></span>
    <span class="glow glow-b" aria-hidden="true"></span>
    <div class="wrap">
      <p class="eyebrow">${ind}</p>
      <h1>${name} does ${ind.toLowerCase()} the way it should be done.</h1>
      <p class="lede">${desc}</p>
      <div class="cta-row">
        <a class="btn" href="#contact">Start a conversation</a>
        <a class="btn btn-ghost" href="#services">See what we do</a>
      </div>
      <ul class="chips">
        <li>Reply within one working day</li>
        <li>Fixed-scope quotes</li>
        <li>One accountable contact</li>
      </ul>
    </div>
  </section>

  <section class="section" id="services">
    <div class="wrap">
      <div class="section-head" data-reveal>
        <p class="eyebrow">What we do</p>
        <h2>Six things ${name} gets right, every single time.</h2>
        <p>No bloated service menus. This is the work, and every part of it is built to move one number for your business.</p>
      </div>
      <div class="grid">
${cards}
      </div>
    </div>
  </section>

  <section class="section about" id="about">
    <div class="wrap about-in">
      <div data-reveal>
        <p class="eyebrow">About us</p>
        <h2>Built for ${ind} businesses that are done with guesswork.</h2>
      </div>
      <div class="about-copy" data-reveal>
        <p>${desc}</p>
        <p>${name} works with a small number of clients at a time on purpose — it means the person who plans your work is the person who delivers it, and the person who picks up the phone six months later.</p>
        <ul class="stats">
          <li><b>24h</b><span>Typical reply time</span></li>
          <li><b>1:1</b><span>Named point of contact</span></li>
          <li><b>0</b><span>Hidden charges</span></li>
        </ul>
      </div>
    </div>
  </section>

  <section class="section" id="process">
    <div class="wrap">
      <div class="section-head" data-reveal>
        <p class="eyebrow">How it works</p>
        <h2>Three steps, no surprises.</h2>
      </div>
      <ol class="steps">
${stepMarkup}
      </ol>
      <blockquote class="quote" data-reveal>
        “We stopped chasing updates and started getting decisions. That alone changed how our team works.”
        <span>— A ${name} client</span>
      </blockquote>
    </div>
  </section>

  <section class="section contact" id="contact">
    <div class="wrap contact-in">
      <div data-reveal>
        <p class="eyebrow">Contact</p>
        <h2>Tell us what you're trying to fix.</h2>
        <p>Send a short note with your goal and any deadline. You'll get a straight answer — including a no, if that is the honest one.</p>
        <ul class="contact-details">
          <li>Email — <a href="mailto:${email}">${email}</a></li>
          <li>Hours — Monday to Saturday, 10:00–19:00 IST</li>
          <li>Based in — India, working with clients everywhere</li>
        </ul>
      </div>
      <form class="form" id="contact-form" data-reveal>
        <div>
          <label for="cf-name">Your name</label>
          <input id="cf-name" name="name" type="text" autocomplete="name" required />
        </div>
        <div>
          <label for="cf-email">Email</label>
          <input id="cf-email" name="email" type="email" autocomplete="email" required />
        </div>
        <div>
          <label for="cf-msg">What do you need?</label>
          <textarea id="cf-msg" name="message" required></textarea>
        </div>
        <button class="btn" type="submit">Send message</button>
        <p class="form-note">This opens your email app with the details filled in — nothing is stored on this page.</p>
      </form>
    </div>
  </section>
</main>

<footer class="foot">
  <div class="wrap foot-in">
    <p>© ${new Date().getFullYear()} ${name}. All rights reserved.</p>
    <nav aria-label="Footer">
      <a href="#services">Services</a>
      <a href="#about">About</a>
      <a href="#contact">Contact</a>
    </nav>
  </div>
</footer>

<script>
  (function () {
    var menu = document.getElementById('menu');
    var nav = document.getElementById('nav');
    if (menu && nav) {
      menu.addEventListener('click', function () {
        var open = nav.classList.toggle('open');
        menu.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      Array.prototype.forEach.call(nav.querySelectorAll('a'), function (link) {
        link.addEventListener('click', function () {
          nav.classList.remove('open');
          menu.setAttribute('aria-expanded', 'false');
        });
      });
    }
    var reveals = document.querySelectorAll('[data-reveal]');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      Array.prototype.forEach.call(reveals, function (el) { io.observe(el); });
    } else {
      Array.prototype.forEach.call(reveals, function (el) { el.classList.add('in'); });
    }
    var form = document.getElementById('contact-form');
    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var who = document.getElementById('cf-name');
        var mail = document.getElementById('cf-email');
        var msg = document.getElementById('cf-msg');
        var body = 'Name: ' + who.value + '\\nEmail: ' + mail.value + '\\n\\n' + msg.value;
        window.location.href = 'mailto:${email}?subject=' + encodeURIComponent('Enquiry from ' + who.value) + '&body=' + encodeURIComponent(body);
      });
    }
  })();
</script>
</body>
</html>`
}

const websiteGen: ToolHandler = async input => {
  const businessName = String(input.businessName || '').trim()
  if (!businessName) throw new Error('Business name is required')
  const industry = String(input.industry || 'business').trim()
  const description = String(
    input.description || `${businessName} is a ${industry} business serving customers with care and consistency.`
  ).trim()
  const primaryColor = /^#[0-9a-fA-F]{6}$/.test(String(input.primaryColor || ''))
    ? String(input.primaryColor)
    : '#4c1d95'

  const raw = await aiText(
    `You are an expert front-end designer. Build a complete, production-quality single-page website.\n\n` +
      `Business: ${businessName}\nIndustry: ${industry}\nWhat they do: ${description}\nBrand colour: ${primaryColor}\n\n` +
      `Requirements:\n` +
      `- Return ONE HTML document starting with <!DOCTYPE html> and ending with </html>. No markdown fences, no commentary before or after.\n` +
      `- All CSS in a single <style> tag and all JavaScript in a single <script> tag. No external fonts, CDNs or image files.\n` +
      `- Sections in this order: sticky header with nav and CTA, hero (headline, subheadline, two buttons, gradient background), services (six cards in a grid), about (copy plus three proof points), a testimonial or three-step process, contact (form plus details), footer.\n` +
      `- Use CSS custom properties seeded from ${primaryColor}, gradients, flexbox, CSS grid, a clear type scale, soft shadows and generous whitespace.\n` +
      `- Fully responsive: multi-column grids collapse to one column below 768px, the mobile menu works, nothing overflows horizontally, tap targets are at least 44px.\n` +
      `- Add tasteful transitions, a scroll-reveal effect and a working mobile menu toggle in the inline script.\n` +
      `- Write real, specific marketing copy for ${businessName}. Never use lorem ipsum or square-bracket placeholders.\n` +
      `- Semantic HTML, exactly one h1, high text contrast and aria labels on interactive controls.`
  )

  const html = cleanGeneratedHtml(raw)
  const usable = /<html[\s>]/i.test(html) && /<\/html>/i.test(html) && html.length > 1200

  return {
    html: usable ? html : buildFallbackSite({ businessName, industry, description, primaryColor }),
    businessName,
    pageCount: 1,
  }
}

// Subscription tools are 0-credit entry points into modules that already exist
// in the dashboard — they return a pointer instead of doing work twice.
const subscriptionRedirect = (moduleName: string, path: string): ToolHandler => async () => ({
  message: 'This feature is included in your subscription.',
  redirect: path,
  moduleName,
})

/* ---------------- registry ---------------- */

const HANDLERS: Record<string, ToolHandler> = {
  // Business Suite originals
  'ai-content-writer': contentWriter,
  'social-media-generator': socialGenerator,
  'lead-scoring-ai': leadScoring,
  'invoice-generator': invoiceGenerator,
  'invoice-extractor': invoiceExtractor,
  'email-campaign-sender': emailCampaign,
  'data-export': dataExport,
  // AI Studio tools (full engines live in ai-tools.ts)
  'logo': aiToolAdapter('logo'),
  'brandkit': aiToolAdapter('brandkit'),
  'social': aiToolAdapter('social'),
  'content': aiToolAdapter('content'),
  'seo': aiToolAdapter('seo'),
  'email': aiToolAdapter('email'),
  'pr': aiToolAdapter('pr'),
  'launch': aiToolAdapter('launch'),
  'poster': aiToolAdapter('poster'),
  'qr': aiToolAdapter('qr'),
  'pitchdeck': aiToolAdapter('pitchdeck'),
  'listing': aiToolAdapter('listing'),
  'bizplan': aiToolAdapter('bizplan'),
  'legal': aiToolAdapter('legal'),
  'chatbot': aiToolAdapter('chatbot'),
  // Business Suite tools
  'autoBlog': autoBlog,
  'aiAssistant': aiAssistant,
  'websiteGen': websiteGen,
  'invoiceGen': subscriptionRedirect('Invoice Generator', '/invoices'),
  'crmAccess': subscriptionRedirect('CRM', '/crm'),
  'inventoryMgmt': subscriptionRedirect('Inventory Management', '/inventory'),
  'hrPayroll': subscriptionRedirect('HR & Payroll', '/hr'),
  'emailMarketing': subscriptionRedirect('Email Marketing', '/marketing'),
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
