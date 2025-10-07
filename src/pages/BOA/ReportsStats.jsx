import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { LuTrendingUp, LuDownload, LuFilter, LuCalendar, LuUsers, LuFileSpreadsheet, LuEye, LuCheck, LuX } from 'react-icons/lu';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import moment from 'moment';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';

const ReportsStats = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedReport, setSelectedReport] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: moment().subtract(1, 'week').format('YYYY-MM-DD'),
    endDate: moment().format('YYYY-MM-DD')
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Real data for charts
  const [chartData, setChartData] = useState({
    joinersOverTime: [],
    examPerformance: [],
    departmentStats: [],
    trainerWorkload: []
  });

  const [stats, setStats] = useState({
    totalJoiners: 0,
    activeTrainees: 0,
    uploadedResults: 0,
    avgScore: 0
  });

  // Exam statistics data
  const [examStats, setExamStats] = useState({
    overall: {
      totalAttempts: 0,
      totalPassed: 0,
      overallPassRate: 0,
      overallAverageScore: 0
    },
    byExamType: {
      dailyQuizzes: [],
      fortnightExams: [],
      courseLevelExams: []
    },
    topPerformers: [],
    summary: {
      dailyQuizzes: { totalTypes: 0, totalAttempts: 0, averageScore: 0, passRate: 0 },
      fortnightExams: { totalTypes: 0, totalAttempts: 0, averageScore: 0, passRate: 0 },
      courseLevelExams: { totalTypes: 0, totalAttempts: 0, averageScore: 0, passRate: 0 }
    }
  });

  const [recentJoiners, setRecentJoiners] = useState([]);
  const [joinersStats, setJoinersStats] = useState({
    thisMonth: 0,
    active: 0,
    pending: 0
  });

  // Fetch exam statistics data
  const fetchExamStatistics = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedPeriod === 'custom') {
        params.append('startDate', dateRange.startDate);
        params.append('endDate', dateRange.endDate);
      } else {
        // Calculate date range based on selected period
        const now = moment();
        let startDate, endDate;
        
        switch (selectedPeriod) {
          case 'week':
            startDate = now.clone().subtract(1, 'week');
            endDate = now;
            break;
          case 'month':
            startDate = now.clone().subtract(1, 'month');
            endDate = now;
            break;
          case 'quarter':
            startDate = now.clone().subtract(3, 'months');
            endDate = now;
            break;
          case 'year':
            startDate = now.clone().subtract(1, 'year');
            endDate = now;
            break;
          default:
            startDate = now.clone().subtract(1, 'week');
            endDate = now;
        }
        
        params.append('startDate', startDate.format('YYYY-MM-DD'));
        params.append('endDate', endDate.format('YYYY-MM-DD'));
      }

      const response = await axiosInstance.get(`${API_PATHS.RESULTS.STATISTICS}?${params.toString()}`);
      
      if (response.data.success) {
        setExamStats(response.data.statistics);
        
        // Update chart data for exam performance
        const examPerformanceData = [
          {
            examType: 'Daily Quizzes',
            average: response.data.statistics.summary.dailyQuizzes.averageScore,
            total: response.data.statistics.summary.dailyQuizzes.totalAttempts,
            passRate: response.data.statistics.summary.dailyQuizzes.passRate
          },
          {
            examType: 'Fortnight Exams',
            average: response.data.statistics.summary.fortnightExams.averageScore,
            total: response.data.statistics.summary.fortnightExams.totalAttempts,
            passRate: response.data.statistics.summary.fortnightExams.passRate
          },
          {
            examType: 'Course-Level Exams',
            average: response.data.statistics.summary.courseLevelExams.averageScore,
            total: response.data.statistics.summary.courseLevelExams.totalAttempts,
            passRate: response.data.statistics.summary.courseLevelExams.passRate
          }
        ];

        setChartData(prev => ({
          ...prev,
          examPerformance: examPerformanceData
        }));

        // Update stats
        setStats(prev => ({
          ...prev,
          uploadedResults: response.data.statistics.overall.totalAttempts,
          avgScore: response.data.statistics.overall.overallAverageScore
        }));
      }
    } catch (error) {
      console.error('Error fetching exam statistics:', error);
      // Set fallback data on error
      setExamStats({
        overall: { totalAttempts: 0, totalPassed: 0, overallPassRate: 0, overallAverageScore: 0 },
        byExamType: { dailyQuizzes: [], fortnightExams: [], courseLevelExams: [] },
        topPerformers: [],
        summary: {
          dailyQuizzes: { totalTypes: 0, totalAttempts: 0, averageScore: 0, passRate: 0 },
          fortnightExams: { totalTypes: 0, totalAttempts: 0, averageScore: 0, passRate: 0 },
          courseLevelExams: { totalTypes: 0, totalAttempts: 0, averageScore: 0, passRate: 0 }
        }
      });
    }
  };

  // Fetch joiners data
  const fetchJoinersData = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.USERS.LIST, {
        params: { role: 'trainee' }
      });
      
      const trainees = response.data.users || response.data || [];
      const now = moment();
      const startOfMonth = now.clone().startOf('month');
      
      // Filter for this month's joiners
      const thisMonthJoiners = trainees.filter(trainee => {
        const joiningDate = moment(trainee.joiningDate || trainee.createdAt);
        return joiningDate.isSameOrAfter(startOfMonth, 'day');
      });
      
      // Calculate stats
      const activeTrainees = trainees.filter(trainee => trainee.isActive !== false).length;
      const pendingTrainees = trainees.filter(trainee => !trainee.assignedTrainer).length;
      
      setJoinersStats({
        thisMonth: thisMonthJoiners.length,
        active: activeTrainees,
        pending: pendingTrainees
      });
      
      // Set recent joiners (last 10)
      const recentJoinersData = trainees
        .sort((a, b) => new Date(b.joiningDate || b.createdAt) - new Date(a.joiningDate || a.createdAt))
        .slice(0, 10)
        .map(trainee => ({
          id: trainee._id,
          name: trainee.name,
          email: trainee.email,
          department: trainee.department || 'N/A',
          joiningDate: trainee.joiningDate || trainee.createdAt,
          status: trainee.assignedTrainer ? 'Active' : 'Pending',
          employeeId: trainee.employeeId || 'N/A'
        }));
      
      setRecentJoiners(recentJoinersData);
    } catch (error) {
      console.error('Error fetching joiners data:', error);
      // Set fallback data
      setJoinersStats({
        thisMonth: 0,
        active: 0,
        pending: 0
      });
      setRecentJoiners([]);
    }
  };

  // Fetch data based on selected period and date range
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch exam statistics
      await fetchExamStatistics();
      // Calculate date range based on selected period
      let startDate, endDate;
      const now = moment();
      
      switch (selectedPeriod) {
        case 'week':
          startDate = now.clone().subtract(1, 'week');
          endDate = now;
          break;
        case 'month':
          startDate = now.clone().subtract(1, 'month');
          endDate = now;
          break;
        case 'quarter':
          startDate = now.clone().subtract(3, 'months');
          endDate = now;
          break;
        case 'year':
          startDate = now.clone().subtract(1, 'year');
          endDate = now;
          break;
        case 'custom':
          startDate = moment(dateRange.startDate);
          endDate = moment(dateRange.endDate);
          break;
        default:
          startDate = now.clone().subtract(1, 'week');
          endDate = now;
      }

      // Fetch trainees data
      const traineesResponse = await axiosInstance.get(API_PATHS.USERS.LIST, {
        params: { role: 'trainee' }
      });
      
      const trainees = traineesResponse.data.users || traineesResponse.data || [];
      
      // Filter trainees by date range
      const filteredTrainees = trainees.filter(trainee => {
        const traineeDate = moment(trainee.joiningDate || trainee.createdAt);
        return traineeDate.isBetween(startDate, endDate, 'day', '[]');
      });

      // Calculate joiners over time (group by month)
      const joinersOverTime = [];
      let current = startDate.clone();
      
      while (current.isSameOrBefore(endDate, 'month')) {
        const monthKey = current.format('MMM');
        const monthTrainees = filteredTrainees.filter(trainee => {
          const traineeDate = moment(trainee.joiningDate || trainee.createdAt);
          return traineeDate.isSame(current, 'month');
        });
        
        joinersOverTime.push({
          month: monthKey,
          joiners: monthTrainees.length,
          active: monthTrainees.filter(t => t.isActive !== false).length
        });
        
        current.add(1, 'month');
      }

      // If no data for the period, show at least one month
      if (joinersOverTime.length === 0) {
        joinersOverTime.push({
          month: startDate.format('MMM'),
          joiners: 0,
          active: 0
        });
      }

      // Calculate department statistics
      const departmentCounts = {};
      filteredTrainees.forEach(trainee => {
        const dept = trainee.department || 'Other';
        departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
      });

      const departmentStats = Object.entries(departmentCounts).map(([name, value], index) => ({
        name,
        value,
        color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'][index % 6]
      }));

      // If no department data, show placeholder
      if (departmentStats.length === 0) {
        departmentStats.push({
          name: 'No Data',
          value: 1,
          color: '#E5E7EB'
        });
      }

      // Fetch trainers data
      const trainersResponse = await axiosInstance.get(API_PATHS.USERS.LIST, {
        params: { role: 'trainer' }
      });
      
      const trainers = trainersResponse.data.users || trainersResponse.data || [];
      
      // Calculate trainer workload
      const trainerWorkload = trainers.map(trainer => {
        const assignedTrainees = trainees.filter(trainee => 
          trainee.assignedTrainer === trainer._id || 
          (trainer.assignedTrainees && trainer.assignedTrainees.includes(trainee._id))
        ).length;
        
        return {
          trainer: trainer.name,
          trainees: assignedTrainees,
          maxCapacity: 50, // Default max capacity
          utilization: Math.round((assignedTrainees / 50) * 100)
        };
      });

      // Update chart data
      setChartData({
        joinersOverTime,
        examPerformance: [
          { examType: 'Daily Quiz', average: 78, total: 45 },
          { examType: 'Fortnight', average: 82, total: 23 },
          { examType: 'Course-Level', average: 75, total: 12 }
        ],
        departmentStats,
        trainerWorkload
      });

      // Update stats
      setStats({
        totalJoiners: filteredTrainees.length,
        activeTrainees: filteredTrainees.filter(t => t.isActive !== false).length,
        uploadedResults: 0, // This would need a separate API for exam results
        avgScore: 78 // This would need a separate API for exam results
      });

    } catch (error) {
      console.error('Error fetching reports data:', error);
      // Set fallback data on error - show sample data for demonstration
      setChartData({
        joinersOverTime: [
          { month: 'Jan', joiners: 5, active: 4 },
          { month: 'Feb', joiners: 8, active: 7 },
          { month: 'Mar', joiners: 12, active: 10 },
          { month: 'Apr', joiners: 6, active: 5 },
          { month: 'May', joiners: 9, active: 8 }
        ],
        examPerformance: [
          { examType: 'Daily Quiz', average: 78, total: 45 },
          { examType: 'Fortnight', average: 82, total: 23 },
          { examType: 'Course-Level', average: 75, total: 12 }
        ],
        departmentStats: [
          { name: 'IT', value: 15, color: '#3B82F6' },
          { name: 'HR', value: 8, color: '#10B981' },
          { name: 'Finance', value: 6, color: '#F59E0B' },
          { name: 'Marketing', value: 4, color: '#EF4444' }
        ],
        trainerWorkload: [
          { trainer: 'Yaswanth', trainees: 8, maxCapacity: 10, utilization: 80 },
          { trainer: 'Manikanta', trainees: 6, maxCapacity: 10, utilization: 60 },
          { trainer: 'Saikuma', trainees: 4, maxCapacity: 10, utilization: 40 }
        ]
      });
      setStats({
        totalJoiners: 40,
        activeTrainees: 34,
        uploadedResults: 80,
        avgScore: 78
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedPeriod, dateRange]);

  useEffect(() => {
    if (selectedReport === 'joiners') {
      fetchJoinersData();
    }
  }, [selectedReport]);

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDatePicker && !event.target.closest('.date-picker-container')) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker]);

  // Initialize with some sample data if no data is available
  useEffect(() => {
    if (chartData.joinersOverTime.length === 0 && !loading) {
      setChartData(prev => ({
        ...prev,
        joinersOverTime: [
          { month: 'Jan', joiners: 0, active: 0 },
          { month: 'Feb', joiners: 0, active: 0 },
          { month: 'Mar', joiners: 0, active: 0 }
        ],
        departmentStats: [
          { name: 'No Data', value: 1, color: '#E5E7EB' }
        ]
      }));
    }
  }, [loading]);

  const periods = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    if (period !== 'custom') {
      // Reset to default date range for predefined periods
      const now = moment();
      let startDate, endDate;
      
      switch (period) {
        case 'week':
          startDate = now.clone().subtract(1, 'week');
          endDate = now;
          break;
        case 'month':
          startDate = now.clone().subtract(1, 'month');
          endDate = now;
          break;
        case 'quarter':
          startDate = now.clone().subtract(3, 'months');
          endDate = now;
          break;
        case 'year':
          startDate = now.clone().subtract(1, 'year');
          endDate = now;
          break;
      }
      
      setDateRange({
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD')
      });
    }
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const reports = [
    { value: 'overview', label: 'Overview', icon: LuTrendingUp },
    { value: 'joiners', label: 'New Joiners', icon: LuUsers },
    { value: 'exams', label: 'Exam Results', icon: LuFileSpreadsheet },
    { value: 'trainers', label: 'Trainer Performance', icon: LuTrendingUp }
  ];

  // Fetch joiners data for download
  const fetchJoinersForDownload = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.JOINERS.GET_ALL);
      return response.data.joiners || [];
    } catch (error) {
      console.error('Error fetching joiners data:', error);
      return [];
    }
  };

  // Fetch working trainees data
  const fetchTraineesData = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);
      const trainees = response.data.users.filter(user => user.role === 'trainee');
      return trainees;
    } catch (error) {
      console.error('Error fetching trainees data:', error);
      return [];
    }
  };

  // Fetch detailed joiners data for New Joiners tab
  const fetchDetailedJoinersData = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);
      const joiners = response.data.users.filter(user => user.role === 'trainee');
      
      // Sort by joining date (newest first)
      return joiners.sort((a, b) => {
        const dateA = new Date(a.joiningDate || a.createdAt);
        const dateB = new Date(b.joiningDate || b.createdAt);
        return dateB - dateA;
      });
    } catch (error) {
      console.error('Error fetching detailed joiners data:', error);
      return [];
    }
  };

  // Fetch exam results data for Exam Results tab
  const fetchExamResultsData = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.RESULTS.GET_ALL);
      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching exam results data:', error);
      return [];
    }
  };

  // Generate CSV for joiners data
  const generateJoinersCSV = (data) => {
    const headers = [
      'Author ID',
      'Name',
      'Email',
      'Phone',
      'Department',
      'Designation',
      'Joining Date',
      'Status',
      'Created At'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(joiner => [
        joiner.author_id || '',
        `"${joiner.name || ''}"`,
        joiner.email || '',
        joiner.phone || '',
        `"${joiner.department || ''}"`,
        `"${joiner.designation || ''}"`,
        joiner.joining_date || '',
        joiner.status || '',
        joiner.created_at || ''
      ].join(','))
    ].join('\n');

    return csvContent;
  };

  // Generate CSV for trainees data
  const generateTraineesCSV = (data) => {
    const headers = [
      'Author ID',
      'Name',
      'Email',
      'Phone',
      'Department',
      'Designation',
      'Assigned Trainer',
      'Status',
      'Created At',
      'Last Login'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(trainee => [
        trainee.author_id || '',
        `"${trainee.name || ''}"`,
        trainee.email || '',
        trainee.phone || '',
        `"${trainee.department || ''}"`,
        `"${trainee.designation || ''}"`,
        trainee.assignedTrainer || 'Not Assigned',
        trainee.status || 'active',
        trainee.created_at || '',
        trainee.last_login || 'Never'
      ].join(','))
    ].join('\n');

    return csvContent;
  };

  // Generate CSV for detailed joiners data (New Joiners tab)
  const generateDetailedJoinersCSV = (data) => {
    const headers = [
      'Author ID',
      'Name',
      'Email',
      'Phone',
      'Department',
      'Designation',
      'Joining Date',
      'Status',
      'Assigned Trainer',
      'Created At',
      'Last Login'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(joiner => [
        joiner.author_id || '',
        `"${joiner.name || ''}"`,
        joiner.email || '',
        joiner.phone || '',
        `"${joiner.department || ''}"`,
        `"${joiner.designation || ''}"`,
        joiner.joiningDate || joiner.createdAt || '',
        joiner.status || 'active',
        joiner.assignedTrainer || 'Not Assigned',
        joiner.createdAt || '',
        joiner.last_login || 'Never'
      ].join(','))
    ].join('\n');

    return csvContent;
  };

  // Generate CSV for exam results data (Exam Results tab)
  const generateExamResultsCSV = (data) => {
    const headers = [
      'Result ID',
      'Trainee Name',
      'Trainee ID',
      'Exam Type',
      'Score',
      'Total Marks',
      'Percentage',
      'Status',
      'Exam Date',
      'Uploaded At',
      'Uploaded By'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(result => [
        result._id || '',
        `"${result.trainee_name || ''}"`,
        result.author_id || '',
        result.exam_type || '',
        result.score || 0,
        result.total_marks || 0,
        result.percentage || 0,
        result.status || '',
        result.exam_date || '',
        result.uploaded_at || '',
        `"${result.uploaded_by || ''}"`
      ].join(','))
    ].join('\n');

    return csvContent;
  };

  // Download CSV file
  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle download report
  const handleDownloadReport = async (reportType) => {
    if (reportType === 'overview') {
      setShowDownloadModal(true);
    } else if (reportType === 'joiners') {
      // Download New Joiners data directly
      setDownloading(true);
      try {
        const data = await fetchDetailedJoinersData();
        const filename = `New_Joiners_Data_${moment().format('YYYY-MM-DD')}.csv`;
        const csvContent = generateDetailedJoinersCSV(data);
        downloadCSV(csvContent, filename);
      } catch (error) {
        console.error('Error downloading joiners data:', error);
      } finally {
        setDownloading(false);
      }
    } else if (reportType === 'exams') {
      // Download Exam Results data directly
      setDownloading(true);
      try {
        const data = await fetchExamResultsData();
        const filename = `Exam_Results_Data_${moment().format('YYYY-MM-DD')}.csv`;
        const csvContent = generateExamResultsCSV(data);
        downloadCSV(csvContent, filename);
      } catch (error) {
        console.error('Error downloading exam results data:', error);
      } finally {
        setDownloading(false);
      }
    } else {
      // For other report types, implement as needed
      console.log('Download report for:', reportType);
    }
  };

  // Handle download selection
  const handleDownloadSelection = async (dataType) => {
    setDownloading(true);
    try {
      let data, filename, csvContent;
      
      if (dataType === 'joiners') {
        data = await fetchJoinersForDownload();
        filename = `Total_Joiners_Data_${moment().format('YYYY-MM-DD')}.csv`;
        csvContent = generateJoinersCSV(data);
      } else if (dataType === 'trainees') {
        data = await fetchTraineesData();
        filename = `Working_Trainees_Data_${moment().format('YYYY-MM-DD')}.csv`;
        csvContent = generateTraineesCSV(data);
      }
      
      downloadCSV(csvContent, filename);
      setShowDownloadModal(false);
    } catch (error) {
      console.error('Error downloading data:', error);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout activeMenu="Reports & Stats">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeMenu="Reports & Stats">
      <div className="mt-5 mb-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Reports & Statistics</h2>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4 md:mt-0">
            <div className="relative flex items-center space-x-2 date-picker-container">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="cursor-pointer flex items-center space-x-2 border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <LuCalendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">
                  {selectedPeriod === 'custom' 
                    ? `${moment(dateRange.startDate).format('MMM DD')} - ${moment(dateRange.endDate).format('MMM DD')}`
                    : periods.find(p => p.value === selectedPeriod)?.label
                  }
                </span>
              </button>
              
              {/* Date Picker Popup */}
              {showDatePicker && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-4 min-w-[300px]">
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900">Select Date Range</h3>
                    
                    {/* Period Selection */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Quick Select</label>
                      <div className="grid grid-cols-2 gap-2">
                        {periods.filter(p => p.value !== 'custom').map(period => (
                          <button
                            key={period.value}
                            onClick={() => {
                              handlePeriodChange(period.value);
                              setShowDatePicker(false);
                            }}
                            className={`cursor-pointer px-3 py-2 text-xs rounded-lg border transition-colors ${
                              selectedPeriod === period.value
                                ? 'bg-blue-100 border-blue-300 text-blue-700'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {period.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Custom Date Range */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Custom Range</label>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                          <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">End Date</label>
                          <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <button
                          onClick={() => {
                            setSelectedPeriod('custom');
                            setShowDatePicker(false);
                          }}
                          className="cursor-pointer w-full px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Apply Custom Range
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-2 border-t">
                      <button
                        onClick={() => setShowDatePicker(false)}
                        className="cursor-pointer px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={fetchData}
                disabled={loading}
                className="cursor-pointer flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <LuFilter className="w-4 h-4" />
                <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              
              <button
                onClick={() => handleDownloadReport(selectedReport)}
                disabled={downloading}
                className="cursor-pointer flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LuDownload className="w-4 h-4" />
                <span>{downloading ? 'Downloading...' : 'Download Report'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Report Type Tabs */}
        <div className="card mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {reports.map((report) => {
                const Icon = report.icon;
                return (
                  <button
                    key={report.value}
                    onClick={() => setSelectedReport(report.value)}
                    className={`cursor-pointer py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap ${
                      selectedReport === report.value
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{report.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Overview Report */}
        {selectedReport === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Joiners</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.totalJoiners}</p>
                    <p className="text-xs text-gray-500">
                      {selectedPeriod === 'custom' 
                        ? `${moment(dateRange.startDate).format('MMM DD')} - ${moment(dateRange.endDate).format('MMM DD')}`
                        : `In ${periods.find(p => p.value === selectedPeriod)?.label.toLowerCase()}`
                      }
                    </p>
                  </div>
                  <LuUsers className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Working Trainees</p>
                    <p className="text-2xl font-bold text-green-600">{stats.activeTrainees}</p>
                    <p className="text-xs text-gray-500">
                      {stats.totalJoiners > 0 
                        ? `${Math.round((stats.activeTrainees / stats.totalJoiners) * 100)}% of total joiners`
                        : 'No data available'
                      }
                    </p>
                  </div>
                  <LuTrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Exams Conducted</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.uploadedResults}</p>
                    <p className="text-xs text-gray-500">Coming soon</p>
                  </div>
                  <LuFileSpreadsheet className="w-8 h-8 text-purple-500" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg. Score</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.avgScore}%</p>
                    <p className="text-xs text-gray-500">Coming soon</p>
                  </div>
                  <LuTrendingUp className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Joiners Over Time</h3>
                {loading ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading chart data...</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.joinersOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="joiners" fill="#3B82F6" name="New Joiners" />
                      <Bar dataKey="active" fill="#10B981" name="Working" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
                {/* Debug info */}
                <div className="mt-2 text-xs text-gray-500">
                  Data points: {chartData.joinersOverTime.length} | 
                  Period: {selectedPeriod} | 
                  Range: {selectedPeriod === 'custom' ? `${dateRange.startDate} to ${dateRange.endDate}` : 'Auto'}
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Distribution</h3>
                {loading ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading chart data...</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData.departmentStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.departmentStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {/* Debug info */}
                <div className="mt-2 text-xs text-gray-500">
                  Departments: {chartData.departmentStats.length} | 
                  Total: {chartData.departmentStats.reduce((sum, item) => sum + item.value, 0)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* New Joiners Report */}
        {selectedReport === 'joiners' && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Joiner Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{joinersStats.thisMonth}</p>
                  <p className="text-sm text-gray-600">This Month</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{joinersStats.active}</p>
                  <p className="text-sm text-gray-600">Active</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{joinersStats.pending}</p>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Joiners</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Department</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Joining Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentJoiners.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-8 text-gray-500">
                          No recent joiners found
                        </td>
                      </tr>
                    ) : (
                      recentJoiners.map((joiner) => (
                        <tr key={joiner.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-xs">
                                  {joiner.name?.split(' ').map(n => n[0]).join('') || 'U'}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{joiner.name}</p>
                                <p className="text-sm text-gray-500">{joiner.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{joiner.department}</td>
                          <td className="py-3 px-4 text-gray-600">
                            {moment(joiner.joiningDate).format('MMM DD, YYYY')}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              joiner.status === 'Active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {joiner.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button className="text-blue-600 hover:text-blue-800">
                              <LuEye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Exam Results Report */}
        {selectedReport === 'exams' && (
          <div className="space-y-6">
            {/* Overall Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Attempts</p>
                    <p className="text-2xl font-bold text-blue-600">{examStats.overall.totalAttempts}</p>
                  </div>
                  <LuFileSpreadsheet className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Passed Attempts</p>
                    <p className="text-2xl font-bold text-green-600">{examStats.overall.totalPassed}</p>
                  </div>
                  <LuCheck className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Overall Pass Rate</p>
                    <p className="text-2xl font-bold text-purple-600">{examStats.overall.overallPassRate}%</p>
                  </div>
                  <LuTrendingUp className="w-8 h-8 text-purple-500" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Score</p>
                    <p className="text-2xl font-bold text-orange-600">{examStats.overall.overallAverageScore}%</p>
                  </div>
                  <LuTrendingUp className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            </div>

            {/* Exam Performance Chart */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Exam Performance Overview</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.examPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="examType" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="average" fill="#3B82F6" name="Average Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Detailed Exam Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Daily Quizzes */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Quizzes</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Total Types</span>
                    <span className="text-sm font-bold text-blue-600">{examStats.summary.dailyQuizzes.totalTypes}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Total Attempts</span>
                    <span className="text-sm font-bold text-blue-600">{examStats.summary.dailyQuizzes.totalAttempts}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Average Score</span>
                    <span className="text-sm font-bold text-blue-600">{examStats.summary.dailyQuizzes.averageScore}%</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Pass Rate</span>
                    <span className="text-sm font-bold text-blue-600">{examStats.summary.dailyQuizzes.passRate}%</span>
                  </div>
                </div>
                
                {/* Individual Daily Quizzes */}
                {examStats.byExamType.dailyQuizzes.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Individual Quizzes</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {examStats.byExamType.dailyQuizzes.map((quiz, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded text-xs">
                          <span className="font-medium">{quiz.examType}</span>
                          <div className="flex space-x-2">
                            <span className="text-gray-600">{quiz.averageScore}%</span>
                            <span className="text-gray-500">({quiz.totalAttempts})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Fortnight Exams */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Fortnight Exams</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Total Types</span>
                    <span className="text-sm font-bold text-green-600">{examStats.summary.fortnightExams.totalTypes}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Total Attempts</span>
                    <span className="text-sm font-bold text-green-600">{examStats.summary.fortnightExams.totalAttempts}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Average Score</span>
                    <span className="text-sm font-bold text-green-600">{examStats.summary.fortnightExams.averageScore}%</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Pass Rate</span>
                    <span className="text-sm font-bold text-green-600">{examStats.summary.fortnightExams.passRate}%</span>
                  </div>
                </div>
                
                {/* Individual Fortnight Exams */}
                {examStats.byExamType.fortnightExams.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Individual Exams</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {examStats.byExamType.fortnightExams.map((exam, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded text-xs">
                          <span className="font-medium">{exam.examType}</span>
                          <div className="flex space-x-2">
                            <span className="text-gray-600">{exam.averageScore}%</span>
                            <span className="text-gray-500">({exam.totalAttempts})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Course-Level Exams */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Course-Level Exams</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Total Types</span>
                    <span className="text-sm font-bold text-purple-600">{examStats.summary.courseLevelExams.totalTypes}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Total Attempts</span>
                    <span className="text-sm font-bold text-purple-600">{examStats.summary.courseLevelExams.totalAttempts}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Average Score</span>
                    <span className="text-sm font-bold text-purple-600">{examStats.summary.courseLevelExams.averageScore}%</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Pass Rate</span>
                    <span className="text-sm font-bold text-purple-600">{examStats.summary.courseLevelExams.passRate}%</span>
                  </div>
                </div>
                
                {/* Individual Course-Level Exams */}
                {examStats.byExamType.courseLevelExams.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Individual Exams</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {examStats.byExamType.courseLevelExams.map((exam, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded text-xs">
                          <span className="font-medium">{exam.examType}</span>
                          <div className="flex space-x-2">
                            <span className="text-gray-600">{exam.averageScore}%</span>
                            <span className="text-gray-500">({exam.totalAttempts})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Top Performers */}
            {examStats.topPerformers.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Rank</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Trainee</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Average Score</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Total Attempts</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Passed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examStats.topPerformers.map((performer, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              index === 0 ? 'bg-yellow-100 text-yellow-800' :
                              index === 1 ? 'bg-gray-100 text-gray-800' :
                              index === 2 ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-50 text-gray-600'
                            }`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-900">{performer.name}</td>
                          <td className="py-3 px-4">
                            <span className="text-lg font-bold text-green-600">{performer.averageScore}%</span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{performer.totalAttempts}</td>
                          <td className="py-3 px-4 text-gray-600">{performer.passedAttempts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Trainer Performance Report */}
        {selectedReport === 'trainers' && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trainer Workload</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Trainer</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Assigned Trainees</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Capacity</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Utilization</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.trainerWorkload.map((trainer, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 px-4 font-medium text-gray-900">{trainer.trainer}</td>
                        <td className="py-3 px-4">{trainer.trainees}</td>
                        <td className="py-3 px-4">{trainer.maxCapacity}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${trainer.utilization}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{trainer.utilization}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            trainer.utilization >= 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {trainer.utilization >= 80 ? 'Excellent' : 'Good'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Download Modal */}
        {showDownloadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Download Report</h3>
                <button
                  onClick={() => setShowDownloadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <LuX className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-gray-600 mb-6">
                Choose which data you want to download:
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleDownloadSelection('joiners')}
                  disabled={downloading}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LuUsers className="w-5 h-5" />
                  <span>{downloading ? 'Downloading...' : 'Total Joiners Data'}</span>
                </button>
                
                <button
                  onClick={() => handleDownloadSelection('trainees')}
                  disabled={downloading}
                  className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LuUsers className="w-5 h-5" />
                  <span>{downloading ? 'Downloading...' : 'Working Trainees Data'}</span>
                </button>
              </div>
              
              <div className="mt-4 text-sm text-gray-500">
                <p>• Total Joiners Data: All people who have joined the program</p>
                <p>• Working Trainees Data: Currently active trainees</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReportsStats;
