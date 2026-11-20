import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

// Every handler resolves the caller's company first and keys the lookup on
// { id, companyId }. An id from another tenant therefore returns 404 instead of
// handing over or mutating someone else's project.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireSession(req);
    if (ctx.error) return ctx.error;

    const { id } = await params;
    const project = await prisma.project.findFirst({ where: { id, companyId: ctx.companyId } });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const tasks = await prisma.task.findMany({
      where: { projectId: id, companyId: ctx.companyId },
      orderBy: [{ status: 'asc' }, { createdAt: 'asc' }]
    });
    return NextResponse.json({ project, tasks });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/projects/[id] — update project fields
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireSession(req);
    if (ctx.error) return ctx.error;

    const { id } = await params;
    const owned = await prisma.project.findFirst({ where: { id, companyId: ctx.companyId }, select: { id: true } });
    if (!owned) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.description !== undefined) data.description = body.description;
    if (body.status !== undefined) data.status = body.status;
    if (body.dueDate !== undefined) data.endDate = new Date(body.dueDate);

    const project = await prisma.project.update({ where: { id }, data });
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/projects/[id] — delete project and its tasks
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireSession(req);
    if (ctx.error) return ctx.error;

    const { id } = await params;
    const owned = await prisma.project.findFirst({ where: { id, companyId: ctx.companyId }, select: { id: true } });
    if (!owned) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    // Delete tasks first, then project — both scoped to the caller's company.
    await prisma.task.deleteMany({ where: { projectId: id, companyId: ctx.companyId } });
    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
