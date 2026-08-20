'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  Plus,
  X,
  Calendar,
  Trash2,
  CheckCircle,
  PauseCircle,
  PlayCircle,
} from 'lucide-react';

interface ProjectItem {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'on_hold' | 'completed';
  color?: string;
  dueDate?: string;
  taskCount: number;
  doneCount: number;
  createdAt: string;
}

const STATUS_META: Record<
  string,
  { label: string; icon: typeof PlayCircle; classes: string }
> = {
  active: {
    label: 'Active',
    icon: PlayCircle,
    classes: 'bg-[#1BE1D3]/10 text-[#1BE1D3] border-[#1BE1D3]/30',
  },
  on_hold: {
    label: 'On Hold',
    icon: PauseCircle,
    classes: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    classes: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  },
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', dueDate: '' });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          dueDate: form.dueDate || undefined,
        }),
      });
      if (res.ok) {
        setForm({ name: '', description: '', dueDate: '' });
        setShowCreate(false);
        fetchProjects();
      } else {
        const data = await res.json();
        alert(data.error || 'Something went wrong');
      }
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async (id: string, name: string) => {
    if (!confirm(`Delete project "${name}" and all its tasks?`)) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (res.ok) fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const formatDate = (d?: string) =>
    d
      ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : '';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1BE1D3]" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
            Projects
          </h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Plan work, track tasks and hit deadlines
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1BE1D3] text-black text-sm font-medium hover:bg-[#1BE1D3]/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            className="w-full max-w-md rounded-xl border p-6 space-y-4"
            style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                New Project
              </h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-md hover:bg-[#1BE1D3]/10">
                <X className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
              </button>
            </div>
            <div className="space-y-3">
              <input
                autoFocus
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && createProject()}
                placeholder="Project name"
                className="w-full rounded-lg border px-3.5 py-2.5 text-sm bg-transparent outline-none focus:border-[#1BE1D3]"
                style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
              />
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description (optional)"
                rows={3}
                className="w-full rounded-lg border px-3.5 py-2.5 text-sm bg-transparent outline-none focus:border-[#1BE1D3] resize-none"
                style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
              />
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full rounded-lg border px-3.5 py-2.5 text-sm bg-transparent outline-none focus:border-[#1BE1D3]"
                style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
              />
            </div>
            <button
              onClick={createProject}
              disabled={saving || !form.name.trim()}
              className="w-full py-2.5 rounded-lg bg-[#1BE1D3] text-black text-sm font-medium hover:bg-[#1BE1D3]/90 transition-colors disabled:opacity-60"
            >
              {saving ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {projects.length === 0 ? (
        <div
          className="rounded-xl border border-dashed p-12 text-center space-y-3"
          style={{ borderColor: 'hsl(var(--border))' }}
        >
          <div className="w-14 h-14 mx-auto rounded-xl bg-[#1BE1D3]/10 flex items-center justify-center">
            <FolderKanban className="w-7 h-7 text-[#1BE1D3]" />
          </div>
          <h2 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
            No projects yet
          </h2>
          <p className="text-sm max-w-sm mx-auto" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Create your first project and organise work on a kanban board — AINOS keeps every task on track.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1BE1D3] text-black text-sm font-medium hover:bg-[#1BE1D3]/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const meta = STATUS_META[project.status] || STATUS_META.active;
            const StatusIcon = meta.icon;
            const progress = project.taskCount
              ? Math.round((project.doneCount / project.taskCount) * 100)
              : 0;
            return (
              <div
                key={project.id}
                className="group relative rounded-xl border p-5 hover:border-[#1BE1D3]/40 transition-colors"
                style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}
              >
                <Link href={`/projects/${project.id}`} className="block space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-lg bg-[#1BE1D3]/10 flex items-center justify-center shrink-0">
                      <FolderKanban className="w-5 h-5 text-[#1BE1D3]" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate" style={{ color: 'hsl(var(--foreground))' }}>
                        {project.name}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${meta.classes}`}
                      >
                        <StatusIcon className="w-3 h-3" /> {meta.label}
                      </span>
                    </div>
                  </div>
                  {project.description && (
                    <p className="text-xs line-clamp-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {project.description}
                    </p>
                  )}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <span>
                        {project.doneCount}/{project.taskCount} tasks done
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--border))' }}>
                      <div
                        className="h-full rounded-full bg-[#1BE1D3] transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  {project.dueDate && (
                    <p className="flex items-center gap-1.5 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <Calendar className="w-3.5 h-3.5 text-[#1BE1D3]" /> Due {formatDate(project.dueDate)}
                    </p>
                  )}
                </Link>
                <button
                  onClick={() => deleteProject(project.id, project.name)}
                  className="absolute top-3 right-3 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all"
                  title="Delete project"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
