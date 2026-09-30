'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Download, Eye, Clock, Sparkles, TrendingUp, Filter, Search } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  type: 'image' | 'video';
  url: string;
  author: string;
  authorAvatar: string;
  likes: number;
  views: number;
  createdAt: string;
  tags: string[];
  prompt?: string;
}

// Sample projects - in production, these would come from the database
const SAMPLE_PROJECTS: Project[] = [
  {
    id: '1',
    title: 'Cyberpunk City Nightscape',
    description: 'Futuristic city with neon lights and flying cars',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1515630278258-407f66498911?w=800',
    author: 'Alex Chen',
    authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    likes: 2847,
    views: 15420,
    createdAt: '2026-09-18',
    tags: ['cyberpunk', 'city', 'neon', 'futuristic'],
    prompt: 'cyberpunk city at night, neon lights, flying cars, rain, cinematic'
  },
  {
    id: '2',
    title: 'Ocean Wave Transformation',
    description: 'Dramatic ocean wave morphing into crystal',
    type: 'video',
    url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800',
    author: 'Sarah Miller',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    likes: 1923,
    views: 8745,
    createdAt: '2026-09-17',
    tags: ['ocean', 'wave', 'transformation', 'crystal'],
    prompt: 'ocean wave transforming into crystal, slow motion, cinematic'
  },
  {
    id: '3',
    title: 'Portrait in Golden Hour',
    description: 'Stunning portrait with warm golden lighting',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800',
    author: 'Mike Johnson',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    likes: 3421,
    views: 19234,
    createdAt: '2026-09-16',
    tags: ['portrait', 'golden hour', 'photography'],
    prompt: 'portrait photography, golden hour lighting, warm tones, professional'
  },
  {
    id: '4',
    title: 'Melting Reality',
    description: 'Surreal melting effect on urban landscape',
    type: 'video',
    url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
    author: 'Emma Davis',
    authorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    likes: 4156,
    views: 23891,
    createdAt: '2026-09-15',
    tags: ['surreal', 'melting', 'urban', 'viral'],
    prompt: 'urban landscape melting like wax, surreal transformation, cinematic'
  },
  {
    id: '5',
    title: 'Aurora Borealis Dreams',
    description: 'Ethereal northern lights over mountain landscape',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=800',
    author: 'David Kim',
    authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    likes: 5234,
    views: 28456,
    createdAt: '2026-09-14',
    tags: ['aurora', 'nature', 'landscape', 'ethereal'],
    prompt: 'aurora borealis over mountains, northern lights, ethereal glow'
  },
  {
    id: '6',
    title: 'Floating Objects Study',
    description: 'Zero gravity floating objects in studio',
    type: 'video',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800',
    author: 'Lisa Wang',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
    likes: 2156,
    views: 11234,
    createdAt: '2026-09-13',
    tags: ['floating', 'zero gravity', 'studio'],
    prompt: 'objects floating in zero gravity, slow motion, dreamy atmosphere'
  },
];

export default function ProjectsGalleryPage() {
  const [projects, setProjects] = useState<Project[]>(SAMPLE_PROJECTS);
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const [search, setSearch] = useState('');
  const [likedProjects, setLikedProjects] = useState<Set<string>>(new Set());

  const filteredProjects = projects.filter(p => {
    const matchesFilter = filter === 'all' || p.type === filter;
    const matchesSearch = search === '' || 
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleLike = (projectId: string) => {
    setLikedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });

    setProjects(prev => prev.map(p => 
      p.id === projectId 
        ? { ...p, likes: likedProjects.has(projectId) ? p.likes - 1 : p.likes + 1 }
        : p
    ));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--page-gradient)' }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3 mb-2" style={{ color: 'hsl(var(--foreground))' }}>
          <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-lg shadow-purple-600/30">
            <Sparkles className="text-white" size={28} />
          </div>
          Projects Gallery
        </h1>
        <p className="text-lg" style={{ color: 'hsl(var(--muted-foreground))' }}>Explore creations from the AINOS community</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-[hsl(var(--primary))]" size={20} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{projects.length}</div>
          <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Total Projects</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="text-[hsl(var(--info))]" size={20} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
            {(projects.reduce((sum, p) => sum + p.views, 0) / 1000).toFixed(1)}K
          </div>
          <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Total Views</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="text-[hsl(var(--error))]" size={20} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
            {(projects.reduce((sum, p) => sum + p.likes, 0) / 1000).toFixed(1)}K
          </div>
          <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Total Likes</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="text-[hsl(var(--warning))]" size={20} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
            {projects.filter(p => p.type === 'video').length}
          </div>
          <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Videos</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: 'hsl(var(--muted-foreground))' }} />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 glass-input placeholder-[hsl(var(--muted-foreground))]"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'image', 'video'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl font-medium transition-all capitalize ${
                filter === f
                  ? 'btn-primary'
                  : 'btn-secondary'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <motion.div
            key={project.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group glass-card overflow-hidden hover:border-[hsl(var(--primary)/0.5)] transition-all"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video overflow-hidden">
              <img
                src={project.url}
                alt={project.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* Type Badge */}
              <div className="absolute top-3 left-3 px-3 py-1 glass-card-subtle rounded-full text-xs font-medium capitalize" style={{ color: 'hsl(var(--foreground))' }}>
                {project.type}
              </div>

              {/* Views */}
              <div className="absolute top-3 right-3 flex items-center gap-1 px-3 py-1 glass-card-subtle rounded-full text-xs" style={{ color: 'hsl(var(--foreground))' }}>
                <Eye size={12} />
                {project.views.toLocaleString()}
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="font-semibold mb-1 line-clamp-1" style={{ color: 'hsl(var(--foreground))' }}>{project.title}</h3>
              <p className="text-sm mb-3 line-clamp-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{project.description}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-3">
                {project.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="px-2 py-0.5 glass-card-subtle rounded-md text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Author & Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={project.authorAvatar}
                    alt={project.author}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{project.author}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleLike(project.id)}
                    className={`flex items-center gap-1 text-sm transition-colors ${
                      likedProjects.has(project.id) ? 'text-[hsl(var(--error))]' : 'hover:text-[hsl(var(--error))]'
                    }`}
                    style={{ color: likedProjects.has(project.id) ? undefined : 'hsl(var(--muted-foreground))' }}
                  >
                    <Heart size={16} fill={likedProjects.has(project.id) ? 'currentColor' : 'none'} />
                    {project.likes}
                  </button>
                  <button className="hover:text-[hsl(var(--primary))] transition-colors" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    <Share2 size={16} />
                  </button>
                </div>
              </div>

              {/* Date */}
              <div className="mt-3 pt-3 border-t border-[hsl(var(--border)/0.5)] flex items-center gap-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <Clock size={12} />
                {formatDate(project.createdAt)}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-20">
          <Sparkles className="mx-auto mb-4" size={48} style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }} />
          <h3 className="text-lg font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>No projects found</h3>
          <p style={{ color: 'hsl(var(--muted-foreground))' }}>Try adjusting your search or filter</p>
        </div>
      )}
    </div>
  );
}
