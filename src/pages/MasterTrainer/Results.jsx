import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { LuSearch, LuDownload, LuFileText, LuX, LuCheck } from "react-icons/lu";
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

  const fetchResults = async () => {
    try {
      // Read deployments with results for Master Trainer (completed/in_progress records)
      const res = await axiosInstance.get(API_PATHS.MASTER_TRAINER.MCQ_DEPLOYMENTS);
      const deployments = res.data.deployments || [];
      setDeployments(deployments);
      const flat = deployments.flatMap((d) =>
        (d.results || []).map((r) => ({
          ...r,
          examName: d.name,
          examId: d._id,
          exam_id: d._id, // Add both for compatibility
          scheduledDateTime: d.scheduledDateTime,
          duration: d.duration,
        }))
      );
      setResults(flat);
    } catch (error) {
      console.error("Error fetching results:", error);
      toast.error("Failed to fetch results");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  // Process exams to get counts
  const processedExams = deployments.map((exam) => {
    const results = exam.results || [];
    const totalWritten = results.filter((r) => r.status === "completed").length;
    const currentlyWriting = results.filter((r) => r.status === "in_progress").length;
    const notStarted = exam.targetTrainees.length - totalWritten - currentlyWriting;
    const totalAssigned = exam.targetTrainees.length;

    return {
      ...exam,
      totalWritten,
      currentlyWriting,
      notStarted,
      totalAssigned,
    };
  });

  const toggleExpand = (examId) => {
    setExpanded((prev) => ({ ...prev, [examId]: !prev[examId] }));
  };

  const openTraineeModal = (trainee) => {
    const result = trainee;
    
    // Find the exam by checking both _id and examId
    const exam = deployments.find((d) => d._id === result.examId || d._id === result.exam_id);
    
    if (!exam) {
      toast.error("Exam data not found");
      return;
    }

    if (!exam.questions || exam.questions.length === 0) {
      toast.error("Question data not found");
      return;
    }

    // Process all questions with answers
    const questionsWithAnswers = exam.questions.map((question, index) => {
      const answer = result.answers?.[index] || {};
      const selectedAnswer = answer.selectedAnswer || "Not answered";
      const correctAnswer = question.correctAnswer;
      const isCorrect = selectedAnswer === correctAnswer;

      return {
        ...question,
        selectedAnswer,
        correctAnswer,
        isCorrect,
        questionNumber: index + 1
      };
    });

    setSelectedTrainee({
      ...result,
      examName: exam.name,
      questions: questionsWithAnswers,
      percentage: result.percentage || 0,
      submittedAt: result.completedAt || result.submittedAt || "Not Available",
    });
    setShowTraineeModal(true);
  };

  const closeTraineeModal = () => {
    setShowTraineeModal(false);
    setSelectedTrainee(null);
  };

  const handleDownloadCSV = () => {
    setShowDownloadModal(true);
  };

  const downloadSelectedExamCSV = () => {
    if (!selectedExamForDownload) return;

    const exam = deployments.find((d) => d._id === selectedExamForDownload);
    if (!exam) return;

    const results = exam.results || [];
    const csvData = results.map((result, index) => ({
      "S.No": index + 1,
      "Trainee Name": result.traineeName || "Unknown",
      "Trainee ID": result.traineeId || "Unknown",
      "Score": `${result.totalScore || 0}/${result.maxScore || 0}`,
      "Percentage": `${Math.round(result.percentage || 0)}%`,
      "Status": result.status || "Unknown",
      "Submitted At": result.completedAt ? new Date(result.completedAt).toLocaleString() : "Not Available",
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exam.name}_results.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    setShowDownloadModal(false);
    setSelectedExamForDownload(null);
    toast.success("CSV downloaded successfully");
  };

  const filteredExams = processedExams.filter((exam) =>
    exam.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading results...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">MCQ Exam Results</h1>
          <p className="text-gray-600">View and manage MCQ exam results for all trainees</p>
        </div>

        {/* Search and Actions */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search exams..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleDownloadCSV}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <LuDownload className="w-4 h-4" />
            <span>Download CSV</span>
          </button>
        </div>

        {/* Results List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {filteredExams.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <LuFileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No exam results found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredExams.map((exam) => (
                <div key={exam._id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {exam.name}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span>Total Assigned: {exam.totalAssigned}</span>
                        <span>Completed: {exam.totalWritten}</span>
                        <span>Currently Writing: {exam.currentlyWriting}</span>
                        <span>Not Started: {exam.notStarted}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleExpand(exam._id)}
                        className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        {expanded[exam._id] ? "Hide Details" : "View Details"}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expanded[exam._id] && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-3">
                        Completed Submissions ({exam.totalWritten})
                      </h4>
                      {exam.results && exam.results.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Trainee
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Trainee ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Score
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Submitted
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {exam.results
                                .filter((result) => result.status === "completed")
                                .map((result, index) => (
                                  <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {result.traineeName || "Unknown"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {result.traineeId || "Unknown"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {result.totalScore || 0}/{result.maxScore || 0} (
                                      {Math.round(result.percentage || 0)}%)
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {result.completedAt
                                        ? new Date(result.completedAt).toLocaleString()
                                        : "Not Available"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                      <button
                                        onClick={() => openTraineeModal({...result, examId: exam._id, exam_id: exam._id})}
                                        className="text-blue-600 hover:text-blue-900"
                                      >
                                        View Details
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No completed submissions yet</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Download CSV Modal */}
        {showDownloadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Download CSV</h3>
              <div className="space-y-2 mb-6">
                {deployments.map((exam) => (
                  <button
                    key={exam._id}
                    onClick={() => setSelectedExamForDownload(exam._id)}
                    className={`w-full text-left p-3 rounded-lg border ${
                      selectedExamForDownload === exam._id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {exam.name}
                  </button>
                ))}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={downloadSelectedExamCSV}
                  disabled={!selectedExamForDownload}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Download
                </button>
                <button
                  onClick={() => setShowDownloadModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Trainee Exam Details Modal */}
        {showTraineeModal && selectedTrainee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">Exam Details</h3>
                  <button
                    onClick={closeTraineeModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <LuX className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Exam Name</h4>
                    <p className="text-gray-600">{selectedTrainee.examName}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Score</h4>
                    <p className="text-lg font-bold text-blue-600">
                      {selectedTrainee.totalScore || 0}/{selectedTrainee.maxScore || 0} (
                      {Math.round(selectedTrainee.percentage || 0)}%)
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Submitted</h4>
                    <p className="text-gray-600">
                      {new Date(selectedTrainee.submittedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium text-gray-900 mb-4">Question Details</h4>
                  <div className="space-y-6">
                    {selectedTrainee.questions?.map((question, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-700">
                            Question {question.questionNumber}: {question.question}
                          </h5>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              question.isCorrect
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {question.isCorrect ? "Correct" : "Incorrect"}
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-1">Selected Answer:</p>
                              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                                {question.selectedAnswer}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-1">Correct Answer:</p>
                              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                                {question.correctAnswer}
                              </p>
                            </div>
                          </div>
                          
                          {question.options && question.options.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-2">All Options:</p>
                              <div className="space-y-1">
                                {question.options.map((option, optIndex) => {
                                  const optionText = typeof option === 'string' ? option : option.text;
                                  const isSelected = optionText === question.selectedAnswer;
                                  const isCorrect = optionText === question.correctAnswer;
                                  
                                  return (
                                    <div key={optIndex} className={`flex items-center space-x-2 p-2 rounded ${
                                      isCorrect ? 'bg-green-50 border border-green-200' : 
                                      isSelected ? 'bg-red-50 border border-red-200' : 
                                      'bg-gray-50'
                                    }`}>
                                      <div className="flex items-center space-x-2">
                                        {isCorrect ? (
                                          <LuCheck className="w-4 h-4 text-green-600" />
                                        ) : isSelected ? (
                                          <LuX className="w-4 h-4 text-red-600" />
                                        ) : (
                                          <div className="w-4 h-4 border border-gray-300 rounded"></div>
                                        )}
                                        <span className="font-medium">{optIndex + 1}.</span>
                                      </div>
                                      <div className="flex-1">
                                        <span className={`${
                                          isCorrect ? 'text-green-800 font-medium' : 
                                          isSelected && !question.isCorrect ? 'text-red-800' : 
                                          'text-gray-700'
                                        }`}>
                                          {optionText}
                                        </span>
                                        {option.image && (
                                          <div className="mt-1 text-xs text-blue-600">📷 Image available</div>
                                        )}
                                      </div>
                                      {isCorrect && (
                                        <span className="text-green-600 text-sm font-medium">(Correct Answer)</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
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
