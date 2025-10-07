import React, { useEffect, useState, useContext } from "react";
import { UserContext } from "../../context/userContext";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import moment from "moment";
import { addThousandsSeparator } from "../../utils/helper";
import InfoCard from "../../components/Cards/InfoCard";
import TrainersPopup from "../../components/TrainersPopup";
import TraineesPopup from "../../components/TraineesPopup";
import { LuUsers, LuUserCheck, LuCalendar, LuEye, LuTrendingUp, LuFileText, LuMapPin, LuBrain, LuX, LuCheck, LuClock } from "react-icons/lu";
import { toast } from "react-hot-toast";

const MasterTrainerDashboard = () => {
  const { user } = useContext(UserContext);
  const [dashboardData, setDashboardData] = useState({
    dayPlans: {
      totalPlans: 0,
      publishedPlans: 0,
      completedPlans: 0,
      draftPlans: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [showTrainersPopup, setShowTrainersPopup] = useState(false);
  const [trainers, setTrainers] = useState([]);
  const [showTraineesPopup, setShowTraineesPopup] = useState(false);
  const [trainees, setTrainees] = useState([]);
  const [showUnassignedTraineesPopup, setShowUnassignedTraineesPopup] = useState(false);
  const [unassignedTrainees, setUnassignedTrainees] = useState([]);
  const [showAssignedTraineesPopup, setShowAssignedTraineesPopup] = useState(false);
  const [assignedTrainees, setAssignedTrainees] = useState([]);
  const [showActiveAssignmentsModal, setShowActiveAssignmentsModal] = useState(false);
  const [activeAssignmentsData, setActiveAssignmentsData] = useState([]);
  const [campusAllocations, setCampusAllocations] = useState([]);

  // Fetch master trainer dashboard data
  const getMasterTrainerDashboard = async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.DASHBOARD.MASTER_TRAINER);
      setDashboardData(prev => ({
        ...prev,
        ...res.data
      }));
    } catch (err) {
      console.error("Error loading master trainer dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch day plans statistics
  const getDayPlansStats = async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.DAY_PLANS.GET_ALL, {
        params: { 
          role: 'master_trainer',
          stats: true 
        }
      });
      
      const data = res.data;
      if (data.totalPlans !== undefined) {
        // Update dashboard data with real day plans stats
        setDashboardData(prev => ({
          ...prev,
          dayPlans: {
            totalPlans: data.totalPlans || 0,
            publishedPlans: data.published || 0,
            completedPlans: data.completed || 0,
            draftPlans: data.draft || 0
          }
        }));
      } else {
        setDashboardData(prev => ({
          ...prev,
          dayPlans: {
            totalPlans: 0,
            publishedPlans: 0,
            completedPlans: 0,
            draftPlans: 0
          }
        }));
      }
    } catch (err) {
      console.error("Error fetching day plans stats:", err);
      setDashboardData(prev => ({
        ...prev,
        dayPlans: {
          totalPlans: 0,
          publishedPlans: 0,
          completedPlans: 0,
          draftPlans: 0
        }
      }));
    }
  };

  // Fetch campus allocation data from company_allocated_details
  const fetchCampusAllocations = async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.USERS.LIST, {
        params: { role: 'trainee' }
      });
      
      if (res.data.success && res.data.users) {
        
        // Extract campus allocations from company_allocated_details field
        const allocations = [];
        res.data.users.forEach(trainee => {
          if (trainee.company_allocated_details && trainee.company_allocated_details.length > 0) {
            trainee.company_allocated_details.forEach((allocation, index) => {
              allocations.push({
                id: `${trainee._id}_${index}`,
                traineeName: trainee.name,
                traineeId: trainee.employeeId || trainee._id,
                campusName: allocation.campusName || 'N/A',
                campusId: allocation.campusId || 'N/A',
                startDate: allocation.startDate || new Date().toISOString().split('T')[0],
                endDate: allocation.endDate || new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: allocation.status || 'confirmed',
                notes: allocation.notes || '',
                confirmedAt: allocation.confirmedAt || new Date().toISOString()
              });
            });
          }
        });
        
        setCampusAllocations(allocations);
      } else {
        setCampusAllocations([]);
      }
    } catch (err) {
      console.error("Error fetching campus allocations:", err);
      setCampusAllocations([]);
    }
  };

  // Fetch trainers data
  const getTrainers = async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.USERS.LIST, {
        params: { role: 'trainer' }
      });
      setTrainers(res.data.users || res.data || []);
    } catch (err) {
      console.error("Error fetching trainers:", err);
      toast.error("Failed to fetch trainers data");
    }
  };

  // Fetch trainees data
  const getTrainees = async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.USERS.LIST, {
        params: { role: 'trainee' }
      });
      setTrainees(res.data.users || res.data || []);
    } catch (err) {
      console.error("Error fetching trainees:", err);
      toast.error("Failed to fetch trainees data");
    }
  };

  // Fetch unassigned trainees data
  const getUnassignedTrainees = async () => {
    try {
      
      // First, let's check all trainees to see what we have
      const allTraineesRes = await axiosInstance.get(API_PATHS.USERS.LIST, {
        params: { role: 'trainee' }
      });
      
      // Then get unassigned trainees
      const res = await axiosInstance.get(API_PATHS.USERS.LIST, {
        params: { role: 'trainee', unassigned: 'true' }
      });
      setUnassignedTrainees(res.data.users || res.data || []);
    } catch (err) {
      console.error("Error fetching unassigned trainees:", err);
      console.error("Error details:", err.response?.data);
      toast.error("Failed to fetch unassigned trainees data");
    }
  };

  // Fetch assigned trainees data
  const getAssignedTrainees = async () => {
    try {
      
      // Get all trainees and filter for assigned ones
      const res = await axiosInstance.get(API_PATHS.USERS.LIST, {
        params: { role: 'trainee' }
      });
      
      // Filter for assigned trainees (those with assignedTrainer)
      const assignedTraineesData = (res.data.users || res.data || []).filter(trainee => trainee.assignedTrainer);
      setAssignedTrainees(assignedTraineesData);
    } catch (err) {
      console.error("Error fetching assigned trainees:", err);
      console.error("Error details:", err.response?.data);
      toast.error("Failed to fetch assigned trainees data");
    }
  };

  // Fetch active assignments with exam details
  const getActiveAssignments = async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.MASTER_TRAINER.MCQ_DEPLOYMENTS);
      const deployments = res.data.deployments || [];
      
      // Filter active deployments and add exam statistics
      const activeDeployments = deployments
        .filter(deployment => deployment.status === 'active' || deployment.status === 'scheduled')
        .map(deployment => {
          const currentlyWriting = deployment.results?.filter(r => r.status === 'in_progress').length || 0;
          const totalWritten = deployment.results?.filter(r => r.status === 'completed').length || 0;
          const totalAssigned = deployment.targetTrainees?.length || 0;
          
          return {
            ...deployment,
            currentlyWriting,
            totalWritten,
            totalAssigned,
            notStarted: totalAssigned - currentlyWriting - totalWritten
          };
        });
      
      setActiveAssignmentsData(activeDeployments);
    } catch (err) {
      console.error("Error fetching active assignments:", err);
      toast.error("Failed to fetch active assignments data");
    }
  };

  // Handle trainers popup
  const handleTrainersClick = () => {
    setShowTrainersPopup(true);
    if (trainers.length === 0) {
      getTrainers();
    }
  };

  // Handle trainees popup
  const handleTraineesClick = () => {
    setShowTraineesPopup(true);
    if (trainees.length === 0) {
      getTrainees();
    }
  };

  // Handle unassigned trainees popup
  const handleUnassignedTraineesClick = () => {
    setShowUnassignedTraineesPopup(true);
    if (unassignedTrainees.length === 0) {
      getUnassignedTrainees();
    }
  };

  const handleAssignedTraineesClick = () => {
    setShowAssignedTraineesPopup(true);
    if (assignedTrainees.length === 0) {
      getAssignedTrainees();
    }
  };

  // Handle active assignments click
  const handleActiveAssignmentsClick = () => {
    setShowActiveAssignmentsModal(true);
    if (activeAssignmentsData.length === 0) {
      getActiveAssignments();
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await getMasterTrainerDashboard();
      // Small delay to ensure dashboard data is loaded first
      setTimeout(() => {
        getDayPlansStats(); // Fetch day plans statistics
      }, 100);
      getUnassignedTrainees(); // Fetch unassigned trainees on component load
      getAssignedTrainees(); // Fetch assigned trainees on component load
      fetchCampusAllocations(); // Fetch campus allocation data
    };

    loadData();
  }, []);

  // Real-time updates for active assignments modal
  useEffect(() => {
    let interval;
    if (showActiveAssignmentsModal) {
      // Update every 5 seconds when modal is open
      interval = setInterval(() => {
        getActiveAssignments();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showActiveAssignmentsModal]);

  if (loading) {
    return (
      <DashboardLayout activeMenu="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeMenu="Dashboard">
      {/* Welcome Section */}
      <div className="card my-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="col-span-3">
            <h2 className="text-xl md:text-2xl font-medium">Welcome, {user?.name}</h2>
            <p className="text-xs md:text-[13px] text-gray-400 mt-1.5">
              {moment().format("dddd Do MMM YYYY")}
            </p>
          </div>
          
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-6 mt-5">
          <InfoCard
            label="Total Trainers"
            value={addThousandsSeparator(dashboardData?.overview?.totalTrainers || 0)}
            color="bg-blue-500"
            icon={<LuUsers className="w-5 h-5" />}
            onClick={handleTrainersClick}
            clickable={true}
          />

          <InfoCard
            label="Total Trainees"
            value={addThousandsSeparator(dashboardData?.overview?.totalTrainees || 0)}
            color="bg-green-500"
            icon={<LuUserCheck className="w-5 h-5" />}
            onClick={handleTraineesClick}
            clickable={true}
          />

          <InfoCard
            label="Assigned Trainees"
            value={addThousandsSeparator(dashboardData?.overview?.assignedTrainees || 0)}
            color="bg-emerald-500"
            icon={<LuUserCheck className="w-5 h-5" />}
            onClick={handleAssignedTraineesClick}
            clickable={true}
          />

          <InfoCard
            label="Unassigned Trainees"
            value={addThousandsSeparator(dashboardData?.overview?.unassignedTrainees || 0)}
            color="bg-orange-500"
            icon={<LuUsers className="w-5 h-5" />}
            onClick={handleUnassignedTraineesClick}
            clickable={true}
          />

          <InfoCard
            label="Active Assignments"
            value={addThousandsSeparator(dashboardData?.overview?.activeAssignments || 0)}
            color="bg-purple-500"
            icon={<LuCalendar className="w-5 h-5" />}
            onClick={handleActiveAssignmentsClick}
            clickable={true}
          />
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-4 md:my-6">

        {/* Day Plans Statistics */}
        <div 
          className="card cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => window.location.href = '/master-trainer/day-plans'}
        >
          <div className="flex items-center justify-between mb-4">
            <h5 className="font-medium text-gray-700">Day Plans</h5>
            <LuCalendar className="w-5 h-5 text-green-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Plans</span>
              <span className="font-semibold text-gray-800">
                {dashboardData?.dayPlans?.totalPlans || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Published</span>
              <span className="font-semibold text-green-600">
                {dashboardData?.dayPlans?.publishedPlans || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Completed</span>
              <span className="font-semibold text-blue-600">
                {dashboardData?.dayPlans?.completedPlans || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Draft</span>
              <span className="font-semibold text-orange-600">
                {dashboardData?.dayPlans?.draftPlans || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Observations Statistics */}
        <div 
          className="card cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => window.location.href = '/master-trainer/observations'}
        >
          <div className="flex items-center justify-between mb-4">
            <h5 className="font-medium text-gray-700">Observations</h5>
            <LuEye className="w-5 h-5 text-purple-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total</span>
              <span className="font-semibold text-gray-800">
                {dashboardData?.observations?.totalObservations || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Submitted</span>
              <span className="font-semibold text-blue-600">
                {dashboardData?.observations?.submittedObservations || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Reviewed</span>
              <span className="font-semibold text-green-600">
                {dashboardData?.observations?.reviewedObservations || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg. Rating</span>
              <span className="font-semibold text-purple-600">
                {dashboardData?.observations?.averageRating?.toFixed(1) || 0}/4
              </span>
            </div>
          </div>
        </div>

        {/* Assignments Statistics */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h5 className="font-medium text-gray-700">Assignments</h5>
            <LuFileText className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total</span>
              <span className="font-semibold text-gray-800">
                {dashboardData?.assignments?.totalAssignments || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active</span>
              <span className="font-semibold text-green-600">
                {dashboardData?.assignments?.activeAssignments || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Completed</span>
              <span className="font-semibold text-blue-600">
                {dashboardData?.assignments?.completedAssignments || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Trainees Assigned</span>
              <span className="font-semibold text-purple-600">
                {dashboardData?.assignments?.totalTraineesAssigned || 0}
              </span>
            </div>
          </div>
        </div>

        {/* MCQ Exams Statistics */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h5 className="font-medium text-gray-700">MCQ Exams</h5>
            <LuBrain className="w-5 h-5 text-purple-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Exams</span>
              <span className="font-semibold text-gray-800">
                {dashboardData?.mcqExams?.totalExams || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Exams</span>
              <span className="font-semibold text-green-600">
                {dashboardData?.mcqExams?.activeExams || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Currently Writing</span>
              <span className="font-semibold text-orange-600">
                {dashboardData?.mcqExams?.currentlyWriting || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Written</span>
              <span className="font-semibold text-blue-600">
                {dashboardData?.mcqExams?.totalWritten || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Trainers and Trainees Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-4 md:my-6">
        {/* Trainers List */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-lg font-medium">Trainers</h5>
            <span className="text-sm text-gray-500">
              {dashboardData?.trainers?.length || 0} total
            </span>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {dashboardData?.trainers?.length > 0 ? (
              dashboardData.trainers.map((trainer, index) => (
                <div key={trainer._id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h6 className="font-medium text-sm">{trainer.name}</h6>
                    <p className="text-xs text-gray-600">{trainer.email}</p>
                    <p className="text-xs text-gray-500">
                      {trainer.assignedTrainees?.length || 0} trainees assigned
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500">
                      {trainer.department || 'No department'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No trainers found</p>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-lg font-medium">Recent Activities</h5>
            <LuTrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {dashboardData?.recentActivities?.length > 0 ? (
              dashboardData.recentActivities.map((activity, index) => (
                <div key={activity._id || index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {moment(activity.createdAt).format('MMM DD, YYYY HH:mm')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent activities</p>
            )}
          </div>
        </div>

        {/* Campus Allocation Confirmed */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-lg font-medium">Campus Allocation Confirmed</h5>
            <LuMapPin className="w-5 h-5 text-green-500" />
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {campusAllocations.length > 0 ? (
              campusAllocations.map((allocation) => (
                <div key={allocation.id} className="flex items-start space-x-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{allocation.traineeName}</p>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        {allocation.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      <strong>Campus:</strong> {allocation.campusName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      <strong>Duration:</strong> {moment(allocation.startDate).format('MMM DD, YYYY')} - {moment(allocation.endDate).format('MMM DD, YYYY')}
                    </p>
                    {allocation.notes && (
                      <p className="text-xs text-gray-600 mt-1">
                        <strong>Notes:</strong> {allocation.notes}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Confirmed: {moment(allocation.confirmedAt).format('MMM DD, YYYY HH:mm')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="p-3 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <LuMapPin className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">You don't have Campus Allocation right now</p>
                <p className="text-gray-400 text-xs mt-1">Campus allocations will appear here once confirmed</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trainers Popup */}
      <TrainersPopup
        isOpen={showTrainersPopup}
        onClose={() => setShowTrainersPopup(false)}
        trainers={trainers}
      />

      {/* Trainees Popup */}
      <TraineesPopup
        isOpen={showTraineesPopup}
        onClose={() => setShowTraineesPopup(false)}
        trainees={trainees}
        title="Total Trainees"
      />

      {/* Unassigned Trainees Popup */}
      <TraineesPopup
        isOpen={showUnassignedTraineesPopup}
        onClose={() => setShowUnassignedTraineesPopup(false)}
        trainees={unassignedTrainees}
        title="Unassigned Trainees"
      />

      {/* Assigned Trainees Popup */}
      <TraineesPopup
        isOpen={showAssignedTraineesPopup}
        onClose={() => setShowAssignedTraineesPopup(false)}
        trainees={assignedTrainees}
        title="Assigned Trainees"
      />

      {/* Active Assignments Modal */}
      {showActiveAssignmentsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Active Assignments</h3>
                  <p className="text-gray-600">Real-time exam statistics and progress</p>
                </div>
                <button
                  onClick={() => setShowActiveAssignmentsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <LuX className="w-6 h-6" />
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Active</p>
                      <p className="text-2xl font-bold text-blue-900">{activeAssignmentsData.length}</p>
                    </div>
                    <LuCalendar className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-600 font-medium">Currently Writing</p>
                      <p className="text-2xl font-bold text-orange-900">
                        {activeAssignmentsData.reduce((sum, assignment) => sum + assignment.currentlyWriting, 0)}
                      </p>
                    </div>
                    <LuBrain className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Total Written</p>
                      <p className="text-2xl font-bold text-green-900">
                        {activeAssignmentsData.reduce((sum, assignment) => sum + assignment.totalWritten, 0)}
                      </p>
                    </div>
                    <LuCheck className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Not Started</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {activeAssignmentsData.reduce((sum, assignment) => sum + assignment.notStarted, 0)}
                      </p>
                    </div>
                    <LuClock className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
              </div>

              {/* Assignments List */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Assignment Details</h4>
                {activeAssignmentsData.length === 0 ? (
                  <div className="text-center py-8">
                    <LuCalendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No active assignments found</p>
                  </div>
                ) : (
                  activeAssignmentsData.map((assignment, index) => (
                    <div key={assignment._id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h5 className="text-lg font-semibold text-gray-900">{assignment.name}</h5>
                          <p className="text-sm text-gray-600">
                            {assignment.questions?.length || 0} questions • {assignment.duration} minutes
                          </p>
                          <p className="text-xs text-gray-500">
                            Scheduled: {moment(assignment.scheduledDateTime).format('MMM DD, YYYY h:mm A')}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          assignment.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {assignment.status === 'active' ? 'Active' : 'Scheduled'}
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>
                            {assignment.totalAssigned > 0 
                              ? Math.round(((assignment.totalWritten + assignment.currentlyWriting) / assignment.totalAssigned) * 100)
                              : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${assignment.totalAssigned > 0 
                                ? ((assignment.totalWritten + assignment.currentlyWriting) / assignment.totalAssigned) * 100
                                : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Statistics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-orange-600">{assignment.currentlyWriting}</p>
                          <p className="text-xs text-gray-600">Writing Now</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{assignment.totalWritten}</p>
                          <p className="text-xs text-gray-600">Completed</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">{assignment.notStarted}</p>
                          <p className="text-xs text-gray-600">Not Started</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{assignment.totalAssigned}</p>
                          <p className="text-xs text-gray-600">Total Assigned</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MasterTrainerDashboard;
