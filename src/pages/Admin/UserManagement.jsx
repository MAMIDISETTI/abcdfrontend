import React, { useState, useEffect } from 'react';
import { LuUsers, LuUserPlus, LuUserCheck, LuUserX, LuShield, LuPencil, LuTrash2 } from 'react-icons/lu';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [promoteData, setPromoteData] = useState({ newRole: '', reason: '' });
  const [deactivateData, setDeactivateData] = useState({ reason: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_PATHS.ADMIN.USERS);
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteUser = async () => {
    try {
      await axiosInstance.put(API_PATHS.ADMIN.PROMOTE_USER, {
        userId: selectedUser._id,
        newRole: promoteData.newRole,
        reason: promoteData.reason
      });
      setShowPromoteModal(false);
      setPromoteData({ newRole: '', reason: '' });
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error promoting user:', error);
    }
  };

  const handleDeactivateUser = async () => {
    try {
      await axiosInstance.put(API_PATHS.ADMIN.DEACTIVATE_USER, {
        userId: selectedUser._id,
        reason: deactivateData.reason
      });
      setShowDeactivateModal(false);
      setDeactivateData({ reason: '' });
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deactivating user:', error);
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

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      deactivated: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getValidTransitions = (currentRole) => {
    const transitions = {
      'trainee': ['trainer', 'master_trainer', 'boa'],
      'trainer': ['master_trainer', 'trainee'],
      'master_trainer': ['trainer', 'trainee'],
      'boa': ['trainee'],
      'admin': []
    };
    return transitions[currentRole] || [];
  };

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
        <h1 className="font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-gray-600">Manage users, roles, and account status</p>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {user.role?.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.accountStatus)}`}>
                      {user.accountStatus?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.author_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {user.role !== 'admin' && user.accountStatus === 'active' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowPromoteModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 cursor-pointer"
                        >
                          <LuPencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeactivateModal(true);
                          }}
                          className="text-red-600 hover:text-red-900 cursor-pointer"
                        >
                          <LuUserX className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Promote User Modal */}
      {showPromoteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Promote User</h3>
            <p className="text-sm text-gray-600 mb-4">
              Promote <strong>{selectedUser.name}</strong> from {selectedUser.role} to:
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">New Role</label>
              <select
                value={promoteData.newRole}
                onChange={(e) => setPromoteData({ ...promoteData, newRole: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Select new role</option>
                {getValidTransitions(selectedUser.role).map((role) => (
                  <option key={role} value={role}>
                    {role.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason (Optional)</label>
              <textarea
                value={promoteData.reason}
                onChange={(e) => setPromoteData({ ...promoteData, reason: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                rows="3"
                placeholder="Enter reason for promotion..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowPromoteModal(false);
                  setSelectedUser(null);
                  setPromoteData({ newRole: '', reason: '' });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePromoteUser}
                disabled={!promoteData.newRole}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Promote User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate User Modal */}
      {showDeactivateModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Deactivate User</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will remove all access for <strong>{selectedUser.name}</strong> and clear their content.
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Deactivation</label>
              <textarea
                value={deactivateData.reason}
                onChange={(e) => setDeactivateData({ ...deactivateData, reason: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                rows="3"
                placeholder="Enter reason for deactivation..."
                required
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeactivateModal(false);
                  setSelectedUser(null);
                  setDeactivateData({ reason: '' });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivateUser}
                disabled={!deactivateData.reason}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Deactivate User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
