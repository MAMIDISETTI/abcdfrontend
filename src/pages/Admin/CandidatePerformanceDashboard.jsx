import React, { useState, useEffect } from 'react';
import { 
  LuActivity, 
  LuTrendingUp, 
  LuCalendar, 
  LuUsers, 
  LuLoader, 
  LuSearch,
  LuChevronLeft,
  LuUser,
  LuPhone,
  LuMail,
  LuMapPin,
  LuGraduationCap,
  LuBriefcase,
  LuCheck,
  LuX,
  LuInfo,
  LuDownload
} from 'react-icons/lu';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-hot-toast';

const CandidatePerformanceDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [performanceData, setPerformanceData] = useState(null);
  const [activeTab, setActiveTab] = useState('personal-details');
  const [showDetailView, setShowDetailView] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/admin/users?status=all&limit=1000');
      if (response.data && response.data.users && Array.isArray(response.data.users)) {
        const candidatesList = response.data.users.filter(user => user.author_id);
        setCandidates(candidatesList);
      } else if (response.data && Array.isArray(response.data)) {
        const candidatesList = response.data.filter(user => user.author_id);
        setCandidates(candidatesList);
      }
    } catch (error) {
      toast.error('Failed to fetch candidates');
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidatePerformance = async (authorId) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/api/candidate-reports/performance/${authorId}`);
      
      if (response.data.success && response.data.data) {
        setPerformanceData(response.data.data);
      } else {
        setPerformanceData(null);
      }
    } catch (error) {
      setPerformanceData(null);
    } finally {
      setLoading(false);
    }
  };


  const handleCandidateSelect = (candidate) => {
    setSelectedCandidate(candidate);
    setShowDetailView(true);
    setActiveTab('personal-details');
    setSelectedCourse(''); // Reset selected course when switching candidates
    if (candidate.author_id) {
      fetchCandidatePerformance(candidate.author_id);
    }
  };

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
      
      if (!selectedCourse && sortedTopics.length > 0) {
        setSelectedCourse(sortedTopics[0].name);
      }
    }
  }, [performanceData?.learningReport]);

  const handleBack = () => {
    setShowDetailView(false);
    setSelectedCandidate(null);
    setPerformanceData(null);
    setActiveTab('personal-details');
  };

  // Get the correct employee ID from users collection (backend provides it in personalDetails)
  const getEmployeeId = () => {
    if (!selectedCandidate) return 'N/A';
    
    // Use employeeId from personalDetails (backend fetches from users collection, skips EMP_ format)
    if (performanceData?.personalDetails?.employeeId) {
      return performanceData.personalDetails.employeeId;
    }
    
    // Fallback to selectedCandidate's employeeId if available and not EMP_ format
    if (selectedCandidate.employeeId && !selectedCandidate.employeeId.startsWith('EMP_')) {
      return selectedCandidate.employeeId;
    }
    
    // If no valid employee ID found, show "N/A"
    return 'N/A';
  };

  const filteredCandidates = candidates.filter(candidate =>
    candidate.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.author_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Convert data to CSV format
  const convertToCSV = (data) => {
    if (!data || typeof data !== 'object') return '';
    
    const rows = [];
    
    // Helper to escape CSV values
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      // If value contains comma, quote, or newline, wrap in quotes and escape quotes
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Helper to add a row
    const addRow = (label, value) => {
      rows.push(`${escapeCSV(label)},${escapeCSV(value)}`);
    };

    // Personal Details
    if (performanceData?.personalDetails) {
      const pd = performanceData.personalDetails;
      rows.push('\n=== PERSONAL DETAILS ===');
      addRow('Name', pd.name || 'N/A');
      addRow('Employee ID', pd.employeeId || 'N/A');
      addRow('UID', pd.uid || 'N/A');
      addRow('Email', pd.email || 'N/A');
      addRow('Phone', pd.phone || pd.phoneNumber || 'N/A');
      addRow('Date of Joining', pd.dateOfJoining || pd.joiningDate ? formatDate(pd.dateOfJoining || pd.joiningDate) : 'N/A');
      addRow('State', pd.state || 'N/A');
      addRow('Highest Qualification', pd.qualification || pd.highestQualification || 'N/A');
      addRow('Specialization', pd.specialization || 'N/A');
      addRow('M.Tech PC', pd.haveMTechPC || 'N/A');
      addRow('M.Tech OD', pd.haveMTechOD || 'N/A');
      addRow('Year of Passout', pd.yearOfPassout || pd.yearOfPassing || 'N/A');
    }

    // Learning Report
    if (performanceData?.learningReport?.reportData) {
      const lr = performanceData.learningReport.reportData;
      rows.push('\n=== LEARNING REPORT ===');
      
      const skills = lr.skills || [];
      const dailyQuizCounts = lr['Daily Quiz counts'] || lr['Daily Quiz Counts'] || {};
      const dailyQuizAttempts = lr['Daily Quiz attempts count'] || lr['Daily Quiz Attempts'] || {};
      const dailyQuizAvgScores = lr['Daily Quiz score Average in %'] || lr['Daily Quiz avg scores'] || {};
      const fortNightExamCounts = lr['Fort night exam counts'] || lr['Fort Night Exam counts'] || {};
      const fortNightExamAttempts = lr['Fort night exam attempts counts'] || lr['Fort Night Exam attempts'] || {};
      const fortNightExamAvgScores = lr['Fort night exam score Average'] || lr['Fort Night Exam score Average in %'] || {};
      const courseExamAttempts = lr['Course Exam attempts'] || lr['Course Exam Attempts'] || lr.courseExamAttempts || lr.courseExamAttempt || {};
      const courseExamScores = lr['Course Exam score in %'] || lr['Course Exam scores'] || lr['Course Exam Scores'] || lr['Course Exam score'] || lr.courseExamScores || lr.courseExamScore || {};

      rows.push('\nTopic,Daily Quiz Counts,Daily Quiz Attempts,Daily Quiz Avg Score (%),Fort Night Exam Counts,Fort Night Exam Attempts,Fort Night Exam Avg Score (%),Course Exam Attempts,Course Exam Score (%)');
      
      // Get all unique topics from all data sources (not just skills array)
      const allTopicsForCSV = new Set([
        ...skills,
        ...Object.keys(dailyQuizCounts),
        ...Object.keys(dailyQuizAttempts),
        ...Object.keys(dailyQuizAvgScores),
        ...Object.keys(fortNightExamCounts),
        ...Object.keys(fortNightExamAttempts),
        ...Object.keys(fortNightExamAvgScores),
        ...Object.keys(courseExamAttempts),
        ...Object.keys(courseExamScores)
      ]);
      
      Array.from(allTopicsForCSV).forEach(skill => {
        // Helper to get value with case-insensitive matching
        const getValue = (obj, key) => {
          if (!obj || typeof obj !== 'object') return null;
          // Try exact match first
          if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
          // Try case-insensitive match
          const lowerKey = key.toLowerCase();
          for (const k in obj) {
            if (k.toLowerCase() === lowerKey && obj[k] !== null && obj[k] !== undefined && obj[k] !== '') {
              return obj[k];
            }
          }
          return null;
        };

        const quizCount = dailyQuizCounts[skill] || getValue(dailyQuizCounts, skill) || 0;
        const quizAttempt = dailyQuizAttempts[skill] || getValue(dailyQuizAttempts, skill) || 0;
        const quizScore = dailyQuizAvgScores[skill] || getValue(dailyQuizAvgScores, skill) || 'N/A';
        const fortCount = fortNightExamCounts[skill] || getValue(fortNightExamCounts, skill) || 0;
        const fortAttempt = fortNightExamAttempts[skill] || getValue(fortNightExamAttempts, skill) || 0;
        const fortScore = fortNightExamAvgScores[skill] || getValue(fortNightExamAvgScores, skill) || 'N/A';
        const courseAttempt = courseExamAttempts[skill] || getValue(courseExamAttempts, skill) || 0;
        const courseScore = courseExamScores[skill] || getValue(courseExamScores, skill) || 'N/A';
        
        rows.push(`${escapeCSV(skill)},${quizCount},${quizAttempt},${quizScore},${fortCount},${fortAttempt},${fortScore},${courseAttempt},${courseScore}`);
      });
    }

    // Attendance Report
    if (performanceData?.attendanceReport?.reportData) {
      const ar = performanceData.attendanceReport.reportData;
      rows.push('\n=== ATTENDANCE REPORT ===');
      
      const totalWorkingDays = ar['total working days'] || ar['Total Working Days'] || {};
      const daysAttended = ar['No of days attended'] || ar['No Of Days Attended'] || {};
      const leavesTaken = ar['No of leaves taken'] || ar['No Of Leaves Taken'] || {};
      const monthlyPercentage = ar['Montly Percentage'] || ar['Monthly Percentage'] || {};

      rows.push('\nMonth,Working Days,Attended,Leaves,Attendance (%)');
      
      const allMonths = new Set([
        ...Object.keys(totalWorkingDays),
        ...Object.keys(daysAttended),
        ...Object.keys(leavesTaken),
        ...Object.keys(monthlyPercentage)
      ]);

      Array.from(allMonths).sort().forEach(month => {
        const workingDays = totalWorkingDays[month] || 0;
        const attended = daysAttended[month] || 0;
        const leaves = leavesTaken[month] || 0;
        const percentage = monthlyPercentage[month] || (workingDays > 0 ? Math.round((attended / workingDays) * 100) : 'N/A');
        
        rows.push(`${escapeCSV(month)},${workingDays},${attended},${leaves},${percentage}`);
      });
    }

    // Grooming Report
    if (performanceData?.groomingReport?.reportData) {
      const gr = performanceData.groomingReport.reportData;
      rows.push('\n=== GROOMING REPORT ===');
      
      const missedGrooming = gr['How many times missed grooming check list'] || 
                            gr['How Many Times Missed Grooming Check List'] || {};

      rows.push('\nMonth,Missed Count');
      
      const allMonths = [
        "JAN'25", "FEB'25", "MAR'25", "APR'25", "MAY'25", "JUN'25",
        "JULY'25", "AUG'25", "SEP'25", "OCT'25", "NOV'25", "DEC'25"
      ];

      allMonths.forEach(month => {
        const missed = missedGrooming[month] || 0;
        rows.push(`${escapeCSV(month)},${missed}`);
      });
    }

    // Interactions Report
    if (performanceData?.interactionsReport?.reportData) {
      const ir = performanceData.interactionsReport.reportData;
      rows.push('\n=== INTERACTIONS REPORT ===');
      
      if (Array.isArray(ir) && ir.length > 0) {
        rows.push('\nDate Time,Taken By,Category,Objective,Remarks');
        ir.forEach(interaction => {
          rows.push(
            `${escapeCSV(interaction.date_time || interaction.dateTime || '')},` +
            `${escapeCSV(interaction.taken_by || interaction.takenBy || '')},` +
            `${escapeCSV(interaction.category || '')},` +
            `${escapeCSV(interaction.objective || '')},` +
            `${escapeCSV(interaction.remarks || '')}`
          );
        });
      } else {
        rows.push('\nNo interactions data available');
      }
    }

    return rows.join('\n');
  };

  // Handle download data as CSV
  const handleDownloadData = () => {
    if (!performanceData) {
      toast.error('No data available to download');
      return;
    }

    try {
      const csvContent = convertToCSV(performanceData);
      const candidateName = performanceData?.personalDetails?.name || selectedCandidate?.name || 'Candidate';
      const employeeId = getEmployeeId();
      const fileName = `${candidateName}_${employeeId}_Performance_Data_${new Date().toISOString().split('T')[0]}.csv`;

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Data downloaded successfully');
    } catch (error) {
      console.error('Error downloading data:', error);
      toast.error('Failed to download data');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateString;
    }
  };

  // Render Personal Details Tab
  const renderPersonalDetails = () => {
    if (!selectedCandidate) return null;

    // Use personalDetails from API response if available, otherwise fallback to selectedCandidate
    const personalDetails = performanceData?.personalDetails || selectedCandidate;

    // Helper to format date
    const formatDate = (date) => {
      if (!date) return 'N/A';
      try {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = d.toLocaleString('default', { month: 'short' });
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
      } catch (e) {
        return 'N/A';
      }
    };

    // Helper to format value
    const formatValue = (value) => {
      if (value === null || value === undefined || value === '') return 'N/A';
      return String(value);
    };

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-5">
            <div className="pb-4 border-b border-gray-200">
              <p className="text-sm text-gray-600 mb-1">UID</p>
              <p className="text-base font-medium text-gray-900">
                {formatValue(personalDetails.uid || personalDetails.author_id)}
              </p>
            </div>
            <div className="pb-4 border-b border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Phone</p>
              <p className="text-base font-medium text-gray-900">
                {formatValue(personalDetails.phone || personalDetails.phoneNumber)}
              </p>
            </div>
            <div className="pb-4 border-b border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Date of Joining</p>
              <p className="text-base font-medium text-gray-900">
                {formatDate(personalDetails.joiningDate || personalDetails.dateOfJoining || personalDetails.createdAt)}
              </p>
            </div>
            <div className="pb-4 border-b border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Specialization</p>
              <p className="text-base font-medium text-gray-900">
                {formatValue(personalDetails.specialization)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">M.Tech OD</p>
              <p className="text-base font-medium text-gray-900">
                {formatValue(personalDetails.haveMTechOD)}
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            <div className="pb-4 border-b border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Email</p>
              <p className="text-base font-medium text-gray-900">
                {formatValue(personalDetails.email)}
              </p>
            </div>
            <div className="pb-4 border-b border-gray-200">
              <p className="text-sm text-gray-600 mb-1">State</p>
              <p className="text-base font-medium text-gray-900">
                {formatValue(personalDetails.state)}
              </p>
            </div>
            <div className="pb-4 border-b border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Highest Qualification</p>
              <p className="text-base font-medium text-gray-900">
                {formatValue(personalDetails.qualification || personalDetails.highestQualification)}
              </p>
            </div>
            <div className="pb-4 border-b border-gray-200">
              <p className="text-sm text-gray-600 mb-1">M.Tech PC</p>
              <p className="text-base font-medium text-gray-900">
                {formatValue(personalDetails.haveMTechPC)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Year of Passout</p>
              <p className="text-base font-medium text-gray-900">
                {formatValue(personalDetails.yearOfPassout || personalDetails.yearOfPassing)}
              </p>
            </div>
          </div>
        </div>
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
    
    // Debug: Log the structure to help identify the issue (uncomment to debug)
    // console.log('Learning Report Data Structure:', {
    //   hasDailyQuizReports: !!reportData.DailyQuizReports,
    //   hasFortnightScores: !!reportData.FortnightScores,
    //   hasCourseExamScores: !!reportData.CourseExamScores,
    //   hasDailyQuizCounts: !!reportData['Daily Quiz counts'],
    //   hasFortNightExamCounts: !!reportData['Fortnight Exam Counts'],
    //   fortNightExamCountsData: reportData['Fortnight Exam Counts'],
    //   fortNightExamAttemptsData: reportData['Fortnight Exam Attempts Counts'],
    //   sampleKeys: Object.keys(reportData).slice(0, 10)
    // });
    const skills = reportData.skills || [];
    
    // Helper function to find value by multiple possible field names (case-insensitive)
    // Must be defined before it's used
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
    // Extract data using flexible field name matching
    // Daily Quiz
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
    
    // Fort Night Exam
    // IMPORTANT: Database uses "Fortnight Exam Counts" (no space, capital F/E/C)
    const fortNightExamCounts = findValueByVariations(reportData, [
      'Fortnight Exam Counts', // Exact match from database (no space)
      'Fort night exam counts', 'Fort Night Exam counts', 'Fort Night Exam Counts',
      'Fort Night Exam count', 'fortNightExamCounts', 'fortNightExamCount',
      'fort night exam counts', 'Fortnight Exam counts'
    ]) || {};
    
    const fortNightExamAttempts = findValueByVariations(reportData, [
      'Fortnight Exam Attempts Counts', // Exact match from database (no space)
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
    
    // Course Exam
    const courseExamAttempts = findValueByVariations(reportData, [
      'Course Exam attempts', 'Course Exam Attempts', 'courseExamAttempts',
      'courseExamAttempt', 'course exam attempts'
    ]) || {};
    
    const courseExamScores = findValueByVariations(reportData, [
      'Course Exam score in %', 'Course Exam scores', 'Course Exam Scores',
      'Course Exam score', 'courseExamScores', 'courseExamScore',
      'course exam score', 'course exam scores'
    ]) || {};
    
    // Weeks data - check both metric-based format and CourseCompletion
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
    
    // Also extract from CourseCompletion if it exists
    if (reportData.CourseCompletion && typeof reportData.CourseCompletion === 'object') {
      const courseCompletion = reportData.CourseCompletion;
      Object.keys(courseCompletion).forEach(courseName => {
        const courseData = courseCompletion[courseName];
        if (courseData && typeof courseData === 'object') {
          // Extract weeksExpected and weeksTaken from CourseCompletion
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
    
    // Demo data
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

    // Also check sub-sheet format - always merge, not just when empty
    // This handles cases where data might still be in sub-sheet format
    if (reportData.DailyQuizReports) {
      const dailyQuizData = reportData.DailyQuizReports;
      Object.keys(dailyQuizData).forEach(topic => {
        if (dailyQuizData[topic] && typeof dailyQuizData[topic] === 'object') {
          const topicData = dailyQuizData[topic];
          // Try multiple field name variations (matching Apps Script output)
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
          // Try multiple field name variations (matching Apps Script output)
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
            // Preserve the actual value (string or number) - don't convert "Not Attempted" to 0
            if (!fortNightExamCounts[topic] || fortNightExamCounts[topic] === 0 || fortNightExamCounts[topic] === '') {
              fortNightExamCounts[topic] = countValue;
            }
          }
          if (attemptValue !== undefined && attemptValue !== null && attemptValue !== '') {
            // Preserve the actual value (string or number) - don't convert "Not Attempted" to 0
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
          // Try multiple field name variations (matching Apps Script output)
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
      // Also include topics from CourseCompletion
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
      // Check for completed status
      if (statusLower === 'completed' || statusLower === 'done' || statusLower === 'finished') {
        return 'Completed';
      }
      // Check for in progress status
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

    // Filter: Only show Completed and In Progress
    const filteredTopics = topicsWithStatus.filter(topic => 
      topic.status === 'Completed' || topic.status === 'In Progress'
    );

    // Sort: Completed first, then In Progress
    const sortedTopics = filteredTopics.sort((a, b) => {
      if (a.status === 'Completed' && b.status === 'In Progress') return -1;
      if (a.status === 'In Progress' && b.status === 'Completed') return 1;
      // If same status, sort alphabetically
      return a.name.localeCompare(b.name);
    });

    const topicsArray = sortedTopics.map(t => t.name);

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
      
      // Handle "Not Attempted" and similar text values
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
      
      // Handle text values that should be treated as N/A
      if (typeof val === 'string') {
        const lowerVal = val.toLowerCase().trim();
        // Check for various text patterns that indicate no data
        if (lowerVal === 'not attempted' || 
            lowerVal === 'notattempted' ||
            lowerVal === 'rating didn\'t given' || 
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
      
      // Try to parse as number
      const num = Number(val);
      if (isNaN(num)) {
        // If not a number, try to extract number from string (e.g., "91%" -> 91)
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
      
      // Exact match
      if (obj[topic] !== undefined) return topic;
      
      // Case-insensitive match
      const lowerTopic = topic.toLowerCase().trim();
      for (const key in obj) {
        if (key.toLowerCase().trim() === lowerTopic) {
          return key;
        }
      }
      
      // Partial match (e.g., "Modern Responsive" matches "Modern Responsive Web Design")
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
      
      // Find matching keys for each data source
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
      
      // Debug logging (can be removed later)
      // console.log('Extracting data for course:', topicKey, {
      //   fortNightExamCountsKeys: Object.keys(fortNightExamCounts),
      //   fortNightCountKey,
      //   fortNightExamCountsValue: fortNightExamCounts[fortNightCountKey],
      //   fortNightExamAttemptsKeys: Object.keys(fortNightExamAttempts),
      //   fortNightAttemptKey,
      //   fortNightExamAttemptsValue: fortNightExamAttempts[fortNightAttemptKey]
      // });
      
      // Try multiple matching strategies
      const dailyQuizCount = getNumericValue(dailyQuizCounts, dailyQuizCountKey) || 0;
      const dailyQuizAttempt = getNumericValue(dailyQuizAttempts, dailyQuizAttemptKey) || 0;
      const dailyQuizAvgScore = getScoreValue(dailyQuizAvgScores, dailyQuizScoreKey);
      
      // Helper to get raw value (preserves "Not Attempted" strings)
      const getRawValue = (obj, key) => {
        if (!obj || typeof obj !== 'object') return null;
        // Try exact key first
        if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
          return obj[key];
        }
        // Try case-insensitive match
        const lowerKey = key.toLowerCase().trim();
        for (const k in obj) {
          if (k.toLowerCase().trim() === lowerKey && obj[k] !== null && obj[k] !== undefined && obj[k] !== '') {
            return obj[k];
          }
        }
        return null;
      };
      
      // For Fortnight Exam, preserve actual values (including "Not Attempted")
      let fortNightCount = getRawValue(fortNightExamCounts, topicKey);
      if (fortNightCount === null) {
        fortNightCount = getRawValue(fortNightExamCounts, fortNightCountKey);
      }
      // If still null, default to 0, otherwise preserve the value (could be number or string)
      if (fortNightCount === null || fortNightCount === '') {
        fortNightCount = 0;
      } else if (typeof fortNightCount === 'string') {
        // Keep string values as-is (e.g., "Not Attempted")
        // Don't convert to number
      } else {
        // It's already a number, keep it
        fortNightCount = Number(fortNightCount) || 0;
      }
      
      let fortNightAttempt = getRawValue(fortNightExamAttempts, topicKey);
      if (fortNightAttempt === null) {
        fortNightAttempt = getRawValue(fortNightExamAttempts, fortNightAttemptKey);
      }
      // If still null, default to 0, otherwise preserve the value (could be number or string)
      if (fortNightAttempt === null || fortNightAttempt === '') {
        fortNightAttempt = 0;
      } else if (typeof fortNightAttempt === 'string') {
        // Keep string values as-is (e.g., "Not Attempted")
        // Don't convert to number
      } else {
        // It's already a number, keep it
        fortNightAttempt = Number(fortNightAttempt) || 0;
      }
      
      const fortNightAvgScore = getScoreValue(fortNightExamAvgScores, fortNightScoreKey);
      
      const courseAttempt = getNumericValue(courseExamAttempts, courseAttemptKey) || 0;
      const courseScore = getScoreValue(courseExamScores, courseScoreKey);

      // Get weeks data for this course (also check CourseCompletion)
      let weeksExpectedValue = getValue(weeksExpected, weeksExpectedKey);
      let weeksTakenValue = getValue(weeksTaken, weeksTakenKey);
      
      // If not found in metric format, check CourseCompletion
      if ((!weeksExpectedValue || weeksExpectedValue === '') && reportData.CourseCompletion) {
        const courseCompletion = reportData.CourseCompletion[weeksExpectedKey] || reportData.CourseCompletion[topicKey];
        if (courseCompletion && typeof courseCompletion === 'object') {
          weeksExpectedValue = courseCompletion.weeksExpected || weeksExpectedValue;
          weeksTakenValue = courseCompletion.weeksTaken || weeksTakenValue;
        }
      }

      // Get demo data for this course
      const onlineDemoCount = getNumericValue(onlineDemoCounts, onlineDemoCountKey) || 0;
      const onlineDemoRating = getScoreValue(onlineDemoRatings, onlineDemoRatingKey);
      const offlineDemoCount = getNumericValue(offlineDemoCounts, offlineDemoCountKey) || 0;
      const offlineDemoRating = getScoreValue(offlineDemoRatings, offlineDemoRatingKey);

      // Helper to format display value (preserves strings like "Not Attempted")
      const formatDisplayValue = (value) => {
        if (value === null || value === undefined || value === '') return 0;
        if (typeof value === 'string') {
          // Preserve string values like "Not Attempted"
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Course Dropdown */}
        {sortedTopics.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {sortedTopics.map((topicObj) => (
                <option key={topicObj.name} value={topicObj.name}>
                  {topicObj.name} {topicObj.status ? `(${topicObj.status})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Selected Course Display */}
        {selectedCourseData ? (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h4 className="text-lg font-semibold text-gray-900">{selectedCourseData.topic}</h4>
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
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatus(selectedCourseData.fortNight.score).color}`}>
                {getStatus(selectedCourseData.fortNight.score).label}
              </span>
            </div>

            {/* Compact Grid Layout - All sections in one view */}
            <div className="grid grid-cols-2 gap-4">
              {/* Course Completion */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <h5 className="text-xs font-semibold text-gray-700 mb-2">COURSE COMPLETION</h5>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Weeks Expected</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedCourseData.weeksExpected !== null && selectedCourseData.weeksExpected !== undefined && selectedCourseData.weeksExpected !== '' 
                        ? selectedCourseData.weeksExpected 
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Weeks Taken</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedCourseData.weeksTaken !== null && selectedCourseData.weeksTaken !== undefined && selectedCourseData.weeksTaken !== '' 
                        ? selectedCourseData.weeksTaken 
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Daily Quiz */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <h5 className="text-xs font-semibold text-gray-700 mb-2">DAILY QUIZ</h5>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Count</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedCourseData.dailyQuiz.count}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Attempts</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedCourseData.dailyQuiz.attempt}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Avg Score</p>
                    <p className={`text-sm font-semibold ${getScoreColor(selectedCourseData.dailyQuiz.score)}`}>
                      {formatScore(selectedCourseData.dailyQuiz.score) === 'N/A' ? 'N/A' : `${Math.round(formatScore(selectedCourseData.dailyQuiz.score))}%`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Fort Night Exam */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <h5 className="text-xs font-semibold text-gray-700 mb-2">FORT NIGHT EXAM</h5>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Count</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {typeof selectedCourseData.fortNight.count === 'string' 
                        ? selectedCourseData.fortNight.count 
                        : selectedCourseData.fortNight.count}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Attempts</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {typeof selectedCourseData.fortNight.attempt === 'string' 
                        ? selectedCourseData.fortNight.attempt 
                        : selectedCourseData.fortNight.attempt}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Avg Score</p>
                    <p className={`text-sm font-semibold ${getScoreColor(selectedCourseData.fortNight.score)}`}>
                      {formatScore(selectedCourseData.fortNight.score) === 'N/A' ? 'N/A' : `${Math.round(formatScore(selectedCourseData.fortNight.score))}%`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Course Exam */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <h5 className="text-xs font-semibold text-gray-700 mb-2">COURSE EXAM</h5>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Attempts</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedCourseData.course.attempt}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Score</p>
                    <p className={`text-sm font-semibold ${getScoreColor(selectedCourseData.course.score, 'course')}`}>
                      {formatScore(selectedCourseData.course.score) === 'N/A' ? 'N/A' : `${Math.round(formatScore(selectedCourseData.course.score))}%`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Online Demo */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <h5 className="text-xs font-semibold text-gray-700 mb-2">ONLINE DEMO</h5>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Count</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedCourseData.onlineDemo.count}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Rating Avg</p>
                    <p className={`text-sm font-semibold ${getScoreColor(selectedCourseData.onlineDemo.rating)}`}>
                      {formatScore(selectedCourseData.onlineDemo.rating) === 'N/A' ? 'N/A' : `${Math.round(formatScore(selectedCourseData.onlineDemo.rating))}%`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Offline Demo */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <h5 className="text-xs font-semibold text-gray-700 mb-2">OFFLINE DEMO</h5>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Count</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedCourseData.offlineDemo.count}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Rating Avg</p>
                    <p className={`text-sm font-semibold ${getScoreColor(selectedCourseData.offlineDemo.rating)}`}>
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

    // Helper to find value by multiple variations (case-insensitive)
    const findAttendanceValue = (obj, variations) => {
      if (!obj || typeof obj !== 'object') return null;
      
      // Try exact matches first
      for (const variation of variations) {
        if (obj[variation] !== undefined && obj[variation] !== null) {
          return obj[variation];
        }
      }
      
      // Try case-insensitive matches
      const lowerVariations = variations.map(v => v.toLowerCase().trim());
      for (const key in obj) {
        const lowerKey = key.toLowerCase().trim();
        if (lowerVariations.includes(lowerKey) && obj[key] !== null && obj[key] !== undefined) {
          return obj[key];
        }
      }
      
      // Try partial matches
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

    // Extract attendance data - handle multiple field name variations
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
    
    // Debug logging (uncomment to debug)
    // console.log('Attendance Report Data:', {
    //   reportDataKeys: Object.keys(reportData),
    //   totalWorkingDays,
    //   daysAttended,
    //   leavesTaken,
    //   monthlyPercentage,
    //   totalWorkingDaysKeys: totalWorkingDays && typeof totalWorkingDays === 'object' ? Object.keys(totalWorkingDays) : [],
    //   daysAttendedKeys: daysAttended && typeof daysAttended === 'object' ? Object.keys(daysAttended) : []
    // });

    // Map month numbers to month names (database uses numbers like "2", "3", etc.)
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
    
    // Get all unique months from all data sources
    // Database might use numeric keys (1, 2, 3) or month names (MAR'25, APR'25)
    const allMonthKeys = new Set([
      ...Object.keys(totalWorkingDays),
      ...Object.keys(daysAttended),
      ...Object.keys(leavesTaken),
      ...Object.keys(monthlyPercentage)
    ]);
    
    // Convert month keys to month names for display
    const allMonths = new Set();
    allMonthKeys.forEach(key => {
      // If key is a number (1-12), convert to month name
      if (monthNumberToName[key]) {
        allMonths.add(monthNumberToName[key]);
      } else if (monthNameToNumber[key]) {
        // Already a month name, keep it
        allMonths.add(key);
      } else {
        // Unknown format, try to add as-is
        allMonths.add(key);
      }
    });

    // Helper to get numeric value or 0 (handles both numeric month keys and month names)
    const getNumericValue = (obj, monthName) => {
      if (!obj || typeof obj !== 'object') return 0;
      
      // Try month name key first
      let val = obj[monthName];
      
      // If not found, try month number key
      if ((val === undefined || val === null) && monthNameToNumber[monthName]) {
        const monthNum = monthNameToNumber[monthName];
        val = obj[monthNum];
      }
      
      // If still not found, try case-insensitive match
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

    // Helper to get percentage value (handles both numeric month keys and month names)
    const getPercentage = (obj, monthName) => {
      if (!obj || typeof obj !== 'object') return null;
      
      // Try month name key first
      let val = obj[monthName];
      
      // If not found, try month number key
      if ((val === undefined || val === null) && monthNameToNumber[monthName]) {
        const monthNum = monthNameToNumber[monthName];
        val = obj[monthNum];
      }
      
      // If still not found, try case-insensitive match
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

    // Helper to determine card color and icon based on attendance percentage
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

    // Helper to get percentage color for text
    const getPercentageColor = (percentage) => {
      if (percentage === null || percentage === undefined) return 'text-gray-500';
      if (percentage >= 90) return 'text-green-600';
      if (percentage >= 70) return 'text-orange-600';
      return 'text-red-600';
    };

    // Sort months chronologically (JAN'25, FEB'25, etc.)
    const sortedMonths = Array.from(allMonths).sort((a, b) => {
      // Extract month and year from format like "JAN'25"
      const monthOrder = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JULY', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const getMonthIndex = (str) => {
        const month = str.split("'")[0];
        return monthOrder.indexOf(month);
      };
      return getMonthIndex(a) - getMonthIndex(b);
    });

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <LuCalendar className="mr-2" />
            Monthly Breakdown
          </h3>
        </div>

        {sortedMonths.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  className={`${status.color} border-2 rounded-lg p-5 relative transition-shadow hover:shadow-md`}
                >
                  {/* Status Icon */}
                  {StatusIcon && (
                    <div className={`absolute top-4 right-4 ${status.iconColor}`}>
                      <StatusIcon className="w-6 h-6" />
                    </div>
                  )}

                  {/* Month Header */}
                  <h4 className="text-lg font-bold text-gray-900 mb-4">{month}</h4>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Working Days</p>
                      <p className="text-lg font-semibold text-gray-900">{workingDays}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Attended</p>
                      <p className="text-lg font-semibold text-gray-900">{attended}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Leaves</p>
                      <p className="text-lg font-semibold text-gray-900">{leaves}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Attendance</p>
                      <p className={`text-lg font-semibold ${getPercentageColor(percentage)}`}>
                        {percentage !== null ? `${percentage}%` : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {percentage !== null && (
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
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

    // Extract missed grooming data - handle multiple field name variations
    const missedGrooming = reportData['How many times missed grooming check list'] || 
                          reportData['How Many Times Missed Grooming Check List'] || 
                          reportData.missedGrooming || 
                          reportData.howManyTimesMissedGroomingCheckList || {};

    // Helper to get numeric value or 0
    const getMissedCount = (month) => {
      if (!missedGrooming || typeof missedGrooming !== 'object') return 0;
      const val = missedGrooming[month];
      if (val === null || val === undefined || val === '') return 0;
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    };

    // Define all 12 months for 2025
    const allMonths = [
      "JAN'25", "FEB'25", "MAR'25", "APR'25", "MAY'25", "JUN'25",
      "JULY'25", "AUG'25", "SEP'25", "OCT'25", "NOV'25", "DEC'25"
    ];

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <LuUsers className="mr-2" />
            Grooming Checklist
          </h3>
          
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                } rounded-lg p-5 relative transition-shadow hover:shadow-md`}
              >
                {/* Status Icon */}
                <div className={`absolute top-4 right-4 ${
                  isGood ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isGood ? (
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                      <LuCheck className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                      <LuX className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Month Header */}
                <h4 className="text-lg font-bold text-gray-900 mb-3">{month}</h4>

                {/* Missed Count */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Missed</p>
                  <p className="text-2xl font-semibold text-gray-900">{missedCount}</p>
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
    
    // Handle both array and object formats
    const interactions = Array.isArray(reportData) ? reportData : (reportData && typeof reportData === 'object' ? Object.values(reportData).flat() : []);

    // Helper to format date
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

    // Helper to get severity color
    const getSeverityColor = (count) => {
      const num = Number(count) || 0;
      if (num === 0) return 'bg-green-100 text-green-700 border-green-200';
      if (num <= 2) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      return 'bg-red-100 text-red-700 border-red-200';
    };

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <LuActivity className="mr-2" />
            Interactions Report
          </h3>
          {interactions.length > 0 && (
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              {interactions.length} {interactions.length === 1 ? 'Interaction' : 'Interactions'}
            </span>
          )}
        </div>

        {interactions.length > 0 ? (
          <div className="space-y-4">
            {interactions.map((interaction, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">Deviation Type</p>
                      <p className="text-sm font-medium text-gray-900">
                        {interaction.deviation || interaction.devation || 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">Category</p>
                      <p className="text-sm text-gray-700">
                        {interaction.category || 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">Date & Time</p>
                      <p className="text-sm text-gray-700">
                        {formatDate(interaction.date_time || interaction.dateTime)}
                      </p>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">Times Mentioned</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(interaction.how_may_times_we_are_saying || interaction.howManyTimesWeAreSaying || interaction.times_mentioned || 0)}`}>
                        {interaction.how_may_times_we_are_saying || interaction.howManyTimesWeAreSaying || interaction.times_mentioned || 0}
                      </span>
                    </div>
                    
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">Said Orally</p>
                      <p className="text-sm text-gray-700">
                        {interaction.saying_orally || interaction.sayingOrally || 'N/A'}
                      </p>
                    </div>
                    
                    {interaction.saying_oral_remarks || interaction.sayingOralRemarks ? (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Oral Remarks</p>
                        <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded border">
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

  // Render Metrics Sidebar
  const renderMetricsSidebar = () => {
    if (!performanceData) {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
          <p className="text-gray-500 text-sm">No data available</p>
        </div>
      );
    }

    const reportData = performanceData.learningReport?.reportData || {};
    const attendanceData = performanceData.attendanceReport?.reportData || {};
    const groomingData = performanceData.groomingReport?.reportData || {};

    // Calculate overall metrics
    const calculateLearningMetrics = () => {
      const skills = reportData.skills || [];
      const dailyQuizCounts = reportData['Daily Quiz counts'] || reportData['Daily Quiz Counts'] || {};
      const fortNightExamCounts = reportData['Fortnight Exam Counts'] || reportData['Fort night exam counts'] || {};
      const courseExamAttempts = reportData['Course Exam attempts'] || reportData['Course Exam Attempts'] || {};
      
      let totalDailyQuizzes = 0;
      let totalFortnightExams = 0;
      let totalCourseExams = 0;
      let completedCourses = 0;
      let inProgressCourses = 0;

      // Count from CourseCompletion if available
      if (reportData.CourseCompletion) {
        Object.keys(reportData.CourseCompletion).forEach(course => {
          const courseData = reportData.CourseCompletion[course];
          if (courseData && typeof courseData === 'object') {
            const status = (courseData.status || courseData.Status || '').toLowerCase().trim();
            if (status === 'completed' || status === 'done' || status === 'finished') {
              completedCourses++;
            } else if (status === 'in progress' || status === 'inprogress' || 
                      status === 'ongoing' || status === 'working' || 
                      status === 'currently doing' || status.includes('progress')) {
              inProgressCourses++;
            }
          }
        });
      }

      // Count from other data sources
      Object.keys(dailyQuizCounts).forEach(course => {
        const count = Number(dailyQuizCounts[course]) || 0;
        totalDailyQuizzes += count;
      });

      Object.keys(fortNightExamCounts).forEach(course => {
        const count = Number(fortNightExamCounts[course]) || 0;
        totalFortnightExams += count;
      });

      Object.keys(courseExamAttempts).forEach(course => {
        const attempt = Number(courseExamAttempts[course]) || 0;
        totalCourseExams += attempt;
      });

      return {
        totalDailyQuizzes,
        totalFortnightExams,
        totalCourseExams,
        completedCourses,
        inProgressCourses,
        totalCourses: completedCourses + inProgressCourses
      };
    };

    const calculateAttendanceMetrics = () => {
      const totalWorkingDays = attendanceData['Total Working Days'] || attendanceData['total working days'] || {};
      const daysAttended = attendanceData['No of days attended'] || attendanceData['No Of Days Attended'] || {};
      const monthlyPercentage = attendanceData['Montly Percentage'] || attendanceData['Monthly Percentage'] || {};

      let totalWorkingDaysSum = 0;
      let totalAttendedSum = 0;
      let averageAttendance = 0;
      let monthsCount = 0;

      Object.keys(totalWorkingDays).forEach(month => {
        const workingDays = Number(totalWorkingDays[month]) || 0;
        const attended = Number(daysAttended[month]) || 0;
        if (workingDays > 0) {
          totalWorkingDaysSum += workingDays;
          totalAttendedSum += attended;
          monthsCount++;
        }
      });

      if (totalWorkingDaysSum > 0) {
        averageAttendance = Math.round((totalAttendedSum / totalWorkingDaysSum) * 100);
      } else {
        // Try to get from monthly percentage
        const percentages = Object.values(monthlyPercentage).map(p => Number(p) || 0).filter(p => p > 0);
        if (percentages.length > 0) {
          averageAttendance = Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length);
        }
      }

      return {
        totalWorkingDays: totalWorkingDaysSum,
        totalAttended: totalAttendedSum,
        averageAttendance,
        monthsCount
      };
    };

    const calculateGroomingMetrics = () => {
      // Find the grooming field with various name variations
      const findGroomingField = (variations) => {
        for (const variation of variations) {
          if (groomingData[variation] !== undefined) {
            return variation;
          }
        }
        const lowerVariations = variations.map(v => v.toLowerCase().trim());
        for (const key in groomingData) {
          if (lowerVariations.includes(key.toLowerCase().trim())) {
            return key;
          }
        }
        return variations[0];
      };

      const groomingField = findGroomingField([
        'How many times missed grooming check list',
        'How Many Times Missed Grooming Check List',
        'missedGrooming',
        'howManyTimesMissedGroomingCheckList'
      ]);

      const missedGrooming = groomingData[groomingField] || {};
      
      let totalMissed = 0;
      let monthsWithMisses = 0;
      let monthsPerfect = 0;

      // Month keys format: "JAN'25", "FEB'25", etc.
      const monthKeys = [
        "JAN'25", "FEB'25", "MAR'25", "APR'25", "MAY'25", "JUN'25",
        "JULY'25", "AUG'25", "SEP'25", "OCT'25", "NOV'25", "DEC'25"
      ];

      // Full month names like "September", "October", etc.
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      // Month abbreviations
      const monthAbbrevs = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      // Numeric month keys (1-12) - used in some data structures
      const numericMonthKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

      // Process all entries in the missedGrooming object
      Object.entries(missedGrooming).forEach(([key, value]) => {
        // Skip date-based entries (YYYY-MM-DD format) - these are date-specific, not monthly counts
        if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
          // This is a date key, skip it for monthly metrics
          return;
        }

        // Check if this is a month key
        const isMonthKey = monthKeys.includes(key) || 
                          monthNames.includes(key) ||
                          monthNames.some(month => key.includes(month)) ||
                          monthAbbrevs.some(abbrev => key.toLowerCase().includes(abbrev.toLowerCase())) ||
                          numericMonthKeys.includes(key) ||
                          /Month$/.test(key) || // Keys ending with "Month"
                          /^\d+$/.test(key) && parseInt(key) >= 1 && parseInt(key) <= 12; // Numeric keys 1-12

        if (isMonthKey) {
          let missed = 0;
          
          // Handle different value types
          if (typeof value === 'number') {
            missed = value;
          } else if (typeof value === 'string') {
            // If it's "Dresscode Followed" or empty, treat as 0
            if (value.toLowerCase().includes('dresscode') || 
                value.toLowerCase().includes('followed') ||
                value.trim() === '') {
              missed = 0;
            } else {
              // Try to extract a number from the string
              const numMatch = value.match(/\d+/);
              missed = numMatch ? parseInt(numMatch[0], 10) : 0;
            }
          }

          totalMissed += missed;
          if (missed > 0) {
            monthsWithMisses++;
          } else {
            monthsPerfect++;
          }
        }
      });

      return {
        totalMissed,
        monthsWithMisses,
        monthsPerfect,
        totalMonths: monthsWithMisses + monthsPerfect
      };
    };

    const learningMetrics = calculateLearningMetrics();
    const attendanceMetrics = calculateAttendanceMetrics();
    const groomingMetrics = calculateGroomingMetrics();

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col" >
        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center flex-shrink-0">
          <LuTrendingUp className="mr-2 w-4 h-4" />
          Performance Metrics
        </h3>

        <div className="flex-1 flex flex-col" style={{ gap: '0.75rem', minHeight: 0 }}>
          {/* Learning Metrics */}
          <div className="flex-shrink-0">
            <h4 className="text-xs font-semibold text-gray-700 mb-1.5">Learning Progress</h4>
            <div className="space-y-1.5 mt-4">
              <div className="bg-blue-50 rounded-lg p-1.5 border border-blue-200 mb-2">
                <p className="text-xs text-gray-600 mb-0">Completed Courses</p>
                <p className="text-lg font-bold text-blue-700">{learningMetrics.completedCourses}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-1.5 border border-yellow-200 mt-4">
                <p className="text-xs text-gray-600 mb-0">In Progress</p>
                <p className="text-lg font-bold text-yellow-700">{learningMetrics.inProgressCourses}</p>
              </div>
              <div className="grid grid-cols-2 gap-1.5 mt-4">
                <div className="bg-gray-50 rounded-lg p-1.5 border border-gray-200">
                  <p className="text-xs text-gray-600 mb-0">Daily Quizzes</p>
                  <p className="text-sm font-semibold text-gray-900">{learningMetrics.totalDailyQuizzes}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-1.5 border border-gray-200">
                  <p className="text-xs text-gray-600 mb-0">Fortnight Exams</p>
                  <p className="text-sm font-semibold text-gray-900">{learningMetrics.totalFortnightExams}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Metrics */}
          <div className="flex-shrink-0 mt-4">
            <h4 className="text-xs font-semibold text-gray-700 mb-1.5">Attendance</h4>
            <div className="space-y-1.5 mt-4">
              <div className="bg-green-50 rounded-lg p-1.5 border border-green-200">
                <p className="text-xs text-gray-600 mb-0">Average Attendance</p>
                <p className="text-lg font-bold text-green-700">{attendanceMetrics.averageAttendance}%</p>
              </div>
              <div className="grid grid-cols-2 gap-1.5 mt-4">
                <div className="bg-gray-50 rounded-lg p-1.5 border border-gray-200">
                  <p className="text-xs text-gray-600 mb-0">Total Working Days</p>
                  <p className="text-sm font-semibold text-gray-900">{attendanceMetrics.totalWorkingDays}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-1.5 border border-gray-200">
                  <p className="text-xs text-gray-600 mb-0">Days Attended</p>
                  <p className="text-sm font-semibold text-gray-900">{attendanceMetrics.totalAttended}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Grooming Metrics */}
          <div className="flex-shrink-0 mt-4">
            <h4 className="text-xs font-semibold text-gray-700 mb-1.5">Grooming</h4>
            <div className="space-y-1.5 mt-4">
              <div className={`rounded-lg p-1.5 border ${
                groomingMetrics.totalMissed === 0 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <p className="text-xs text-gray-600 mb-0">Total Missed</p>
                <p className={`text-lg font-bold ${
                  groomingMetrics.totalMissed === 0 
                    ? 'text-green-700' 
                    : 'text-red-700'
                }`}>
                  {groomingMetrics.totalMissed}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-1.5 mt-4">
                <div className="bg-green-50 rounded-lg p-1.5 border border-green-200">
                  <p className="text-xs text-gray-600 mb-0">Perfect Months</p>
                  <p className="text-sm font-semibold text-green-700">{groomingMetrics.monthsPerfect}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-1.5 border border-red-200">
                  <p className="text-xs text-gray-600 mb-0">Months with Misses</p>
                  <p className="text-sm font-semibold text-red-700">{groomingMetrics.monthsWithMisses}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // If detail view is shown, only show the detail view (sidebar remains visible via AdminLayout)
  if (showDetailView && selectedCandidate) {
    return (
      <div className="p-6 h-full flex flex-col">
        {/* Header with Back Button and Action Buttons */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LuChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {performanceData?.personalDetails?.name || selectedCandidate.name}
              </h1>
              <p className="text-sm text-gray-500">
                Employee ID: {getEmployeeId()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={handleDownloadData}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm whitespace-nowrap"
            >
              <LuDownload className="w-4 h-4" />
              <span>Download Data</span>
            </button>
            {(() => {
              // Check isActive from performanceData first, then fallback to selectedCandidate
              const isActive = performanceData?.personalDetails?.isActive !== undefined 
                ? performanceData.personalDetails.isActive 
                : (selectedCandidate?.isActive !== undefined ? selectedCandidate.isActive : true);
              const isWorking = isActive === true;
              
              return (
                <span className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap ${
                  isWorking 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {isWorking ? 'Working' : 'Not Working'}
                </span>
              );
            })()}
          </div>
        </div>

        {/* Tab Content with Metrics Sidebar */}
        <div className="flex gap-6 flex-1" style={{ minHeight: 0 }}>
          {/* Main Content - 65% width */}
          <div className="flex-1 overflow-y-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6" style={{ width: '65%', maxWidth: '65%' }}>
            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200">
              <nav className="flex space-x-8">
                {[
                  { id: 'personal-details', label: 'Personal Details' },
                  { id: 'learning-report', label: 'Learning Report' },
                  { id: 'attendance', label: 'Attendance' },
                  { id: 'grooming', label: 'Grooming' },
                  { id: 'interactions', label: 'Interactions' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-purple-500 text-purple-600 bg-gray-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            {loading ? (
              <div className="p-12 flex items-center justify-center">
                <LuLoader className="animate-spin text-purple-600 w-8 h-8" />
              </div>
            ) : (
              <>
                {activeTab === 'personal-details' && renderPersonalDetails()}
                {activeTab === 'learning-report' && renderLearningReport()}
                {activeTab === 'attendance' && renderAttendanceReport()}
                {activeTab === 'grooming' && renderGroomingReport()}
                {activeTab === 'interactions' && renderInteractionsReport()}
              </>
            )}
          </div>

          {/* Metrics Sidebar - 35% width, full height, separate square, attached to navbar */}
          <div className="flex-shrink-0" style={{ width: '35%', maxWidth: '35%' }}>
            {renderMetricsSidebar()}
          </div>
        </div>
      </div>
    );
  }

  // Default view: Show candidate list
  return (
    <div className="p-6">
      <div className="mb-8">
        <p className="text-gray-600">View and analyze candidate performance metrics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Candidates</h2>
            
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search candidates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Candidate List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <LuLoader className="animate-spin text-purple-600 w-6 h-6" />
                </div>
              ) : filteredCandidates.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No candidates found</p>
              ) : (
                filteredCandidates.map((candidate) => (
                  <button
                    key={candidate._id || candidate.author_id}
                    onClick={() => handleCandidateSelect(candidate)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedCandidate?._id === candidate._id || selectedCandidate?.author_id === candidate.author_id
                        ? 'bg-purple-100 border-2 border-purple-500'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <p className="font-medium text-gray-900">{candidate.name}</p>
                    <p className="text-sm text-gray-500">{candidate.email}</p>
                    {candidate.author_id && (
                      <p className="text-xs text-gray-400 mt-1">ID: {candidate.author_id}</p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <LuActivity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Select a candidate from the list to view their performance dashboard</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidatePerformanceDashboard;
