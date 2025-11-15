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
  LuRefreshCw,
  LuX
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
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

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

  const handleCandidateClick = async (candidate) => {
    setSelectedCandidate(candidate);
    setLoadingDetail(true);
    setShowDetailModal(true);
    
    try {
      // Fetch detailed candidate data
      const response = await axiosInstance.post('/api/admin/candidate-dashboard/detail', {
        uid: candidate.uid,
        dateFrom: dateFrom,
        dateTo: dateTo
      });
      
      if (response.data.success) {
        setDetailData(response.data);
      } else {
        toast.error('Failed to fetch detailed candidate data');
        setDetailData(null);
      }
    } catch (error) {
      console.error('Error fetching candidate detail:', error);
      toast.error('Failed to fetch detailed candidate data');
      setDetailData(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className=" font-bold text-gray-900 mb-2">Candidate Dashboard</h1>
        <p className="text-gray-600">Data Access, Monitoring & Insights</p>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="font-semibold text-gray-900 mb-4">Search Candidates</h2>
        
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
                  onClick={() => handleCandidateClick(candidate)}
                  className="p-4 border rounded-lg cursor-pointer transition-all border-blue-500 bg-blue-50 hover:bg-blue-100"
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

      {/* Detailed View Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-y-auto my-8">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900">Candidate Details</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setDetailData(null);
                  setSelectedCandidate(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <LuX className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-12">
                  <LuRefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                  <span className="ml-3 text-gray-600">Loading candidate details...</span>
                </div>
              ) : detailData ? (
                <div className="space-y-8">
                  {/* Personal Details Table */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Personal Details</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">UID</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">Name</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">Phone Number</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">Email id</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">Employee id</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">DOJ</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">State</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">Highest Qualification</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">Specialization</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">Have M.Tech PC</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">Have M.Tech OD</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">Year of Passout</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">Working Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 px-4 py-2">{detailData.personalDetails?.uid || selectedCandidate?.uid || 'N/A'}</td>
                            <td className="border border-gray-300 px-4 py-2">{detailData.personalDetails?.name || selectedCandidate?.name || 'N/A'}</td>
                            <td className="border border-gray-300 px-4 py-2">{detailData.personalDetails?.phoneNumber || detailData.personalDetails?.phone || 'N/A'}</td>
                            <td className="border border-gray-300 px-4 py-2">{detailData.personalDetails?.email || selectedCandidate?.email || 'N/A'}</td>
                            <td className="border border-gray-300 px-4 py-2">{detailData.personalDetails?.employeeId || 'N/A'}</td>
                            <td className="border border-gray-300 px-4 py-2">{detailData.personalDetails?.doj || detailData.personalDetails?.dateOfJoining || selectedCandidate?.dateOfJoining || 'N/A'}</td>
                            <td className="border border-gray-300 px-4 py-2">{detailData.personalDetails?.state || selectedCandidate?.nativeState || 'N/A'}</td>
                            <td className="border border-gray-300 px-4 py-2">{detailData.personalDetails?.highestQualification || detailData.personalDetails?.qualification || 'N/A'}</td>
                            <td className="border border-gray-300 px-4 py-2">{detailData.personalDetails?.specialization || 'N/A'}</td>
                            <td className="border border-gray-300 px-4 py-2">{detailData.personalDetails?.haveMTechPC || 'N/A'}</td>
                            <td className="border border-gray-300 px-4 py-2">{detailData.personalDetails?.haveMTechOD || 'N/A'}</td>
                            <td className="border border-gray-300 px-4 py-2">{detailData.personalDetails?.yearOfPassout || 'N/A'}</td>
                            <td className="border border-gray-300 px-4 py-2">{detailData.personalDetails?.workingStatus || (selectedCandidate?.deploymentStatus ? 'Working' : 'Not Working')}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Learning Report Table */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Learning Report</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">Metric</th>
                            {detailData.learningReport?.subjects?.map((subject, idx) => (
                              <th key={idx} className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">{subject}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {detailData.learningReport?.metrics?.map((metric, idx) => (
                            <tr key={idx}>
                              <td className="border border-gray-300 px-4 py-2 font-medium">{metric.label}</td>
                              {detailData.learningReport?.subjects?.map((subject, sIdx) => {
                                const value = metric.values?.[subject];
                                // Display value if it exists (including 0), otherwise show empty string
                                const displayValue = (value !== undefined && value !== null && value !== '') ? value : '';
                                return (
                                  <td key={sIdx} className="border border-gray-300 px-4 py-2">
                                    {displayValue}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Grooming Report */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Grooming Report</h3>
                    
                    {/* Daily Grooming Observations */}
                    {detailData.groomingReport?.dailyObservations && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Daily Grooming Observations</h4>
                        <div className="space-y-6">
                          {detailData.groomingReport.months.map((month, monthIdx) => {
                            const dailyObs = detailData.groomingReport.dailyObservations[month] || [];
                            if (dailyObs.length === 0) return null;
                            
                            return (
                              <div key={monthIdx} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
                                  <h5 className="font-semibold text-gray-900">{month}</h5>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="min-w-full border-collapse">
                                    <thead>
                                      <tr className="bg-gray-50">
                                        <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-gray-700">Date</th>
                                        <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-gray-700">Day</th>
                                        <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-gray-700">Rating</th>
                                        <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-gray-700">Dress Code</th>
                                        <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-gray-700">Neatness</th>
                                        <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-gray-700">Punctuality</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {dailyObs.map((obs, obsIdx) => (
                                        <tr key={obsIdx} className="hover:bg-gray-50">
                                          <td className="border border-gray-200 px-4 py-2 text-sm text-gray-700">
                                            {moment(obs.date).format('DD-MMM-YYYY')}
                                          </td>
                                          <td className="border border-gray-200 px-4 py-2 text-sm text-gray-700">
                                            {obs.day}
                                          </td>
                                          <td className="border border-gray-200 px-4 py-2">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                              obs.rating === 'Good' 
                                                ? 'bg-green-100 text-green-700 border border-green-200' 
                                                : obs.rating === 'Average'
                                                ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                                            }`}>
                                              {obs.rating}
                                            </span>
                                          </td>
                                          <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600 capitalize">
                                            {obs.dressCode !== 'N/A' ? obs.dressCode.replace('_', ' ') : 'N/A'}
                                          </td>
                                          <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600 capitalize">
                                            {obs.neatness !== 'N/A' ? obs.neatness.replace('_', ' ') : 'N/A'}
                                          </td>
                                          <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600 capitalize">
                                            {obs.punctuality !== 'N/A' ? obs.punctuality.replace('_', ' ') : 'N/A'}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          })}
                          {detailData.groomingReport.months.every(month => 
                            !detailData.groomingReport.dailyObservations[month] || 
                            detailData.groomingReport.dailyObservations[month].length === 0
                          ) && (
                            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                              <p className="text-gray-500">No daily grooming observations found for the selected date range</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No detailed data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateDashboardSimple;
