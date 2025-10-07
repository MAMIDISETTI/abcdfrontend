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

  const handleReviewObservation = (observation) => {
    // TODO: Implement review functionality
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
              <h1 className="text-2xl font-bold text-gray-900">Cultural & Behavioral Observations</h1>
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
                <div key={observation._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          Observation Report - {traineeName}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                          {observation.status?.charAt(0).toUpperCase() + observation.status?.slice(1)}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {observation.overallRating?.charAt(0).toUpperCase() + observation.overallRating?.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
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
                      
                      {/* Culture & Behavior Ratings */}
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <h4 className="font-medium text-sm text-gray-700 mb-2">Culture & Behavior</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Communication:</span>
                              <span className="font-medium">{observation.culture?.communication}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Teamwork:</span>
                              <span className="font-medium">{observation.culture?.teamwork}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Discipline:</span>
                              <span className="font-medium">{observation.culture?.discipline}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Attitude:</span>
                              <span className="font-medium">{observation.culture?.attitude}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <h4 className="font-medium text-sm text-gray-700 mb-2">Grooming</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Dress Code:</span>
                              <span className="font-medium">{observation.grooming?.dressCode}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Neatness:</span>
                              <span className="font-medium">{observation.grooming?.neatness}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Punctuality:</span>
                              <span className="font-medium">{observation.grooming?.punctuality}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Strengths and Areas for Improvement */}
                      {(observation.strengths?.length > 0 || observation.areasForImprovement?.length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          {observation.strengths?.length > 0 && (
                            <div className="bg-green-50 p-3 rounded-lg">
                              <h4 className="font-medium text-sm text-green-800 mb-2">Strengths</h4>
                              <ul className="text-sm text-green-700">
                                {observation.strengths.map((strength, index) => (
                                  <li key={index} className="flex items-center gap-1">
                                    <span className="w-1 h-1 bg-green-600 rounded-full"></span>
                                    {strength}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {observation.areasForImprovement?.length > 0 && (
                            <div className="bg-orange-50 p-3 rounded-lg">
                              <h4 className="font-medium text-sm text-orange-800 mb-2">Areas for Improvement</h4>
                              <ul className="text-sm text-orange-700">
                                {observation.areasForImprovement.map((area, index) => (
                                  <li key={index} className="flex items-center gap-1">
                                    <span className="w-1 h-1 bg-orange-600 rounded-full"></span>
                                    {area}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Recommendations */}
                      {observation.recommendations && (
                        <div className="bg-blue-50 p-3 rounded-lg mb-3">
                          <h4 className="font-medium text-sm text-blue-800 mb-1">Recommendations</h4>
                          <p className="text-sm text-blue-700">{observation.recommendations}</p>
                        </div>
                      )}
                      
                      {/* Master Trainer Notes */}
                      {observation.masterTrainerNotes && (
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <h4 className="font-medium text-sm text-purple-800 mb-1">Master Trainer Notes</h4>
                          <p className="text-sm text-purple-700">{observation.masterTrainerNotes}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReviewObservation(observation)}
                        className="p-2 text-blue-600 hover:text-blue-800 cursor-pointer"
                        title="Review Observation"
                      >
                        <LuEye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default MasterTrainerObservations;