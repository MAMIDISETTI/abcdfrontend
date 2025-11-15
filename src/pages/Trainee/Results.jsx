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
  LuEye
} from 'react-icons/lu';

const TraineeResults = () => {
  const { user } = useContext(UserContext);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_PATHS.TRAINEE.MCQ_RESULTS);
      setResults(response.data.results || []);
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Failed to fetch results');
    } finally {
      setLoading(false);
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

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-100';
    if (percentage >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <DashboardLayout activeMenu="Results">
        <div className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeMenu="Results">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <LuClipboardCheck className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Results</h1>
              <p className="text-gray-600">View your exam results and performance</p>
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="space-y-6">
          {results.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <LuClipboardCheck className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Available</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                You haven't completed any exams yet. Complete some assignments to see your results here.
              </p>
            </div>
          ) : (
            results.map((result, index) => (
              <div key={result._id || result.id || `result-${index}`} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <LuClipboardCheck className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{result.examName || result.name}</h3>
                      <p className="text-gray-600">MCQ Assignment - {result.maxScore || 0} questions</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`px-4 py-2 rounded-lg ${getScoreBgColor(result.percentage || 0)}`}>
                      <span className={`text-lg font-bold ${getScoreColor(result.percentage || 0)}`}>
                        {result.totalScore || 0}/{result.maxScore || 0} ({Math.round(result.percentage || 0)}%)
                      </span>
                    </div>
                    <button
                      onClick={() => openDetailsModal(result)}
                      className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <LuEye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <LuCalendar className="w-4 h-4" />
                    <span>
                      <strong>Completed:</strong> {result.completedAt ? moment(result.completedAt).format('MMM DD, YYYY h:mm A') : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <LuClock className="w-4 h-4" />
                    <span>
                      <strong>Time Spent:</strong> {result.timeSpent ? Math.round(result.timeSpent / 60) : 0} minutes
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <LuFileText className="w-4 h-4" />
                    <span>
                      <strong>Status:</strong> <span className="text-green-600 font-medium">Completed</span>
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Results Details Modal */}
        {showDetailsModal && selectedResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Exam Results</h3>
                  <button
                    onClick={closeDetailsModal}
                    className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <LuX className="w-6 h-6" />
                  </button>
                </div>

                {/* Exam Info */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">Exam Name</h4>
                      <p className="text-gray-600">{selectedResult.examName || selectedResult.name}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Score</h4>
                      <p className={`text-lg font-bold ${getScoreColor(selectedResult.percentage || 0)}`}>
                        {selectedResult.totalScore || 0}/{selectedResult.maxScore || 0} ({Math.round(selectedResult.percentage || 0)}%)
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Completed</h4>
                      <p className="text-gray-600">
                        {selectedResult.completedAt ? moment(selectedResult.completedAt).format('MMM DD, YYYY h:mm A') : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Questions Review */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">Question Review</h4>
                  {selectedResult.answers && selectedResult.answers.map((answer, qIndex) => {
                    const question = selectedResult.questions && selectedResult.questions[answer.questionIndex];
                    if (!question) return null;

                    return (
                      <div key={qIndex} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h5 className="text-lg font-medium text-gray-900">
                            Q.{answer.questionIndex + 1} {question.question}
                          </h5>
                          <div className="ml-4 bg-gray-50 p-2 rounded text-sm">
                            <div className="font-medium">Question ID: {question.id || question._id || `q-${answer.questionIndex + 1}`}</div>
                            <div className="text-gray-600">Status: {answer.selectedAnswer ? 'Answered' : 'Not Answered'}</div>
                            <div className="text-gray-600">Chosen Option: {answer.selectedAnswer ? (question.options.findIndex(opt => opt === answer.selectedAnswer) + 1) : '--'}</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h6 className="font-medium text-gray-700">Answer Options:</h6>
                          {question.options && question.options.map((option, optIndex) => {
                            // Handle both old string format and new object format
                            const optionText = typeof option === 'string' ? option : option.text;
                            const isCorrectAnswer = optionText === question.correctAnswer;
                            const isSelectedAnswer = optionText === answer.selectedAnswer;
                            const isCorrect = answer.isCorrect;

                            return (
                              <div key={optIndex} className={`flex items-center space-x-3 p-2 rounded ${
                                isCorrectAnswer ? 'bg-green-50 border border-green-200' : 
                                isSelectedAnswer && !isCorrect ? 'bg-red-50 border border-red-200' : 
                                'bg-gray-50'
                              }`}>
                                <div className="flex items-center space-x-2">
                                  {isCorrectAnswer ? (
                                    <LuCheck className="w-5 h-5 text-green-600" />
                                  ) : isSelectedAnswer ? (
                                    <LuX className="w-5 h-5 text-red-600" />
                                  ) : (
                                    <div className="w-5 h-5 border border-gray-300 rounded"></div>
                                  )}
                                  <span className="font-medium">{optIndex + 1}.</span>
                                </div>
                                <div className="flex-1">
                                  <span className={`${
                                    isCorrectAnswer ? 'text-green-800 font-medium' : 
                                    isSelectedAnswer && !isCorrect ? 'text-red-800' : 
                                    'text-gray-700'
                                  }`}>
                                    {optionText}
                                  </span>
                                  {option.image && (
                                    <div className="mt-1 text-xs text-blue-600">📷 Image available</div>
                                  )}
                                </div>
                                {isCorrectAnswer && (
                                  <span className="text-green-600 text-sm font-medium">(Correct Answer)</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TraineeResults;
