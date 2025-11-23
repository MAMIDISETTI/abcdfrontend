import React, { useState, useEffect } from 'react';
import { LuUserX, LuSearch, LuFilter, LuRefreshCw, LuEye, LuUserCheck, LuCalendar, LuInfo } from 'react-icons/lu';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';

const DeactivatedUsers = () => {
  const [deactivatedUsers, setDeactivatedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statistics, setStatistics] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Debounce search term to avoid reloading on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when search changes
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch users when filters change
  // Note: debouncedSearchTerm is already debounced (500ms delay), so this won't fire on every keystroke
  useEffect(() => {
    fetchDeactivatedUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearchTerm, categoryFilter, severityFilter]);

  const fetchDeactivatedUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(severityFilter && { severity: severityFilter })
      });

      const response = await axiosInstance.get(`/api/admin/deactivated-users?${params}`);
      setDeactivatedUsers(response.data.deactivatedUsers || []);
      setTotalPages(response.data.totalPages || 1);
      setTotal(response.data.total || 0);
      setStatistics(response.data.statistics || {});
    } catch (error) {
      console.error('Error fetching deactivated users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReinstate = async (userId, userName) => {
    const reason = prompt(`Reinstating user: ${userName}\n\nPlease provide a reason for reinstatement:`);
    
    if (!reason || reason.trim() === '') {
      alert('Reinstatement reason is required. Operation cancelled.');
      return;
    }

    try {
      await axiosInstance.put(`/api/admin/deactivated-users/${userId}/reinstate`, {
        reason: reason.trim()
      });
      
      alert('User reinstated successfully!');
      fetchDeactivatedUsers(); // Refresh the list
    } catch (error) {
      console.error('Error reinstating user:', error);
      alert('Error reinstating user. Please try again.');
    }
  };

  const handleViewDetails = async (userId) => {
    try {
      const response = await axiosInstance.get(`/api/admin/deactivated-users/${userId}`);
      setSelectedUser(response.data.deactivatedUser);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
      alert('Error fetching user details. Please try again.');
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      voluntary: 'bg-green-100 text-green-800',
      performance: 'bg-yellow-100 text-yellow-800',
      disciplinary: 'bg-red-100 text-red-800',
      resignation: 'bg-blue-100 text-blue-800',
      termination: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.other;
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return colors[severity] || colors.low;
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <button
            onClick={fetchDeactivatedUsers}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-2"
          >
            <LuRefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Deactivation Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{statistics.totalDeactivated || 0}</div>
              <div className="text-sm text-gray-500">Total Deactivated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {statistics.byCategory?.termination || 0}
              </div>
              <div className="text-sm text-gray-500">Terminations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {statistics.byCategory?.voluntary || 0}
              </div>
              <div className="text-sm text-gray-500">Voluntary</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {statistics.byCategory?.performance || 0}
              </div>
              <div className="text-sm text-gray-500">Performance</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Search & Filter</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <LuSearch className="inline w-4 h-4 mr-1" />
                Search
              </label>
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => {
                  e.preventDefault();
                  setSearchTerm(e.target.value);
                }}
                onKeyDown={(e) => {
                  // Prevent form submission on Enter key
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <LuFilter className="inline w-4 h-4 mr-1" />
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                <option value="voluntary">Voluntary</option>
                <option value="performance">Performance</option>
                <option value="disciplinary">Disciplinary</option>
                <option value="resignation">Resignation</option>
                <option value="termination">Termination</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity
              </label>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSearchTerm('');
                  setCategoryFilter('');
                  setSeverityFilter('');
                }}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Deactivated Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Deactivated Users ({total})
            </h3>
            <div className="text-sm text-gray-500 flex items-center gap-2">
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
              <span>Page {currentPage} of {totalPages}</span>
            </div>
          </div>
        </div>
        
        {loading && deactivatedUsers.length === 0 ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading deactivated users...</p>
          </div>
        ) : deactivatedUsers.length === 0 ? (
          <div className="p-8 text-center">
            <LuUserX className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Deactivated Users Found
            </h3>
            <p className="text-gray-500">
              No users match your search criteria or there are no deactivated users.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deactivation Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category & Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days Since
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deactivatedUsers.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-red-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-red-700">
                              {user.userInfo.name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.userInfo.name}</div>
                          <div className="text-sm text-gray-500">{user.userInfo.email}</div>
                          <div className="text-xs text-gray-400">ID: {user.userInfo.author_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="max-w-xs">
                        <div className="text-sm text-gray-900 font-medium">
                          {user.deactivationDetails.reason}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {user.deactivationDetails.remarks}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          By: {user.deactivationDetails.deactivatedByName}
                        </div>
                        <div className="text-xs text-gray-500">
                          <LuCalendar className="inline w-3 h-3 mr-1" />
                          {new Date(user.deactivationDetails.deactivatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(user.deactivationDetails.category)}`}>
                          {user.deactivationDetails.category}
                        </span>
                        <br />
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(user.deactivationDetails.severity)}`}>
                          {user.deactivationDetails.severity}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Math.ceil((new Date() - new Date(user.deactivationDetails.deactivatedAt)) / (1000 * 60 * 60 * 24))} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleViewDetails(user._id)}
                        className="text-blue-600 hover:text-blue-900 cursor-pointer"
                        title="View Details"
                      >
                        <LuEye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReinstate(user._id, user.userInfo.name)}
                        className="text-green-600 hover:text-green-900 cursor-pointer"
                        title="Reinstate User"
                      >
                        <LuUserCheck className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <nav className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  currentPage === page
                    ? 'text-white bg-blue-600'
                    : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">User Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User Information */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">User Information</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Name:</strong> {selectedUser.userInfo.name}</div>
                  <div><strong>Email:</strong> {selectedUser.userInfo.email}</div>
                  <div><strong>Role:</strong> {selectedUser.userInfo.role}</div>
                  <div><strong>Department:</strong> {selectedUser.userInfo.department || 'N/A'}</div>
                  <div><strong>Phone:</strong> {selectedUser.userInfo.phone || 'N/A'}</div>
                  <div><strong>Employee ID:</strong> {selectedUser.userInfo.employeeId || 'N/A'}</div>
                </div>
              </div>

              {/* Deactivation Details */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Deactivation Details</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Reason:</strong> {selectedUser.deactivationDetails.reason}</div>
                  <div><strong>Remarks:</strong> {selectedUser.deactivationDetails.remarks || 'N/A'}</div>
                  <div><strong>Category:</strong> {selectedUser.deactivationDetails.category}</div>
                  <div><strong>Severity:</strong> {selectedUser.deactivationDetails.severity}</div>
                  <div><strong>Deactivated By:</strong> {selectedUser.deactivationDetails.deactivatedByName}</div>
                  <div><strong>Date:</strong> {new Date(selectedUser.deactivationDetails.deactivatedAt).toLocaleString()}</div>
                </div>
              </div>

              {/* Assignment Information */}
              {selectedUser.assignmentInfo && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Assignment Information</h4>
                  <div className="space-y-2 text-sm">
                    {selectedUser.assignmentInfo.assignedTrainerName && (
                      <div><strong>Assigned Trainer:</strong> {selectedUser.assignmentInfo.assignedTrainerName}</div>
                    )}
                    {selectedUser.assignmentInfo.assignedTraineeNames?.length > 0 && (
                      <div>
                        <strong>Assigned Trainees:</strong>
                        <ul className="list-disc list-inside ml-2">
                          {selectedUser.assignmentInfo.assignedTraineeNames.map((name, index) => (
                            <li key={index}>{name}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div><strong>Status:</strong> {selectedUser.assignmentInfo.status}</div>
                  </div>
                </div>
              )}

              {/* System Information */}
              {selectedUser.systemInfo && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">System Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Account Created:</strong> {selectedUser.systemInfo.accountCreatedAt ? new Date(selectedUser.systemInfo.accountCreatedAt).toLocaleDateString() : 'N/A'}</div>
                    <div><strong>Last Login:</strong> {selectedUser.systemInfo.lastLoginAt ? new Date(selectedUser.systemInfo.lastLoginAt).toLocaleDateString() : 'N/A'}</div>
                    <div><strong>Total Login Days:</strong> {selectedUser.systemInfo.totalLoginDays || 0}</div>
                    <div><strong>Last Activity:</strong> {selectedUser.systemInfo.lastActivityAt ? new Date(selectedUser.systemInfo.lastActivityAt).toLocaleDateString() : 'N/A'}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeactivatedUsers;
