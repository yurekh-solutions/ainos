import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

// Ownership is checked with { id, companyId } before any mutation, so a task id
// belonging to another company cannot be changed or removed from here.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireSession(req);
    if (ctx.error) return ctx.error;

    const { id } = await params;
    const owned = await prisma.task.findFirst({ where: { id, companyId: ctx.companyId }, select: { id: true } });
    if (!owned) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.status !== undefined) data.status = body.status;
    if (body.priority !== undefined) data.priority = body.priority;
    if (body.assignedTo !== undefined) data.assignedTo = body.assignedTo;
    if (body.assignee !== undefined) data.assignedTo = body.assignee;
    if (body.dueDate !== undefined) data.dueDate = new Date(body.dueDate);

    const task = await prisma.task.update({ where: { id }, data });
    return NextResponse.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/tasks/[id] — delete a task
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireSession(req);
    if (ctx.error) return ctx.error;

    const { id } = await params;
    const owned = await prisma.task.findFirst({ where: { id, companyId: ctx.companyId }, select: { id: true } });
    if (!owned) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
