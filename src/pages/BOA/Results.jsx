import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { LuSearch, LuDownload, LuFileText, LuX, LuCheck, LuUpload } from "react-icons/lu";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { toast } from 'react-hot-toast';

const Results = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deployments, setDeployments] = useState([]);
  const [showExamModal, setShowExamModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [showTraineeModal, setShowTraineeModal] = useState(false);
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedExamForDownload, setSelectedExamForDownload] = useState(null);
  const [uploadingExams, setUploadingExams] = useState({});
  const [uploadedExams, setUploadedExams] = useState({});

  const fetchResults = async () => {
    try {
      // Read deployments with results for BOA (completed/in_progress records)
      const res = await axiosInstance.get(API_PATHS.BOA.MCQ_RESULTS);
      const deployments = res.data.deployments || [];
      setDeployments(deployments);
      const flat = deployments.flatMap((d) =>
        (d.results || []).map((r) => ({
          deploymentId: d._id,
          name: d.name,
          traineeId: r.traineeId,
          traineeName: r.traineeName,
          score: r.totalScore,
          maxScore: r.maxScore,
          percentage: Math.round((r.percentage || 0) * 100) / 100,
          submittedAt: r.submittedAt || r.updatedAt || d.updatedAt,
        }))
      );
      // Only show completed submissions to BOA
      setResults(flat.filter((r) => r.score !== undefined && r.maxScore !== undefined));

      // Check which exams have already been uploaded
      const uploadedExamsMap = {};
      deployments.forEach(deployment => {
        const hasUploadedResults = (deployment.results || []).some(r => r.uploadedToTrainee === true);
        if (hasUploadedResults) {
          uploadedExamsMap[deployment._id] = true;
        }
      });
      setUploadedExams(uploadedExamsMap);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const filtered = results.filter((r) =>
    [r.name, r.traineeName, r.traineeId]
      .filter(Boolean)
      .some((v) => v.toLowerCase().includes(search.toLowerCase()))
  );

  // Build grouped exam stats for dropdown list
  const examStats = (deployments || []).map((d) => {
    const completed = (d.results || []).filter((r) => r.status === 'completed' || (typeof r.totalScore === 'number')).length;
    const inProgress = (d.results || []).filter((r) => r.status === 'in_progress').length;
    const assigned = (d.targetTrainees || []).length;
    const notStarted = Math.max(assigned - completed - inProgress, 0);
    return {
      id: d._id,
      name: d.name,
      scheduledDateTime: d.scheduledDateTime,
      duration: d.duration,
      totalAssigned: assigned,
      totalWritten: completed,
      currentlyWriting: inProgress,
      notStarted,
    };
  }).filter((e) => e.name?.toLowerCase().includes(search.toLowerCase()));

  const toggleExpand = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const openTraineeModal = (traineeId, deploymentId) => {
    const deployment = deployments.find(d => d._id === deploymentId);
    const result = deployment?.results?.find(r => r.traineeId === traineeId);
    
    if (!deployment || !result) return;
    
    // Calculate correct percentage
    const totalScore = result.totalScore || 0;
    const maxScore = result.maxScore || deployment.questions?.length || 0;
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    
    setSelectedTrainee({
      traineeId: result.traineeId,
      traineeName: result.traineeName,
      deploymentName: deployment.name,
      questions: deployment.questions || [],
      answers: result.answers || [],
      totalScore: totalScore,
      maxScore: maxScore,
      percentage: percentage,
      submittedAt: result.submittedAt || result.submitted_at || result.submitted || result.completedAt || result.updatedAt,
      timeSpent: result.timeSpent || 0
    });
    setShowTraineeModal(true);
  };

  const openExamModal = (deploymentId) => {
    const exam = deployments.find((d) => (d._id === deploymentId));
    if (!exam) return;
    // Compute counts
    const completed = (exam.results || []).filter((r) => r.status === 'completed' || (typeof r.totalScore === 'number')).length;
    const inProgress = (exam.results || []).filter((r) => r.status === 'in_progress').length;
    const assigned = (exam.targetTrainees || []).length;
    const notStarted = Math.max(assigned - completed - inProgress, 0);
    setSelectedExam({
      id: exam._id,
      name: exam.name,
      scheduledDateTime: exam.scheduledDateTime,
      duration: exam.duration,
      totalAssigned: assigned,
      totalWritten: completed,
      currentlyWriting: inProgress,
      notStarted,
    });
    setShowExamModal(true);
  };

  const handleDownloadCSV = () => {
    setShowDownloadModal(true);
  };

  const downloadSelectedExamCSV = () => {
    if (!selectedExamForDownload) return;
    
    const exam = deployments.find(d => d._id === selectedExamForDownload);
    if (!exam) return;

    // Get completed results for this exam
    const completedResults = (exam.results || []).filter(r => 
      r.status === 'completed' || (typeof r.totalScore === 'number')
    );

    // Create CSV content
    const csvHeaders = ['Trainee', 'Trainee ID', 'Score', 'Submitted'];
    const csvRows = completedResults.map(result => {
      const score = result.totalScore || 0;
      const maxScore = result.maxScore || exam.questions?.length || 0;
      const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
      const submitted = result.submittedAt || result.submitted_at || result.submitted || result.completedAt || result.updatedAt;
      
      return [
        result.traineeName || '',
        result.traineeId || '',
        `${score}/${maxScore} (${percentage}%)`,
        submitted ? new Date(submitted).toLocaleString() : 'Not Available'
      ];
    });

    // Combine headers and rows
    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${exam.name}_results.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setShowDownloadModal(false);
    setSelectedExamForDownload(null);
  };

  const handleUploadResults = async (examId) => {
    try {
      // Set loading state
      setUploadingExams(prev => ({ ...prev, [examId]: true }));

      // Find the exam
      const exam = deployments.find(d => d._id === examId);
      if (!exam) {
        toast.error('Exam not found');
        return;
      }

      // Get completed results for this exam
      const completedResults = (exam.results || []).filter(r => 
        r.status === 'completed' || (typeof r.totalScore === 'number')
      );

      if (completedResults.length === 0) {
        toast.error('No completed results found for this exam');
        return;
      }

      // Upload results to trainee accounts
      
      const response = await axiosInstance.post(API_PATHS.BOA.UPLOAD_RESULTS, {
        examId: examId,
        results: completedResults
      });

      if (response.data.success) {
        toast.success(`Successfully uploaded results for ${completedResults.length} trainees`);
        // Mark as uploaded immediately for UI feedback
        setUploadedExams(prev => ({ ...prev, [examId]: true }));
        // Refresh the data after a short delay to ensure backend has processed
        setTimeout(() => {
          fetchResults();
        }, 1000);
      } else {
        toast.error(response.data.message || 'Failed to upload results');
      }
    } catch (error) {
      console.error('Error uploading results:', error);
      toast.error('Failed to upload results');
    } finally {
      // Clear loading state
      setUploadingExams(prev => ({ ...prev, [examId]: false }));
    }
  };

  return (
    <DashboardLayout activeMenu="Results">
      <div className="mt-5 mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LuFileText className="w-6 h-6" /> Results
          </h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <LuSearch className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search by trainee, ID, or exam"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button 
              onClick={handleDownloadCSV}
              className="px-4 py-2 bg-gray-100 rounded-lg border hover:bg-gray-200 flex items-center gap-2 text-sm"
            >
              <LuDownload className="w-4 h-4" /> Download CSV
            </button>
          </div>
        </div>

        {/* Exams (click to dropdown counts) */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          <div className="px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-600">Exams</div>
          {examStats.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No exams found</div>
          ) : (
            examStats.map((e) => (
              <div key={e.id} className="border-t">
                <button
                  type="button"
                  onClick={() => toggleExpand(e.id)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="font-medium text-gray-900 truncate">{e.name}</div>
                  <div className="text-sm text-gray-600 flex items-center gap-4">
                    <span>Written: <span className="font-semibold text-green-700">{e.totalWritten}</span></span>
                    <span>Writing: <span className="font-semibold text-orange-700">{e.currentlyWriting}</span></span>
                    <span>Not started: <span className="font-semibold text-purple-700">{e.notStarted}</span></span>
                    <span>Assigned: <span className="font-semibold text-blue-700">{e.totalAssigned}</span></span>
                  </div>
                </button>
                {expanded[e.id] && (
                  <div className="px-4 pb-4">
                    {/* Header like reference image */}
                    <div className="grid grid-cols-12 px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-600 rounded-t-lg border border-gray-200 border-b-0">
                      <div className="col-span-4">Trainee</div>
                      <div className="col-span-4">Trainee ID</div>
                      <div className="col-span-2">Score</div>
                      <div className="col-span-2 text-right">Submitted</div>
                    </div>

                    {/* Rows */}
                    <div className="border border-gray-200 rounded-b-lg overflow-hidden">
                      {(deployments.find(d => d._id === e.id)?.results || [])
                        .filter(r => (r.status === 'completed') || (typeof r.totalScore === 'number'))
                        .map((r, idx) => {
                          const score = typeof r.totalScore === 'number' ? r.totalScore : '-';
                          const maxScore = typeof r.maxScore === 'number' ? r.maxScore : (deployments.find(d => d._id === e.id)?.questions?.length || '-');
                          const perc = typeof r.percentage === 'number' 
                            ? Math.round(r.percentage)
                            : (typeof r.totalScore === 'number' && typeof maxScore === 'number' && maxScore > 0
                                ? Math.round((r.totalScore / maxScore) * 100)
                                : 0);
                          const parent = deployments.find(d => d._id === e.id) || {};
                          const submitted = r.submittedAt || r.submitted_at || r.submitted || r.updatedAt || r.createdAt || parent.updatedAt || parent.createdAt;

                          return (
                            <div key={`${r.traineeId}-${idx}`} className="grid grid-cols-12 px-4 py-3 text-sm border-t hover:bg-gray-50 cursor-pointer" onClick={() => openTraineeModal(r.traineeId, e.id)}>
                              <div className="col-span-4 truncate">{r.traineeName || '-'}</div>
                              <div className="col-span-4 truncate">{r.traineeId || '-'}</div>
                              <div className="col-span-2">{`${score}/${maxScore} (${perc}%)`}</div>
                              <div className="col-span-2 text-right">{submitted ? new Date(submitted).toLocaleString() : '-'}</div>
                            </div>
                          );
                        })}
                    </div>

                    {/* Upload Results Button */}
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => handleUploadResults(e.id)}
                        disabled={uploadingExams[e.id] || uploadedExams[e.id]}
                        className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                          uploadedExams[e.id] 
                            ? 'bg-gray-500 text-white cursor-not-allowed' 
                            : uploadingExams[e.id]
                            ? 'bg-blue-500 text-white cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {uploadingExams[e.id] ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Uploading...
                          </>
                        ) : uploadedExams[e.id] ? (
                          <>
                            <LuCheck className="w-4 h-4" />
                            Uploaded
                          </>
                        ) : (
                          <>
                            <LuUpload className="w-4 h-4" />
                            Upload Results
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Detailed submissions table removed as requested */}

        {/* Exam Summary Modal */}
        {showExamModal && selectedExam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{selectedExam.name}</h3>
                  <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowExamModal(false)}>✕</button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-700">{selectedExam.totalWritten}</div>
                    <div className="text-xs text-green-800">Written</div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-orange-700">{selectedExam.currentlyWriting}</div>
                    <div className="text-xs text-orange-800">Writing Now</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-700">{selectedExam.notStarted}</div>
                    <div className="text-xs text-purple-800">Not Started</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-700">{selectedExam.totalAssigned}</div>
                    <div className="text-xs text-blue-800">Assigned</div>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <div>Scheduled: {selectedExam.scheduledDateTime ? new Date(selectedExam.scheduledDateTime).toLocaleString() : '-'}</div>
                  <div>Duration: {selectedExam.duration} mins</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trainee Exam Details Modal */}
        {showTraineeModal && selectedTrainee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedTrainee.traineeName}</h3>
                    <p className="text-gray-600">Exam: {selectedTrainee.deploymentName}</p>
                    <p className="text-sm text-gray-500">
                      Score: {selectedTrainee.totalScore}/{selectedTrainee.maxScore} ({Math.round(selectedTrainee.percentage)}%) | 
                      Submitted: {selectedTrainee.submittedAt ? new Date(selectedTrainee.submittedAt).toLocaleString() : 'Not Available'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowTraineeModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <LuX className="w-6 h-6" />
                  </button>
                </div>

                {/* Questions and Answers */}
                <div className="space-y-6">
                  {selectedTrainee.questions.map((question, qIndex) => {
                    const answer = selectedTrainee.answers.find(a => a.questionIndex === qIndex);
                    const isCorrect = answer?.isCorrect || false;
                    const selectedAnswer = answer?.selectedAnswer || '';
                    
                    return (
                      <div key={qIndex} className="border border-gray-200 rounded-lg p-4">
                        {/* Question Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">
                              Q.{qIndex + 1} {question.question}
                            </h4>
                          </div>
                          <div className="ml-4 bg-gray-50 p-3 rounded-lg text-sm">
                            <div className="font-medium">Question ID: {question.id || question._id || `q-${qIndex + 1}`}</div>
                            <div className="text-gray-600">Status: {answer ? 'Answered' : 'Not Answered'}</div>
                            <div className="text-gray-600">Chosen Option: {answer ? (() => {
                              const optionIndex = question.options.findIndex(opt => {
                                const optText = typeof opt === 'string' ? opt : opt.text;
                                return optText === selectedAnswer;
                              });
                              return optionIndex !== -1 ? (optionIndex + 1) : 'Invalid';
                            })() : '--'}</div>
                          </div>
                        </div>

                        {/* Answer Options */}
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700 mb-2">Ans</p>
                          {question.options?.map((option, optIndex) => {
                            // Handle both old string format and new object format
                            const optionText = typeof option === 'string' ? option : option.text;
                            const isSelected = optionText === selectedAnswer;
                            const isCorrectAnswer = optionText === question.correctAnswer;
                            
                            return (
                              <div key={optIndex} className="flex items-center space-x-3 py-2">
                                {/* Status Icon */}
                                <div className="flex-shrink-0">
                                  {isCorrectAnswer ? (
                                    <LuCheck className="w-5 h-5 text-green-600" />
                                  ) : isSelected ? (
                                    <LuX className="w-5 h-5 text-red-600" />
                                  ) : (
                                    <LuX className="w-5 h-5 text-red-400" />
                                  )}
                                </div>
                                
                                {/* Option Number and Text */}
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-gray-700">{optIndex + 1}.</span>
                                  <div className="flex flex-col">
                                    <span className="text-gray-900">{optionText}</span>
                                    {option.image && (
                                      <span className="text-xs text-blue-600">📷 Image available</span>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Correct Answer Indicator */}
                                {isCorrectAnswer && !isSelected && (
                                  <span className="text-xs text-green-600 font-medium">(Correct Answer)</span>
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

        {/* Download CSV Modal */}
        {showDownloadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Download CSV</h3>
                  <button
                    onClick={() => setShowDownloadModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <LuX className="w-6 h-6" />
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-gray-600 mb-4">Select an exam to download results:</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {examStats.map((exam) => (
                      <div
                        key={exam.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedExamForDownload === exam.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedExamForDownload(exam.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{exam.name}</h4>
                            <p className="text-sm text-gray-500">
                              Written: {exam.totalWritten} | Assigned: {exam.totalAssigned}
                            </p>
                          </div>
                          <div className="text-sm text-gray-500">
                            {exam.scheduledDateTime ? new Date(exam.scheduledDateTime).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDownloadModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={downloadSelectedExamCSV}
                    disabled={!selectedExamForDownload}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <LuDownload className="w-4 h-4" />
                    Download CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Results;

