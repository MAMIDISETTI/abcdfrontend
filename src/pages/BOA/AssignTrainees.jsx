import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { LuUsers, LuUserCheck, LuSearch, LuPlus, LuX, LuEye, LuCheck, LuRefreshCw } from 'react-icons/lu';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import TrainersPopup from '../../components/TrainersPopup';
import TraineesPopup from '../../components/TraineesPopup';

const AssignTrainees = () => {
  const [trainees, setTrainees] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [unassignedTrainees, setUnassignedTrainees] = useState([]);
  const [filteredTrainees, setFilteredTrainees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrainees, setSelectedTrainees] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [assignmentStep, setAssignmentStep] = useState('select-trainees');
  const [assignmentSearchTerm, setAssignmentSearchTerm] = useState('');
  const [filteredUnassignedTrainees, setFilteredUnassignedTrainees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Popup states
  const [showTrainersPopup, setShowTrainersPopup] = useState(false);
  const [showTraineesPopup, setShowTraineesPopup] = useState(false);
  const [showAssignedTraineesPopup, setShowAssignedTraineesPopup] = useState(false);
  const [showUnassignedTraineesPopup, setShowUnassignedTraineesPopup] = useState(false);
  const [assignedTrainees, setAssignedTrainees] = useState([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch all data
  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        getTrainees(),
        getTrainers(),
        getUnassignedTrainees(),
        getAssignedTrainees()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Refresh data function
  const refreshData = () => {
    loadAllData();
  };

  // Fetch trainees data
  const getTrainees = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.USERS.LIST, {
        params: { role: 'trainee' }
      });
      const traineesData = response.data.users || response.data || [];
      setTrainees(traineesData);
    } catch (error) {
      console.error('Error fetching trainees:', error);
      toast.error('Failed to fetch trainees data');
    }
  };

  // Fetch trainers data
  const getTrainers = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.USERS.LIST, {
        params: { role: 'trainer' }
      });
      const trainersData = response.data.users || response.data || [];
      setTrainers(trainersData);
    } catch (error) {
      console.error('Error fetching trainers:', error);
      toast.error('Failed to fetch trainers data');
    }
  };

  // Fetch unassigned trainees data
  const getUnassignedTrainees = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.USERS.LIST, {
        params: { role: 'trainee', unassigned: 'true' }
      });
      const unassignedData = response.data.users || response.data || [];
      setUnassignedTrainees(unassignedData);
    } catch (error) {
      console.error('Error fetching unassigned trainees:', error);
      toast.error('Failed to fetch unassigned trainees data');
    }
  };

  // Fetch assigned trainees data
  const getAssignedTrainees = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.USERS.LIST, {
        params: { role: 'trainee' }
      });
      
      // Filter for assigned trainees (those with assignedTrainer)
      const allTrainees = response.data.users || response.data || [];
      const assignedTraineesData = allTrainees.filter(trainee => trainee.assignedTrainer);
      setAssignedTrainees(assignedTraineesData);
      
      // Debug logging
      // console.log('All trainees:', allTrainees.length);
      // console.log('Assigned trainees:', assignedTraineesData.length);
      // console.log('Unassigned trainees:', unassignedTrainees.length);
    } catch (error) {
      console.error('Error fetching assigned trainees:', error);
      toast.error('Failed to fetch assigned trainees data');
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Auto-refresh every 30 seconds to catch updates
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Filter trainees based on search term and pagination
  useEffect(() => {
    let filtered = trainees;
    
    if (searchTerm) {
      filtered = trainees.filter(trainee =>
        trainee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainee.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredTrainees(filtered);
    
    // Calculate total pages
    const total = Math.ceil(filtered.length / itemsPerPage);
    setTotalPages(total);
    
    // Reset to first page if current page is beyond total pages
    if (currentPage > total && total > 0) {
      setCurrentPage(1);
    }
  }, [searchTerm, trainees, itemsPerPage, currentPage]);

  // Pagination helper functions
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTrainees.slice(startIndex, endIndex);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Filter unassigned trainees for assignment popup
  useEffect(() => {
    if (assignmentSearchTerm) {
      const filtered = unassignedTrainees.filter(trainee =>
        trainee.name?.toLowerCase().includes(assignmentSearchTerm.toLowerCase()) ||
        trainee.email?.toLowerCase().includes(assignmentSearchTerm.toLowerCase()) ||
        trainee.employeeId?.toLowerCase().includes(assignmentSearchTerm.toLowerCase())
      );
      setFilteredUnassignedTrainees(filtered);
    } else {
      setFilteredUnassignedTrainees(unassignedTrainees);
    }
  }, [unassignedTrainees, assignmentSearchTerm]);

  // Assignment functions
  const handleAssignTrainees = () => {
    setShowAssignModal(true);
    
    // If trainees are already selected, go directly to trainer selection
    if (selectedTrainees.length > 0) {
      setAssignmentStep('select-trainer');
    } else {
      setAssignmentStep('select-trainees');
      setSelectedTrainees([]);
    }
    
    setSelectedTrainer('');
    setAssignmentSearchTerm('');
    
    // Fetch unassigned trainees when opening the popup
    getUnassignedTrainees();
    
    // Debug logging
  };

  const handleTraineeSelection = (traineeId) => {
    // Find the trainee to check if they're already assigned
    const trainee = trainees.find(t => t.author_id === traineeId);
    if (trainee && trainee.assignedTrainer) {
      toast.error('This trainee is already assigned to a trainer and cannot be reassigned.');
      return;
    }
    
    setSelectedTrainees(prev => {
      if (prev.includes(traineeId)) {
        return prev.filter(id => id !== traineeId);
      } else {
        return [...prev, traineeId];
      }
    });
  };

  const handleAddSelectedTrainees = () => {
    if (selectedTrainees.length === 0) {
      toast.error("Please select at least one trainee");
      return;
    }
    setAssignmentStep('select-trainer');
  };

  const handleTrainerSelection = (trainer) => {
    setSelectedTrainer(trainer.author_id || trainer._id);
  };

  const handleSubmitAssignment = async () => {
    if (!selectedTrainer) {
      toast.error("Please select a trainer");
      return;
    }

    if (selectedTrainees.length === 0) {
      toast.error("Please select at least one trainee");
      return;
    }

    try {
      // Create assignment with all selected trainees at once
      const response = await axiosInstance.post(API_PATHS.ASSIGNMENTS.CREATE, {
        trainerId: selectedTrainer,
        traineeIds: selectedTrainees,
        effectiveDate: new Date().toISOString(),
        notes: `Assignment created by BOA`,
        instructions: `Please provide training and guidance to assigned trainees`
      });

      const { isUpdate, totalTrainees, newlyAssigned } = response.data;
      
      if (isUpdate) {
        toast.success(`Successfully updated assignment! Trainer now has ${totalTrainees} total trainees (${newlyAssigned} newly assigned)`);
      } else {
        toast.success(`Successfully assigned ${selectedTrainees.length} trainee(s) to trainer`);
      }
      
      setShowAssignModal(false);
      setAssignmentStep('select-trainees');
      setSelectedTrainees([]);
      setSelectedTrainer('');
      setAssignmentSearchTerm('');
      
      // Refresh data
      loadAllData();
    } catch (error) {
      console.error("Error creating assignment:", error);
      const errorMessage = error.response?.data?.message || "Failed to create assignment";
      toast.error(errorMessage);
    }
  };

  const handleCloseAssignModal = () => {
    setShowAssignModal(false);
    setAssignmentStep('select-trainees');
    setSelectedTrainees([]);
    setSelectedTrainer('');
    setAssignmentSearchTerm('');
  };

  const handleIndividualAssign = (traineeId) => {
    setSelectedTrainees([traineeId]);
    setShowAssignModal(true);
    setAssignmentStep('select-trainer');
  };

  // Popup handlers
  const handleTrainersClick = () => {
    setShowTrainersPopup(true);
    if (trainers.length === 0) {
      getTrainers();
    }
  };

  const handleTraineesClick = () => {
    setShowTraineesPopup(true);
    if (trainees.length === 0) {
      getTrainees();
    }
  };

  const handleAssignedTraineesClick = () => {
    setShowAssignedTraineesPopup(true);
    if (assignedTrainees.length === 0) {
      getAssignedTrainees();
    }
  };

  const handleUnassignedTraineesClick = () => {
    setShowUnassignedTraineesPopup(true);
    if (unassignedTrainees.length === 0) {
      getUnassignedTrainees();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Pending Assignment':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <DashboardLayout activeMenu="Assign Trainees">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeMenu="Assign Trainees">
      <div className="mt-5 mb-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Assign Trainees</h2>
          
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <button
              onClick={refreshData}
              disabled={loading}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LuRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <button
              onClick={handleAssignTrainees}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <LuPlus className="w-4 h-4" />
              <span>{selectedTrainees.length > 0 ? `Assign Selected (${selectedTrainees.length})` : 'Assign Trainees'}</span>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card cursor-pointer hover:shadow-lg transition-shadow" onClick={handleTraineesClick}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Trainees</p>
                <p className="text-2xl font-bold text-blue-600">{trainees.length}</p>
              </div>
              <LuUsers className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="card cursor-pointer hover:shadow-lg transition-shadow" onClick={handleTrainersClick}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Trainers</p>
                <p className="text-2xl font-bold text-purple-600">{trainers.length}</p>
              </div>
              <LuUserCheck className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="card cursor-pointer hover:shadow-lg transition-shadow" onClick={handleAssignedTraineesClick}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assigned Trainees</p>
                <p className="text-2xl font-bold text-green-600">{assignedTrainees.length}</p>
              </div>
              <LuUserCheck className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="card cursor-pointer hover:shadow-lg transition-shadow" onClick={handleUnassignedTraineesClick}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unassigned Trainees</p>
                <p className="text-2xl font-bold text-orange-600">{unassignedTrainees.length}</p>
              </div>
              <LuUsers className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="card mb-6">
          <div className="relative">
            <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search trainees by name, email, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Trainees List */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={getCurrentPageData().filter(t => !t.assignedTrainer).every(t => selectedTrainees.includes(t.author_id)) && getCurrentPageData().filter(t => !t.assignedTrainer).length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          // Only select unassigned trainees
                          const unassignedTraineeIds = getCurrentPageData().filter(t => !t.assignedTrainer).map(t => t.author_id);
                          setSelectedTrainees(prev => [...new Set([...prev, ...unassignedTraineeIds])]);
                        } else {
                          const currentPageIds = getCurrentPageData().map(t => t.author_id);
                          setSelectedTrainees(prev => prev.filter(id => !currentPageIds.includes(id)));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Trainee Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Current Trainer</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Department</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getCurrentPageData().map((trainee) => {
                  // Debug logging for assignedTrainer
                  if (trainee.assignedTrainer) {
                  }
                  return (
                  <tr key={trainee.author_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedTrainees.includes(trainee.author_id)}
                        onChange={() => handleTraineeSelection(trainee.author_id)}
                        disabled={trainee.assignedTrainer}
                        className="rounded border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-xs">
                            {trainee.name?.split(' ').map(n => n[0]).join('') || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{trainee.name}</p>
                          <p className="text-sm text-gray-500">{trainee.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {trainee.assignedTrainer ? (
                        <span className="text-gray-900">
                          {typeof trainee.assignedTrainer === 'object' 
                            ? trainee.assignedTrainer.name || 'Assigned'
                            : 'Assigned'
                          }
                        </span>
                      ) : (
                        <span className="text-gray-400">Not assigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trainee.assignedTrainer ? 'Active' : 'Pending Assignment')}`}>
                        {trainee.assignedTrainer ? 'Active' : 'Pending Assignment'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{trainee.department || 'N/A'}</td>
                    <td className="py-3 px-4">
                      {trainee.assignedTrainer ? (
                        <span className="text-gray-500 text-sm">
                          Already Assigned
                        </span>
                      ) : (
                        <button
                          onClick={() => handleIndividualAssign(trainee.author_id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
                        >
                          <LuPlus className="w-3 h-3" />
                          <span>Assign Trainer</span>
                        </button>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center text-sm text-gray-700">
                <span>
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTrainees.length)} of {filteredTrainees.length} results
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show only a few pages around current page
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 text-sm font-medium rounded-md ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return <span key={page} className="px-1 text-gray-500">...</span>;
                    }
                    return null;
                  })}
                </div>
                
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Assignment Popup */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Assign Trainees</h3>
                <button
                  onClick={handleCloseAssignModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <LuX className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {assignmentStep === 'select-trainees' ? (
                  <div>
                    {/* Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-600">{trainees.length}</div>
                        <div className="text-sm text-blue-800">Total Trainees</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-purple-600">{trainers.length}</div>
                        <div className="text-sm text-purple-800">Total Trainers</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">{assignedTrainees.length}</div>
                        <div className="text-sm text-green-800">Assigned Trainees</div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-orange-600">{unassignedTrainees.length}</div>
                        <div className="text-sm text-orange-800">Unassigned Trainees</div>
                      </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-6">
                      <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search unassigned trainees..."
                        value={assignmentSearchTerm}
                        onChange={(e) => setAssignmentSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Unassigned Trainees List */}
                    <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                      {filteredUnassignedTrainees.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          {unassignedTrainees.length === 0 ? 'No unassigned trainees' : 'No trainees match your search'}
                        </div>
                      ) : (
                        <div className="space-y-2 p-4">
                          {filteredUnassignedTrainees.map((trainee) => {
                            const isSelected = selectedTrainees.includes(trainee.author_id);
                            return (
                            <div
                              key={trainee.author_id}
                              className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-blue-50 border-blue-200'
                                  : 'bg-white border-gray-200 hover:bg-gray-50'
                              }`}
                              onClick={() => handleTraineeSelection(trainee.author_id)}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleTraineeSelection(trainee.author_id)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-xs">
                                  {trainee.name?.split(' ').map(n => n[0]).join('') || 'U'}
                                </span>
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{trainee.name}</p>
                                <p className="text-sm text-gray-500">{trainee.email}</p>
                                <p className="text-xs text-gray-400">{trainee.department} • {trainee.employeeId}</p>
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Next Button */}
                    <div className="flex justify-end mt-6">
                      <button
                        onClick={handleAddSelectedTrainees}
                        disabled={selectedTrainees.length === 0}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                      >
                        <span>Add Selected Trainees ({selectedTrainees.length})</span>
                        <LuPlus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Selected Trainees */}
                    <div className="mb-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        Selected Trainees ({selectedTrainees.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedTrainees.map(traineeId => {
                          const trainee = trainees.find(t => t.author_id === traineeId);
                          return trainee ? (
                            <span key={traineeId} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                              {trainee.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>

                    {/* Trainer Selection */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Trainer
                      </label>
                      <div className="space-y-3">
                        {trainers.map((trainer) => (
                          <div
                            key={trainer._id}
                            onClick={() => handleTrainerSelection(trainer)}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                              selectedTrainer === (trainer.author_id || trainer._id)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <input
                                  type="radio"
                                  checked={selectedTrainer === (trainer.author_id || trainer._id)}
                                  onChange={() => handleTrainerSelection(trainer)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                  <span className="text-white font-semibold text-xs">
                                    {trainer.name?.split(' ').map(n => n[0]).join('') || 'T'}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{trainer.name}</p>
                                  <p className="text-sm text-gray-500">{trainer.email}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between">
                      <button
                        onClick={() => setAssignmentStep('select-trainees')}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Back to Trainees
                      </button>
                      <button
                        onClick={handleSubmitAssignment}
                        disabled={!selectedTrainer}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                      >
                        <LuCheck className="w-4 h-4" />
                        <span>Submit Assignment</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Popups */}
        <TrainersPopup
          isOpen={showTrainersPopup}
          onClose={() => setShowTrainersPopup(false)}
          trainers={trainers}
          isLoading={loading}
        />

        <TraineesPopup
          isOpen={showTraineesPopup}
          onClose={() => setShowTraineesPopup(false)}
          trainees={trainees}
          title="Total Trainees"
          isLoading={loading}
        />

        <TraineesPopup
          isOpen={showAssignedTraineesPopup}
          onClose={() => setShowAssignedTraineesPopup(false)}
          trainees={assignedTrainees}
          title="Assigned Trainees"
          isLoading={loading}
        />

        <TraineesPopup
          isOpen={showUnassignedTraineesPopup}
          onClose={() => setShowUnassignedTraineesPopup(false)}
          trainees={unassignedTrainees}
          title="Unassigned Trainees"
          isLoading={loading}
        />
      </div>
    </DashboardLayout>
  );
};

export default AssignTrainees;
