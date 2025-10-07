import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import { LuUsers, LuUserCheck, LuPlus, LuUserPlus, LuChevronDown, LuSearch, LuX } from "react-icons/lu";
import UserCard from "../../components/Cards/UserCard";
import { toast } from "react-hot-toast";

const ManageUsers = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [filteredTrainers, setFilteredTrainers] = useState([]);
  const [filteredTrainees, setFilteredTrainees] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null); // 'trainers', 'trainees', null
  const [trainerSearchTerm, setTrainerSearchTerm] = useState('');
  const [traineeSearchTerm, setTraineeSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Assignment popup states
  const [showAssignPopup, setShowAssignPopup] = useState(false);
  const [assignmentStep, setAssignmentStep] = useState('select-trainees'); // 'select-trainees', 'select-trainer'
  const [selectedTrainees, setSelectedTrainees] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [unassignedTrainees, setUnassignedTrainees] = useState([]);
  const [assignmentSearchTerm, setAssignmentSearchTerm] = useState('');
  const [filteredUnassignedTrainees, setFilteredUnassignedTrainees] = useState([]);

  const getAllUsers = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);
      if (response.data?.length > 0) {
        setAllUsers(response.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const getTrainers = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.USERS.LIST, {
        params: { role: 'trainer' }
      });
      setTrainers(response.data.users || []);
    } catch (error) {
      console.error("Error fetching trainers:", error);
    }
  };

  const getTrainees = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.USERS.LIST, {
        params: { role: 'trainee' }
      });
      setTrainees(response.data.users || []);
    } catch (error) {
      console.error("Error fetching trainees:", error);
    }
  };

  const getUnassignedTrainees = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.USERS.LIST, {
        params: { role: 'trainee', unassigned: 'true' }
      });
      setUnassignedTrainees(response.data.users || []);
    } catch (error) {
      console.error("Error fetching unassigned trainees:", error);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      getAllUsers(),
      getTrainers(),
      getTrainees(),
      getUnassignedTrainees()
    ]);
    setLoading(false);
  };

  // Filter trainers based on search term
  useEffect(() => {
    if (trainerSearchTerm) {
      const filtered = trainers.filter(trainer =>
        trainer.name?.toLowerCase().includes(trainerSearchTerm.toLowerCase()) ||
        trainer.email?.toLowerCase().includes(trainerSearchTerm.toLowerCase()) ||
        trainer.employeeId?.toLowerCase().includes(trainerSearchTerm.toLowerCase())
      );
      setFilteredTrainers(filtered);
    } else {
      setFilteredTrainers(trainers);
    }
  }, [trainers, trainerSearchTerm]);

  // Filter trainees based on search term
  useEffect(() => {
    if (traineeSearchTerm) {
      const filtered = trainees.filter(trainee =>
        trainee.name?.toLowerCase().includes(traineeSearchTerm.toLowerCase()) ||
        trainee.email?.toLowerCase().includes(traineeSearchTerm.toLowerCase()) ||
        trainee.employeeId?.toLowerCase().includes(traineeSearchTerm.toLowerCase())
      );
      setFilteredTrainees(filtered);
    } else {
      setFilteredTrainees(trainees);
    }
  }, [trainees, traineeSearchTerm]);

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

  useEffect(() => {
    loadAllData();
  }, []);

  // Management functions
  const handleAssignTrainees = () => {
    setShowAssignPopup(true);
    setAssignmentStep('select-trainees');
    setSelectedTrainees([]);
    setSelectedTrainer(null);
    setAssignmentSearchTerm('');
    
    // Fetch unassigned trainees when opening the popup
    getUnassignedTrainees();
  };

  const handleTraineeSelection = (traineeId) => {
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

  const handleTrainerSelection = (trainerId) => {
    setSelectedTrainer(trainerId);
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
        notes: `Assignment created by Master Trainer`,
        instructions: `Please provide training and guidance to assigned trainees`
      });

      const { isUpdate, totalTrainees, newlyAssigned } = response.data;
      
      if (isUpdate) {
        toast.success(`Successfully updated assignment! Trainer now has ${totalTrainees} total trainees (${newlyAssigned} newly assigned)`);
      } else {
        toast.success(`Successfully assigned ${selectedTrainees.length} trainee(s) to trainer`);
      }
      setShowAssignPopup(false);
      setAssignmentStep('select-trainees');
      setSelectedTrainees([]);
      setSelectedTrainer(null);
      setAssignmentSearchTerm('');
      
      // Refresh data
      loadAllData();
      // Specifically refresh unassigned trainees
      getUnassignedTrainees();
    } catch (error) {
      console.error("Error creating assignment:", error);
      console.error("Error details:", error.response?.data);
      const errorMessage = error.response?.data?.message || "Failed to create assignment";
      toast.error(errorMessage);
    }
  };

  const handleCloseAssignPopup = () => {
    setShowAssignPopup(false);
    setAssignmentStep('select-trainees');
    setSelectedTrainees([]);
    setSelectedTrainer(null);
    setAssignmentSearchTerm('');
  };

  if (loading) {
    return (
      <DashboardLayout activeMenu="Team Members">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeMenu="Team Members">
      <div className="mt-5 mb-10">
        <div className="flex md:flex-row md:items-center justify-between">
          <h2 className="text-xl md:text-xl font-medium">Team Members</h2>
        </div>

        {/* Dropdowns */}
        <div className="card mt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Trainers Dropdown */}
            <div className="flex-1 relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'trainers' ? null : 'trainers')}
                className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <LuUsers className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Trainers</span>
                  <span className="bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {trainers.length}
                  </span>
                </div>
                <LuChevronDown className={`w-4 h-4 text-blue-600 transition-transform ${
                  activeDropdown === 'trainers' ? 'rotate-180' : ''
                }`} />
              </button>

              {/* Trainers Dropdown Content */}
              {activeDropdown === 'trainers' && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {/* Search Bar */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                      <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search trainers..."
                        value={trainerSearchTerm}
                        onChange={(e) => setTrainerSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {trainerSearchTerm && (
                        <button
                          onClick={() => setTrainerSearchTerm('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <LuX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Trainers List */}
                  <div className="max-h-96 overflow-y-auto">
                    {filteredTrainers.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        {trainerSearchTerm ? 'No trainers found matching your search.' : 'No trainers available.'}
                      </div>
                    ) : (
                      <div className="p-2">
                        {filteredTrainers.map((trainer) => (
                          <div key={trainer._id} className="p-3 hover:bg-gray-50 rounded-lg">
                            <UserCard userInfo={trainer} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Trainees Dropdown */}
            <div className="flex-1 relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'trainees' ? null : 'trainees')}
                className="w-full flex items-center justify-between px-4 py-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <LuUserCheck className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-900">Trainees</span>
                  <span className="bg-green-200 text-green-800 text-xs px-2 py-1 rounded-full">
                    {trainees.length}
                  </span>
                </div>
                <LuChevronDown className={`w-4 h-4 text-green-600 transition-transform ${
                  activeDropdown === 'trainees' ? 'rotate-180' : ''
                }`} />
              </button>

              {/* Trainees Dropdown Content */}
              {activeDropdown === 'trainees' && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {/* Search Bar */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                      <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search trainees..."
                        value={traineeSearchTerm}
                        onChange={(e) => setTraineeSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      {traineeSearchTerm && (
                        <button
                          onClick={() => setTraineeSearchTerm('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <LuX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Trainees List */}
                  <div className="max-h-96 overflow-y-auto">
                    {filteredTrainees.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        {traineeSearchTerm ? 'No trainees found matching your search.' : 'No trainees available.'}
                      </div>
                    ) : (
                      <div className="p-2">
                        {filteredTrainees.map((trainee) => (
                          <div key={trainee._id} className="p-3 hover:bg-gray-50 rounded-lg">
                            <UserCard userInfo={trainee} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Management Actions */}
        <div className="card mt-6">
          <div className="flex items-center justify-center">
            <button
              onClick={handleAssignTrainees}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center"
            >
              <LuUserPlus className="w-4 h-4 mr-2" />
              Assign Trainees
            </button>
          </div>
        </div>

        {/* Click outside to close dropdowns */}
        {activeDropdown && (
          <div 
            className="fixed inset-0 z-0" 
            onClick={() => setActiveDropdown(null)}
          />
        )}

        {/* Assignment Popup */}
        {showAssignPopup && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Assign Trainees</h3>
                <button
                  onClick={handleCloseAssignPopup}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <LuX className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {assignmentStep === 'select-trainees' ? (
                  <div>
                    {/* Trainee Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-600">{trainees.length}</div>
                        <div className="text-sm text-blue-800">Total Trainees</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">{trainees.length - unassignedTrainees.length}</div>
                        <div className="text-sm text-green-800">Assigned Trainees</div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-orange-600">{unassignedTrainees.length}</div>
                        <div className="text-sm text-orange-800">Unassigned Trainees</div>
                      </div>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-4">
                      <div className="relative">
                        <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search unassigned trainees..."
                          value={assignmentSearchTerm}
                          onChange={(e) => setAssignmentSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        {assignmentSearchTerm && (
                          <button
                            onClick={() => setAssignmentSearchTerm('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <LuX className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Unassigned Trainees List */}
                    <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                      {filteredUnassignedTrainees.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          {assignmentSearchTerm ? 'No unassigned trainees found matching your search.' : 'No unassigned trainees available.'}
                        </div>
                      ) : (
                        <div className="p-2">
                          {filteredUnassignedTrainees.map((trainee) => (
                            <div key={trainee._id} className="flex items-center p-3 hover:bg-gray-50 rounded-lg">
                              <input
                                type="checkbox"
                                checked={selectedTrainees.includes(trainee._id)}
                                onChange={() => handleTraineeSelection(trainee._id)}
                                className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                              />
                              <div className="flex items-center flex-1">
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                                  {trainee.profilePhoto ? (
                                    <img
                                      src={trainee.profilePhoto}
                                      alt={trainee.name}
                                      className="w-10 h-10 rounded-full object-cover"
                                    />
                                  ) : (
                                    <LuUserCheck className="w-5 h-5 text-gray-500" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{trainee.name}</div>
                                  <div className="text-sm text-gray-500">{trainee.email}</div>
                                  {trainee.employeeId && (
                                    <div className="text-xs text-gray-400">ID: {trainee.employeeId}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Add Button */}
                    <div className="flex justify-center mt-6">
                      <button
                        onClick={handleAddSelectedTrainees}
                        disabled={selectedTrainees.length === 0}
                        className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg flex items-center gap-2"
                      >
                        <LuPlus className="w-4 h-4" />
                        Add Selected Trainees ({selectedTrainees.length})
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Selected Trainees Summary */}
                    <div className="mb-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Selected Trainees ({selectedTrainees.length})</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex flex-wrap gap-2">
                          {selectedTrainees.map(traineeId => {
                            const trainee = unassignedTrainees.find(t => t._id === traineeId);
                            return trainee ? (
                              <span key={traineeId} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                                {trainee.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Trainer Selection */}
                    <div className="mb-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Select Trainer</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {trainers.map((trainer) => (
                          <div
                            key={trainer._id}
                            onClick={() => handleTrainerSelection(trainer._id)}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                              selectedTrainer === trainer._id
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center">
                              <input
                                type="radio"
                                checked={selectedTrainer === trainer._id}
                                onChange={() => handleTrainerSelection(trainer._id)}
                                className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500"
                              />
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                                {trainer.profilePhoto ? (
                                  <img
                                    src={trainer.profilePhoto}
                                    alt={trainer.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <LuUsers className="w-5 h-5 text-gray-500" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{trainer.name}</div>
                                <div className="text-sm text-gray-500">{trainer.email}</div>
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
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleSubmitAssignment}
                        disabled={!selectedTrainer}
                        className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg"
                      >
                        Submit ...
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ManageUsers;
