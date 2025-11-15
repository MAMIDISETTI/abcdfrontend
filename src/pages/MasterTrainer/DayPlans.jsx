import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../../context/userContext';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { LuCalendar, LuCheck, LuClock, LuUsers, LuUserCheck, LuX } from 'react-icons/lu';
import { addThousandsSeparator } from '../../utils/helper';

const MasterTrainerDayPlans = () => {
  const { user } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState('trainee'); // 'trainee' or 'trainer'
  const [loading, setLoading] = useState(true);
  const [traineeStats, setTraineeStats] = useState({
    totalPlans: 0,        // All plans approved by trainers
    published: 0,         // Plans approved by trainers (ready for trainee work)
    completed: 0,         // Plans where trainee submitted EOD and trainer approved
    draft: 0              // Plans created but not yet approved by trainer
  });
  const [trainerStats, setTrainerStats] = useState({
    totalPlans: 0
  });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateFilterStats, setDateFilterStats] = useState({
    totalPlans: 0,        // All plans for selected date
    published: 0,         // Plans approved by trainers for selected date
    completed: 0,         // Plans completed for selected date
    draft: 0              // Draft plans for selected date
  });
  const [selectedDayPlan, setSelectedDayPlan] = useState(null);
  const [showDayPlanModal, setShowDayPlanModal] = useState(false);
  const [showFullReport, setShowFullReport] = useState(false);
  const [fullReport, setFullReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [dayPlanDetails, setDayPlanDetails] = useState([]);

  // Fetch trainee day plan statistics
  const getTraineeStats = async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.TRAINEE_DAY_PLANS.GET_ALL, {
        params: { 
          role: 'master_trainer',
          stats: true 
        }
      });
      
      const data = res.data;
      // Use real data from API
      setTraineeStats({
        totalPlans: data.totalPlans || 0,        // All approved plans
        published: data.published || 0,          // Plans approved by trainers
        completed: data.completed || 0,          // Plans with approved EOD
        draft: data.draft || 0                   // Draft plans
      });
    } catch (err) {
      console.error("Error fetching trainee day plan stats:", err);
      // Set empty stats on error
      setTraineeStats({
        totalPlans: 0,
        published: 0,
        completed: 0,
        draft: 0
      });
    }
  };

  // Fetch trainer day plan statistics
  const getTrainerStats = async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.DAY_PLANS.GET_ALL, {
        params: { 
          role: 'trainer',
          stats: true 
        }
      });
      
      const data = res.data;
      // Use real data if available, otherwise show zeros
      setTrainerStats({
        totalPlans: data.totalPlans || 0
      });
    } catch (err) {
      console.error("Error fetching trainer day plan stats:", err);
      // Show zeros when API fails
      setTrainerStats({
        totalPlans: 0
      });
    }
  };

  // Fetch date-filtered statistics
  const getDateFilterStats = async (date) => {
    try {
      // First get the details for the specific date
      const res = await axiosInstance.get(API_PATHS.TRAINEE_DAY_PLANS.GET_ALL, {
        params: { 
          role: 'master_trainer',
          details: true,
          date: date
        }
      });
      
      const data = res.data;
      if (data.success && data.dayPlans) {
        // Calculate statistics from the actual day plans for this date
        const dayPlans = data.dayPlans;
        setDateFilterStats({
          totalPlans: dayPlans.length,
          published: dayPlans.filter(plan => plan.status === 'approved').length, // Plans approved by trainer
          completed: dayPlans.filter(plan => plan.status === 'completed' && plan.eodUpdate?.status === 'approved').length, // Plans with EOD approved
          draft: dayPlans.filter(plan => plan.status === 'draft' || plan.status === 'in_progress').length
        });
      } else {
        setDateFilterStats({
          totalPlans: 0,
          published: 0,
          completed: 0,
          draft: 0
        });
      }
    } catch (err) {
      console.error("Error fetching date-filtered stats:", err);
      setDateFilterStats({
        totalPlans: 0,
        published: 0,
        completed: 0,
        draft: 0
      });
    }
  };

  // Handle date change
  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (date) {
      getDateFilterStats(date);
      fetchDayPlanDetails(date);
    } else {
      // Clear date filter - fetch all plans
      setDateFilterStats({
        totalPlans: 0,
        published: 0,
        completed: 0,
        draft: 0
      });
      fetchAllDayPlanDetails();
    }
  };

  // Clear date filter - show all plans
  const clearDateFilter = () => {
    setSelectedDate('');
    setDateFilterStats({
      totalPlans: 0,
      published: 0,
      completed: 0,
      draft: 0
    });
    fetchAllDayPlanDetails();
  };

  // Fetch all day plan details (when no date filter)
  const fetchAllDayPlanDetails = async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.TRAINEE_DAY_PLANS.GET_ALL, {
        params: { 
          role: 'master_trainer'
        }
      });
      
      if (res.data.success && res.data.dayPlans) {
        // Transform the data to ensure consistent structure
        const transformedPlans = res.data.dayPlans.map(plan => {
          // Extract employee ID from various possible sources
          const empId = plan.traineeId || 
                       plan.trainee?.employeeId || 
                       plan.trainee?.employee_id ||
                       (plan.trainee && plan.trainee.employeeId) ||
                       'N/A';
          
          return {
            ...plan,
            id: plan._id || plan.id,
            traineeName: plan.traineeName || plan.trainee?.name || 'Unknown Trainee',
            traineeId: empId,
            employeeId: empId,
            department: plan.department || plan.trainee?.department || 'N/A',
            tasks: plan.tasks || [],
            status: plan.status || 'draft',
            submittedAt: plan.submittedAt || plan.createdAt,
            completedAt: plan.completedAt || (plan.eodUpdate?.reviewedAt && plan.status === 'completed' ? plan.eodUpdate.reviewedAt : null)
          };
        });
        setDayPlanDetails(transformedPlans);
      } else {
        setDayPlanDetails([]);
      }
    } catch (err) {
      console.error("Error fetching all day plan details:", err);
      setDayPlanDetails([]);
    }
  };

  // Fetch day plan details for the selected date
  const fetchDayPlanDetails = async (date) => {
    try {
      const res = await axiosInstance.get(API_PATHS.TRAINEE_DAY_PLANS.GET_ALL, {
        params: { 
          role: 'master_trainer',
          date: date,
          details: true
        }
      });
      
      if (res.data.success && res.data.dayPlans) {
        // Transform the data to ensure consistent structure
        const transformedPlans = res.data.dayPlans.map(plan => {
          // Extract employee ID from various possible sources
          const empId = plan.traineeId || 
                       plan.trainee?.employeeId || 
                       plan.trainee?.employee_id ||
                       (plan.trainee && plan.trainee.employeeId) ||
                       'N/A';
          
          return {
            ...plan,
            id: plan._id || plan.id,
            traineeName: plan.traineeName || plan.trainee?.name || 'Unknown Trainee',
            traineeId: empId,
            employeeId: empId,
            department: plan.department || plan.trainee?.department || 'N/A',
            tasks: plan.tasks || [],
            status: plan.status || 'draft',
            submittedAt: plan.submittedAt || plan.createdAt,
            completedAt: plan.completedAt || (plan.eodUpdate?.reviewedAt && plan.status === 'completed' ? plan.eodUpdate.reviewedAt : null)
          };
        });
        setDayPlanDetails(transformedPlans);
      } else {
        setDayPlanDetails([]);
      }
    } catch (err) {
      console.error("Error fetching day plan details:", err);
      setDayPlanDetails([]);
    }
  };

  // Handle day plan item click
  const handleDayPlanClick = (dayPlan) => {
    setSelectedDayPlan(dayPlan);
    setShowDayPlanModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowDayPlanModal(false);
    setSelectedDayPlan(null);
  };

  const openFullReport = async () => {
    const planId = selectedDayPlan?._id || selectedDayPlan?.id;
    if (!planId) {
      console.error('No day plan id available for report');
      return;
    }
    try {
      setLoadingReport(true);
      const { data } = await axiosInstance.get(API_PATHS.TRAINEE_DAY_PLANS.GET_BY_ID(planId));
      setFullReport(data);
      setShowFullReport(true);
    } catch (err) {
      console.error('Error loading full report:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        getTraineeStats(),
        getTrainerStats(),
        getDateFilterStats(selectedDate),
        fetchDayPlanDetails(selectedDate)
      ]);
      setLoading(false);
    };
    
    loadData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout activeMenu="Day Plans">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeMenu="Day Plans">
      <div className="my-5">
        {/* Header */}


        {/* Tabs */}
        <div className="card mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('trainee')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'trainee'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <LuUserCheck className="w-4 h-4" />
                Trainee Day Plans
              </div>
            </button>
            <button
              onClick={() => setActiveTab('trainer')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'trainer'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <LuUsers className="w-4 h-4" />
                Trainer Day Plans
              </div>
            </button>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'trainee' && (
          <div className="space-y-6">
            {/* Trainee Day Plans Overview */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Trainee Day Plans Overview</h2>
              
              {/* Date Filter Section */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <LuCalendar className="w-5 h-5 text-gray-600" />
                    <label htmlFor="dateFilter" className="text-sm font-medium text-gray-700">
                      Filter by Date:
                    </label>
                  </div>
                  <input
                    type="date"
                    id="dateFilter"
                    value={selectedDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {selectedDate && (
                    <button
                      onClick={clearDateFilter}
                      className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-1 cursor-pointer"
                    >
                      <LuX className="w-4 h-4" />
                      <span>Show All</span>
                    </button>
                  )}
                </div>
                
                {/* Date Filter Stats - Clear Display */}
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Statistics for Selected Date</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg border-2 border-gray-300 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Plans</p>
                          <p className="text-3xl font-bold text-gray-900">{dateFilterStats.totalPlans}</p>
                        </div>
                        <LuCalendar className="w-10 h-10 text-blue-500 opacity-60" />
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-green-700 uppercase tracking-wide mb-1 font-semibold">Approved</p>
                          <p className="text-3xl font-bold text-green-700">{dateFilterStats.published}</p>
                          <p className="text-xs text-green-600 mt-1">By Trainer</p>
                        </div>
                        <LuCheck className="w-10 h-10 text-green-600 opacity-70" />
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-300 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-purple-700 uppercase tracking-wide mb-1 font-semibold">Completed</p>
                          <p className="text-3xl font-bold text-purple-700">{dateFilterStats.completed}</p>
                          <p className="text-xs text-purple-600 mt-1">EOD Approved</p>
                        </div>
                        <LuCheck className="w-10 h-10 text-purple-600 opacity-70" />
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border-2 border-gray-300 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">In Progress</p>
                          <p className="text-3xl font-bold text-orange-600">{dateFilterStats.draft}</p>
                        </div>
                        <LuClock className="w-10 h-10 text-orange-500 opacity-60" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Day Plans List */}
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {selectedDate ? `Day Plans for ${selectedDate}` : 'All Day Plans'}
                </h3>
                {dayPlanDetails.length > 0 ? (
                  <div className="space-y-3">
                    {dayPlanDetails.map((dayPlan) => (
                      <div
                        key={dayPlan.id}
                        onClick={() => handleDayPlanClick(dayPlan)}
                        className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md cursor-pointer transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-lg font-medium text-gray-900">
                                {dayPlan.traineeName || dayPlan.trainee?.name || 'Unknown Trainee'}
                              </h4>
                              {(() => {
                                // Get employee ID from various possible sources
                                const empId = dayPlan.employeeId || 
                                             dayPlan.trainee?.employeeId || 
                                             dayPlan.traineeId ||
                                             dayPlan.trainee?.employee_id;
                                
                                // Show employee ID if it exists and is not the auto-generated EMP_ format
                                // Allow any format except EMP_ prefix
                                if (empId && 
                                    empId !== 'N/A' && 
                                    empId !== null && 
                                    empId !== undefined &&
                                    String(empId).trim() !== '' &&
                                    !String(empId).startsWith('EMP_')) {
                                  return (
                                    <span className="text-sm text-gray-500 font-medium">
                                      (ID: {empId})
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                dayPlan.status === 'completed' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : dayPlan.status === 'published'
                                  ? 'bg-green-100 text-green-800'
                                  : dayPlan.status === 'in_progress'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {dayPlan.status === 'completed' ? 'Completed' : 
                                 dayPlan.status === 'published' ? 'Published' :
                                 dayPlan.status === 'in_progress' ? 'In Progress' : 'Pending'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {dayPlan.department || dayPlan.trainee?.department || 'N/A'}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>Tasks: {dayPlan.tasks.length}</span>
                              <span>Completed: {dayPlan.tasks.filter(t => t.status === 'completed').length}</span>
                              <span>In Progress: {dayPlan.tasks.filter(t => t.status === 'in_progress').length}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              Submitted: {new Date(dayPlan.submittedAt).toLocaleTimeString()}
                            </p>
                            {dayPlan.completedAt && (
                              <p className="text-sm text-gray-500">
                                Completed: {new Date(dayPlan.completedAt).toLocaleTimeString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <LuCalendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No day plans found for {selectedDate}</p>
                  </div>
                )}
              </div>
              
              {/* Overall Statistics - Clear and Prominent */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Statistics</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Total Plans */}
                  <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-300 shadow-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-blue-700 uppercase tracking-wide mb-1 font-semibold">Total Plans</p>
                        <p className="text-3xl font-bold text-blue-900">
                          {addThousandsSeparator(traineeStats.totalPlans)}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">All Day Plans</p>
                      </div>
                      <div className="p-3 bg-blue-500 rounded-full">
                        <LuCalendar className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Approved Plans - Highlighted */}
                  <div className="bg-green-50 p-6 rounded-lg border-2 border-green-400 shadow-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-green-700 uppercase tracking-wide mb-1 font-semibold">Approved</p>
                        <p className="text-3xl font-bold text-green-900">
                          {addThousandsSeparator(traineeStats.published)}
                        </p>
                        <p className="text-xs text-green-600 mt-1">By Trainers</p>
                      </div>
                      <div className="p-3 bg-green-500 rounded-full">
                        <LuCheck className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Completed Plans - Highlighted */}
                  <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-400 shadow-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-purple-700 uppercase tracking-wide mb-1 font-semibold">Completed</p>
                        <p className="text-3xl font-bold text-purple-900">
                          {addThousandsSeparator(traineeStats.completed)}
                        </p>
                        <p className="text-xs text-purple-600 mt-1">EOD Approved</p>
                      </div>
                      <div className="p-3 bg-purple-500 rounded-full">
                        <LuCheck className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* In Progress Plans */}
                  <div className="bg-orange-50 p-6 rounded-lg border-2 border-orange-300 shadow-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-orange-700 uppercase tracking-wide mb-1 font-semibold">In Progress</p>
                        <p className="text-3xl font-bold text-orange-900">
                          {addThousandsSeparator(traineeStats.draft)}
                        </p>
                        <p className="text-xs text-orange-600 mt-1">Pending Approval</p>
                      </div>
                      <div className="p-3 bg-orange-500 rounded-full">
                        <LuClock className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Completion Rate */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base font-semibold text-gray-900">Completion Rate</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {traineeStats.published > 0 
                      ? Math.round((traineeStats.completed / traineeStats.published) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                    style={{ 
                      width: traineeStats.published > 0 
                        ? `${Math.min((traineeStats.completed / traineeStats.published) * 100, 100)}%`
                        : '0%'
                    }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-semibold text-purple-700">{traineeStats.completed}</span> completed out of <span className="font-semibold text-green-700">{traineeStats.published}</span> approved day plans
                </p>
              </div>
            </div>

            {/* Additional Trainee Insights - Will be populated when backend APIs are ready */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="text-center py-8">
                  <p className="text-gray-500">Recent activity data will be available when backend APIs are implemented.</p>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performers</h3>
                <div className="text-center py-8">
                  <p className="text-gray-500">Top performers data will be available when backend APIs are implemented.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trainer' && (
          <div className="space-y-6">
            {/* Trainer Day Plans Overview */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Trainer Day Plans Overview</h2>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Total Plans */}
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-500 rounded-full">
                      <LuCalendar className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-600">Total Plans</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {addThousandsSeparator(trainerStats.totalPlans)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Placeholder cards for future metrics */}
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-3 bg-gray-400 rounded-full">
                      <LuUsers className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Trainers</p>
                      <p className="text-2xl font-bold text-gray-900">-</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-3 bg-gray-400 rounded-full">
                      <LuClock className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Avg. Plans/Trainer</p>
                      <p className="text-2xl font-bold text-gray-900">-</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trainer Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Trainer Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Plans created this week</span>
                    <span className="text-sm font-medium text-gray-900">45</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Most active trainer</span>
                    <span className="text-sm font-medium text-gray-900">Dr. Smith</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Average plans per trainer</span>
                    <span className="text-sm font-medium text-gray-900">15</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Plan Distribution</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Morning sessions</span>
                    <span className="text-sm font-medium text-gray-900">60%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Afternoon sessions</span>
                    <span className="text-sm font-medium text-gray-900">35%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Evening sessions</span>
                    <span className="text-sm font-medium text-gray-900">5%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Day Plan Details Modal */}
      {showDayPlanModal && selectedDayPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Day Plan Details</h2>
                  <p className="text-gray-600">{selectedDayPlan.traineeName} - {selectedDate}</p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <LuX className="w-6 h-6" />
                </button>
              </div>

              {/* Trainee Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Trainee Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{selectedDayPlan.traineeName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Department:</span>
                      <span className="font-medium">{selectedDayPlan.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedDayPlan.status === 'completed' 
                          ? 'bg-purple-100 text-purple-800' 
                          : selectedDayPlan.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : selectedDayPlan.status === 'in_progress'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedDayPlan.status === 'completed' ? 'Completed' : 
                         selectedDayPlan.status === 'published' ? 'Published' :
                         selectedDayPlan.status === 'in_progress' ? 'In Progress' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Timeline</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Submitted:</span>
                      <span className="font-medium">
                        {new Date(selectedDayPlan.submittedAt).toLocaleString()}
                      </span>
                    </div>
                    {selectedDayPlan.completedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Completed:</span>
                        <span className="font-medium">
                          {new Date(selectedDayPlan.completedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">{selectedDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tasks List */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tasks ({selectedDayPlan.tasks.length})</h3>
                <div className="space-y-3">
                  {selectedDayPlan.tasks.map((task) => (
                    <div key={task.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-md font-medium text-gray-900">{task.title}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            task.priority === 'high' 
                              ? 'bg-red-100 text-red-800' 
                              : task.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {task.priority}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            task.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : task.status === 'in_progress'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {task.status === 'completed' ? 'Completed' : 
                             task.status === 'in_progress' ? 'In Progress' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Task Summary */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Task Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedDayPlan.tasks.filter(t => t.status === 'completed').length}
                    </p>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {selectedDayPlan.tasks.filter(t => t.status === 'in_progress').length}
                    </p>
                    <p className="text-sm text-gray-600">In Progress</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-600">
                      {selectedDayPlan.tasks.filter(t => t.status === 'pending').length}
                    </p>
                    <p className="text-sm text-gray-600">Pending</p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={openFullReport}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  View Full Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFullReport && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] overflow-auto">
            <div className="p-5 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Day Plan Details</h2>
              <button onClick={() => setShowFullReport(false)} className="text-gray-500 hover:text-gray-700">
                <LuX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              {loadingReport && <div>Loading...</div>}
              {!loadingReport && fullReport && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-medium mb-2">Trainee Information</h3>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between"><span className="text-gray-600">Name:</span><span>{fullReport?.trainee?.name || 'N/A'}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Status:</span><span className="capitalize">{fullReport?.status}</span></div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-medium mb-2">Timeline</h3>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between"><span className="text-gray-600">Submitted:</span><span>{fullReport?.submittedAt ? new Date(fullReport.submittedAt).toLocaleString() : 'N/A'}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Completed:</span><span>{fullReport?.completedAt ? new Date(fullReport.completedAt).toLocaleString() : 'N/A'}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Date:</span><span>{fullReport?.date ? new Date(fullReport.date).toLocaleDateString() : 'N/A'}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-3">Tasks ({fullReport?.tasks?.length || 0})</h3>
                    <div className="divide-y">
                      {(fullReport?.tasks || []).map((task, idx) => (
                        <div key={idx} className="py-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{task.title || task.name || `Task ${idx + 1}`}</p>
                              {task?.time && <p className="text-xs text-gray-500">{task.time}</p>}
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                              task.status === 'completed' ? 'bg-green-100 text-green-700' : task.status === 'in_progress' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                            }`}>{task.status || 'pending'}</span>
                          </div>
                          {Array.isArray(task?.checkboxes) && task.checkboxes.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-700 mb-1">Additional Activities</p>
                              <ul className="list-disc list-inside text-sm space-y-1">
                                {task.checkboxes.map((cb, cidx) => (
                                  <li key={cidx} className="flex items-center justify-between">
                                    <span>{cb.label || cb.text || `Checkbox ${cidx + 1}`}</span>
                                    <span className={`ml-3 text-xs px-2 py-0.5 rounded-full ${cb.completed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{cb.completed ? 'Completed' : 'Not Completed'}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-3">EOD Review</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-gray-600">Status:</span><span className="capitalize">{fullReport?.eodUpdate?.status || 'N/A'}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Reviewed By:</span><span>{fullReport?.eodUpdate?.reviewedBy || 'N/A'}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Reviewed At:</span><span>{fullReport?.eodUpdate?.reviewedAt ? new Date(fullReport.eodUpdate.reviewedAt).toLocaleString() : 'N/A'}</span></div>
                      {fullReport?.eodUpdate?.reviewComments && (
                        <div className="pt-2">
                          <p className="text-gray-600 mb-1">Comments:</p>
                          <p className="text-gray-800 whitespace-pre-wrap">{fullReport.eodUpdate.reviewComments}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t flex justify-end">
              <button onClick={() => setShowFullReport(false)} className="px-4 py-2 text-gray-700 hover:text-gray-900">Close</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MasterTrainerDayPlans;
