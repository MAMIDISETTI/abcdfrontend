import React, { useState, useEffect, useContext } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { 
  LuCalendar, 
  LuCheck, 
  LuVideo, 
  LuUser, 
  LuClock, 
  LuPlus, 
  LuSave, 
  LuEye, 
  LuUpload, 
  LuDownload,
  LuStar,
  LuFileText,
  LuX,
  LuClock3,
  LuPencil,
  LuLoader
} from 'react-icons/lu';
import { UserContext } from '../../context/userContext';
import moment from 'moment';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';

const TraineeMainDashboard = () => {
  const { user } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState('day-plan');
  const [dayPlan, setDayPlan] = useState({
    tasks: [{ id: 1, title: '', timeAllocation: '', description: '' }],
    date: moment().format('YYYY-MM-DD'),
    status: 'draft' // draft, submitted
  });

  const [dynamicCheckboxes, setDynamicCheckboxes] = useState({});
  const [submittedDayPlans, setSubmittedDayPlans] = useState([]);
  const [selectedDayPlan, setSelectedDayPlan] = useState(null);
  const [showViewPopup, setShowViewPopup] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [eodStatus, setEodStatus] = useState({
    tasks: [],
    remarks: '',
    submitted: false
  });
  const [isEditingEod, setIsEditingEod] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState({});
  const [taskStatuses, setTaskStatuses] = useState({});
  const [checkboxStatuses, setCheckboxStatuses] = useState({}); // key: planId-taskKey-checkboxId
  const [taskRemarks, setTaskRemarks] = useState({});
  const [isSubmittingDayPlan, setIsSubmittingDayPlan] = useState(false);
  const [isUpdatingEod, setIsUpdatingEod] = useState(false);
  const [isLoadingDayPlans, setIsLoadingDayPlans] = useState(true);
  const [previewTaskPlan, setPreviewTaskPlan] = useState(null);
  const [modalTaskStatuses, setModalTaskStatuses] = useState({});
  const [modalTaskRemarks, setModalTaskRemarks] = useState({});
  const [modalCheckboxStatuses, setModalCheckboxStatuses] = useState({}); // key: planId-taskIndex-checkboxKey
  const [modalCheckboxRemarks, setModalCheckboxRemarks] = useState({});

  // Load submitted day plans from backend
  useEffect(() => {
    const fetchSubmittedDayPlans = async () => {
      setIsLoadingDayPlans(true);
      try {
        const response = await axiosInstance.get(API_PATHS.TRAINEE_DAY_PLANS.GET_ALL);
        if (response.data.dayPlans) {
          const formattedPlans = response.data.dayPlans.map(plan => ({
            id: plan._id,
            date: plan.date,
            tasks: plan.tasks,
            checkboxes: plan.checkboxes || {},
            submittedAt: plan.submittedAt,
            status: plan.status,
            eodUpdate: plan.eodUpdate, // Include EOD update data
            createdBy: plan.createdBy || 'trainee' // Include who created the plan
          }));
          setSubmittedDayPlans(formattedPlans);
          
          // Load task statuses from database
          const statuses = {};
          const remarks = {};
          const cbStatuses = {};
          formattedPlans.forEach(plan => {
            plan.tasks.forEach((task, index) => {
              const taskKey = `${plan.id}-${index}`;
              if (task.status) {
                statuses[taskKey] = task.status;
              }
              if (task.remarks) {
                remarks[taskKey] = task.remarks;
              }
            });
            // seed checkbox statuses for today's plans
            if (plan.checkboxes) {
              plan.tasks.forEach((task, index) => {
                const possibleKeys = [String(task.id), task.id, String(index), index];
                let taskCheckboxes = null;
                for (const key of possibleKeys) {
                  if (plan.checkboxes[key]) { taskCheckboxes = plan.checkboxes[key]; break; }
                }
                if (!taskCheckboxes) return;
                const array = Array.isArray(taskCheckboxes) ? taskCheckboxes : Object.values(taskCheckboxes);
                array.forEach(cb => {
                  const stateKey = `${plan.id}-${(task.id ?? index)}-${(cb.id ?? cb.checkboxId ?? cb.label)}`;
                  cbStatuses[stateKey] = !!cb.checked;
                });
              });
            }
          });
          setTaskStatuses(statuses);
          setTaskRemarks(remarks);
          setCheckboxStatuses(cbStatuses);
        }
      } catch (error) {
        console.error('Error fetching submitted day plans:', error);
        // Don't show error to user as this is background loading
      } finally {
        setIsLoadingDayPlans(false);
      }
    };

    fetchSubmittedDayPlans();
  }, []);

  // Load draft from localStorage on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('traineeDayPlanDraft');
    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft);
        setDayPlan({
          tasks: draftData.tasks,
          date: draftData.date,
          status: 'draft'
        });
        setDynamicCheckboxes(draftData.checkboxes || {});
        toast.success('Draft loaded from previous session');
      } catch (error) {
        console.error('Error loading draft:', error);
        localStorage.removeItem('traineeDayPlanDraft');
      }
    }
  }, []);

  const handleAddTask = () => {
    setDayPlan(prev => ({
      ...prev,
      tasks: [...prev.tasks, { 
        id: Date.now(), 
        title: '', 
        timeAllocation: '', 
        description: '' 
      }]
    }));
  };

  const handleTaskChange = (taskId, field, value) => {
    setDayPlan(prev => ({
      ...prev,
      tasks: prev.tasks.map(task => 
        task.id === taskId ? { ...task, [field]: value } : task
      )
    }));
  };

  const handleRemoveTask = (taskId) => {
    setDayPlan(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== taskId)
    }));
  };

  // Handle adding a new checkbox
  const handleAddCheckbox = (taskId) => {
    const checkboxId = `checkbox_${Date.now()}`;
    setDynamicCheckboxes(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        [checkboxId]: {
          id: checkboxId,
          label: '',
          checked: false,
          timeAllocation: ''
        }
      }
    }));
  };

  // Handle checkbox toggle
  const handleCheckboxToggle = (taskId, checkboxId) => {
    setDynamicCheckboxes(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        [checkboxId]: {
          ...prev[taskId][checkboxId],
          checked: !prev[taskId][checkboxId].checked
        }
      }
    }));
  };

  // Handle checkbox label change
  const handleCheckboxLabelChange = (taskId, checkboxId, label) => {
    setDynamicCheckboxes(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        [checkboxId]: {
          ...prev[taskId][checkboxId],
          label: label
        }
      }
    }));
  };

  // Handle checkbox time allocation change
  const handleCheckboxTimeChange = (taskId, checkboxId, timeAllocation) => {
    setDynamicCheckboxes(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        [checkboxId]: {
          ...prev[taskId][checkboxId],
          timeAllocation: timeAllocation
        }
      }
    }));
  };

  // Remove a checkbox
  const handleRemoveCheckbox = (taskId, checkboxId) => {
    setDynamicCheckboxes(prev => {
      const newCheckboxes = { ...prev };
      if (newCheckboxes[taskId]) {
        delete newCheckboxes[taskId][checkboxId];
        // If no checkboxes left for this task, remove the task entry
        if (Object.keys(newCheckboxes[taskId]).length === 0) {
          delete newCheckboxes[taskId];
        }
      }
      return newCheckboxes;
    });
  };

  // Helper function to validate time range format
  const isValidTimeRange = (timeString) => {
    if (!timeString || !timeString.trim()) return false;
    
    // Basic regex pattern for time range format: 9:05am–12:20pm or 09:05am–12:20pm
    // Accepts both en dash (–) and regular hyphen (-)
    const timeRangePattern = /^(\d{1,2}:\d{2}(am|pm))[–-](\d{1,2}:\d{2}(am|pm))$/i;
    return timeRangePattern.test(timeString.trim());
  };

  // Helper function to reset the form
  const resetForm = () => {
    setDayPlan({
      tasks: [{ id: 1, title: '', timeAllocation: '', description: '' }],
      date: moment().format('YYYY-MM-DD'),
      status: 'draft'
    });
    setDynamicCheckboxes({});
    setIsEditing(false);
  };

  const handleViewDayPlan = (plan) => {
    setSelectedDayPlan(plan);
    setShowViewPopup(true);
  };

  const handleEditDayPlan = (plan) => {
    // Close the view popup if it's open
    setShowViewPopup(false);

    // Ensure tasks have proper IDs for checkbox mapping
    const tasksWithIds = plan.tasks.map((task, index) => {
      // Preserve the original task ID if it exists, otherwise generate one
      const taskWithId = {
        ...task,
        id: task.id || `task_${Date.now()}_${index}` // Generate ID if missing
      };
      return taskWithId;
    });

    // Load the plan data into the form for editing
    setDayPlan({
      tasks: tasksWithIds,
      date: plan.date,
      status: 'draft'
    });
    
    // Map checkboxes to use the task IDs
    const mappedCheckboxes = {};
    if (plan.checkboxes) {
      
      // For each task, map its checkboxes using the task ID
      tasksWithIds.forEach((task, index) => {
        const taskId = task.id;
        
        // Try multiple possible keys for the checkboxes
        const possibleKeys = [
          String(taskId),     // Task ID as string (e.g., "1")
          taskId,             // Task ID as number (e.g., 1)
          String(index),      // Task index as string (e.g., "0")
          index               // Task index as number (e.g., 0)
        ];

        let found = false;
        for (const key of possibleKeys) {
          if (plan.checkboxes[key]) {
            mappedCheckboxes[taskId] = plan.checkboxes[key];
            found = true;
            break;
          }
        }
        
        if (!found) {
        }
      });
    }

    setDynamicCheckboxes(mappedCheckboxes);
    
    // Set editing state
    setIsEditing(true);
    
    // Remove the plan from submitted plans since we're editing it
    setSubmittedDayPlans(prev => prev.filter(p => p.id !== plan.id));

    // Add a small delay to check if dynamicCheckboxes state is updated
    setTimeout(() => {
    }, 100);
    
    toast.success('Day plan loaded for editing');
  };

  const handleCancelEdit = () => {
    // Reset form to default state
    resetForm();
    
    // Clear editing state
    setIsEditing(false);
    
    // Refresh submitted day plans to show the original plan
    const fetchSubmittedDayPlans = async () => {
      try {
        const response = await axiosInstance.get(API_PATHS.TRAINEE_DAY_PLANS.GET_ALL);
        if (response.data.dayPlans) {
          const formattedPlans = response.data.dayPlans.map(plan => ({
            id: plan._id,
            date: plan.date,
            tasks: plan.tasks,
            checkboxes: plan.checkboxes || {},
            submittedAt: plan.submittedAt,
            status: plan.status
          }));
          setSubmittedDayPlans(formattedPlans);
        }
      } catch (error) {
        console.error('Error fetching submitted day plans:', error);
      }
    };
    fetchSubmittedDayPlans();
    
    toast.success('Edit cancelled');
  };

  const handleSaveDayPlan = () => {
    // Validate regular tasks
    const hasEmptyTasks = dayPlan.tasks.some(task => 
      !task.title.trim() || !task.timeAllocation || !isValidTimeRange(task.timeAllocation)
    );
    
    // Validate dynamic checkboxes
    const hasEmptyCheckboxes = Object.values(dynamicCheckboxes).some(taskCheckboxes => 
      Object.values(taskCheckboxes).some(checkbox => 
        checkbox.checked && (!checkbox.label.trim() || !checkbox.timeAllocation || !isValidTimeRange(checkbox.timeAllocation))
      )
    );
    
    if (hasEmptyTasks || hasEmptyCheckboxes) {
      toast.error('Please fill in all task and checkbox details with valid time ranges (e.g., 9:05am-12:20pm)');
      return;
    }

    // Save to localStorage only
    const draftData = {
      date: dayPlan.date,
      tasks: dayPlan.tasks,
      checkboxes: dynamicCheckboxes,
      savedAt: new Date().toISOString()
    };

    localStorage.setItem('traineeDayPlanDraft', JSON.stringify(draftData));
    
    // Reset form after successful save
    resetForm();
    
    toast.success('Day plan saved as draft');
  };

  const handleSubmitDayPlan = async () => {
    // Validate regular tasks
    const hasEmptyTasks = dayPlan.tasks.some(task => 
      !task.title.trim() || !task.timeAllocation || !isValidTimeRange(task.timeAllocation)
    );
    
    // Validate dynamic checkboxes
    const hasEmptyCheckboxes = Object.values(dynamicCheckboxes).some(taskCheckboxes => 
      Object.values(taskCheckboxes).some(checkbox => 
        checkbox.checked && (!checkbox.label.trim() || !checkbox.timeAllocation || !isValidTimeRange(checkbox.timeAllocation))
      )
    );
    
    if (hasEmptyTasks || hasEmptyCheckboxes) {
      toast.error('Please fill in all task and checkbox details with valid time ranges (e.g., 9:05am-12:20pm)');
      return;
    }

    setIsSubmittingDayPlan(true);

    try {
      // Submit to backend
      const response = await axiosInstance.post(API_PATHS.TRAINEE_DAY_PLANS.CREATE, {
        date: dayPlan.date,
        tasks: dayPlan.tasks,
        checkboxes: dynamicCheckboxes,
        status: 'submitted'
      });

      if (response.data.success !== false) {
        // Add to submitted day plans for immediate UI update
        const submittedPlan = {
          id: response.data.dayPlan._id,
          date: dayPlan.date,
          tasks: dayPlan.tasks,
          checkboxes: dynamicCheckboxes,
          submittedAt: new Date().toISOString(),
          status: 'in_progress' // Show as In Progress when submitted
        };

        setSubmittedDayPlans(prev => [submittedPlan, ...prev]);

        // Clear localStorage draft
        localStorage.removeItem('traineeDayPlanDraft');

        // Reset form after successful submission
        resetForm();
        
        toast.success(isEditing ? 'Day plan updated successfully' : 'Day plan submitted successfully');
      }
    } catch (error) {
      console.error('Error submitting day plan:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to submit day plan. Please try again.');
      }
    } finally {
      setIsSubmittingDayPlan(false);
    }
  };

  const handleTaskStatusChange = (planId, taskIndex, status, remarks) => {
    const key = `${planId}-${taskIndex}`;
    setTaskStatuses(prev => ({
      ...prev,
      [key]: status
    }));
    
    // Clear remarks if status is completed
    if (status === 'completed') {
      setTaskRemarks(prev => ({
        ...prev,
        [key]: ''
      }));
    }
  };

  const handleTaskRemarksChange = (planId, taskIndex, remarks) => {
    const key = `${planId}-${taskIndex}`;
    setTaskRemarks(prev => ({
      ...prev,
      [key]: remarks
    }));
  };

  const handleCheckboxStatusToggle = (planId, taskKey, checkboxId) => {
    const key = `${planId}-${taskKey}-${checkboxId}`;
    setCheckboxStatuses(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleTaskExpansion = (planId, taskIndex) => {
    const key = `${planId}-${taskIndex}`;
    setExpandedTasks(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleEodUpdate = async () => {
    // Validate that all tasks have status selected
    const todayPlans = submittedDayPlans.filter(plan => 
      moment(plan.date).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD')
    );
    
    let hasValidationError = false;
    const validationErrors = [];

    todayPlans.forEach(plan => {
      plan.tasks.forEach((task, index) => {
        const key = `${plan.id}-${index}`;
        const status = taskStatuses[key];
        const remarks = taskRemarks[key] || '';

        if (!status) {
          hasValidationError = true;
          validationErrors.push(`Task "${task.title}" - Please select a status`);
        } else if ((status === 'in_progress' || status === 'pending') && !remarks.trim()) {
          hasValidationError = true;
          validationErrors.push(`Task "${task.title}" - Remarks are required for In Progress and Pending status`);
        }
      });
    });

    if (hasValidationError) {
      validationErrors.forEach(error => toast.error(error));
      return;
    }

    setIsUpdatingEod(true);

    try {
      // Prepare task updates
      const taskUpdates = [];
      todayPlans.forEach(plan => {
        plan.tasks.forEach((task, index) => {
          const key = `${plan.id}-${index}`;
          const status = taskStatuses[key];
          const remarks = taskRemarks[key] || '';

          taskUpdates.push({
            planId: plan.id,
            taskIndex: index,
            taskTitle: task.title,
            status: status,
            remarks: remarks,
            timeAllocation: task.timeAllocation
          });
        });
      });

      // Prepare checkbox updates
      const checkboxUpdates = [];
      todayPlans.forEach(plan => {
        plan.tasks.forEach((task, index) => {
          const taskKeyForLookup = task.id ?? index;
          const possibleKeys = [String(task.id), task.id, String(index), index];
          let taskCheckboxes = null;
          if (plan.checkboxes) {
            for (const key of possibleKeys) {
              if (plan.checkboxes[key]) { taskCheckboxes = plan.checkboxes[key]; break; }
            }
          }
          if (!taskCheckboxes) return;
          const array = Array.isArray(taskCheckboxes) ? taskCheckboxes : Object.values(taskCheckboxes);
          array.forEach(cb => {
            const stateKey = `${plan.id}-${taskKeyForLookup}-${(cb.id ?? cb.checkboxId ?? cb.label)}`;
            const checked = !!checkboxStatuses[stateKey];
            checkboxUpdates.push({ taskId: taskKeyForLookup, checkboxId: (cb.id ?? cb.checkboxId ?? cb.label), checked });
          });
        });
      });

      // Send EOD update to backend
      const requestData = {
        date: moment().format('YYYY-MM-DD'),
        tasks: taskUpdates,
        checkboxes: checkboxUpdates,
        overallRemarks: eodStatus.remarks
      };

      const response = await axiosInstance.post('/api/trainee-dayplans/eod-update', requestData);

      if (response.data.success !== false) {
    setEodStatus(prev => ({ ...prev, submitted: true }));
    toast.success('EOD status updated successfully');
        
        // Close all expanded task dropdowns
        setExpandedTasks({});
        
        // Send notification to trainer
        // This will be handled by the backend
      }
    } catch (error) {
     // console.error('Error updating EOD status:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to update EOD status. Please try again.');
      }
    } finally {
      setIsUpdatingEod(false);
    }
  };

  // Submit EOD update from the preview modal for a single plan
  const handleEodUpdateFromModal = async (plan) => {
    // Validate selections
    let hasError = false;
    const errors = [];
    plan.tasks.forEach((task, index) => {
      const key = `${plan.id}-${index}`;
      const status = modalTaskStatuses[key];
      const remarks = modalTaskRemarks[key] || '';
      if (!status) {
        hasError = true;
        errors.push(`Select status for "${task.title}"`);
      } else if ((status === 'in_progress' || status === 'pending') && !remarks.trim()) {
        hasError = true;
        errors.push(`Remarks required for "${task.title}"`);
      }
    });
    // Validate checkbox statuses/remarks when provided
    const possibleTaskKeys = plan.tasks.map((_, idx) => idx);
    possibleTaskKeys.forEach((tIdx) => {
      const task = plan.tasks[tIdx];
      const possibleKeys = [tIdx, String(tIdx), task.id, task.id?.toString()];
      let group = null;
      if (plan.checkboxes) { for (const k of possibleKeys) { if (plan.checkboxes[k]) { group = plan.checkboxes[k]; break; } } }
      if (!group) return;
      const arr = Array.isArray(group) ? group : Object.values(group);
      arr.forEach((cb, i) => {
        const cbKey = `${plan.id}-${tIdx}-${cb.id ?? cb.checkboxId ?? i}`;
        const st = modalCheckboxStatuses[cbKey];
        const rem = modalCheckboxRemarks[cbKey] || '';
        if (st && (st==='in_progress' || st==='pending') && !rem.trim()) {
          hasError = true;
          errors.push(`Remarks required for "${cb.label}"`);
        }
      });
    });
    if (hasError) {
      errors.forEach(e => toast.error(e));
      return;
    }

    setIsUpdatingEod(true);
    try {
      // Build task updates just for this plan
      const taskUpdates = plan.tasks.map((task, index) => ({
        planId: plan.id,
        taskIndex: index,
        taskTitle: task.title,
        status: modalTaskStatuses[`${plan.id}-${index}`],
        remarks: modalTaskRemarks[`${plan.id}-${index}`] || '',
        timeAllocation: task.timeAllocation
      }));

      const requestData = {
        date: moment(plan.date).format('YYYY-MM-DD'),
        tasks: taskUpdates,
        overallRemarks: eodStatus.remarks || ''
      };

      await axiosInstance.post('/api/trainee-dayplans/eod-update', requestData);
      toast.success('EOD status updated successfully');
      setPreviewTaskPlan(null);
      // refresh list
      try {
        const response = await axiosInstance.get(API_PATHS.TRAINEE_DAY_PLANS.GET_ALL);
        if (response.data.dayPlans) {
          const formatted = response.data.dayPlans.map(p => ({
            id: p._id, date: p.date, tasks: p.tasks, checkboxes: p.checkboxes || {}, submittedAt: p.submittedAt, status: p.status, eodUpdate: p.eodUpdate, createdBy: p.createdBy || 'trainee'
          }));
          setSubmittedDayPlans(formatted);
        }
      } catch {}
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update EOD');
    } finally {
      setIsUpdatingEod(false);
    }
  };

  const renderDayPlan = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Day Plan Submission</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Date: {moment(dayPlan.date).format('MMM DD, YYYY')}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              dayPlan.status === 'submitted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {dayPlan.status === 'submitted' ? 'Submitted' : 'Draft'}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {dayPlan.tasks.map((task, index) => (
            <div key={task.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Task {index + 1}</h3>
                {dayPlan.tasks.length > 1 && (
                  <button
                    onClick={() => handleRemoveTask(task.id)}
                    className="text-red-500 hover:text-red-700 cursor-pointer"
                  >
                    <LuX className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                  <input
                    type="text"
                    value={task.title}
                    onChange={(e) => handleTaskChange(task.id, 'title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter task title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Allocation</label>
                  <input
                    type="text"
                    value={task.timeAllocation}
                    onChange={(e) => handleTaskChange(task.id, 'timeAllocation', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      task.timeAllocation && !isValidTimeRange(task.timeAllocation)
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300'
                    }`}
                    placeholder="e.g., 9:00am-12:00pm or 9:05am–12:20pm"
                  />
                  {task.timeAllocation && !isValidTimeRange(task.timeAllocation) && (
                    <p className="text-xs text-red-500 mt-1">Please use format: 9:00am-12:00pm or 9:05am–12:20pm</p>
                  )}
                </div>
              </div>

              {/* Dynamic Checkboxes Section */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Checkboxes</label>
                  <button
                    onClick={() => handleAddCheckbox(task.id)}
                    className="cursor-pointer px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-1"
                  >
                    <LuPlus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </div>
                
                {/* Display checkboxes for this task */}
                {(() => {
                  
                  if (!dynamicCheckboxes[task.id] || Object.keys(dynamicCheckboxes[task.id]).length === 0) {
                    return (
                      <div className="text-sm text-gray-500 italic mb-3">
                        No checkboxes added for this task
                      </div>
                    );
                  }
                  return Object.values(dynamicCheckboxes[task.id]).map((checkbox) => (
                  <div key={checkbox.id} className="mb-3 p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center space-x-3 mb-2">
                      <input
                        type="checkbox"
                        checked={checkbox.checked}
                        onChange={() => handleCheckboxToggle(task.id, checkbox.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={checkbox.label}
                        onChange={(e) => handleCheckboxLabelChange(task.id, checkbox.id, e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter checkbox label"
                      />
                      <div className="relative">
                        <input
                          type="text"
                          value={checkbox.timeAllocation}
                          onChange={(e) => handleCheckboxTimeChange(task.id, checkbox.id, e.target.value)}
                          className={`w-32 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            checkbox.timeAllocation && !isValidTimeRange(checkbox.timeAllocation)
                              ? 'border-red-300 bg-red-50'
                              : 'border-gray-300'
                          }`}
                          placeholder="9:05am-12:20pm"
                        />
                        {checkbox.timeAllocation && !isValidTimeRange(checkbox.timeAllocation) && (
                          <div className="absolute top-full left-0 mt-1 text-xs text-red-500 whitespace-nowrap">
                            Invalid format
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveCheckbox(task.id, checkbox.id)}
                        className="text-red-500 hover:text-red-700 cursor-pointer"
                      >
                        <LuX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ));
                })()}
              </div>
              
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={task.description}
                  onChange={(e) => handleTaskChange(task.id, 'description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="2"
                  placeholder="Describe the task in detail"
                />
              </div>
            </div>
          ))}
          
          <button
            onClick={handleAddTask}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center space-x-2 cursor-pointer"
          >
            <LuPlus className="w-4 h-4" />
            <span>Add Another Task</span>
          </button>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          {isEditing && (
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 cursor-pointer"
            >
              <LuX className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          )}
          
          <button
            onClick={handleSaveDayPlan}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 cursor-pointer"
          >
            <LuSave className="w-4 h-4" />
            <span>Save as Draft</span>
          </button>
          
          <button
            onClick={handleSubmitDayPlan}
            disabled={isSubmittingDayPlan}
            className={`cursor-pointer px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 ${
              isSubmittingDayPlan 
                ? 'opacity-75 cursor-not-allowed' 
                : 'cursor-pointer'
            }`}
          >
            {isSubmittingDayPlan && <LuLoader className="w-4 h-4 animate-spin" />}
            {!isSubmittingDayPlan && <LuCheck className="w-4 h-4" />}
            <span>
              {isSubmittingDayPlan 
                ? (isEditing ? 'Updating...' : 'Submitting...') 
                : (isEditing ? 'Update Day Plan' : 'Submit Day Plan')
              }
            </span>
          </button>
        </div>
      </div>

      {/* Previous Day Plans */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Previous Day Plans</h3>
        {isLoadingDayPlans ? (
          <div className="text-center py-12">
            <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <LuLoader className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Day Plans...</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">Please wait while we fetch your submitted day plans.</p>
          </div>
        ) : submittedDayPlans.length > 0 ? (
        <div className="space-y-2">
            {submittedDayPlans.map((plan) => (
              <div key={plan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">
                    {moment(plan.date).format('MMM DD, YYYY')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {plan.tasks.length} task{plan.tasks.length !== 1 ? 's' : ''} • 
                    {plan.checkboxes && Object.keys(plan.checkboxes).length > 0 && 
                      ` ${Object.values(plan.checkboxes).flat().length} checkbox${Object.values(plan.checkboxes).flat().length !== 1 ? 'es' : ''}`
                    }
                  </p>
              </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    plan.status === 'draft' 
                      ? 'bg-gray-100 text-gray-800'
                      : plan.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-800'
                      : plan.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : plan.status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {plan.status === 'draft' ? 'Draft' :
                     plan.status === 'in_progress' ? 'In Progress' :
                     plan.status === 'completed' ? 'Completed' :
                     plan.status === 'rejected' ? 'Rejected' :
                     plan.status}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleViewDayPlan(plan)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1 cursor-pointer"
                    >
                <LuEye className="w-4 h-4" />
                <span>View</span>
              </button>
                    {plan.status === 'in_progress' && (
                      <button 
                        onClick={() => handleEditDayPlan(plan)}
                        className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center space-x-1 cursor-pointer"
                      >
                        <LuPencil className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                </div>
            </div>
          ))}
        </div>
        ) : (
          <div className="text-center py-12">
            <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <LuFileText className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Day Plans Found</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">You haven't submitted any day plans yet. Create and submit your first day plan above!</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderTaskStatus = () => (
    <div className="space-y-6">
      {/* Day Plans Display */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <LuCheck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Today's Tasks</h2>
              <p className="text-sm text-gray-500">Update your task progress and status</p>
            </div>
          </div>
        </div>
        
        {(() => {
          const todayPlans = submittedDayPlans.filter(plan => 
            moment(plan.date).isSame(moment(), 'day') &&
            plan.status === 'completed' && 
            plan.eodUpdate?.status !== 'approved' // Only show completed day plans that haven't been fully approved yet
          );
          
          // Debug logging
          
          return todayPlans.length > 0 ? (
            <div className="space-y-6">
              {todayPlans.map((plan, planIndex) => (
                <div key={plan.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-white rounded-lg shadow-sm">
                        <LuCalendar className="w-5 h-5 text-blue-600" />
                      </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {todayPlans.length > 1 ? `Task Set ${planIndex + 1}` : 'Assigned Tasks'}
                      </h3>
                        <p className="text-sm text-gray-600">
                          {moment(plan.date).format('MMM DD, YYYY')} • {plan.tasks.length} task{plan.tasks.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setPreviewTaskPlan(plan)}
                        className="px-4 py-2 text-sm font-medium rounded-full bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 cursor-pointer"
                      >
                        View
                      </button>
                    </div>
              </div>
              
                  {/* Tasks from Day Plan - hidden by default; use View button to preview */}
                  <div className="hidden">
                    {plan.tasks.map((task, index) => {
                      const taskKey = `${plan.id}-${index}`;
                      const isExpanded = expandedTasks[taskKey];
                      const currentStatus = taskStatuses[taskKey];
                      const currentRemarks = taskRemarks[taskKey] || '';
                      const isEodApproved = plan.eodUpdate?.status === 'approved' && plan.status === 'completed';
                      
                      return (
                        <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-all duration-200">
                          <div 
                            className={`flex items-center justify-between mb-3 p-3 rounded-lg transition-all duration-200 ${
                              !isEodApproved ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-200' : 'cursor-default bg-gray-50'
                            }`}
                            onClick={() => !isEodApproved && toggleTaskExpansion(plan.id, index)}
                          >
                            <div className="flex items-center space-x-3">
                              <LuCheck className="w-4 h-4 text-gray-600" />
                              <div>
                                <h4 className="font-semibold text-gray-900">Task {index + 1}: {task.title}</h4>
                                <p className="text-sm text-gray-500">{task.timeAllocation}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              {currentStatus && (
                                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                                  currentStatus === 'completed' ? 'bg-green-100 text-green-700 border border-green-200' :
                                  currentStatus === 'in_progress' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                  'bg-red-100 text-red-700 border border-red-200'
                                }`}>
                                  {currentStatus === 'completed' ? '✓ Completed' :
                                   currentStatus === 'in_progress' ? '⏳ In Progress' :
                                   '⏸ Pending'}
                                </span>
                              )}
                              {isEodApproved && (
                                <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                                  ✓ Finalized
                                </span>
                              )}
                              {!isEodApproved && (
                                <span className="text-gray-500 text-sm">{isExpanded ? '▼' : '▶'}</span>
                              )}
                            </div>
                          </div>
                          
                          {task.description && (
                            <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                          )}
                          
                          {/* Expanded Task Status Selection */}
                          {isExpanded && (
                            <div className="space-y-3 mt-4">
                              <div className="flex items-center space-x-4">
                                {/* Editable radio buttons - only show if not approved */}
                                {!isEodApproved ? (
                                  <>
                <label className="flex items-center space-x-2">
                                  <input 
                                    type="radio" 
                                    name={`status-${plan.id}-${index}`} 
                                    value="completed" 
                                    className="text-green-500"
                                    checked={currentStatus === 'completed'}
                                    onChange={() => handleTaskStatusChange(plan.id, index, 'completed', '')}
                                  />
                  <span className="text-sm text-gray-700">Completed</span>
                </label>
                <label className="flex items-center space-x-2">
                                  <input 
                                    type="radio" 
                                    name={`status-${plan.id}-${index}`} 
                                    value="in_progress" 
                                    className="text-yellow-500"
                                    checked={currentStatus === 'in_progress'}
                                    onChange={() => handleTaskStatusChange(plan.id, index, 'in_progress', '')}
                                  />
                  <span className="text-sm text-gray-700">In Progress</span>
                </label>
                <label className="flex items-center space-x-2">
                                  <input 
                                    type="radio" 
                                    name={`status-${plan.id}-${index}`} 
                                    value="pending" 
                                    className="text-red-500"
                                    checked={currentStatus === 'pending'}
                                    onChange={() => handleTaskStatusChange(plan.id, index, 'pending', '')}
                                  />
                  <span className="text-sm text-gray-700">Pending</span>
                </label>
                                  </>
                                ) : (
                                  /* Read-only radio buttons - show selected value */
                                  <>
                                    <label className="flex items-center space-x-2 opacity-60">
                                      <input 
                                        type="radio" 
                                        name={`status-${plan.id}-${index}`} 
                                        value="completed" 
                                        className="text-green-500"
                                        checked={currentStatus === 'completed'}
                                        disabled
                                      />
                                      <span className="text-sm text-gray-700">Completed</span>
                                    </label>
                                    <label className="flex items-center space-x-2 opacity-60">
                                      <input 
                                        type="radio" 
                                        name={`status-${plan.id}-${index}`} 
                                        value="in_progress" 
                                        className="text-yellow-500"
                                        checked={currentStatus === 'in_progress'}
                                        disabled
                                      />
                                      <span className="text-sm text-gray-700">In Progress</span>
                                    </label>
                                    <label className="flex items-center space-x-2 opacity-60">
                                      <input 
                                        type="radio" 
                                        name={`status-${plan.id}-${index}`} 
                                        value="pending" 
                                        className="text-red-500"
                                        checked={currentStatus === 'pending'}
                                        disabled
                                      />
                                      <span className="text-sm text-gray-700">Pending</span>
                                    </label>
                                  </>
                                )}
              </div>
              
                              {/* Remarks Field - Required for In Progress and Pending */}
                              {(currentStatus === 'in_progress' || currentStatus === 'pending') && (
              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Remarks/Blockers
                                    {!isEodApproved && <span className="text-red-500 ml-1">*</span>}
                                  </label>
                                  {!isEodApproved ? (
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="2"
                  placeholder="Add any remarks or blockers for this task"
                                    value={currentRemarks}
                                    onChange={(e) => handleTaskRemarksChange(plan.id, index, e.target.value)}
                                  />
                                  ) : (
                                    <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50">
                                      <p className="text-sm text-gray-700">{currentRemarks || 'No remarks provided'}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Checkbox toggles for Additional Activities */}
                          {(() => {
                            const taskKeyForLookup = task.id ?? index;
                            const possibleKeys = [String(task.id), task.id, String(index), index];
                            let taskCheckboxes = null;
                            if (plan.checkboxes) {
                              for (const key of possibleKeys) {
                                if (plan.checkboxes[key]) { taskCheckboxes = plan.checkboxes[key]; break; }
                              }
                            }
                            if (!taskCheckboxes) return null;
                            const array = Array.isArray(taskCheckboxes) ? taskCheckboxes : Object.values(taskCheckboxes);
                            if (array.length === 0) return null;
                            return (
                              <div className="mt-2 space-y-1">
                                {array.map((cb, i) => {
                                  const cbKey = `${plan.id}-${taskKeyForLookup}-${(cb.id ?? cb.checkboxId ?? cb.label)}`;
                                  const checked = !!checkboxStatuses[cbKey];
                                  return (
                                    <label key={i} className="flex items-center justify-between text-sm py-1">
                                      <div className="flex items-center gap-2">
                                        <input type="checkbox" className="w-4 h-4" disabled={isEodApproved}
                                          checked={checked}
                                          onChange={() => handleCheckboxStatusToggle(plan.id, taskKeyForLookup, (cb.id ?? cb.checkboxId ?? cb.label))}
                                        />
                                        <span className="text-gray-800">{cb.label || `Checklist ${i+1}`}</span>
                                        {cb.timeAllocation && <span className="text-gray-500 text-xs">({cb.timeAllocation})</span>}
                                      </div>
                                      <span className={`text-xs ${checked ? 'text-green-700' : 'text-yellow-700'}`}>
                                        {checked ? 'Completed' : 'Not Completed'}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            );
                          })()}

                          {/* Show read-only status when EOD is approved */}
                          {isExpanded && isEodApproved && (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-green-800">Final Status</span>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  currentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                                  currentStatus === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {currentStatus === 'completed' ? 'Completed' :
                                   currentStatus === 'in_progress' ? 'In Progress' :
                                   currentStatus === 'pending' ? 'Pending' : 'Not Set'}
                                </span>
                              </div>
                              {currentRemarks && (
                                <p className="text-sm text-green-700">
                                  <strong>Remarks:</strong> {currentRemarks}
                                </p>
                              )}
                              <p className="text-xs text-green-600 mt-1">
                                ✓ Approved by trainer - No longer editable
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
              </div>
            </div>
          ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <LuFileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">No approved tasks for today</p>
              <p className="text-gray-400 text-xs mt-1">Approved day plans and assigned tasks will appear here</p>
            </div>
          );
        })()}
        </div>

      {/* EOD Update Section - Only show if there are approved tasks for today */}
      {(() => {
        const todayPlans = submittedDayPlans.filter(plan => 
          moment(plan.date).isSame(moment(), 'day') &&
          (plan.status === 'completed') // Only show EOD section if there are approved tasks
        );
        return todayPlans.length > 0;
      })() && (() => {
        const todayPlan = submittedDayPlans.find(plan => 
          moment(plan.date).isSame(moment(), 'day') &&
          plan.status === 'completed' // Only look for completed plans
        );
        const isPending = todayPlan?.status === 'pending';
        const isCompleted = todayPlan?.status === 'completed';
        const isEodPending = todayPlan?.eodUpdate?.status === 'submitted' && todayPlan?.status === 'pending';
        const isEodApproved = todayPlan?.eodUpdate?.status === 'approved';
        const isEodRejected = todayPlan?.eodUpdate?.status === 'rejected';
        const isPendingInReview = todayPlan?.status === 'pending' && !todayPlan?.eodUpdate; // New status for EOD submission
        
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">End of Day Update</h3>
              <div className="flex items-center space-x-2">
                {isEodPending && (
                  <span className="px-3 py-1 text-sm rounded-full bg-orange-100 text-orange-800">
                    EOD Pending
                  </span>
                )}
                {isEodApproved && (
                  <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-800">
                    EOD Approved
                  </span>
                )}
                {isEodRejected && (
                  <span className="px-3 py-1 text-sm rounded-full bg-red-100 text-red-800">
                    EOD Rejected
                  </span>
                )}
                {isPendingInReview && (
                  <span className="px-3 py-1 text-sm rounded-full bg-orange-100 text-orange-800">
                    Pending in Review
                  </span>
                )}
                {isPending && !isEodPending && !isEodApproved && !isEodRejected && !isPendingInReview && (
                  <span className="px-3 py-1 text-sm rounded-full bg-yellow-100 text-yellow-800">
                    Pending Review
                  </span>
                )}
                {isCompleted && !isEodApproved && !isEodRejected && (
                  <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-800">
                    Approved
                  </span>
                )}
                {!isPending && !isCompleted && !isEodPending && !isEodApproved && !isEodRejected && (
                  <span className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-800">
                    Not Submitted
                  </span>
                )}
                {isPending && !isEodPending && !isEodApproved && !isEodRejected && (
                  <button
                    onClick={() => setIsEditingEod(!isEditingEod)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    {isEditingEod ? 'Cancel Edit' : 'Edit'}
                  </button>
                )}
              </div>
            </div>
            
            {/* Show EOD data when pending, completed, EOD pending, approved, or rejected */}
            {(isPending || isCompleted || isEodPending || isEodApproved || isEodRejected) && todayPlan?.eodUpdate && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Submitted EOD Update</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Overall Remarks:</span>
                    <p className="text-sm text-gray-600 mt-1">{todayPlan.eodUpdate.overallRemarks || 'No remarks provided'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Submitted At:</span>
                    <p className="text-sm text-gray-600 mt-1">
                      {moment(todayPlan.eodUpdate.submittedAt).format('MMM DD, YYYY h:mm A')}
                    </p>
                  </div>
                  {todayPlan.eodUpdate.reviewComments && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Review Comments:</span>
                      <p className="text-sm text-gray-600 mt-1">{todayPlan.eodUpdate.reviewComments}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Show input form only when not pending/completed/EOD pending/approved/rejected or when editing */}
            {(!isPending && !isCompleted && !isEodPending && !isEodApproved && !isEodRejected && !isPendingInReview) || isEditingEod ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overall Remarks
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Add any overall remarks about today's work"
                    value={eodStatus.remarks}
                    onChange={(e) => setEodStatus(prev => ({ ...prev, remarks: e.target.value }))}
                  />
                </div>
              </div>
            ) : null}

        <div className="mt-6 pt-4 border-t border-gray-200">
              
        </div>
      </div>
        );
      })()}

      {/* Daily Task History */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <LuClock className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Daily Task History</h3>
              <p className="text-sm text-gray-500">View your completed and approved tasks</p>
            </div>
          </div>
        </div>
        
        {(() => {
          // Get completed and approved day plans for history
          const approvedPlans = submittedDayPlans.filter(plan => 
            plan.status === 'completed' && plan.eodUpdate?.status === 'approved'
          );

          if (approvedPlans.length === 0) {
            return (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <LuClock className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No task history available</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto">Your completed and approved tasks will appear here. Complete your tasks and get them approved by your trainer to see them in history.</p>
              </div>
            );
          }

          return (
            <div className="space-y-6">
              {/* Show approved tasks with progress bars */}
              {approvedPlans.map((plan) => {
                const isApproved = plan.eodUpdate?.status === 'approved';
                
                return (
                  <div key={plan.id} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <LuCalendar className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900 text-lg">
                        {moment(plan.date).format('MMM DD, YYYY')}
                      </h5>
                          <p className="text-sm text-gray-600">
                            {plan.tasks.length} task{plan.tasks.length !== 1 ? 's' : ''} completed
                          </p>
                        </div>
                      </div>
                      {isApproved && (
                        <span className="px-4 py-2 text-sm font-medium rounded-full bg-green-100 text-green-700 border border-green-200">
                          ✓ Approved
                        </span>
                      )}
              </div>
                    
                    <div className="space-y-4">
                      {plan.tasks.map((task, index) => {
                        const status = task.status; // Use the actual status from the database
                        const remarks = task.remarks || '';
                        
                        // Calculate progress percentage
                        const progressPercentage = status === 'completed' ? 100 : 
                                                status === 'in_progress' ? 50 : 
                                                status === 'pending' ? 0 : 0;
                        
                        return (
                          <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-all duration-200">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <LuCheck className="w-4 h-4 text-gray-600" />
                              <div className="flex-1">
                                  <span className="font-semibold text-gray-900">{task.title}</span>
                                <span className="text-sm text-gray-500 ml-2">({task.timeAllocation})</span>
            </div>
                              </div>
                              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                                status === 'completed' ? 'bg-green-100 text-green-700 border border-green-200' :
                                status === 'in_progress' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                status === 'pending' ? 'bg-red-100 text-red-700 border border-red-200' :
                                'bg-gray-100 text-gray-700 border border-gray-200'
                              }`}>
                                {status === 'completed' ? '✓ Completed' :
                                 status === 'in_progress' ? '⏳ In Progress' :
                                 status === 'pending' ? '⏸ Pending' :
                                 'Not Set'}
                              </span>
        </div>
                            
                            {/* Progress Bar */}
                            <div className="mb-2">
                              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                <span>Progress</span>
                                <span>{progressPercentage}%</span>
      </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    progressPercentage === 100 ? 'bg-green-500' :
                                    progressPercentage === 50 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${progressPercentage}%` }}
                                ></div>
                              </div>
                            </div>

                          {/* Checkbox completion indicators for this task */}
                          {(() => {
                            // Locate checkboxes mapped to this task
                            const possibleKeys = [
                              String(task.id),
                              task.id,
                              String(index),
                              index
                            ];

                            let taskCheckboxes = null;
                            if (plan.checkboxes) {
                              for (const key of possibleKeys) {
                                if (plan.checkboxes[key]) {
                                  taskCheckboxes = plan.checkboxes[key];
                                  break;
                                }
                              }
                            }

                            if (!taskCheckboxes || Object.keys(taskCheckboxes).length === 0) {
                              return null;
                            }

                            const checkboxArray = Array.isArray(taskCheckboxes)
                              ? taskCheckboxes
                              : Object.values(taskCheckboxes);

                            return (
                              <div className="mt-2 space-y-1">
                                {checkboxArray.map((cb, i) => (
                                  <div key={i} className="flex items-center justify-between text-sm py-1">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-4 h-4 rounded-sm border ${cb.checked ? 'bg-green-500 border-green-600' : 'bg-white border-gray-300'}`}></div>
                                      <span className="text-gray-800 font-medium">{cb.label || `Checklist ${i+1}`}</span>
                                      {cb.timeAllocation && (
                                        <span className="text-gray-500 text-xs">({cb.timeAllocation})</span>
                                      )}
                                    </div>
                                    <span className={`text-xs ${cb.checked ? 'text-green-700' : 'text-yellow-700'}`}>
                                      {cb.checked ? 'Completed' : 'Not Completed'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                            
                            {remarks && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                                <strong>Remarks:</strong> {remarks}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {plan.eodUpdate?.overallRemarks && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <h6 className="font-medium text-gray-900 mb-1">Overall Remarks:</h6>
                        <p className="text-sm text-gray-600">{plan.eodUpdate.overallRemarks}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );

  const tabs = [
    { id: 'day-plan', label: 'Day Plan', icon: LuCalendar },
    { id: 'task-status', label: 'Task Status', icon: LuCheck }
  ];

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className="p-3 md:p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Trainee Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}! Manage your daily tasks and track your progress.</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`cursor-pointerpy-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {activeTab === 'day-plan' && renderDayPlan()}
          {activeTab === 'task-status' && renderTaskStatus()}
        </div>
      </div>

      {/* Task Status Preview Modal */}
      {previewTaskPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Day Plan - {moment(previewTaskPlan.date).format('MMM DD, YYYY')}</h3>
              <button onClick={() => setPreviewTaskPlan(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">✕</button>
            </div>

            <div className="mb-4 text-sm text-gray-600">Status: <span className="font-medium">{previewTaskPlan.status}</span></div>

            <div className="space-y-2">
              {(previewTaskPlan.tasks || []).map((task, idx) => {
                const tKey = `${previewTaskPlan.id}-${idx}`;
                const currentStatus = modalTaskStatuses[tKey] || '';
                const currentRemarks = modalTaskRemarks[tKey] || '';
                return (
                <div key={idx} className="border rounded-lg p-3">
                  <div className="font-medium text-sm">{task.title}</div>
                  <div className="text-xs text-gray-600">Time: {task.timeAllocation}</div>
                  {/* Status radios */}
                  <div className="mt-2 flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input type="radio" name={`modal-status-${idx}`} value="completed" checked={currentStatus==='completed'} onChange={() => setModalTaskStatuses(prev=>({ ...prev, [tKey]: 'completed' }))} />
                      <span className="text-sm">Completed</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name={`modal-status-${idx}`} value="in_progress" checked={currentStatus==='in_progress'} onChange={() => setModalTaskStatuses(prev=>({ ...prev, [tKey]: 'in_progress' }))} />
                      <span className="text-sm">In Progress</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name={`modal-status-${idx}`} value="pending" checked={currentStatus==='pending'} onChange={() => setModalTaskStatuses(prev=>({ ...prev, [tKey]: 'pending' }))} />
                      <span className="text-sm">Incomplete</span>
                    </label>
                  </div>
                  {(currentStatus==='in_progress' || currentStatus==='pending') && (
                    <div className="mt-2">
                      <textarea rows={2} className="w-full border border-gray-300 rounded p-2 text-sm" placeholder="Enter remarks" value={currentRemarks} onChange={(e)=> setModalTaskRemarks(prev=>({ ...prev, [tKey]: e.target.value }))} />
                      <div className="text-xs text-gray-500 mt-1">Remarks required for In Progress or Incomplete.</div>
                    </div>
                  )}
                  {(() => {
                    const possibleKeys = [idx, String(idx), task.id, task.id?.toString()];
                    let group = null;
                    if (previewTaskPlan.checkboxes) { for (const k of possibleKeys) { if (previewTaskPlan.checkboxes[k]) { group = previewTaskPlan.checkboxes[k]; break; } } }
                    if (!group) return null;
                    const arr = Array.isArray(group) ? group : Object.values(group);
                    if (arr.length === 0) return null;
                    return (
                      <div className="mt-2">
                        <div className="text-sm font-medium text-gray-700 mb-1">Additional Activities</div>
                        {arr.map((cb, i) => {
                          const cbKey = `${previewTaskPlan.id}-${idx}-${cb.id ?? cb.checkboxId ?? i}`;
                          const cbStatus = modalCheckboxStatuses[cbKey] || '';
                          const cbRemarks = modalCheckboxRemarks[cbKey] || '';
                          return (
                            <div key={i} className="p-2 border rounded mb-2 bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{cb.label}</span>
                                  {cb.timeAllocation && <span className="text-xs text-gray-500">({cb.timeAllocation})</span>}
                                </div>
                                <div className="flex items-center gap-4">
                                  <label className="flex items-center gap-1 text-xs">
                                    <input type="radio" name={`modal-cb-${idx}-${i}`} value="completed" checked={cbStatus==='completed'} onChange={()=> setModalCheckboxStatuses(prev=>({ ...prev, [cbKey]:'completed' }))} /> Completed
                                  </label>
                                  <label className="flex items-center gap-1 text-xs">
                                    <input type="radio" name={`modal-cb-${idx}-${i}`} value="in_progress" checked={cbStatus==='in_progress'} onChange={()=> setModalCheckboxStatuses(prev=>({ ...prev, [cbKey]:'in_progress' }))} /> In Progress
                                  </label>
                                  <label className="flex items-center gap-1 text-xs">
                                    <input type="radio" name={`modal-cb-${idx}-${i}`} value="pending" checked={cbStatus==='pending'} onChange={()=> setModalCheckboxStatuses(prev=>({ ...prev, [cbKey]:'pending' }))} /> Incomplete
                                  </label>
                                </div>
                              </div>
                              {(cbStatus==='in_progress' || cbStatus==='pending') && (
                                <div className="mt-2">
                                  <textarea rows={2} className="w-full border border-gray-300 rounded p-2 text-xs" placeholder="Enter remarks" value={cbRemarks} onChange={(e)=> setModalCheckboxRemarks(prev=>({ ...prev, [cbKey]: e.target.value }))} />
                                  <div className="text-[10px] text-gray-500 mt-1">Remarks required for In Progress or Incomplete.</div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              );})}
            </div>

            <div className="flex justify-end mt-4">
              <button onClick={() => handleEodUpdateFromModal(previewTaskPlan)} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer mr-2">Submit EOD Update</button>
              <button onClick={() => setPreviewTaskPlan(null)} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* View Day Plan Popup */}
      {showViewPopup && selectedDayPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Day Plan - {moment(selectedDayPlan.date).format('MMM DD, YYYY')}
              </h3>
              <button
                onClick={() => setShowViewPopup(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <LuX className="w-6 h-6" />
              </button>
            </div>

            {/* Status Badge */}
            <div className="mb-6">
              <span className={`px-3 py-1 text-sm rounded-full ${
                selectedDayPlan.status === 'draft' 
                  ? 'bg-gray-100 text-gray-800'
                  : selectedDayPlan.status === 'in_progress'
                  ? 'bg-blue-100 text-blue-800'
                  : selectedDayPlan.status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : selectedDayPlan.status === 'rejected'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {selectedDayPlan.status === 'draft' ? 'Draft' :
                 selectedDayPlan.status === 'in_progress' ? 'In Progress' :
                 selectedDayPlan.status === 'completed' ? 'Completed' :
                 selectedDayPlan.status === 'rejected' ? 'Rejected' :
                 selectedDayPlan.status}
              </span>
            </div>

            {/* Tasks Section */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Tasks</h4>
              <div className="space-y-3">
                {selectedDayPlan.tasks.map((task, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-medium text-gray-900">{task.title}</h5>
                      <span className="text-sm text-blue-600 font-medium">{task.timeAllocation}</span>
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-600">{task.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Checkboxes Section */}
            {selectedDayPlan.checkboxes && Object.keys(selectedDayPlan.checkboxes).length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">Additional Activities</h4>
                <div className="space-y-3">
                  {Object.entries(selectedDayPlan.checkboxes).map(([taskId, taskCheckboxes]) => (
                    <div key={taskId}>
                      {Object.entries(taskCheckboxes).map(([checkboxId, checkbox]) => (
                        <div key={checkboxId} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <LuCheck className={`w-4 h-4 ${checkbox.checked ? 'text-green-600' : 'text-gray-400'}`} />
                              <span className={`font-medium ${checkbox.checked ? 'text-gray-900' : 'text-gray-500'}`}>
                                {checkbox.label}
                              </span>
                            </div>
                            {checkbox.timeAllocation && (
                              <span className="text-sm text-blue-600 font-medium">{checkbox.timeAllocation}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submission Details */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Submitted:</span> {selectedDayPlan.submittedAt ? moment(selectedDayPlan.submittedAt).format('MMM DD, YYYY h:mm A') : 'Not submitted'}
                </div>
                <div>
                  <span className="font-medium">Status:</span> {selectedDayPlan.status}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              {selectedDayPlan.status === 'in_progress' && (
                <button
                  onClick={() => handleEditDayPlan(selectedDayPlan)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 cursor-pointer"
                >
                  <LuPencil className="w-4 h-4" />
                  <span>Edit Plan</span>
                </button>
              )}
              <button
                onClick={() => setShowViewPopup(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TraineeMainDashboard;
