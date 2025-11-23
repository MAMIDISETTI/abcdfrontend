import React, { useState, useEffect } from 'react';
import { LuUserCheck, LuUserX, LuClock, LuCheck, LuSearch, LuFilter, LuUserPlus } from 'react-icons/lu';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';

const AccountActivation = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    trainers: 0,
    trainees: 0,
    admins: 0
  });
  const itemsPerPage = 10;
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    author_id: '',
    date_of_joining: '',
    candidate_name: '',
    phone_number: '',
    candidate_personal_mail_id: '',
    joining_status: 'active',
    genre: '',
    role_type: 'trainee',
    role_assign: '',
    qualification: '',
    password: ''
  });
  const [trainers, setTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [showTrainerSelection, setShowTrainerSelection] = useState(false);
  const [createdJoiner, setCreatedJoiner] = useState(null);

  // Common trainer data that will be pre-filled
  const commonTrainerData = {
    joining_status: 'active',
    role_type: 'trainer',
    role_assign: 'Training Department',
    qualification: 'Bachelor\'s Degree in Education/Training',
    genre: 'male' // Default, can be changed
  };
  const [isCreating, setIsCreating] = useState(false);

  // Debounce search term to avoid reloading on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when search changes
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch from API when page, role, status, or debounced search term changes
  // When searching, we fetch all users for client-side filtering
  // When not searching, we use pagination
  useEffect(() => {
    fetchAllUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, roleFilter, statusFilter, debouncedSearchTerm]);
  
  // Fetch statistics only once on mount
  useEffect(() => {
    fetchStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch statistics separately (all users for accurate counts)
  const fetchStatistics = async () => {
    try {
      // Fetch all users for statistics (with high limit)
      const response = await axiosInstance.get(`${API_PATHS.ADMIN.USERS}?status=all&limit=1000`);
      const allUsersForStats = response.data.users || [];
      
      setStatistics({
        total: response.data.total || 0,
        active: allUsersForStats.filter(u => u.isActive).length,
        inactive: allUsersForStats.filter(u => !u.isActive).length,
        trainers: allUsersForStats.filter(u => u.role === 'trainer').length,
        trainees: allUsersForStats.filter(u => u.role === 'trainee').length,
        admins: allUsersForStats.filter(u => u.role === 'admin').length
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  // Filter users based on search term and filters (client-side)
  useEffect(() => {
    let filtered = allUsers;

    // Search by name or email
    if (debouncedSearchTerm) {
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        user.author_id?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter) {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Filter by status
    if (statusFilter) {
      if (statusFilter === 'active') {
        filtered = filtered.filter(user => user.isActive === true && user.status !== 'pending_assignment');
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(user => user.isActive === false);
      } else if (statusFilter === 'pending_assignment') {
        filtered = filtered.filter(user => user.isActive === true && user.status === 'pending_assignment');
      }
    }

    // When searching, implement client-side pagination
    if (debouncedSearchTerm) {
      // Calculate pagination for filtered results
      const totalFiltered = filtered.length;
      const totalPagesForFiltered = Math.ceil(totalFiltered / itemsPerPage);
      setTotalPages(totalPagesForFiltered);
      setTotalUsers(totalFiltered);
      
      // Apply pagination to filtered results
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      filtered = filtered.slice(startIndex, endIndex);
    }
    // When not searching, totalUsers and totalPages are already set by fetchAllUsers from API response

    setFilteredUsers(filtered);
  }, [allUsers, debouncedSearchTerm, roleFilter, statusFilter, currentPage, itemsPerPage]);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('status', statusFilter || 'all');
      
      // If there's a search term, fetch all users (or a large limit) for client-side filtering
      // Otherwise, use pagination
      if (debouncedSearchTerm) {
        // Fetch a large number of users to search through (or all if possible)
        params.append('limit', '1000'); // Fetch up to 1000 users for searching
        params.append('page', '1'); // Start from page 1 when searching
      } else {
        // Normal pagination when not searching
        params.append('page', currentPage.toString());
        params.append('limit', itemsPerPage.toString());
      }
      
      if (roleFilter) params.append('role', roleFilter);
      // Note: We're doing client-side search filtering, so we don't pass searchTerm to API
      
      const response = await axiosInstance.get(`${API_PATHS.ADMIN.USERS}?${params.toString()}`);
      const users = response.data.users || [];
      const total = response.data.total || 0;
      const totalPagesCount = response.data.totalPages || 1;
      
      setAllUsers(users);
      setTotalUsers(total);
      
      // When searching, we'll handle pagination client-side, so set totalPages based on filtered results
      // When not searching, use server-side pagination
      if (debouncedSearchTerm) {
        // Will be updated by the filtering useEffect
        setTotalPages(1); // Temporary, will be recalculated
      } else {
        setTotalPages(totalPagesCount);
      }
      
      // Don't filter here - let the separate useEffect handle filtering
      setFilteredUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
      // Don't redirect on search errors - only on auth errors
      if (error.response?.status === 401) {
        // Let the axios interceptor handle this
      }
      return;
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainers = async () => {
    try {
      const response = await axiosInstance.get('/api/users?role=trainer');
      setTrainers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching trainers:', error);
    }
  };

  const handleAssignTrainer = async () => {
    if (!selectedTrainer) {
      alert('Please select a trainer');
      return;
    }

    try {
      // First, create user account in UserNew table
      const userData = {
        author_id: createdJoiner.author_id,
        name: createdJoiner.candidate_name,
        email: createdJoiner.candidate_personal_mail_id,
        password: Math.random().toString(36).slice(-8), // Generate random password
        role: 'trainee',
        phone: createdJoiner.phone_number,
        department: createdJoiner.department,
        genre: createdJoiner.genre,
        joiningDate: createdJoiner.joiningDate,
        qualification: createdJoiner.qualification,
        roleAssign: createdJoiner.role_assign,
        isActive: true,
        accountCreatedAt: new Date().toISOString()
      };

      const userResponse = await axiosInstance.post('/api/users', userData);
      // Then create assignment between trainer and trainee
      const assignmentData = {
        trainerId: selectedTrainer,
        traineeIds: [createdJoiner.author_id],
        effectiveDate: new Date().toISOString(),
        notes: `Assignment created for new trainee: ${createdJoiner.candidate_name}`,
        instructions: `Please provide training and support to the assigned trainee.`
      };

      await axiosInstance.post('/api/assignments', assignmentData);
      
      // Update the joiner record to link it to the user account
      await axiosInstance.put(`/api/joiners/${createdJoiner.id}`, {
        userId: userResponse.data.user._id,
        accountCreated: true,
        accountCreatedAt: new Date().toISOString()
      });
      
      // Reset everything and close modals
      setShowTrainerSelection(false);
      setShowCreateForm(false);
      setCreatedJoiner(null);
      setSelectedTrainer('');
      setCreateForm({ 
        author_id: '', 
        date_of_joining: '', 
        candidate_name: '', 
        phone_number: '', 
        candidate_personal_mail_id: '', 
        ...commonTrainerData,
        password: '' 
      });
      fetchAllUsers();
      alert('Trainee account created in Users table and assigned to trainer successfully!');
    } catch (error) {
      console.error('Error assigning trainer:', error);
      alert('Account created but trainer assignment failed. Please assign manually.');
    }
  };

  const handleSkipTrainerAssignment = () => {
    // Just close the trainer selection modal
    setShowTrainerSelection(false);
    setShowCreateForm(false);
    setCreatedJoiner(null);
    setSelectedTrainer('');
    setCreateForm({ 
      author_id: '', 
      date_of_joining: '', 
      candidate_name: '', 
      phone_number: '', 
      candidate_personal_mail_id: '', 
      ...commonTrainerData,
      password: '' 
    });
    fetchPendingUsers();
    alert('Trainee account created successfully! You can assign a trainer later.');
  };

  const handleActivateUser = async (userId) => {
    try {
      await axiosInstance.put(API_PATHS.ADMIN.REACTIVATE_USER, {
        userId: userId,
        reason: 'Account reactivated by admin'
      });
      fetchAllUsers(); // Refresh the user list
      alert('User account reactivated successfully!');
    } catch (error) {
      console.error('Error reactivating user:', error);
      alert('Error reactivating user. Please try again.');
    }
  };

  const handleDeactivateUser = async (userId, userName) => {
    const reason = prompt(`Deactivating user: ${userName}\n\nPlease provide a reason for deactivation:`);
    
    if (!reason || reason.trim() === '') {
      alert('Deactivation reason is required. Operation cancelled.');
      return;
    }

    try {
      console.log('Attempting to deactivate user:', {
        userId,
        endpoint: API_PATHS.ADMIN.DEACTIVATE_USER
      });
      
      const response = await axiosInstance.put(API_PATHS.ADMIN.DEACTIVATE_USER, {
        userId: userId,
        reason: reason.trim()
      });
      
      console.log('Deactivate user response:', response.data);
      fetchAllUsers(); // Refresh the user list
      alert('User account deactivated successfully!');
    } catch (error) {
      console.error('Error deactivating user:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      alert(`Error deactivating user: ${errorMessage}`);
    }
  };

  const handlePromoteUser = async (userId, currentRole) => {
    const newRole = prompt(`Current role: ${currentRole}\nEnter new role (trainee, trainer, master_trainer, boa, admin):`);
    
    if (!newRole) return;
    
    const validRoles = ['trainee', 'trainer', 'master_trainer', 'boa', 'admin'];
    if (!validRoles.includes(newRole.toLowerCase())) {
      alert('Invalid role. Valid roles: trainee, trainer, master_trainer, boa, admin');
      return;
    }

    try {
      console.log('Attempting to promote user:', {
        userId,
        currentRole,
        newRole: newRole.toLowerCase(),
        endpoint: API_PATHS.ADMIN.PROMOTE_USER
      });
      
      const response = await axiosInstance.put(API_PATHS.ADMIN.PROMOTE_USER, {
        userId: userId,
        newRole: newRole.toLowerCase(),
        reason: `Role changed from ${currentRole} to ${newRole} by admin`
      });
      
      console.log('Promote user response:', response.data);
      fetchAllUsers(); // Refresh the user list
      alert(`User promoted to ${newRole} successfully!`);
    } catch (error) {
      console.error('Error promoting user:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      alert(`Error promoting user: ${errorMessage}`);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!createForm.author_id || !createForm.candidate_name || !createForm.candidate_personal_mail_id) {
      alert('Author ID, Candidate Name, and Email are required');
      return;
    }

    setIsCreating(true);
    try {
      const response = await axiosInstance.post('/api/admin/users/create-trainee', {
        author_id: createForm.author_id,
        date_of_joining: createForm.date_of_joining,
        candidate_name: createForm.candidate_name,
        phone_number: createForm.phone_number,
        candidate_personal_mail_id: createForm.candidate_personal_mail_id,
        joining_status: createForm.joining_status,
        genre: createForm.genre,
        role_type: createForm.role_type,
        role_assign: createForm.role_assign,
        qualification: createForm.qualification,
        department: 'OTHERS' // Default department
      });
      
      // If role_type is trainee, show trainer selection
      if (createForm.role_type === 'trainee') {
        setCreatedJoiner(response.data.joiner);
        await fetchTrainers();
        setShowTrainerSelection(true);
        setIsCreating(false);
        return;
      }
      
      // For other roles, reset form and close modal
      setCreateForm({ 
        author_id: '', 
        date_of_joining: '', 
        candidate_name: '', 
        phone_number: '', 
        candidate_personal_mail_id: '', 
        ...commonTrainerData, // Reset to common trainer data
        password: '' 
      });
      setShowCreateForm(false);
      fetchAllUsers(); // Refresh the list
      alert('Joiner account created successfully!');
    } catch (error) {
      console.error('Error creating account:', error);
      alert(error.response?.data?.message || 'Failed to create account');
    } finally {
      setIsCreating(false);
    }
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-bold text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600">Manage users, roles, and account status</p>
          </div>
          <button
            onClick={() => {
              // Pre-populate form with common trainer data
              setCreateForm({
                author_id: '',
                date_of_joining: new Date().toISOString().split('T')[0], // Today's date
                candidate_name: '',
                phone_number: '',
                candidate_personal_mail_id: '',
                ...commonTrainerData, // Spread common trainer data
                password: ''
              });
              setShowCreateForm(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Create New Account
          </button>
        </div>
      </div>

      {/* User Stats Section */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{statistics.total}</div>
              <div className="text-sm text-gray-500">Total Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {statistics.active}
              </div>
              <div className="text-sm text-gray-500">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {statistics.inactive}
              </div>
              <div className="text-sm text-gray-500">Inactive</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {statistics.trainers}
              </div>
              <div className="text-sm text-gray-500">Trainers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {statistics.trainees}
              </div>
              <div className="text-sm text-gray-500">Trainees</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {statistics.admins}
              </div>
              <div className="text-sm text-gray-500">Admins</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Search & Filter Users</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <LuSearch className="inline w-4 h-4 mr-1" />
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => {
                    e.preventDefault();
                    setSearchTerm(e.target.value);
                    // Don't reset page here - let debounce handle it
                  }}
                  onKeyDown={(e) => {
                    // Prevent form submission on Enter key
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <LuSearch className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <LuFilter className="inline w-4 h-4 mr-1" />
                Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1); // Reset to first page when filtering
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="master_trainer">Master Trainer</option>
                <option value="trainer">Trainer</option>
                <option value="trainee">Trainee</option>
                <option value="boa">BOA</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1); // Reset to first page when filtering
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="pending_assignment">Pending Assignment</option>
                <option value="inactive">Inactive</option>
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
                  setRoleFilter('');
                  setStatusFilter('');
                  setCurrentPage(1); // Reset to first page when clearing filters
                }}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              All Users ({filteredUsers.length})
            </h3>
            <div className="text-sm text-gray-500">
              Showing {filteredUsers.length} of {totalUsers} users
              {debouncedSearchTerm && (
                <span className="ml-2 text-blue-600">
                  • Searching for "{debouncedSearchTerm}"
                </span>
              )}
            </div>
          </div>
        </div>
        
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <LuUserX className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {allUsers.length === 0 ? 'No Users Found' : 'No Users Match Your Search'}
            </h3>
            <p className="text-gray-500">
              {allUsers.length === 0 
                ? 'No users are currently registered in the system' 
                : 'Try adjusting your search criteria or filters'
              }
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
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deactivation Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
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
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'master_trainer' ? 'bg-indigo-100 text-indigo-800' :
                        user.role === 'trainer' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'trainee' ? 'bg-green-100 text-green-800' :
                        user.role === 'boa' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role?.replace('_', ' ').toUpperCase() || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        !user.isActive ? 'bg-red-100 text-red-800' :
                        user.status === 'pending_assignment' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {!user.isActive ? 'Inactive' :
                         user.status === 'pending_assignment' ? 'Pending Assignment' :
                         'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.author_id || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {!user.isActive && user.deactivationReason ? (
                        <div className="max-w-xs">
                          <div className="text-xs text-gray-600 mb-1">
                            {user.deactivatedAt ? new Date(user.deactivatedAt).toLocaleDateString() : 'Unknown date'}
                          </div>
                          <div className="text-xs text-gray-800 truncate" title={user.deactivationReason}>
                            {user.deactivationReason}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handlePromoteUser(user._id, user.role)}
                        className="text-blue-600 hover:text-blue-900 cursor-pointer"
                        title="Promote User"
                      >
                        <LuUserPlus className="w-4 h-4" />
                      </button>
                      {user.isActive ? (
                        <button
                          onClick={() => handleDeactivateUser(user._id, user.name)}
                          className="text-red-600 hover:text-red-900 cursor-pointer"
                          title="Deactivate User"
                        >
                          <LuUserX className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivateUser(user._id)}
                          className="text-green-600 hover:text-green-900 cursor-pointer"
                          title="Activate User"
                        >
                          <LuUserCheck className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {/* Smart pagination with ellipsis */}
              {(() => {
                const pages = [];
                const maxVisible = 7; // Maximum number of page buttons to show
                
                if (totalPages <= maxVisible) {
                  // Show all pages if total is small
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(i);
                  }
                } else {
                  // Always show first page
                  pages.push(1);
                  
                  if (currentPage <= 4) {
                    // Near the beginning: 1 2 3 4 5 ... last
                    for (let i = 2; i <= 5; i++) {
                      pages.push(i);
                    }
                    pages.push('ellipsis');
                    pages.push(totalPages);
                  } else if (currentPage >= totalPages - 3) {
                    // Near the end: 1 ... (n-4) (n-3) (n-2) (n-1) n
                    pages.push('ellipsis');
                    for (let i = totalPages - 4; i <= totalPages; i++) {
                      pages.push(i);
                    }
                  } else {
                    // In the middle: 1 ... (current-1) current (current+1) ... last
                    pages.push('ellipsis');
                    pages.push(currentPage - 1);
                    pages.push(currentPage);
                    pages.push(currentPage + 1);
                    pages.push('ellipsis');
                    pages.push(totalPages);
                  }
                }
                
                return pages.map((page, index) => {
                  if (page === 'ellipsis') {
                    return (
                      <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                        ...
                      </span>
                    );
                  }
                  
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 border rounded-md text-sm font-medium ${
                        currentPage === page
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                });
              })()}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Account Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Create New Trainer Account</h3>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Common trainer fields are pre-filled. You can modify them as needed.
              </p>
            </div>
            
            <form onSubmit={handleCreateAccount} className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Author ID *</label>
                  <input
                    type="text"
                    value={createForm.author_id}
                    onChange={(e) => setCreateForm({ ...createForm, author_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter author ID"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Joining</label>
                  <input
                    type="date"
                    value={createForm.date_of_joining}
                    onChange={(e) => setCreateForm({ ...createForm, date_of_joining: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Candidate Name *</label>
                <input
                  type="text"
                  value={createForm.candidate_name}
                  onChange={(e) => setCreateForm({ ...createForm, candidate_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter candidate name"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={createForm.phone_number}
                    onChange={(e) => setCreateForm({ ...createForm, phone_number: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Personal Email *</label>
                  <input
                    type="email"
                    value={createForm.candidate_personal_mail_id}
                    onChange={(e) => setCreateForm({ ...createForm, candidate_personal_mail_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter personal email"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Joining Status</label>
                  <select
                    value={createForm.joining_status}
                    onChange={(e) => setCreateForm({ ...createForm, joining_status: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-blue-50"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                  <select
                    value={createForm.genre}
                    onChange={(e) => setCreateForm({ ...createForm, genre: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-blue-50"
                  >
                    <option value="">Select genre</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role Type</label>
                  <select
                    value={createForm.role_type}
                    onChange={(e) => setCreateForm({ ...createForm, role_type: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-blue-50"
                  >
                    <option value="trainee">Trainee</option>
                    <option value="trainer">Trainer</option>
                    <option value="master_trainer">Master Trainer</option>
                    <option value="boa">BOA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role Assign</label>
                  <input
                    type="text"
                    value={createForm.role_assign}
                    onChange={(e) => setCreateForm({ ...createForm, role_assign: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-blue-50"
                    placeholder="Enter role assignment"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Qualification</label>
                <input
                  type="text"
                  value={createForm.qualification}
                  onChange={(e) => setCreateForm({ ...createForm, qualification: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-blue-50"
                  placeholder="Enter qualification"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setCreateForm({ 
                      author_id: '', 
                      date_of_joining: '', 
                      candidate_name: '', 
                      phone_number: '', 
                      candidate_personal_mail_id: '', 
                      ...commonTrainerData, // Reset to common trainer data
                      password: '' 
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isCreating ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Trainer Selection Modal */}
      {showTrainerSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Assign Trainer to Trainee</h3>
            
            {createdJoiner && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Trainee:</strong> {createdJoiner.candidate_name} ({createdJoiner.candidate_personal_mail_id})
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Trainer</label>
              <select
                value={selectedTrainer}
                onChange={(e) => setSelectedTrainer(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Choose a trainer...</option>
                {trainers.map((trainer) => (
                  <option key={trainer._id} value={trainer.author_id}>
                    {trainer.name} ({trainer.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleSkipTrainerAssignment}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Skip for Now
              </button>
              <button
                type="button"
                onClick={handleAssignTrainer}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Assign Trainer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountActivation;
