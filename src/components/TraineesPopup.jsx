import React, { useState, useEffect, useMemo } from 'react';
import { LuX, LuSearch, LuClock, LuUser, LuMail, LuIdCard, LuUserCheck, LuLoader, LuCalendar, LuUsers, LuCheck } from 'react-icons/lu';
import moment from 'moment';
import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';
import { toast } from 'react-hot-toast';

const TraineesPopup = ({ isOpen, onClose, trainees = [], title = "Total Trainees", showAssignmentStatus = true, isLoading = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [expandedMonth, setExpandedMonth] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [reportType, setReportType] = useState(null); // 'attendance' or 'grooming'
  const [submitting, setSubmitting] = useState(false);
  const [traineeReportData, setTraineeReportData] = useState(null);
  const [groomingInputValue, setGroomingInputValue] = useState('');

  // Filter trainees based on search term - use useMemo to prevent infinite loops
  const filteredTrainees = useMemo(() => {
    if (!searchTerm.trim()) {
      return trainees;
    }
    return trainees.filter(trainee => 
      trainee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainee.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, trainees]);

  // Reset search when popup opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedTrainee(null);
      setShowReportModal(false);
      setExpandedMonth(null);
      setSelectedDate(null);
      setReportType(null);
      setGroomingInputValue('');
    }
  }, [isOpen]);

  // Fetch trainee report data when opening report modal
  useEffect(() => {
    if (showReportModal && selectedTrainee) {
      fetchTraineeReports();
    }
  }, [showReportModal, selectedTrainee]);

  const fetchTraineeReports = async () => {
    let authorId = selectedTrainee?.author_id;
    
    // If author_id is not available, try to fetch it using trainee _id
    if (!authorId && selectedTrainee?._id) {
      try {
        const userResponse = await axiosInstance.get(API_PATHS.USERS.GET_USER_BY_ID(selectedTrainee._id));
        authorId = userResponse.data?.author_id;
        // Update selectedTrainee with author_id if found
        if (authorId) {
          setSelectedTrainee({ ...selectedTrainee, author_id: authorId });
        }
      } catch (err) {
        console.error('Error fetching trainee author_id:', err);
      }
    }
    
    if (!authorId) {
      toast.error('Trainee author ID not found. Please ensure the trainee has an author_id.');
      setShowReportModal(false);
      return;
    }
    
    try {
      const response = await axiosInstance.get(API_PATHS.CANDIDATE_REPORTS.GET_PERFORMANCE(authorId));
      if (response.data.success) {
        setTraineeReportData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching trainee reports:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch trainee reports';
      toast.error(errorMessage);
      // If it's a "Trainee not found" error, it might be an authorization issue
      if (errorMessage.includes('not found') || errorMessage.includes('Trainee not found')) {
        toast.error('Unable to access trainee reports. Please ensure the trainee is properly assigned to you.');
        setShowReportModal(false);
      }
    }
  };

  const handleTraineeClick = async (trainee) => {
    // If author_id is missing, try to fetch it using the user ID endpoint
    if (!trainee.author_id && trainee._id) {
      try {
        const response = await axiosInstance.get(API_PATHS.USERS.GET_USER_BY_ID(trainee._id));
        if (response.data?.author_id) {
          setSelectedTrainee({ ...trainee, author_id: response.data.author_id });
        } else {
          setSelectedTrainee(trainee);
        }
      } catch (err) {
        console.error('Error fetching trainee author_id:', err);
        setSelectedTrainee(trainee);
      }
    } else {
      setSelectedTrainee(trainee);
    }
    setShowReportModal(true);
  };

  const handleMonthClick = (month) => {
    setExpandedMonth(expandedMonth === month ? null : month);
    setSelectedDate(null);
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getMonthDates = (monthName) => {
    const currentYear = new Date().getFullYear();
    const monthIndex = moment().month(monthName).month();
    const daysInMonth = getDaysInMonth(currentYear, monthIndex);
    const dates = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      dates.push(new Date(currentYear, monthIndex, day));
    }
    
    return dates;
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    // For grooming report, check if there's existing data for this date
    if (reportType === 'grooming' && traineeReportData?.groomingReport?.reportData) {
      const reportData = traineeReportData.groomingReport.reportData;
      const dateStr = moment(date).format('YYYY-MM-DD');
      
      // Find the grooming field name (handle variations)
      const findGroomingField = (variations) => {
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
      
      const groomingField = findGroomingField(['How many times missed grooming check list', 'missedGrooming']);
      const groomingData = reportData[groomingField];
      
      // Check if there's date-specific data stored (using YYYY-MM-DD format)
      if (groomingData && typeof groomingData === 'object' && groomingData[dateStr]) {
        setGroomingInputValue(groomingData[dateStr]);
      } else {
        setGroomingInputValue('');
      }
    } else {
      setGroomingInputValue('');
    }
  };

  const handleSubmitReport = async () => {
    const authorId = selectedTrainee?.author_id || selectedTrainee?._id;
    if (!authorId || !reportType || !selectedDate) {
      toast.error('Please select a date');
      return;
    }

    setSubmitting(true);
    try {
      const dateStr = moment(selectedDate).format('YYYY-MM-DD');
      const monthName = moment(selectedDate).format('MMMM');
      const monthKey = `${monthName} Month`;

      // Get current report data
      let currentReportData = {};
      if (reportType === 'attendance') {
        currentReportData = traineeReportData?.attendanceReport?.reportData || {};
      } else if (reportType === 'grooming') {
        currentReportData = traineeReportData?.groomingReport?.reportData || {};
      }

      // Update report data based on type
      let updatedReportData = { ...currentReportData };

      if (reportType === 'attendance') {
        // For attendance, we'll mark the date as attended
        if (!updatedReportData['No of days attended']) {
          updatedReportData['No of days attended'] = {};
        }
        if (!updatedReportData['No of days attended'][monthKey]) {
          updatedReportData['No of days attended'][monthKey] = 0;
        }
        updatedReportData['No of days attended'][monthKey] = 
          parseInt(updatedReportData['No of days attended'][monthKey]) + 1;

        // Update total working days if needed
        if (!updatedReportData['Total Working Days']) {
          updatedReportData['Total Working Days'] = {};
        }
        if (!updatedReportData['Total Working Days'][monthKey]) {
          updatedReportData['Total Working Days'][monthKey] = getDaysInMonth(
            selectedDate.getFullYear(),
            selectedDate.getMonth()
          );
        }

        // Calculate attendance percentage
        const workingDays = updatedReportData['Total Working Days'][monthKey] || 0;
        const attended = updatedReportData['No of days attended'][monthKey] || 0;
        if (workingDays > 0) {
          const percentage = Math.round((attended / workingDays) * 100);
          if (!updatedReportData['Monthly Percentage']) {
            updatedReportData['Monthly Percentage'] = {};
          }
          updatedReportData['Monthly Percentage'][monthKey] = percentage;
        }
      } else if (reportType === 'grooming') {
        // For grooming, store date-specific data
        const findGroomingField = (variations) => {
          for (const variation of variations) {
            if (updatedReportData[variation] !== undefined) {
              return variation;
            }
          }
          const lowerVariations = variations.map(v => v.toLowerCase().trim());
          for (const key in updatedReportData) {
            if (lowerVariations.includes(key.toLowerCase().trim())) {
              return key;
            }
          }
          return variations[0];
        };
        
        const groomingField = findGroomingField(['How many times missed grooming check list', 'missedGrooming']);
        if (!updatedReportData[groomingField]) {
          updatedReportData[groomingField] = {};
        }
        
        // Store the input value for this specific date (using YYYY-MM-DD format)
        const dateKey = dateStr; // Use YYYY-MM-DD format as key
        updatedReportData[groomingField][dateKey] = groomingInputValue.trim() || 'Dresscode Followed';
        
        // Also update the month summary for backward compatibility
        // Count how many dates have data in this month
        const monthDates = getMonthDates(expandedMonth);
        const monthDataCount = monthDates.filter(d => {
          const dStr = moment(d).format('YYYY-MM-DD');
          return updatedReportData[groomingField][dStr];
        }).length;
        
        // Update month summary
        if (monthDataCount > 0) {
          updatedReportData[groomingField][monthKey] = monthDataCount === monthDates.length 
            ? 'Dresscode Followed' 
            : `${monthDataCount} dates recorded`;
        }
      }

      // Update the report via API
      const authorId = selectedTrainee?.author_id || selectedTrainee?._id;
      const response = await axiosInstance.put(
        API_PATHS.CANDIDATE_REPORTS.UPDATE_REPORT(authorId, reportType),
        { reportData: updatedReportData }
      );

      if (response.data.success) {
        toast.success(`${reportType === 'attendance' ? 'Attendance' : 'Grooming'} report updated successfully`);
        // Refresh report data
        await fetchTraineeReports();
        // Reset selections
        setSelectedDate(null);
        setExpandedMonth(null);
        setGroomingInputValue('');
        // Signal to trainer dashboard that data has been updated
        const timestamp = Date.now().toString();
        localStorage.setItem('trainerDashboardRefresh', timestamp);
        window.dispatchEvent(new Event('trainerDashboardUpdated'));
        // Use BroadcastChannel for cross-tab communication
        try {
          const channel = new BroadcastChannel('trainerDashboardUpdates');
          channel.postMessage({ type: 'refresh', timestamp });
          channel.close();
        } catch (e) {
          localStorage.removeItem('trainerDashboardRefresh');
          localStorage.setItem('trainerDashboardRefresh', timestamp);
        }
      } else {
        toast.error('Failed to update report');
      }
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error(error.response?.data?.message || 'Failed to update report');
    } finally {
      setSubmitting(false);
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
        onClick={onClose}
      />
      
      {/* Popup */}
      <div className="relative w-1/4 h-full bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <LuX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="relative">
            <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Trainees List */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <LuLoader className="w-10 h-10 text-blue-500 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading {title}...</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">Please wait while we fetch the trainee data.</p>
            </div>
          ) : filteredTrainees.length === 0 ? (
            <div className="text-center py-8">
              <LuUserCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'No trainees found matching your search.' : 'No trainees available.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTrainees.map((trainee, index) => (
                <div 
                  key={trainee._id || index} 
                  onClick={() => handleTraineeClick(trainee)}
                  className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  {/* Profile Image */}
                  <div className="flex-shrink-0">
                    {trainee.profileImageUrl ? (
                      <img
                        src={trainee.profileImageUrl}
                        alt={trainee.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                        <LuUserCheck className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Trainee Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">
                      {trainee.name || 'Unknown Name'}
                    </h3>
                    
                    <div className="flex items-center space-x-1 text-xs text-gray-600 mb-1">
                      <LuMail className="w-3 h-3" />
                      <span className="truncate">{trainee.email || 'No email'}</span>
                    </div>

                    {/* Department */}
                    {trainee.department && (
                      <div className="flex items-center space-x-1 text-xs text-gray-600 mb-1">
                        <LuIdCard className="w-3 h-3" />
                        <span className="truncate">{trainee.department}</span>
                      </div>
                    )}

                    {/* Clock-in Status */}
                    <div className="flex items-center space-x-1">
                      <LuClock className="w-3 h-3 text-gray-400" />
                      {trainee.lastClockIn ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-green-600 font-medium">Clocked In</span>
                          <span className="text-xs text-gray-500">
                            at {moment(trainee.lastClockIn).format('HH:mm')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">Not clocked in</span>
                      )}
                    </div>

                    {/* Assignment Status */}
                    {showAssignmentStatus && (
                      <div className="mt-1">
                        {title === "Assigned Trainees" ? (
                          // If this is from the trainer dashboard, these trainees are assigned to the current trainer
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-blue-600 font-medium">Assigned</span>
                            <span className="text-xs text-gray-500">
                              to Current Trainer
                            </span>
                          </div>
                        ) : trainee.assignedTrainer ? (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-blue-600 font-medium">Assigned</span>
                            <span className="text-xs text-gray-500">
                              to {trainee.assignedTrainer.name || 'Trainer'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-orange-600 font-medium">Unassigned</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status Indicator */}
                  <div className="flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full ${
                      trainee.lastClockIn ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            Showing {filteredTrainees.length} of {trainees.length} trainees
          </p>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && selectedTrainee && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => {
              setShowReportModal(false);
              setSelectedTrainee(null);
              setExpandedMonth(null);
              setSelectedDate(null);
              setReportType(null);
            }}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedTrainee.name || 'Trainee'} - Reports
                </h2>
                <p className="text-sm text-gray-500 mt-1">{selectedTrainee.email}</p>
              </div>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setSelectedTrainee(null);
                  setExpandedMonth(null);
                  setSelectedDate(null);
                  setReportType(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <LuX className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Attendance Report Section */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <LuCalendar className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Attendance Report</h3>
                  </div>
                  
                  {!reportType || reportType === 'attendance' ? (
                    <>
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-3">Select a month to view dates:</p>
                        <div className="grid grid-cols-3 gap-2">
                          {months.map((month) => (
                            <button
                              key={month}
                              onClick={() => {
                                setReportType('attendance');
                                handleMonthClick(month);
                              }}
                              className={`p-2 text-sm rounded-lg border transition-colors ${
                                expandedMonth === month && reportType === 'attendance'
                                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {month}
                            </button>
                          ))}
                        </div>
                      </div>

                      {expandedMonth && reportType === 'attendance' && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-3">
                            Select a date in {expandedMonth}:
                          </p>
                          <div className="grid grid-cols-7 gap-2 max-h-64 overflow-y-auto">
                            {getMonthDates(expandedMonth).map((date, idx) => {
                              const dateStr = moment(date).format('YYYY-MM-DD');
                              const isSelected = selectedDate && moment(selectedDate).format('YYYY-MM-DD') === dateStr;
                              const isPastOrToday = moment(date).isSameOrBefore(moment(), 'day');
                              const isToday = moment(date).isSame(moment(), 'day');
                              
                              return (
                                <button
                                  key={idx}
                                  onClick={() => isPastOrToday && handleDateSelect(date)}
                                  disabled={!isPastOrToday}
                                  className={`p-2 text-xs rounded border transition-colors ${
                                    isSelected
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : isPastOrToday
                                      ? 'bg-white border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300'
                                      : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                  } ${isToday ? 'ring-2 ring-blue-400' : ''}`}
                                >
                                  {date.getDate()}
                                </button>
                              );
                            })}
                          </div>
                          
                          {selectedDate && (
                            <div className="mt-4 flex items-center justify-between">
                              <p className="text-sm text-gray-600">
                                Selected: {moment(selectedDate).format('MMMM DD, YYYY')}
                              </p>
                              <button
                                onClick={handleSubmitReport}
                                disabled={submitting}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                              >
                                {submitting ? (
                                  <>
                                    <LuLoader className="w-4 h-4 animate-spin" />
                                    Submitting...
                                  </>
                                ) : (
                                  <>
                                    <LuCheck className="w-4 h-4" />
                                    Submit Attendance
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">Click to select attendance date</p>
                  )}
                </div>

                {/* Grooming Report Section */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <LuUsers className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Grooming Report</h3>
                  </div>
                  
                  {!reportType || reportType === 'grooming' ? (
                    <>
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-3">Select a month:</p>
                        <div className="grid grid-cols-3 gap-2">
                          {months.map((month) => (
                            <button
                              key={month}
                              onClick={() => {
                                setReportType('grooming');
                                handleMonthClick(month);
                              }}
                              className={`p-2 text-sm rounded-lg border transition-colors ${
                                expandedMonth === month && reportType === 'grooming'
                                  ? 'bg-green-50 border-green-500 text-green-700'
                                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {month}
                            </button>
                          ))}
                        </div>
                      </div>

                      {expandedMonth && reportType === 'grooming' && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-3">
                            Select a date in {expandedMonth}:
                          </p>
                          <div className="grid grid-cols-7 gap-2 max-h-64 overflow-y-auto">
                            {getMonthDates(expandedMonth).map((date, idx) => {
                              const dateStr = moment(date).format('YYYY-MM-DD');
                              const isSelected = selectedDate && moment(selectedDate).format('YYYY-MM-DD') === dateStr;
                              const isPastOrToday = moment(date).isSameOrBefore(moment(), 'day');
                              const isToday = moment(date).isSame(moment(), 'day');
                              
                              // Check if this date has existing grooming data
                              let hasData = false;
                              if (traineeReportData?.groomingReport?.reportData) {
                                const reportData = traineeReportData.groomingReport.reportData;
                                const findGroomingField = (variations) => {
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
                                const groomingField = findGroomingField(['How many times missed grooming check list', 'missedGrooming']);
                                const groomingData = reportData[groomingField];
                                if (groomingData && typeof groomingData === 'object' && groomingData[dateStr]) {
                                  hasData = true;
                                }
                              }
                              
                              return (
                                <button
                                  key={idx}
                                  onClick={() => isPastOrToday && handleDateSelect(date)}
                                  disabled={!isPastOrToday}
                                  className={`p-2 text-xs rounded border transition-colors relative ${
                                    isSelected
                                      ? 'bg-green-600 text-white border-green-600'
                                      : isPastOrToday
                                      ? hasData
                                        ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-300'
                                      : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                  } ${isToday ? 'ring-2 ring-green-400' : ''}`}
                                  title={hasData ? 'Has grooming data' : ''}
                                >
                                  {date.getDate()}
                                  {hasData && !isSelected && (
                                    <span className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full"></span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          
                          {selectedDate && (
                            <div className="mt-4 space-y-3">
                              <p className="text-sm text-gray-600">
                                Selected: {moment(selectedDate).format('MMMM DD, YYYY')}
                              </p>
                              
                              {/* Input box for grooming data */}
                              <div className="bg-white p-3 rounded-lg border border-gray-300">
                                <label className="block text-xs font-medium text-gray-700 mb-2">
                                  Enter grooming status or notes:
                                </label>
                                <input
                                  type="text"
                                  value={groomingInputValue}
                                  onChange={(e) => setGroomingInputValue(e.target.value)}
                                  placeholder="e.g., Dresscode Followed, or enter specific notes"
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                  autoFocus
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                  Enter "Dresscode Followed" or any other notes for this date.
                                </p>
                              </div>
                              
                              <div className="flex justify-end">
                                <button
                                  onClick={handleSubmitReport}
                                  disabled={submitting || !groomingInputValue.trim()}
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                  {submitting ? (
                                    <>
                                      <LuLoader className="w-4 h-4 animate-spin" />
                                      Submitting...
                                    </>
                                  ) : (
                                    <>
                                      <LuCheck className="w-4 h-4" />
                                      Submit
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">Click to select grooming date</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TraineesPopup;
