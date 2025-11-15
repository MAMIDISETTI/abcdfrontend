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
  LuLoader,
  LuFilter
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
    title: '', // Plan title (Static, Responsive, Modern Responsive, etc.)
    date: moment().format('YYYY-MM-DD'),
    topics: [], // Topics/items that can span multiple days
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
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, approved, rejected, completed

  // Load submitted day plans from backend
  useEffect(() => {
    const fetchSubmittedDayPlans = async () => {
      setIsLoadingDayPlans(true);
      try {
        const response = await axiosInstance.get(API_PATHS.TRAINEE_DAY_PLANS.GET_ALL);
        if (response.data.dayPlans) {
          const formattedPlans = response.data.dayPlans.map(plan => ({
            id: plan._id,
            title: plan.title || '', // Include title
            date: plan.date,
            tasks: plan.tasks,
            topics: plan.topics || [], // Include topics for hour calculation
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
        // Support both old format (tasks) and new format (topics)
        if (draftData.topics) {
          // New format with topics - preserve nested structure
          setDayPlan({
            title: draftData.title || '',
            date: draftData.date || moment().format('YYYY-MM-DD'),
            topics: draftData.topics || [],
            status: 'draft'
          });
        } else if (draftData.tasks) {
          // Old format - convert to new format
          const convertedTopics = draftData.tasks.map((task, index) => {
            let timeRange = '';
            let estimatedHours = '';
            if (task.timeAllocation) {
              if (task.timeAllocation.includes('-') || task.timeAllocation.includes('–')) {
                timeRange = task.timeAllocation;
              } else {
                const hoursMatch = task.timeAllocation.match(/(\d+(?:\.\d+)?)\s*hours?/i);
                if (hoursMatch) {
                  estimatedHours = hoursMatch[1];
                } else {
                  timeRange = task.timeAllocation;
                }
              }
            }
            return {
              id: task.id || Date.now() + index,
              name: task.title || '',
              timeRange: timeRange,
              estimatedHours: estimatedHours,
              assignedDay: draftData.date || moment().format('YYYY-MM-DD'),
              description: task.description || '',
              subtopics: []
            };
          });
          setDayPlan({
            title: draftData.title || '',
            date: draftData.date || moment().format('YYYY-MM-DD'),
            topics: convertedTopics,
            status: 'draft'
          });
        }
        setDynamicCheckboxes(draftData.checkboxes || {});
        toast.success('Draft loaded from previous session');
      } catch (error) {
        console.error('Error loading draft:', error);
        localStorage.removeItem('traineeDayPlanDraft');
      }
    }
  }, []);

  // Add a new topic/item
  const handleAddTopic = (targetDate = null, parentTopicId = null) => {
    const dateToUse = targetDate || dayPlan.date;
    const newTopic = { 
      id: Date.now(), 
      name: '', // Topic name (MCQs, coding practices, cheat sheets, learning sets, etc.)
      timeRange: '', // Time range (e.g., 9:00-10:00)
      estimatedHours: '', // Estimated hours (can't complete in one day - around 8 hours)
      assignedDay: dateToUse, // Which day this topic is assigned to
      description: '',
      subtopics: [] // Nested topics
    };

    if (parentTopicId) {
      // Add as nested topic
      setDayPlan(prev => ({
        ...prev,
        topics: prev.topics.map(topic => {
          if (topic.id === parentTopicId) {
            return {
              ...topic,
              subtopics: [...(topic.subtopics || []), newTopic]
            };
          }
          // Recursively search in subtopics
          return updateTopicRecursively(topic, parentTopicId, (t) => ({
            ...t,
            subtopics: [...(t.subtopics || []), newTopic]
          }));
        })
      }));
    } else {
      // Add as top-level topic
      setDayPlan(prev => ({
        ...prev,
        topics: [...prev.topics, newTopic]
      }));
    }
  };

  // Helper function to recursively update topics
  const updateTopicRecursively = (topic, targetId, updateFn) => {
    if (topic.id === targetId) {
      return updateFn(topic);
    }
    if (topic.subtopics && topic.subtopics.length > 0) {
      return {
        ...topic,
        subtopics: topic.subtopics.map(subtopic => 
          updateTopicRecursively(subtopic, targetId, updateFn)
        )
      };
    }
    return topic;
  };

  // Helper function to recursively find and remove topic
  const removeTopicRecursively = (topics, targetId) => {
    return topics
      .filter(topic => topic.id !== targetId)
      .map(topic => ({
        ...topic,
        subtopics: topic.subtopics ? removeTopicRecursively(topic.subtopics, targetId) : []
      }));
  };

  // Helper function to recursively update a topic by ID
  const updateTopicById = (topic, targetId, field, value) => {
    if (topic.id === targetId) {
      return { ...topic, [field]: value };
    }
    if (topic.subtopics && topic.subtopics.length > 0) {
      return {
        ...topic,
        subtopics: topic.subtopics.map(subtopic =>
          updateTopicById(subtopic, targetId, field, value)
        )
      };
    }
    return topic;
  };

  // Update topic field
  const handleTopicChange = (topicId, field, value, parentTopicId = null) => {
    setDayPlan(prev => ({
      ...prev,
      topics: prev.topics.map(topic => {
        if (parentTopicId) {
          // Update nested topic - recursively search for parent and update child
          return updateTopicRecursively(topic, parentTopicId, (t) => {
            if (t.subtopics) {
              return {
                ...t,
                subtopics: t.subtopics.map(subtopic =>
                  subtopic.id === topicId ? { ...subtopic, [field]: value } : subtopic
                )
              };
            }
            return t;
          });
        } else {
          // Update topic recursively (works for both top-level and nested)
          return updateTopicById(topic, topicId, field, value);
        }
      })
    }));
  };

  // Remove topic
  const handleRemoveTopic = (topicId, parentTopicId = null) => {
    setDayPlan(prev => {
      if (parentTopicId) {
        // Remove nested topic
        return {
          ...prev,
          topics: prev.topics.map(topic => 
            updateTopicRecursively(topic, parentTopicId, (t) => ({
              ...t,
              subtopics: (t.subtopics || []).filter(subtopic => subtopic.id !== topicId)
            }))
          )
        };
      } else {
        // Remove top-level topic
        return {
          ...prev,
          topics: removeTopicRecursively(prev.topics, topicId)
        };
      }
    });
  };

  // Get topics grouped by day
  const getTopicsByDay = () => {
    const grouped = {};
    dayPlan.topics.forEach(topic => {
      const day = topic.assignedDay || dayPlan.date;
      if (!grouped[day]) {
        grouped[day] = [];
      }
      grouped[day].push(topic);
    });
    return grouped;
  };

  // Get available days (today and future days up to 7 days ahead)
  const getAvailableDays = () => {
    const days = [];
    const today = moment(dayPlan.date);
    for (let i = 0; i < 7; i++) {
      days.push(today.clone().add(i, 'days').format('YYYY-MM-DD'));
    }
    return days;
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
      title: '',
      date: moment().format('YYYY-MM-DD'),
      topics: [],
      status: 'draft'
    });
    setDynamicCheckboxes({});
    setIsEditing(false);
  };

  // Helper function to get display status based on workflow
  const getDisplayStatus = (plan) => {
    // If EOD is submitted and pending approval
    if (plan.status === 'pending' && plan.eodUpdate?.status === 'submitted') {
      return { status: 'pending', label: 'Pending Approval', color: 'bg-orange-100 text-orange-800' };
    }
    // If status is completed (EOD approved or any completed status)
    if (plan.status === 'completed') {
      // Check if EOD was approved (final completion)
      if (plan.eodUpdate?.status === 'approved') {
        return { status: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' };
      }
      // If completed but no eodUpdate, still show as completed (green)
      return { status: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' };
    }
    // If trainer approved the day plan (status is approved)
    if (plan.status === 'approved') {
      return { status: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' };
    }
    // If status is in_progress (trainee submitted, waiting for trainer approval)
    if (plan.status === 'in_progress') {
      return { status: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' };
    }
    // If rejected
    if (plan.status === 'rejected') {
      return { status: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' };
    }
    // Default
    return { status: plan.status, label: plan.status || 'Draft', color: 'bg-gray-100 text-gray-800' };
  };

  // Filter plans based on selected status
  const getFilteredPlans = () => {
    if (statusFilter === 'all') {
      return submittedDayPlans;
    }
    return submittedDayPlans.filter(plan => {
      const displayStatus = getDisplayStatus(plan);
      // Map filter values to actual statuses
      if (statusFilter === 'pending') {
        // "Pending" filter shows plans waiting for approval:
        // - "In Progress" (waiting for trainer to approve day plan)
        // - "Pending Approval" (EOD submitted, waiting for trainer to approve EOD)
        return displayStatus.status === 'pending' || displayStatus.status === 'in_progress';
      }
      if (statusFilter === 'approved') {
        // "Approved" filter shows plans approved by trainer (status='approved')
        return displayStatus.status === 'approved';
      }
      if (statusFilter === 'rejected') {
        return displayStatus.status === 'rejected';
      }
      if (statusFilter === 'completed') {
        // "Completed" filter shows plans with EOD approved
        return displayStatus.status === 'completed';
      }
      return false;
    });
  };

  const handleViewDayPlan = (plan) => {
    setSelectedDayPlan(plan);
    setShowViewPopup(true);
  };

  const handleEditDayPlan = (plan) => {
    // Close the view popup if it's open
    setShowViewPopup(false);

    // Support both old format (tasks) and new format (topics)
    let topics = [];
    let title = plan.title || '';

    if (plan.topics && plan.topics.length > 0) {
      // New format with topics - preserve nested structure
      const mapTopic = (topic, index) => ({
        id: topic.id || Date.now() + index,
        name: topic.name || '',
        timeRange: topic.timeRange || '',
        estimatedHours: topic.estimatedHours || '',
        assignedDay: topic.assignedDay || plan.date,
        description: topic.description || '',
        subtopics: topic.subtopics ? topic.subtopics.map((subtopic, subIndex) => 
          mapTopic(subtopic, subIndex)
        ) : []
      });
      topics = plan.topics.map((topic, index) => mapTopic(topic, index));
    } else if (plan.tasks && plan.tasks.length > 0) {
      // Old format - convert tasks to topics
      // Try to extract title from task titles if they follow the pattern "Title - Topic"
      const firstTaskTitle = plan.tasks[0]?.title || '';
      if (firstTaskTitle.includes(' - ')) {
        const parts = firstTaskTitle.split(' - ');
        title = parts[0];
      }
      
      topics = plan.tasks.map((task, index) => {
        let topicName = task.title || '';
        // Remove title prefix if present
        if (topicName.includes(' - ')) {
          topicName = topicName.split(' - ').slice(1).join(' - ');
        }
        
        // Extract time range or hours from timeAllocation
        let timeRange = '';
        let estimatedHours = '';
        if (task.timeAllocation) {
          // Check if it's a time range format (e.g., 9:00-10:00)
          if (task.timeAllocation.includes('-') || task.timeAllocation.includes('–')) {
            timeRange = task.timeAllocation;
          } else {
            // Try to extract hours if it's in "X hours" format
            const hoursMatch = task.timeAllocation.match(/(\d+(?:\.\d+)?)\s*hours?/i);
            if (hoursMatch) {
              estimatedHours = hoursMatch[1];
            } else {
              timeRange = task.timeAllocation;
            }
          }
        }
        
        return {
          id: task.id || Date.now() + index,
          name: topicName,
          timeRange: timeRange,
          estimatedHours: estimatedHours,
          assignedDay: plan.date, // Default to plan date
          description: task.description || '',
          subtopics: [] // Old format doesn't have nested topics
        };
      });
    }

    // Load the plan data into the form for editing
    setDayPlan({
      title: title,
      date: plan.date,
      topics: topics,
      status: 'draft'
    });
    
    setDynamicCheckboxes(plan.checkboxes || {});
    
    // Set editing state
    setIsEditing(true);
    
    // Remove the plan from submitted plans since we're editing it
    setSubmittedDayPlans(prev => prev.filter(p => p.id !== plan.id));
    
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
            title: plan.title || '', // Include title
            date: plan.date,
            tasks: plan.tasks,
            topics: plan.topics || [], // Include topics for hour calculation
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

  // Helper function to recursively validate topics
  const validateTopicsRecursively = (topics) => {
    for (const topic of topics) {
      if (!topic.name || !topic.name.trim()) {
        return { valid: false, message: 'Please fill in all topic names' };
      }
      if (!topic.timeRange || !topic.timeRange.trim()) {
        return { valid: false, message: 'Please fill in time range for all topics (e.g., 9:00-10:00)' };
      }
      // Validate nested topics if they exist
      if (topic.subtopics && topic.subtopics.length > 0) {
        const nestedValidation = validateTopicsRecursively(topic.subtopics);
        if (!nestedValidation.valid) {
          return nestedValidation;
        }
      }
    }
    return { valid: true };
  };

  // Helper function to recursively flatten topics for submission
  // Each topic/subtopic shows only as "Plan Title - Topic Name" (no nested paths)
  const flattenTopicsRecursively = (topics, planTitle = '') => {
    const flattened = [];
    
    const processTopic = (topic) => {
      // Only use the current topic name, not the full nested path
      // Format: "Plan Title - Topic Name"
      const taskTitle = planTitle ? `${planTitle} - ${topic.name}` : topic.name;
      flattened.push({
        title: taskTitle,
        timeAllocation: topic.timeRange || topic.estimatedHours || '',
        description: topic.description || `Time: ${topic.timeRange || ''}`
      });
      
      // Recursively process subtopics - each subtopic gets only "Plan Title - Subtopic Name"
      if (topic.subtopics && topic.subtopics.length > 0) {
        topic.subtopics.forEach(subtopic => {
          processTopic(subtopic); // Recursive call - each level only uses planTitle, not parent names
        });
      }
    };
    
    topics.forEach(topic => {
      processTopic(topic);
    });
    
    return flattened;
  };

  const handleSaveDayPlan = () => {
    // Validate title
    if (!dayPlan.title.trim()) {
      toast.error('Please enter a plan title (e.g., Static, Responsive, Modern Responsive)');
      return;
    }

    // Validate topics
    if (dayPlan.topics.length === 0) {
      toast.error('Please add at least one topic/item');
      return;
    }

    const validation = validateTopicsRecursively(dayPlan.topics);
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    // Save to localStorage only
    const draftData = {
      title: dayPlan.title,
      date: dayPlan.date,
      topics: dayPlan.topics,
      savedAt: new Date().toISOString()
    };

    localStorage.setItem('traineeDayPlanDraft', JSON.stringify(draftData));
    
    toast.success('Day plan saved as draft');
  };

  const handleSubmitDayPlan = async () => {
    // Validate title
    if (!dayPlan.title.trim()) {
      toast.error('Please enter a plan title (e.g., Static, Responsive, Modern Responsive)');
      return;
    }

    // Validate topics
    if (dayPlan.topics.length === 0) {
      toast.error('Please add at least one topic/item');
      return;
    }

    const validation = validateTopicsRecursively(dayPlan.topics);
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    setIsSubmittingDayPlan(true);

    try {
      // Convert topics to tasks format for backend compatibility
      // Group topics by assigned day and create tasks for each day
      const topicsByDay = getTopicsByDay();
      const allTasks = [];
      
      // Create tasks for each day, handling nested topics
      Object.keys(topicsByDay).forEach(day => {
        topicsByDay[day].forEach(topic => {
          // Flatten nested topics recursively - pass plan title so each topic shows as "Plan Title - Topic Name"
          const flattenedTopics = flattenTopicsRecursively([topic], dayPlan.title);
          flattenedTopics.forEach(flattenedTopic => {
            allTasks.push({
              title: flattenedTopic.title, // Already includes plan title in format: "Plan Title - Topic Name"
              timeAllocation: flattenedTopic.timeAllocation, // Use time range
              description: flattenedTopic.description || `Time: ${flattenedTopic.timeAllocation}. Assigned to ${moment(day).format('MMM DD, YYYY')}`
            });
          });
        });
      });

      // Submit to backend - use the first day as the main date, but include all topics
      const response = await axiosInstance.post(API_PATHS.TRAINEE_DAY_PLANS.CREATE, {
        title: dayPlan.title, // Include title in submission
        date: dayPlan.date,
        tasks: allTasks,
        topics: dayPlan.topics, // Also send topics for future use (with nested structure)
        checkboxes: {},
        status: 'in_progress' // Set status to 'in_progress' when trainee submits day plan
      });

      if (response.data.success !== false) {
        // Add to submitted day plans for immediate UI update
        const submittedPlan = {
          id: response.data.dayPlan._id,
          title: dayPlan.title,
          date: dayPlan.date,
          tasks: allTasks,
          topics: dayPlan.topics,
          checkboxes: {},
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
        
        // Refresh day plans list to update status
        try {
          const refreshResponse = await axiosInstance.get(API_PATHS.TRAINEE_DAY_PLANS.GET_ALL);
          if (refreshResponse.data.dayPlans) {
            const formattedPlans = refreshResponse.data.dayPlans.map(plan => ({
              id: plan._id,
              title: plan.title || '',
              date: plan.date,
              tasks: plan.tasks,
              topics: plan.topics || [],
              checkboxes: plan.checkboxes || {},
              submittedAt: plan.submittedAt,
              status: plan.status,
              eodUpdate: plan.eodUpdate,
              createdBy: plan.createdBy || 'trainee'
            }));
            setSubmittedDayPlans(formattedPlans);
          }
        } catch (refreshError) {
          console.error('Error refreshing day plans:', refreshError);
        }
        
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
            id: p._id, title: p.title || '', date: p.date, tasks: p.tasks, topics: p.topics || [], checkboxes: p.checkboxes || {}, submittedAt: p.submittedAt, status: p.status, eodUpdate: p.eodUpdate, createdBy: p.createdBy || 'trainee'
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

  // Recursive component to render topics with nesting support
  const renderTopic = (topic, topicIndex, level = 0, parentTopicId = null) => {
    const availableDays = getAvailableDays();
    const indentStyle = level > 0 ? { marginLeft: `${level * 1}rem` } : {};
    const bgColorClass = level % 2 === 0 ? 'bg-white' : 'bg-gray-50';
    
    return (
      <div key={topic.id} className={`${bgColorClass} border border-gray-200 rounded-lg p-4`} style={indentStyle}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                {level === 0 ? `Topic ${topicIndex + 1}` : `Sub-topic ${topicIndex + 1}`}
              </span>
            </div>
            <input
              type="text"
              value={topic.name || ''}
              onChange={(e) => handleTopicChange(topic.id, 'name', e.target.value, parentTopicId)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
              placeholder="e.g., MCQs, Coding Practices, Cheat Sheets, Learning Sets, etc."
            />
          </div>
          <button
            onClick={() => handleRemoveTopic(topic.id, parentTopicId)}
            className="ml-3 text-red-500 hover:text-red-700 cursor-pointer"
          >
            <LuX className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Range <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={topic.timeRange || ''}
              onChange={(e) => handleTopicChange(topic.id, 'timeRange', e.target.value, parentTopicId)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 9:00-10:00"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the time range for completing this topic
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Day</label>
            <select
              value={topic.assignedDay || dayPlan.date}
              onChange={(e) => handleTopicChange(topic.id, 'assignedDay', e.target.value, parentTopicId)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {availableDays.map(availableDay => (
                <option key={availableDay} value={availableDay}>
                  {moment(availableDay).isSame(moment(), 'day') 
                    ? `Today (${moment(availableDay).format('MMM DD, YYYY')})`
                    : moment(availableDay).format('MMM DD, YYYY')
                  }
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
          <textarea
            value={topic.description || ''}
            onChange={(e) => handleTopicChange(topic.id, 'description', e.target.value, parentTopicId)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="2"
            placeholder="Add any additional notes or details about this topic..."
          />
        </div>

        {/* Add Topic button inside this topic section for nested topics */}
        <div className="mb-3 pt-3 border-t border-gray-200">
          <button
            onClick={() => handleAddTopic(topic.assignedDay || dayPlan.date, topic.id)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 cursor-pointer text-sm"
          >
            <LuPlus className="w-4 h-4" />
            <span>Add Topic</span>
          </button>
        </div>

        {/* Render nested topics */}
        {topic.subtopics && topic.subtopics.length > 0 && (
          <div className="mt-3 space-y-3 pl-4 border-l-2 border-blue-200">
            {topic.subtopics.map((subtopic, subtopicIndex) => 
              renderTopic(subtopic, subtopicIndex, level + 1, topic.id)
            )}
          </div>
        )}
      </div>
    );
  };

  // Helper function to parse time range and calculate hours
  const parseTimeRangeToHours = (timeRange) => {
    if (!timeRange || !timeRange.trim()) return 0;
    
    // Handle time range format like "9:00-10:00" or "9:00am-10:00am"
    const timeRangePattern = /(\d{1,2}):(\d{2})\s*(am|pm)?[–-](\d{1,2}):(\d{2})\s*(am|pm)?/i;
    const match = timeRange.match(timeRangePattern);
    
    if (match) {
      let startHour = parseInt(match[1]);
      const startMin = parseInt(match[2]);
      const startPeriod = match[3]?.toLowerCase();
      let endHour = parseInt(match[4]);
      const endMin = parseInt(match[5]);
      const endPeriod = match[6]?.toLowerCase();
      
      // Convert to 24-hour format
      if (startPeriod === 'pm' && startHour !== 12) startHour += 12;
      if (startPeriod === 'am' && startHour === 12) startHour = 0;
      if (endPeriod === 'pm' && endHour !== 12) endHour += 12;
      if (endPeriod === 'am' && endHour === 12) endHour = 0;
      
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      const diffMinutes = endMinutes - startMinutes;
      
      // Handle case where end time is next day
      const totalMinutes = diffMinutes < 0 ? diffMinutes + 24 * 60 : diffMinutes;
      return totalMinutes / 60; // Convert to hours
    }
    
    // Try to parse as hours (e.g., "8 hours", "8.5 hours")
    const hoursMatch = timeRange.match(/(\d+(?:\.\d+)?)\s*hours?/i);
    if (hoursMatch) {
      return parseFloat(hoursMatch[1]);
    }
    
    return 0;
  };

  // Calculate total hours from a plan
  const calculateTotalHours = (plan) => {
    let totalHours = 0;
    
    // Priority 1: Calculate from tasks if they exist (tasks are the actual submitted items)
    // This is the most reliable source since tasks are what's displayed and stored
    if (plan.tasks && plan.tasks.length > 0) {
      plan.tasks.forEach((task, index) => {
        if (task.timeAllocation && task.timeAllocation.trim()) {
          const hours = parseTimeRangeToHours(task.timeAllocation);
          totalHours += hours;
        }
      });
    }
    // Priority 2: If no tasks, calculate from topics (for draft plans or new format)
    else if (plan.topics && plan.topics.length > 0) {
      const calculateFromTopics = (topics) => {
        topics.forEach(topic => {
          const hasSubtopics = topic.subtopics && topic.subtopics.length > 0;
          
          if (hasSubtopics) {
            // If topic has subtopics, only count the subtopics (recursively)
            calculateFromTopics(topic.subtopics);
          } else {
            // This is a leaf node - count its timeRange
            if (topic.timeRange && topic.timeRange.trim()) {
              totalHours += parseTimeRangeToHours(topic.timeRange);
            }
          }
        });
      };
      calculateFromTopics(plan.topics);
    }
    
    return totalHours;
  };

  const renderDayPlan = () => {
    const topicsByDay = getTopicsByDay();
    const availableDays = getAvailableDays();

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Create Day Plan</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Base Date: {moment(dayPlan.date).format('MMM DD, YYYY')}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                dayPlan.status === 'submitted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {dayPlan.status === 'submitted' ? 'Submitted' : 'Draft'}
              </span>
            </div>
          </div>

          {/* Plan Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plan Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={dayPlan.title}
              onChange={(e) => setDayPlan(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              placeholder="e.g., Static, Responsive, Modern Responsive, etc."
            />
            <p className="text-xs text-gray-500 mt-1">Enter a title for your learning plan</p>
          </div>

          {/* Date Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Base Date</label>
            <input
              type="date"
              value={dayPlan.date}
              onChange={(e) => setDayPlan(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Add Topic Button */}
          <div className="mb-6">
            <button
              onClick={() => handleAddTopic(dayPlan.date)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 cursor-pointer"
            >
              <LuPlus className="w-4 h-4" />
              <span>Add Topic</span>
            </button>
          </div>

          {/* Topics by Day */}
          <div className="space-y-6">
            {dayPlan.topics.length !== 0 && (
              Object.keys(topicsByDay)
                .filter(day => (topicsByDay[day] || []).length > 0)
                .map((day) => {
                  const dayTopics = topicsByDay[day] || [];
                  const isToday = moment(day).isSame(moment(), 'day');
                  const isPast = moment(day).isBefore(moment(), 'day');

                  return (
                    <div key={day} className="border border-gray-200 rounded-lg p-5 bg-gray-50">
                      <div className="flex items-center mb-4">
                        <div className="flex items-center space-x-3">
                          <LuCalendar className="w-5 h-5 text-blue-600" />
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {isToday ? 'Today' : moment(day).format('MMM DD, YYYY')}
                              {isPast && <span className="ml-2 text-xs text-gray-500">(Past)</span>}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {dayTopics.length} {dayTopics.length === 1 ? 'topic' : 'topics'} assigned
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Topics for this day */}
                      <div className="space-y-3">
                        {dayTopics.map((topic, topicIndex) => renderTopic(topic, topicIndex, 0, null))}
                      </div>
                    </div>
                  );
                })
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            {isEditing && (
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 cursor-pointer"
              >
                <LuX className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            )}
            
            <div className="flex items-center space-x-3 ml-auto">
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
        </div>

      {/* Previous Day Plans */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Previous Day Plans</h3>
        
        {/* Filter Bar */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-4">
            <LuFilter className="w-5 h-5 text-gray-600" />
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-gray-200 text-gray-900 border border-gray-300'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-gray-200 text-gray-900 border border-gray-300'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                statusFilter === 'approved'
                  ? 'bg-gray-200 text-gray-900 border border-gray-300'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                statusFilter === 'rejected'
                  ? 'bg-gray-200 text-gray-900 border border-gray-300'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Rejected
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-gray-200 text-gray-900 border border-gray-300'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {isLoadingDayPlans ? (
          <div className="text-center py-12">
            <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <LuLoader className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Day Plans...</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">Please wait while we fetch your submitted day plans.</p>
          </div>
        ) : getFilteredPlans().length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getFilteredPlans().map((plan) => {
              const displayStatus = getDisplayStatus(plan);
              const totalHours = calculateTotalHours(plan);
              const hours = Math.floor(totalHours);
              const minutes = Math.round((totalHours - hours) * 60);
              const hoursDisplay = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
              
              return (
                <div key={plan.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewDayPlan(plan)}>
                  <h4 className="font-semibold text-gray-900 mb-3 text-lg">
                    {plan.title && plan.title.trim() ? plan.title : moment(plan.date).format('MMM DD, YYYY')}
                  </h4>
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <LuUser className="w-4 h-4 mr-2" />
                      <span className="font-medium">{user?.name || 'Trainee'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <LuClock className="w-4 h-4 mr-2" />
                      <span className="font-medium">{hoursDisplay}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-md text-sm font-medium ${displayStatus.color}`}>
                      {displayStatus.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <LuFileText className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Day Plans Found</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              {statusFilter !== 'all' 
                ? `No day plans found with status "${statusFilter}".` 
                : "You haven't submitted any day plans yet. Create and submit your first day plan above!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
  };

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
            (plan.status === 'approved' || (plan.status === 'pending' && plan.eodUpdate?.status === 'submitted')) && 
            plan.eodUpdate?.status !== 'approved' // Only show approved day plans that haven't been fully approved yet
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
              
                  {/* Tasks from Day Plan - show when status is approved, otherwise hidden */}
                  <div className={plan.status === 'approved' ? 'mt-4 space-y-4' : 'hidden'}>
                    {plan.tasks.map((task, index) => {
                      const taskKey = `${plan.id}-${index}`;
                      const isExpanded = expandedTasks[taskKey];
                      const currentStatus = taskStatuses[taskKey];
                      const currentRemarks = taskRemarks[taskKey] || '';
                      const isEodApproved = plan.eodUpdate?.status === 'approved' && plan.status === 'completed';
                      // Tasks are editable when status is "approved" and EOD hasn't been approved yet
                      const isEditable = plan.status === 'approved' && !isEodApproved;
                      
                      return (
                        <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-all duration-200">
                          <div 
                            className={`flex items-center justify-between mb-3 p-3 rounded-lg transition-all duration-200 ${
                              isEditable ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-200' : 'cursor-default bg-gray-50'
                            }`}
                            onClick={() => isEditable && toggleTaskExpansion(plan.id, index)}
                          >
                            <div className="flex items-center space-x-3">
                              <LuCheck className="w-4 h-4 text-gray-600" />
                              <div>
                                {(() => {
                                  // Clean up nested titles for display
                                  let displayTitle = task.title;
                                  if (plan.title && task.title.includes(' - ')) {
                                    const parts = task.title.split(' - ');
                                    if (parts[0] === plan.title && parts.length > 2) {
                                      displayTitle = `${plan.title} - ${parts[parts.length - 1]}`;
                                    } else if (parts.length > 2 && !task.title.startsWith(plan.title)) {
                                      displayTitle = parts[parts.length - 1];
                                    }
                                  }
                                  return (
                                    <h4 className="font-semibold text-gray-900">Task {index + 1}: {displayTitle}</h4>
                                  );
                                })()}
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
                              {isEditable && (
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
                                {/* Editable radio buttons - show when editable (approved status and EOD not approved) */}
                                {isEditable ? (
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
                                    {isEditable && <span className="text-red-500 ml-1">*</span>}
                                  </label>
                                  {isEditable ? (
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
                                        <input type="checkbox" className="w-4 h-4" disabled={!isEditable}
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
          (plan.status === 'approved' || plan.status === 'pending' || plan.status === 'completed') // Show EOD section for approved, pending, or completed plans
        );
        return todayPlans.length > 0;
      })() && (() => {
        const todayPlan = submittedDayPlans.find(plan => 
          moment(plan.date).isSame(moment(), 'day') &&
          (plan.status === 'approved' || plan.status === 'pending' || plan.status === 'completed') // Look for approved, pending, or completed plans
        );
        const isApproved = todayPlan?.status === 'approved'; // Day plan is approved by trainer, waiting for EOD submission
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
                {isApproved && !isEodPending && !isEodApproved && !isEodRejected && (
                  <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-800">
                    Day Plan Approved
                  </span>
                )}
                {isCompleted && !isEodApproved && !isEodRejected && (
                  <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-800">
                    Approved
                  </span>
                )}
                {!isPending && !isCompleted && !isApproved && !isEodPending && !isEodApproved && !isEodRejected && (
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
            
            {/* Show input form when approved (ready for EOD submission), not pending/completed/EOD pending/approved/rejected, or when editing */}
            {(isApproved || ((!isPending && !isCompleted && !isEodPending && !isEodApproved && !isEodRejected && !isPendingInReview) || isEditingEod)) ? (
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
                {isApproved && (
                  <button
                    onClick={handleEodUpdate}
                    disabled={isUpdatingEod}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isUpdatingEod ? (
                      <>
                        <LuLoader className="w-4 h-4 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <LuCheck className="w-4 h-4" />
                        <span>Submit EOD Update</span>
                      </>
                    )}
                  </button>
                )}
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


        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8 h-12">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`cursor-pointer py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
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
                // Clean up nested titles: Extract only "Plan Title - Topic Name" format
                let displayTitle = task.title;
                if (previewTaskPlan.title && task.title.includes(' - ')) {
                  const parts = task.title.split(' - ');
                  if (parts[0] === previewTaskPlan.title && parts.length > 2) {
                    displayTitle = `${previewTaskPlan.title} - ${parts[parts.length - 1]}`;
                  } else if (parts.length > 2 && !task.title.startsWith(previewTaskPlan.title)) {
                    displayTitle = parts[parts.length - 1];
                  }
                }
                return (
                <div key={idx} className="border rounded-lg p-3">
                  <div className="font-medium text-sm">{displayTitle}</div>
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

            {/* Status Badge and Total Hours */}
            <div className="mb-6 flex items-center justify-between">
              {(() => {
                const displayStatus = getDisplayStatus(selectedDayPlan);
                return (
                  <span className={`px-3 py-1 text-sm rounded-full ${displayStatus.color}`}>
                    {displayStatus.label}
                  </span>
                );
              })()}
              <div className="flex items-center space-x-2">
                <LuClock className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  Total Hours: <span className="text-blue-600">{calculateTotalHours(selectedDayPlan).toFixed(1)}</span>
                </span>
              </div>
            </div>

            {/* Tasks Section */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Tasks</h4>
              <div className="space-y-3">
                {selectedDayPlan.tasks.map((task, index) => {
                  // Clean up nested titles: Extract only "Plan Title - Topic Name" format
                  let displayTitle = task.title;
                  if (selectedDayPlan.title && task.title.includes(' - ')) {
                    const parts = task.title.split(' - ');
                    // If we have the plan title and the title starts with it, extract just plan title + last topic
                    if (parts[0] === selectedDayPlan.title && parts.length > 2) {
                      // It's a nested path: "Plan Title - Parent - Child - Grandchild"
                      // Show only: "Plan Title - Grandchild" (last part)
                      displayTitle = `${selectedDayPlan.title} - ${parts[parts.length - 1]}`;
                    } else if (parts.length > 2 && !task.title.startsWith(selectedDayPlan.title)) {
                      // Old format without plan title prefix, but still nested
                      // Show only the last part
                      displayTitle = parts[parts.length - 1];
                    }
                  }
                  
                  const taskKey = `${selectedDayPlan.id}-${index}`;
                  const currentStatus = taskStatuses[taskKey] || task.status || '';
                  const currentRemarks = taskRemarks[taskKey] || task.remarks || '';
                  const isEodApproved = selectedDayPlan.eodUpdate?.status === 'approved' && selectedDayPlan.status === 'completed';
                  const isEditable = selectedDayPlan.status === 'approved' && !isEodApproved;
                  
                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-gray-900">{displayTitle}</h5>
                        <span className="text-sm text-blue-600 font-medium">{task.timeAllocation}</span>
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                      )}
                      
                      {/* EOD Status Selection - Only show when status is approved */}
                      {isEditable && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Task Status <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center space-x-4">
                              <label className="flex items-center space-x-2">
                                <input 
                                  type="radio" 
                                  name={`view-status-${selectedDayPlan.id}-${index}`} 
                                  value="completed" 
                                  className="text-green-500"
                                  checked={currentStatus === 'completed'}
                                  onChange={() => handleTaskStatusChange(selectedDayPlan.id, index, 'completed', '')}
                                />
                                <span className="text-sm text-gray-700">Completed</span>
                              </label>
                              <label className="flex items-center space-x-2">
                                <input 
                                  type="radio" 
                                  name={`view-status-${selectedDayPlan.id}-${index}`} 
                                  value="in_progress" 
                                  className="text-yellow-500"
                                  checked={currentStatus === 'in_progress'}
                                  onChange={() => handleTaskStatusChange(selectedDayPlan.id, index, 'in_progress', '')}
                                />
                                <span className="text-sm text-gray-700">In Progress</span>
                              </label>
                              <label className="flex items-center space-x-2">
                                <input 
                                  type="radio" 
                                  name={`view-status-${selectedDayPlan.id}-${index}`} 
                                  value="pending" 
                                  className="text-red-500"
                                  checked={currentStatus === 'pending'}
                                  onChange={() => handleTaskStatusChange(selectedDayPlan.id, index, 'pending', '')}
                                />
                                <span className="text-sm text-gray-700">Pending</span>
                              </label>
                            </div>
                          </div>
                          
                          {/* Remarks Field - Required for In Progress and Pending */}
                          {(currentStatus === 'in_progress' || currentStatus === 'pending') && (
                            <div className="mb-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Remarks/Blockers <span className="text-red-500">*</span>
                              </label>
                              <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows="2"
                                placeholder="Add any remarks or blockers for this task"
                                value={currentRemarks}
                                onChange={(e) => handleTaskRemarksChange(selectedDayPlan.id, index, e.target.value)}
                              />
                            </div>
                          )}
                          
                          {/* Show current status if already set */}
                          {currentStatus && currentStatus !== 'completed' && (
                            <div className="mt-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                currentStatus === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {currentStatus === 'in_progress' ? '⏳ In Progress' : '⏸ Pending'}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Show read-only status if EOD is approved */}
                      {isEodApproved && currentStatus && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                              currentStatus === 'completed' ? 'bg-green-100 text-green-700' :
                              currentStatus === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {currentStatus === 'completed' ? '✓ Completed' :
                               currentStatus === 'in_progress' ? '⏳ In Progress' :
                               '⏸ Pending'}
                            </span>
                          </div>
                          {currentRemarks && (
                            <p className="text-sm text-gray-600 mt-2">{currentRemarks}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
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

            {/* EOD Update Section - Show when status is approved */}
            {selectedDayPlan.status === 'approved' && selectedDayPlan.eodUpdate?.status !== 'approved' && (
              <div className="mb-6 border-t pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">End of Day Update</h4>
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
              </div>
            )}
            
            {/* Show submitted EOD update if exists */}
            {selectedDayPlan.eodUpdate && selectedDayPlan.eodUpdate.status && (
              <div className="mb-6 border-t pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">EOD Update</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      selectedDayPlan.eodUpdate.status === 'approved' ? 'bg-green-100 text-green-800' :
                      selectedDayPlan.eodUpdate.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {selectedDayPlan.eodUpdate.status === 'approved' ? 'Approved' :
                       selectedDayPlan.eodUpdate.status === 'rejected' ? 'Rejected' :
                       'Pending Review'}
                    </span>
                  </div>
                  {selectedDayPlan.eodUpdate.overallRemarks && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Overall Remarks:</span>
                      <p className="text-sm text-gray-600 mt-1">{selectedDayPlan.eodUpdate.overallRemarks}</p>
                    </div>
                  )}
                  {selectedDayPlan.eodUpdate.submittedAt && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Submitted:</span>
                      <p className="text-sm text-gray-600 mt-1">
                        {moment(selectedDayPlan.eodUpdate.submittedAt).format('MMM DD, YYYY h:mm A')}
                      </p>
                    </div>
                  )}
                  {selectedDayPlan.eodUpdate.reviewComments && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Review Comments:</span>
                      <p className="text-sm text-gray-600 mt-1">{selectedDayPlan.eodUpdate.reviewComments}</p>
                    </div>
                  )}
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
              {selectedDayPlan.status === 'approved' && selectedDayPlan.eodUpdate?.status !== 'approved' && (
                <button
                  onClick={async () => {
                    // Validate that all tasks have status selected
                    let hasValidationError = false;
                    const validationErrors = [];
                    
                    selectedDayPlan.tasks.forEach((task, index) => {
                      const key = `${selectedDayPlan.id}-${index}`;
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
                    
                    if (hasValidationError) {
                      validationErrors.forEach(error => toast.error(error));
                      return;
                    }
                    
                    // Prepare task updates
                    const taskUpdates = selectedDayPlan.tasks.map((task, index) => {
                      const key = `${selectedDayPlan.id}-${index}`;
                      return {
                        planId: selectedDayPlan.id,
                        taskIndex: index,
                        taskTitle: task.title,
                        status: taskStatuses[key],
                        remarks: taskRemarks[key] || '',
                        timeAllocation: task.timeAllocation
                      };
                    });
                    
                    // Prepare checkbox updates
                    const checkboxUpdates = [];
                    if (selectedDayPlan.checkboxes) {
                      selectedDayPlan.tasks.forEach((task, index) => {
                        const taskKeyForLookup = task.id ?? index;
                        const possibleKeys = [String(task.id), task.id, String(index), index];
                        let taskCheckboxes = null;
                        for (const key of possibleKeys) {
                          if (selectedDayPlan.checkboxes[key]) { 
                            taskCheckboxes = selectedDayPlan.checkboxes[key]; 
                            break; 
                          }
                        }
                        if (!taskCheckboxes) return;
                        const array = Array.isArray(taskCheckboxes) ? taskCheckboxes : Object.values(taskCheckboxes);
                        array.forEach(cb => {
                          const stateKey = `${selectedDayPlan.id}-${taskKeyForLookup}-${(cb.id ?? cb.checkboxId ?? cb.label)}`;
                          const checked = !!checkboxStatuses[stateKey];
                          checkboxUpdates.push({ 
                            taskId: taskKeyForLookup, 
                            checkboxId: (cb.id ?? cb.checkboxId ?? cb.label), 
                            checked 
                          });
                        });
                      });
                    }
                    
                    setIsUpdatingEod(true);
                    try {
                      const requestData = {
                        date: moment(selectedDayPlan.date).format('YYYY-MM-DD'),
                        tasks: taskUpdates,
                        checkboxes: checkboxUpdates,
                        overallRemarks: eodStatus.remarks
                      };
                      
                      const response = await axiosInstance.post('/api/trainee-dayplans/eod-update', requestData);
                      
                      if (response.data.success !== false) {
                        toast.success('EOD update submitted successfully');
                        setEodStatus(prev => ({ ...prev, submitted: true }));
                        
                        // Refresh day plans list
                        try {
                          const refreshResponse = await axiosInstance.get(API_PATHS.TRAINEE_DAY_PLANS.GET_ALL);
                          if (refreshResponse.data.dayPlans) {
                            const formattedPlans = refreshResponse.data.dayPlans.map(plan => ({
                              id: plan._id,
                              title: plan.title || '',
                              date: plan.date,
                              tasks: plan.tasks,
                              topics: plan.topics || [],
                              checkboxes: plan.checkboxes || {},
                              submittedAt: plan.submittedAt,
                              status: plan.status,
                              eodUpdate: plan.eodUpdate,
                              createdBy: plan.createdBy || 'trainee'
                            }));
                            setSubmittedDayPlans(formattedPlans);
                            
                            // Update selected day plan
                            const updatedPlan = formattedPlans.find(p => p.id === selectedDayPlan.id);
                            if (updatedPlan) {
                              setSelectedDayPlan(updatedPlan);
                            }
                          }
                        } catch (refreshError) {
                          console.error('Error refreshing day plans:', refreshError);
                        }
                      }
                    } catch (error) {
                      if (error.response?.data?.message) {
                        toast.error(error.response.data.message);
                      } else {
                        toast.error('Failed to submit EOD update. Please try again.');
                      }
                    } finally {
                      setIsUpdatingEod(false);
                    }
                  }}
                  disabled={isUpdatingEod}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isUpdatingEod ? (
                    <>
                      <LuLoader className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <LuCheck className="w-4 h-4" />
                      <span>Submit EOD Update</span>
                    </>
                  )}
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
