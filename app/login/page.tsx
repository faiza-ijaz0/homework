'use client';

import Link from 'next/link';
import { 
  Building2, 
  UserCog, 
  ClipboardCheck, 
  User, 
  Building, 
  Eye,
  ArrowRight,
  Shield
} from 'lucide-react';

const portals = [
  {
    id: 'admin',
    name: 'Admin Portal',
    description: 'Full system administration and organization management',
    icon: Building2,
    color: 'from-blue-500 to-blue-600',
    href: '/login/admin',
    iconBg: 'bg-blue-100 dark:bg-blue-900/50',
    textColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-500/20 hover:border-blue-500/40',
    roles: ['Super Admin', 'Admin'],
    badge: 'Full Access'
  },
  {
    id: 'manager',
    name: 'Manager Portal',
    description: 'Team management, project oversight, and performance tracking',
    icon: UserCog,
    color: 'from-indigo-500 to-indigo-600',
    href: '/login/manager',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/50',
    textColor: 'text-indigo-600 dark:text-indigo-400',
    borderColor: 'border-indigo-500/20 hover:border-indigo-500/40',
    roles: ['Manager'],
    badge: 'Team Lead'
  },
  {
    id: 'supervisor',
    name: 'Supervisor Portal',
    description: 'Daily operations, team oversight, and approval workflows',
    icon: ClipboardCheck,
    color: 'from-emerald-500 to-emerald-600',
    href: '/login/supervisor',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-500/20 hover:border-emerald-500/40',
    roles: ['Supervisor'],
    badge: 'Operations'
  },
  {
    id: 'employee',
    name: 'Employee Portal',
    description: 'Self-service, attendance, leave requests, and job assignments',
    icon: User,
    color: 'from-violet-500 to-violet-600',
    href: '/login/employee',
    iconBg: 'bg-violet-100 dark:bg-violet-900/50',
    textColor: 'text-violet-600 dark:text-violet-400',
    borderColor: 'border-violet-500/20 hover:border-violet-500/40',
    roles: ['Employee'],
    badge: 'Self Service'
  },
  {
    id: 'client',
    name: 'Client Portal',
    description: 'Service requests, job tracking, invoices, and support',
    icon: Building,
    color: 'from-green-500 to-green-600',
    href: '/login/client',
    iconBg: 'bg-green-100 dark:bg-green-900/50',
    textColor: 'text-green-600 dark:text-green-400',
    borderColor: 'border-green-500/20 hover:border-green-500/40',
    roles: ['Client'],
    badge: 'Customer'
  },
  {
    id: 'guest',
    name: 'Guest Portal',
    description: 'Limited read-only access to public information',
    icon: Eye,
    color: 'from-gray-500 to-gray-600',
    href: '/login/guest',
    iconBg: 'bg-gray-100 dark:bg-gray-700/50',
    textColor: 'text-gray-600 dark:text-gray-400',
    borderColor: 'border-gray-500/20 hover:border-gray-500/40',
    roles: ['Guest'],
    badge: 'View Only'
  },
];

export default function LoginPortalSelection() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Homeware
            </h1>
          </div>
          <p className="text-lg text-slate-300 mb-2">
            Multi-Portal Management System
          </p>
          <p className="text-sm text-slate-400">
            Select your portal to access the system
          </p>
        </div>

        {/* Portal Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <Link
                key={portal.id}
                href={portal.href}
                className={`group relative overflow-hidden rounded-2xl bg-slate-800/40 backdrop-blur-xl border ${portal.borderColor} transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]`}
              >
                {/* Gradient overlay on hover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${portal.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                ></div>

                <div className="relative p-6">
                  {/* Header with icon and badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`${portal.iconBg} w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`${portal.textColor} w-7 h-7`} />
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${portal.iconBg} ${portal.textColor}`}>
                      {portal.badge}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-white mb-2">
                    {portal.name}
                  </h3>
                  <p className="text-slate-400 text-sm mb-4 min-h-[40px]">
                    {portal.description}
                  </p>

                  {/* Roles */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {portal.roles.map(role => (
                      <span 
                        key={role}
                        className="text-xs px-2 py-0.5 rounded bg-slate-700/50 text-slate-300"
                      >
                        {role}
                      </span>
                    ))}
                  </div>

                  {/* Arrow indicator */}
                  <div className="flex items-center text-slate-400 group-hover:text-white transition-colors duration-300">
                    <span className="text-sm font-semibold">Sign in</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>

                {/* Bottom gradient line */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${portal.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              </Link>
            );
          })}
        </div>

        {/* Quick Access Info */}
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Demo Access Available
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {portals.map(portal => (
              <div key={portal.id} className="text-center">
                <p className="text-xs text-slate-400 mb-1">{portal.name.replace(' Portal', '')}</p>
                <code className="text-xs text-slate-300 font-mono">{portal.id}@homeware.ae</code>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 text-center mt-4">
            All demo accounts use password: <code className="text-slate-300">Demo@123</code>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-slate-400 text-sm space-y-2">
          <p>
            Need help? <a href="mailto:support@homeware.ae" className="text-blue-400 hover:text-blue-300">Contact support</a>
          </p>
          <p className="text-xs text-slate-500">
            © 2026 Homeware. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
