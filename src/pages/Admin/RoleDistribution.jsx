import React, { useState, useEffect } from 'react';
import { LuUsers, LuUserCheck, LuTrendingUp, LuActivity } from 'react-icons/lu';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';

const RoleDistribution = () => {
  const [roleStats, setRoleStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoleDistribution();
  }, []);

  const fetchRoleDistribution = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_PATHS.ADMIN.STATS);
      setRoleStats(response.data.roleStats || []);
    } catch (error) {
      console.error('Error fetching role distribution:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      master_trainer: 'bg-blue-100 text-blue-800',
      trainer: 'bg-green-100 text-green-800',
      trainee: 'bg-yellow-100 text-yellow-800',
      boa: 'bg-orange-100 text-orange-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleIcon = (role) => {
    const icons = {
      admin: LuUsers,
      master_trainer: LuUserCheck,
      trainer: LuUserCheck,
      trainee: LuUsers,
      boa: LuUsers
    };
    return icons[role] || LuUsers;
  };

  const totalUsers = roleStats.reduce((sum, role) => sum + (role.count || 0), 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Role Distribution</h1>
        <p className="text-gray-600">Overview of user roles across the system</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <LuUsers className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Total Users</p>
              <h2 className="text-2xl font-semibold text-gray-900">{totalUsers}</h2>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <LuTrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Active Roles</p>
              <h2 className="text-2xl font-semibold text-gray-900">{roleStats.length}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Role Distribution Chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Role Distribution</h3>
        
        {roleStats.length === 0 ? (
          <div className="text-center py-8">
            <LuActivity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No role data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {roleStats.map((role, index) => {
              const Icon = getRoleIcon(role._id);
              const percentage = totalUsers > 0 ? ((role.count || 0) / totalUsers * 100).toFixed(1) : 0;
              
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${getRoleColor(role._id)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {role._id ? role._id.replace('_', ' ').toUpperCase() : 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-500">{role.count || 0} users</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getRoleColor(role._id).split(' ')[0]}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">
                      {percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed Role Statistics */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Statistics</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {roleStats.map((role, index) => {
                const percentage = totalUsers > 0 ? ((role.count || 0) / totalUsers * 100).toFixed(1) : 0;
                
                return (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getRoleColor(role._id)}`}>
                          {role._id ? role._id.replace('_', ' ').toUpperCase() : 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {role.count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {percentage}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RoleDistribution;
