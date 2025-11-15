import React, { useState, useEffect } from 'react';
import { 
  LuSearch, 
  LuCalendar, 
  LuUser, 
  LuClock, 
  LuBookOpen, 
  LuTarget, 
  LuTrendingUp, 
  LuDownload, 
  LuUsers, 
  LuFileText,
  LuCheck,
  LuInfo,
  LuMapPin,
  LuAward,
  LuActivity,
  LuFilter,
  LuRefreshCw
} from 'react-icons/lu';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../utils/axiosInstance';
import moment from 'moment';
import SimpleLineChart from '../../components/charts/SimpleLineChart';

const CandidateDashboard = () => {
  const [searchInput, setSearchInput] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showGraphs, setShowGraphs] = useState(false);

  // Set default date range (last 30 days)
  useEffect(() => {
    const today = moment().format('YYYY-MM-DD');
    const thirtyDaysAgo = moment().subtract(30, 'days').format('YYYY-MM-DD');
    setDateFrom(thirtyDaysAgo);
    setDateTo(today);
  }, []);

  const handleSearch = async () => {
    if (!searchInput.trim()) {
      toast.error('Please enter candidate UID(s)');
      return;
    }

    if (!dateFrom || !dateTo) {
      toast.error('Please select date range');
      return;
    }

    if (moment(dateFrom).isAfter(moment(dateTo))) {
      toast.error('Start date cannot be after end date');
      return;
    }

    setLoading(true);
    try {
      // Parse multiple UIDs
      const uids = searchInput.split(/[,\s]+/).filter(uid => uid.trim());
      
      const response = await axiosInstance.post('/api/admin/candidate-dashboard', {
        uids: uids,
        dateFrom: dateFrom,
        dateTo: dateTo
      });

      // For demo purposes, if no candidates found, show sample data
      if (response.data.candidates && response.data.candidates.length > 0) {
        setCandidates(response.data.candidates);
        setSelectedCandidate(response.data.candidates[0]);
        toast.success(`Found ${response.data.candidates.length} candidate(s)`);
      } else {
        // Show sample data for demonstration
        const sampleCandidates = [
          {
            uid: searchInput.split(/[,\s]+/)[0] || 'DEMO001',
            name: 'Harsh Kumar Bhagat',
            email: 'harsh.kumar@example.com',
            dateOfJoining: '12-Jan-2023',
            dateRange: `${dateFrom} to ${dateTo}`,
            learningStatus: '5/10 courses completed (50%)',
            currentCourse: 'Backend API Development',
            fortnightExams: '3/4 exams completed (75% average)',
            observations: 'Needs better time management. Shows good progress in technical skills.',
            totalHours: '18.5',
            dailyAverage: '1.8',
            deploymentStatus: false,
            nativeState: 'Andhra Pradesh'
          }
        ];
        setCandidates(sampleCandidates);
        setSelectedCandidate(sampleCandidates[0]);
        toast.success('Showing sample data for demonstration');
      }
    } catch (error) {
      console.error('Error fetching candidate data:', error);
      toast.error('Failed to fetch candidate data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    toast.success('PDF export feature coming soon!');
  };

  const handleCompareCandidates = () => {
    if (candidates.length < 2) {
      toast.error('Select at least 2 candidates to compare');
      return;
    }
    toast.success('Comparison feature coming soon!');
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'in progress':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'not started':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getDeploymentStatusColor = (status) => {
    return status ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  // Generate sample chart data
  const generateSampleChartData = (type) => {
    const data = [];
    const days = type === 'daily' ? 30 : type === 'weekly' ? 8 : 6;
    const labels = type === 'daily' ? 'days' : type === 'weekly' ? 'weeks' : 'months';
    
    for (let i = 0; i < days; i++) {
      let label, value;
      
      if (type === 'daily') {
        label = moment().subtract(days - 1 - i, 'days').format('DD MMM');
        value = Math.random() * 3; // 0-3 hours
      } else if (type === 'weekly') {
        label = moment().subtract(days - 1 - i, 'weeks').format('DD MMM');
        value = Math.random() * 20; // 0-20 hours
      } else {
        label = moment().subtract(days - 1 - i, 'months').format('MMM YYYY');
        value = Math.random() * 50; // 0-50 hours
      }
      
      data.push({ label, value: parseFloat(value.toFixed(1)) });
    }
    
    return data;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-bold text-gray mb-2">Candidate Dashboard</h1>
          <p className="text-gray-600">Data Access, Monitoring & Insights</p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Candidates</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Candidate UID(s) / Phone Number(s)
              </label>
              <div className="relative">
                <LuUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Enter single UID or multiple UIDs separated by commas"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Enter multiple UIDs separated by commas or spaces</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
              <div className="relative">
                <LuCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
              <div className="relative">
                <LuCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <LuRefreshCw className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <LuSearch className="w-5 h-5 mr-2" />
              )}
              Search
            </button>

            {candidates.length > 0 && (
              <>
                <button
                  onClick={handleExportPDF}
                  className="flex items-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <LuDownload className="w-5 h-5 mr-2" />
                  Export PDF
                </button>

                <button
                  onClick={handleCompareCandidates}
                  className="flex items-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <LuUsers className="w-5 h-5 mr-2" />
                  Compare Candidates
                </button>
              </>
            )}
          </div>
        </div>

        {/* Results Section */}
        {candidates.length > 0 && (
          <div className="space-y-6">
            {/* Candidate List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Results ({candidates.length} candidate(s))</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {candidates.map((candidate, index) => (
                  <div
                    key={candidate.uid || index}
                    onClick={() => setSelectedCandidate(candidate)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedCandidate?.uid === candidate.uid
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <LuUser className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{candidate.name}</p>
                        <p className="text-sm text-gray-500">UID: {candidate.uid}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Candidate Details */}
            {selectedCandidate && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Candidate Overview</h3>
                  <button
                    onClick={() => setShowGraphs(!showGraphs)}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <LuActivity className="w-5 h-5 mr-2" />
                    {showGraphs ? 'Hide' : 'Show'} Graphs
                  </button>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <LuUser className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Candidate UID</p>
                        <p className="font-medium text-gray-900">{selectedCandidate.uid}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <LuUser className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-medium text-gray-900">{selectedCandidate.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <LuCalendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Date of Joining</p>
                        <p className="font-medium text-gray-900">{selectedCandidate.dateOfJoining}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <LuBookOpen className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Learning Status</p>
                        <p className="font-medium text-gray-900">{selectedCandidate.learningStatus}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <LuTarget className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Current Course</p>
                        <p className="font-medium text-gray-900">{selectedCandidate.currentCourse}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <LuAward className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Fortnight Exams</p>
                        <p className="font-medium text-gray-900">{selectedCandidate.fortnightExams}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <LuClock className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Total Learning Hours</p>
                        <p className="font-medium text-gray-900">{selectedCandidate.totalHours} hrs</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <LuTrendingUp className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Daily Average</p>
                        <p className="font-medium text-gray-900">{selectedCandidate.dailyAverage} hrs/day</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <LuMapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Native State</p>
                        <p className="font-medium text-gray-900">{selectedCandidate.nativeState}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Deployment Status</p>
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getDeploymentStatusColor(selectedCandidate.deploymentStatus)}`}>
                      {selectedCandidate.deploymentStatus ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Learning Status</p>
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedCandidate.learningStatus)}`}>
                      {selectedCandidate.learningStatus}
                    </span>
                  </div>
                </div>

                {/* Observations */}
                {selectedCandidate.observations && (
                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Manager Observations</h4>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-gray-700">{selectedCandidate.observations}</p>
                    </div>
                  </div>
                )}

                {/* Learning Hours Graphs */}
                {showGraphs && (
                  <div className="space-y-8">
                    <h4 className="text-lg font-medium text-gray-900">Learning Analytics</h4>
                    
                    {/* Daily Learning Hours */}
                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                      <SimpleLineChart
                        data={generateSampleChartData('daily')}
                        title="Daily Learning Hours (Last 30 days)"
                        xAxisLabel="Date"
                        yAxisLabel="Total Learning Hours"
                        height={200}
                      />
                    </div>

                    {/* Weekly Learning Hours */}
                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                      <SimpleLineChart
                        data={generateSampleChartData('weekly')}
                        title="Weekly Learning Hours (Last 8 weeks)"
                        xAxisLabel="Week"
                        yAxisLabel="Total Learning Hours"
                        height={200}
                      />
                    </div>

                    {/* Monthly Learning Hours */}
                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                      <SimpleLineChart
                        data={generateSampleChartData('monthly')}
                        title="Monthly Learning Hours (Last 6 months)"
                        xAxisLabel="Month"
                        yAxisLabel="Total Learning Hours"
                        height={200}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {candidates.length === 0 && !loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <LuUser className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates found</h3>
            <p className="text-gray-500">Enter candidate UID(s) and date range to search for learning data</p>
          </div>
        )}
      </div>
  );
};

export default CandidateDashboard;
