import React, { useState, useEffect, useContext } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { 
  LuTrendingUp, 
  LuFileText, 
  LuCheck, 
  LuX, 
  LuClock3
} from 'react-icons/lu';
import { UserContext } from '../../context/userContext';
import moment from 'moment';
import axiosInstance from '../../utils/axiosInstance';

const LearningReports = () => {
  const { user } = useContext(UserContext);
  const [learningReports, setLearningReports] = useState({
    progress: [],
    examScores: [],
    demoFeedback: [],
    quizScores: [],
    deploymentStatus: null
  });
  const [loading, setLoading] = useState(true);

  // Load learning reports data
  useEffect(() => {
    const fetchLearningReports = async () => {
      try {
        setLoading(true);
        // Fetch exam results for this trainee using the trainee-specific endpoint
        const response = await axiosInstance.get('/api/results/my-results');
        
        if (response.data.results) {
          const results = response.data.results;
          
          // Debug logging
          // Process exam scores for different exam types
          const examScores = results.map(result => ({
            course: result.exam_type || result.examType || 'Unknown',
            score: result.percentage || 0,
            date: result.exam_date || result.examDate,
            status: result.status || 'pending',
            scoreDetails: `${result.score || 0}/${result.total_marks || result.totalMarks || 100}`,
            trainer: result.trainer_name || result.trainerName || 'N/A'
          }));
          
          // Debug logging for filtered results
          const fortnightExams = examScores.filter(exam => exam.course.toLowerCase().includes('fortnight'));
          setLearningReports(prev => ({
            ...prev,
            examScores: examScores,
            progress: [], // TODO: Implement course progress tracking
            demoFeedback: [], // TODO: Implement demo feedback
            quizScores: examScores.filter(exam => exam.course.toLowerCase().includes('daily') || exam.course.toLowerCase().includes('quiz'))
          }));
        }
      } catch (error) {
        console.error('Error fetching learning reports:', error);
        // Don't show error to user as this is background loading
      } finally {
        setLoading(false);
      }
    };

    if (user?.author_id) {
      fetchLearningReports();
    }
  }, [user?.author_id]);

  // Get status icon for exam results
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pass':
      case 'passed':
        return <LuCheck className="w-4 h-4 text-green-500" />;
      case 'Fail':
      case 'failed':
        return <LuX className="w-4 h-4 text-red-500" />;
      case 'In Progress':
      case 'pending':
        return <LuClock3 className="w-4 h-4 text-yellow-500" />;
      default: 
        return <LuClock3 className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout activeMenu="Learning Reports">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading learning reports...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeMenu="Learning Reports">
      <div className="p-3 md:p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <h1 className=" font-bold text-gray-900 mb-2">Learning Reports</h1>
          <p className="text-gray-600">Track your progress and view your exam results.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Exams */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Exams</p>
                <p className="text-2xl font-bold text-gray-900">{learningReports.examScores.length}</p>
              </div>
              <LuFileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          {/* Average Score */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {learningReports.examScores.length > 0 
                    ? Math.round(learningReports.examScores.reduce((sum, exam) => sum + exam.score, 0) / learningReports.examScores.length)
                    : 0}%
                </p>
              </div>
              <LuTrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>

          {/* Passed Exams */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Passed Exams</p>
                <p className="text-2xl font-bold text-gray-900">
                  {learningReports.examScores.filter(exam => exam.status.toLowerCase() === 'passed' || exam.status.toLowerCase() === 'pass').length}
                </p>
              </div>
              <LuCheck className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Fortnight Exams */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Fortnight Exams</h2>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {learningReports.examScores.filter(exam => exam.course.toLowerCase().includes('fortnight')).length} exams
              </span>
            </div>
            {learningReports.examScores.filter(exam => exam.course.toLowerCase().includes('fortnight')).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Course</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Score</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {learningReports.examScores.filter(exam => exam.course.toLowerCase().includes('fortnight')).map((exam, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 text-gray-900 font-medium">{exam.course}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-semibold text-gray-900">{exam.score}%</span>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  exam.score >= 80 ? 'bg-green-500' : 
                                  exam.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${exam.score}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600">{moment(exam.date).format('MMM DD, YYYY')}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(exam.status)}
                            <span className={`text-sm font-medium ${
                              exam.status.toLowerCase() === 'passed' || exam.status.toLowerCase() === 'pass' 
                                ? 'text-green-700' 
                                : exam.status.toLowerCase() === 'failed' || exam.status.toLowerCase() === 'fail'
                                ? 'text-red-700'
                                : 'text-yellow-700'
                            }`}>
                              {exam.status}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <LuFileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">No fortnight exam scores available</p>
                <p className="text-gray-400 text-sm mt-2">Your fortnight exam results will appear here</p>
              </div>
            )}
          </div>

          {/* Daily Quizzes */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Daily Quizzes</h2>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                {learningReports.quizScores.length} quizzes
              </span>
            </div>
            {learningReports.quizScores.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Quiz</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Score</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {learningReports.quizScores.map((quiz, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 text-gray-900 font-medium">{quiz.course}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-semibold text-gray-900">{quiz.score}%</span>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  quiz.score >= 80 ? 'bg-green-500' : 
                                  quiz.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${quiz.score}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600">{moment(quiz.date).format('MMM DD, YYYY')}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(quiz.status)}
                            <span className={`text-sm font-medium ${
                              quiz.status.toLowerCase() === 'passed' || quiz.status.toLowerCase() === 'pass' 
                                ? 'text-green-700' 
                                : quiz.status.toLowerCase() === 'failed' || quiz.status.toLowerCase() === 'fail'
                                ? 'text-red-700'
                                : 'text-yellow-700'
                            }`}>
                              {quiz.status}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <LuFileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">No quiz scores available</p>
                <p className="text-gray-400 text-sm mt-2">Your quiz results will appear here</p>
              </div>
            )}
          </div>

          {/* Course Level Exams */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Course Level Exams</h2>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                {learningReports.examScores.filter(exam => exam.course.toLowerCase().includes('course')).length} exams
              </span>
            </div>
            {learningReports.examScores.filter(exam => exam.course.toLowerCase().includes('course')).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Course</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Score</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {learningReports.examScores.filter(exam => exam.course.toLowerCase().includes('course')).map((exam, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 text-gray-900 font-medium">{exam.course}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-semibold text-gray-900">{exam.score}%</span>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  exam.score >= 80 ? 'bg-green-500' : 
                                  exam.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${exam.score}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600">{moment(exam.date).format('MMM DD, YYYY')}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(exam.status)}
                            <span className={`text-sm font-medium ${
                              exam.status.toLowerCase() === 'passed' || exam.status.toLowerCase() === 'pass' 
                                ? 'text-green-700' 
                                : exam.status.toLowerCase() === 'failed' || exam.status.toLowerCase() === 'fail'
                                ? 'text-red-700'
                                : 'text-yellow-700'
                            }`}>
                              {exam.status}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <LuFileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">No course level exam scores available</p>
                <p className="text-gray-400 text-sm mt-2">Your course level exam results will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LearningReports;
