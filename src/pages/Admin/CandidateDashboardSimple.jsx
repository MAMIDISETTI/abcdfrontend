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

const CandidateDashboardSimple = () => {
  const [searchInput, setSearchInput] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);

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

    setLoading(true);
    try {
      // Parse multiple UIDs
      const uids = searchInput.split(/[,\s]+/).filter(uid => uid.trim());
      
      const response = await axiosInstance.post('/api/admin/candidate-dashboard', {
        uids: uids,
        dateFrom: dateFrom,
        dateTo: dateTo
      });

      if (response.data.candidates && response.data.candidates.length > 0) {
        setCandidates(response.data.candidates);
        toast.success(`Found ${response.data.candidates.length} candidate(s)`);
      } else {
        setCandidates([]);
        toast('No candidates found with the provided UID(s)', { icon: 'ℹ️' });
      }
    } catch (error) {
      setCandidates([]);
      toast.error('Failed to fetch candidate data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Candidate Dashboard</h1>
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
                  className="p-4 border rounded-lg cursor-pointer transition-all border-blue-500 bg-blue-50"
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
          {candidates[0] && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Candidate Overview</h3>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <LuUser className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Candidate UID</p>
                      <p className="font-medium text-gray-900">{candidates[0].uid}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <LuUser className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium text-gray-900">{candidates[0].name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <LuCalendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Date of Joining</p>
                      <p className="font-medium text-gray-900">{candidates[0].dateOfJoining}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <LuBookOpen className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Learning Status</p>
                      <p className="font-medium text-gray-900">{candidates[0].learningStatus}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <LuTarget className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Current Course</p>
                      <p className="font-medium text-gray-900">{candidates[0].currentCourse}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <LuAward className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Fortnight Exams</p>
                      <p className="font-medium text-gray-900">{candidates[0].fortnightExams}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <LuClock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Total Learning Hours</p>
                      <p className="font-medium text-gray-900">{candidates[0].totalHours} hrs</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <LuTrendingUp className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Daily Average</p>
                      <p className="font-medium text-gray-900">{candidates[0].dailyAverage} hrs/day</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <LuMapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Native State</p>
                      <p className="font-medium text-gray-900">{candidates[0].nativeState}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Badges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Deployment Status</p>
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                    candidates[0].deploymentStatus ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                  }`}>
                    {candidates[0].deploymentStatus ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Learning Status</p>
                  <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full text-blue-600 bg-blue-100">
                    In Progress
                  </span>
                </div>
              </div>

              {/* Observations */}
              <div className="mb-8">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Manager Observations</h4>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-gray-700">{candidates[0].observations}</p>
                </div>
              </div>
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

export default CandidateDashboardSimple;
