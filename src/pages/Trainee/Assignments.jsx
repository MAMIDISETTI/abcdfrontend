import React, { useState, useEffect, useContext } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { UserContext } from '../../context/userContext';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { toast } from 'react-hot-toast';
import moment from 'moment';
import { 
  LuBookOpen, 
  LuClock, 
  LuCheck, 
  LuX, 
  LuPlay,
  LuCalendar,
  LuFileText,
  LuInfo,
  LuStar,
  LuLoader,
  LuTimer
} from 'react-icons/lu';

const TraineeAssignments = () => {
  const { user } = useContext(UserContext);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_PATHS.TRAINEE.MCQ_DEPLOYMENTS);
      setAssignments(response.data.deployments || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  const startAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setShowInstructionsModal(true);
  };

  const startQuiz = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.post(API_PATHS.TRAINEE.START_MCQ(selectedAssignment._id || selectedAssignment.id));
      
      if (response.data.success) {
        
        setSelectedAssignment(response.data.deployment);
        setCurrentQuestion(0);
        setAnswers({});
        setQuizStarted(true);
        setQuizCompleted(false);
        
        // Set timer if assignment has duration
        if (response.data.deployment.duration) {
          setTimeRemaining(response.data.deployment.duration * 60); // Convert minutes to seconds
        }
        
        setShowInstructionsModal(false);
        setShowQuizModal(true);
      } else {
        toast.error(response.data.message || 'Failed to start assignment');
      }
    } catch (error) {
      console.error('Error starting assignment:', error);
      toast.error('Failed to start assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  // Set default selection for SINGLE_SELECT questions
  useEffect(() => {
    if (showQuizModal && selectedAssignment && selectedAssignment.questions[currentQuestion]) {
      const question = selectedAssignment.questions[currentQuestion];
      const optionType = question.option_type || question.options_type || 'DEFAULT';
      
      if (optionType === 'SINGLE_SELECT' && answers[currentQuestion] === undefined) {
        // Set first option as default for SINGLE_SELECT
        setAnswers(prev => ({
          ...prev,
          [currentQuestion]: 0
        }));
      }
    }
  }, [currentQuestion, showQuizModal, selectedAssignment]);

  const nextQuestion = () => {
    if (currentQuestion < selectedAssignment.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const submitAssignment = async () => {
    if (Object.keys(answers).length !== selectedAssignment.questions.length) {
      toast.error('Please answer all questions before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert answers to the format expected by the API
      const formattedAnswers = Object.entries(answers).map(([questionIndex, answerIndex]) => {
        const option = selectedAssignment.questions[parseInt(questionIndex)].options[answerIndex];
        return {
          questionIndex: parseInt(questionIndex),
          selectedAnswer: typeof option === 'string' ? option : option.text,
          timeSpent: 0 // You can track individual question time if needed
        };
      });

      const response = await axiosInstance.post(API_PATHS.TRAINEE.SUBMIT_MCQ(selectedAssignment._id || selectedAssignment.id), {
        answers: formattedAnswers,
        timeSpent: selectedAssignment.duration ? (selectedAssignment.duration * 60 - timeRemaining) : 0
      });

      if (response.data.success) {
        setQuizCompleted(true);
        toast.success('Assignment submitted successfully!');
        fetchAssignments(); // Refresh assignments list
        // Close quiz modal after a short delay
        setTimeout(() => {
          closeQuizModal();
        }, 2000);
      } else {
        toast.error(response.data.message || 'Failed to submit assignment');
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast.error('Failed to submit assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeInstructionsModal = () => {
    setShowInstructionsModal(false);
    setSelectedAssignment(null);
  };

  const closeQuizModal = () => {
    setShowQuizModal(false);
    setSelectedAssignment(null);
    setCurrentQuestion(0);
    setAnswers({});
    setQuizStarted(false);
    setQuizCompleted(false);
    setTimeRemaining(0);
  };

  const handleAssignmentClick = (assignment) => {
    const statusInfo = getAssignmentStatus(assignment);
    
    if (statusInfo.label === 'Expired') {
      setStatusMessage('The exam is expired.');
    } else if (statusInfo.label === 'Completed') {
      setStatusMessage('You have submitted the exam.');
    } else if (statusInfo.label === 'Scheduled') {
      setStatusMessage('The exam has not started.');
    } else {
      setStatusMessage('This assignment is not available.');
    }
    
    setShowStatusModal(true);
  };

  const renderQuestionOptions = (question, questionIndex) => {
    const optionType = question.option_type || question.options_type || 'DEFAULT';

    switch (optionType) {
      case 'DEFAULT':
        return (
          <div className="grid grid-cols-2 gap-4">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(questionIndex, index)}
                className={`p-6 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-md ${
                  answers[questionIndex] === index
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <span className="text-lg font-medium text-gray-900">{option.text || option}</span>
              </button>
            ))}
          </div>
        );

      case 'IMAGE':
        return (
          <div className="grid grid-cols-2 gap-4">
            {question.options.map((option, index) => {
              // Handle different option structures - prioritize image_url from API
              const imageUrl = option.image_url || option.image || option.imageUrl;
              const optionText = option.text || option.label || option;
              
              // Check if it's a valid image URL
              const isValidImageUrl = imageUrl && (
                imageUrl.startsWith('http') || 
                imageUrl.startsWith('data:image') || 
                imageUrl.startsWith('/') ||
                imageUrl.includes('.jpg') ||
                imageUrl.includes('.jpeg') ||
                imageUrl.includes('.png') ||
                imageUrl.includes('.gif') ||
                imageUrl.includes('.webp')
              );

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(questionIndex, index)}
                  className={`p-6 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-md ${
                    answers[questionIndex] === index
                      ? 'border-orange-500 bg-orange-50 shadow-md'
                      : 'border-orange-200 bg-orange-50 hover:border-orange-300'
                  }`}
                >
                  <div className="flex items-center justify-center h-32 bg-orange-100 rounded-lg mb-3">
                    {isValidImageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={`Option ${index + 1}`}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`flex items-center justify-center w-full h-full ${isValidImageUrl ? 'hidden' : 'flex'}`}
                      style={{ display: isValidImageUrl ? 'none' : 'flex' }}
                    >
                      {/* Create visual elements similar to reference image */}
                      <div className="flex items-center space-x-2">
                        {index === 0 && (
                          <>
                            <div className="w-8 h-8 bg-orange-300 rounded-lg flex items-center justify-center">
                              <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                            </div>
                            <div className="w-8 h-8 bg-orange-300 rounded-lg flex items-center justify-center">
                              <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                            </div>
                          </>
                        )}
                        {index === 1 && (
                          <>
                            <div className="w-8 h-8 bg-orange-300 rounded-lg flex items-center justify-center">
                              <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                            </div>
                            <div className="w-8 h-8 bg-orange-300 rounded-lg flex items-center justify-center">
                              <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                              <div className="w-3 h-3 bg-orange-600 rounded-full ml-1"></div>
                            </div>
                          </>
                        )}
                        {index === 2 && (
                          <>
                            <div className="w-8 h-8 bg-orange-300 rounded-lg flex items-center justify-center">
                              <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                            </div>
                            <div className="w-16"></div>
                            <div className="w-8 h-8 bg-orange-300 rounded-lg flex items-center justify-center">
                              <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                              <div className="w-3 h-3 bg-orange-600 rounded-full ml-1"></div>
                            </div>
                          </>
                        )}
                        {index === 3 && (
                          <>
                            <div className="w-16"></div>
                            <div className="w-8 h-8 bg-orange-300 rounded-lg flex items-center justify-center">
                              <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                              <div className="w-3 h-3 bg-orange-600 rounded-full ml-1"></div>
                            </div>
                            <div className="w-8 h-8 bg-orange-300 rounded-lg flex items-center justify-center">
                              <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-lg font-medium text-gray-900">{optionText}</span>
                </button>
              );
            })}
          </div>
        );

      case 'SINGLE_SELECT':
        return (
          <div className="space-y-4">
            <div className="relative">
              <select
                value={answers[questionIndex] !== undefined ? answers[questionIndex] : ''}
                onChange={(e) => handleAnswerSelect(questionIndex, parseInt(e.target.value))}
                className="w-full p-4 border-2 border-gray-200 rounded-lg text-lg focus:border-blue-500 focus:outline-none bg-white"
              >
                <option value="">Select an option</option>
                {question.options.map((option, index) => (
                  <option key={index} value={index}>
                    {option.text || option}
                  </option>
                ))}
              </select>
            </div>
            <div className="bg-orange-100 border border-orange-200 rounded-lg p-3 flex items-center space-x-2">
              <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">!</span>
              </div>
              <span className="text-orange-800 text-sm">First option is selected by default</span>
            </div>
          </div>
        );

      default:
        return (
          <div className="grid grid-cols-2 gap-4">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(questionIndex, index)}
                className={`p-6 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-md ${
                  answers[questionIndex] === index
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <span className="text-lg font-medium text-gray-900">{option.text || option}</span>
              </button>
            ))}
          </div>
        );
    }
  };

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (quizStarted && timeRemaining > 0 && !quizCompleted) {
      interval = setInterval(() => {
        setTimeRemaining(time => {
          if (time <= 1) {
            // Auto-submit when time runs out
            submitAssignment();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    } else if (timeRemaining === 0 && quizStarted) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [quizStarted, timeRemaining, quizCompleted]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getAssignmentStatus = (assignment) => {
    const now = moment();
    const scheduledTime = moment(assignment.scheduledDateTime);

    // Check if trainee has completed this assignment
    const traineeResult = assignment.results?.find(r => r.traineeId === user?.author_id);
    
    if (traineeResult && traineeResult.status === 'completed') {
      return { status: 'completed', label: 'Completed', color: 'green' };
    } else if (traineeResult && traineeResult.status === 'in_progress') {
      return { status: 'in_progress', label: 'In Progress', color: 'blue' };
    } else if (assignment.status === 'active') {
      // Assignment is active and can be started
      return { status: 'available', label: 'Available', color: 'green' };
    } else if (assignment.status === 'scheduled') {
      if (now.isBefore(scheduledTime)) {
        return { status: 'scheduled', label: 'Scheduled', color: 'yellow' };
      } else {
        // Scheduled time has passed, assignment is now available
        return { status: 'available', label: 'Available', color: 'green' };
      }
    } else if (assignment.status === 'expired') {
      return { status: 'expired', label: 'Expired', color: 'red' };
    } else {
      return { status: 'cancelled', label: 'Cancelled', color: 'red' };
    }
  };

  const canStartAssignment = (assignment) => {
    const now = moment();
    const scheduledTime = moment(assignment.scheduledDateTime);

    // Check if trainee has already completed this assignment
    const traineeResult = assignment.results?.find(r => r.traineeId === user?.author_id);
    if (traineeResult && traineeResult.status === 'completed') {
      return false;
    }
    
    // Can start if:
    // 1. Assignment is active or scheduled
    // 2. Current time is after scheduled time (can start anytime after scheduled time)
    // 3. Assignment is not expired or cancelled
    return (assignment.status === 'active' || assignment.status === 'scheduled') &&
           now.isAfter(scheduledTime) &&
           assignment.status !== 'expired' && 
           assignment.status !== 'cancelled';
  };

  if (loading) {
    return (
      <DashboardLayout activeMenu="Assignments">
        <div className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeMenu="Assignments">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <LuBookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
              <p className="text-gray-600">Complete your assigned tasks and assessments</p>
            </div>
          </div>
        </div>

        {/* Assignments List */}
        <div className="space-y-6">
          {assignments.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <LuBookOpen className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assignments Available</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                You don't have any assignments yet. Check back later or contact your trainer for more information.
              </p>
            </div>
          ) : (
            assignments.map((assignment, index) => {
              const statusInfo = getAssignmentStatus(assignment);
              const canStart = canStartAssignment(assignment);
              
              return (
                <div 
                  key={assignment._id || assignment.id || `assignment-${index}`} 
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleAssignmentClick(assignment)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <LuBookOpen className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{assignment.name}</h3>
                        <p className="text-gray-600">MCQ Assignment - {assignment.questions?.length || 0} questions</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                        statusInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                        statusInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                        statusInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {statusInfo.label}
                      </span>
                      {canStart && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startAssignment(assignment);
                          }}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <LuPlay className="w-4 h-4" />
                          <span>Start the Exam</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <LuCalendar className="w-4 h-4" />
                      <span>
                        <strong>Start Time:</strong> {moment(assignment.scheduledDateTime).format('MMM DD, YYYY h:mm A')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <LuClock className="w-4 h-4" />
                      <span>
                        <strong>Duration:</strong> {assignment.duration} minutes
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <LuFileText className="w-4 h-4" />
                      <span>
                        <strong>Questions:</strong> {assignment.questions?.length || 0}
                      </span>
                    </div>
                  </div>

                  {assignment.instructions && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Instructions:</h4>
                      <p className="text-sm text-gray-700">{assignment.instructions}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Instructions Modal */}
        {showInstructionsModal && selectedAssignment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-8">
                <h2 className="text-2xl font-bold text-blue-600 mb-6">Instructions</h2>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center space-x-3">
                    <span className="text-blue-600 font-semibold">1.</span>
                    <span className="text-gray-700">Total Questions: {selectedAssignment.questions?.length || 0}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-blue-600 font-semibold">2.</span>
                    <span className="text-gray-700">Types of Questions: MCQs (Multiple Choice Questions)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-blue-600 font-semibold">3.</span>
                    <span className="text-gray-700">Duration: {selectedAssignment.duration} Mins</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-blue-600 font-semibold">4.</span>
                    <span className="text-gray-700">Marking Scheme: Every Correct response, get 1 mark</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-blue-600 font-semibold">5.</span>
                    <span className="text-gray-700">All the progress will be lost, if you reload during the assessment</span>
                  </div>
                </div>
                
                <div className="flex justify-start">
                  <button
                    onClick={startQuiz}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Starting...' : 'Start Assessment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full-Screen Quiz Modal */}
        {showQuizModal && selectedAssignment && (
          <div className="fixed inset-0 bg-white z-50 flex">
            {/* Left Panel - Question and Answers */}
            <div className="flex-1 p-8">
              <div className="max-w-4xl mx-auto">
                {/* Question */}
                <div className="mb-8">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-8">
                    {currentQuestion + 1}. {selectedAssignment.questions[currentQuestion].question}
                  </h3>

                  {/* Answer Options - Dynamic based on option_type */}
                  {renderQuestionOptions(selectedAssignment.questions[currentQuestion], currentQuestion)}
                </div>

                {/* Navigation */}
                <div className="flex justify-end">
                  {currentQuestion < selectedAssignment.questions.length - 1 ? (
                    <button
                      onClick={nextQuestion}
                      className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
                    >
                      Next Question
                    </button>
                  ) : (
                    <button
                      onClick={submitAssignment}
                      disabled={isSubmitting}
                      className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-medium"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Timer and Navigation */}
            <div className="w-80 bg-gray-50 border-l border-gray-200 p-6">
              {/* Timer */}
              <div className="bg-blue-600 text-white p-4 rounded-lg mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Time Left</span>
                  <span className="font-mono text-xl">{formatTime(timeRemaining)}</span>
                </div>
              </div>

              {/* Question Summary */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Answered Questions</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-purple-600">
                        {Object.keys(answers).length}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Unanswered Questions</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {selectedAssignment.questions.length - Object.keys(answers).length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Questions Navigation */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Questions ({selectedAssignment.questions.length})</h4>
                <div className="grid grid-cols-3 gap-2">
                  {selectedAssignment.questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentQuestion(index)}
                      className={`w-10 h-10 rounded-lg border-2 text-sm font-medium transition-colors ${
                        index === currentQuestion
                          ? 'border-blue-500 bg-blue-100 text-blue-700'
                          : answers[index] !== undefined
                          ? 'border-green-500 bg-green-100 text-green-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={submitAssignment}
                disabled={isSubmitting}
                className="w-full py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Submit Assessment
              </button>
            </div>
          </div>
        )}

        {/* Status Message Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-8 text-center">
                <div className="mb-6">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                    <LuInfo className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Assignment Status</h3>
                  <p className="text-gray-600">{statusMessage}</p>
                </div>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TraineeAssignments;
