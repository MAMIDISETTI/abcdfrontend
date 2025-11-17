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
    if (candidate.author_id) {
      fetchCandidatePerformance(candidate.author_id);
    }
  };

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
    const skills = reportData.skills || [];
    
    // Extract data for each skill/topic - handle multiple field name variations
    // Check all possible field name variations from the Google Apps Script
    const dailyQuizCounts = reportData['Daily Quiz counts'] || reportData['Daily Quiz Counts'] || reportData['Daily Quiz count'] || reportData.dailyQuizCounts || reportData.dailyQuizCount || {};
    const dailyQuizAttempts = reportData['Daily Quiz attempts count'] || reportData['Daily Quiz Attempts'] || reportData['Daily Quiz attempts'] || reportData.dailyQuizAttempts || reportData.dailyQuizAttempt || {};
    const dailyQuizAvgScores = reportData['Daily Quiz score Average in %'] || reportData['Daily Quiz avg scores'] || reportData['Daily Quiz Avg Scores'] || reportData['Daily Quiz Average'] || reportData.dailyQuizAvgScores || reportData.dailyQuizAvgScore || reportData.dailyQuizAverage || {};
    
    const fortNightExamCounts = reportData['Fort night exam counts'] || reportData['Fort Night Exam counts'] || reportData['Fort Night Exam Counts'] || reportData['Fort Night Exam count'] || reportData.fortNightExamCounts || reportData.fortNightExamCount || {};
    const fortNightExamAttempts = reportData['Fort night exam attempts counts'] || reportData['Fort Night Exam attempts'] || reportData['Fort Night Exam Attempts'] || reportData['Fort Night Exam attempts count'] || reportData.fortNightExamAttempts || reportData.fortNightExamAttempt || {};
    const fortNightExamAvgScores = reportData['Fort night exam score Average'] || reportData['Fort Night Exam score Average in %'] || reportData['Fort Night Exam avg scores'] || reportData['Fort Night Exam Avg Scores'] || reportData['Fort Night Exam Average'] || reportData.fortNightExamAvgScores || reportData.fortNightExamAvgScore || reportData.fortNightExamAverage || {};
    
    const courseExamAttempts = reportData['Course Exam attempts'] || reportData['Course Exam Attempts'] || reportData.courseExamAttempts || reportData.courseExamAttempt || {};
    const courseExamScores = reportData['Course Exam score in %'] || reportData['Course Exam scores'] || reportData['Course Exam Scores'] || reportData['Course Exam score'] || reportData.courseExamScores || reportData.courseExamScore || {};
    
    // Debug: Log all available keys to understand the data structure
    const allKeys = Object.keys(reportData);
    if (allKeys.length > 0) {
      console.log('Available keys in learningReport.reportData:', allKeys);
      console.log('Sample data structure:', JSON.stringify(reportData, null, 2).substring(0, 1000));
      // Log specific score data to debug
      if (reportData['Daily Quiz score Average in %']) {
        console.log('Daily Quiz score Average in %:', reportData['Daily Quiz score Average in %']);
      }
      if (reportData['Fort Night Exam score Average']) {
        console.log('Fort Night Exam score Average:', reportData['Fort Night Exam score Average']);
      }
      if (reportData['Course Exam score in %']) {
        console.log('Course Exam score in %:', reportData['Course Exam score in %']);
      }
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
      ...Object.keys(courseExamScores)
    ]);

    // Color mapping for topics
    const topicColors = {
      'Static': 'bg-blue-500',
      'Static HTML/CSS': 'bg-blue-500',
      'Responsive': 'bg-purple-500',
      'Responsive Design': 'bg-purple-500',
      'Modern Responsive': 'bg-pink-500',
      'Dynamic': 'bg-green-500',
      'Dynamic JS': 'bg-green-500',
      'Python': 'bg-yellow-500',
      'SQL': 'bg-indigo-500',
      'JS': 'bg-yellow-400',
      'Node JS': 'bg-green-600',
      'React JS': 'bg-cyan-500',
      'Mini projects': 'bg-orange-500'
    };

    // Get status based on average scores
    const getStatus = (avgScore) => {
      if (!avgScore || avgScore === 0) return { label: 'No Data', color: 'bg-gray-100 text-gray-600' };
      if (avgScore >= 80) return { label: 'Excellent', color: 'bg-blue-100 text-blue-700' };
      if (avgScore >= 60) return { label: 'Good', color: 'bg-yellow-100 text-yellow-700' };
      return { label: 'Needs Improvement', color: 'bg-gray-100 text-gray-600' };
    };

    // Get score color
    const getScoreColor = (score, type = 'avg') => {
      if (!score || score === 0) return 'text-gray-500';
      if (type === 'course') return 'text-blue-600';
      if (score >= 80) return 'text-green-600';
      if (score >= 60) return 'text-yellow-600';
      return 'text-red-600';
    };

    // Format topic name for display
    const formatTopicName = (topic) => {
      const nameMap = {
        'Static': 'Static HTML/CSS',
        'Responsive': 'Responsive Design',
        'Dynamic': 'Dynamic JS'
      };
      return nameMap[topic] || topic;
    };

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">


        {/* Skills Cards Grid */}
        {allTopics.size > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from(allTopics).map((topic, index) => {
              const topicKey = topic;
              const displayName = formatTopicName(topic);
              const colorClass = topicColors[topic] || topicColors[topicKey] || 'bg-gray-500';
              
              // Try multiple variations of topic key matching - returns value even if empty string
              const getValue = (obj, key) => {
                if (!obj || typeof obj !== 'object') return null;
                // Try exact match first - include empty strings
                if (obj[key] !== undefined && obj[key] !== null) return obj[key];
                // Try case-insensitive match - include empty strings
                const lowerKey = key.toLowerCase();
                for (const k in obj) {
                  if (k.toLowerCase() === lowerKey && obj[k] !== null && obj[k] !== undefined) {
                    return obj[k];
                  }
                }
                return null;
              };
              
              // Helper to format score display
              const formatScore = (value) => {
                if (value === null || value === undefined || value === '') return 'N/A';
                if (typeof value === 'number') {
                  // 0 is a valid score, only return N/A if it's actually null/undefined/empty
                  return value;
                }
                const numValue = Number(value);
                return isNaN(numValue) ? 'N/A' : numValue;
              };
              
              // Helper to get numeric value or 0 - handles empty strings as 0
              const getNumericValue = (obj, key) => {
                const val = getValue(obj, key);
                if (val === null || val === undefined || val === '') return 0;
                const num = Number(val);
                return isNaN(num) ? 0 : num;
              };
              
              // Helper to get score value - handles empty strings as null, but preserves 0 as valid value
              const getScoreValue = (obj, key) => {
                const val = getValue(obj, key);
                // If value doesn't exist or is empty string, return null (will show as N/A)
                if (val === null || val === undefined || val === '') return null;
                // Convert to number - 0 is a valid score, only return null if NaN
                const num = Number(val);
                // If it's NaN or if it's an empty string that got converted to 0, return null
                // But if it's actually 0 (numeric), return 0
                if (isNaN(num)) return null;
                // Return the number (including 0)
                return num;
              };
              
              // Get values for this topic - try both topicKey and topic variations
              const dailyQuizCount = getNumericValue(dailyQuizCounts, topicKey) || getNumericValue(dailyQuizCounts, topic) || 0;
              const dailyQuizAttempt = getNumericValue(dailyQuizAttempts, topicKey) || getNumericValue(dailyQuizAttempts, topic) || 0;
              const dailyQuizAvgScore = getScoreValue(dailyQuizAvgScores, topicKey) ?? getScoreValue(dailyQuizAvgScores, topic);
              
              const fortNightCount = getNumericValue(fortNightExamCounts, topicKey) || getNumericValue(fortNightExamCounts, topic) || 0;
              const fortNightAttempt = getNumericValue(fortNightExamAttempts, topicKey) || getNumericValue(fortNightExamAttempts, topic) || 0;
              const fortNightAvgScore = getScoreValue(fortNightExamAvgScores, topicKey) ?? getScoreValue(fortNightExamAvgScores, topic);
              
              const courseAttempt = getNumericValue(courseExamAttempts, topicKey) || getNumericValue(courseExamAttempts, topic) || 0;
              const courseScore = getScoreValue(courseExamScores, topicKey) ?? getScoreValue(courseExamScores, topic);
              
              // Determine overall status based on daily quiz avg score
              const status = getStatus(fortNightAvgScore)
              
              // Debug for this topic - show first 3 topics
              if (index < 3) {
                console.log(`Topic: ${topic} (key: ${topicKey})`, {
                  dailyQuizCounts_obj: dailyQuizCounts,
                  dailyQuizCounts_topicKey: dailyQuizCounts[topicKey],
                  dailyQuizCounts_topic: dailyQuizCounts[topic],
                  dailyQuizCount,
                  dailyQuizAttempt,
                  dailyQuizAvgScores_obj: dailyQuizAvgScores,
                  dailyQuizAvgScores_topicKey: dailyQuizAvgScores[topicKey],
                  dailyQuizAvgScores_topic: dailyQuizAvgScores[topic],
                  dailyQuizAvgScore,
                  fortNightCount,
                  fortNightAttempt,
                  fortNightAvgScore,
                  courseAttempt,
                  courseScore
                });
              }

              return (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${colorClass}`}></div>
                      <h4 className="text-lg font-semibold text-gray-900">{displayName}</h4>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Daily Quiz Section */}
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <h5 className="text-sm font-semibold text-gray-700 mb-3">DAILY QUIZ</h5>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Counts</p>
                        <p className="text-sm font-semibold text-gray-900">{dailyQuizCount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Attempts</p>
                        <p className="text-sm font-semibold text-gray-900">{dailyQuizAttempt}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Avg Score</p>
                        <p className={`text-sm font-semibold ${getScoreColor(dailyQuizAvgScore)}`}>
                          {formatScore(dailyQuizAvgScore) === 'N/A' ? 'N/A' : `${Math.round(formatScore(dailyQuizAvgScore))}%`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Fort Night Exam Section - Always show */}
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <h5 className="text-sm font-semibold text-gray-700 mb-3">FORT NIGHT EXAM</h5>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Counts</p>
                        <p className="text-sm font-semibold text-gray-900">{fortNightCount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Attempts</p>
                        <p className="text-sm font-semibold text-gray-900">{fortNightAttempt}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Avg Score</p>
                        <p className={`text-sm font-semibold ${getScoreColor(fortNightAvgScore)}`}>
                          {formatScore(fortNightAvgScore) === 'N/A' ? 'N/A' : `${Math.round(formatScore(fortNightAvgScore))}%`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Course Exam Section - Always show */}
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-3">COURSE EXAM</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Attempts</p>
                        <p className="text-sm font-semibold text-gray-900">{courseAttempt}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Score</p>
                        <p className={`text-sm font-semibold ${getScoreColor(courseScore, 'course')}`}>
                          {formatScore(courseScore) === 'N/A' ? 'N/A' : `${Math.round(formatScore(courseScore))}%`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify(reportData, null, 2)}
            </pre>
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

    // Extract attendance data - handle multiple field name variations
    const totalWorkingDays = reportData['total working days'] || reportData['Total Working Days'] || reportData.totalWorkingDays || {};
    const daysAttended = reportData['No of days attended'] || reportData['No Of Days Attended'] || reportData.daysAttended || reportData.noOfDaysAttended || {};
    const leavesTaken = reportData['No of leaves taken'] || reportData['No Of Leaves Taken'] || reportData.leavesTaken || reportData.noOfLeavesTaken || {};
    const monthlyPercentage = reportData['Montly Percentage'] || reportData['Monthly Percentage'] || reportData.monthlyPercentage || reportData.montlyPercentage || {};

    // Get all unique months from all data sources
    const allMonths = new Set([
      ...Object.keys(totalWorkingDays),
      ...Object.keys(daysAttended),
      ...Object.keys(leavesTaken),
      ...Object.keys(monthlyPercentage)
    ]);

    // Helper to get numeric value or 0
    const getNumericValue = (obj, key) => {
      if (!obj || typeof obj !== 'object') return 0;
      const val = obj[key];
      if (val === null || val === undefined || val === '') return 0;
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    };

    // Helper to get percentage value
    const getPercentage = (obj, key) => {
      if (!obj || typeof obj !== 'object') return null;
      const val = obj[key];
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

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <LuActivity className="mr-2" />
          Interactions Report
        </h3>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
            {JSON.stringify(reportData, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  // If detail view is shown, only show the detail view (sidebar remains visible via AdminLayout)
  if (showDetailView && selectedCandidate) {
    return (
      <div className="p-6">
        {/* Header with Back Button */}
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
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownloadData}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
            >
              <LuDownload className="w-4 h-4" />
              <span>Download Data</span>
            </button>
            <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium text-sm">
              Working
            </span>
          </div>
        </div>

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
        <div>
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 flex items-center justify-center">
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
