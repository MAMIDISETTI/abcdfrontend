import React, { useState, useEffect, useContext } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { UserContext } from '../../context/userContext';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { toast } from 'react-hot-toast';
import moment from 'moment';
import { 
  LuClipboardCheck, 
  LuCalendar, 
  LuClock, 
  LuFileText,
  LuCheck,
  LuX,
  LuInfo,
  LuEye,
  LuUser,
  LuSearch,
  LuFilter,
  LuDownload
} from 'react-icons/lu';

const TrainerResults = () => {
  const { user } = useContext(UserContext);
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [traineeFilter, setTraineeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [trainees, setTrainees] = useState([]);

  useEffect(() => {
    fetchResults();
    fetchTrainees();
  }, []);

  // Filter results based on search term and filters
  useEffect(() => {
    let filtered = results;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(result =>
        result.traineeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.assignmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.status?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply trainee filter
    if (traineeFilter !== 'all') {
      filtered = filtered.filter(result => result.traineeId === traineeFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(result => result.status === statusFilter);
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = moment();
      filtered = filtered.filter(result => {
        const resultDate = moment(result.completedAt);
        
        switch (dateFilter) {
          case 'today':
            return resultDate.isSame(now, 'day');
          case 'week':
            return resultDate.isAfter(now.subtract(1, 'week'));
          case 'month':
            return resultDate.isAfter(now.subtract(1, 'month'));
          case 'custom':
            if (customDateFrom && customDateTo) {
              return resultDate.isBetween(
                moment(customDateFrom),
                moment(customDateTo),
                'day',
                '[]'
              );
            }
            return true;
          default:
            return true;
        }
      });
    }

    setFilteredResults(filtered);
  }, [results, searchTerm, traineeFilter, statusFilter, dateFilter, customDateFrom, customDateTo]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      // Fetch results for all trainees assigned to this trainer
      const response = await axiosInstance.get(API_PATHS.TRAINER.TRAINEE_RESULTS);
     // console.log('Results response:', response.data);
      setResults(response.data.results || []);
    } catch (error) {
      console.error('Error fetching results:', error);
      if (error.response?.status === 404) {
        toast.error('Results endpoint not found. Please contact administrator.');
      } else {
        toast.error('Failed to fetch results');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainees = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.TRAINER.ASSIGNED_TRAINEES);
      setTrainees(response.data.trainees || []);
    } catch (error) {
      console.error('Error fetching trainees:', error);
    }
  };

  const openDetailsModal = (result) => {
    setSelectedResult(result);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedResult(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score, total) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const exportResults = () => {
    // Create CSV data
    const csvData = filteredResults.map(result => ({
      'Trainee Name': result.traineeName,
      'Assignment': result.assignmentName,
      'Score': `${result.score}/${result.totalQuestions}`,
      'Percentage': `${((result.score / result.totalQuestions) * 100).toFixed(1)}%`,
      'Status': result.status,
      'Completed At': moment(result.completedAt).format('DD/MM/YYYY HH:mm'),
      'Duration': result.duration ? `${result.duration} minutes` : 'N/A'
    }));

    // Convert to CSV
    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trainer-results-${moment().format('YYYY-MM-DD')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <DashboardLayout activeMenu="Results">
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading results...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeMenu="Results">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <LuClipboardCheck className="w-8 h-8 mr-3 text-blue-600" />
              Trainee Results
            </h1>
            <p className="text-gray-600 mt-1">View and analyze your trainees' assignment results</p>
          </div>
          <button
            onClick={exportResults}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <LuDownload className="w-5 h-5 mr-2" />
            Export Results
          </button>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col xl:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Results
              </label>
              <div className="relative">
                <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by trainee name, assignment, or status..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Trainee Filter */}
            <div className="xl:w-64 flex-shrink-0">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Trainee
              </label>
              <select
                value={traineeFilter}
                onChange={(e) => setTraineeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Trainees</option>
                {trainees.map(trainee => (
                  <option key={trainee._id} value={trainee._id}>
                    {trainee.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="xl:w-48 flex-shrink-0">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="xl:w-48 flex-shrink-0">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Date
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Custom Date Range */}
            {dateFilter === 'custom' && (
              <div className="xl:w-80">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Range
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">From</label>
                    <input
                      type="date"
                      value={customDateFrom}
                      onChange={(e) => setCustomDateFrom(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">To</label>
                    <input
                      type="date"
                      value={customDateTo}
                      onChange={(e) => setCustomDateTo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Clear Filters */}
            {(searchTerm || traineeFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all') && (
              <div className="xl:flex-shrink-0 flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setTraineeFilter('all');
                    setStatusFilter('all');
                    setDateFilter('all');
                    setCustomDateFrom('');
                    setCustomDateTo('');
                  }}
                  className="w-full xl:w-auto px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredResults.length} of {results.length} results
          </div>
        </div>

        {/* Results List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {results.length === 0 ? (
            <div className="text-center py-12">
              <LuClipboardCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results yet</h3>
              <p className="text-gray-500">Results will appear here when your trainees complete assignments</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="text-center py-12">
              <LuSearch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setTraineeFilter('all');
                  setStatusFilter('all');
                  setDateFilter('all');
                  setCustomDateFrom('');
                  setCustomDateTo('');
                }}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trainee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assignment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredResults.map((result, index) => (
                    <tr key={result._id || `result-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <LuUser className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {result.traineeName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {result.traineeEmail}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {result.assignmentName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {result.totalQuestions} questions
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${getScoreColor(result.score, result.totalQuestions)}`}>
                          {result.score}/{result.totalQuestions}
                        </div>
                        <div className="text-sm text-gray-500">
                          {((result.score / result.totalQuestions) * 100).toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(result.status)}`}>
                          {result.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <LuCalendar className="w-4 h-4 mr-1" />
                          {moment(result.completedAt).format('DD/MM/YYYY')}
                        </div>
                        <div className="flex items-center text-xs text-gray-400">
                          <LuClock className="w-3 h-3 mr-1" />
                          {moment(result.completedAt).format('HH:mm')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openDetailsModal(result)}
                          className="text-blue-600 hover:text-blue-900 cursor-pointer"
                        >
                          <LuEye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Results Details Modal */}
        {showDetailsModal && selectedResult && (
          <div className="fixed inset-0 bg-gray-100 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedResult.traineeName}</h2>
                  <p className="text-gray-600 mt-1">Exam: {selectedResult.assignmentName}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Score: {selectedResult.score}/{selectedResult.totalQuestions} ({((selectedResult.score / selectedResult.totalQuestions) * 100).toFixed(1)}%) | 
                    Submitted: {moment(selectedResult.completedAt).format('DD/MM/YYYY, h:mm:ss A')}
                  </p>
                </div>
                <button
                  onClick={closeDetailsModal}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer p-2"
                >
                  <LuX className="w-6 h-6" />
                </button>
              </div>

              {/* Questions */}
              <div className="p-6">
                {selectedResult.questions && selectedResult.questions.length > 0 ? (
                  <div className="space-y-6">
                    {selectedResult.questions.map((question, index) => (
                      <div key={question.questionIndex || index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex">
                          {/* Question Content */}
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                              Q.{question.questionIndex + 1} {question.question || 'Question not available'}
                            </h3>
                            
                            <div className="mb-4">
                              <p className="text-sm font-medium text-gray-700 mb-2">Ans</p>
                              <div className="space-y-2">
                                {question.options && question.options.length > 0 ? (
                                  question.options.map((option, optIndex) => {
                                    // Handle both string and object options
                                    const optionText = typeof option === 'string' ? option : (option.text || option);
                                    const isSelected = optionText === question.selectedAnswer;
                                    const isCorrect = optionText === question.correctAnswer;
                                    const isSelectedCorrect = isSelected && isCorrect;
                                    
                                    return (
                                      <div key={optIndex} className="flex items-center">
                                        <span className="text-sm text-gray-600 mr-3">{optIndex + 1}.</span>
                                        <span className="text-sm text-gray-900 flex-1">{optionText}</span>
                                        {isSelectedCorrect && (
                                          <span className="text-green-600 ml-2">✓</span>
                                        )}
                                        {isSelected && !isCorrect && (
                                          <span className="text-red-600 ml-2">✗</span>
                                        )}
                                        {!isSelected && isCorrect && (
                                          <span className="text-green-600 ml-2 text-xs">(Correct Answer)</span>
                                        )}
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="space-y-2">
                                    <div className="flex items-center">
                                      <span className="text-sm text-gray-600 mr-3">Selected:</span>
                                      <span className="text-sm text-gray-900 px-2 py-1 bg-blue-100 rounded">
                                        {question.selectedAnswer || 'No answer selected'}
                                      </span>
                                    </div>
                                    <div className="flex items-center">
                                      <span className="text-sm text-gray-600 mr-3">Correct:</span>
                                      <span className="text-sm text-gray-900 px-2 py-1 bg-green-100 rounded">
                                        {question.correctAnswer || 'Correct answer not available'}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Question Metadata */}
                          <div className="ml-6 w-64">
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="space-y-2 text-xs text-gray-600">
                                <div>
                                  <span className="font-medium">Question ID:</span>
                                  <p className="break-all">{question.questionId || question.questionIndex || index}</p>
                                </div>
                                <div>
                                  <span className="font-medium">Status:</span>
                                  <p className={question.isCorrect ? 'text-green-600' : 'text-red-600'}>
                                    {question.isCorrect ? 'Correct' : 'Incorrect'}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium">Chosen Option:</span>
                                  <p>{question.selectedAnswer || 'None'}</p>
                                </div>
                                {question.timeSpent > 0 && (
                                  <div>
                                    <span className="font-medium">Time Spent:</span>
                                    <p>{Math.round(question.timeSpent)}s</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <LuFileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">No detailed question analysis available for this result.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TrainerResults;
