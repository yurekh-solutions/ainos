'use client';

import { motion } from 'framer-motion';
import { 
  Workflow, FileText, Users, TrendingUp, 
  Plus, ArrowRight, Activity, DollarSign 
} from 'lucide-react';
import Link from 'next/link';

const stats = [
  { label: 'Active Workflows', value: '12', icon: Workflow, color: 'from-blue-500 to-cyan-500' },
  { label: 'Invoices This Month', value: '48', icon: FileText, color: 'from-green-500 to-emerald-500' },
  { label: 'Total Customers', value: '156', icon: Users, color: 'from-purple-500 to-pink-500' },
  { label: 'Revenue', value: '$24.5K', icon: DollarSign, color: 'from-orange-500 to-red-500' },
];

const recentWorkflows = [
  { name: 'Invoice Auto-Generation', status: 'active', lastRun: '2 min ago', success: 98 },
  { name: 'Payment Reminders', status: 'active', lastRun: '1 hour ago', success: 95 },
  { name: 'Monthly Reports', status: 'scheduled', lastRun: 'Yesterday', success: 100 },
  { name: 'Customer Onboarding', status: 'paused', lastRun: '3 days ago', success: 87 },
];

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
  return (
    <div className="h-full overflow-y-auto p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-white/60 mt-1">Welcome back! Here&apos;s what&apos;s happening with your business.</p>
          </div>
          <Link
            href="/workflows/new"
            className="glass-button px-6 py-3 rounded-xl text-white font-medium flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Workflow
          </Link>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
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
              {recentWorkflows.map((workflow, index) => (
                <motion.div
                  key={workflow.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass p-4 rounded-xl flex items-center justify-between group hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      workflow.status === 'active' ? 'bg-green-500/20' :
                      workflow.status === 'scheduled' ? 'bg-blue-500/20' :
                      'bg-yellow-500/20'
                    }`}>
                      <Activity className={`w-5 h-5 ${
                        workflow.status === 'active' ? 'text-green-400' :
                        workflow.status === 'scheduled' ? 'text-blue-400' :
                        'text-yellow-400'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{workflow.name}</h3>
                      <p className="text-white/50 text-sm">Last run: {workflow.lastRun}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        workflow.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        workflow.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {workflow.status}
                      </span>
                    </div>
                    <div className="w-16">
                      <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                        <span>{workflow.success}%</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"
                          style={{ width: `${workflow.success}%` }}
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
