import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../../context/userContext';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { 
  LuMapPin, 
  LuUsers, 
  LuCheck, 
  LuX, 
  LuCalendar,
  LuUser,
  LuBuilding,
  LuSearch,
  LuFilter,
  LuPlus,
  LuPencil,
  LuTrash2,
  LuLoader
} from 'react-icons/lu';

const CampusAllocation = () => {
  const { user } = useContext(UserContext);
  const [trainees, setTrainees] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const [selectedCampus, setSelectedCampus] = useState('');
  const [allocationDate, setAllocationDate] = useState('');
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [showCampusModal, setShowCampusModal] = useState(false);
  const [newCampus, setNewCampus] = useState({ name: '', location: '', capacity: '' });
  const [isAllocating, setIsAllocating] = useState(false);

  useEffect(() => {
    fetchTrainees();
    fetchCampuses();
    fetchAllocations();
  }, []);

  const fetchTrainees = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.USERS.LIST, {
        params: { role: 'trainee' }
      });
      if (response.data.users) {
        const trainees = response.data.users;
        
        // Fetch allocations to determine campus allocation status
        try {
          const allocationResponse = await axiosInstance.get(API_PATHS.ALLOCATION.GET_ALL);
          if (allocationResponse.data.success && allocationResponse.data.allocations) {
            // Create a map of trainee ID to campus name
            const allocationMap = {};
            allocationResponse.data.allocations.forEach(allocation => {
              allocationMap[allocation.traineeId] = allocation.campusName;
            });
            
            // Add allocatedCampus field to each trainee
            const traineesWithAllocation = trainees.map(trainee => {
              const keyCandidates = [trainee._id, trainee.id, trainee.author_id];
              const matchedKey = keyCandidates.find(k => k && allocationMap[k]);
              return {
                ...trainee,
                allocatedCampus: matchedKey ? allocationMap[matchedKey] : null
              };
            });
            
            setTrainees(traineesWithAllocation);
          } else {
            // If no allocations, set allocatedCampus to null for all trainees
            const traineesWithAllocation = trainees.map(trainee => ({
              ...trainee,
              allocatedCampus: null
            }));
            setTrainees(traineesWithAllocation);
          }
        } catch (allocationError) {
          console.error('Error fetching allocations:', allocationError);
          // If allocation fetch fails, set allocatedCampus to null for all trainees
          const traineesWithAllocation = trainees.map(trainee => ({
            ...trainee,
            allocatedCampus: null
          }));
          setTrainees(traineesWithAllocation);
        }
      } else {
        // Mock data for development
        setTrainees([
          {
            id: '1',
            name: 'John Smith',
            email: 'john.smith@example.com',
            employeeId: 'T001',
            department: 'Software Development',
            status: 'active',
            allocatedCampus: null
          },
          {
            id: '2',
            name: 'Sarah Johnson',
            email: 'sarah.johnson@example.com',
            employeeId: 'T002',
            department: 'Software Development',
            status: 'active',
            allocatedCampus: 'Tech Campus Mumbai'
          },
          {
            id: '3',
            name: 'Mike Wilson',
            email: 'mike.wilson@example.com',
            employeeId: 'T003',
            department: 'Software Development',
            status: 'active',
            allocatedCampus: null
          },
          {
            id: '4',
            name: 'Emily Davis',
            email: 'emily.davis@example.com',
            employeeId: 'T004',
            department: 'Software Development',
            status: 'active',
            allocatedCampus: 'Tech Campus Bangalore'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching trainees:', error);
      setTrainees([]);
    }
  };

  const fetchCampuses = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.CAMPUS.GET_ALL);
      if (response.data.success) {
        setCampuses(response.data.campuses);
      } else {
        // Mock data for development
        setCampuses([
          {
            id: '1',
            name: 'Tech Campus Mumbai',
            location: 'Mumbai, Maharashtra',
            capacity: 50,
            currentAllocations: 25,
            status: 'active'
          },
          {
            id: '2',
            name: 'Tech Campus Bangalore',
            location: 'Bangalore, Karnataka',
            capacity: 75,
            currentAllocations: 40,
            status: 'active'
          },
          {
            id: '3',
            name: 'Tech Campus Delhi',
            location: 'Delhi, NCR',
            capacity: 60,
            currentAllocations: 30,
            status: 'active'
          },
          {
            id: '4',
            name: 'Tech Campus Pune',
            location: 'Pune, Maharashtra',
            capacity: 40,
            currentAllocations: 15,
            status: 'active'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching campuses:', error);
      setCampuses([]);
    }
  };

  const fetchAllocations = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.ALLOCATION.GET_ALL);
      if (response.data.success) {
        setAllocations(response.data.allocations);
      } else {
        // Mock data for development
        setAllocations([
          {
            id: '1',
            traineeId: '2',
            traineeName: 'Sarah Johnson',
            campusId: '1',
            campusName: 'Tech Campus Mumbai',
            allocatedDate: new Date().toISOString(),
            status: 'confirmed',
            deploymentDate: new Date(Date.now() + 2592000000).toISOString()
          },
          {
            id: '2',
            traineeId: '4',
            traineeName: 'Emily Davis',
            campusId: '2',
            campusName: 'Tech Campus Bangalore',
            allocatedDate: new Date(Date.now() - 86400000).toISOString(),
            status: 'confirmed',
            deploymentDate: new Date(Date.now() + 1728000000).toISOString()
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching allocations:', error);
      setAllocations([]);
    }
  };

  const handleAllocateCampus = async () => {
    if (!selectedTrainee || !selectedCampus || !allocationDate) return;

    try {
      setIsAllocating(true);

      const response = await axiosInstance.post(API_PATHS.ALLOCATION.CREATE, {
        traineeId: selectedTrainee.author_id || selectedTrainee._id || selectedTrainee.id,
        campusId: selectedCampus,
        allocatedDate: allocationDate,
        status: 'confirmed'
      });

      if (response.data.success) {
        fetchTrainees();
        fetchAllocations();
        setShowAllocationModal(false);
        setSelectedTrainee(null);
        setSelectedCampus('');
        setAllocationDate('');
      }
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to create allocation';
      console.error('Error allocating campus:', message);
    }
    finally {
      setIsAllocating(false);
    }
  };

  const handleCreateCampus = async () => {
    if (!newCampus.name || !newCampus.location || !newCampus.capacity) return;

    try {
      const response = await axiosInstance.post(API_PATHS.CAMPUS.CREATE, newCampus);
      if (response.data.success) {
        fetchCampuses();
        setShowCampusModal(false);
        setNewCampus({ name: '', location: '', capacity: '' });
      }
    } catch (error) {
      console.error('Error creating campus:', error);
    }
  };

  const handleRemoveAllocation = async (allocationId) => {
    try {
      const response = await axiosInstance.delete(API_PATHS.ALLOCATION.DELETE(allocationId));
      if (response.data.success) {
        fetchTrainees();
        fetchAllocations();
      }
    } catch (error) {
      console.error('Error removing allocation:', error);
    }
  };

  const filteredTrainees = trainees.filter(trainee => {
    const traineeName = (trainee?.name || '').toLowerCase();
    const empId = (trainee?.employeeId || '').toLowerCase();
    const term = (searchTerm || '').toLowerCase();
    const matchesSearch = traineeName.includes(term) || empId.includes(term);
    const isAllocated = Boolean(trainee?.allocatedCampus);
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'allocated' && isAllocated) ||
                         (filterStatus === 'unallocated' && !isAllocated);
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout activeMenu="Campus Allocation">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Campus Allocation</h1>
              <p className="text-gray-600 mt-1">Manage trainee campus assignments and deployment</p>
            </div>
            <div className="flex items-center gap-2">
              <LuMapPin className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Campus Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {campuses.map((campus) => (
            <div key={campus._id || campus.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-gray-900">{campus.name}</h3>
                <LuBuilding className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600 mb-2">{campus.location}</p>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Capacity:</span>
                  <span className="font-medium">{campus.capacity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Allocated:</span>
                  <span className="font-medium">{campus.currentAllocations}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(campus.currentAllocations / campus.capacity) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative">
                <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search trainees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Trainees</option>
                <option value="allocated">Allocated</option>
                <option value="unallocated">Unallocated</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCampusModal(true)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-medium"
              >
                <LuPlus className="w-4 h-4 mr-2" />
                Add Campus
              </button>
              <button
                onClick={() => setShowAllocationModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                <LuUser className="w-4 h-4 mr-2" />
                Allocate Campus
              </button>
            </div>
          </div>
        </div>

        {/* Trainees List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Trainees ({filteredTrainees.length})</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredTrainees.map((trainee) => (
              <div key={trainee._id || trainee.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{trainee.name}</h3>
                      <span className="text-sm text-gray-500">({trainee.employeeId})</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        trainee.allocatedCampus 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {trainee.allocatedCampus ? 'Allocated' : 'Not Allocated'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{trainee.department}</p>
                    <p className="text-sm text-gray-500">{trainee.email}</p>
                    {trainee.allocatedCampus && (
                      <div className="mt-2 flex items-center gap-2">
                        <LuMapPin className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-600 font-medium">{trainee.allocatedCampus}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {trainee.allocatedCampus ? (
                      <button
                        onClick={() => {
                          const allocation = allocations.find(a => a.traineeId === trainee.id);
                          if (allocation) {
                            handleRemoveAllocation(allocation.id);
                          }
                        }}
                        className="px-3 py-1 text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        <LuX className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedTrainee(trainee);
                          setShowAllocationModal(true);
                        }}
                        className="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        <LuPencil className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Allocation Modal */}
        {showAllocationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Allocate Campus</h2>
                  <button
                    onClick={() => setShowAllocationModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <LuX className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trainee
                    </label>
                    <select
                      value={selectedTrainee?._id || selectedTrainee?.id || ''}
                      onChange={(e) => {
                        const trainee = trainees.find(t => (t._id || t.id) === e.target.value);
                        setSelectedTrainee(trainee);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Trainee</option>
                      {trainees.map((trainee) => (
                        <option key={trainee._id || trainee.id} value={trainee._id || trainee.id}>
                          {trainee.name} ({trainee.employeeId}) - {trainee.allocatedCampus ? 'Allocated' : 'Not Allocated'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Campus
                    </label>
                    <select
                      value={selectedCampus}
                      onChange={(e) => setSelectedCampus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Campus</option>
                      {campuses.map((campus) => (
                        <option key={campus._id || campus.id} value={campus._id || campus.id}>
                          {campus.name} - {campus.location}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Allocation Date
                    </label>
                    <input
                      type="date"
                      value={allocationDate}
                      onChange={(e) => setAllocationDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowAllocationModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAllocateCampus}
                    disabled={isAllocating}
                    className={`px-4 py-2 text-white rounded-md ${isAllocating ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    {isAllocating ? (
                      <span className="inline-flex items-center">
                        <LuLoader className="w-4 h-4 animate-spin mr-2" />
                        Allocating...
                      </span>
                    ) : (
                      'Allocate'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Campus Creation Modal */}
        {showCampusModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Add New Campus</h2>
                  <button
                    onClick={() => setShowCampusModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <LuX className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Campus Name
                    </label>
                    <input
                      type="text"
                      value={newCampus.name}
                      onChange={(e) => setNewCampus({ ...newCampus, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter campus name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={newCampus.location}
                      onChange={(e) => setNewCampus({ ...newCampus, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter location"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capacity
                    </label>
                    <input
                      type="number"
                      value={newCampus.capacity}
                      onChange={(e) => setNewCampus({ ...newCampus, capacity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter capacity"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowCampusModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateCampus}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create Campus
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CampusAllocation;
