'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Workflow, FileText, Users, TrendingUp, 
  Plus, ArrowRight, Activity, DollarSign 
} from 'lucide-react';
import Link from 'next/link';
import { useWorkflowStore } from '@/store/workflowStore';

interface Invoice {
  status: string;
  totalAmount: number;
}

interface DashboardStats {
  totalWorkflows: number;
  totalInvoices: number;
  totalCustomers: number;
  totalRevenue: number;
}

interface WorkflowItem {
  id: string;
  name: string;
  isActive: boolean;
  updatedAt: string;
  nodes: unknown[];
  status?: 'active' | 'scheduled' | 'paused';
  lastRun?: string;
  success?: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function Dashboard() {
  const { workflows } = useWorkflowStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalWorkflows: 0,
    totalInvoices: 0,
    totalCustomers: 0,
    totalRevenue: 0,
  });
  const [recentWorkflows, setRecentWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [workflows]);

  const fetchDashboardData = async () => {
    try {
      const [invoicesRes, customersRes] = await Promise.all([
        fetch('/api/invoices'),
        fetch('/api/customers'),
      ]);

      const invoices: Invoice[] = invoicesRes.ok ? await invoicesRes.json() : [];
      const customers = customersRes.ok ? await customersRes.json() : [];

      const revenue = invoices
        .filter((inv) => inv.status === 'paid')
        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

      setStats({
        totalWorkflows: workflows.length,
        totalInvoices: invoices.length,
        totalCustomers: customers.length,
        totalRevenue: revenue,
      });

      // Get recent workflows from store
      const recent = workflows.slice(0, 4).map(w => ({
        ...w,
        status: (w.isActive ? 'active' : 'paused') as 'active' | 'paused',
        lastRun: new Date(w.updatedAt).toLocaleDateString(),
        success: 95,
      }));
      setRecentWorkflows(recent as WorkflowItem[]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Active Workflows', value: stats.totalWorkflows.toString(), icon: Workflow, color: 'from-blue-500 to-cyan-500' },
    { label: 'Invoices This Month', value: stats.totalInvoices.toString(), icon: FileText, color: 'from-green-500 to-emerald-500' },
    { label: 'Total Customers', value: stats.totalCustomers.toString(), icon: Users, color: 'from-purple-500 to-pink-500' },
    { label: 'Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'from-orange-500 to-red-500' },
  ];
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-6 sm:space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-white/60 mt-1 text-sm sm:text-base">Welcome back! Here&apos;s what&apos;s happening with your business.</p>
          </div>
          <Link
            href="/workflows/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm rounded-xl text-white text-sm font-medium transition-all shadow-lg shadow-white/5 hover:shadow-white/10 active:scale-95"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>New Workflow</span>
          </Link>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                whileHover={{ scale: 1.02 }}
                className="glass-card p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white/60 text-sm">{stat.label}</p>
                    <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">+12%</span>
                  <span className="text-white/40">vs last month</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Workflows */}
          <motion.div variants={itemVariants} className="lg:col-span-2 glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Recent Workflows</h2>
              <Link href="/workflows" className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {recentWorkflows.map((workflow) => (
                <motion.div
                  key={workflow.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass p-4 rounded-xl flex items-center justify-between group hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      workflow.isActive ? 'bg-green-500/20' : 'bg-yellow-500/20'
                    }`}>
                      <Activity className={`w-5 h-5 ${
                        workflow.isActive ? 'text-green-400' : 'text-yellow-400'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{workflow.name}</h3>
                      <p className="text-white/50 text-sm">Updated: {new Date(workflow.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        workflow.isActive 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {workflow.isActive ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <div className="w-16">
                      <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                        <span>{workflow.nodes.length} nodes</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"
                          style={{ width: '90%' }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link href="/invoices/new" className="w-full glass p-4 rounded-xl flex items-center gap-3 hover:bg-white/10 transition-colors group">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">Create Invoice</p>
                    <p className="text-white/50 text-sm">Generate a new invoice</p>
                  </div>
                </Link>
                <Link href="/customers/new" className="w-full glass p-4 rounded-xl flex items-center gap-3 hover:bg-white/10 transition-colors group">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">Add Customer</p>
                    <p className="text-white/50 text-sm">Create new customer</p>
                  </div>
                </Link>
                <Link href="/workflows" className="w-full glass p-4 rounded-xl flex items-center gap-3 hover:bg-white/10 transition-colors group">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Workflow className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">Manage Workflows</p>
                    <p className="text-white/50 text-sm">View all automations</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* System Status */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold text-white mb-4">System Status</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">API Status</span>
                  <span className="flex items-center gap-2 text-green-400 text-sm">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    Operational
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">Workflow Engine</span>
                  <span className="flex items-center gap-2 text-green-400 text-sm">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    Running
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">Email Service</span>
                  <span className="flex items-center gap-2 text-green-400 text-sm">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    Connected
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
