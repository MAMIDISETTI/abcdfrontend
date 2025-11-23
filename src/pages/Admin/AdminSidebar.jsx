import React from 'react';
import { 
  LuLayoutDashboard, 
  LuUserCheck, 
  LuShield, 
  LuSettings,
  LuTrendingUp,
  LuLogOut,
  LuBrain,
  LuActivity,
  LuUserX,
  LuRefreshCw
} from 'react-icons/lu';

const AdminSidebar = ({ activeTab, setActiveTab, onLogout }) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LuLayoutDashboard,
      path: '/admin/dashboard'
    },
    {
      id: 'account-activation',
      label: 'Account Activation',
      icon: LuUserCheck,
      path: '/admin/account-activation'
    },
    {
      id: 'deactivated-users',
      label: 'Deactivated Users',
      icon: LuUserX,
      path: '/admin/deactivated-users'
    },
    // {
    //   id: 'role-distribution',
    //   label: 'Role Distribution',
    //   icon: LuTrendingUp,
    //   path: '/admin/role-distribution'
    // },
    // {
    //   id: 'mcq-deployments',
    //   label: 'MCQ Deployments',
    //   icon: LuBrain,
    //   path: '/admin/mcq-deployments'
    // },
    // {
    //   id: 'candidate-dashboard',
    //   label: 'Candidate Dashboard',
    //   icon: LuActivity,
    //   path: '/admin/candidate-dashboard'
    // },
    {
      id: 'candidate-performance-dashboard',
      label: 'Candidate Performance Dashboard',
      icon: LuTrendingUp,
      path: '/admin/candidate-performance-dashboard'
    },
    {
      id: 'performers-metrics-dashboard',
      label: 'Performers Metrics Dashboard',
      icon: LuActivity,
      path: '/admin/performers-metrics-dashboard'
    },
    {
      id: 'google-sheets-sync',
      label: 'Google Sheets Sync',
      icon: LuRefreshCw,
      path: '/admin/google-sheets-sync'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: LuSettings,
      path: '/admin/settings'
    }
  ];

  return (
    <div className="w-64 bg-white shadow-lg h-full flex flex-col">
      <div className="p-6 flex-1">
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-2 bg-purple-100 rounded-lg">
            <LuShield className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
            <p className="text-sm text-gray-500">System Management</p>
          </div>
        </div>

        <nav className="space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer text-left ${
                  isActive
                    ? 'bg-purple-100 text-purple-700 border-r-2 border-purple-600 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <LuLogOut className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
