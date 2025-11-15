import React, { useState, useEffect, useContext } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { LuUsers, LuUserPlus, LuFileSpreadsheet, LuTrendingUp, LuSettings, LuSearch, LuBell, LuClock, LuCalendar, LuX, LuSave, LuUser, LuMail, LuPhone, LuBuilding, LuCalendar as LuCalendarIcon, LuUpload, LuInfo, LuGraduationCap, LuLoader } from 'react-icons/lu';
import { UserContext } from '../../context/userContext';
import moment from 'moment';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import UploadJoinersPopup from '../../components/UploadJoinersPopup';
import PendingAssignmentsPopup from '../../components/PendingAssignmentsPopup';

const BOADashboard = () => {
  const { user } = useContext(UserContext);
  const [stats, setStats] = useState({
    totalJoiners: 0,
    pendingActivations: 0,
    notJoiners: 0,
    activeTrainees: 0
  });
  const [recentJoiners, setRecentJoiners] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // New Joiner Form States
  const [showNewJoinerModal, setShowNewJoinerModal] = useState(false);
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(moment());
  const [joinerForm, setJoinerForm] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    joiningDate: moment().format('YYYY-MM-DD'),
    role: 'trainee',
    employeeId: '',
    genre: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Calendar data
  const [calendarData, setCalendarData] = useState({});
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [selectedDateJoiners, setSelectedDateJoiners] = useState([]);
  const [dateJoinersSearchTerm, setDateJoinersSearchTerm] = useState('');
  
  // Joiners popup states
  const [showJoinersPopup, setShowJoinersPopup] = useState(false);
  const [allJoiners, setAllJoiners] = useState([]);
  const [joinersSearchTerm, setJoinersSearchTerm] = useState('');
  const [showPendingAssignmentsPopup, setShowPendingAssignmentsPopup] = useState(false);
  const [popupType, setPopupType] = useState(''); // 'all', 'active', 'pending'
  
  // Activated users credentials management
  const [activatedUsers, setActivatedUsers] = useState([]);
  const [showCredentialsContainer, setShowCredentialsContainer] = useState(false);
  const [credentialsSearchTerm, setCredentialsSearchTerm] = useState('');
  
  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRecentJoiners, setFilteredRecentJoiners] = useState([]);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch joiner statistics
      const statsResponse = await axiosInstance.get(API_PATHS.JOINERS.STATS);
      const joinerStats = statsResponse.data.overview;
      
      // Fetch recent joiners (increased limit to get more data for today's filtering)
      const joinersResponse = await axiosInstance.get(`${API_PATHS.JOINERS.GET_ALL}?limit=50&sortBy=joiningDate&sortOrder=desc`);
      const recentJoinersData = joinersResponse.data.joiners.map(joiner => ({
        id: joiner._id,
        name: joiner.candidate_name || joiner.name,
        email: joiner.candidate_personal_mail_id || joiner.email,
        joiningDate: joiner.date_of_joining || joiner.joiningDate,
        department: joiner.department || 'N/A',
        status: joiner.status === 'active' ? 'Active' : joiner.status === 'pending' ? 'Pending' : 'Inactive'
      }));

      // Calculate not joiners count
      const notJoinersCount = recentJoinersData.filter(joiner => 
        joiner.status && (
          joiner.status.toLowerCase() === 'not_joined' ||
          joiner.status.toLowerCase() === 'declined' ||
          joiner.status.toLowerCase() === 'no_show' ||
          joiner.status.toLowerCase() === 'cancelled' ||
          joiner.status.toLowerCase() === 'inactive'
        )
      ).length;
      
      setStats({
        totalJoiners: joinerStats.total || 0,
        pendingActivations: joinerStats.pending || 0,
        notJoiners: notJoinersCount,
        activeTrainees: joinerStats.active || 0
      });
      
      setRecentJoiners(recentJoinersData);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
      
      // Set fallback data
      setStats({
        totalJoiners: 0,
        pendingActivations: 0,
        notJoiners: 0,
        activeTrainees: 0
      });
      setRecentJoiners([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch activated users with credentials
  const fetchActivatedUsers = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);
      const users = response.data.users || [];
      
      // Filter for activated users (those with accounts created)
      const activatedUsersData = users
        .filter(user => user.accountCreated && user.role === 'trainee')
        .map(user => {
          // Handle assignedTrainer - API populates it as object with name, email, author_id
          let assignedTrainerName = null;
          if (user.assignedTrainer) {
            if (typeof user.assignedTrainer === 'object' && user.assignedTrainer !== null) {
              // Populated object from API - check for name property
              if (user.assignedTrainer.name) {
                assignedTrainerName = user.assignedTrainer.name;
              } else if (user.assignedTrainer.email) {
                assignedTrainerName = user.assignedTrainer.email;
              } else if (user.assignedTrainer.author_id) {
                assignedTrainerName = user.assignedTrainer.author_id;
              }
            } else if (typeof user.assignedTrainer === 'string') {
              // If it's a string ID, try to find the trainer name from the users list
              const trainer = users.find(u => 
                (u._id === user.assignedTrainer || u.author_id === user.assignedTrainer) && 
                u.role === 'trainer'
              );
              assignedTrainerName = trainer ? trainer.name : null;
            }
          }
          
          return {
            id: user._id,
            name: user.name,
            email: user.email,
            password: user.tempPassword || 'Generated Password',
            passwordChanged: user.passwordChanged || false,
            accountCreatedAt: user.accountCreatedAt,
            department: user.department || 'N/A',
            assignedTrainer: assignedTrainerName
          };
        })
        .sort((a, b) => new Date(b.accountCreatedAt) - new Date(a.accountCreatedAt));
      
      setActivatedUsers(activatedUsersData);
    } catch (error) {
      console.error('Error fetching activated users:', error);
      console.error('Error response:', error.response);
      toast.error('Failed to load activated users');
    }
  };

  // Copy password to clipboard
  const copyPassword = async (password, userName) => {
    try {
      await navigator.clipboard.writeText(password);
      toast.success(`Password for ${userName} copied to clipboard!`);
    } catch (error) {
      console.error('Failed to copy password:', error);
      toast.error('Failed to copy password');
    }
  };

  // Fetch calendar data
  const fetchCalendarData = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.JOINERS.STATS);
      const dailyJoiners = response.data.dailyJoiners || [];
      
      // Debug: Log the raw data from backend
      
      // Convert daily joiners to calendar data format
      const calendarDataObj = {};
      dailyJoiners.forEach(item => {
        // Since backend now returns simple YYYY-MM-DD strings, use them directly
        let dateStr = item.date;
        
        // TEMPORARY: Adjust date by one day to fix the offset issue
        const originalDate = moment(dateStr);
        const adjustedDate = originalDate.add(1, 'day');
        dateStr = adjustedDate.format('YYYY-MM-DD');
        
        calendarDataObj[dateStr] = item.count;
      });

      // Debug: Log what dates will be displayed on calendar
      Object.keys(calendarDataObj).forEach(date => {
      });
      
      setCalendarData(calendarDataObj);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    }
  };

  // Fetch joiners for a specific date
  const fetchJoinersForDate = async (date) => {
    try {
      const dateStr = date.format('YYYY-MM-DD');
      
      // TEMPORARY: Adjust the selected date by one day to match the calendar adjustment
      const adjustedDate = moment(dateStr).subtract(1, 'day').format('YYYY-MM-DD');
      
      // Fetch all joiners and filter by date on frontend since backend might not support joiningDate filter
      const response = await axiosInstance.get(`${API_PATHS.JOINERS.GET_ALL}?limit=1000`);
      const allJoiners = response.data.joiners || [];
      
      // Debug: Log all joiners and their status
      console.log('=== CALENDAR JOINER DEBUG ===');
      console.log('All joiners from API:', allJoiners.length);
      const joinerStatuses = allJoiners.map(j => ({ 
        name: j.candidate_name || j.name, 
        email: j.candidate_personal_mail_id || j.email, 
        status: j.status 
      }));
      console.log('Joiner statuses:', joinerStatuses);
      console.log('Status values:', joinerStatuses.map(j => j.status));
      
      // Filter joiners by the selected date and exclude inactive joiners
      const filteredJoiners = allJoiners.filter(joiner => {
        // Exclude inactive joiners
        if (joiner.status === 'inactive') {
          console.log('❌ Excluding inactive joiner:', joiner.candidate_name || joiner.name, joiner.status);
          return false;
        }
        
        // Try multiple possible date field names in order of preference
        const dateField = joiner.date_of_joining || joiner.joiningDate || joiner.joining_date;
        if (!dateField) {
          return false;
        }
        
        // Convert joiner date to YYYY-MM-DD format for comparison
        let joinerDate;
        try {
          // Try different date formats in order of preference
          let momentDate;
          
          // First try DD-MMM-YYYY format (like "25-Sep-2025")
          if (moment(dateField, 'DD-MMM-YYYY', true).isValid()) {
            momentDate = moment(dateField, 'DD-MMM-YYYY');
          }
          // Then try DD-MMM-YYYY without strict mode
          else if (moment(dateField, 'DD-MMM-YYYY').isValid()) {
            momentDate = moment(dateField, 'DD-MMM-YYYY');
          }
          // Then try ISO format
          else if (moment(dateField).isValid()) {
            momentDate = moment.parseZone(dateField);
          }
          else {
            return false;
          }
          
          joinerDate = momentDate.format('YYYY-MM-DD');
        } catch (error) {
          return false;
        }
        
        const match = joinerDate === adjustedDate;
        
        return match;
      });
      
      console.log('Filtered joiners for date:', filteredJoiners.length);
      console.log('Filtered joiners details:', filteredJoiners.map(j => ({
        name: j.candidate_name || j.name,
        email: j.candidate_personal_mail_id || j.email,
        status: j.status
      })));
      console.log('=== END CALENDAR JOINER DEBUG ===');
      
      // Debug logging
      
      // Debug: Show sample joiner data structure
      if (allJoiners.length > 0) {
        // Sample joiner data available
      }
      
      // Debug: Log all joiners with their dates to understand the data structure
      
      // Debug: Show what the backend calendar data looks like
      
      // Show joiners around the target date for debugging
      const targetDate = moment(dateStr);
      const nearbyJoiners = allJoiners.filter(j => {
        const dateField = j.joiningDate || j.date_of_joining || j.joining_date;
        if (!dateField) return false;
        const joinerDate = moment(dateField);
        return joinerDate.isBetween(targetDate.clone().subtract(2, 'days'), targetDate.clone().add(2, 'days'), 'day', '[]');
      });
      
      setSelectedDateJoiners(filteredJoiners);
    } catch (error) {
      console.error('Error fetching joiners for date:', error);
      toast.error('Failed to fetch joiners for selected date');
    }
  };

  // Fetch all joiners for popup (no filtering)
  const fetchAllJoiners = async () => {
    try {
      const response = await axiosInstance.get(`${API_PATHS.JOINERS.GET_ALL}?limit=100&sortBy=joiningDate&sortOrder=asc`);
      const allJoinersData = response.data.joiners || [];
      
      // Debug: Log the dates to see what we're getting
      //   joiningDate: j.joiningDate,
      //   joiningDateType: typeof j.joiningDate,
      //   joiningDateTimestamp: new Date(j.joiningDate).getTime(),
      //   createdAt: j.createdAt
      // })));
      
      // Map joiners data to ensure correct field names
      const mappedJoinersData = allJoinersData.map(joiner => ({
        ...joiner,
        name: joiner.candidate_name || joiner.name,
        email: joiner.candidate_personal_mail_id || joiner.email,
        joiningDate: joiner.date_of_joining || joiner.joiningDate
      }));
      
      // Client-side sorting as fallback to ensure proper date order
      const sortedJoiners = mappedJoinersData.sort((a, b) => {
        // More robust date parsing
        const dateA = new Date(a.joiningDate);
        const dateB = new Date(b.joiningDate);
        
        // Check if dates are valid
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
          console.warn('Invalid date detected:', { 
            a: { name: a.name, date: a.joiningDate, parsed: dateA },
            b: { name: b.name, date: b.joiningDate, parsed: dateB }
          });
        }
        
        return dateA - dateB; // Ascending order (oldest first - September before October)
      });
      
      //   joiningDate: j.joiningDate,
      //   joiningDateTimestamp: new Date(j.joiningDate).getTime(),
      //   formattedDate: moment(j.joiningDate).format('MMM D, YYYY')
      // })));
      
      setAllJoiners(sortedJoiners);
    } catch (error) {
      console.error('Error fetching all joiners:', error);
      toast.error('Failed to fetch joiners data');
    }
  };

  // Fetch active joiners for popup
  const fetchActiveJoiners = async () => {
    try {
      const response = await axiosInstance.get(`${API_PATHS.JOINERS.GET_ALL}?limit=100&sortBy=joiningDate&sortOrder=asc`);
      const allJoinersData = response.data.joiners || [];
      
      // Filter for active joiners (case insensitive)
      const activeJoiners = allJoinersData.filter(joiner => 
        joiner.status && joiner.status.toLowerCase() === 'active'
      ).map(joiner => ({
        ...joiner,
        name: joiner.candidate_name || joiner.name,
        email: joiner.candidate_personal_mail_id || joiner.email,
        joiningDate: joiner.date_of_joining || joiner.joiningDate
      }));
      
      // Client-side sorting by joining date
      const sortedActiveJoiners = activeJoiners.sort((a, b) => {
        const dateA = new Date(a.joiningDate);
        const dateB = new Date(b.joiningDate);
        return dateA - dateB; // Ascending order (oldest first - September before October)
      });
      
      setAllJoiners(sortedActiveJoiners);
    } catch (error) {
      console.error('Error fetching active joiners:', error);
      toast.error('Failed to fetch active joiners data');
    }
  };

  // Fetch pending joiners for popup
  const fetchPendingJoiners = async () => {
    try {
      const response = await axiosInstance.get(`${API_PATHS.JOINERS.GET_ALL}?limit=100&sortBy=joiningDate&sortOrder=asc`);
      const allJoinersData = response.data.joiners || [];
      
      // Debug: Log all joiners and their statuses
      
      // Filter for pending joiners (case insensitive)
      const pendingJoiners = allJoinersData.filter(joiner => 
        joiner.status && joiner.status.toLowerCase() === 'pending'
      ).map(joiner => ({
        ...joiner,
        name: joiner.candidate_name || joiner.name,
        email: joiner.candidate_personal_mail_id || joiner.email,
        joiningDate: joiner.date_of_joining || joiner.joiningDate
      }));
      
      // Client-side sorting by joining date
      const sortedPendingJoiners = pendingJoiners.sort((a, b) => {
        const dateA = new Date(a.joiningDate);
        const dateB = new Date(b.joiningDate);
        return dateA - dateB; // Ascending order (oldest first - September before October)
      });
      
      setAllJoiners(sortedPendingJoiners);
    } catch (error) {
      console.error('Error fetching pending joiners:', error);
      toast.error('Failed to fetch pending joiners data');
    }
  };

  // Fetch not joiners (people who were supposed to join but didn't)
  const fetchNotJoiners = async () => {
    try {
      const response = await axiosInstance.get(`${API_PATHS.JOINERS.GET_ALL}?limit=100&sortBy=joiningDate&sortOrder=asc`);
      const allJoinersData = response.data.joiners || [];
      
      // Filter for not joiners (people who were supposed to join but didn't)
      // This could be people with status 'not_joined', 'declined', 'no_show', etc.
      const notJoiners = allJoinersData.filter(joiner => 
        joiner.status && (
          joiner.status.toLowerCase() === 'not_joined' ||
          joiner.status.toLowerCase() === 'declined' ||
          joiner.status.toLowerCase() === 'no_show' ||
          joiner.status.toLowerCase() === 'cancelled'
        )
      ).map(joiner => ({
        ...joiner,
        name: joiner.candidate_name || joiner.name,
        email: joiner.candidate_personal_mail_id || joiner.email,
        joiningDate: joiner.date_of_joining || joiner.joiningDate
      }));
      
      // Client-side sorting by joining date
      const sortedNotJoiners = notJoiners.sort((a, b) => {
        const dateA = new Date(a.joiningDate);
        const dateB = new Date(b.joiningDate);
        return dateA - dateB; // Ascending order (oldest first)
      });
      
      setAllJoiners(sortedNotJoiners);
    } catch (error) {
      console.error('Error fetching not joiners:', error);
      toast.error('Failed to fetch not joiners data');
    }
  };

  // Handle different popup types
  const handleTotalJoinersClick = () => {
    setPopupType('all');
    setShowJoinersPopup(true);
    fetchAllJoiners();
  };

  const handleActiveJoinersClick = () => {
    setPopupType('active');
    setShowJoinersPopup(true);
    fetchActiveJoiners();
  };

  const handlePendingJoinersClick = () => {
    setShowPendingAssignmentsPopup(true);
  };

  const handleNotJoinersClick = () => {
    setPopupType('not-joiners');
    setShowJoinersPopup(true);
    fetchNotJoiners();
  };

  useEffect(() => {
    fetchDashboardData();
    fetchCalendarData();
    fetchActivatedUsers();
  }, []);

  // Filter recent joiners based on search term and show only today's active joiners
  useEffect(() => {
    // First filter: Only today's joiners with Active status
    const today = moment().format('YYYY-MM-DD');
    
    const todayActiveJoiners = recentJoiners.filter(joiner => {
      // Try multiple date parsing methods
      let joinerDate;
      try {
        // Method 1: Parse with timezone
        joinerDate = moment.parseZone(joiner.joiningDate).format('YYYY-MM-DD');
      } catch (e) {
        try {
          // Method 2: Parse without timezone
          joinerDate = moment(joiner.joiningDate).format('YYYY-MM-DD');
        } catch (e2) {
          // Method 3: Use native Date
          joinerDate = new Date(joiner.joiningDate).toISOString().split('T')[0];
        }
      }
      
      return joinerDate === today && (joiner.status === 'Active' || joiner.status === 'active');
    });

    // If no joiners found for today, show recent active joiners from last 7 days
    let finalJoiners = todayActiveJoiners;
    if (todayActiveJoiners.length === 0) {
      const sevenDaysAgo = moment().subtract(7, 'days').format('YYYY-MM-DD');
      const recentActiveJoiners = recentJoiners.filter(joiner => {
        let joinerDate;
        try {
          joinerDate = moment.parseZone(joiner.joiningDate).format('YYYY-MM-DD');
        } catch (e) {
          try {
            joinerDate = moment(joiner.joiningDate).format('YYYY-MM-DD');
          } catch (e2) {
            joinerDate = new Date(joiner.joiningDate).toISOString().split('T')[0];
          }
        }
        return joinerDate >= sevenDaysAgo && (joiner.status === 'Active' || joiner.status === 'active');
      });
      
      // If still no joiners, show all active joiners for debugging
      if (recentActiveJoiners.length === 0) {
        const allActiveJoiners = recentJoiners.filter(joiner => 
          joiner.status === 'Active' || joiner.status === 'active'
        );
        finalJoiners = allActiveJoiners;
      } else {
        finalJoiners = recentActiveJoiners;
      }
    }

    // Second filter: Apply search term if provided
    if (!searchTerm.trim()) {
      setFilteredRecentJoiners(finalJoiners);
    } else {
      const filtered = finalJoiners.filter(joiner => 
        joiner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        joiner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (joiner.department && joiner.department.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredRecentJoiners(filtered);
    }
  }, [searchTerm, recentJoiners]);

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!joinerForm.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!joinerForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(joinerForm.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!joinerForm.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(joinerForm.phone.replace(/\s/g, ''))) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    if (!joinerForm.department.trim()) {
      errors.department = 'Department is required';
    }
    
    if (!joinerForm.joiningDate) {
      errors.joiningDate = 'Joining date is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmitJoiner = async () => {
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axiosInstance.post(API_PATHS.JOINERS.CREATE, {
        name: joinerForm.name,
        email: joinerForm.email,
        phone: joinerForm.phone,
        department: joinerForm.department,
        role: joinerForm.role,
        employeeId: joinerForm.employeeId || null,
        genre: joinerForm.genre || null,
        joiningDate: joinerForm.joiningDate
      });

      if (response.data) {
        toast.success('New joiner added successfully!');
        setShowNewJoinerModal(false);
        resetForm();
        fetchDashboardData();
        fetchCalendarData();
      }
    } catch (error) {
      console.error('Error creating joiner:', error);
      if (error.response?.data?.message === 'Joiner with this email already exists') {
        toast.error('Email already exists! Please use a different email address.');
      } else {
        toast.error('Failed to add new joiner. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setJoinerForm({
      name: '',
      email: '',
      phone: '',
      department: '',
      joiningDate: moment().format('YYYY-MM-DD'),
      role: 'trainee',
      employeeId: '',
      genre: ''
    });
    setFormErrors({});
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setJoinerForm(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Calendar functions
  const getDaysInMonth = () => {
    const startOfMonth = currentMonth.clone().startOf('month');
    const endOfMonth = currentMonth.clone().endOf('month');
    const days = [];
    
    // Add days from previous month
    const startDay = startOfMonth.day();
    for (let i = startDay - 1; i >= 0; i--) {
      days.push(startOfMonth.clone().subtract(i + 1, 'days'));
    }
    
    // Add days from current month
    let day = startOfMonth.clone();
    while (day.isSameOrBefore(endOfMonth)) {
      days.push(day.clone());
      day.add(1, 'day');
    }
    
    // Add days from next month to fill the grid
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(endOfMonth.clone().add(i, 'days'));
    }
    
    return days;
  };

  const getJoinerCountForDate = (date) => {
    const dateStr = date.format('YYYY-MM-DD');
    const count = calendarData[dateStr] || 0;
    
    // Debug: Log when we're checking for joiner count
    if (count > 0) {
    }
    
    return count;
  };

  const isToday = (date) => {
    return date.isSame(moment(), 'day');
  };

  const isCurrentMonth = (date) => {
    return date.isSame(currentMonth, 'month');
  };

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
          
          {/* Search Bar */}
          <div className="mt-4 md:mt-0">
            <div className="relative">
              <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-96 lg:w-[500px] pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 ml-5">
        <button
          onClick={() => setShowUploadPopup(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium cursor-pointer"
        >
          <LuUpload className="w-5 h-5" />
          <span>Upload New Joiners Data</span>
        </button>
        
        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium cursor-pointer"
        >
          <LuCalendar className="w-5 h-5" />
          <span>{showCalendar ? 'Hide Calendar' : 'Show Calendar'}</span>
        </button>
      </div>

      {/* Calendar View */}
      {showCalendar && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Joining Calendar</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentMonth(currentMonth.clone().subtract(1, 'month'))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LuClock className="w-4 h-4" />
              </button>
              <span className="text-lg font-medium text-gray-700 min-w-[120px] text-center">
                {currentMonth.format('MMMM YYYY')}
              </span>
              <button
                onClick={() => setCurrentMonth(currentMonth.clone().add(1, 'month'))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LuClock className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth().map((date, index) => {
              const joinerCount = getJoinerCountForDate(date);
              const isCurrentMonthDay = isCurrentMonth(date);
              const isTodayDate = isToday(date);
              
              return (
                <div
                  key={index}
                  className={`
                    p-2 h-16 border border-gray-200 rounded-lg cursor-pointer transition-colors
                    ${isCurrentMonthDay ? 'bg-white' : 'bg-gray-50'}
                    ${isTodayDate ? 'ring-2 ring-blue-500' : ''}
                    ${joinerCount > 0 ? 'hover:bg-blue-50' : 'hover:bg-gray-100'}
                  `}
                  onClick={() => {
                    setSelectedDate(date);
                    setJoinerForm(prev => ({ ...prev, joiningDate: date.format('YYYY-MM-DD') }));
                    fetchJoinersForDate(date);
                    setDateJoinersSearchTerm(''); // Reset search when selecting new date
                  }}
                >
                  <div className="flex flex-col h-full">
                    <span className={`text-sm ${isCurrentMonthDay ? 'text-gray-900' : 'text-gray-400'}`}>
                      {date.format('D')}
                    </span>
                    {joinerCount > 0 && (
                      <div className="mt-auto">
                        <div className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mx-auto">
                          {joinerCount}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {selectedDate && (
            <div className="mt-4 bg-white border border-gray-200 rounded-lg">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      Joiners on {selectedDate.format('MMMM D, YYYY')}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Showing only joiners who joined on this specific date
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    {selectedDateJoiners.length} joiner{selectedDateJoiners.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                {/* Search Bar */}
                <div className="relative">
                  <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search joiners by name, email, or department..."
                    value={dateJoinersSearchTerm}
                    onChange={(e) => setDateJoinersSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Joiners List */}
              <div className="max-h-96 overflow-y-auto scrollbar-thin">
                {selectedDateJoiners
                  .filter(joiner => 
                    !dateJoinersSearchTerm || 
                    (joiner.candidate_name || joiner.name || '').toLowerCase().includes(dateJoinersSearchTerm.toLowerCase()) ||
                    (joiner.candidate_personal_mail_id || joiner.email || '').toLowerCase().includes(dateJoinersSearchTerm.toLowerCase()) ||
                    (joiner.top_department_name_as_per_darwinbox || joiner.department || '').toLowerCase().includes(dateJoinersSearchTerm.toLowerCase())
                  )
                  .map((joiner, index) => (
                    <div key={joiner._id || index} className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold text-sm">
                            {(joiner.candidate_name || joiner.name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-gray-900 truncate">
                              {joiner.candidate_name || joiner.name || 'Unknown'}
                            </h5>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              joiner.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : joiner.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {joiner.status || 'Unknown'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {joiner.candidate_personal_mail_id || joiner.email || 'No email'}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            {joiner.top_department_name_as_per_darwinbox || joiner.department ? (
                              <div className="flex items-center text-sm text-gray-500">
                                <LuBuilding className="w-4 h-4 mr-1" />
                                <span>{joiner.top_department_name_as_per_darwinbox || joiner.department}</span>
                              </div>
                            ) : null}
                            {joiner.phone_number || joiner.phone ? (
                              <div className="flex items-center text-sm text-gray-500">
                                <LuPhone className="w-4 h-4 mr-1" />
                                <span>{joiner.phone_number || joiner.phone}</span>
                              </div>
                            ) : null}
                            {joiner.qualification ? (
                              <div className="flex items-center text-sm text-gray-500">
                                <LuGraduationCap className="w-4 h-4 mr-1" />
                                <span>{joiner.qualification}</span>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                
                {selectedDateJoiners.length === 0 && (
                  <div className="text-center py-8">
                    <LuUsers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No joiners found for this date</p>
                  </div>
                )}
                
                {selectedDateJoiners.length > 0 && selectedDateJoiners.filter(joiner => 
                  !dateJoinersSearchTerm || 
                  (joiner.candidate_name || joiner.name || '').toLowerCase().includes(dateJoinersSearchTerm.toLowerCase()) ||
                  (joiner.candidate_personal_mail_id || joiner.email || '').toLowerCase().includes(dateJoinersSearchTerm.toLowerCase()) ||
                  (joiner.top_department_name_as_per_darwinbox || joiner.department || '').toLowerCase().includes(dateJoinersSearchTerm.toLowerCase())
                ).length === 0 && (
                  <div className="text-center py-8">
                    <LuSearch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No joiners match your search criteria</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        <div className="card cursor-pointer hover:shadow-lg transition-shadow" onClick={handleTotalJoinersClick}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total New Joiners</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalJoiners}</p>
            </div>
            <LuUserPlus className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="card cursor-pointer hover:shadow-lg transition-shadow" onClick={handlePendingJoinersClick}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Account Activation</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pendingActivations}</p>
            </div>
            <LuUsers className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="card cursor-pointer hover:shadow-lg transition-shadow" onClick={handleNotJoinersClick}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Not Joiners</p>
              <p className="text-2xl font-bold text-red-600">{stats.notJoiners}</p>
            </div>
            <LuX className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="card cursor-pointer hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Trainees</p>
              <p className="text-2xl font-bold text-purple-600">{stats.activeTrainees}</p>
            </div>
            <LuTrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Activated Users Credentials Container */}
      <div className="my-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Activated User Credentials</h3>
              <p className="text-sm text-gray-600 mt-1">
                Manage credentials for activated trainee accounts
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchActivatedUsers}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                <LuSearch className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => setShowCredentialsContainer(!showCredentialsContainer)}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
              >
                <LuUsers className="w-4 h-4" />
                <span>{showCredentialsContainer ? 'Hide' : 'Show'} Credentials</span>
              </button>
            </div>
          </div>

        {showCredentialsContainer && (
          <div className="space-y-4">
              
              {/* Search Bar */}
              <div className="relative">
                <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search activated users by name, email, department, or assigned trainer..."
                  value={credentialsSearchTerm}
                  onChange={(e) => setCredentialsSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Credentials List */}
              <div className="max-h-96 overflow-y-auto scrollbar-thin">
                {activatedUsers
                  .filter(user => {
                    const searchTerm = credentialsSearchTerm.toLowerCase();
                    return (
                      user.name.toLowerCase().includes(searchTerm) ||
                      user.email.toLowerCase().includes(searchTerm) ||
                      user.department.toLowerCase().includes(searchTerm) ||
                      (user.assignedTrainer && user.assignedTrainer.toLowerCase().includes(searchTerm))
                    );
                  })
                  .map((user) => (
                    <div key={user.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                              <LuUser className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{user.name}</h4>
                              <p className="text-sm text-gray-600">{user.email}</p>
                              <p className="text-xs text-gray-500">{user.department}</p>
                              {user.assignedTrainer && (
                                <p className="text-xs text-blue-600 mt-1">
                                  Assigned Trainer: {user.assignedTrainer}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {user.passwordChanged ? 'User changed their password' : 'Temporary Password'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Activated: {moment(user.accountCreatedAt).format('MMM DD, YYYY')}
                            </p>
                          </div>
                          
                          {!user.passwordChanged && (
                            <button
                              onClick={() => copyPassword(user.password, user.name)}
                              className="flex items-center space-x-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors text-sm font-medium"
                            >
                              <LuUser className="w-4 h-4" />
                              <span>Copy Password</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                
                {activatedUsers.length === 0 && (
                  <div className="text-center py-8">
                    <LuUser className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No activated users found</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
        {/* Recent New Joiners */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {filteredRecentJoiners.length > 0 && filteredRecentJoiners[0]?.joiningDate === moment().format('YYYY-MM-DD') 
                  ? "Today's Active Joiners" 
                  : "Recent Active Joiners"
                }
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {searchTerm 
                  ? `Showing ${filteredRecentJoiners.length} of recent active joiners`
                  : `${filteredRecentJoiners.length} active joiners`
                }
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {filteredRecentJoiners.length > 0 && filteredRecentJoiners[0]?.joiningDate === moment().format('YYYY-MM-DD')
                  ? "Only showing joiners who joined today with Active status"
                  : "Showing recent active joiners from the last 7 days"
                }
              </p>
            </div>
            <button 
              onClick={handleActiveJoinersClick}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin">
            {filteredRecentJoiners.length > 0 ? (
              filteredRecentJoiners.map((joiner) => (
              <div key={joiner.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {joiner.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{joiner.name}</p>
                    <p className="text-sm text-gray-500">{joiner.department}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    joiner.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {joiner.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {moment(joiner.joiningDate).format('MMM DD')}
                  </p>
                </div>
              </div>
              ))
            ) : (
              <div className="text-center py-8">
                <LuUserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm 
                    ? 'No active joiners found matching your search' 
                    : 'No active joiners found. Check the console for debugging info.'
                  }
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <div className="flex items-center space-x-3">
                <LuUserPlus className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900">Record New Joiner</span>
              </div>
              <LuClock className="w-4 h-4 text-gray-400" />
            </button>

            <button className="w-full flex items-center justify-between p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
              <div className="flex items-center space-x-3">
                <LuUsers className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-gray-900">Assign Trainees</span>
              </div>
              <LuClock className="w-4 h-4 text-gray-400" />
            </button>

            <button className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              <div className="flex items-center space-x-3">
                <LuFileSpreadsheet className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">Upload Results</span>
              </div>
              <LuClock className="w-4 h-4 text-gray-400" />
            </button>

            <button className="w-full flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
              <div className="flex items-center space-x-3">
                <LuTrendingUp className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-gray-900">View Reports</span>
              </div>
              <LuClock className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* New Joiner Modal */}
      {showNewJoinerModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowNewJoinerModal(false);
              resetForm();
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add New Joiner</h2>
              <button
                onClick={() => {
                  setShowNewJoinerModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <LuX className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={(e) => { e.preventDefault(); handleSubmitJoiner(); }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <LuUser className="w-4 h-4 inline mr-1" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={joinerForm.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter full name"
                    />
                    {formErrors.name && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <LuMail className="w-4 h-4 inline mr-1" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={joinerForm.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter email address"
                    />
                    {formErrors.email && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <LuPhone className="w-4 h-4 inline mr-1" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={joinerForm.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter phone number"
                    />
                    {formErrors.phone && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
                    )}
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <LuBuilding className="w-4 h-4 inline mr-1" />
                      Department/Batch *
                    </label>
                    <select
                      value={joinerForm.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.department ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Department</option>
                      <option value="IT">IT</option>
                      <option value="HR">HR</option>
                      <option value="Finance">Finance</option>
                      <option value="SDM">SDM</option>
                      <option value="SDI">SDI</option>
                      <option value="OTHERS">Others</option>
                    </select>
                    {formErrors.department && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.department}</p>
                    )}
                  </div>

                  {/* Joining Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <LuCalendarIcon className="w-4 h-4 inline mr-1" />
                      Joining Date *
                    </label>
                    <input
                      type="date"
                      value={joinerForm.joiningDate}
                      onChange={(e) => handleInputChange('joiningDate', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.joiningDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.joiningDate && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.joiningDate}</p>
                    )}
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <select
                      value={joinerForm.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="trainee">Trainee</option>
                    </select>
                  </div>

                  {/* Employee ID (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employee ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={joinerForm.employeeId}
                      onChange={(e) => handleInputChange('employeeId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter employee ID"
                    />
                  </div>

                  {/* Genre (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Genre (Optional)
                    </label>
                    <select
                      value={joinerForm.genre}
                      onChange={(e) => handleInputChange('genre', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Genre</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewJoinerModal(false);
                      resetForm();
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Adding...</span>
                      </>
                    ) : (
                      <>
                        <LuSave className="w-4 h-4" />
                        <span>Add Joiner</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Joiners Popup */}
      {showJoinersPopup && (
        <div 
          className="fixed inset-0 flex items-center justify-end z-50" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowJoinersPopup(false);
            }
          }}
        >
          <div className="bg-white h-full w-full max-w-md shadow-xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {popupType === 'all' ? 'All New Joiners' : 
                   popupType === 'active' ? 'Active Joiners' : 
                   'Pending Joiners'}
                </h2>
                <p className="text-sm text-gray-600">
                  Total: {allJoiners.length} {popupType === 'all' ? 'joiners' : 
                  popupType === 'active' ? 'active joiners' : 'pending joiners'}
                </p>
              </div>
              <button
                onClick={() => setShowJoinersPopup(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <LuX className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
              <div className="relative">
                <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={`Search ${popupType === 'all' ? 'joiners' : 
                  popupType === 'active' ? 'active joiners' : 'pending joiners'} by name, email, department, or qualification...`}
                  value={joinersSearchTerm}
                  onChange={(e) => setJoinersSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Info Note */}
            <div className={`px-4 py-2 border-b flex-shrink-0 ${
              popupType === 'all' ? 'bg-gray-50 border-gray-200' :
              popupType === 'active' ? 'bg-green-50 border-green-200' :
              'bg-orange-50 border-orange-200'
            }`}>
              <p className={`text-xs ${
                popupType === 'all' ? 'text-gray-700' :
                popupType === 'active' ? 'text-green-700' :
                'text-orange-700'
              }`}>
                <LuInfo className="inline w-3 h-3 mr-1" />
                {popupType === 'all' ? 'Showing all joiners (active and pending)' :
                 popupType === 'active' ? 'Showing only active joiners (pending joiners are not displayed)' :
                 'Showing only pending joiners (active joiners are not displayed)'}
              </p>
            </div>

            {/* Joiners List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin" style={{ minHeight: 0 }}>
              <div className="p-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                    <LuLoader className="w-10 h-10 text-blue-500 animate-spin" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Joiners...</h3>
                  <p className="text-gray-500 text-sm max-w-md mx-auto">Please wait while we fetch the joiner data.</p>
                </div>
              ) : allJoiners
                .filter(joiner => 
                  joiner.name.toLowerCase().includes(joinersSearchTerm.toLowerCase()) ||
                  joiner.email.toLowerCase().includes(joinersSearchTerm.toLowerCase()) ||
                  (joiner.department && joiner.department.toLowerCase().includes(joinersSearchTerm.toLowerCase())) ||
                  (joiner.qualification && joiner.qualification.toLowerCase().includes(joinersSearchTerm.toLowerCase()))
                )
                .map((joiner) => (
                  <div key={joiner._id} className="bg-white border border-gray-200 rounded-lg p-4 mb-3 hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <LuUser className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {joiner.name}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            joiner.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : joiner.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {joiner.status || 'pending'}
                          </span>
                        </div>
                        <div className="mt-1 space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <LuMail className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="truncate">{joiner.email}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <LuBuilding className="w-4 h-4 mr-2 text-gray-400" />
                            <span>{joiner.department || 'N/A'}</span>
                          </div>
                          {joiner.qualification && (
                            <div className="flex items-center text-sm text-gray-600">
                              <LuGraduationCap className="w-4 h-4 mr-2 text-gray-400" />
                              <span>{joiner.qualification}</span>
                            </div>
                          )}
                          <div className="flex items-center text-sm text-gray-600">
                            <LuCalendar className="w-4 h-4 mr-2 text-gray-400" />
                            <span>{moment(joiner.joiningDate).format('MMM D, YYYY')}</span>
                          </div>
                          {joiner.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <LuPhone className="w-4 h-4 mr-2 text-gray-400" />
                              <span>{joiner.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              
              {!loading && allJoiners.length === 0 && (
                <div className="text-center py-8">
                  <LuUserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {popupType === 'all' ? 'No joiners found' :
                     popupType === 'active' ? 'No active joiners found' :
                     'No pending joiners found'}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    {popupType === 'all' ? 'Try adding some joiners first' :
                     popupType === 'active' ? 'All joiners might be pending approval' :
                     'All joiners might already be active'}
                  </p>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload New Joiners Data Popup */}
      <UploadJoinersPopup
        isOpen={showUploadPopup}
        onClose={() => setShowUploadPopup(false)}
        onSuccess={(data) => {
          toast.success(`Successfully uploaded ${data.createdCount} joiners!`);
          fetchDashboardData(); // Refresh dashboard data
        }}
      />

      {/* Account Activation Popup */}
      <PendingAssignmentsPopup
        isOpen={showPendingAssignmentsPopup}
        onClose={() => setShowPendingAssignmentsPopup(false)}
        onSuccess={() => {
          fetchDashboardData(); // Refresh dashboard data
          fetchActivatedUsers(); // Refresh activated users credentials
        }}
      />
    </DashboardLayout>
  );
};

export default BOADashboard;
