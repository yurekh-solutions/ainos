'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  ChevronLeft,
  FolderKanban,
  Flag,
  Pencil,
  Plus,
  Trash2,
  User,
  X,
} from 'lucide-react';

type TaskStatus = 'todo' | 'in_progress' | 'done';

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  dueDate?: string;
  order: number;
}

interface ProjectDetail {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'on_hold' | 'completed';
  dueDate?: string;
}

const COLUMNS: { key: TaskStatus; label: string; accent: string }[] = [
  { key: 'todo', label: 'To Do', accent: 'bg-slate-400' },
  { key: 'in_progress', label: 'In Progress', accent: 'bg-[#1BE1D3]' },
  { key: 'done', label: 'Done', accent: 'bg-emerald-500' },
];

const PRIORITY_META: Record<string, { label: string; classes: string }> = {
  low: { label: 'Low', classes: 'bg-slate-500/10 text-slate-400 border-slate-500/30' },
  medium: { label: 'Medium', classes: 'bg-amber-500/10 text-amber-500 border-amber-500/30' },
  high: { label: 'High', classes: 'bg-red-500/10 text-red-500 border-red-500/30' },
};

const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'done'];

const emptyForm = { title: '', description: '', priority: 'medium', assignee: '', dueDate: '' };

export default function ProjectBoardPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = params.id;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [addingIn, setAddingIn] = useState<TaskStatus | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [editTask, setEditTask] = useState<TaskItem | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const fetchBoard = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
        setTasks(data.tasks || []);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const addTask = async (status: TaskStatus) => {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, title: newTitle.trim(), status }),
      });
      if (res.ok) {
        setNewTitle('');
        setAddingIn(null);
        fetchBoard();
      }
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setSaving(false);
    }
  };

  const moveTask = async (task: TaskItem, direction: -1 | 1) => {
    const idx = STATUS_ORDER.indexOf(task.status);
    const next = STATUS_ORDER[idx + direction];
    if (!next) return;
    // optimistic update
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
    } catch (error) {
      console.error('Error moving task:', error);
      fetchBoard();
    }
  };

  const setTaskStatus = async (task: TaskItem, status: TaskStatus) => {
    if (task.status === status) return;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)));
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      console.error('Error updating task:', error);
      fetchBoard();
    }
  };

  const deleteTask = async (task: TaskItem) => {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
      if (res.ok) setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const openEdit = (task: TaskItem) => {
    setEditTask(task);
    setEditForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      assignee: task.assignee || '',
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
    });
  };

  const saveEdit = async () => {
    if (!editTask || !editForm.title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${editTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          priority: editForm.priority,
          assignee: editForm.assignee.trim(),
          dueDate: editForm.dueDate || null,
        }),
      });
      if (res.ok) {
        setEditTask(null);
        fetchBoard();
      }
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1BE1D3]" />
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto text-center space-y-4 mt-12">
        <FolderKanban className="w-10 h-10 mx-auto text-[#1BE1D3]" />
        <h1 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
          Project not found
        </h1>
        <button
          onClick={() => router.push('/projects')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1BE1D3] text-black text-sm font-medium hover:bg-[#1BE1D3]/90 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Projects
        </button>
      </div>
    );
  }

  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const progress = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm hover:text-[#1BE1D3] transition-colors"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          <ChevronLeft className="w-4 h-4" /> Projects
        </Link>
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-lg bg-[#1BE1D3]/10 flex items-center justify-center shrink-0">
              <FolderKanban className="w-5 h-5 text-[#1BE1D3]" />
            </span>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>
                {project.name}
              </h1>
              {project.description && (
                <p className="text-sm truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {project.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {project.dueDate && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#1BE1D3]" /> Due{' '}
                {new Date(project.dueDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            )}
            <span>
              {doneCount}/{tasks.length} done · {progress}%
            </span>
          </div>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--border))' }}>
          <div className="h-full rounded-full bg-[#1BE1D3] transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div
              key={col.key}
              className="rounded-xl border p-3 space-y-3"
              style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}
            >
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.accent}`} />
                  <h2 className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                    {col.label}
                  </h2>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-md"
                    style={{ background: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
                  >
                    {colTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setAddingIn(addingIn === col.key ? null : col.key);
                    setNewTitle('');
                  }}
                  className="p-1.5 rounded-md hover:bg-[#1BE1D3]/10 transition-colors"
                  title={`Add task to ${col.label}`}
                >
                  <Plus className="w-4 h-4 text-[#1BE1D3]" />
                </button>
              </div>

              {/* Inline add */}
              {addingIn === col.key && (
                <div
                  className="rounded-lg border p-2.5 space-y-2"
                  style={{ borderColor: 'hsl(var(--border))' }}
                >
                  <input
                    autoFocus
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addTask(col.key);
                      if (e.key === 'Escape') setAddingIn(null);
                    }}
                    placeholder="Task title"
                    className="w-full rounded-md border px-3 py-2 text-sm bg-transparent outline-none focus:border-[#1BE1D3]"
                    style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => addTask(col.key)}
                      disabled={saving || !newTitle.trim()}
                      className="flex-1 py-1.5 rounded-md bg-[#1BE1D3] text-black text-xs font-medium hover:bg-[#1BE1D3]/90 transition-colors disabled:opacity-60"
                    >
                      {saving ? 'Adding...' : 'Add Task'}
                    </button>
                    <button
                      onClick={() => setAddingIn(null)}
                      className="px-3 py-1.5 rounded-md text-xs border transition-colors hover:border-[#1BE1D3]/40"
                      style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Task cards */}
              {colTasks.length === 0 && addingIn !== col.key && (
                <p
                  className="text-xs text-center py-6 rounded-lg border border-dashed"
                  style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
                >
                  No tasks
                </p>
              )}
              {colTasks.map((task) => {
                const pri = PRIORITY_META[task.priority] || PRIORITY_META.medium;
                return (
                  <div
                    key={task.id}
                    className="group rounded-lg border p-3 space-y-2 hover:border-[#1BE1D3]/40 transition-colors"
                    style={{ borderColor: 'hsl(var(--border))' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-snug" style={{ color: 'hsl(var(--foreground))' }}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => openEdit(task)}
                          className="p-1 rounded-md hover:bg-[#1BE1D3]/10"
                          title="Edit task"
                        >
                          <Pencil className="w-3.5 h-3.5 text-[#1BE1D3]" />
                        </button>
                        <button
                          onClick={() => deleteTask(task)}
                          className="p-1 rounded-md hover:bg-red-500/10"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </div>
                    </div>
                    {task.description && (
                      <p className="text-xs line-clamp-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {task.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border font-medium ${pri.classes}`}>
                        <Flag className="w-3 h-3" /> {pri.label}
                      </span>
                      {task.assignee && (
                        <span className="inline-flex items-center gap-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          <User className="w-3 h-3 text-[#1BE1D3]" /> {task.assignee}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className="inline-flex items-center gap-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          <Calendar className="w-3 h-3 text-[#1BE1D3]" /> {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
                      <button
                        onClick={() => moveTask(task, -1)}
                        disabled={task.status === 'todo'}
                        className="p-1 rounded-md hover:bg-[#1BE1D3]/10 disabled:opacity-30 transition-colors"
                        title="Move left"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                      </button>
                      <select
                        value={task.status}
                        onChange={(e) => setTaskStatus(task, e.target.value as TaskStatus)}
                        className="text-[11px] rounded-md border px-1.5 py-1 bg-transparent outline-none focus:border-[#1BE1D3] cursor-pointer"
                        style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                      <button
                        onClick={() => moveTask(task, 1)}
                        disabled={task.status === 'done'}
                        className="p-1 rounded-md hover:bg-[#1BE1D3]/10 disabled:opacity-30 transition-colors"
                        title="Move right"
                      >
                        <ArrowRight className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Edit modal */}
      {editTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            className="w-full max-w-md rounded-xl border p-6 space-y-4"
            style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                Edit Task
              </h2>
              <button onClick={() => setEditTask(null)} className="p-1.5 rounded-md hover:bg-[#1BE1D3]/10">
                <X className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
              </button>
            </div>
            <div className="space-y-3">
              <input
                autoFocus
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Task title"
                className="w-full rounded-lg border px-3.5 py-2.5 text-sm bg-transparent outline-none focus:border-[#1BE1D3]"
                style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
              />
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Description (optional)"
                rows={3}
                className="w-full rounded-lg border px-3.5 py-2.5 text-sm bg-transparent outline-none focus:border-[#1BE1D3] resize-none"
                style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm bg-transparent outline-none focus:border-[#1BE1D3] cursor-pointer"
                  style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                >
                  <option value="low">Low priority</option>
                  <option value="medium">Medium priority</option>
                  <option value="high">High priority</option>
                </select>
                <input
                  type="date"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm bg-transparent outline-none focus:border-[#1BE1D3]"
                  style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                />
              </div>
              <input
                value={editForm.assignee}
                onChange={(e) => setEditForm({ ...editForm, assignee: e.target.value })}
                placeholder="Assignee (name or email)"
                className="w-full rounded-lg border px-3.5 py-2.5 text-sm bg-transparent outline-none focus:border-[#1BE1D3]"
                style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
              />
            </div>
            <button
              onClick={saveEdit}
              disabled={saving || !editForm.title.trim()}
              className="w-full py-2.5 rounded-lg bg-[#1BE1D3] text-black text-sm font-medium hover:bg-[#1BE1D3]/90 transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
