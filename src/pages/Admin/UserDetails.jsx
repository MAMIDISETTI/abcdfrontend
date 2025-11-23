import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { toast } from 'react-hot-toast';
import {
  LuUser,
  LuMail,
  LuPhone,
  LuMapPin,
  LuGraduationCap,
  LuBriefcase,
  LuCalendar,
  LuTrendingUp,
  LuCalendar as LuCalendarIcon,
  LuUsers,
  LuActivity,
  LuLoader,
  LuChevronLeft,
  LuCheck,
  LuX,
  LuInfo,
  LuPencil
} from 'react-icons/lu';

const UserDetails = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const authorId = searchParams.get('author_id');
  
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  
  // Edit states for each section
  const [editPersonalDetails, setEditPersonalDetails] = useState(false);
  const [editLearningReport, setEditLearningReport] = useState(false);
  const [editAttendanceReport, setEditAttendanceReport] = useState(false);
  const [editGroomingReport, setEditGroomingReport] = useState(false);
  const [editInteractionsReport, setEditInteractionsReport] = useState(false);
  
  // Editable data states
  const [editablePersonalDetails, setEditablePersonalDetails] = useState({});
  const [editableLearningReport, setEditableLearningReport] = useState(null);
  const [editableAttendanceReport, setEditableAttendanceReport] = useState(null);
  const [editableGroomingReport, setEditableGroomingReport] = useState(null);
  const [editableInteractionsReport, setEditableInteractionsReport] = useState(null);
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authorId) {
      fetchUserDetails();
      fetchPerformanceData();
    } else {
      toast.error('Author ID is required');
      navigate('/admin/performers-metrics-dashboard');
    }
  }, [authorId]);

  // Set default selected course when learning report data loads
  useEffect(() => {
    if (performanceData?.learningReport?.reportData) {
      const reportData = performanceData.learningReport.reportData;
      const skills = reportData.skills || [];
      const dailyQuizCounts = reportData['Daily Quiz counts'] || reportData['Daily Quiz Counts'] || {};
      const allTopics = new Set([
        ...skills,
        ...Object.keys(dailyQuizCounts),
        ...(reportData.CourseCompletion ? Object.keys(reportData.CourseCompletion) : [])
      ]);
      
      // Helper to get course status
      const getCourseStatus = (courseName) => {
        if (!reportData.CourseCompletion || typeof reportData.CourseCompletion !== 'object') {
          return null;
        }
        const courseData = reportData.CourseCompletion[courseName];
        if (!courseData || typeof courseData !== 'object') {
          return null;
        }
        const status = courseData.status || courseData.Status;
        if (!status || typeof status !== 'string') {
          return null;
        }
        const statusLower = status.toLowerCase().trim();
        if (statusLower === 'completed' || statusLower === 'done' || statusLower === 'finished') {
          return 'Completed';
        }
        if (statusLower === 'in progress' || statusLower === 'inprogress' || 
            statusLower === 'ongoing' || statusLower === 'working' || 
            statusLower === 'currently doing' || statusLower.includes('progress')) {
          return 'In Progress';
        }
        return null;
      };
      
      // Filter and sort topics by status
      const topicsWithStatus = Array.from(allTopics).map(topic => ({
        name: topic,
        status: getCourseStatus(topic)
      }));
      
      const filteredTopics = topicsWithStatus.filter(topic => 
        topic.status === 'Completed' || topic.status === 'In Progress'
      );
      
      const sortedTopics = filteredTopics.sort((a, b) => {
        if (a.status === 'Completed' && b.status === 'In Progress') return -1;
        if (a.status === 'In Progress' && b.status === 'Completed') return 1;
        return a.name.localeCompare(b.name);
      });
      
      // If no filtered topics, use all topics (without status filter)
      const topicsToUse = sortedTopics.length > 0 ? sortedTopics : topicsWithStatus;
      
      if (!selectedCourse && topicsToUse.length > 0) {
        setSelectedCourse(topicsToUse[0].name);
      } else if (!selectedCourse && allTopics.size > 0) {
        // Final fallback: use first topic from allTopics
        setSelectedCourse(Array.from(allTopics)[0]);
      }
    }
  }, [performanceData?.learningReport, selectedCourse]);

  // Initialize editable data when entering edit mode
  useEffect(() => {
    if (editPersonalDetails && !editablePersonalDetails.name) {
      const personalDetails = performanceData?.personalDetails || userData || {};
      if (personalDetails.name) {
        setEditablePersonalDetails({
          name: personalDetails.name || '',
          email: personalDetails.email || personalDetails.emailId || '',
          phone: personalDetails.phone || personalDetails.phoneNumber || '',
          department: personalDetails.department || '',
          state: personalDetails.state || '',
          qualification: personalDetails.qualification || personalDetails.highestQualification || '',
          specialization: personalDetails.specialization || '',
          joiningDate: personalDetails.joiningDate || personalDetails.dateOfJoining || personalDetails.doj || '',
          yearOfPassing: personalDetails.yearOfPassing || personalDetails.yearOfPassout || '',
          isActive: personalDetails.isActive !== undefined ? personalDetails.isActive : true
        });
      }
    }
  }, [editPersonalDetails, performanceData?.personalDetails, userData]);

  const fetchUserDetails = async () => {
    try {
      // Fetch user details from users endpoint - search by author_id
      const response = await axiosInstance.get(`${API_PATHS.USERS.GET_ALL_USERS}?search=${authorId}&limit=1000`);
      if (response.data && response.data.data && response.data.data.length > 0) {
        // Find user with matching author_id
        const user = response.data.data.find(u => u.author_id === authorId);
        if (user) {
          setUserData(user);
        }
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.CANDIDATE_REPORTS.GET_PERFORMANCE(authorId));
      if (response.data.success) {
        setPerformanceData(response.data.data);
        // Debug: Log what data we received
        console.log('Performance Data Received:', {
          hasLearningReport: !!response.data.data.learningReport,
          hasAttendanceReport: !!response.data.data.attendanceReport,
          hasGroomingReport: !!response.data.data.groomingReport,
          hasInteractionsReport: !!response.data.data.interactionsReport,
          attendanceReport: response.data.data.attendanceReport,
          groomingReport: response.data.data.groomingReport,
          interactionsReport: response.data.data.interactionsReport
        });
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
      toast.error('Failed to fetch performance data');
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeId = () => {
    if (performanceData?.personalDetails?.employeeId) {
      const empId = performanceData.personalDetails.employeeId;
      // Return NW format if available, otherwise return as is
      if (empId && !empId.startsWith('EMP_')) {
        return empId;
      }
    }
    return userData?.employeeId || 'N/A';
  };

  // Compute personalDetails before early returns so it's available in JSX
  const personalDetails = performanceData?.personalDetails || userData || {};

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <LuLoader className="animate-spin text-slate-600 w-12 h-12 mx-auto mb-4" />
          <p className="text-slate-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!userData && !performanceData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 text-lg">User not found</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // personalDetails is already computed above

  // Save Personal Details
  const savePersonalDetails = async () => {
    setSaving(true);
    try {
      const response = await axiosInstance.put(
        API_PATHS.USERS.UPDATE_BY_AUTHOR(authorId),
        editablePersonalDetails
      );
      
      if (response.data.success) {
        toast.success('Personal details updated successfully');
        setEditPersonalDetails(false);
        // Refresh data
        await fetchUserDetails();
        await fetchPerformanceData();
        // Signal to dashboard that data has been updated using multiple methods
        const timestamp = Date.now().toString();
        localStorage.setItem('performersMetricsRefresh', timestamp);
        // Dispatch custom event for same-tab refresh
        window.dispatchEvent(new Event('performersMetricsUpdated'));
        // Use BroadcastChannel for cross-tab communication
        try {
          const channel = new BroadcastChannel('performersMetricsUpdates');
          channel.postMessage({ type: 'refresh', timestamp });
          channel.close();
        } catch (e) {
          // BroadcastChannel not supported, fallback to storage event
          // Trigger storage event manually by removing and re-adding
          localStorage.removeItem('performersMetricsRefresh');
          localStorage.setItem('performersMetricsRefresh', timestamp);
        }
      }
    } catch (error) {
      console.error('Error updating personal details:', error);
      toast.error('Failed to update personal details');
    } finally {
      setSaving(false);
    }
  };

  // Save Report Data
  const saveReport = async (reportType, reportData) => {
    setSaving(true);
    try {
      const response = await axiosInstance.put(
        API_PATHS.CANDIDATE_REPORTS.UPDATE_REPORT(authorId, reportType),
        { reportData }
      );
      
      if (response.data.success) {
        toast.success(`${reportType} report updated successfully`);
        // Refresh data
        await fetchPerformanceData();
        // Signal to dashboard that data has been updated using multiple methods
        const timestamp = Date.now().toString();
        localStorage.setItem('performersMetricsRefresh', timestamp);
        // Dispatch custom event for same-tab refresh
        window.dispatchEvent(new Event('performersMetricsUpdated'));
        // Use BroadcastChannel for cross-tab communication
        try {
          const channel = new BroadcastChannel('performersMetricsUpdates');
          channel.postMessage({ type: 'refresh', timestamp });
          channel.close();
        } catch (e) {
          // BroadcastChannel not supported, fallback to storage event
          // Trigger storage event manually by removing and re-adding
          localStorage.removeItem('performersMetricsRefresh');
          localStorage.setItem('performersMetricsRefresh', timestamp);
        }
        return true;
      }
    } catch (error) {
      console.error(`Error updating ${reportType} report:`, error);
      toast.error(`Failed to update ${reportType} report`);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // ========== RENDERING FUNCTIONS (copied from CandidatePerformanceDashboard) ==========
  
  // Render Learning Report Edit Form
  const renderLearningReportEditForm = () => {
    if (!editableLearningReport) return null;

    const reportData = editableLearningReport;
    
    // Helper to find field by variations
    const findField = (variations) => {
      for (const variation of variations) {
        if (reportData[variation] !== undefined) {
          return variation;
        }
      }
      // Try case-insensitive
      const lowerVariations = variations.map(v => v.toLowerCase().trim());
      for (const key in reportData) {
        if (lowerVariations.includes(key.toLowerCase().trim())) {
          return key;
        }
      }
      return variations[0]; // Return first as default
    };
    
    // Get all unique courses/topics
    const getAllTopics = () => {
      const topics = new Set();
      
      // Helper to add keys from object
      const addKeys = (obj) => {
        if (obj && typeof obj === 'object') {
          Object.keys(obj).forEach(key => {
            if (key && key.trim() !== '') {
              topics.add(key);
            }
          });
        }
      };
      
      // Helper to find and add keys from field variations
      const addKeysFromVariations = (variations) => {
        const fieldName = findField(variations);
        if (fieldName && reportData[fieldName]) {
          addKeys(reportData[fieldName]);
        }
      };
      
      // Add topics from various fields using variations
      addKeysFromVariations(['Daily Quiz counts', 'Daily Quiz Counts', 'dailyQuizCounts']);
      addKeysFromVariations(['Course Exam attempts', 'Course Exam Attempts', 'courseExamAttempts']);
      addKeysFromVariations(['Course Exam score', 'Course Exam score in %', 'Course Exam Scores', 'courseExamScores']);
      addKeys(reportData['CourseCompletion']);
      if (Array.isArray(reportData.skills)) {
        reportData.skills.forEach(skill => {
          if (skill && skill.trim() !== '') {
            topics.add(skill);
          }
        });
      }
      
      return Array.from(topics).sort();
    };

    const topics = getAllTopics();

    // Helper to get value from reportData with fallback
    const getValue = (fieldVariations, topic) => {
      const fieldName = findField(fieldVariations);
      const field = reportData[fieldName];
      if (field && typeof field === 'object' && field[topic] !== undefined) {
        const val = field[topic];
        return val === null || val === undefined ? '' : val;
      }
      return '';
    };

    // Helper to set value in reportData
    const setValue = (fieldVariations, topic, value) => {
      const fieldName = findField(fieldVariations);
      if (!reportData[fieldName]) {
        reportData[fieldName] = {};
      }
      if (value === '' || value === null || value === undefined) {
        delete reportData[fieldName][topic];
        if (Object.keys(reportData[fieldName]).length === 0) {
          delete reportData[fieldName];
        }
      } else {
        reportData[fieldName][topic] = value;
      }
      setEditableLearningReport({ ...reportData });
    };

    // Helper to get CourseCompletion status
    const getCourseStatus = (topic) => {
      const completion = reportData.CourseCompletion?.[topic];
      if (completion && typeof completion === 'object') {
        return completion.status || completion.Status || '';
      }
      return '';
    };

    // Helper to set CourseCompletion status
    const setCourseStatus = (topic, status) => {
      if (!reportData.CourseCompletion) {
        reportData.CourseCompletion = {};
      }
      if (!reportData.CourseCompletion[topic]) {
        reportData.CourseCompletion[topic] = {};
      }
      if (status === '') {
        delete reportData.CourseCompletion[topic].status;
        if (Object.keys(reportData.CourseCompletion[topic]).length === 0) {
          delete reportData.CourseCompletion[topic];
        }
      } else {
        reportData.CourseCompletion[topic].status = status;
      }
      setEditableLearningReport({ ...reportData });
    };

    return (
      <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2">
        {topics.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No course data found. Add a course to get started.</p>
          </div>
        ) : (
          topics.map((topic, index) => (
            <div key={index} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h3 className="text-base font-semibold text-slate-900 mb-4">{topic}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Course Completion Status */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Course Status
                  </label>
                  <select
                    value={getCourseStatus(topic)}
                    onChange={(e) => setCourseStatus(topic, e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">Not Set</option>
                    <option value="Completed">Completed</option>
                    <option value="In Progress">In Progress</option>
                  </select>
                </div>

                {/* Course Exam Attempts */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Course Exam Attempts
                  </label>
                  <input
                    type="number"
                    value={getValue(['Course Exam attempts', 'Course Exam Attempts', 'courseExamAttempts'], topic)}
                    onChange={(e) => setValue(['Course Exam attempts', 'Course Exam Attempts', 'courseExamAttempts'], topic, e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter attempts"
                  />
                </div>

                {/* Course Exam Score */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Course Exam Score (%)
                  </label>
                  <input
                    type="number"
                    value={getValue(['Course Exam score', 'Course Exam score in %', 'Course Exam Scores', 'courseExamScores'], topic)}
                    onChange={(e) => setValue(['Course Exam score', 'Course Exam score in %', 'Course Exam Scores', 'courseExamScores'], topic, e.target.value ? parseFloat(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter score"
                  />
                </div>

                {/* Daily Quiz Count */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Daily Quiz Count
                  </label>
                  <input
                    type="number"
                    value={getValue(['Daily Quiz counts', 'Daily Quiz Counts', 'dailyQuizCounts'], topic)}
                    onChange={(e) => setValue(['Daily Quiz counts', 'Daily Quiz Counts', 'dailyQuizCounts'], topic, e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter count"
                  />
                </div>

                {/* Daily Quiz Attempts */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Daily Quiz Attempts
                  </label>
                  <input
                    type="number"
                    value={getValue(['Daily Quiz attempts count', 'Daily Quiz Attempts', 'dailyQuizAttempts'], topic)}
                    onChange={(e) => setValue(['Daily Quiz attempts count', 'Daily Quiz Attempts', 'dailyQuizAttempts'], topic, e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter attempts"
                  />
                </div>

                {/* Daily Quiz Average Score */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Daily Quiz Avg Score (%)
                  </label>
                  <input
                    type="number"
                    value={getValue(['Daily Quiz score Average', 'Daily Quiz score Average in %', 'Daily Quiz Average', 'dailyQuizAvgScores'], topic)}
                    onChange={(e) => setValue(['Daily Quiz score Average', 'Daily Quiz score Average in %', 'Daily Quiz Average', 'dailyQuizAvgScores'], topic, e.target.value ? parseFloat(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter average score"
                  />
                </div>

                {/* Fortnight Exam Count */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fortnight Exam Count
                  </label>
                  <input
                    type="text"
                    value={getValue(['Fortnight Exam Counts', 'Fort night exam counts', 'fortNightExamCounts'], topic)}
                    onChange={(e) => setValue(['Fortnight Exam Counts', 'Fort night exam counts', 'fortNightExamCounts'], topic, e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter count"
                  />
                </div>

                {/* Fortnight Exam Attempts */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fortnight Exam Attempts
                  </label>
                  <input
                    type="text"
                    value={getValue(['Fortnight Exam Attempts Counts', 'Fort night exam attempts counts', 'fortNightExamAttempts'], topic)}
                    onChange={(e) => setValue(['Fortnight Exam Attempts Counts', 'Fort night exam attempts counts', 'fortNightExamAttempts'], topic, e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter attempts"
                  />
                </div>

                {/* Fortnight Exam Average Score */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fortnight Exam Avg Score (%)
                  </label>
                  <input
                    type="number"
                    value={getValue(['Fort night exam score Average(In Percentage)', 'Fort night exam score Average', 'Fort Night Exam score Average in %', 'fortNightExamAvgScores'], topic)}
                    onChange={(e) => setValue(['Fort night exam score Average(In Percentage)', 'Fort night exam score Average', 'Fort Night Exam score Average in %', 'fortNightExamAvgScores'], topic, e.target.value ? parseFloat(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter average score"
                  />
                </div>

                {/* Online Demo Count */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Online Demo Count
                  </label>
                  <input
                    type="number"
                    value={getValue(['Online demo counts', 'Online Demo counts', 'onlineDemoCounts'], topic)}
                    onChange={(e) => setValue(['Online demo counts', 'Online Demo counts', 'onlineDemoCounts'], topic, e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter count"
                  />
                </div>

                {/* Online Demo Rating */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Online Demo Rating (%)
                  </label>
                  <input
                    type="number"
                    value={getValue(['Online demo ratings Average', 'Online Demo ratings Average', 'onlineDemoRatings'], topic)}
                    onChange={(e) => setValue(['Online demo ratings Average', 'Online Demo ratings Average', 'onlineDemoRatings'], topic, e.target.value ? parseFloat(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter rating"
                  />
                </div>

                {/* Offline Demo Count */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Offline Demo Count
                  </label>
                  <input
                    type="number"
                    value={getValue(['Offline demo counts', 'Offline Demo counts', 'offlineDemoCounts'], topic)}
                    onChange={(e) => setValue(['Offline demo counts', 'Offline Demo counts', 'offlineDemoCounts'], topic, e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter count"
                  />
                </div>

                {/* Offline Demo Rating */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Offline Demo Rating (%)
                  </label>
                  <input
                    type="number"
                    value={getValue(['Offline demo ratings Average', 'Offline Demo ratings Average', 'offlineDemoRatings'], topic)}
                    onChange={(e) => setValue(['Offline demo ratings Average', 'Offline Demo ratings Average', 'offlineDemoRatings'], topic, e.target.value ? parseFloat(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter rating"
                  />
                </div>

                {/* Weeks Expected */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Weeks Expected
                  </label>
                  <input
                    type="text"
                    value={getValue(['No.of weeks expected complete the course', 'No of weeks expected complete the course', 'weeksExpected'], topic) || (reportData.CourseCompletion?.[topic]?.weeksExpected) || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Also update CourseCompletion if it exists
                      if (reportData.CourseCompletion?.[topic]) {
                        if (value === '') {
                          delete reportData.CourseCompletion[topic].weeksExpected;
                        } else {
                          reportData.CourseCompletion[topic].weeksExpected = value;
                        }
                      }
                      setValue(['No.of weeks expected complete the course', 'No of weeks expected complete the course', 'weeksExpected'], topic, value);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter weeks"
                  />
                </div>

                {/* Weeks Taken */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Weeks Taken
                  </label>
                  <input
                    type="text"
                    value={getValue(['No.of weeks taken complete the course', 'No of weeks taken complete the course', 'weeksTaken'], topic) || (reportData.CourseCompletion?.[topic]?.weeksTaken) || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Also update CourseCompletion if it exists
                      if (reportData.CourseCompletion?.[topic]) {
                        if (value === '') {
                          delete reportData.CourseCompletion[topic].weeksTaken;
                        } else {
                          reportData.CourseCompletion[topic].weeksTaken = value;
                        }
                      }
                      setValue(['No.of weeks taken complete the course', 'No of weeks taken complete the course', 'weeksTaken'], topic, value);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter weeks"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };
  
  // Render Learning Report Tab
  const renderLearningReport = () => {
    if (!performanceData?.learningReport) {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-500 text-center py-8">No Learning Report data available</p>
        </div>
      );
    }

    const reportData = performanceData.learningReport.reportData;
    const skills = reportData.skills || [];
    
    // Helper function to find value by multiple possible field names (case-insensitive)
    const findValueByVariations = (obj, variations) => {
      if (!obj || typeof obj !== 'object') return null;
      
      // First try exact matches
      for (const variation of variations) {
        if (obj[variation] !== undefined && obj[variation] !== null && obj[variation] !== '') {
          return obj[variation];
        }
      }
      
      // Then try case-insensitive matches
      const lowerVariations = variations.map(v => v.toLowerCase().trim());
      for (const k in obj) {
        const lowerKey = k.toLowerCase().trim();
        if (lowerVariations.includes(lowerKey) && obj[k] !== null && obj[k] !== undefined && obj[k] !== '') {
          return obj[k];
        }
      }
      
      // Try partial matches (contains)
      for (const variation of variations) {
        const lowerVariation = variation.toLowerCase().trim();
        for (const k in obj) {
          const lowerKey = k.toLowerCase().trim();
          if (lowerKey.includes(lowerVariation) || lowerVariation.includes(lowerKey)) {
            if (obj[k] !== null && obj[k] !== undefined && obj[k] !== '') {
              return obj[k];
            }
          }
        }
      }
      
      return null;
    };
    
    // Extract data for each skill/topic - handle multiple field name variations
    const dailyQuizCounts = findValueByVariations(reportData, [
      'Daily Quiz counts', 'Daily Quiz Counts', 'Daily Quiz count', 
      'dailyQuizCounts', 'dailyQuizCount', 'daily quiz counts'
    ]) || {};
    
    const dailyQuizAttempts = findValueByVariations(reportData, [
      'Daily Quiz attempts count', 'Daily Quiz Attempts', 'Daily Quiz attempts',
      'Daily Quiz Attempts Count', 'dailyQuizAttempts', 'dailyQuizAttempt',
      'daily quiz attempts count', 'daily quiz attempts'
    ]) || {};
    
    const dailyQuizAvgScores = findValueByVariations(reportData, [
      'Daily Quiz score Average', 'Daily Quiz score Average in %', 
      'Daily Quiz avg scores', 'Daily Quiz Avg Scores', 'Daily Quiz Average',
      'dailyQuizAvgScores', 'dailyQuizAvgScore', 'dailyQuizAverage',
      'daily quiz score average', 'daily quiz average'
    ]) || {};
    
    const fortNightExamCounts = findValueByVariations(reportData, [
      'Fortnight Exam Counts',
      'Fort night exam counts', 'Fort Night Exam counts', 'Fort Night Exam Counts',
      'Fort Night Exam count', 'fortNightExamCounts', 'fortNightExamCount',
      'fort night exam counts', 'Fortnight Exam counts'
    ]) || {};
    
    const fortNightExamAttempts = findValueByVariations(reportData, [
      'Fortnight Exam Attempts Counts',
      'Fort night exam attempts counts', 'Fort Night Exam attempts',
      'Fort Night Exam Attempts', 'Fort Night Exam attempts count',
      'fortNightExamAttempts', 'fortNightExamAttempt', 'fort night exam attempts counts',
      'Fortnight Exam Attempts'
    ]) || {};
    
    const fortNightExamAvgScores = findValueByVariations(reportData, [
      'Fort night exam score Average(In Percentage)', 'Fort night exam score Average',
      'Fort Night Exam score Average in %', 'Fort Night Exam avg scores',
      'Fort Night Exam Avg Scores', 'Fort Night Exam Average',
      'fortNightExamAvgScores', 'fortNightExamAvgScore', 'fortNightExamAverage',
      'fort night exam score average', 'fort night exam average'
    ]) || {};
    
    const courseExamAttempts = findValueByVariations(reportData, [
      'Course Exam attempts', 'Course Exam Attempts', 'courseExamAttempts',
      'courseExamAttempt', 'course exam attempts'
    ]) || {};
    
    const courseExamScores = findValueByVariations(reportData, [
      'Course Exam score in %', 'Course Exam scores', 'Course Exam Scores',
      'Course Exam score', 'courseExamScores', 'courseExamScore',
      'course exam score', 'course exam scores'
    ]) || {};
    
    let weeksExpected = findValueByVariations(reportData, [
      'No.of weeks expected complete the course', 'No of weeks expected complete the course',
      'No.of weeks expected', 'weeksExpected', 'weeks_expected',
      'no of weeks expected', 'weeks expected'
    ]) || {};
    
    let weeksTaken = findValueByVariations(reportData, [
      'No.of weeks taken complete the course', 'No of weeks taken complete the course',
      'No.of weeks taken', 'weeksTaken', 'weeks_taken',
      'no of weeks taken', 'weeks taken'
    ]) || {};
    
    if (reportData.CourseCompletion && typeof reportData.CourseCompletion === 'object') {
      const courseCompletion = reportData.CourseCompletion;
      Object.keys(courseCompletion).forEach(courseName => {
        const courseData = courseCompletion[courseName];
        if (courseData && typeof courseData === 'object') {
          if (courseData.weeksExpected !== undefined && courseData.weeksExpected !== null && courseData.weeksExpected !== '') {
            if (!weeksExpected[courseName]) {
              weeksExpected[courseName] = courseData.weeksExpected;
            }
          }
          if (courseData.weeksTaken !== undefined && courseData.weeksTaken !== null && courseData.weeksTaken !== '') {
            if (!weeksTaken[courseName]) {
              weeksTaken[courseName] = courseData.weeksTaken;
            }
          }
        }
      });
    }
    
    const onlineDemoCounts = findValueByVariations(reportData, [
      'Online demo counts', 'Online Demo counts', 'Online Demo Counts',
      'onlineDemoCounts', 'onlineDemoCount', 'online demo counts'
    ]) || {};
    
    const onlineDemoRatings = findValueByVariations(reportData, [
      'Online demo ratings Average', 'Online Demo ratings Average',
      'Online Demo Ratings Average', 'onlineDemoRatings', 'onlineDemoRating',
      'online demo ratings average', 'online demo ratings'
    ]) || {};
    
    const offlineDemoCounts = findValueByVariations(reportData, [
      'Offline demo counts', 'Offline Demo counts', 'Offline Demo Counts',
      'offlineDemoCounts', 'offlineDemoCount', 'offline demo counts'
    ]) || {};
    
    const offlineDemoRatings = findValueByVariations(reportData, [
      'Offline demo ratings Average', 'Offline Demo ratings Average',
      'Offline Demo Ratings Average', 'offlineDemoRatings', 'offlineDemoRating',
      'offline demo ratings average', 'offline demo ratings'
    ]) || {};

    // Also check sub-sheet format
    if (reportData.DailyQuizReports) {
      const dailyQuizData = reportData.DailyQuizReports;
      Object.keys(dailyQuizData).forEach(topic => {
        if (dailyQuizData[topic] && typeof dailyQuizData[topic] === 'object') {
          const topicData = dailyQuizData[topic];
          const countValue = topicData['Daily Quiz counts'] || 
                           topicData['Daily Quiz Counts'] || 
                           topicData['daily quiz counts'] ||
                           topicData['Count'] ||
                           topicData['count'] ||
                           topicData['Daily Quiz count'];
          const attemptValue = topicData['Daily Quiz attempts count'] || 
                              topicData['Daily Quiz Attempts Count'] ||
                              topicData['Daily Quiz Attempts'] ||
                              topicData['Daily Quiz attempts'] ||
                              topicData['daily quiz attempts count'] ||
                              topicData['Attempts'] ||
                              topicData['attempts'] ||
                              topicData['Daily Quiz attempt count'];
          const scoreValue = topicData['Daily Quiz score Average'] ||
                           topicData['Daily Quiz score Average in %'] ||
                           topicData['Daily Quiz Average'] ||
                           topicData['daily quiz score average'] ||
                           topicData['Daily Quiz Average Score'] ||
                           topicData['Average Score'];
          
          if (countValue !== undefined && countValue !== null && countValue !== '') {
            if (!dailyQuizCounts[topic] || dailyQuizCounts[topic] === 0) {
              dailyQuizCounts[topic] = countValue;
            }
          }
          if (attemptValue !== undefined && attemptValue !== null && attemptValue !== '') {
            if (!dailyQuizAttempts[topic] || dailyQuizAttempts[topic] === 0) {
              dailyQuizAttempts[topic] = attemptValue;
            }
          }
          if (scoreValue !== undefined && scoreValue !== null && scoreValue !== '') {
            if (!dailyQuizAvgScores[topic]) {
              dailyQuizAvgScores[topic] = scoreValue;
            }
          }
        }
      });
    }
    
    if (reportData.FortnightScores) {
      const fortNightData = reportData.FortnightScores;
      Object.keys(fortNightData).forEach(topic => {
        if (fortNightData[topic] && typeof fortNightData[topic] === 'object') {
          const topicData = fortNightData[topic];
          const countValue = topicData['Fortnight Exam Counts'] ||
                           topicData['Fort night exam counts'] ||
                           topicData['Fort Night Exam counts'] ||
                           topicData['Fort Night Exam Counts'] ||
                           topicData['fortnight exam counts'] ||
                           topicData['fort night exam counts'] ||
                           topicData['Count'] ||
                           topicData['count'];
          const attemptValue = topicData['Fortnight Exam Attempts Counts'] ||
                              topicData['Fortnight Exam Attempts'] ||
                              topicData['Fort night exam attempts counts'] ||
                              topicData['Fort Night Exam attempts counts'] ||
                              topicData['Fort Night Exam Attempts'] ||
                              topicData['Fort Night Exam attempts'] ||
                              topicData['fortnight exam attempts counts'] ||
                              topicData['fort night exam attempts counts'] ||
                              topicData['Attempts'] ||
                              topicData['attempts'] ||
                              topicData['Attempts Counts'];
          const scoreValue = topicData['Fort night exam score Average (In Percentage)'] ||
                           topicData['Fort night exam score Average(In Percentage)'] ||
                           topicData['Fort night exam score Average'] ||
                           topicData['Fort Night Exam score Average in %'] ||
                           topicData['Fort Night Exam Average'] ||
                           topicData['fort night exam score average'] ||
                           topicData['Fortnight Exam Score Average'] ||
                           topicData['Average Score'];
          
          if (countValue !== undefined && countValue !== null && countValue !== '') {
            if (!fortNightExamCounts[topic] || fortNightExamCounts[topic] === 0 || fortNightExamCounts[topic] === '') {
              fortNightExamCounts[topic] = countValue;
            }
          }
          if (attemptValue !== undefined && attemptValue !== null && attemptValue !== '') {
            if (!fortNightExamAttempts[topic] || fortNightExamAttempts[topic] === 0 || fortNightExamAttempts[topic] === '') {
              fortNightExamAttempts[topic] = attemptValue;
            }
          }
          if (scoreValue !== undefined && scoreValue !== null && scoreValue !== '') {
            if (!fortNightExamAvgScores[topic]) {
              fortNightExamAvgScores[topic] = scoreValue;
            }
          }
        }
      });
    }
    
    if (reportData.CourseExamScores) {
      const courseExamData = reportData.CourseExamScores;
      Object.keys(courseExamData).forEach(topic => {
        if (courseExamData[topic] && typeof courseExamData[topic] === 'object') {
          const topicData = courseExamData[topic];
          const attemptValue = topicData['Course exam attempts'] ||
                              topicData['Course Exam attempts'] ||
                              topicData['Course Exam Attempts'] ||
                              topicData['course exam attempts'] ||
                              topicData['Attempts'] ||
                              topicData['attempts'] ||
                              topicData['Course Exam attempt'];
          const scoreValue = topicData['Course exam score'] ||
                           topicData['Course Exam score'] ||
                           topicData['Course Exam score in %'] ||
                           topicData['Course Exam Scores'] ||
                           topicData['Course Exam Score'] ||
                           topicData['course exam score'] ||
                           topicData['Score'] ||
                           topicData['score'] ||
                           topicData['Course Exam Score (%)'];
          
          if (attemptValue !== undefined && attemptValue !== null && attemptValue !== '') {
            if (!courseExamAttempts[topic] || courseExamAttempts[topic] === 0) {
              courseExamAttempts[topic] = attemptValue;
            }
          }
          if (scoreValue !== undefined && scoreValue !== null && scoreValue !== '') {
            if (!courseExamScores[topic]) {
              courseExamScores[topic] = scoreValue;
            }
          }
        }
      });
    }
    
    // Get all unique topics from all data sources
    const allTopics = new Set([
      ...skills,
      ...Object.keys(dailyQuizCounts),
      ...Object.keys(dailyQuizAttempts),
      ...Object.keys(dailyQuizAvgScores),
      ...Object.keys(fortNightExamCounts),
      ...Object.keys(fortNightExamAttempts),
      ...Object.keys(fortNightExamAvgScores),
      ...Object.keys(courseExamAttempts),
      ...Object.keys(courseExamScores),
      ...(reportData.CourseCompletion ? Object.keys(reportData.CourseCompletion) : [])
    ]);

    // Helper to get course status from CourseCompletion
    const getCourseStatus = (courseName) => {
      if (!reportData.CourseCompletion || typeof reportData.CourseCompletion !== 'object') {
        return null;
      }
      const courseData = reportData.CourseCompletion[courseName];
      if (!courseData || typeof courseData !== 'object') {
        return null;
      }
      const status = courseData.status || courseData.Status;
      if (!status || typeof status !== 'string') {
        return null;
      }
      const statusLower = status.toLowerCase().trim();
      if (statusLower === 'completed' || statusLower === 'done' || statusLower === 'finished') {
        return 'Completed';
      }
      if (statusLower === 'in progress' || statusLower === 'inprogress' || 
          statusLower === 'ongoing' || statusLower === 'working' || 
          statusLower === 'currently doing' || statusLower.includes('progress')) {
        return 'In Progress';
      }
      return null;
    };

    // Filter and sort topics by status
    const topicsWithStatus = Array.from(allTopics).map(topic => ({
      name: topic,
      status: getCourseStatus(topic)
    }));

    const filteredTopics = topicsWithStatus.filter(topic => 
      topic.status === 'Completed' || topic.status === 'In Progress'
    );

    const sortedTopics = filteredTopics.sort((a, b) => {
      if (a.status === 'Completed' && b.status === 'In Progress') return -1;
      if (a.status === 'In Progress' && b.status === 'Completed') return 1;
      return a.name.localeCompare(b.name);
    });

    // If no filtered topics, use all topics (sorted alphabetically)
    const topicsToDisplay = sortedTopics.length > 0 ? sortedTopics : topicsWithStatus.sort((a, b) => a.name.localeCompare(b.name));

    const topicsArray = topicsToDisplay.map(t => t.name);

    // Helper functions
    const getValue = (obj, key) => {
      if (!obj || typeof obj !== 'object') return null;
      if (obj[key] !== undefined && obj[key] !== null) return obj[key];
      const lowerKey = key.toLowerCase().trim();
      for (const k in obj) {
        if (k.toLowerCase().trim() === lowerKey && obj[k] !== null && obj[k] !== undefined) {
          return obj[k];
        }
      }
      return null;
    };

    const formatScore = (value) => {
      if (value === null || value === undefined || value === '') return 'N/A';
      if (typeof value === 'number') return value;
      const numValue = Number(value);
      return isNaN(numValue) ? 'N/A' : numValue;
    };

    const getNumericValue = (obj, key) => {
      const val = getValue(obj, key);
      if (val === null || val === undefined || val === '') return 0;
      
      if (typeof val === 'string') {
        const lowerVal = val.toLowerCase().trim();
        if (lowerVal === 'not attempted' || 
            lowerVal === 'notattempted' ||
            lowerVal === 'n/a' ||
            lowerVal === 'na' ||
            lowerVal === '-' ||
            lowerVal === '--') {
          return 0;
        }
      }
      
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    };

    const getScoreValue = (obj, key) => {
      const val = getValue(obj, key);
      if (val === null || val === undefined || val === '') return null;
      
      if (typeof val === 'string') {
        const lowerVal = val.toLowerCase().trim();
        if (lowerVal === 'not attempted' || 
            lowerVal === 'notattempted' ||
            lowerVal === 'rating didn\'t given' || 
            lowerVal === 'rating not given' ||
            lowerVal === 'yet to give demo' ||
            lowerVal === 'yettogivedemo' ||
            lowerVal === 'n/a' ||
            lowerVal === 'na' ||
            lowerVal === 'null' ||
            lowerVal === 'undefined' ||
            lowerVal === '-' ||
            lowerVal === '--' ||
            lowerVal === 'tbd' ||
            lowerVal === 'pending') {
          return null;
        }
      }
      
      const num = Number(val);
      if (isNaN(num)) {
        if (typeof val === 'string') {
          const numMatch = val.match(/[\d.]+/);
          if (numMatch) {
            const extractedNum = Number(numMatch[0]);
            return isNaN(extractedNum) ? null : extractedNum;
          }
        }
        return null;
      }
      return num;
    };

    const getScoreColor = (score, type = 'avg') => {
      if (!score || score === 0) return 'text-gray-500';
      if (type === 'course') return 'text-blue-600';
      if (score >= 80) return 'text-green-600';
      if (score >= 60) return 'text-yellow-600';
      return 'text-red-600';
    };

    const getStatus = (avgScore) => {
      if (!avgScore || avgScore === 0) return { label: 'No Data', color: 'bg-gray-100 text-gray-600' };
      if (avgScore >= 80) return { label: 'Excellent', color: 'bg-blue-100 text-blue-700' };
      if (avgScore >= 60) return { label: 'Good', color: 'bg-yellow-100 text-yellow-700' };
      return { label: 'Needs Improvement', color: 'bg-gray-100 text-gray-600' };
    };

    // Helper to find matching topic key with case-insensitive and partial matching
    const findMatchingTopicKey = (obj, topic) => {
      if (!obj || typeof obj !== 'object') return null;
      
      if (obj[topic] !== undefined) return topic;
      
      const lowerTopic = topic.toLowerCase().trim();
      for (const key in obj) {
        if (key.toLowerCase().trim() === lowerTopic) {
          return key;
        }
      }
      
      for (const key in obj) {
        const lowerKey = key.toLowerCase().trim();
        if (lowerKey.includes(lowerTopic) || lowerTopic.includes(lowerKey)) {
          return key;
        }
      }
      
      return null;
    };

    // Get selected course data
    const getSelectedCourseData = () => {
      if (!selectedCourse) return null;

      const topicKey = selectedCourse;
      
      const dailyQuizCountKey = findMatchingTopicKey(dailyQuizCounts, topicKey) || topicKey;
      const dailyQuizAttemptKey = findMatchingTopicKey(dailyQuizAttempts, topicKey) || topicKey;
      const dailyQuizScoreKey = findMatchingTopicKey(dailyQuizAvgScores, topicKey) || topicKey;
      const fortNightCountKey = findMatchingTopicKey(fortNightExamCounts, topicKey) || topicKey;
      const fortNightAttemptKey = findMatchingTopicKey(fortNightExamAttempts, topicKey) || topicKey;
      const fortNightScoreKey = findMatchingTopicKey(fortNightExamAvgScores, topicKey) || topicKey;
      const courseAttemptKey = findMatchingTopicKey(courseExamAttempts, topicKey) || topicKey;
      const courseScoreKey = findMatchingTopicKey(courseExamScores, topicKey) || topicKey;
      const weeksExpectedKey = findMatchingTopicKey(weeksExpected, topicKey) || topicKey;
      const weeksTakenKey = findMatchingTopicKey(weeksTaken, topicKey) || topicKey;
      const onlineDemoCountKey = findMatchingTopicKey(onlineDemoCounts, topicKey) || topicKey;
      const onlineDemoRatingKey = findMatchingTopicKey(onlineDemoRatings, topicKey) || topicKey;
      const offlineDemoCountKey = findMatchingTopicKey(offlineDemoCounts, topicKey) || topicKey;
      const offlineDemoRatingKey = findMatchingTopicKey(offlineDemoRatings, topicKey) || topicKey;
      
      const dailyQuizCount = getNumericValue(dailyQuizCounts, dailyQuizCountKey) || 0;
      const dailyQuizAttempt = getNumericValue(dailyQuizAttempts, dailyQuizAttemptKey) || 0;
      const dailyQuizAvgScore = getScoreValue(dailyQuizAvgScores, dailyQuizScoreKey);
      
      const getRawValue = (obj, key) => {
        if (!obj || typeof obj !== 'object') return null;
        if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
          return obj[key];
        }
        const lowerKey = key.toLowerCase().trim();
        for (const k in obj) {
          if (k.toLowerCase().trim() === lowerKey && obj[k] !== null && obj[k] !== undefined && obj[k] !== '') {
            return obj[k];
          }
        }
        return null;
      };
      
      let fortNightCount = getRawValue(fortNightExamCounts, topicKey);
      if (fortNightCount === null) {
        fortNightCount = getRawValue(fortNightExamCounts, fortNightCountKey);
      }
      if (fortNightCount === null || fortNightCount === '') {
        fortNightCount = 0;
      } else if (typeof fortNightCount === 'string') {
        // Keep string values as-is
      } else {
        fortNightCount = Number(fortNightCount) || 0;
      }
      
      let fortNightAttempt = getRawValue(fortNightExamAttempts, topicKey);
      if (fortNightAttempt === null) {
        fortNightAttempt = getRawValue(fortNightExamAttempts, fortNightAttemptKey);
      }
      if (fortNightAttempt === null || fortNightAttempt === '') {
        fortNightAttempt = 0;
      } else if (typeof fortNightAttempt === 'string') {
        // Keep string values as-is
      } else {
        fortNightAttempt = Number(fortNightAttempt) || 0;
      }
      
      const fortNightAvgScore = getScoreValue(fortNightExamAvgScores, fortNightScoreKey);
      
      const courseAttempt = getNumericValue(courseExamAttempts, courseAttemptKey) || 0;
      const courseScore = getScoreValue(courseExamScores, courseScoreKey);

      let weeksExpectedValue = getValue(weeksExpected, weeksExpectedKey);
      let weeksTakenValue = getValue(weeksTaken, weeksTakenKey);
      
      if ((!weeksExpectedValue || weeksExpectedValue === '') && reportData.CourseCompletion) {
        const courseCompletion = reportData.CourseCompletion[weeksExpectedKey] || reportData.CourseCompletion[topicKey];
        if (courseCompletion && typeof courseCompletion === 'object') {
          weeksExpectedValue = courseCompletion.weeksExpected || weeksExpectedValue;
          weeksTakenValue = courseCompletion.weeksTaken || weeksTakenValue;
        }
      }

      const onlineDemoCount = getNumericValue(onlineDemoCounts, onlineDemoCountKey) || 0;
      const onlineDemoRating = getScoreValue(onlineDemoRatings, onlineDemoRatingKey);
      const offlineDemoCount = getNumericValue(offlineDemoCounts, offlineDemoCountKey) || 0;
      const offlineDemoRating = getScoreValue(offlineDemoRatings, offlineDemoRatingKey);

      const formatDisplayValue = (value) => {
        if (value === null || value === undefined || value === '') return 0;
        if (typeof value === 'string') {
          return value;
        }
        return Number(value) || 0;
      };
      
      return {
        topic: selectedCourse,
        dailyQuiz: { count: dailyQuizCount, attempt: dailyQuizAttempt, score: dailyQuizAvgScore },
        fortNight: { 
          count: formatDisplayValue(fortNightCount), 
          attempt: formatDisplayValue(fortNightAttempt), 
          score: fortNightAvgScore 
        },
        course: { attempt: courseAttempt, score: courseScore },
        weeksExpected: weeksExpectedValue,
        weeksTaken: weeksTakenValue,
        onlineDemo: { count: onlineDemoCount, rating: onlineDemoRating },
        offlineDemo: { count: offlineDemoCount, rating: offlineDemoRating }
      };
    };

    const selectedCourseData = getSelectedCourseData();

    return (
      <div>
        {/* Course Dropdown */}
        {topicsToDisplay.length > 0 && (
          <div className="mb-1.5">
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Select Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {topicsToDisplay.map((topicObj) => (
                <option key={topicObj.name} value={topicObj.name}>
                  {topicObj.name} {topicObj.status ? `(${topicObj.status})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Selected Course Display */}
        {selectedCourseData ? (
          <div className="bg-slate-50 border border-gray-200 rounded-lg p-1.5">
            {/* Header */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1">
                <h4 className="text-xs font-semibold text-gray-900">{selectedCourseData.topic}</h4>
                {(() => {
                  const courseStatus = getCourseStatus(selectedCourseData.topic);
                  if (courseStatus) {
                    const statusColor = courseStatus === 'Completed' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-blue-100 text-blue-700';
                    return (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                        {courseStatus}
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatus(selectedCourseData.fortNight.score).color}`}>
                {getStatus(selectedCourseData.fortNight.score).label}
              </span>
            </div>

            {/* Compact Grid Layout */}
            <div className="grid grid-cols-2 gap-1.5">
              {/* Course Completion */}
              <div className="bg-white rounded-lg p-1.5 border border-gray-200">
                <h5 className="text-xs font-semibold text-gray-700 mb-1">COURSE COMPLETION</h5>
                <div className="space-y-1">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Weeks Expected</p>
                    <p className="text-xs font-semibold text-gray-900">
                      {selectedCourseData.weeksExpected !== null && selectedCourseData.weeksExpected !== undefined && selectedCourseData.weeksExpected !== '' 
                        ? selectedCourseData.weeksExpected 
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Weeks Taken</p>
                    <p className="text-xs font-semibold text-gray-900">
                      {selectedCourseData.weeksTaken !== null && selectedCourseData.weeksTaken !== undefined && selectedCourseData.weeksTaken !== '' 
                        ? selectedCourseData.weeksTaken 
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Daily Quiz */}
              <div className="bg-white rounded-lg p-1.5 border border-gray-200">
                <h5 className="text-xs font-semibold text-gray-700 mb-1">DAILY QUIZ</h5>
                <div className="grid grid-cols-3 gap-1">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Count</p>
                    <p className="text-xs font-semibold text-gray-900">{selectedCourseData.dailyQuiz.count}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Attempts</p>
                    <p className="text-xs font-semibold text-gray-900">{selectedCourseData.dailyQuiz.attempt}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Avg Score</p>
                    <p className={`text-xs font-semibold ${getScoreColor(selectedCourseData.dailyQuiz.score)}`}>
                      {formatScore(selectedCourseData.dailyQuiz.score) === 'N/A' ? 'N/A' : `${Math.round(formatScore(selectedCourseData.dailyQuiz.score))}%`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Fort Night Exam */}
              <div className="bg-white rounded-lg p-1.5 border border-gray-200">
                <h5 className="text-xs font-semibold text-gray-700 mb-1">FORT NIGHT EXAM</h5>
                <div className="grid grid-cols-3 gap-1">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Count</p>
                    <p className="text-xs font-semibold text-gray-900">
                      {typeof selectedCourseData.fortNight.count === 'string' 
                        ? selectedCourseData.fortNight.count 
                        : selectedCourseData.fortNight.count}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Attempts</p>
                    <p className="text-xs font-semibold text-gray-900">
                      {typeof selectedCourseData.fortNight.attempt === 'string' 
                        ? selectedCourseData.fortNight.attempt 
                        : selectedCourseData.fortNight.attempt}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Avg Score</p>
                    <p className={`text-xs font-semibold ${getScoreColor(selectedCourseData.fortNight.score)}`}>
                      {formatScore(selectedCourseData.fortNight.score) === 'N/A' ? 'N/A' : `${Math.round(formatScore(selectedCourseData.fortNight.score))}%`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Course Exam */}
              <div className="bg-white rounded-lg p-1.5 border border-gray-200">
                <h5 className="text-xs font-semibold text-gray-700 mb-1">COURSE EXAM</h5>
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Attempts</p>
                    <p className="text-xs font-semibold text-gray-900">{selectedCourseData.course.attempt}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Score</p>
                    <p className={`text-xs font-semibold ${getScoreColor(selectedCourseData.course.score, 'course')}`}>
                      {formatScore(selectedCourseData.course.score) === 'N/A' ? 'N/A' : `${Math.round(formatScore(selectedCourseData.course.score))}%`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Online Demo */}
              <div className="bg-white rounded-lg p-1.5 border border-gray-200">
                <h5 className="text-xs font-semibold text-gray-700 mb-1">ONLINE DEMO</h5>
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Count</p>
                    <p className="text-xs font-semibold text-gray-900">{selectedCourseData.onlineDemo.count}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Rating Avg</p>
                    <p className={`text-xs font-semibold ${getScoreColor(selectedCourseData.onlineDemo.rating)}`}>
                      {formatScore(selectedCourseData.onlineDemo.rating) === 'N/A' ? 'N/A' : `${Math.round(formatScore(selectedCourseData.onlineDemo.rating))}%`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Offline Demo */}
              <div className="bg-white rounded-lg p-1.5 border border-gray-200">
                <h5 className="text-xs font-semibold text-gray-700 mb-1">OFFLINE DEMO</h5>
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Count</p>
                    <p className="text-xs font-semibold text-gray-900">{selectedCourseData.offlineDemo.count}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Rating Avg</p>
                    <p className={`text-xs font-semibold ${getScoreColor(selectedCourseData.offlineDemo.rating)}`}>
                      {formatScore(selectedCourseData.offlineDemo.rating) === 'N/A' ? 'N/A' : `${Math.round(formatScore(selectedCourseData.offlineDemo.rating))}%`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : allTopics.size === 0 ? (
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify(reportData, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Please select a course from the dropdown</p>
          </div>
        )}
      </div>
    );
  };
  
  // Render Attendance Report Edit Form
  const renderAttendanceReportEditForm = () => {
    if (!editableAttendanceReport) return null;

    const reportData = editableAttendanceReport;
    
    // Helper to find field by variations
    const findField = (variations) => {
      for (const variation of variations) {
        if (reportData[variation] !== undefined) {
          return variation;
        }
      }
      const lowerVariations = variations.map(v => v.toLowerCase().trim());
      for (const key in reportData) {
        if (lowerVariations.includes(key.toLowerCase().trim())) {
          return key;
        }
      }
      return variations[0];
    };

    // Helper to get value
    const getValue = (fieldVariations, month) => {
      const fieldName = findField(fieldVariations);
      const field = reportData[fieldName];
      if (field && typeof field === 'object' && field[month] !== undefined) {
        const val = field[month];
        return val === null || val === undefined ? '' : val;
      }
      return '';
    };

    // Helper to set value
    const setValue = (fieldVariations, month, value) => {
      const fieldName = findField(fieldVariations);
      if (!reportData[fieldName]) {
        reportData[fieldName] = {};
      }
      if (value === '' || value === null || value === undefined) {
        delete reportData[fieldName][month];
        if (Object.keys(reportData[fieldName]).length === 0) {
          delete reportData[fieldName];
        }
      } else {
        reportData[fieldName][month] = value;
      }
      setEditableAttendanceReport({ ...reportData });
    };

    // Get all months from data
    const getAllMonths = () => {
      const months = new Set();
      Object.keys(reportData).forEach(fieldName => {
        const field = reportData[fieldName];
        if (field && typeof field === 'object') {
          Object.keys(field).forEach(month => {
            if (month && month.trim() !== '') {
              months.add(month);
            }
          });
        }
      });
      
      // If no months found, use standard months
      if (months.size === 0) {
        return [
          "JAN'25", "FEB'25", "MAR'25", "APR'25", "MAY'25", "JUN'25",
          "JULY'25", "AUG'25", "SEP'25", "OCT'25", "NOV'25", "DEC'25"
        ];
      }
      
      // Sort months
      const monthOrder = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JULY', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      return Array.from(months).sort((a, b) => {
        const getMonthIndex = (str) => {
          const month = str.split("'")[0] || str.split(" ")[0] || str;
          return monthOrder.findIndex(m => month.toUpperCase().includes(m));
        };
        return getMonthIndex(a) - getMonthIndex(b);
      });
    };

    const months = getAllMonths();

    return (
      <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2">
        {months.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No attendance data found. Add a month to get started.</p>
          </div>
        ) : (
          months.map((month, index) => (
            <div key={index} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h3 className="text-base font-semibold text-slate-900 mb-4">{month}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Total Working Days */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Total Working Days
                  </label>
                  <input
                    type="number"
                    value={getValue(['Total Working Days', 'total working days', 'Total working days', 'totalWorkingDays', 'workingDays'], month)}
                    onChange={(e) => setValue(['Total Working Days', 'total working days', 'Total working days', 'totalWorkingDays', 'workingDays'], month, e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter working days"
                  />
                </div>

                {/* Days Attended */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Days Attended
                  </label>
                  <input
                    type="number"
                    value={getValue(['No of days attended', 'No Of Days Attended', 'No of Days Attended', 'daysAttended', 'noOfDaysAttended', 'Days Attended'], month)}
                    onChange={(e) => setValue(['No of days attended', 'No Of Days Attended', 'No of Days Attended', 'daysAttended', 'noOfDaysAttended', 'Days Attended'], month, e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter days attended"
                  />
                </div>

                {/* Leaves Taken */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Leaves Taken
                  </label>
                  <input
                    type="number"
                    value={getValue(['No of leaves taken', 'No Of Leaves Taken', 'No of Leaves Taken', 'leavesTaken', 'noOfLeavesTaken', 'Leaves Taken'], month)}
                    onChange={(e) => setValue(['No of leaves taken', 'No Of Leaves Taken', 'No of Leaves Taken', 'leavesTaken', 'noOfLeavesTaken', 'Leaves Taken'], month, e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter leaves taken"
                  />
                </div>

                {/* Monthly Percentage */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Monthly Percentage (%)
                  </label>
                  <input
                    type="number"
                    value={getValue(['Montly Percentage', 'Monthly Percentage', 'montlyPercentage', 'monthlyPercentage', 'Monthly percentage', 'Montly percentage'], month)}
                    onChange={(e) => setValue(['Montly Percentage', 'Monthly Percentage', 'montlyPercentage', 'monthlyPercentage', 'Monthly percentage', 'Montly percentage'], month, e.target.value ? parseFloat(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter percentage"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  // Render Grooming Report Edit Form
  const renderGroomingReportEditForm = () => {
    if (!editableGroomingReport) return null;

    const reportData = editableGroomingReport;
    
    // Helper to find field by variations
    const findField = (variations) => {
      for (const variation of variations) {
        if (reportData[variation] !== undefined) {
          return variation;
        }
      }
      const lowerVariations = variations.map(v => v.toLowerCase().trim());
      for (const key in reportData) {
        if (lowerVariations.includes(key.toLowerCase().trim())) {
          return key;
        }
      }
      return variations[0];
    };

    // Helper to get value
    const getValue = (fieldVariations, month) => {
      const fieldName = findField(fieldVariations);
      const field = reportData[fieldName];
      if (field && typeof field === 'object' && field[month] !== undefined) {
        const val = field[month];
        return val === null || val === undefined ? '' : val;
      }
      return '';
    };

    // Helper to set value
    const setValue = (fieldVariations, month, value) => {
      const fieldName = findField(fieldVariations);
      if (!reportData[fieldName]) {
        reportData[fieldName] = {};
      }
      if (value === '' || value === null || value === undefined) {
        delete reportData[fieldName][month];
        if (Object.keys(reportData[fieldName]).length === 0) {
          delete reportData[fieldName];
        }
      } else {
        reportData[fieldName][month] = value;
      }
      setEditableGroomingReport({ ...reportData });
    };

    // Get all months from data
    const getAllMonths = () => {
      const months = new Set();
      Object.keys(reportData).forEach(fieldName => {
        const field = reportData[fieldName];
        if (field && typeof field === 'object') {
          Object.keys(field).forEach(month => {
            if (month && month.trim() !== '') {
              months.add(month);
            }
          });
        }
      });
      
      // If no months found, use standard months
      if (months.size === 0) {
        return [
          "JAN'25", "FEB'25", "MAR'25", "APR'25", "MAY'25", "JUN'25",
          "JULY'25", "AUG'25", "SEP'25", "OCT'25", "NOV'25", "DEC'25"
        ];
      }
      
      // Sort months
      const monthOrder = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JULY', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      return Array.from(months).sort((a, b) => {
        const getMonthIndex = (str) => {
          const month = str.split("'")[0] || str.split(" ")[0] || str;
          return monthOrder.findIndex(m => month.toUpperCase().includes(m));
        };
        return getMonthIndex(a) - getMonthIndex(b);
      });
    };

    const months = getAllMonths();

    return (
      <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2">
        {months.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No grooming data found. Add a month to get started.</p>
          </div>
        ) : (
          months.map((month, index) => (
            <div key={index} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h3 className="text-base font-semibold text-slate-900 mb-4">{month}</h3>
              
              <div>
                {/* Grooming Status */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Grooming Status
                  </label>
                  <input
                    type="text"
                    value={getValue(['How many times missed grooming check list', 'How Many Times Missed Grooming Check List', 'missedGrooming', 'howManyTimesMissedGroomingCheckList'], month)}
                    onChange={(e) => setValue(['How many times missed grooming check list', 'How Many Times Missed Grooming Check List', 'missedGrooming', 'howManyTimesMissedGroomingCheckList'], month, e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter status (e.g., 'Dresscode Followed' or number of times missed)"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Enter "Dresscode Followed" if followed, or a number indicating times missed
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };
  
  // Render Attendance Report Tab
  const renderAttendanceReport = () => {
    if (!performanceData?.attendanceReport) {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-500 text-center py-8">No Attendance Report data available</p>
        </div>
      );
    }

    const reportData = performanceData.attendanceReport.reportData;

    const findAttendanceValue = (obj, variations) => {
      if (!obj || typeof obj !== 'object') return null;
      
      for (const variation of variations) {
        if (obj[variation] !== undefined && obj[variation] !== null) {
          return obj[variation];
        }
      }
      
      const lowerVariations = variations.map(v => v.toLowerCase().trim());
      for (const key in obj) {
        const lowerKey = key.toLowerCase().trim();
        if (lowerVariations.includes(lowerKey) && obj[key] !== null && obj[key] !== undefined) {
          return obj[key];
        }
      }
      
      for (const variation of variations) {
        const lowerVariation = variation.toLowerCase().trim();
        for (const key in obj) {
          const lowerKey = key.toLowerCase().trim();
          if (lowerKey.includes(lowerVariation) || lowerVariation.includes(lowerKey)) {
            if (obj[key] !== null && obj[key] !== undefined) {
              return obj[key];
            }
          }
        }
      }
      
      return null;
    };

    const totalWorkingDays = findAttendanceValue(reportData, [
      'Total Working Days',
      'total working days',
      'Total working days',
      'totalWorkingDays',
      'workingDays',
      'Working Days'
    ]) || {};
    
    const daysAttended = findAttendanceValue(reportData, [
      'No of days attended',
      'No Of Days Attended',
      'No of Days Attended',
      'daysAttended',
      'noOfDaysAttended',
      'Days Attended'
    ]) || {};
    
    const leavesTaken = findAttendanceValue(reportData, [
      'No of leaves taken',
      'No Of Leaves Taken',
      'No of Leaves Taken',
      'leavesTaken',
      'noOfLeavesTaken',
      'Leaves Taken'
    ]) || {};
    
    const monthlyPercentage = findAttendanceValue(reportData, [
      'Montly Percentage',
      'Monthly Percentage',
      'montlyPercentage',
      'monthlyPercentage',
      'Monthly percentage',
      'Montly percentage'
    ]) || {};
    
    const monthNumberToName = {
      '1': "JAN'25", '2': "FEB'25", '3': "MAR'25", '4': "APR'25",
      '5': "MAY'25", '6': "JUN'25", '7': "JULY'25", '8': "AUG'25",
      '9': "SEP'25", '10': "OCT'25", '11': "NOV'25", '12': "DEC'25"
    };
    
    const monthNameToNumber = {
      "JAN'25": '1', "FEB'25": '2', "MAR'25": '3', "APR'25": '4',
      "MAY'25": '5', "JUN'25": '6', "JULY'25": '7', "AUG'25": '8',
      "SEP'25": '9', "OCT'25": '10', "NOV'25": '11', "DEC'25": '12'
    };
    
    const allMonthKeys = new Set([
      ...Object.keys(totalWorkingDays),
      ...Object.keys(daysAttended),
      ...Object.keys(leavesTaken),
      ...Object.keys(monthlyPercentage)
    ]);
    
    const allMonths = new Set();
    allMonthKeys.forEach(key => {
      if (monthNumberToName[key]) {
        allMonths.add(monthNumberToName[key]);
      } else if (monthNameToNumber[key]) {
        allMonths.add(key);
      } else {
        allMonths.add(key);
      }
    });

    const getNumericValue = (obj, monthName) => {
      if (!obj || typeof obj !== 'object') return 0;
      
      let val = obj[monthName];
      
      if ((val === undefined || val === null) && monthNameToNumber[monthName]) {
        const monthNum = monthNameToNumber[monthName];
        val = obj[monthNum];
      }
      
      if (val === undefined || val === null) {
        const lowerKey = String(monthName).toLowerCase().trim();
        for (const k in obj) {
          if (String(k).toLowerCase().trim() === lowerKey) {
            val = obj[k];
            break;
          }
        }
      }
      
      if (val === null || val === undefined || val === '') return 0;
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    };

    const getPercentage = (obj, monthName) => {
      if (!obj || typeof obj !== 'object') return null;
      
      let val = obj[monthName];
      
      if ((val === undefined || val === null) && monthNameToNumber[monthName]) {
        const monthNum = monthNameToNumber[monthName];
        val = obj[monthNum];
      }
      
      if (val === undefined || val === null) {
        const lowerKey = String(monthName).toLowerCase().trim();
        for (const k in obj) {
          if (String(k).toLowerCase().trim() === lowerKey) {
            val = obj[k];
            break;
          }
        }
      }
      
      if (val === null || val === undefined || val === '') return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    };

    const getAttendanceStatus = (percentage) => {
      if (percentage === null || percentage === undefined) {
        return { color: 'bg-gray-50 border-gray-200', icon: null, iconColor: '' };
      }
      if (percentage >= 90) {
        return { 
          color: 'bg-green-50 border-green-200', 
          icon: LuCheck, 
          iconColor: 'text-green-600' 
        };
      } else if (percentage >= 70) {
        return { 
          color: 'bg-orange-50 border-orange-200', 
          icon: LuInfo, 
          iconColor: 'text-orange-600' 
        };
      } else {
        return { 
          color: 'bg-red-50 border-red-200', 
          icon: LuX, 
          iconColor: 'text-red-600' 
        };
      }
    };

    const getPercentageColor = (percentage) => {
      if (percentage === null || percentage === undefined) return 'text-gray-500';
      if (percentage >= 90) return 'text-green-600';
      if (percentage >= 70) return 'text-orange-600';
      return 'text-red-600';
    };

    const sortedMonths = Array.from(allMonths).sort((a, b) => {
      const monthOrder = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JULY', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const getMonthIndex = (str) => {
        const month = str.split("'")[0];
        return monthOrder.indexOf(month);
      };
      return getMonthIndex(a) - getMonthIndex(b);
    });

    return (
      <div>

        {sortedMonths.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {sortedMonths.map((month, index) => {
              const workingDays = getNumericValue(totalWorkingDays, month);
              const attended = getNumericValue(daysAttended, month);
              const leaves = getNumericValue(leavesTaken, month);
              const percentage = getPercentage(monthlyPercentage, month) ?? 
                (workingDays > 0 ? Math.round((attended / workingDays) * 100) : null);
              
              const status = getAttendanceStatus(percentage);
              const StatusIcon = status.icon;

              return (
                <div
                  key={index}
                  className={`${status.color} border-2 rounded-lg p-3 relative transition-shadow hover:shadow-md`}
                >
                  {StatusIcon && (
                    <div className={`absolute top-2 right-2 ${status.iconColor}`}>
                      <StatusIcon className="w-4 h-4" />
                    </div>
                  )}

                  <h4 className="text-sm font-bold text-gray-900 mb-2">{month}</h4>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <p className="text-xs text-gray-600 mb-0.5">Working Days</p>
                      <p className="text-sm font-semibold text-gray-900">{workingDays}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-0.5">Attended</p>
                      <p className="text-sm font-semibold text-gray-900">{attended}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-0.5">Leaves</p>
                      <p className="text-sm font-semibold text-gray-900">{leaves}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-0.5">Attendance</p>
                      <p className={`text-sm font-semibold ${getPercentageColor(percentage)}`}>
                        {percentage !== null ? `${Math.round(percentage)}%` : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {percentage !== null && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            percentage >= 90
                              ? 'bg-green-500'
                              : percentage >= 70
                              ? 'bg-orange-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No attendance data available
          </div>
        )}
      </div>
    );
  };
  
  // Render Grooming Report Tab
  const renderGroomingReport = () => {
    if (!performanceData?.groomingReport) {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-500 text-center py-8">No Grooming Report data available</p>
        </div>
      );
    }

    const reportData = performanceData.groomingReport.reportData;

    const missedGrooming = reportData['How many times missed grooming check list'] || 
                          reportData['How Many Times Missed Grooming Check List'] || 
                          reportData.missedGrooming || 
                          reportData.howManyTimesMissedGroomingCheckList || {};

    const getMissedCount = (month) => {
      if (!missedGrooming || typeof missedGrooming !== 'object') return 0;
      const val = missedGrooming[month];
      if (val === null || val === undefined || val === '') return 0;
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    };

    const allMonths = [
      "JAN'25", "FEB'25", "MAR'25", "APR'25", "MAY'25", "JUN'25",
      "JULY'25", "AUG'25", "SEP'25", "OCT'25", "NOV'25", "DEC'25"
    ];

    return (
      <div>


        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 gap-2">
          {allMonths.map((month, index) => {
            const missedCount = getMissedCount(month);
            const isGood = missedCount === 0;
            
            return (
              <div
                key={index}
                className={`${
                  isGood 
                    ? 'bg-green-50 border-2 border-green-200' 
                    : 'bg-red-50 border-2 border-red-200'
                } rounded-lg p-2.5 relative transition-shadow hover:shadow-md`}
              >
                <div className={`absolute top-1.5 right-1.5 ${
                  isGood ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isGood ? (
                    <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                      <LuCheck className="w-2.5 h-2.5 text-white" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
                      <LuX className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>

                <h4 className="text-xs font-bold text-gray-900 mb-1.5">{month}</h4>

                <div>
                  <p className="text-xs text-gray-600 mb-0.5">Missed</p>
                  <p className="text-lg font-semibold text-gray-900">{missedCount}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Render Interactions Report Tab
  const renderInteractionsReport = () => {
    if (!performanceData?.interactionsReport) {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-500 text-center py-8">No Interactions Report data available</p>
        </div>
      );
    }

    const reportData = performanceData.interactionsReport.reportData;
    
    const interactions = Array.isArray(reportData) ? reportData : (reportData && typeof reportData === 'object' ? Object.values(reportData).flat() : []);

    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (e) {
        return dateString;
      }
    };

    const getSeverityColor = (count) => {
      const num = Number(count) || 0;
      if (num === 0) return 'bg-green-100 text-green-700 border-green-200';
      if (num <= 2) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      return 'bg-red-100 text-red-700 border-red-200';
    };

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <LuActivity className="mr-2" />
            Interactions
          </h3>
          {interactions.length > 0 && (
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              {interactions.length} {interactions.length === 1 ? 'Interaction' : 'Interactions'}
            </span>
          )}
        </div>

        {interactions.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {interactions.map((interaction, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-0.5">Deviation Type</p>
                      <p className="text-xs font-medium text-gray-900">
                        {interaction.deviation || interaction.devation || 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-0.5">Category</p>
                      <p className="text-xs text-gray-700">
                        {interaction.category || 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-0.5">Date & Time</p>
                      <p className="text-xs text-gray-700">
                        {formatDate(interaction.date_time || interaction.dateTime)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-0.5">Times Mentioned</p>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(interaction.how_may_times_we_are_saying || interaction.howManyTimesWeAreSaying || interaction.times_mentioned || 0)}`}>
                        {interaction.how_may_times_we_are_saying || interaction.howManyTimesWeAreSaying || interaction.times_mentioned || 0}
                      </span>
                    </div>
                    
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-0.5">Said Orally</p>
                      <p className="text-xs text-gray-700">
                        {interaction.saying_orally || interaction.sayingOrally || 'N/A'}
                      </p>
                    </div>
                    
                    {interaction.saying_oral_remarks || interaction.sayingOralRemarks ? (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-0.5">Oral Remarks</p>
                        <p className="text-xs text-gray-700 bg-gray-50 p-1.5 rounded border">
                          {interaction.saying_oral_remarks || interaction.sayingOralRemarks}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <LuActivity className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No interactions recorded</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen bg-slate-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
        <div className="w-full px-6 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900 mb-2 text-sm"
          >
            <LuChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{personalDetails.name || 'N/A'}</h1>
              <p className="text-slate-600 text-sm">Employee ID: {getEmployeeId()}</p>
            </div>
            <div className="flex items-center gap-2">
              {personalDetails.isActive ? (
                <span className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded border border-teal-200 flex items-center gap-1 text-sm">
                  <LuCheck className="w-4 h-4" />
                  Working
                </span>
              ) : (
                <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded border border-slate-200 flex items-center gap-1 text-sm">
                  <LuX className="w-4 h-4" />
                  Not Working
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-6 py-4 flex-1 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
          {/* Left Column - Personal Details */}
          <div className="md:col-span-2 space-y-4 overflow-y-auto">
            {/* Personal Details Card */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <LuUser className="w-5 h-5" />
                  Personal Details
                </h2>
                {!editPersonalDetails ? (
                  <button
                    onClick={() => setEditPersonalDetails(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <LuPencil className="w-4 h-4" />
                    Edit
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditPersonalDetails(false);
                        setEditablePersonalDetails({});
                      }}
                      className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={savePersonalDetails}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-teal-600 text-white hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50"
                      disabled={saving}
                    >
                      {saving ? (
                        <LuLoader className="w-4 h-4 animate-spin" />
                      ) : (
                        <LuCheck className="w-4 h-4" />
                      )}
                      Update
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-sm font-medium text-slate-600">Name</label>
                  {editPersonalDetails ? (
                    <input
                      type="text"
                      value={editablePersonalDetails.name || ''}
                      onChange={(e) => setEditablePersonalDetails({...editablePersonalDetails, name: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-slate-300 rounded text-slate-900 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-slate-900 mt-1 text-sm">{personalDetails.name || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Email</label>
                  {editPersonalDetails ? (
                    <input
                      type="email"
                      value={editablePersonalDetails.email || ''}
                      onChange={(e) => setEditablePersonalDetails({...editablePersonalDetails, email: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-slate-300 rounded text-slate-900 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-slate-900 mt-1 text-sm">{personalDetails.email || personalDetails.emailId || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Phone</label>
                  {editPersonalDetails ? (
                    <input
                      type="tel"
                      value={editablePersonalDetails.phone || ''}
                      onChange={(e) => setEditablePersonalDetails({...editablePersonalDetails, phone: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-slate-300 rounded text-slate-900 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-slate-900 mt-1 text-sm">{personalDetails.phone || personalDetails.phoneNumber || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Employee ID</label>
                  <p className="text-slate-900 mt-1 text-sm">{getEmployeeId()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Author ID</label>
                  <p className="text-slate-900 mt-1 font-mono text-sm truncate">{authorId || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Role</label>
                  <p className="text-slate-900 mt-1 capitalize text-sm">{personalDetails.role || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Department</label>
                  {editPersonalDetails ? (
                    <input
                      type="text"
                      value={editablePersonalDetails.department || ''}
                      onChange={(e) => setEditablePersonalDetails({...editablePersonalDetails, department: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-slate-300 rounded text-slate-900 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-slate-900 mt-1 text-sm">{personalDetails.department || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">State</label>
                  {editPersonalDetails ? (
                    <input
                      type="text"
                      value={editablePersonalDetails.state || ''}
                      onChange={(e) => setEditablePersonalDetails({...editablePersonalDetails, state: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-slate-300 rounded text-slate-900 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-slate-900 mt-1 text-sm">{personalDetails.state || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Qualification</label>
                  {editPersonalDetails ? (
                    <input
                      type="text"
                      value={editablePersonalDetails.qualification || ''}
                      onChange={(e) => setEditablePersonalDetails({...editablePersonalDetails, qualification: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-slate-300 rounded text-slate-900 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-slate-900 mt-1 text-sm">{personalDetails.qualification || personalDetails.highestQualification || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Specialization</label>
                  {editPersonalDetails ? (
                    <input
                      type="text"
                      value={editablePersonalDetails.specialization || ''}
                      onChange={(e) => setEditablePersonalDetails({...editablePersonalDetails, specialization: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-slate-300 rounded text-slate-900 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-slate-900 mt-1 text-sm">{personalDetails.specialization || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Joining Date</label>
                  {editPersonalDetails ? (
                    <input
                      type="date"
                      value={editablePersonalDetails.joiningDate ? new Date(editablePersonalDetails.joiningDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditablePersonalDetails({...editablePersonalDetails, joiningDate: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-slate-300 rounded text-slate-900 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-slate-900 mt-1 text-sm">
                      {personalDetails.joiningDate || personalDetails.dateOfJoining || personalDetails.doj
                        ? new Date(personalDetails.joiningDate || personalDetails.dateOfJoining || personalDetails.doj).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Year of Passing</label>
                  {editPersonalDetails ? (
                    <input
                      type="text"
                      value={editablePersonalDetails.yearOfPassing || ''}
                      onChange={(e) => setEditablePersonalDetails({...editablePersonalDetails, yearOfPassing: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-slate-300 rounded text-slate-900 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-slate-900 mt-1 text-sm">{personalDetails.yearOfPassing || personalDetails.yearOfPassout || 'N/A'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Learning Report Card */}
            <div className="bg-white h-[500px] rounded-lg shadow-sm border border-slate-200 p-4 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <LuTrendingUp className="w-5 h-5" />
                  Learning Report
                </h2>
                {performanceData?.learningReport && (
                  <button
                    onClick={() => {
                      setEditLearningReport(!editLearningReport);
                      if (!editLearningReport) {
                        setEditableLearningReport(JSON.parse(JSON.stringify(performanceData.learningReport.reportData)));
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <LuPencil className="w-4 h-4" />
                    {editLearningReport ? 'View' : 'Edit'}
                  </button>
                )}
              </div>
              {editLearningReport && performanceData?.learningReport ? (
                <div className="space-y-4">
                  {renderLearningReportEditForm()}
                  <div className="flex items-center gap-2 pt-4 border-t border-slate-200">
                    <button
                      onClick={async () => {
                        const success = await saveReport('learning', editableLearningReport);
                        if (success) {
                          setEditLearningReport(false);
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-teal-600 text-white hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50"
                      disabled={saving}
                    >
                      {saving ? (
                        <LuLoader className="w-4 h-4 animate-spin" />
                      ) : (
                        <LuCheck className="w-4 h-4" />
                      )}
                      Update
                    </button>
                    <button
                      onClick={() => {
                        setEditLearningReport(false);
                        setEditableLearningReport(null);
                      }}
                      className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto min-h-0">
                  {renderLearningReport()}
                </div>
              )}
            </div>

            {/* Attendance Report Card */}
            <div className="bg-white h-[600px] rounded-lg shadow-sm border border-slate-200 p-4 flex-1 overflow-hidden flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <LuCalendarIcon className="w-5 h-5" />
                  Attendance Report
                </h2>
                {performanceData?.attendanceReport && (
                  <button
                    onClick={() => {
                      setEditAttendanceReport(!editAttendanceReport);
                      if (!editAttendanceReport) {
                        setEditableAttendanceReport(JSON.parse(JSON.stringify(performanceData.attendanceReport.reportData)));
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <LuPencil className="w-4 h-4" />
                    {editAttendanceReport ? 'View' : 'Edit'}
                  </button>
                )}
              </div>
              {editAttendanceReport && performanceData?.attendanceReport ? (
                <div className="space-y-4">
                  {renderAttendanceReportEditForm()}
                  <div className="flex items-center gap-2 pt-4 border-t border-slate-200">
                    <button
                      onClick={async () => {
                        const success = await saveReport('attendance', editableAttendanceReport);
                        if (success) {
                          setEditAttendanceReport(false);
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-teal-600 text-white hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50"
                      disabled={saving}
                    >
                      {saving ? (
                        <LuLoader className="w-4 h-4 animate-spin" />
                      ) : (
                        <LuCheck className="w-4 h-4" />
                      )}
                      Update
                    </button>
                    <button
                      onClick={() => {
                        setEditAttendanceReport(false);
                        setEditableAttendanceReport(null);
                      }}
                      className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto min-h-0">
                  {renderAttendanceReport()}
                </div>
              )}
            </div>

            {/* Grooming Report Card */}
            <div className="bg-white h-[500px] rounded-lg shadow-sm border border-slate-200 p-4 flex-1 overflow-hidden flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <LuUsers className="w-5 h-5" />
                  Grooming Report
                </h2>
                {performanceData?.groomingReport && (
                  <button
                    onClick={() => {
                      setEditGroomingReport(!editGroomingReport);
                      if (!editGroomingReport) {
                        setEditableGroomingReport(JSON.parse(JSON.stringify(performanceData.groomingReport.reportData)));
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <LuPencil className="w-4 h-4" />
                    {editGroomingReport ? 'View' : 'Edit'}
                  </button>
                )}
              </div>
              {editGroomingReport && performanceData?.groomingReport ? (
                <div className="space-y-4">
                  {renderGroomingReportEditForm()}
                  <div className="flex items-center gap-2 pt-4 border-t border-slate-200">
                    <button
                      onClick={async () => {
                        const success = await saveReport('grooming', editableGroomingReport);
                        if (success) {
                          setEditGroomingReport(false);
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-teal-600 text-white hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50"
                      disabled={saving}
                    >
                      {saving ? (
                        <LuLoader className="w-4 h-4 animate-spin" />
                      ) : (
                        <LuCheck className="w-4 h-4" />
                      )}
                      Update
                    </button>
                    <button
                      onClick={() => {
                        setEditGroomingReport(false);
                        setEditableGroomingReport(null);
                      }}
                      className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto min-h-0">
                  {renderGroomingReport()}
                </div>
              )}
            </div>

            {/* Interactions Report Card */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex-1 overflow-hidden flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <LuActivity className="w-5 h-5" />
                  Interactions Report
                </h2>
                {performanceData?.interactionsReport && (
                  <button
                    onClick={() => {
                      setEditInteractionsReport(!editInteractionsReport);
                      if (!editInteractionsReport) {
                        setEditableInteractionsReport(JSON.parse(JSON.stringify(performanceData.interactionsReport.reportData)));
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <LuPencil className="w-4 h-4" />
                    {editInteractionsReport ? 'View' : 'Edit'}
                  </button>
                )}
              </div>
              {editInteractionsReport && performanceData?.interactionsReport ? (
                <div className="space-y-3">
                  <textarea
                    value={JSON.stringify(editableInteractionsReport, null, 2)}
                    onChange={(e) => {
                      try {
                        setEditableInteractionsReport(JSON.parse(e.target.value));
                      } catch (err) {
                        // Invalid JSON, keep the text
                      }
                    }}
                    className="w-full h-48 px-3 py-2 border border-slate-300 rounded text-slate-900 text-sm font-mono focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Edit JSON data..."
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        const success = await saveReport('interactions', editableInteractionsReport);
                        if (success) {
                          setEditInteractionsReport(false);
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-teal-600 text-white hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50"
                      disabled={saving}
                    >
                      {saving ? (
                        <LuLoader className="w-4 h-4 animate-spin" />
                      ) : (
                        <LuCheck className="w-4 h-4" />
                      )}
                      Update
                    </button>
                    <button
                      onClick={() => {
                        setEditInteractionsReport(false);
                        setEditableInteractionsReport(null);
                      }}
                      className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto min-h-0">
                  {renderInteractionsReport()}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-4 overflow-y-auto flex flex-col">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex-shrink-0">
              <h3 className="text-base font-bold text-slate-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Overall Score</label>
                  <p className="text-2xl font-bold text-teal-700 mt-1">
                    {performanceData?.overallScore || userData?.overallScore || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Status</label>
                  <p className="text-slate-900 mt-1 capitalize text-sm">
                    {personalDetails.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;

