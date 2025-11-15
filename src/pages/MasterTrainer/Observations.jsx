import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../../context/userContext';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { 
  LuEye, 
  LuPlus, 
  LuPencil, 
  LuTrash2, 
  LuSearch,
  LuFilter,
  LuCalendar,
  LuUser,
  LuStar,
  LuFileText,
  LuCheck,
  LuX
} from 'react-icons/lu';

const MasterTrainerObservations = () => {
  const { user } = useContext(UserContext);
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedObservation, setSelectedObservation] = useState(null);
  const [showObservationModal, setShowObservationModal] = useState(false);

  useEffect(() => {
    fetchObservations();
  }, []);

  const fetchObservations = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.OBSERVATIONS.GET_MASTER_TRAINER);
      if (response.data.observations) {
        setObservations(response.data.observations);
      } else {
        setObservations([]);
      }
    } catch (error) {
      console.error('Error fetching observations:', error);
      setObservations([]);
    }
  };

  const openObservationModal = (observation) => {
    setSelectedObservation(observation);
    setShowObservationModal(true);
  };

  const closeObservationModal = () => {
    setShowObservationModal(false);
    setSelectedObservation(null);
  };

  const filteredObservations = observations.filter(observation => {
    const traineeName = observation.trainee?.name || 'Unknown Trainee';
    const trainerName = observation.trainer?.name || 'Unknown Trainer';
    const matchesSearch = traineeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trainerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         observation.overallRating?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterCategory === 'all' || observation.overallRating === filterCategory;
    return matchesSearch && matchesFilter;
  });

  return (
    <DashboardLayout activeMenu="Observations">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className=" font-bold text-gray-900">Cultural & Behavioral Observations</h1>
              <p className="text-gray-600 mt-1">Review and manage trainee observations submitted by trainers</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Observations</p>
                <p className="text-2xl font-bold text-gray-900">{observations.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100 text-blue-800">
                <LuEye className="w-6 h-6" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Draft</p>
                <p className="text-2xl font-bold text-gray-900">{observations.filter(o => o.status === 'draft').length}</p>
              </div>
              <div className="p-2 rounded-lg bg-gray-100 text-gray-800">
                <LuFileText className="w-6 h-6" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Submitted</p>
                <p className="text-2xl font-bold text-gray-900">{observations.filter(o => o.status === 'submitted').length}</p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-100 text-yellow-800">
                <LuCheck className="w-6 h-6" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Reviewed</p>
                <p className="text-2xl font-bold text-gray-900">{observations.filter(o => o.status === 'reviewed').length}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100 text-green-800">
                <LuStar className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative">
              <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                  placeholder="Search observations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="reviewed">Reviewed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Observations List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Observations ({filteredObservations.length})</h2>
            </div>
          <div className="divide-y divide-gray-200">
            {filteredObservations.map((observation) => {
              const traineeName = observation.trainee?.name || 'Unknown Trainee';
              const trainerName = observation.trainer?.name || 'Unknown Trainer';
              const statusColor = observation.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                observation.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800';
              
              return (
                <button
                  key={observation._id}
                  onClick={() => openObservationModal(observation)}
                  className="w-full text-left p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          Observation Report - {traineeName}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                            {observation.status?.charAt(0).toUpperCase() + observation.status?.slice(1)}
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {observation.overallRating?.charAt(0).toUpperCase() + observation.overallRating?.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <LuUser className="w-4 h-4" />
                          Trainee: {traineeName}
                        </span>
                        <span className="flex items-center gap-1">
                          <LuUser className="w-4 h-4" />
                          Trainer: {trainerName}
                        </span>
                        <span className="flex items-center gap-1">
                          <LuCalendar className="w-4 h-4" />
                          {new Date(observation.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <LuEye className="w-5 h-5 text-blue-500 mt-1" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Observation Detail Modal */}
        {showObservationModal && selectedObservation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Observation Report - {selectedObservation.trainee?.name || 'Unknown Trainee'}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedObservation.status === 'draft'
                        ? 'bg-gray-100 text-gray-800'
                        : selectedObservation.status === 'submitted'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {selectedObservation.status?.charAt(0).toUpperCase() + selectedObservation.status?.slice(1)}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {selectedObservation.overallRating?.charAt(0).toUpperCase() + selectedObservation.overallRating?.slice(1)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={closeObservationModal}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <LuX className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <LuUser className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-500">Trainee:</span>
                    <span className="text-gray-900">{selectedObservation.trainee?.name || 'Unknown Trainee'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <LuUser className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-500">Trainer:</span>
                    <span className="text-gray-900">{selectedObservation.trainer?.name || 'Unknown Trainer'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <LuCalendar className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-500">Observed on:</span>
                    <span className="text-gray-900">
                      {selectedObservation.date ? new Date(selectedObservation.date).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">Culture & Behavior</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Communication</span>
                        <span className="font-medium text-gray-900">{selectedObservation.culture?.communication || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Teamwork</span>
                        <span className="font-medium text-gray-900">{selectedObservation.culture?.teamwork || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Discipline</span>
                        <span className="font-medium text-gray-900">{selectedObservation.culture?.discipline || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Attitude</span>
                        <span className="font-medium text-gray-900">{selectedObservation.culture?.attitude || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">Grooming</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dress Code</span>
                        <span className="font-medium text-gray-900">{selectedObservation.grooming?.dressCode || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Neatness</span>
                        <span className="font-medium text-gray-900">{selectedObservation.grooming?.neatness || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Punctuality</span>
                        <span className="font-medium text-gray-900">{selectedObservation.grooming?.punctuality || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {(selectedObservation.strengths?.length > 0 || selectedObservation.areasForImprovement?.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedObservation.strengths?.length > 0 && (
                      <div className="bg-green-50 rounded-xl p-4">
                        <h3 className="font-semibold text-green-800 mb-2">Strengths</h3>
                        <ul className="space-y-2 text-sm text-green-700">
                          {selectedObservation.strengths.map((strength, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-600"></span>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedObservation.areasForImprovement?.length > 0 && (
                      <div className="bg-orange-50 rounded-xl p-4">
                        <h3 className="font-semibold text-orange-800 mb-2">Areas for Improvement</h3>
                        <ul className="space-y-2 text-sm text-orange-700">
                          {selectedObservation.areasForImprovement.map((area, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-600"></span>
                              <span>{area}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {selectedObservation.recommendations && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h3 className="font-semibold text-blue-800 mb-2">Recommendations</h3>
                    <p className="text-sm text-blue-700">{selectedObservation.recommendations}</p>
                  </div>
                )}

                {selectedObservation.masterTrainerNotes && (
                  <div className="bg-purple-50 rounded-xl p-4">
                    <h3 className="font-semibold text-purple-800 mb-2">Master Trainer Notes</h3>
                    <p className="text-sm text-purple-700">{selectedObservation.masterTrainerNotes}</p>
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

export default MasterTrainerObservations;