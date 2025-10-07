import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { LuFileSpreadsheet, LuUpload, LuDownload, LuPencil, LuTrash2, LuSearch, LuFilter, LuCalendar, LuUsers, LuCheck, LuCloudUpload, LuInfo } from 'react-icons/lu';
import { toast } from 'react-hot-toast';
import moment from 'moment';
import UploadResultsPopup from '../../components/UploadResultsPopup';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';

const UploadResults = () => {
  const [activeTab, setActiveTab] = useState('daily');
  const [results, setResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showGoogleSheetsUpload, setShowGoogleSheetsUpload] = useState(false);

  // Fetch results from API
  useEffect(() => {
    fetchResults();
  }, [activeTab]);

  const fetchResults = async () => {
    try {
      const response = await axiosInstance.get(`${API_PATHS.RESULTS.GET_ALL}?examType=${activeTab}`);
      setResults(response.data.results || []);
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Failed to load results');
    }
  };

  const examTypes = {
    daily: 'Daily Quizzes',
    fortnight: 'Fortnight Exams',
    course: 'Course-Level Exams'
  };

  const handleDownload = (resultId) => {
    toast.success('Download started...');
  };

  const handleEdit = (resultId) => {
    toast.info('Edit functionality would open here');
  };

  const handleDelete = (resultId) => {
    setResults(prev => prev.filter(result => result.id !== resultId));
    toast.success('Result deleted successfully');
  };

  const filteredResults = results.filter(result => {
    const traineeName = result.trainee_name || result.traineeName || '';
    const trainerName = result.trainer_name || result.trainerName || '';
    const examDate = result.exam_date || result.examDate || '';
    
    const matchesSearch = traineeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trainerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (result.author_id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !filterDate || examDate === filterDate;
    return matchesSearch && matchesDate;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Passed':
        return 'bg-green-100 text-green-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatExamType = (examType) => {
    if (!examType) return 'N/A';
    // Convert fortnight1 -> Fortnight1, daily2 -> Daily2, etc.
    return examType.charAt(0).toUpperCase() + examType.slice(1);
  };

  return (
    <DashboardLayout activeMenu="Upload Results">
      <div className="mt-5 mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Results</h2>

        {/* Tabs */}
        <div className="card mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {Object.entries(examTypes).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`cursor-pointer py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Upload Section */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <LuUpload className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Upload {examTypes[activeTab]}</h3>
            </div>
            <button
              onClick={() => setShowGoogleSheetsUpload(true)}
              className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
            >
              <LuCloudUpload className="w-4 h-4" />
              <span>Upload from Google Sheets</span>
            </button>
          </div>

          <div className="space-y-6">
            <div className="text-center py-8">
              <LuFileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Upload Results from Google Sheets</h4>
              <p className="text-gray-600 mb-6">
                Use the "Upload from Google Sheets" button above to upload results data directly from your Google Sheets.
                The system will automatically match trainees by author_id and organize results by exam type.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-start">
                  <LuInfo className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">How it works:</p>
                    <ul className="list-disc list-inside space-y-1 text-left">
                      <li>Click "Upload from Google Sheets"</li>
                      <li>Provide your Google Sheets configuration</li>
                      <li>System validates and matches by author_id</li>
                      <li>Results are automatically organized by exam type</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Results</h3>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-4 md:mt-0">
              <div className="relative">
                <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by trainee or trainer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="relative">
                <LuFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  placeholder="Filter by date..."
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredResults.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Trainee</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Trainer</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Exam Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Score</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((result) => (
                    <tr key={result._id || result.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-xs">
                              {(result.trainee_name || result.traineeName || 'Unknown').split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">{result.trainee_name || result.traineeName || 'Unknown Trainee'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{result.trainer_name || result.trainerName || 'N/A'}</td>
                      <td className="py-3 px-4 text-gray-600">{formatExamType(result.exam_type || result.examType)}</td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">
                          {result.score || 0}/{result.total_marks || result.totalMarks || 100}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                          {result.status || 'pending'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {moment(result.exam_date || result.examDate).format('MMM DD, YYYY')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleDownload(result._id || result.id)}
                            className="cursor-pointer text-blue-600 hover:text-blue-800"
                            title="Download"
                          >
                            <LuDownload className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(result._id || result.id)}
                            className="cursor-pointer text-green-600 hover:text-green-800"
                            title="Edit"
                          >
                            <LuPencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(result._id || result.id)}
                            className="cursor-pointer text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <LuTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <LuFileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
                <p className="text-gray-600">
                  No {examTypes[activeTab].toLowerCase()} results have been uploaded yet.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Google Sheets Upload Popup */}
        <UploadResultsPopup
          isOpen={showGoogleSheetsUpload}
          onClose={() => setShowGoogleSheetsUpload(false)}
          onSuccess={(data) => {
            toast.success(`Successfully uploaded ${data.uploadedCount} results!`);
            // Refresh results from API
            fetchResults();
          }}
          examType={activeTab}
        />
      </div>
    </DashboardLayout>
  );
};

export default UploadResults;
