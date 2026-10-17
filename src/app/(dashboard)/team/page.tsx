'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Shield, ShieldCheck, Mail, Phone, Crown, Edit2, Check, X } from 'lucide-react';

interface TeamMember {
  id: string; name: string; email: string; role: string; isAdmin: boolean;
  phone?: string; image?: string; createdAt: string;
}

const roles = ['user', 'admin', 'manager', 'accountant', 'viewer'];

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editAdmin, setEditAdmin] = useState(false);

  const fetchTeam = async () => {
    try {
      const res = await fetch('/api/team');
      if (res.ok) setMembers(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTeam(); }, []);

  const handleSave = async (userId: string) => {
    try {
      const res = await fetch('/api/team', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: editRole, isAdmin: editAdmin }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchTeam();
      }
    } catch (e) { console.error(e); }
  };

  const roleColors: Record<string, string> = {
    admin: '#8B5CF6', manager: '#3B82F6', accountant: '#10B981', user: '#6B7280', viewer: '#94A3B8',
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: 'var(--page-gradient)' }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3" style={{ color: 'hsl(var(--foreground))' }}>
              <Users className="w-8 h-8" style={{ color: 'hsl(var(--primary))' }} /> Team Members
            </h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Manage your company team and roles</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading team...</div>
        ) : members.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-12 h-12 mx-auto mb-3" style={{ color: 'hsl(var(--primary) / 0.3)' }} />
            <p className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>No team members yet</p>
            <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Team members are added when they sign up with your company</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member, i) => (
              <motion.div key={member.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass-card rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                  style={{ background: `linear-gradient(135deg, ${roleColors[member.role] || '#6B7280'}CC, ${roleColors[member.role] || '#6B7280'}66)` }}>
                  {member.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>{member.name}</h3>
                    {member.isAdmin && <Crown className="w-4 h-4 text-amber-500 shrink-0" />}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <span className="text-xs flex items-center gap-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <Mail className="w-3 h-3" /> {member.email}
                    </span>
                    {member.phone && (
                      <span className="text-xs flex items-center gap-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        <Phone className="w-3 h-3" /> {member.phone}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {editingId === member.id ? (
                    <div className="flex items-center gap-2">
                      <select value={editRole} onChange={e => setEditRole(e.target.value)}
                        className="glass-input rounded-lg px-2 py-1.5 text-xs">
                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <label className="flex items-center gap-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        <input type="checkbox" checked={editAdmin} onChange={e => setEditAdmin(e.target.checked)} className="rounded" /> Admin
                      </label>
                      <button onClick={() => handleSave(member.id)} className="p-1.5 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-white capitalize"
                        style={{ background: roleColors[member.role] || '#6B7280' }}>
                        {member.role}
                      </span>
                      {member.isAdmin && (
                        <span className="px-2 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1"
                          style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
                          <ShieldCheck className="w-3 h-3" /> Admin
                        </span>
                      )}
                      <button onClick={() => { setEditingId(member.id); setEditRole(member.role); setEditAdmin(member.isAdmin); }}
                        className="p-1.5 rounded-lg hover:bg-black/5 transition-colors" title="Edit role">
                        <Edit2 className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Role Legend */}
        <div className="glass-card rounded-2xl p-5 mt-6">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
            <Shield className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} /> Role Permissions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { role: 'Admin', desc: 'Full access + team management', color: '#8B5CF6' },
              { role: 'Manager', desc: 'Create, edit, approve documents', color: '#3B82F6' },
              { role: 'Accountant', desc: 'Finance & reports access', color: '#10B981' },
              { role: 'User', desc: 'Standard create & view', color: '#6B7280' },
              { role: 'Viewer', desc: 'Read-only access', color: '#94A3B8' },
            ].map(r => (
              <div key={r.role} className="p-3 rounded-xl" style={{ background: 'hsl(var(--secondary))' }}>
                <span className="text-xs font-bold" style={{ color: r.color }}>{r.role}</span>
                <p className="text-[10px] mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
