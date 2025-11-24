import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { 
  LuTrendingUp, 
  LuTrendingDown, 
  LuUsers, 
  LuSearch, 
  LuLoader,
  LuInfo,
  LuClock,
  LuZap,
  LuAward,
  LuActivity,
  LuChevronRight
} from 'react-icons/lu';
import { toast } from 'react-hot-toast';

const PerformersMetricsDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [lowPerformers, setLowPerformers] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'performers', 'learning-phase'
  
  // Filters
  const [learningPhase, setLearningPhase] = useState('fast'); // 'fast', 'average', 'slow'
  const [learningPhaseFiltered, setLearningPhaseFiltered] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [performersLimit, setPerformersLimit] = useState(10);
  
  // Performers section filters
  const [performersExamType, setPerformersExamType] = useState('overall'); // 'dailyQuiz', 'fortnightExam', 'courseExam', 'overall'
  const [performersThreshold, setPerformersThreshold] = useState('');
  const [performersFiltered, setPerformersFiltered] = useState(false);

  // Fetch all candidates
  useEffect(() => {
    fetchAllCandidates();
  }, []);

  // Refetch data when UserDetails page updates data
  useEffect(() => {
    let broadcastChannel = null;
    
    // Check for refresh flag on mount
    const refreshFlag = localStorage.getItem('performersMetricsRefresh');
    if (refreshFlag) {
      localStorage.removeItem('performersMetricsRefresh');
      fetchAllCandidates();
    }

    // Listen for custom event (for same-tab updates)
    const handleDataUpdate = () => {
      fetchAllCandidates();
    };

    window.addEventListener('performersMetricsUpdated', handleDataUpdate);
    
    // Listen for storage events (for cross-tab updates)
    const handleStorageChange = (e) => {
      if (e.key === 'performersMetricsRefresh') {
        localStorage.removeItem('performersMetricsRefresh');
        fetchAllCandidates();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Use BroadcastChannel for reliable cross-tab communication
    try {
      broadcastChannel = new BroadcastChannel('performersMetricsUpdates');
      broadcastChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'refresh') {
          fetchAllCandidates();
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported, using fallback methods');
    }
    
    // Listen for visibility change (when user switches back to this tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const refreshFlag = localStorage.getItem('performersMetricsRefresh');
        if (refreshFlag) {
          localStorage.removeItem('performersMetricsRefresh');
          fetchAllCandidates();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Poll for updates every 2 seconds as a fallback (only when tab is visible)
    let pollInterval = null;
    if (document.visibilityState === 'visible') {
      pollInterval = setInterval(() => {
        const refreshFlag = localStorage.getItem('performersMetricsRefresh');
        if (refreshFlag) {
          const flagTime = parseInt(refreshFlag);
          const now = Date.now();
          // Only refresh if flag is less than 5 seconds old (to avoid stale updates)
          if (now - flagTime < 5000) {
            localStorage.removeItem('performersMetricsRefresh');
            fetchAllCandidates();
          }
        }
      }, 2000);
    }

    const handlePollVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (!pollInterval) {
          pollInterval = setInterval(() => {
            const refreshFlag = localStorage.getItem('performersMetricsRefresh');
            if (refreshFlag) {
              const flagTime = parseInt(refreshFlag);
              const now = Date.now();
              if (now - flagTime < 5000) {
                localStorage.removeItem('performersMetricsRefresh');
                fetchAllCandidates();
              }
            }
          }, 2000);
        }
      } else {
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handlePollVisibilityChange);

    return () => {
      window.removeEventListener('performersMetricsUpdated', handleDataUpdate);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('visibilitychange', handlePollVisibilityChange);
      if (broadcastChannel) {
        broadcastChannel.close();
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, []);

  // Filter candidates based on active tab and search
  useEffect(() => {
    filterCandidates();
  }, [candidates, activeTab, searchTerm, performersLimit, performersFiltered, learningPhaseFiltered]);

  const fetchAllCandidates = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(API_PATHS.PERFORMERS_METRICS.GET_ALL_CANDIDATES);
      if (response.data.success) {
        setCandidates(response.data.data || []);
      } else {
        toast.error(response.data.message || 'Failed to fetch candidates');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error fetching candidates');
    } finally {
      setLoading(false);
    }
  };

  const filterCandidates = () => {
    let filtered = [...candidates];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(candidate => 
        candidate.name?.toLowerCase().includes(searchLower) ||
        candidate.email?.toLowerCase().includes(searchLower) ||
        candidate.employeeId?.toLowerCase().includes(searchLower) ||
        candidate.author_id?.toLowerCase().includes(searchLower)
      );
    }

    // Apply tab-specific filters
    switch (activeTab) {
      case 'performers':
        // Calculate top and low performers
        let performersFilteredList = [...filtered];
        
        // Apply exam type and threshold filter ONLY if Check button was clicked
        if (performersFiltered && performersThreshold) {
          const threshold = parseFloat(performersThreshold);
          if (!isNaN(threshold)) {
            performersFilteredList = performersFilteredList.filter(candidate => {
              const examAvg = performersExamType === 'overall'
                ? (candidate.overallScore || 0)
                : (candidate.examAverages?.[performersExamType] || 0);
              return examAvg >= threshold;
            });
          }
        }
        
        // Sort by the selected exam type ONLY if filter is active, otherwise use overall score
        if (performersFiltered && performersThreshold) {
          performersFilteredList.sort((a, b) => {
            const aScore = performersExamType === 'overall' 
              ? (a.overallScore || 0) 
              : (a.examAverages?.[performersExamType] || 0);
            const bScore = performersExamType === 'overall' 
              ? (b.overallScore || 0) 
              : (b.examAverages?.[performersExamType] || 0);
            return bScore - aScore;
          });
        } else {
          // Default sorting by overall score when no filter is active
          performersFilteredList.sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
        }
        
        const limit = parseInt(performersLimit) || 10;
        setTopPerformers(performersFilteredList.slice(0, limit));
        setLowPerformers(performersFilteredList.slice(-limit).reverse());
        setFilteredCandidates([]);
        return;
      
      case 'learning-phase':
        // Apply learning phase filter ONLY if Check button was clicked
        if (learningPhaseFiltered) {
          filtered = filtered.filter(candidate => candidate.learningPhase === learningPhase);
        }
        filtered.sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
        break;
      
      default:
        // 'all' - show all candidates sorted by overall score
        filtered.sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
    }

    setFilteredCandidates(filtered);
    setTopPerformers([]);
    setLowPerformers([]);
  };

  const getLearningPhaseBadge = (phase) => {
    switch (phase) {
      case 'fast':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1.5">
          <LuZap className="w-3.5 h-3.5" />
          Fast Learner
        </span>;
      case 'average':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
          <LuClock className="w-3.5 h-3.5" />
          Average Learner
        </span>;
      case 'slow':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1.5">
          <LuInfo className="w-3.5 h-3.5" />
          Slow Learner
        </span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">Unknown</span>;
    }
  };

  const getPerformanceBadge = (score) => {
    if (score >= 80) {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">Top Performer</span>;
    } else if (score >= 60) {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Average</span>;
    } else if (score > 0) {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">Low Performer</span>;
    }
    return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">No Data</span>;
  };

  const getRankIcon = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      {/* <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 bg-purple-100 rounded-xl">
            <LuActivity className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Performers Metrics Dashboard</h1>
            <p className="text-gray-600 mt-1">Comprehensive performance analysis and insights</p>
          </div>
        </div>
      </div> */}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Total Candidates</span>
            <LuUsers className="w-5 h-5 text-slate-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{candidates.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Top Performers</span>
            <LuTrendingUp className="w-5 h-5 text-teal-600" />
          </div>
          <p className="text-3xl font-bold text-teal-700">{topPerformers.length || candidates.filter(c => (c.overallScore || 0) >= 80).length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Low Performers</span>
            <LuTrendingDown className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-3xl font-bold text-amber-700">{lowPerformers.length || candidates.filter(c => (c.overallScore || 0) > 0 && (c.overallScore || 0) < 60).length}</p>
        </div>
        {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Avg Score</span>
            <LuTarget className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-purple-600">
            {candidates.length > 0 
              ? Math.round(candidates.reduce((sum, c) => sum + (c.overallScore || 0), 0) / candidates.length)
              : 0}
          </p>
        </div> */}
      </div>

      {/* Tabs */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-slate-200 p-1">
        <nav className="flex space-x-2">
          {[
            { id: 'all', label: 'All Candidates', icon: LuUsers },
            { id: 'performers', label: 'Top & Low Performers', icon: LuAward },
            { id: 'learning-phase', label: 'Learning Phase', icon: LuZap }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[250px]">
          <div className="relative">
            <LuSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[600px] pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 bg-white shadow-sm"
            />
          </div>
        </div>

        {/* Learning Phase Filter */}
        {activeTab === 'learning-phase' && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
              <label className="text-sm font-medium text-slate-700 mr-2">Learning Phase:</label>
              <select
                value={learningPhase}
                onChange={(e) => {
                  setLearningPhase(e.target.value);
                  setLearningPhaseFiltered(false);
                }}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 bg-white"
              >
                <option value="fast">Fast Learners</option>
                <option value="average">Average Learners</option>
                <option value="slow">Slow Learners</option>
              </select>
            </div>
            <button
              onClick={() => setLearningPhaseFiltered(true)}
              className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors font-medium shadow-sm"
            >
              Check
            </button>
            {learningPhaseFiltered && (
              <button
                onClick={() => {
                  setLearningPhaseFiltered(false);
                }}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* Performers Filters */}
        {activeTab === 'performers' && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-3 bg-white rounded-lg shadow-sm border border-slate-200 p-3">
              <label className="text-sm font-medium text-slate-700">Exam Type:</label>
              <select
                value={performersExamType}
                onChange={(e) => {
                  setPerformersExamType(e.target.value);
                  setPerformersFiltered(false);
                }}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 bg-white"
              >
                <option value="overall">Overall Average</option>
                <option value="dailyQuiz">Daily Quiz</option>
                <option value="fortnightExam">Fortnight Exam</option>
                <option value="courseExam">Course Exam</option>
              </select>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-lg shadow-sm border border-slate-200 p-3">
              <label className="text-sm font-medium text-slate-700">Threshold:</label>
              <input
                type="number"
                value={performersThreshold}
                onChange={(e) => {
                  setPerformersThreshold(e.target.value);
                  setPerformersFiltered(false);
                }}
                placeholder="Enter value"
                min="0"
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 w-32 bg-white"
              />
            </div>
            <button
              onClick={() => setPerformersFiltered(true)}
              className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors font-medium shadow-sm"
            >
              Check
            </button>
            {(performersFiltered || performersThreshold) && (
              <button
                onClick={() => {
                  setPerformersThreshold('');
                  setPerformersFiltered(false);
                }}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
              >
                Clear
              </button>
            )}
            <div className="flex items-center gap-3 bg-white rounded-lg shadow-sm border border-slate-200 p-3">
              <label className="text-sm font-medium text-slate-700">Limit:</label>
              <input
                type="number"
                value={performersLimit}
                onChange={(e) => setPerformersLimit(e.target.value)}
                min="1"
                max="100"
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 w-24 bg-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="text-center">
            <LuLoader className="animate-spin text-slate-600 w-12 h-12 mx-auto mb-4" />
            <p className="text-slate-600">Loading performance data...</p>
          </div>
        </div>
      ) : activeTab === 'performers' ? (
        /* Top & Low Performers - Two Buckets */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers Bucket */}
          <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
            <div className="bg-slate-800 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-white">Top Performers</h3>
                    <p className="text-sm text-slate-300">
                      {performersFiltered && performersThreshold
                        ? `Highest ${performersExamType === 'overall' ? 'overall' : performersExamType === 'dailyQuiz' ? 'daily quiz' : performersExamType === 'fortnightExam' ? 'fortnight exam' : 'course exam'} scores`
                        : 'Highest overall scores'}
                    </p>
                  </div>
                </div>
                <span className="px-4 py-2 bg-slate-700 text-white rounded-full text-sm font-semibold">
                  {topPerformers.length}
                </span>
              </div>
            </div>
            <div className="p-6 max-h-[700px] overflow-y-auto">
              {topPerformers.length === 0 ? (
                <div className="text-center py-12">
                  <LuAward className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-slate-500">No top performers found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topPerformers.map((candidate, index) => (
                    <a
                      key={candidate.author_id}
                      href={`/user-details?author_id=${candidate.author_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-slate-50 border border-slate-200 rounded-lg p-4 hover:shadow-sm hover:border-slate-300 transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {getRankIcon(index)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900">{candidate.name || 'N/A'}</h4>
                            <p className="text-xs text-slate-500">{candidate.email || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-teal-700">
                            {performersFiltered && performersThreshold
                              ? (performersExamType === 'overall'
                                  ? (candidate.overallScore || 0)
                                  : (candidate.examAverages?.[performersExamType]?.toFixed(1) || 0))
                              : (candidate.overallScore || 0)}
                          </div>
                          <div className="text-xs text-slate-500">
                            {performersFiltered && performersThreshold
                              ? (performersExamType === 'overall' ? 'Overall Score' 
                                  : performersExamType === 'dailyQuiz' ? 'Daily Quiz'
                                  : performersExamType === 'fortnightExam' ? 'Fortnight'
                                  : 'Course Exam')
                              : 'Score'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                        {getPerformanceBadge(candidate.overallScore || 0)}
                        {getLearningPhaseBadge(candidate.learningPhase)}
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-slate-500">Daily Quiz:</span>
                            <span className="ml-1 font-semibold text-slate-900">{candidate.examAverages?.dailyQuiz?.toFixed(1) || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Fortnight:</span>
                            <span className="ml-1 font-semibold text-slate-900">{candidate.examAverages?.fortnightExam?.toFixed(1) || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Course:</span>
                            <span className="ml-1 font-semibold text-slate-900">{candidate.examAverages?.courseExam?.toFixed(1) || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Low Performers Bucket */}
          <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
            <div className="bg-slate-700 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-white">Low Performers</h3>
                    <p className="text-sm text-slate-300">
                      {performersFiltered && performersThreshold
                        ? `Lowest ${performersExamType === 'overall' ? 'overall' : performersExamType === 'dailyQuiz' ? 'daily quiz' : performersExamType === 'fortnightExam' ? 'fortnight exam' : 'course exam'} scores`
                        : 'Needs attention'}
                    </p>
                  </div>
                </div>
                <span className="px-4 py-2 bg-slate-600 text-white rounded-full text-sm font-semibold">
                  {lowPerformers.length}
                </span>
              </div>
            </div>
            <div className="p-6 max-h-[700px] overflow-y-auto">
              {lowPerformers.length === 0 ? (
                <div className="text-center py-12">
                  <LuInfo className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-slate-500">No low performers found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lowPerformers.map((candidate, index) => (
                    <a
                      key={candidate.author_id}
                      href={`/user-details?author_id=${candidate.author_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-slate-50 border border-slate-200 rounded-lg p-4 hover:shadow-sm hover:border-slate-300 transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {getRankIcon(index)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900">{candidate.name || 'N/A'}</h4>
                            <p className="text-xs text-slate-500">{candidate.email || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-amber-700">
                            {performersFiltered && performersThreshold
                              ? (performersExamType === 'overall'
                                  ? (candidate.overallScore || 0)
                                  : (candidate.examAverages?.[performersExamType]?.toFixed(1) || 0))
                              : (candidate.overallScore || 0)}
                          </div>
                          <div className="text-xs text-slate-500">
                            {performersFiltered && performersThreshold
                              ? (performersExamType === 'overall' ? 'Overall Score' 
                                  : performersExamType === 'dailyQuiz' ? 'Daily Quiz'
                                  : performersExamType === 'fortnightExam' ? 'Fortnight'
                                  : 'Course Exam')
                              : 'Score'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                        {getPerformanceBadge(candidate.overallScore || 0)}
                        {getLearningPhaseBadge(candidate.learningPhase)}
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-slate-500">Daily Quiz:</span>
                            <span className="ml-1 font-semibold text-slate-900">{candidate.examAverages?.dailyQuiz?.toFixed(1) || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Fortnight:</span>
                            <span className="ml-1 font-semibold text-slate-900">{candidate.examAverages?.fortnightExam?.toFixed(1) || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Course:</span>
                            <span className="ml-1 font-semibold text-slate-900">{candidate.examAverages?.courseExam?.toFixed(1) || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Other Tabs - Card Grid View */
        <>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Showing <span className="font-semibold text-slate-900">{filteredCandidates.length}</span> candidate{filteredCandidates.length !== 1 ? 's' : ''}
            </div>
          </div>

          {filteredCandidates.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
              <LuUsers className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">No candidates found matching the criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCandidates.map((candidate) => (
                <a
                  key={candidate.author_id}
                  href={`/user-details?author_id=${candidate.author_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 mb-1">{candidate.name || 'N/A'}</h3>
                      <p className="text-sm text-slate-500 mb-1">{candidate.email || 'N/A'}</p>
                      <p className="text-xs text-slate-400 bg-blue-50 px-2 py-1 rounded inline-block">{candidate.author_id || candidate.employeeId || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-teal-700 mb-1">{candidate.overallScore || 0}</div>
                      <div className="text-xs text-slate-500">Overall</div>
                    </div>
                  </div>

                  <div className="mb-4 pb-4 border-b border-slate-200">
                    {getPerformanceBadge(candidate.overallScore || 0)}
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-600">Daily Quiz</span>
                        <span className="text-sm font-semibold text-slate-900">{candidate.examAverages?.dailyQuiz?.toFixed(1) || 'N/A'}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-slate-600 h-2 rounded-full"
                          style={{ width: `${Math.min(candidate.examAverages?.dailyQuiz || 0, 100)}` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-600">Fortnight Exam</span>
                        <span className="text-sm font-semibold text-slate-900">{candidate.examAverages?.fortnightExam?.toFixed(1) || 'N/A'}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-teal-600 h-2 rounded-full"
                          style={{ width: `${Math.min(candidate.examAverages?.fortnightExam || 0, 100)}` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-600">Course Exam</span>
                        <span className="text-sm font-semibold text-slate-900">{candidate.examAverages?.courseExam?.toFixed(1) || 'N/A'}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-slate-800 h-2 rounded-full"
                          style={{ width: `${Math.min(candidate.examAverages?.courseExam || 0, 100)}` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    {getLearningPhaseBadge(candidate.learningPhase)}
                    <div className="text-xs text-slate-500">
                      {Object.keys(candidate.courseCompletion || {}).length} courses
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PerformersMetricsDashboard;
