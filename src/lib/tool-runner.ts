import { prisma } from './prisma'
import { deductCredits } from './credits'

export interface ToolExecutionResult {
  success: boolean
  output?: unknown
  error?: string
  creditsUsed: number
  newBalance: number
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

  // Execute the tool handler
  let output: unknown
  try {
    const handler = new Function('input', 'prisma', tool.handlerCode || 'return { error: "No handler" }')
    output = await handler(input, prisma)
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
      toolName: tool.name,
      input: JSON.parse(JSON.stringify(input)),
      output: JSON.parse(JSON.stringify(output)),
      status: 'completed',
      userId,
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
