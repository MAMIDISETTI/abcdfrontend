import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../../context/userContext';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { toast } from 'react-hot-toast';
import moment from 'moment';
import { 
  LuBrain, 
  LuGlobe, 
  LuCalendar,
  LuClock,
  LuPlay,
  LuPause,
  LuPencil,
  LuTrash2,
  LuEye,
  LuPlus,
  LuLoader,
  LuCheck,
  LuX,
  LuInfo,
  LuSearch,
  LuFilter
} from 'react-icons/lu';

const MCQDeployments = () => {
  const { user } = useContext(UserContext);
  const [deployments, setDeployments] = useState([]);
  const [filteredDeployments, setFilteredDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month, custom
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  
  // Form states
  const [apiUrl, setApiUrl] = useState('');
  const [deploymentName, setDeploymentName] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [duration, setDuration] = useState(30); // in minutes
  const [timePeriod, setTimePeriod] = useState('AM'); // AM or PM
  const [isDeploying, setIsDeploying] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [fetchedQuestions, setFetchedQuestions] = useState([]);
  
  // Trainee selection states
  const [trainees, setTrainees] = useState([]);
  const [selectedTrainees, setSelectedTrainees] = useState([]);
  const [traineeSearchTerm, setTraineeSearchTerm] = useState('');
  const [showTraineeDropdown, setShowTraineeDropdown] = useState(false);
  const [isLoadingTrainees, setIsLoadingTrainees] = useState(false);
  const isAllSelected = selectedTrainees.length > 0 && trainees.length > 0 && selectedTrainees.length === trainees.length;

  useEffect(() => {
    fetchDeployments();
    fetchTrainees();
  }, []);

  // Filter deployments based on search term and date filter
  useEffect(() => {
    let filtered = deployments;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(deployment =>
        deployment.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deployment.apiUrl?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deployment.status?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = moment();
      filtered = filtered.filter(deployment => {
        const deploymentDate = moment(deployment.scheduledDateTime);
        
        switch (dateFilter) {
          case 'today':
            return deploymentDate.isSame(now, 'day');
          case 'week':
            return deploymentDate.isAfter(now.subtract(1, 'week'));
          case 'month':
            return deploymentDate.isAfter(now.subtract(1, 'month'));
          case 'custom':
            if (customDateFrom && customDateTo) {
              return deploymentDate.isBetween(
                moment(customDateFrom),
                moment(customDateTo),
                'day',
                '[]'
              );
            }
            return true;
          default:
            return true;
        }
      });
    }

    setFilteredDeployments(filtered);
  }, [deployments, searchTerm, dateFilter, customDateFrom, customDateTo]);

  const fetchDeployments = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_PATHS.ADMIN.MCQ_DEPLOYMENTS);
      const deploymentsData = response.data.deployments || [];
      setDeployments(deploymentsData);
      setFilteredDeployments(deploymentsData);
    } catch (error) {
      console.error('Error fetching deployments:', error);
      toast.error('Failed to fetch deployments');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainees = async () => {
    try {
      setIsLoadingTrainees(true);
      const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);
      const traineeUsers = response.data.users?.filter(user => user.role === 'trainee') || [];
      setTrainees(traineeUsers);
    } catch (error) {
      console.error('Error fetching trainees:', error);
      toast.error('Failed to fetch trainees');
    } finally {
      setIsLoadingTrainees(false);
    }
  };

  const handleGetStarted = async () => {
    if (!apiUrl.trim()) {
      toast.error('Please enter a valid API URL');
      return;
    }

    try {
      setIsFetchingData(true);
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.questions && Array.isArray(data.questions)) {
        // Map the API response to the expected format
        const mappedQuestions = data.questions.map(question => ({
          id: question.id || question._id || question.question_id,
          question: question.question_text || question.question,
          options: question.options.map(option => ({
            text: option.text,
            image: option.image_url || option.image || option.imageUrl,
            imageUrl: option.image_url || option.image || option.imageUrl
          })),
          option_type: question.options_type || question.option_type || 'DEFAULT',
          correctAnswer: question.options.find(option => option.is_correct === "true" || option.is_correct === true)?.text || question.options[0]?.text,
          explanation: question.explanation || '',
          difficulty: question.difficulty || 'medium',
          points: question.points || 1
        }));
        
        setFetchedQuestions(mappedQuestions);
        toast.success(`Successfully fetched ${mappedQuestions.length} questions`);
      } else {
        toast.error('Invalid API response format. Expected questions array.');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data from API');
    } finally {
      setIsFetchingData(false);
    }
  };

  const handleDeploy = async () => {
    if (!deploymentName.trim() || !scheduledDate || !scheduledTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (fetchedQuestions.length === 0) {
      toast.error('Please fetch questions first');
      return;
    }

    if (selectedTrainees.length === 0) {
      toast.error('Please select at least one trainee');
      return;
    }

    try {
      setIsDeploying(true);
      const scheduledDateTime = moment(`${scheduledDate} ${scheduledTime} ${timePeriod}`).toISOString();
      
      const deploymentData = {
        name: deploymentName,
        apiUrl,
        questions: fetchedQuestions,
        scheduledDateTime,
        duration,
        status: 'scheduled',
        targetTrainees: selectedTrainees.map(t => t.author_id)
      };

      const response = await axiosInstance.post(API_PATHS.ADMIN.MCQ_DEPLOYMENTS, deploymentData);
      
      toast.success('MCQ Deployment created successfully!');
      setShowCreateModal(false);
      resetForm();
      fetchDeployments();
    } catch (error) {
      console.error('Error creating deployment:', error);
      toast.error('Failed to create deployment');
    } finally {
      setIsDeploying(false);
    }
  };

  const resetForm = () => {
    setApiUrl('');
    setDeploymentName('');
    setScheduledDate('');
    setScheduledTime('');
    setDuration(30);
    setTimePeriod('AM');
    setFetchedQuestions([]);
    setSelectedTrainees([]);
    setTraineeSearchTerm('');
    setShowTraineeDropdown(false);
  };

  const handleTraineeSearch = (term) => {
    setTraineeSearchTerm(term);
    setShowTraineeDropdown(term.length > 0);
  };

  const handleTraineeSelect = (trainee) => {
    if (!selectedTrainees.find(t => t.author_id === trainee.author_id)) {
      setSelectedTrainees([...selectedTrainees, trainee]);
    }
    setTraineeSearchTerm('');
    setShowTraineeDropdown(false);
  };

  const handleSelectAllTrainees = () => {
    // Select all current trainees from the loaded list
    setSelectedTrainees(trainees);
    setTraineeSearchTerm('');
    setShowTraineeDropdown(false);
  };

  const handleClearAllTrainees = () => {
    setSelectedTrainees([]);
    setTraineeSearchTerm('');
    setShowTraineeDropdown(false);
  };

  const handleTraineeRemove = (traineeId) => {
    setSelectedTrainees(selectedTrainees.filter(t => t.author_id !== traineeId));
  };

  const filteredTrainees = (traineeSearchTerm ? trainees.filter(trainee =>
    trainee.name?.toLowerCase().includes(traineeSearchTerm.toLowerCase()) ||
    trainee.author_id?.toLowerCase().includes(traineeSearchTerm.toLowerCase()) ||
    trainee.email?.toLowerCase().includes(traineeSearchTerm.toLowerCase())
  ) : trainees);

  const openCreateModal = () => {
    setShowCreateModal(true);
    resetForm();
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    resetForm();
  };

  const openDetailsModal = (deployment) => {
    setSelectedDeployment(deployment);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedDeployment(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return <LuClock className="w-4 h-4" />;
      case 'active': return <LuPlay className="w-4 h-4" />;
      case 'completed': return <LuCheck className="w-4 h-4" />;
      case 'cancelled': return <LuX className="w-4 h-4" />;
      default: return <LuInfo className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LuLoader className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading deployments...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <LuBrain className="w-8 h-8 mr-3 text-blue-600" />
            MCQ Deployments
          </h1>
          <p className="text-gray-600 mt-1">Manage and deploy MCQ assignments to trainees</p>
        </div>
        <button
          onClick={openCreateModal}
          className="cursor-pointer flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <LuPlus className="w-5 h-5 mr-2" />
          Create Deployment
        </button>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col xl:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Deployments
            </label>
            <div className="relative">
              <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, URL, or status..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Date Filter */}
          <div className="xl:w-64 flex-shrink-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Date
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {dateFilter === 'custom' && (
            <div className="lg:w-80">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Range
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">From</label>
                  <input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">To</label>
                  <input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Clear Filters */}
          {(searchTerm || dateFilter !== 'all') && (
            <div className="xl:flex-shrink-0 flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setDateFilter('all');
                  setCustomDateFrom('');
                  setCustomDateTo('');
                }}
                className="w-full xl:w-auto px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredDeployments.length} of {deployments.length} deployments
        </div>
      </div>

      {/* Deployments List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {deployments.length === 0 ? (
          <div className="text-center py-12">
            <LuBrain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No deployments yet</h3>
            <p className="text-gray-500 mb-6">Create your first MCQ deployment to get started</p>
            <button
              onClick={openCreateModal}
              className="cursor-pointer px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create First Deployment
            </button>
          </div>
        ) : filteredDeployments.length === 0 ? (
          <div className="text-center py-12">
            <LuSearch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No deployments found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setDateFilter('all');
                setCustomDateFrom('');
                setCustomDateTo('');
              }}
              className="cursor-pointer px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deployment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Questions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scheduled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDeployments.map((deployment, index) => (
                  <tr key={deployment._id || deployment.id || `deployment-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {deployment.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {deployment.apiUrl}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {deployment.questions?.length || 0} questions
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {moment(deployment.scheduledDateTime).format('MMM DD, YYYY HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {deployment.duration} minutes
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(deployment.status)}`}>
                        {getStatusIcon(deployment.status)}
                        <span className="ml-1 capitalize">{deployment.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openDetailsModal(deployment)}
                          className="text-blue-600 hover:text-blue-900 cursor-pointer"
                        >
                          <LuEye className="w-4 h-4" />
                        </button>
                        <button
                          className="text-gray-600 hover:text-gray-900 cursor-pointer"
                        >
                          <LuPencil className="w-4 h-4" />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900 cursor-pointer"
                        >
                          <LuTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Deployment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Create MCQ Deployment</h2>
              <p className="text-gray-600 mt-1">Deploy MCQ assignments to all trainees</p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* API URL Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API URL
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="https://api.example.com/questions"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleGetStarted}
                    disabled={isFetchingData || !apiUrl.trim()}
                    className="cursor-pointer px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isFetchingData ? (
                      <LuLoader className="w-4 h-4 animate-spin" />
                    ) : (
                      'Get Started'
                    )}
                  </button>
                </div>
              </div>

              {/* Deployment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deployment Name *
                  </label>
                  <input
                    type="text"
                    value={deploymentName}
                    onChange={(e) => setDeploymentName(e.target.value)}
                    placeholder="Enter deployment name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    min="5"
                    max="180"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Period *
                  </label>
                  <select
                    value={timePeriod}
                    onChange={(e) => setTimePeriod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={moment().format('YYYY-MM-DD')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scheduled Time *
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Trainee Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Trainees *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={traineeSearchTerm}
                    onChange={(e) => handleTraineeSearch(e.target.value)}
                    onFocus={() => setShowTraineeDropdown(true)}
                    placeholder="Search trainees by name, author ID, or email..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  
                  {/* Search Dropdown */}
                  {showTraineeDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {isLoadingTrainees ? (
                        <div className="p-3 text-center text-gray-500">
                          <LuLoader className="w-4 h-4 animate-spin inline mr-2" />
                          Loading trainees...
                        </div>
                      ) : (
                        <>
                          {/* Select All row */}
                          {trainees.length > 0 && (
                            <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                              <span className="text-sm font-medium text-gray-700">Select All Trainees ({trainees.length})</span>
                              {!isAllSelected ? (
                                <button onClick={handleSelectAllTrainees} className="text-blue-600 hover:text-blue-800 text-sm">Select All</button>
                              ) : (
                                <button onClick={handleClearAllTrainees} className="text-red-600 hover:text-red-800 text-sm">Clear All</button>
                              )}
                            </div>
                          )}

                          {filteredTrainees.length > 0 ? (
                            filteredTrainees.map((trainee) => (
                          <div
                            key={trainee.author_id}
                            onClick={() => handleTraineeSelect(trainee)}
                            className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900">{trainee.name}</p>
                                <p className="text-sm text-gray-500">ID: {trainee.author_id}</p>
                                <p className="text-sm text-gray-500">{trainee.email}</p>
                              </div>
                            </div>
                          </div>
                            ))
                          ) : (
                            <div className="p-3 text-gray-500">No trainees found</div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Trainees */}
                {selectedTrainees.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Selected Trainees ({selectedTrainees.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {isAllSelected && (
                        <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                          <span>All Trainees Selected</span>
                          <button onClick={handleClearAllTrainees} className="text-green-700 hover:text-green-900 cursor-pointer">
                            <LuX className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      {selectedTrainees.map((trainee) => (
                        <div
                          key={trainee.author_id}
                          className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                        >
                          <span>{trainee.name} ({trainee.author_id})</span>
                          <button
                            onClick={() => handleTraineeRemove(trainee.author_id)}
                            className="text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            <LuX className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Fetched Questions Preview */}
              {fetchedQuestions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fetched Questions ({fetchedQuestions.length})
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                    {fetchedQuestions.map((question, index) => (
                      <div key={index} className="text-sm text-gray-700 mb-3 pb-2 border-b border-gray-200 last:border-b-0">
                        <div className="font-medium mb-1 flex items-center justify-between">
                          <span><strong>Q{index + 1}:</strong> {question.question}</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {question.option_type || 'DEFAULT'}
                          </span>
                        </div>
                        <div className="ml-4 text-xs text-gray-600">
                          <div>Options: {question.options.length}</div>
                          <div>Correct: {question.correctAnswer}</div>
                          <div>Difficulty: {question.difficulty}</div>
                          {question.option_type === 'IMAGE' && (
                            <div className="text-orange-600">📷 Contains images</div>
                          )}
                          {question.options && question.options.some(opt => typeof opt === 'object' && opt.image) && (
                            <div className="text-orange-600">📷 Contains image options</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={closeCreateModal}
                className="cursor-pointer px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeploy}
                disabled={isDeploying || !deploymentName.trim() || !scheduledDate || !scheduledTime || fetchedQuestions.length === 0 || selectedTrainees.length === 0}
                className="cursor-pointer px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDeploying ? (
                  <>
                    <LuLoader className="w-4 h-4 animate-spin inline mr-2" />
                    Deploying...
                  </>
                ) : (
                  'Deploy'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deployment Details Modal */}
      {showDetailsModal && selectedDeployment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Deployment Details</h2>
              <p className="text-gray-600 mt-1">{selectedDeployment.name}</p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Name:</span>
                      <p className="text-sm text-gray-900">{selectedDeployment.name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">API URL:</span>
                      <p className="text-sm text-gray-900 break-all">{selectedDeployment.apiUrl}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Scheduled:</span>
                      <p className="text-sm text-gray-900">
                        {moment(selectedDeployment.scheduledDateTime).format('MMM DD, YYYY HH:mm')}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Duration:</span>
                      <p className="text-sm text-gray-900">{selectedDeployment.duration} minutes</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Status:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${getStatusColor(selectedDeployment.status)}`}>
                        {getStatusIcon(selectedDeployment.status)}
                        <span className="ml-1 capitalize">{selectedDeployment.status}</span>
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Questions Preview</h3>
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                    {selectedDeployment.questions?.map((question, index) => (
                      <div key={index} className="text-sm text-gray-700 mb-3 pb-3 border-b border-gray-200 last:border-b-0">
                        <div className="font-medium mb-2">
                          <strong>Q{index + 1}:</strong> {question.question}
                        </div>
                        {question.options && (
                          <div className="mt-2 ml-4">
                            {question.options.map((option, optIndex) => {
                              // Handle both string and object options
                              const optionText = typeof option === 'string' ? option : option.text || option.image || option.imageUrl || 'Option';
                              const isCorrect = typeof option === 'string' 
                                ? option === question.correctAnswer 
                                : option.text === question.correctAnswer;
                              
                              return (
                                <div key={optIndex} className={`text-xs ${isCorrect ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                                  {String.fromCharCode(65 + optIndex)}. {optionText}
                                  {isCorrect && ' ✓'}
                                  {typeof option === 'object' && option.image && (
                                    <span className="ml-2 text-orange-600">📷</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {question.explanation && (
                          <div className="mt-2 ml-4 text-xs text-blue-600">
                            <strong>Explanation:</strong> {question.explanation}
                          </div>
                        )}
                      </div>
                    )) || <p className="text-gray-500">No questions available</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={closeDetailsModal}
                className="cursor-pointer px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MCQDeployments;
