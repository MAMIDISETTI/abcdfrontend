import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuLogOut, LuUser, LuSettings } from 'react-icons/lu';
import Cookies from 'js-cookie';
import { useUserAuth } from '../../hooks/useUserAuth';
import AdminSidebar from './AdminSidebar';
import AdminDashboard from './AdminDashboard';
import AccountActivation from './AccountActivation';
import DeactivatedUsers from './DeactivatedUsers';
import RoleDistribution from './RoleDistribution';
import AccountStatus from './AccountStatus';
import MCQDeployments from './MCQDeployments';
import CandidateDashboard from './CandidateDashboardSimple';

const AdminLayout = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();
  const { user, clearUser } = useUserAuth();

  const handleLogout = () => {
    // Clear all cookies
    Cookies.remove("token");
    
    // Clear user data
    clearUser();
    
    // Navigate to login
    navigate("/login");
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'account-activation':
        return <AccountActivation />;
      case 'deactivated-users':
        return <DeactivatedUsers />;
      case 'role-distribution':
        return <RoleDistribution />;
      case 'account-status':
        return <AccountStatus />;
      case 'mcq-deployments':
        return <MCQDeployments />;
      case 'candidate-dashboard':
        return <CandidateDashboard />;
      case 'settings':
        return (
          <div className="p-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
              <p className="text-gray-600">System configuration and preferences</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h3>
              <p className="text-gray-500">Settings panel coming soon...</p>
            </div>
          </div>
        );
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
              <p className="text-sm text-gray-500">Welcome back, {user?.name || 'Admin'}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* User Info */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <LuUser className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{user?.name || 'Admin'}</p>
                  <p className="text-gray-500 capitalize">{user?.role || 'admin'}</p>
                </div>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <LuLogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
