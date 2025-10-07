import React, { useEffect, useState, useContext } from "react";
import { UserContext } from "../../context/userContext";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import moment from "moment";
import { toast } from "react-hot-toast";
import { LuPlus, LuPencil, LuTrash, LuEye, LuCalendar, LuClock, LuFileText, LuX, LuArrowRight } from "react-icons/lu";

const DayPlans = () => {
  const { user } = useContext(UserContext);
  const [dayPlans, setDayPlans] = useState([]);
  const [assignedTrainees, setAssignedTrainees] = useState([]);
  const [traineeDayPlans, setTraineeDayPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTraineeCreateForm, setShowTraineeCreateForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [activeTab, setActiveTab] = useState("trainee-created"); // trainee-created, trainee-plans
  const [showTraineeSelector, setShowTraineeSelector] = useState(false);
  const [traineeSearchTerm, setTraineeSearchTerm] = useState("");
  const [showTraineePlanPopup, setShowTraineePlanPopup] = useState(false);
  const [selectedTraineePlan, setSelectedTraineePlan] = useState(null);
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [expandedPlans, setExpandedPlans] = useState({});
  const [previewPlan, setPreviewPlan] = useState(null);
  const [expandedTasks, setExpandedTasks] = useState({});
  const [processingPlans, setProcessingPlans] = useState({});
  const [dateFilter, setDateFilter] = useState("");
  const [filteredTraineeDayPlans, setFilteredTraineeDayPlans] = useState([]);
  const [traineeCreatedDateFilter, setTraineeCreatedDateFilter] = useState("");
  const [filteredTraineeCreatedPlans, setFilteredTraineeCreatedPlans] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: moment().format('YYYY-MM-DD'),
    startTime: "09:00",
    endTime: "17:00",
    tasks: [],
    assignedTrainees: [],
    notes: ""
  });

  // Trainee form state
  const [traineeFormData, setTraineeFormData] = useState({
    title: "",
    description: "",
    date: moment().format('YYYY-MM-DD'),
    startTime: "09:00",
    endTime: "17:00",
    tasks: [],
    selectedTrainees: [],
    notes: ""
  });

  // Fetch day plans
  const getDayPlans = async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.DAY_PLANS.GET_ALL);
      setDayPlans(res.data.dayPlans || []);
    } catch (error) {
     // console.error("Error fetching day plans:", error);
      toast.error("Failed to fetch day plans");
    }
  };

  // Fetch assigned trainees
  const getAssignedTrainees = async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.USERS.LIST + "?role=trainee");
      setAssignedTrainees(res.data.users || []);
    } catch (error) {
    //  console.error("Error fetching trainees:", error);
      toast.error("Failed to fetch trainees");
    }
  };

  // Fetch trainee day plans
  const getTraineeDayPlans = async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.TRAINEE_DAY_PLANS.GET_ALL);
      
      // Debug each plan's checkbox data
      if (res.data.dayPlans) {
        res.data.dayPlans.forEach((plan, index) => {
          //   date: plan.date,
          //   checkboxes: plan.checkboxes,
          //   eodUpdate: plan.eodUpdate
          // });
        });
      }
      
      setTraineeDayPlans(res.data.dayPlans || []);
      setFilteredTraineeDayPlans(res.data.dayPlans || []);
      setFilteredTraineeCreatedPlans(res.data.dayPlans || []);
    } catch (error) {
     // console.error("Error fetching trainee day plans:", error);
      toast.error("Failed to fetch trainee day plans");
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post(API_PATHS.DAY_PLANS.CREATE, formData);
      if (res.data.success) {
        toast.success("Day plan created successfully");
        setShowCreateForm(false);
        resetForm();
        getDayPlans();
      }
    } catch (error) {
     // console.error("Error creating day plan:", error);
      toast.error("Failed to create day plan");
    }
  };

  // Handle trainee form submission
  const handleTraineeSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that trainees are selected
    if (traineeFormData.selectedTrainees.length === 0) {
      toast.error("Please select at least one trainee");
      return;
    }

    // Validate that we have at least one task
    if (traineeFormData.tasks.length === 0 || traineeFormData.tasks.every(task => !task.trim())) {
      toast.error("Please add at least one task");
      return;
    }

    try {
      // Create day plans for each selected trainee
      const promises = traineeFormData.selectedTrainees.map(async (traineeId) => {
        // Transform the data to match the TraineeDayPlan model format
        const dayPlanData = {
          date: traineeFormData.date,
          tasks: traineeFormData.tasks
            .filter(task => task && task.trim()) // Filter out empty tasks
            .map(task => ({
              title: task.trim(),
              timeAllocation: `${traineeFormData.startTime}-${traineeFormData.endTime}`,
              description: traineeFormData.description || ""
            })),
          checkboxes: {}, // Empty checkboxes for trainer-created plans
          status: "submitted", // Set as submitted since trainer is creating it
          traineeId: traineeId, // Pass the specific trainee ID
          createdBy: "trainer" // Indicate this was created by a trainer
        };

        return axiosInstance.post(API_PATHS.TRAINEE_DAY_PLANS.CREATE, dayPlanData);
      });

      // Wait for all day plans to be created
      const results = await Promise.all(promises);
      
      // Check if all were successful (status 200-299 means success)
      const allSuccessful = results.every(res => res.status >= 200 && res.status < 300);
      
      if (allSuccessful) {
        toast.success(`Day plans created successfully for ${traineeFormData.selectedTrainees.length} trainee(s)`);
        setShowTraineeCreateForm(false);
        resetTraineeForm();
        getTraineeDayPlans();
      } else {
        toast.error("Some day plans failed to create. Please try again.");
      }
    } catch (error) {
      // console.error("Error creating trainee day plans:", error);
      // console.error("Error response:", error.response?.data);
      toast.error(`Failed to create trainee day plans: ${error.response?.data?.message || error.message}`);
    }
  };

  // Add task
  const addTask = () => {
    setFormData({ ...formData, tasks: [...formData.tasks, ""] });
  };

  // Update task
  const updateTask = (index, value) => {
    const newTasks = [...formData.tasks];
    newTasks[index] = value;
    setFormData({ ...formData, tasks: newTasks });
  };

  // Remove task
  const removeTask = (index) => {
    const newTasks = formData.tasks.filter((_, i) => i !== index);
    setFormData({ ...formData, tasks: newTasks });
  };

  // Add trainee task
  const addTraineeTask = () => {
    setTraineeFormData({ ...traineeFormData, tasks: [...traineeFormData.tasks, ""] });
  };

  // Update trainee task
  const updateTraineeTask = (index, value) => {
    const newTasks = [...traineeFormData.tasks];
    newTasks[index] = value;
    setTraineeFormData({ ...traineeFormData, tasks: newTasks });
  };

  // Remove trainee task
  const removeTraineeTask = (index) => {
    const newTasks = traineeFormData.tasks.filter((_, i) => i !== index);
    setTraineeFormData({ ...traineeFormData, tasks: newTasks });
  };

  // Edit plan
  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      title: plan.title,
      description: plan.description,
      date: moment(plan.date).format('YYYY-MM-DD'),
      startTime: plan.startTime,
      endTime: plan.endTime,
      tasks: plan.tasks || [],
      assignedTrainees: plan.assignedTrainees?.map(t => t._id) || [],
      notes: plan.notes || ""
    });
    setShowCreateForm(true);
  };

  // Handle accept trainee plan (from list view)
  const handleAcceptPlanFromList = async (planId) => {
    setProcessingPlans(prev => ({ ...prev, [planId]: 'accepting' }));
    
    try {
      // Find the plan to check if it has EOD updates and correct status
      const plan = traineeDayPlans.find(p => p._id === planId);
      const endpoint = (plan?.eodUpdate && plan?.status === 'pending') ? 
        API_PATHS.TRAINEE_DAY_PLANS.EOD_REVIEW(planId) :
        API_PATHS.TRAINEE_DAY_PLANS.REVIEW(planId);
      
      const response = await axiosInstance.put(endpoint, {
          status: 'approved',
          reviewComments: 'Approved by trainer'
      });

      if (response.data.message) {
        toast.success('Day plan accepted successfully');
        // Update the local state immediately
        setTraineeDayPlans(prev => 
          prev.map(plan => 
            plan._id === planId 
              ? { ...plan, status: 'completed' }
              : plan
          )
        );
        setFilteredTraineeDayPlans(prev => 
          prev.map(plan => 
            plan._id === planId 
              ? { ...plan, status: 'completed' }
              : plan
          )
        );
        setFilteredTraineeCreatedPlans(prev => 
          prev.map(plan => 
            plan._id === planId 
              ? { ...plan, status: 'completed' }
              : plan
          )
        );
      }
    } catch (error) {
      // console.error("Error accepting plan:", error);
      // console.error("Error response:", error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to accept plan');
    } finally {
      setProcessingPlans(prev => ({ ...prev, [planId]: null }));
    }
  };

  // Handle reject trainee plan (from list view)
  const handleRejectPlanFromList = async (planId) => {
    const remarks = prompt('Please provide remarks for rejection:');
    if (!remarks || !remarks.trim()) {
      toast.error('Remarks are required for rejection');
      return;
    }

    setProcessingPlans(prev => ({ ...prev, [planId]: 'rejecting' }));

    try {
      // Find the plan to check if it has EOD updates and correct status
      const plan = traineeDayPlans.find(p => p._id === planId);
      const endpoint = (plan?.eodUpdate && plan?.status === 'pending') ? 
        API_PATHS.TRAINEE_DAY_PLANS.EOD_REVIEW(planId) :
        API_PATHS.TRAINEE_DAY_PLANS.REVIEW(planId);
      
      const response = await axiosInstance.put(endpoint, {
          status: 'rejected',
          reviewComments: remarks
      });

      if (response.data.message) {
        toast.success('Day plan rejected successfully');
        // Update the local state immediately
        setTraineeDayPlans(prev => 
          prev.map(plan => 
            plan._id === planId 
              ? { ...plan, status: 'rejected' }
              : plan
          )
        );
        setFilteredTraineeDayPlans(prev => 
          prev.map(plan => 
            plan._id === planId 
              ? { ...plan, status: 'rejected' }
              : plan
          )
        );
        setFilteredTraineeCreatedPlans(prev => 
          prev.map(plan => 
            plan._id === planId 
              ? { ...plan, status: 'rejected' }
              : plan
          )
        );
      }
    } catch (error) {
      // console.error("Error rejecting plan:", error);
      // console.error("Error response:", error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to reject plan');
    } finally {
      setProcessingPlans(prev => ({ ...prev, [planId]: null }));
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      date: moment().format('YYYY-MM-DD'),
      startTime: "09:00",
      endTime: "17:00",
      tasks: [],
      assignedTrainees: [],
      notes: ""
    });
    setEditingPlan(null);
  };

  // Reset trainee form
  const resetTraineeForm = () => {
    setTraineeFormData({
      title: "",
      description: "",
      date: moment().format('YYYY-MM-DD'),
      startTime: "09:00",
      endTime: "17:00",
      tasks: [],
      selectedTrainees: [],
      notes: ""
    });
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this day plan?")) {
      try {
        const res = await axiosInstance.delete(API_PATHS.DAY_PLANS.DELETE(id));
        if (res.data.success) {
          toast.success("Day plan deleted successfully");
          getDayPlans();
        }
      } catch (error) {
       // console.error("Error deleting day plan:", error);
        toast.error("Failed to delete day plan");
      }
    }
  };

  // Handle trainee delete
  const handleTraineeDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this trainee day plan?")) {
      try {
        const res = await axiosInstance.delete(API_PATHS.TRAINEE_DAY_PLANS.DELETE(id));
        if (res.data.success) {
          toast.success("Trainee day plan deleted successfully");
          getTraineeDayPlans();
        }
      } catch (error) {
       // console.error("Error deleting trainee day plan:", error);
        toast.error("Failed to delete trainee day plan");
      }
    }
  };

  // Handle trainee edit
  const handleTraineeEdit = (plan) => {
    setTraineeFormData({
      title: plan.title,
      description: plan.description,
      date: moment(plan.date).format('YYYY-MM-DD'),
      startTime: plan.startTime,
      endTime: plan.endTime,
      tasks: plan.tasks || [],
      selectedTrainees: plan.assignedTrainees?.map(t => t._id) || [],
      notes: plan.notes || ""
    });
    setShowTraineeCreateForm(true);
  };

  // Add trainee
  const addTrainee = (traineeId) => {
    if (!traineeFormData.selectedTrainees.includes(traineeId)) {
      setTraineeFormData({
        ...traineeFormData,
        selectedTrainees: [...traineeFormData.selectedTrainees, traineeId]
      });
    }
  };

  // Remove trainee
  const removeTrainee = (traineeId) => {
    setTraineeFormData({
      ...traineeFormData,
      selectedTrainees: traineeFormData.selectedTrainees.filter(id => id !== traineeId)
    });
  };

  // Toggle trainee selection
  const toggleTrainee = (traineeId) => {
    if (traineeFormData.selectedTrainees.includes(traineeId)) {
      removeTrainee(traineeId);
    } else {
      addTrainee(traineeId);
    }
  };

  // Handle trainee plan popup
  const handleTraineePlanClick = (plan) => {
    setSelectedTraineePlan(plan);
    setShowTraineePlanPopup(true);
    setReviewRemarks("");
  };

  // Toggle day plan expansion
  const togglePlanExpansion = (planId) => {
    setExpandedPlans(prev => ({
      ...prev,
      [planId]: !prev[planId]
    }));
  };

  // Toggle task expansion
  const toggleTaskExpansion = (planId, taskIndex) => {
    const key = `${planId}-${taskIndex}`;
    setExpandedTasks(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Handle accept trainee plan
  const handleAcceptPlan = async () => {
    if (!selectedTraineePlan) return;
    
    try {
      // Use EOD review endpoint only if the day plan has EOD updates AND status is pending
      // Otherwise use regular review endpoint
      const endpoint = (selectedTraineePlan.eodUpdate && selectedTraineePlan.status === 'pending') ? 
        API_PATHS.TRAINEE_DAY_PLANS.EOD_REVIEW(selectedTraineePlan._id) :
        API_PATHS.TRAINEE_DAY_PLANS.REVIEW(selectedTraineePlan._id);
      
      const res = await axiosInstance.put(endpoint, {
        status: "approved",
        reviewComments: reviewRemarks
      });
      
      if (res.data.success) {
        toast.success("Day plan accepted successfully");
        setShowTraineePlanPopup(false);
        setSelectedTraineePlan(null);
        setReviewRemarks("");
        getTraineeDayPlans(); // Refresh the list
      }
    } catch (error) {
      // console.error("Error accepting plan:", error);
      // console.error("Error response:", error.response?.data);
      toast.error(`Failed to accept day plan: ${error.response?.data?.message || error.message}`);
    }
  };

  // Handle reject trainee plan
  const handleRejectPlan = async () => {
    if (!selectedTraineePlan) return;
    
    if (!reviewRemarks.trim()) {
      toast.error("Please provide remarks for rejection");
      return;
    }
    
    try {
      // Use EOD review endpoint only if the day plan has EOD updates AND status is pending
      // Otherwise use regular review endpoint
      const endpoint = (selectedTraineePlan.eodUpdate && selectedTraineePlan.status === 'pending') ? 
        API_PATHS.TRAINEE_DAY_PLANS.EOD_REVIEW(selectedTraineePlan._id) :
        API_PATHS.TRAINEE_DAY_PLANS.REVIEW(selectedTraineePlan._id);
      
      const res = await axiosInstance.put(endpoint, {
        status: "rejected",
        reviewComments: reviewRemarks
      });
      
      if (res.data.success) {
        toast.success("Day plan rejected successfully");
        setShowTraineePlanPopup(false);
        setSelectedTraineePlan(null);
        setReviewRemarks("");
        getTraineeDayPlans(); // Refresh the list
      }
    } catch (error) {
      // console.error("Error rejecting plan:", error);
      // console.error("Error response:", error.response?.data);
      toast.error(`Failed to reject day plan: ${error.response?.data?.message || error.message}`);
    }
  };

  // Close form
  const closeForm = () => {
    setShowCreateForm(false);
    setEditingPlan(null);
    resetForm();
  };

  // Handle date filter
  const handleDateFilter = (selectedDate) => {
    setDateFilter(selectedDate);
    if (selectedDate) {
      const filtered = traineeDayPlans.filter(plan => 
        moment(plan.date).format('YYYY-MM-DD') === selectedDate
      );
      setFilteredTraineeDayPlans(filtered);
    } else {
      setFilteredTraineeDayPlans(traineeDayPlans);
    }
  };

  // Clear date filter
  const clearDateFilter = () => {
    setDateFilter("");
    setFilteredTraineeDayPlans(traineeDayPlans);
  };

  // Handle trainee created date filter
  const handleTraineeCreatedDateFilter = (selectedDate) => {
    setTraineeCreatedDateFilter(selectedDate);
    if (selectedDate) {
      const filtered = traineeDayPlans.filter(plan => 
        moment(plan.date).format('YYYY-MM-DD') === selectedDate
      );
      setFilteredTraineeCreatedPlans(filtered);
    } else {
      setFilteredTraineeCreatedPlans(traineeDayPlans);
    }
  };

  // Clear trainee created date filter
  const clearTraineeCreatedDateFilter = () => {
    setTraineeCreatedDateFilter("");
    setFilteredTraineeCreatedPlans(traineeDayPlans);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
      await Promise.all([
        getDayPlans(),
        getAssignedTrainees(),
        getTraineeDayPlans()
      ]);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout activeMenu="Day Plans">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeMenu="Day Plans">
      <div className="space-y-5 relative">
      <div className="card my-5">
        <h2 className="text-xl font-medium">Day Plans</h2>
      </div>

      {/* Tabs */}
      <div className="card my-5">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("trainee-created")}
              className={`cursor-pointer flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === "trainee-created"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Trainee Created Day Plans
          </button>
          <button
            onClick={() => setActiveTab("trainee-plans")}
              className={`cursor-pointer flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === "trainee-plans"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Assigned Trainees' Day Plans
          </button>
        </div>
      </div>

        {/* Trainee Created Day Plans Tab */}
        {activeTab === "trainee-created" && (
        <div className="card my-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Trainee Created Day Plans</h3>
          </div>

          {/* Date Filter Section */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Filter by Date:</label>
                <input
                  type="date"
                  value={traineeCreatedDateFilter}
                  onChange={(e) => handleTraineeCreatedDateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {traineeCreatedDateFilter && (
                  <button
                    onClick={clearTraineeCreatedDateFilter}
                    className="cursor-pointer px-3 py-2 text-sm text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
              <div className="text-sm text-gray-600">
                Showing {filteredTraineeCreatedPlans.length} of {traineeDayPlans.length} plans
              </div>
            </div>
          </div>
              
          {filteredTraineeCreatedPlans.length === 0 ? (
            <div className="text-center py-8">
              <LuFileText className="mx-auto text-4xl text-gray-400 mb-2" />
              <p className="text-gray-500">
                {traineeCreatedDateFilter ? `No day plans found for ${moment(traineeCreatedDateFilter).format('MMM DD, YYYY')}` : 'No trainee day plans submitted yet'}
              </p>
              {traineeCreatedDateFilter && (
                <button
                  onClick={clearTraineeCreatedDateFilter}
                  className="cursor-pointer mt-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  Clear date filter
                </button>
              )}
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {filteredTraineeCreatedPlans.map((plan) => (
                <div key={plan._id} className="border rounded-lg p-4">
                  {/* Day Plan Header */}
                  <div 
                    className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded"
                    onClick={() => setPreviewPlan(plan)}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {plan.trainee?.name || 'Unknown Trainee'} - {moment(plan.date).format('MMM DD, YYYY')}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {plan.tasks?.length || 0} tasks • Status: 
                        <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                          plan.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          plan.status === 'completed' ? 'bg-green-100 text-green-800' :
                          plan.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          plan.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {plan.status === 'in_progress' ? 'In Progress' :
                           plan.status === 'completed' ? '✓ Accepted' :
                           plan.status === 'rejected' ? '✗ Rejected' :
                           plan.status === 'pending' ? 'Pending' :
                           plan.status || 'Draft'}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Submitted: {plan.submittedAt ? moment(plan.submittedAt).format('MMM DD, YYYY h:mm A') : 'Not submitted'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-blue-600">View</span>
                      <LuArrowRight className={`text-gray-400`} />
                    </div>
                  </div>

                  {/* Expanded Content (kept for fallback – no longer used) */}
                  {false && expandedPlans[plan._id] && (
                    <div className="mt-4 space-y-3">
                      {/* Total Hours */}
                      {(() => {
                        const parse = (s) => {
                          if (!s) return null;
                          const m = s.match(/(\d{1,2}):(\d{2})(am|pm)[–-](\d{1,2}):(\d{2})(am|pm)/i);
                          if (!m) return null;
                          const toMin = (h, mm, ap) => {
                            let hh = parseInt(h, 10) % 12;
                            if (ap.toLowerCase() === 'pm') hh += 12;
                            return hh * 60 + parseInt(mm, 10);
                          };
                          return toMin(m[1], m[2], m[3]) - toMin(m[4], m[5], m[6]) > 0
                            ? { start: toMin(m[4], m[5], m[6]), end: toMin(m[1], m[2], m[3]) } // unlikely
                            : { start: toMin(m[1], m[2], m[3]), end: toMin(m[4], m[5], m[6]) };
                        };
                        let minutes = 0;
                        (plan.tasks || []).forEach(t => {
                          const r = parse(t.timeAllocation);
                          if (r) minutes += Math.max(0, r.end - r.start);
                        });
                        if (plan.checkboxes) {
                          const groups = Array.isArray(plan.checkboxes) ? [] : Object.values(plan.checkboxes);
                          groups.forEach(g => {
                            const arr = Array.isArray(g) ? g : Object.values(g);
                            arr.forEach(cb => {
                              const r = parse(cb.timeAllocation);
                              if (r) minutes += Math.max(0, r.end - r.start);
                            });
                          });
                        }
                        const hrs = Math.floor(minutes / 60);
                        const mins = minutes % 60;
                        return (
                          <div className="flex items-center justify-between rounded bg-gray-50 border p-2">
                            <span className="text-sm text-gray-700 font-medium">Total Planned Time</span>
                            <span className="text-sm text-gray-900 font-semibold">{hrs}h {mins}m</span>
                          </div>
                        );
                      })()}
                      {/* Tasks */}
                      {plan.tasks && plan.tasks.length > 0 ? (
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Tasks</h5>
                          <div className="space-y-2">
                            {plan.tasks.map((task, taskIndex) => (
                              <div key={taskIndex} className="border rounded-lg p-3">
                                {/* Task Header */}
                                <div 
                                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded"
                                  onClick={() => toggleTaskExpansion(plan._id, taskIndex)}
                                >
                                  <div className="flex-1">
                                    <h6 className="font-medium text-sm">{task.title}</h6>
                                    <p className="text-xs text-gray-600 mt-1">
                                      Time: {task.timeAllocation}
                                      {task.status && (
                                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                          task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                          task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                          task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {task.status === 'completed' ? 'Completed' :
                                           task.status === 'in_progress' ? 'In Progress' :
                                           task.status === 'pending' ? 'Pending' :
                                           task.status}
                                        </span>
                                      )}
                                    </p>
                                    {task.description && (
                                      <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">
                                      {expandedTasks[`${plan._id}-${taskIndex}`] ? 'Click to hide checkboxes' : 'Click to show checkboxes'}
                                    </span>
                                    <LuArrowRight className={`text-gray-400 transition-transform ${expandedTasks[`${plan._id}-${taskIndex}`] ? 'rotate-90' : ''}`} />
                                  </div>
                                </div>

                                {/* Task Checkboxes */}
                                {expandedTasks[`${plan._id}-${taskIndex}`] && (
                                  <div className="mt-3 pt-3 border-t">
                                    <h6 className="font-medium text-sm text-gray-700 mb-2">Additional Activities</h6>
                                    {(() => {
                                      // Comprehensive debugging
                                      
                                      // Handle different checkbox data structures
                                      if (!plan.checkboxes) {
                                        return (
                                          <div className="text-center py-2 text-gray-500">
                                            <p className="text-xs">No additional activities for this task</p>
                                          </div>
                                        );
                                      }

                                      // Try all possible keys for task identification
                                      const possibleKeys = [
                                        taskIndex,
                                        String(taskIndex),
                                        `task_${taskIndex}`,
                                        `task_${String(taskIndex)}`,
                                        task._id,
                                        task.id,
                                        task._id?.toString(),
                                        task.id?.toString()
                                      ];

                                      let taskCheckboxes = null;
                                      let foundKey = null;
                                      
                                      for (const key of possibleKeys) {
                                        if (plan.checkboxes[key]) {
                                          taskCheckboxes = plan.checkboxes[key];
                                          foundKey = key;
                                          break;
                                        }
                                      }

                                      if (!taskCheckboxes || (Array.isArray(taskCheckboxes) && taskCheckboxes.length === 0) || (typeof taskCheckboxes === 'object' && Object.keys(taskCheckboxes).length === 0)) {
                                        return (
                                          <div className="text-center py-2 text-gray-500">
                                            <p className="text-xs">No additional activities for this task</p>
                                          </div>
                                        );
                                      }

                                      // Render checkboxes
                                      if (Array.isArray(taskCheckboxes)) {
                                        // Old format: array of checkboxes
                                        return taskCheckboxes.map((checkbox, checkboxIndex) => (
                                          <div key={checkboxIndex} className="flex items-center gap-2 p-2 border rounded mb-2 bg-gray-50">
                                            <input
                                              type="checkbox"
                                              checked={checkbox.checked}
                                              readOnly
                                              className="rounded"
                                            />
                                            <span className="text-sm">{checkbox.label}</span>
                                            {checkbox.timeAllocation && (
                                              <span className="text-xs text-gray-500">({checkbox.timeAllocation})</span>
                                            )}
                                          </div>
                                        ));
                                      } else {
                                        // New format: nested object structure
                                        return Object.entries(taskCheckboxes).map(([checkboxId, checkbox]) => (
                                          <div key={checkboxId} className="flex items-center gap-2 p-2 border rounded mb-2 bg-gray-50">
                                            <input
                                              type="checkbox"
                                              checked={checkbox.checked}
                                              readOnly
                                              className="rounded"
                                            />
                                            <span className="text-sm">{checkbox.label}</span>
                                            {checkbox.timeAllocation && (
                                              <span className="text-xs text-gray-500">({checkbox.timeAllocation})</span>
                                            )}
                                          </div>
                                        ));
                                      }
                                    })()}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <p className="text-sm">No tasks assigned</p>
                        </div>
                      )}

                      {/* EOD Update */}
                      {plan.eodUpdate && (
                        <div className="border rounded-lg p-3 bg-gray-50">
                          <h5 className="font-medium text-gray-900 mb-2">End of Day Update</h5>
                          <p className="text-sm text-gray-900">{plan.eodUpdate.overallRemarks}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Submitted: {plan.eodUpdate.submittedAt ? 
                              moment(plan.eodUpdate.submittedAt).format('MMM DD, YYYY h:mm A') : 
                              'Date not available'}
                          </p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {plan.status === 'in_progress' || plan.status === 'pending' ? (
                        <div className="flex justify-end gap-2 pt-3 border-t">
                          <button
                            onClick={() => handleRejectPlanFromList(plan._id)}
                            disabled={processingPlans[plan._id]}
                            className={`px-4 cursor-pointer py-2 rounded text-sm transition-colors ${
                              processingPlans[plan._id] === 'rejecting'
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                          >
                            {processingPlans[plan._id] === 'rejecting' ? 'Rejecting...' : 'Reject'}
                          </button>
                          <button
                            onClick={() => handleAcceptPlanFromList(plan._id)}
                            disabled={processingPlans[plan._id]}
                            className={`px-4 py-2 cursor-pointer rounded text-sm transition-colors ${
                              processingPlans[plan._id] === 'accepting'
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            {processingPlans[plan._id] === 'accepting' ? 'Submitting...' : 'Submit'}
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end pt-3 border-t">
                          <span className={`px-3 py-2 rounded text-sm font-medium ${
                            plan.status === 'completed' ? 'bg-green-100 text-green-800' :
                            plan.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {plan.status === 'completed' ? '✓ Accepted' :
                             plan.status === 'rejected' ? '✗ Rejected' :
                             plan.status}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                ))}
              </div>
            </div>
          )}
        </div>
        )}

        {/* Assigned Trainees' Day Plans Tab */}
        {activeTab === "trainee-plans" && (
        <div className="card my-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Assigned Trainees' Day Plans</h3>
            <button
              className="cursor-pointer flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
              onClick={() => setShowTraineeCreateForm(true)}
            >
              <LuPlus className="w-5 h-5" />
              <span>Create Trainee Day Plan</span>
            </button>
          </div>

          {/* Date Filter Section */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Filter by Date:</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => handleDateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {dateFilter && (
                  <button
                    onClick={clearDateFilter}
                    className="cursor-pointer px-3 py-2 text-sm text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
              <div className="text-sm text-gray-600">
                Showing {filteredTraineeDayPlans.length} of {traineeDayPlans.length} plans
              </div>
            </div>
          </div>
              
          {filteredTraineeDayPlans.length === 0 ? (
            <div className="text-center py-8">
              <LuFileText className="mx-auto text-4xl text-gray-400 mb-2" />
              <p className="text-gray-500">
                {dateFilter ? `No day plans found for ${moment(dateFilter).format('MMM DD, YYYY')}` : 'No trainee day plans created yet.'}
              </p>
              {dateFilter && (
                <button
                  onClick={clearDateFilter}
                  className="cursor-pointer mt-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  Clear date filter
                </button>
              )}
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTraineeDayPlans.map((plan) => (
                <div key={plan._id} className="border rounded-md p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col h-full">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-sm leading-tight">
                          {plan.trainee?.name || 'Unknown Trainee'}
                        </h4>
                        <span className={`px-2 py-1 text-xs rounded ml-2 flex-shrink-0 ${
                          plan.status === 'completed' ? 'bg-green-100 text-green-800' :
                          plan.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          plan.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                          plan.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {plan.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {plan.trainee?.email || 'No email'}
                      </p>
                      <div className="text-xs text-gray-500 mb-3">
                        <div className="flex items-center mb-1">
                          <LuCalendar className="w-3 h-3 mr-1" />
                          {moment(plan.date).format('MMM DD, YYYY')}
                        </div>
                        <div className="flex items-center">
                          <LuFileText className="w-3 h-3 mr-1" />
                          Created by: {plan.createdBy === 'trainer' ? 'Trainer' : 'Trainee'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="text-xs text-gray-500">
                        {plan.tasks?.length || 0} tasks
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => {
                            setSelectedTraineePlan(plan);
                            setShowTraineePlanPopup(true);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 cursor-pointer"
                          title="View Details"
                        >
                          <LuEye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleTraineeDelete(plan._id)}
                          className="p-1 text-gray-400 hover:text-red-600 cursor-pointer"
                          title="Delete"
                        >
                          <LuTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            </div>
          )}
        </div>
        )}

        {/* Create Trainee Day Plan Modal */}
        {showTraineeCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Create Trainee Day Plan</h3>
              <button
                onClick={() => {
                  setShowTraineeCreateForm(false);
                  resetTraineeForm();
                }}
                className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleTraineeSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <input
                  type="text"
                  value={traineeFormData.title}
                  onChange={(e) => setTraineeFormData({...traineeFormData, title: e.target.value})}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter day plan title"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Date *</label>
                <input
                  type="date"
                  value={traineeFormData.date}
                  onChange={(e) => setTraineeFormData({...traineeFormData, date: e.target.value})}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description *</label>
              <textarea
                value={traineeFormData.description}
                onChange={(e) => setTraineeFormData({...traineeFormData, description: e.target.value})}
                    className="w-full p-2 border rounded-md h-24"
                placeholder="Enter day plan description"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Time</label>
                <input
                  type="time"
                  value={traineeFormData.startTime}
                  onChange={(e) => setTraineeFormData({...traineeFormData, startTime: e.target.value})}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">End Time</label>
                <input
                  type="time"
                  value={traineeFormData.endTime}
                  onChange={(e) => setTraineeFormData({...traineeFormData, endTime: e.target.value})}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">Tasks</label>
                <button
                  type="button"
                      onClick={addTraineeTask}
                      className="cursor-pointer text-blue-600 hover:text-blue-800 text-sm flex items-center"
                >
                      <LuPlus className="w-4 h-4 mr-1" />
                      Add Task
                </button>
              </div>
              
                  {traineeFormData.tasks.map((task, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={task}
                        onChange={(e) => updateTraineeTask(index, e.target.value)}
                        className="flex-1 p-2 border rounded-md"
                        placeholder={`Task ${index + 1}`}
                      />
                        <button
                          type="button"
                        onClick={() => removeTraineeTask(index)}
                        className="text-red-600 hover:text-red-800 p-2 cursor-pointer"
                        >
                        <LuTrash className="w-4 h-4" />
                        </button>
                      </div>
                  ))}
            </div>

            <div>
                  <label className="block text-sm font-medium mb-2">Assign to Trainees</label>
                <button
                  type="button"
                    onClick={() => {
                      setShowTraineeSelector(true);
                      setTraineeSearchTerm("");
                    }}
                    className="cursor-pointer w-full p-2 border rounded-md text-left bg-gray-50 hover:bg-gray-100"
                  >
                    {traineeFormData.selectedTrainees.length === 0 
                      ? "Select trainees..." 
                      : `${traineeFormData.selectedTrainees.length} trainee(s) selected`
                    }
                </button>
                  
                  {/* Selected Trainees Display */}
                  {traineeFormData.selectedTrainees.length > 0 && (
                    <div className="mt-2 space-y-2">
                      <div className="text-sm font-medium text-gray-700">Selected Trainees:</div>
                      <div className="space-y-1">
                        {traineeFormData.selectedTrainees.map((traineeId) => {
                          const trainee = assignedTrainees.find(t => t._id === traineeId);
                          return trainee ? (
                            <div key={traineeId} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-md">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{trainee.name}</div>
                                <div className="text-xs text-gray-600">{trainee.email}</div>
                              </div>
                    <button
                      type="button"
                                onClick={() => removeTrainee(traineeId)}
                                className="cursor-pointer text-red-600 hover:text-red-800 p-1"
                                title="Remove trainee"
                    >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                    </button>
                  </div>
                          ) : null;
                        })}
                </div>
                    </div>
                  )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                value={traineeFormData.notes}
                onChange={(e) => setTraineeFormData({...traineeFormData, notes: e.target.value})}
                    className="w-full p-2 border rounded-md h-20"
                placeholder="Additional notes"
              />
            </div>

                <div className="flex items-center justify-end space-x-3 pt-6 border-t">
              <button 
                type="button" 
                    onClick={() => {
                      setShowTraineeCreateForm(false);
                      resetTraineeForm();
                    }}
                    className="cursor-pointer flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors font-medium"
                  >
                    <span>Cancel</span>
                  </button>
                  <button 
                    type="submit" 
                    className="flex cursor-pointer items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-medium"
                  >
                    <span>Create Trainee Day Plan</span>
              </button>
            </div>
          </form>
            </div>
          </div>
        </div>
      )}

      {/* Trainee Day Plan Review Popup */}
      {showTraineePlanPopup && selectedTraineePlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">
                Review Day Plan - {selectedTraineePlan.trainee?.name || 'Unknown Trainee'}
              </h3>
                <button
                onClick={() => setShowTraineePlanPopup(false)}
                className="text-gray-400 hover:text-gray-600"
                >
                <LuX className="w-6 h-6" />
                </button>
            </div>
            
            <div className="space-y-4">
              {/* Plan Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <p className="text-sm text-gray-900">{moment(selectedTraineePlan.date).format('MMM DD, YYYY')}</p>
            </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    selectedTraineePlan.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    selectedTraineePlan.status === 'completed' ? 'bg-green-100 text-green-800' :
                    selectedTraineePlan.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    selectedTraineePlan.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedTraineePlan.status === 'in_progress' ? 'In Progress' :
                     selectedTraineePlan.status === 'completed' ? 'Completed' :
                     selectedTraineePlan.status === 'rejected' ? 'Rejected' :
                     selectedTraineePlan.status === 'pending' ? 'Pending' :
                     selectedTraineePlan.status || 'Draft'}
                  </span>
          </div>
        </div>

              {/* Tasks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tasks</label>
                <div className="space-y-3">
                  {selectedTraineePlan.tasks && selectedTraineePlan.tasks.length > 0 ? (
                    selectedTraineePlan.tasks.map((task, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between">
                    <div className="flex-1">
                          <h4 className="font-medium text-sm">{task.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>Time: {task.timeAllocation}</span>
                            {task.status && (
                              <span className={`px-2 py-1 rounded ${
                                task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {task.status === 'completed' ? 'Completed' :
                                 task.status === 'in_progress' ? 'In Progress' :
                                 task.status === 'pending' ? 'Pending' :
                                 task.status}
                              </span>
                            )}
                          </div>
                          {task.remarks && (
                            <p className="text-xs text-gray-600 mt-1">Remarks: {task.remarks}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">No tasks assigned</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Checkboxes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Activities</label>
                {(() => {
                  
                  // Handle different checkbox data structures
                  if (!selectedTraineePlan.checkboxes) return false;
                  
                  // Check if it's an array (old format) or object (new format)
                  if (Array.isArray(selectedTraineePlan.checkboxes)) {
                    return selectedTraineePlan.checkboxes.length > 0;
                  } else if (typeof selectedTraineePlan.checkboxes === 'object') {
                    return Object.keys(selectedTraineePlan.checkboxes).length > 0;
                  }
                  
                  return false;
                })() ? (
                  <div className="space-y-2">
                    {(() => {
                      // Handle different checkbox data structures
                      if (Array.isArray(selectedTraineePlan.checkboxes)) {
                        // Old format: array of checkboxes
                        return selectedTraineePlan.checkboxes.map((checkbox, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 border rounded mb-2">
                            <input
                              type="checkbox"
                              checked={checkbox.checked}
                              readOnly
                              className="rounded"
                            />
                            <span className="text-sm">{checkbox.label}</span>
                            {checkbox.timeAllocation && (
                              <span className="text-xs text-gray-500">({checkbox.timeAllocation})</span>
                            )}
                          </div>
                        ));
                      } else {
                        // New format: nested object structure
                        return Object.entries(selectedTraineePlan.checkboxes).map(([taskId, taskCheckboxes]) => (
                          <div key={taskId}>
                            {Object.entries(taskCheckboxes).map(([checkboxId, checkbox]) => (
                              <div key={checkboxId} className="flex items-center gap-2 p-2 border rounded mb-2">
                                <input
                                  type="checkbox"
                                  checked={checkbox.checked}
                                  readOnly
                                  className="rounded"
                                />
                                <span className="text-sm">{checkbox.label}</span>
                                {checkbox.timeAllocation && (
                                  <span className="text-xs text-gray-500">({checkbox.timeAllocation})</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ));
                      }
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">No additional activities</p>
                  </div>
                )}
              </div>

              {/* EOD Update */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End of Day Update</label>
                {selectedTraineePlan.eodUpdate ? (
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <p className="text-sm text-gray-900">{selectedTraineePlan.eodUpdate.overallRemarks}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Submitted: {selectedTraineePlan.eodUpdate.submittedAt ? 
                        moment(selectedTraineePlan.eodUpdate.submittedAt).format('MMM DD, YYYY h:mm A') : 
                        'Date not available'}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">No EOD update submitted</p>
                  </div>
                )}
              </div>

              {/* Review Section */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Remarks
                </label>
                <textarea
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  className="w-full p-3 border rounded-md h-20"
                  placeholder="Enter your review remarks..."
                />
              </div>

              {/* Action Buttons - Only show if status is not completed */}
              {selectedTraineePlan.status !== 'completed' && (
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setShowTraineePlanPopup(false)}
                    className="flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
                  >
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={handleRejectPlan}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Reject
                  </button>
                  <button
                    onClick={handleAcceptPlan}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Accept
                  </button>
                </div>
              )}

              {/* Show only Cancel button for completed plans */}
              {selectedTraineePlan.status === 'completed' && (
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setShowTraineePlanPopup(false)}
                    className="flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
                  >
                    <span>Close</span>
                  </button>
                </div>
              )}
                    </div>
                  </div>
        </div>
      )}

      {/* Trainee Selector Modal */}
      {showTraineeSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
          <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Select Trainees</h3>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  {traineeFormData.selectedTrainees.length} selected
                </div>
            <button 
                  onClick={() => {
                    if (traineeFormData.selectedTrainees.length === assignedTrainees.length) {
                      // If all are selected, clear all
                      setTraineeFormData({
                        ...traineeFormData,
                        selectedTrainees: []
                      });
                    } else {
                      // Select all
                      setTraineeFormData({
                        ...traineeFormData,
                        selectedTrainees: assignedTrainees.map(t => t._id)
                      });
                    }
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {traineeFormData.selectedTrainees.length === assignedTrainees.length ? 'Clear All' : 'Select All'}
            </button>
                      </div>
                    </div>
                    
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search trainees..."
                  value={traineeSearchTerm}
                  onChange={(e) => setTraineeSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                                  </div>
                                </div>
                                
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {assignedTrainees
                .filter(trainee => 
                  trainee.name?.toLowerCase().includes(traineeSearchTerm.toLowerCase()) ||
                  trainee.email?.toLowerCase().includes(traineeSearchTerm.toLowerCase()) ||
                  trainee.employeeId?.toLowerCase().includes(traineeSearchTerm.toLowerCase())
                )
                .map((trainee) => {
                const isSelected = traineeFormData.selectedTrainees.includes(trainee._id);
                return (
                  <div
                    key={trainee._id}
                    onClick={() => toggleTrainee(trainee._id)}
                    className={`w-full p-3 rounded-md border cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-blue-50 border-blue-300' 
                        : 'hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected 
                          ? 'bg-blue-600 border-blue-600' 
                          : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                                        </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{trainee.name}</div>
                        <div className="text-sm text-gray-600">{trainee.email}</div>
                        <div className="text-xs text-gray-500">ID: {trainee.employeeId}</div>
                                        </div>
                                    </div>
                                  </div>
                );

              })}
                              </div>
                              
            <div className="flex justify-end mt-6">
              <div className="space-x-3">
                                <button
                  onClick={() => setShowTraineeSelector(false)}
                  className="flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
                >
                  <span>Cancel</span>
                </button>
                <button
                  onClick={() => setShowTraineeSelector(false)}
                  className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
                >
                  <span>Done</span>
                                </button>
                              </div>
                            </div>
                          </div>
        </div>
      )}
      </div>
      {/* Popup Preview */}
      {previewPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Day Plan - {moment(previewPlan.date).format('MMM DD, YYYY')}</h3>
              <button onClick={() => setPreviewPlan(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">✕</button>
            </div>
            <div className="mb-4 text-sm text-gray-600">
              <div> Trainee: <span className="font-medium text-gray-900">{previewPlan.trainee?.name || 'Unknown Trainee'}</span></div>
              <div> Status: <span className="font-medium">{previewPlan.status}</span></div>
            </div>
            {(() => {
              const parse = (s) => { if(!s) return null; const m=s.match(/(\d{1,2}):(\d{2})(am|pm)[–-](\d{1,2}):(\d{2})(am|pm)/i); if(!m) return null; const toMin=(h,mm,ap)=>{let hh=parseInt(h,10)%12; if(ap.toLowerCase()==='pm') hh+=12; return hh*60+parseInt(mm,10);}; return {start:toMin(m[1],m[2],m[3]), end:toMin(m[4],m[5],m[6])}; };
              let minutes=0; (previewPlan.tasks||[]).forEach(t=>{ const r=parse(t.timeAllocation); if(r) minutes+=Math.max(0,r.end-r.start); });
              if (previewPlan.checkboxes){ const groups = Array.isArray(previewPlan.checkboxes)?[]:Object.values(previewPlan.checkboxes); groups.forEach(g=>{ const arr=Array.isArray(g)?g:Object.values(g); arr.forEach(cb=>{ const r=parse(cb.timeAllocation); if(r) minutes+=Math.max(0,r.end-r.start); }); }); }
              const hrs=Math.floor(minutes/60), mins=minutes%60;
              return (<div className="flex items-center justify-between rounded bg-gray-50 border p-2 mb-4"><span className="text-sm text-gray-700 font-medium">Total Planned Time</span><span className="text-sm text-gray-900 font-semibold">{hrs}h {mins}m</span></div>);
            })()}
            <div className="space-y-2">
              {(previewPlan.tasks||[]).map((task,idx)=> (
                <div key={idx} className="border rounded-lg p-3">
                  <div className="font-medium text-sm">{task.title}</div>
                  <div className="text-xs text-gray-600">Time: {task.timeAllocation}</div>
                  {(() => { const possibleKeys=[idx,String(idx),task.id,task.id?.toString()]; let tcb=null; if(previewPlan.checkboxes){ for(const k of possibleKeys){ if(previewPlan.checkboxes[k]){ tcb=previewPlan.checkboxes[k]; break; } } } if(!tcb) return null; const arr=Array.isArray(tcb)?tcb:Object.values(tcb); if(arr.length===0) return null; return (<div className="mt-2"><div className="text-sm font-medium text-gray-700 mb-1">Additional Activities</div>{arr.map((cb,i)=>(<div key={i} className="flex items-center gap-2 p-2 border rounded mb-2 bg-gray-50"><input type="checkbox" readOnly checked={!!cb.checked} className="rounded"/><span className="text-sm">{cb.label}</span>{cb.timeAllocation && <span className="text-xs text-gray-500">({cb.timeAllocation})</span>}</div>))}</div>); })()}
                </div>
              ))}
            </div>
            {/* Actions */}
            <div className="flex justify-between items-center mt-4 pt-3 border-t">
              <div className="text-xs text-gray-500">Current status: {previewPlan.status}</div>
              <div className="space-x-2">
                {(previewPlan.status === 'in_progress' || previewPlan.status === 'pending') && (
                  <>
                    <button
                      onClick={() => { handleAcceptPlanFromList(previewPlan._id); setPreviewPlan(null); }}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => { handleRejectPlanFromList(previewPlan._id); setPreviewPlan(null); }}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 cursor-pointer"
                    >
                      Reject
                    </button>
                  </>
                )}
                <button onClick={()=>setPreviewPlan(null)} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 cursor-pointer">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default DayPlans;