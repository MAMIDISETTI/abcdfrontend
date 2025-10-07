import React, { useState, useContext, useEffect } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { 
  LuDownload,
  LuVideo,
  LuFileText,
  LuStar,
  LuX,
  LuEye,
  LuUser,
  LuMessageSquare,
  LuPlay,
  LuCheck,
  LuChevronDown,
  LuLoader
} from 'react-icons/lu';
import { UserContext } from '../../context/userContext';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import moment from 'moment';

const TrainerDemoManagement = () => {
  const { user } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState('reviews');
  const [pendingReviews, setPendingReviews] = useState([]);
  const [reviewedDemos, setReviewedDemos] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState(null);
  const [reviewData, setReviewData] = useState({
    rating: 0,
    feedback: '',
    action: 'approve' // 'approve' or 'reject'
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [offlineDemos, setOfflineDemos] = useState([]);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [selectedOfflineDemo, setSelectedOfflineDemo] = useState(null);
  const [showCreateOfflineModal, setShowCreateOfflineModal] = useState(false);
  const [assignedTrainees, setAssignedTrainees] = useState([]);
  const [createOfflineData, setCreateOfflineData] = useState({
    traineeId: '',
    feedback: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);
  const [showDemoDetailsModal, setShowDemoDetailsModal] = useState(false);
  const [selectedDemoDetails, setSelectedDemoDetails] = useState(null);
  const [isEditingDemo, setIsEditingDemo] = useState(false);
  const [editedDemoData, setEditedDemoData] = useState({});
  const [evaluationData, setEvaluationData] = useState({
    // Candidate Details
    candidateId: '',
    demoTitle: '',
    takenBy: '',
    date: '',
    track: '',
    topic: '',
    
    // Preparedness
    slideUsage: '',
    referenceVideoWatched: '',
    contentFamiliarity: '',
    timeManagement: '',
    
    // Delivery
    voiceModulation: '',
    bodyLanguage: '',
    languageClarity: '',
    paceOfDelivery: '',
    boardUsage: '',
    handsOnCoding: '',
    classEngagement: '',
    usageOfExample: '',
    
    // Content Knowledge
    keyConceptsCovered: '',
    accuracyOfInformation: '',
    flowOfContent: '',
    
    // Overall Clarity
    overallRating: '',
    // Reattempt Needed
    reattemptNeeded: null
  });
  const [expandedSections, setExpandedSections] = useState({
    candidateDetails: false,
    preparedness: false,
    delivery: false,
    contentKnowledge: false,
    overallClarity: false,
    reattemptNeeded: false
  });

  // Load data on component mount
  useEffect(() => {
    fetchPendingReviews();
    fetchReviewedDemos();
    fetchOfflineDemos();
  }, []);

  // Refresh data when switching tabs
  useEffect(() => {
    if (activeTab === 'manage') {
      fetchReviewedDemos();
    } else if (activeTab === 'reviews') {
      fetchPendingReviews();
    } else if (activeTab === 'offline') {
      fetchOfflineDemos();
    }
  }, [activeTab]);

  const fetchPendingReviews = async () => {
    try {
      
      // Fetch demos from assigned trainees that are under review
      // This includes both regular demos under review and offline demos pending approval
      
      const demosResponse = await axiosInstance.get(API_PATHS.DEMO.GET_ALL, {
        params: { 
          // Don't filter by status - we want to get all demos and filter on frontend
        }
      });
      
      if (demosResponse.data.success && demosResponse.data.demos) {
        // Filter demos that need review by this trainer
        const pendingDemos = demosResponse.data.demos.filter(demo => {
          // Regular demos that are under review and assigned to this trainer
          const isUnderReview = demo.status === 'under_review';
          
          // Offline demos created by this trainer that are pending approval
          const isPendingOfflineDemo = demo.type === 'offline_demo' && 
            demo.createdBy === (user?.author_id || user?.id) && 
            demo.status === 'pending_approval';
          
          return isUnderReview || isPendingOfflineDemo;
        });
        
        setPendingReviews(pendingDemos);
      } else {
        setPendingReviews([]);
      }
    } catch (error) {
      
      toast.error('Failed to fetch pending reviews. Please try again.');
      setPendingReviews([]);
    }
  };

  const fetchReviewedDemos = async () => {
    try {
      
      // Fetch demos from assigned trainees that have been reviewed by this trainer
      // We need to get all demos and filter by trainerStatus on the frontend
      const demosResponse = await axiosInstance.get(API_PATHS.DEMO.GET_ALL, {
        params: { 
          // Don't filter by status - we want all demos to check trainerStatus
        }
      });
      
      if (demosResponse.data.success && demosResponse.data.demos) {
        
        // Filter demos that have been reviewed by this trainer OR are offline demos approved by master trainer
        const reviewedDemos = demosResponse.data.demos.filter(demo => {
          // Regular demos that have been reviewed by this trainer
          const hasTrainerStatus = demo.trainerStatus === 'approved' || demo.trainerStatus === 'rejected';
          
          // Offline demos created by this trainer that have been approved by master trainer
          const isApprovedOfflineDemo = demo.type === 'offline_demo' && 
            demo.createdBy === (user?.author_id || user?.id) && 
            demo.status === 'approved';
          
          return hasTrainerStatus || isApprovedOfflineDemo;
        });
        
        setReviewedDemos(reviewedDemos);
      } else {
        setReviewedDemos([]);
      }
    } catch (error) {
      
      toast.error('Failed to fetch reviewed demos. Please try again.');
      setReviewedDemos([]);
    }
  };

  const fetchOfflineDemos = async () => {
    try {
      // Fetch offline demos - demos that are not uploaded online
      const demosResponse = await axiosInstance.get(API_PATHS.DEMO.GET_ALL, {
        params: { 
          status: 'pending_approval,approved',
          trainerId: user?.author_id || user?.id
        }
      });

      let demos = [];
      if (demosResponse.data && Array.isArray(demosResponse.data)) {
        demos = demosResponse.data;
      } else if (demosResponse.data && demosResponse.data.demos) {
        demos = demosResponse.data.demos;
      }

      // Filter to only show offline demos
      demos = demos.filter(demo => demo.type === 'offline_demo');

      setOfflineDemos(demos);
    } catch (error) {
      
      toast.error('Failed to fetch offline demos. Please try again.');
      setOfflineDemos([]);
    }
  };

  const openEvaluationModal = (demo) => {
    setSelectedOfflineDemo(demo);
    setEvaluationData({
      candidateId: demo.traineeId || demo.trainee_id || '',
      demoTitle: demo.title || demo.demoTitle || '',
      takenBy: demo.traineeName || demo.takenBy || '',
      date: demo.uploadedAt || demo.createdAt || '',
      track: demo.courseTag || demo.track || '',
      topic: demo.topic || '',
      slideUsage: '',
      referenceVideoWatched: '',
      contentFamiliarity: '',
      timeManagement: '',
      voiceModulation: '',
      bodyLanguage: '',
      languageClarity: '',
      paceOfDelivery: '',
      boardUsage: '',
      handsOnCoding: '',
      classEngagement: '',
      usageOfExample: '',
      keyConceptsCovered: '',
      accuracyOfInformation: '',
      flowOfContent: '',
      overallClarity: '',
      reattemptNeeded: false,
      overallRating: 0,
      comments: ''
    });
    setShowEvaluationModal(true);
  };

  const closeEvaluationModal = () => {
    setShowEvaluationModal(false);
    setSelectedOfflineDemo(null);
    setEvaluationData({
      candidateId: '',
      demoTitle: '',
      takenBy: '',
      date: '',
      track: '',
      topic: '',
      slideUsage: '',
      referenceVideoWatched: '',
      contentFamiliarity: '',
      timeManagement: '',
      voiceModulation: '',
      bodyLanguage: '',
      languageClarity: '',
      paceOfDelivery: '',
      boardUsage: '',
      handsOnCoding: '',
      classEngagement: '',
      usageOfExample: '',
      keyConceptsCovered: '',
      accuracyOfInformation: '',
      flowOfContent: '',
      overallClarity: '',
      reattemptNeeded: false,
      overallRating: 0,
      comments: ''
    });
  };

  const handleEvaluationSubmit = async () => {
    try {
      // Submit evaluation data
      const evaluationPayload = {
        demoId: selectedOfflineDemo.id || selectedOfflineDemo._id,
        traineeId: evaluationData.candidateId,
        evaluationData: evaluationData,
        evaluatedBy: user?.author_id || user?.id,
        evaluatedAt: new Date().toISOString()
      };

      // Here you would make an API call to save the evaluation
      toast.success('Evaluation submitted successfully!');
      closeEvaluationModal();
      
      // Refresh offline demos
      fetchOfflineDemos();
    } catch (error) {
      
      toast.error('Failed to submit evaluation. Please try again.');
    }
  };

  const fetchAssignedTrainees = async () => {
    try {
      // Fetch trainees assigned to this trainer
      const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS, {
        params: {
          role: 'trainee'
        }
      });

      let allTrainees = [];
      if (response.data && Array.isArray(response.data)) {
        allTrainees = response.data;
      } else if (response.data && response.data.users) {
        allTrainees = response.data.users;
      } else if (response.data && response.data.data) {
        allTrainees = response.data.data;
      }

      // Filter trainees assigned to this trainer
      const trainerId = user?.author_id || user?.id;
      const trainerObjectId = user?._id;
      
      const assignedTraineesList = allTrainees.filter(trainee => {
        // Check if trainee has assignedTrainer field that matches current trainer
        const assignedTrainerId = trainee.assignedTrainer?._id || trainee.assignedTrainer;
        const assignedTrainerString = trainee.assignedTrainer?.toString();
        
        // Check both string and ObjectId matches
        return assignedTrainerId === trainerId || 
               assignedTrainerId === trainerObjectId ||
               assignedTrainerString === trainerId ||
               assignedTrainerString === trainerObjectId;
      });

      // If no assigned trainees found, show all trainees for testing
      if (assignedTraineesList.length === 0) {
        setAssignedTrainees(allTrainees);
      } else {
        setAssignedTrainees(assignedTraineesList);
      }
    } catch (error) {
      
      toast.error('Failed to fetch assigned trainees. Please try again.');
      setAssignedTrainees([]);
    }
  };

  const openCreateOfflineModal = () => {
    setCreateOfflineData({
      traineeId: '',
      demoTitle: '',
      topic: '',
      track: '',
      description: '',
      instructions: '',
      deadline: '',
      referenceMaterials: ''
    });
    setShowCreateOfflineModal(true);
    fetchAssignedTrainees();
  };

  const closeCreateOfflineModal = () => {
    setShowCreateOfflineModal(false);
    setCreateOfflineData({
      traineeId: '',
      feedback: ''
    });
    // Reset evaluation data
    setEvaluationData({
      candidateId: '',
      demoTitle: '',
      takenBy: '',
      date: '',
      track: '',
      topic: '',
      slideUsage: '',
      referenceVideoWatched: '',
      contentFamiliarity: '',
      timeManagement: '',
      voiceModulation: '',
      bodyLanguage: '',
      languageClarity: '',
      paceOfDelivery: '',
      boardUsage: '',
      handsOnCoding: '',
      classEngagement: '',
      usageOfExample: '',
      keyConceptsCovered: '',
      accuracyOfInformation: '',
      flowOfContent: '',
      overallRating: '',
      reattemptNeeded: null
    });
  };

  const handleCreateOfflineDemo = () => {
    // Validate required fields
    if (!createOfflineData.traineeId || !createOfflineData.feedback) {
      toast.error('Please select a trainee and provide feedback');
      return;
    }

    // Get selected trainee details
    const selectedTrainee = assignedTrainees.find(trainee => 
      (trainee.author_id || trainee._id) === createOfflineData.traineeId
    );

    // Prepare confirmation data
    const confirmationData = {
      trainee: selectedTrainee,
      feedback: createOfflineData.feedback,
      evaluationData: evaluationData
    };

    setConfirmationData(confirmationData);
    setShowConfirmationModal(true);
  };

  const handleConfirmSubmission = async () => {
    try {
      setIsSubmitting(true);

      // Create offline demo payload
      const offlineDemoPayload = {
        traineeId: createOfflineData.traineeId,
        feedback: createOfflineData.feedback,
        createdBy: user?.author_id || user?.id,
        status: 'pending_approval', // Will be approved by master trainer
        type: 'offline_demo',
        // Include evaluation data
        evaluationData: {
          candidateId: evaluationData.candidateId,
          demoTitle: evaluationData.demoTitle,
          takenBy: evaluationData.takenBy,
          date: evaluationData.date,
          track: evaluationData.track,
          topic: evaluationData.topic,
          slideUsage: evaluationData.slideUsage,
          referenceVideoWatched: evaluationData.referenceVideoWatched,
          contentFamiliarity: evaluationData.contentFamiliarity,
          timeManagement: evaluationData.timeManagement,
          voiceModulation: evaluationData.voiceModulation,
          bodyLanguage: evaluationData.bodyLanguage,
          languageClarity: evaluationData.languageClarity,
          paceOfDelivery: evaluationData.paceOfDelivery,
          boardUsage: evaluationData.boardUsage,
          handsOnCoding: evaluationData.handsOnCoding,
          classEngagement: evaluationData.classEngagement,
          usageOfExample: evaluationData.usageOfExample,
          keyConceptsCovered: evaluationData.keyConceptsCovered,
          accuracyOfInformation: evaluationData.accuracyOfInformation,
          flowOfContent: evaluationData.flowOfContent,
          overallRating: evaluationData.overallRating,
          reattemptNeeded: evaluationData.reattemptNeeded
        }
      };

      // Submit to API - this will be stored in users table under demo_managements_details
      const response = await axiosInstance.post('/api/demos/offline', offlineDemoPayload);
      
      if (response.data) {
        toast.success('Offline demo created successfully! Awaiting master trainer approval.');
        setShowConfirmationModal(false);
        closeCreateOfflineModal();
        fetchOfflineDemos(); // Refresh the list
      }
    } catch (error) {
      
      toast.error('Failed to create offline demo. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeConfirmationModal = () => {
    setShowConfirmationModal(false);
    setConfirmationData(null);
  };

  // Mapping function to convert raw values to human-readable labels
  const getEvaluationLabel = (field, value) => {
    if (!value) return 'Not specified';
    
    const mappings = {
      slideUsage: {
        'excellent': 'Excellent - Fully Followed',
        'good': 'Good - Partially Used',
        'poor': 'Poor - Not Used'
      },
      referenceVideoWatched: {
        'yes': 'Yes',
        'no': 'No',
        'partially': 'Partially Watched',
        'not-available': 'Video not available'
      },
      contentFamiliarity: {
        'excellent': 'Excellent - Confident with the concepts',
        'fair': 'Fair - Partial, not clear with some concepts',
        'poor': 'Poor - Not confident, ambiguous'
      },
      timeManagement: {
        'excellent': 'Excellent - On Time',
        'needs-improvement': 'Needs Improvement - Exceeded',
        'fair': 'Fair - Completed Quick'
      },
      voiceModulation: {
        'excellent': 'Excellent - Loud and clear',
        'fair': 'Fair - Monotone, needs improvement',
        'good': 'Good - Loud but no modulation',
        'poor': 'Poor - Very low'
      },
      bodyLanguage: {
        'excellent': 'Excellent – Confident, open posture, great eye contact',
        'very-good': 'Very Good – Mostly confident',
        'fair': 'Fair – Minimal gestures',
        'poor': 'Poor – Closed posture'
      },
      languageClarity: {
        'excellent': 'Excellent – Clear, fluent, engaging',
        'very-good': 'Very Good – Mostly clear',
        'fair': 'Fair – Frequent mistakes',
        'poor': 'Poor – Unclear/confusing'
      },
      paceOfDelivery: {
        'excellent': 'Excellent – Well-paced',
        'very-good': 'Very Good – Slightly fast/slow',
        'fair': 'Fair – Too fast/slow',
        'poor': 'Poor – Very rushed or dragging'
      },
      boardUsage: {
        'excellent': 'Excellent – Used effectively',
        'very-good': 'Very Good – Used most of the time',
        'fair': 'Fair – Used most of the time',
        'poor': 'Poor – Not used'
      },
      handsOnCoding: {
        'excellent': 'Excellent – Coded and explained well',
        'very-good': 'Very Good – Good coding with explanation',
        'good': 'Good – Wrote code then explained',
        'fair': 'Fair – Limited coding',
        'poor': 'Poor – No coding'
      },
      classEngagement: {
        'excellent': 'Excellent – Highly engaging',
        'very-good': 'Very Good – Good engagement',
        'good': 'Good – Some effort to engage',
        'fair': 'Fair – Limited engagement',
        'poor': 'Poor – No engagement'
      },
      usageOfExample: {
        'excellent': 'Excellent – Many clear examples',
        'very-good': 'Very Good – Good examples',
        'good': 'Good – Some good examples',
        'fair': 'Fair – Few examples, unclear',
        'poor': 'Poor – No examples'
      },
      keyConceptsCovered: {
        'excellent': 'Excellent – All concepts covered',
        'very-good': 'Very Good – Most concepts covered',
        'good': 'Good – Good coverage',
        'fair': 'Fair – Some concepts missed',
        'poor': 'Poor – Many concepts missed'
      },
      accuracyOfInformation: {
        'excellent': 'Excellent – Highly accurate',
        'very-good': 'Very Good – Mostly accurate',
        'good': 'Good – Generally accurate',
        'fair': 'Fair – Not aligned but okay',
        'poor': 'Poor – Inaccurate information'
      },
      flowOfContent: {
        'excellent': 'Excellent – Very smooth',
        'very-good': 'Very Good – Mostly smooth',
        'good': 'Good – Mostly smooth',
        'fair': 'Fair – Some confusion',
        'poor': 'Poor – Very confusing'
      }
    };

    return mappings[field]?.[value] || value;
  };

  // Demo details functions
  const openDemoDetailsModal = (demo) => {
    setSelectedDemoDetails(demo);
    setEditedDemoData(demo);
    setIsEditingDemo(demo.status === 'pending_approval');
    setShowDemoDetailsModal(true);
  };

  const closeDemoDetailsModal = () => {
    setShowDemoDetailsModal(false);
    setSelectedDemoDetails(null);
    setIsEditingDemo(false);
    setEditedDemoData({});
  };

  const handleEditToggle = () => {
    setIsEditingDemo(!isEditingDemo);
    if (!isEditingDemo) {
      setEditedDemoData(selectedDemoDetails);
    }
  };

  const handleDemoDataChange = (field, value) => {
    setEditedDemoData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveDemoChanges = async () => {
    try {
      // Here you would make an API call to save the changes
      toast.success('Demo details updated successfully!');
      setIsEditingDemo(false);
      setSelectedDemoDetails(editedDemoData);
    } catch (error) {
      
      toast.error('Failed to save changes. Please try again.');
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const openReviewModal = (demo) => {
    setSelectedDemo(demo);
    setReviewData({
      rating: 0,
      feedback: '',
      action: 'approve'
    });
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setSelectedDemo(null);
  };

  const handleReviewSubmit = async () => {
    if (!selectedDemo) return;

    if (reviewData.action === 'approve' && reviewData.rating === 0) {
      toast.error('Please provide a rating for approved demos');
      return;
    }

    if (reviewData.action === 'reject' && !reviewData.feedback.trim()) {
      toast.error('Please provide feedback for rejected demos');
      return;
    }

    try {
      setIsSubmittingReview(true);
      // Make API call to update demo status
      const reviewPayload = {
        action: reviewData.action,
        rating: reviewData.rating,
        feedback: reviewData.feedback,
        reviewedBy: user?.author_id || user?.id,
        reviewedAt: new Date().toISOString()
      };

      const response = await axiosInstance.put(
        `${API_PATHS.DEMO.UPDATE(selectedDemo.demoId || selectedDemo.id)}/review`,
        reviewPayload
      );

      if (response.data.success) {
        
        // Refresh data from server instead of local state manipulation
        await fetchPendingReviews();
        await fetchReviewedDemos();

        toast.success(`Demo ${reviewData.action === 'approve' ? 'approved' : 'rejected'} successfully!`);
        closeReviewModal();
      } else {
        throw new Error(response.data.message || 'Failed to submit review');
      }
    } catch (error) {
      
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Video viewing functions
  const openVideoModal = (demo) => {
    setSelectedVideo(demo);
    setShowVideoModal(true);
  };

  const closeVideoModal = () => {
    setShowVideoModal(false);
    setSelectedVideo(null);
  };

  return (
    <DashboardLayout activeMenu="Demo Management">
      <div className="p-3 md:p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Demo Management</h1>
          <p className="text-gray-600">Review trainee demos and manage your reviewed demos</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 cursor-pointer ${
                  activeTab === 'reviews'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <LuEye className="w-4 h-4" />
                <span>Pending Reviews</span>
                {pendingReviews.length > 0 && (
                  <span className="ml-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                    {pendingReviews.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 cursor-pointer ${
                  activeTab === 'manage'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <LuVideo className="w-4 h-4" />
                <span>My Demos</span>
              </button>
              <button
                onClick={() => setActiveTab('offline')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 cursor-pointer ${
                  activeTab === 'offline'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <LuFileText className="w-4 h-4" />
                <span>Offline Demos</span>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Pending Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <LuEye className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Pending Reviews</h2>
                        <p className="text-sm text-gray-500">Review trainee demos awaiting your feedback</p>
                      </div>
                    </div>
                  </div>

                  {pendingReviews.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                        <LuEye className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending reviews</h3>
                      <p className="text-gray-500 text-sm max-w-md mx-auto">
                        All trainee demos have been reviewed. New demos will appear here when trainees upload them.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {pendingReviews.map((demo, index) => (
                        <div key={demo.id || demo._id || `pending-${index}`} className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 hover:shadow-md transition-all duration-200">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className="p-2 rounded-lg bg-yellow-100">
                                {demo.type === 'offline_demo' ? (
                                  <LuFileText className="w-4 h-4 text-yellow-600" />
                                ) : (
                                <LuVideo className="w-4 h-4 text-yellow-600" />
                                )}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 text-sm">
                                  {demo.type === 'offline_demo' ? 'Offline Demo' : demo.title}
                                </h3>
                                <p className="text-xs text-gray-500">{demo.courseTag || demo.track}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                                {demo.type === 'offline_demo' ? 'Pending Approval' : 'Under Review'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <p className="text-sm text-gray-600 mb-2">
                              <strong>Trainee:</strong> {demo.traineeName || demo.takenBy}
                            </p>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {demo.description || demo.feedback || 'No description available'}
                            </p>
                          </div>
                          
                          <div className="mb-3 p-2 bg-yellow-100 rounded text-xs">
                            <p className="text-yellow-800 font-medium">
                              {demo.type === 'offline_demo' ? '⏳ Awaiting master trainer approval' : '⏳ Awaiting your review'}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {new Date(demo.uploadedAt || demo.createdAt).toLocaleDateString()}
                            </span>
                            <div className="flex items-center space-x-2">
                              {demo.type !== 'offline_demo' && (
                                <button
                                  onClick={() => openVideoModal(demo)}
                                  className="p-1 text-gray-400 hover:text-green-600 transition-colors cursor-pointer"
                                  title="View Video"
                                >
                                  <LuPlay className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => openReviewModal(demo)}
                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors cursor-pointer"
                              >
                                Review
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* My Demos Tab */}
            {activeTab === 'manage' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <LuVideo className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">My Demos</h2>
                        <p className="text-sm text-gray-500">Demos you have reviewed</p>
                      </div>
                    </div>
                  </div>

                  {reviewedDemos.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                        <LuVideo className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviewed demos yet</h3>
                      <p className="text-gray-500 text-sm max-w-md mx-auto">
                        Reviewed demos will appear here once you start reviewing trainee submissions.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {reviewedDemos.map((demo, index) => (
                        <div 
                          key={demo.id || demo._id || `reviewed-${index}`} 
                          onClick={() => openDemoDetailsModal(demo)}
                          className={`rounded-lg border p-4 hover:shadow-md transition-all duration-200 cursor-pointer ${
                            demo.trainerStatus === 'approved' ? 'bg-green-50 border-green-200' :
                            demo.trainerStatus === 'rejected' ? 'bg-red-50 border-red-200' :
                            'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className={`p-2 rounded-lg ${
                                demo.trainerStatus === 'approved' ? 'bg-green-100' :
                                demo.trainerStatus === 'rejected' ? 'bg-red-100' :
                                'bg-blue-100'
                              }`}>
                                <LuVideo className={`w-4 h-4 ${
                                  demo.trainerStatus === 'approved' ? 'text-green-600' :
                                  demo.trainerStatus === 'rejected' ? 'text-red-600' :
                                  'text-blue-600'
                                }`} />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 text-sm">
                                  {demo.type === 'offline_demo' ? 'Offline Demo' : demo.title}
                                </h3>
                                <p className="text-xs text-gray-500">
                                  {demo.type === 'offline_demo' ? 'Offline Demo' : demo.courseTag}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                // Offline demo status
                                demo.type === 'offline_demo' ? 
                                  (demo.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                                   demo.status === 'approved' ? 'bg-green-100 text-green-800' :
                                   demo.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                   'bg-gray-100 text-gray-800') :
                                // Regular demo status
                                demo.trainerStatus === 'approved' ? 
                                  (demo.masterTrainerStatus === 'approved' ? 'bg-green-100 text-green-800' :
                                   demo.masterTrainerStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                                   'bg-yellow-100 text-yellow-800') :
                                demo.trainerStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {demo.type === 'offline_demo' ? 
                                  (demo.status === 'pending_approval' ? 'Pending Approval' :
                                   demo.status === 'approved' ? 'Approved' :
                                   demo.status === 'rejected' ? 'Rejected' :
                                   'Unknown') :
                                 demo.trainerStatus === 'approved' ? 
                                  (demo.masterTrainerStatus === 'approved' ? 'Approved' :
                                   demo.masterTrainerStatus === 'rejected' ? 'Rejected' :
                                   'Under Review') :
                                 demo.trainerStatus === 'rejected' ? 'Rejected' :
                                 'Unknown'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <p className="text-sm text-gray-600 mb-2">
                              <strong>Trainee:</strong> {demo.traineeName}
                            </p>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {demo.type === 'offline_demo' ? demo.feedback : demo.description}
                            </p>
                          </div>
                          
                          {/* Status-specific information */}
                          {demo.trainerStatus === 'approved' && (
                            <div className="mb-3 p-2 bg-green-100 rounded text-xs">
                              <p className="text-green-800 font-medium">
                                ✓ Approved by you - {
                                  demo.masterTrainerStatus === 'approved' ? 'Approved by Master Trainer' :
                                  demo.masterTrainerStatus === 'rejected' ? 'Rejected by Master Trainer' :
                                  'Under Review by Master Trainer'
                                }
                              </p>
                              {demo.feedback && (
                                <p className="text-green-700 mt-1">Feedback: {demo.feedback}</p>
                              )}
                              {demo.rating > 0 && (
                                <div className="flex items-center space-x-1 mt-1">
                                  <span className="text-green-700 text-xs">Rating:</span>
                                  <div className="flex space-x-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <LuStar
                                        key={star}
                                        className={`w-3 h-3 ${
                                          star <= demo.rating ? 'text-yellow-400' : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                              <p className="text-green-600 text-xs mt-1">
                                Master Trainer Status: {demo.masterTrainerStatus === 'pending' ? 'Pending' : 
                                 demo.masterTrainerStatus === 'approved' ? 'Approved' : 
                                 demo.masterTrainerStatus === 'rejected' ? 'Rejected' : 'N/A'}
                              </p>
                            </div>
                          )}
                          
                          {demo.status === 'trainer_rejected' && (
                            <div className="mb-3 p-2 bg-red-100 rounded text-xs">
                              <p className="text-red-800 font-medium">✗ Rejected by you</p>
                              {demo.rejectionReason && (
                                <p className="text-red-700 mt-1">Reason: {demo.rejectionReason}</p>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {demo.type === 'offline_demo' ? 
                                `Created: ${new Date(demo.createdAt).toLocaleDateString()}` :
                                `Reviewed: ${new Date(demo.reviewedAt).toLocaleDateString()}`
                              }
                            </span>
                            <div className="flex items-center space-x-2">
                              {demo.type !== 'offline_demo' && (
                                <button
                                  onClick={() => openVideoModal(demo)}
                                  className="p-1 text-gray-400 hover:text-green-600 transition-colors cursor-pointer"
                                  title="View Video"
                                >
                                  <LuPlay className="w-4 h-4" />
                                </button>
                              )}
                              {demo.type !== 'offline_demo' && (
                                <button
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = demo.fileUrl;
                                    link.download = demo.fileName || 'demo-video.mp4';
                                    link.click();
                                  }}
                                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                  title="Download"
                                >
                                  <LuDownload className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Offline Demos Tab */}
            {activeTab === 'offline' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <LuFileText className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Offline Demos</h2>
                        <p className="text-sm text-gray-500">Demos submitted offline by trainees</p>
                      </div>
                    </div>
                    <button
                      onClick={openCreateOfflineModal}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2 cursor-pointer"
                    >
                      <LuFileText className="w-4 h-4" />
                      <span>Create Offline Demo</span>
                    </button>
                  </div>

                  {offlineDemos.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                        <LuFileText className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No offline demos yet</h3>
                      <p className="text-gray-500">Offline demos submitted by your trainees will appear here</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {offlineDemos.map((demo, index) => (
                        <div key={demo.id || demo._id || `offline-${index}`} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                                {demo.title || 'Untitled Demo'}
                              </h3>
                              <p className="text-xs text-gray-500 mb-2">
                                by {demo.traineeName || 'Unknown Trainee'}
                              </p>
                              <p className="text-xs text-gray-500">
                                Course: {demo.courseTag || 'N/A'}
                              </p>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                Offline
                              </span>
                            </div>
                          </div>

                          {demo.description && (
                            <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                              {demo.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>
                              Submitted: {moment(demo.uploadedAt || demo.createdAt).format('MMM DD, YYYY')}
                            </span>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => openEvaluationModal(demo)}
                                className="p-1 text-gray-400 hover:text-purple-600 transition-colors cursor-pointer"
                                title="Evaluate Demo"
                              >
                                <LuCheck className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  // Handle offline demo review
                                  }}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                                title="Review Demo"
                              >
                                <LuEye className="w-4 h-4" />
                              </button>
                              {demo.fileUrl && (
                                <button
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = demo.fileUrl;
                                    link.download = demo.fileName || 'offline-demo.pdf';
                                    link.click();
                                  }}
                                  className="p-1 text-gray-400 hover:text-green-600 transition-colors cursor-pointer"
                                  title="Download"
                                >
                                  <LuDownload className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Review Modal */}
        {showReviewModal && selectedDemo && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Review Demo</h3>
                  <button
                    onClick={closeReviewModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <LuX className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Demo Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Title:</span>
                        <span className="ml-2 text-gray-900">{selectedDemo.title}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Trainee:</span>
                        <span className="ml-2 text-gray-900">{selectedDemo.traineeName}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Course:</span>
                        <span className="ml-2 text-gray-900">{selectedDemo.courseTag}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Uploaded:</span>
                        <span className="ml-2 text-gray-900">{moment(selectedDemo.uploadedAt).format('MMM DD, YYYY HH:mm')}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="font-medium text-gray-600">Description:</span>
                      <p className="mt-1 text-gray-900">{selectedDemo.description}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Review Action</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="action"
                          value="approve"
                          checked={reviewData.action === 'approve'}
                          onChange={(e) => setReviewData(prev => ({ ...prev, action: e.target.value }))}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 flex items-center">
                          <LuCheck className="w-4 h-4 mr-1 text-green-600" />
                          Approve
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="action"
                          value="reject"
                          checked={reviewData.action === 'reject'}
                          onChange={(e) => setReviewData(prev => ({ ...prev, action: e.target.value }))}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 flex items-center">
                          <LuX className="w-4 h-4 mr-1 text-red-600" />
                          Reject
                        </span>
                      </label>
                    </div>
                  </div>

                  {reviewData.action === 'approve' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rating (Required)</label>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setReviewData(prev => ({ ...prev, rating: star }))}
                            className="p-1 cursor-pointer"
                          >
                            <LuStar
                              className={`w-6 h-6 ${
                                star <= reviewData.rating ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {reviewData.rating > 0 ? `${reviewData.rating} star${reviewData.rating > 1 ? 's' : ''}` : 'Select a rating'}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {reviewData.action === 'approve' ? 'Feedback (Optional)' : 'Rejection Reason (Required)'}
                    </label>
                    <textarea
                      value={reviewData.feedback}
                      onChange={(e) => setReviewData(prev => ({ ...prev, feedback: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="4"
                      placeholder={reviewData.action === 'approve' ? 'Provide feedback to help the trainee improve...' : 'Explain why this demo is being rejected...'}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
                  <button
                    onClick={closeReviewModal}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReviewSubmit}
                    disabled={isSubmittingReview}
                    className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center space-x-2 ${
                      isSubmittingReview ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
                    } ${
                      reviewData.action === 'approve' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {isSubmittingReview ? (
                      <>
                        <LuLoader className="w-4 h-4 animate-spin" />
                        <span>{reviewData.action === 'approve' ? 'Approving...' : 'Rejecting...'}</span>
                      </>
                    ) : reviewData.action === 'approve' ? (
                      <>
                        <LuCheck className="w-4 h-4" />
                        <span>Approve Demo</span>
                      </>
                    ) : (
                      <>
                        <LuX className="w-4 h-4" />
                        <span>Reject Demo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Video Modal */}
        {showVideoModal && selectedVideo && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">{selectedVideo.title}</h3>
                  <button
                    onClick={closeVideoModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <LuX className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Video Player */}
                  <div className="bg-gray-100 rounded-lg p-4">
                    {selectedVideo.fileUrl ? (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Video URL: {selectedVideo.fileUrl}</p>
                        <video
                          controls
                          className="w-full h-auto rounded-lg"
                          src={selectedVideo.fileUrl}
                          onError={(e) => {
                            
                          }}
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-64 bg-gray-200 rounded-lg">
                        <div className="text-center">
                          <LuVideo className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">Video file not available</p>
                          <p className="text-sm text-gray-400">File: {selectedVideo.fileName}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Video Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Demo Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Course:</span>
                        <span className="ml-2 text-gray-900">{selectedVideo.courseTag}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Trainee:</span>
                        <span className="ml-2 text-gray-900">{selectedVideo.traineeName}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Uploaded:</span>
                        <span className="ml-2 text-gray-900">{moment(selectedVideo.uploadedAt).format('MMM DD, YYYY HH:mm')}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">File:</span>
                        <span className="ml-2 text-gray-900">{selectedVideo.fileName}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="font-medium text-gray-600">Description:</span>
                      <p className="mt-1 text-gray-900">{selectedVideo.description}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
                  <button
                    onClick={closeVideoModal}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  {selectedVideo.fileUrl && (
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = selectedVideo.fileUrl;
                        link.download = selectedVideo.fileName || 'demo-video.mp4';
                        link.click();
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 cursor-pointer"
                    >
                      <LuDownload className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Offline Demo Modal */}
        {showCreateOfflineModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Create Offline Demo</h3>
                  <button
                    onClick={closeCreateOfflineModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <LuX className="w-7 h-7" />
                  </button>
                </div>

            <div className="space-y-6">
              {/* Trainee Selection */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-4">Select Trainee</h4>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-3">Assigned Trainee *</label>
                  <select
                    value={createOfflineData.traineeId}
                    onChange={(e) => setCreateOfflineData(prev => ({ ...prev, traineeId: e.target.value }))}
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a trainee</option>
                    {assignedTrainees.map((trainee) => (
                      <option key={trainee._id || trainee.id} value={trainee.author_id || trainee._id}>
                        {trainee.name || trainee.candidate_name} ({trainee.email || trainee.candidate_personal_mail_id})
                      </option>
                    ))}
                  </select>
                  {assignedTrainees.length === 0 && (
                    <p className="text-sm text-gray-500 mt-2">No trainees found. Please check if trainees are assigned to you or contact admin.</p>
                  )}
                </div>
              </div>

              {/* Evaluation Form Sections */}
              <div className="space-y-2">
                {/* Candidate Details Section */}
                <div className="bg-white border border-gray-300 rounded-lg">
                  <button
                    onClick={() => toggleSection('candidateDetails')}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-200"
                  >
                    <h4 className="text-lg font-semibold text-gray-900">Candidate Details</h4>
                    <span className={`transform transition-transform ${expandedSections.candidateDetails ? 'rotate-180' : ''}`}>
                      <LuChevronDown className="w-5 h-5" />
                    </span>
                  </button>
                  {expandedSections.candidateDetails && (
                    <div className="p-6">
                      <div className="grid grid-cols-6 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Id</label>
                          <input
                            type="text"
                            value={evaluationData.candidateId}
                            onChange={(e) => setEvaluationData(prev => ({ ...prev, candidateId: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            placeholder="fetch the trainee data from users table"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Demo</label>
                          <input
                            type="text"
                            value={evaluationData.demoTitle}
                            onChange={(e) => setEvaluationData(prev => ({ ...prev, demoTitle: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            placeholder="add manually"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Taken BY</label>
                          <input
                            type="text"
                            value={evaluationData.takenBy}
                            onChange={(e) => setEvaluationData(prev => ({ ...prev, takenBy: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            placeholder="add manually"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                          <input
                            type="date"
                            value={evaluationData.date ? moment(evaluationData.date).format('YYYY-MM-DD') : ''}
                            onChange={(e) => setEvaluationData(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Track</label>
                          <input
                            type="text"
                            value={evaluationData.track}
                            onChange={(e) => setEvaluationData(prev => ({ ...prev, track: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            placeholder="add manually"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
                          <input
                            type="text"
                            value={evaluationData.topic}
                            onChange={(e) => setEvaluationData(prev => ({ ...prev, topic: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            placeholder="add manually"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Preparedness Section */}
                <div className="bg-white border border-gray-300 rounded-lg">
                  <button
                    onClick={() => toggleSection('preparedness')}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-200"
                  >
                    <h4 className="text-lg font-semibold text-gray-900">Preparedness</h4>
                    <span className={`transform transition-transform ${expandedSections.preparedness ? 'rotate-180' : ''}`}>
                      <LuChevronDown className="w-5 h-5" />
                    </span>
                  </button>
                  {expandedSections.preparedness && (
                    <div className="p-6">
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Slide Usage</label>
                          <select
                            value={evaluationData.slideUsage}
                            onChange={(e) => setEvaluationData(prev => ({ ...prev, slideUsage: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select</option>
                            <option value="excellent">Excellent - Fully Followed</option>
                            <option value="good">Good - Partially Used</option>
                            <option value="poor">Poor - Not Used</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Reference Video Watched</label>
                          <select
                            value={evaluationData.referenceVideoWatched}
                            onChange={(e) => setEvaluationData(prev => ({ ...prev, referenceVideoWatched: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                            <option value="partially">Partially Watched</option>
                            <option value="not-available">Video not available</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Content Familiarity</label>
                          <select
                            value={evaluationData.contentFamiliarity}
                            onChange={(e) => setEvaluationData(prev => ({ ...prev, contentFamiliarity: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select</option>
                            <option value="excellent">Excellent - Confident with the concepts</option>
                            <option value="fair">Fair - Partial, not clear with some concepts</option>
                            <option value="poor">Poor - Not confident, ambiguous</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Time Management</label>
                          <select
                            value={evaluationData.timeManagement}
                            onChange={(e) => setEvaluationData(prev => ({ ...prev, timeManagement: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select</option>
                            <option value="excellent">Excellent - On Time</option>
                            <option value="needs-improvement">Needs Improvement - Exceeded</option>
                            <option value="fair">Fair - Completed Quick</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Delivery Section */}
                <div className="bg-white border border-gray-300 rounded-lg">
                  <button
                    onClick={() => toggleSection('delivery')}
                    className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-200"
                  >
                    <h4 className="text-base font-semibold text-gray-900">Delivery</h4>
                    <span className={`transform transition-transform ${expandedSections.delivery ? 'rotate-180' : ''}`}>
                      <LuChevronDown className="w-4 h-4" />
                    </span>
                  </button>
                  {expandedSections.delivery && (
                    <div className="p-4">
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Voice Modulation</label>
                          <select
                            value={evaluationData.voiceModulation}
                            onChange={(e) => setEvaluationData(prev => ({ ...prev, voiceModulation: e.target.value }))}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select</option>
                            <option value="excellent">Excellent - Loud and clear</option>
                            <option value="fair">Fair - Monotone, needs improvement</option>
                            <option value="good">Good - Loud but no modulation</option>
                            <option value="poor">Poor - Very low</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Body Language</label>
                          <select
                            value={evaluationData.bodyLanguage}
                            onChange={(e) => setEvaluationData(prev => ({ ...prev, bodyLanguage: e.target.value }))}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select</option>
                            <option value="excellent">Excellent – Confident, open posture, great eye contact</option>
                            <option value="very-good">Very Good – Mostly confident</option>
                            <option value="fair">Fair – Minimal gestures</option>
                            <option value="poor">Poor – Closed posture</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Language Clarity</label>
                          <select
                            value={evaluationData.languageClarity}
                            onChange={(e) => setEvaluationData(prev => ({ ...prev, languageClarity: e.target.value }))}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select</option>
                            <option value="excellent">Excellent – Clear, fluent, engaging</option>
                            <option value="very-good">Very Good – Mostly clear</option>
                            <option value="fair">Fair – Frequent mistakes</option>
                            <option value="poor">Poor – Unclear/confusing</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Pace of Delivery</label>
                          <select
                            value={evaluationData.paceOfDelivery}
                            onChange={(e) => setEvaluationData(prev => ({ ...prev, paceOfDelivery: e.target.value }))}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select</option>
                            <option value="excellent">Excellent – Well-paced</option>
                            <option value="very-good">Very Good – Slightly fast/slow</option>
                            <option value="fair">Fair – Too fast/slow</option>
                            <option value="poor">Poor – Very rushed or dragging</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Board Usage/Wacom</label>
                          <select
                            value={evaluationData.boardUsage}
                            onChange={(e) => setEvaluationData(prev => ({ ...prev, boardUsage: e.target.value }))}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select</option>
                            <option value="good">Good – Used wherever required</option>
                            <option value="fair">Fair – Used most of the time</option>
                            <option value="poor">Poor – Not used at all</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Hands-On Coding</label>
                          <select
                            value={evaluationData.handsOnCoding}
                            onChange={(e) => setEvaluationData(prev => ({ ...prev, handsOnCoding: e.target.value }))}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select</option>
                            <option value="excellent">Excellent – Explained step by step</option>
                            <option value="good">Good – Wrote code then explained</option>
                            <option value="fair">Fair – Tried but not confident</option>
                            <option value="poor">Poor – No hands-on coding</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Class Engagement</label>
                          <select
                            value={evaluationData.classEngagement}
                            onChange={(e) => setEvaluationData(prev => ({ ...prev, classEngagement: e.target.value }))}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select</option>
                            <option value="excellent">Excellent – Actively involves students</option>
                            <option value="good">Good – Some effort to engage</option>
                            <option value="fair">Fair – Minimal interaction</option>
                            <option value="poor">Poor – No engagement</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Usage of Example</label>
                          <select
                            value={evaluationData.usageOfExample}
                            onChange={(e) => setEvaluationData(prev => ({ ...prev, usageOfExample: e.target.value }))}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select</option>
                            <option value="excellent">Excellent – Real-world examples</option>
                            <option value="good">Good – Examples but not always relevant</option>
                            <option value="fair">Fair – Few examples, unclear</option>
                            <option value="poor">Poor – No examples</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content Knowledge Section */}
                <div className="bg-white border border-gray-300 rounded-lg">
                  <button
                    onClick={() => toggleSection('contentKnowledge')}
                    className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-200"
                  >
                    <h4 className="text-base font-semibold text-gray-900">Content Knowledge</h4>
                    <span className={`transform transition-transform ${expandedSections.contentKnowledge ? 'rotate-180' : ''}`}>
                      <LuChevronDown className="w-4 h-4" />
                    </span>
                  </button>
                  {expandedSections.contentKnowledge && (
                    <div className="p-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Key Concepts Covered</label>
                          <select
                            value={evaluationData.keyConceptsCovered}
                            onChange={(e) => setEvaluationData(prev => ({ ...prev, keyConceptsCovered: e.target.value }))}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select</option>
                            <option value="excellent">Excellent – All concepts covered</option>
                            <option value="fair">Fair – Some concepts missed</option>
                            <option value="poor">Poor – Skipped many concepts</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Accuracy of Information</label>
                          <select
                            value={evaluationData.accuracyOfInformation}
                            onChange={(e) => setEvaluationData(prev => ({ ...prev, accuracyOfInformation: e.target.value }))}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select</option>
                            <option value="excellent">Excellent – Perfectly aligned</option>
                            <option value="good">Good – Covered all + few extra</option>
                            <option value="fair">Fair – Not aligned but okay</option>
                            <option value="poor">Poor – Wrong explanation</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Flow of Content / Slide Transition</label>
                          <select
                            value={evaluationData.flowOfContent}
                            onChange={(e) => setEvaluationData(prev => ({ ...prev, flowOfContent: e.target.value }))}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select</option>
                            <option value="excellent">Excellent – Seamless transitions</option>
                            <option value="good">Good – Mostly smooth</option>
                            <option value="fair">Fair – Jumps, unclear</option>
                            <option value="needs-improvement">Needs Improvement – Very confusing</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Overall Clarity Section */}
                <div className="bg-white border border-gray-300 rounded-lg">
                  <button
                    onClick={() => toggleSection('overallClarity')}
                    className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-200"
                  >
                    <h4 className="text-base font-semibold text-gray-900">Overall Clarity</h4>
                    <span className={`transform transition-transform ${expandedSections.overallClarity ? 'rotate-180' : ''}`}>
                      <LuChevronDown className="w-4 h-4" />
                    </span>
                  </button>
                  {expandedSections.overallClarity && (
                    <div className="p-4">
                      <div className="flex items-center space-x-4">
                        <label className="block text-sm font-medium text-gray-700">Overall Rating:</label>
                        <select
                          value={evaluationData.overallRating}
                          onChange={(e) => setEvaluationData(prev => ({ ...prev, overallRating: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Rating</option>
                          <option value="1">1</option>
                          <option value="1.5">1.5</option>
                          <option value="2">2</option>
                          <option value="2.5">2.5</option>
                          <option value="3">3</option>
                          <option value="3.5">3.5</option>
                          <option value="4">4</option>
                          <option value="4.5">4.5</option>
                          <option value="5">5</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Reattempt Needed Section */}
                <div className="bg-white border border-gray-300 rounded-lg">
                  <button
                    onClick={() => toggleSection('reattemptNeeded')}
                    className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-200"
                  >
                    <h4 className="text-base font-semibold text-gray-900">Reattempt Needed</h4>
                    <span className={`transform transition-transform ${expandedSections.reattemptNeeded ? 'rotate-180' : ''}`}>
                      <LuChevronDown className="w-4 h-4" />
                    </span>
                  </button>
                  {expandedSections.reattemptNeeded && (
                    <div className="p-4">
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="reattemptNeeded"
                            checked={evaluationData.reattemptNeeded === true}
                            onChange={(e) => setEvaluationData(prev => ({ ...prev, reattemptNeeded: true }))}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                          />
                          <span className="ml-2 text-xs text-gray-700">Yes</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="reattemptNeeded"
                            checked={evaluationData.reattemptNeeded === false}
                            onChange={(e) => setEvaluationData(prev => ({ ...prev, reattemptNeeded: false }))}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                          />
                          <span className="ml-2 text-xs text-gray-700">No</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

                  {/* Feedback Section */}
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-4">Feedback</h4>
                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-3">Feedback *</label>
                      <textarea
                        value={createOfflineData.feedback}
                        onChange={(e) => setCreateOfflineData(prev => ({ ...prev, feedback: e.target.value }))}
                        className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={6}
                        placeholder="Provide your feedback about the demo..."
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t mt-6">
                  <button
                    onClick={closeCreateOfflineModal}
                    className="px-6 py-3 text-base text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateOfflineDemo}
                    className="px-8 py-3 text-base bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2 cursor-pointer"
                  >
                    <LuFileText className="w-5 h-5" />
                    <span>Submit for Approval</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmationModal && confirmationData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Confirm Demo Submission</h3>
                  <button
                    onClick={closeConfirmationModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    disabled={isSubmitting}
                  >
                    <LuX className="w-7 h-7" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Trainee Information */}
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-4">Trainee Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <p className="text-base text-gray-900">{confirmationData.trainee?.name || confirmationData.trainee?.candidate_name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <p className="text-base text-gray-900">{confirmationData.trainee?.email || confirmationData.trainee?.candidate_personal_mail_id || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Feedback */}
                  <div className="bg-green-50 rounded-lg p-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-4">Feedback</h4>
                    <p className="text-base text-gray-900 whitespace-pre-wrap">{confirmationData.feedback}</p>
                  </div>

                  {/* Evaluation Summary */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-4">Evaluation Summary</h4>
                    <div className="grid grid-cols-2 gap-6">
                      {/* Candidate Details */}
                      <div>
                        <h5 className="text-lg font-medium text-gray-800 mb-3">Candidate Details</h5>
                        <div className="space-y-2 text-sm">
                          <div><span className="font-medium">Demo:</span> {confirmationData.evaluationData.demoTitle || 'Not specified'}</div>
                          <div><span className="font-medium">Taken By:</span> {confirmationData.evaluationData.takenBy || 'Not specified'}</div>
                          <div><span className="font-medium">Date:</span> {confirmationData.evaluationData.date || 'Not specified'}</div>
                          <div><span className="font-medium">Track:</span> {confirmationData.evaluationData.track || 'Not specified'}</div>
                          <div><span className="font-medium">Topic:</span> {confirmationData.evaluationData.topic || 'Not specified'}</div>
                        </div>
                      </div>

                      {/* Preparedness */}
                      <div>
                        <h5 className="text-lg font-medium text-gray-800 mb-3">Preparedness</h5>
                        <div className="space-y-2 text-sm">
                          <div><span className="font-medium">Slide Usage:</span> {getEvaluationLabel('slideUsage', confirmationData.evaluationData.slideUsage)}</div>
                          <div><span className="font-medium">Reference Video:</span> {getEvaluationLabel('referenceVideoWatched', confirmationData.evaluationData.referenceVideoWatched)}</div>
                          <div><span className="font-medium">Content Familiarity:</span> {getEvaluationLabel('contentFamiliarity', confirmationData.evaluationData.contentFamiliarity)}</div>
                          <div><span className="font-medium">Time Management:</span> {getEvaluationLabel('timeManagement', confirmationData.evaluationData.timeManagement)}</div>
                        </div>
                      </div>

                      {/* Delivery */}
                      <div>
                        <h5 className="text-lg font-medium text-gray-800 mb-3">Delivery</h5>
                        <div className="space-y-2 text-sm">
                          <div><span className="font-medium">Voice Modulation:</span> {getEvaluationLabel('voiceModulation', confirmationData.evaluationData.voiceModulation)}</div>
                          <div><span className="font-medium">Body Language:</span> {getEvaluationLabel('bodyLanguage', confirmationData.evaluationData.bodyLanguage)}</div>
                          <div><span className="font-medium">Language Clarity:</span> {getEvaluationLabel('languageClarity', confirmationData.evaluationData.languageClarity)}</div>
                          <div><span className="font-medium">Pace of Delivery:</span> {getEvaluationLabel('paceOfDelivery', confirmationData.evaluationData.paceOfDelivery)}</div>
                          <div><span className="font-medium">Board Usage:</span> {getEvaluationLabel('boardUsage', confirmationData.evaluationData.boardUsage)}</div>
                          <div><span className="font-medium">Hands-On Coding:</span> {getEvaluationLabel('handsOnCoding', confirmationData.evaluationData.handsOnCoding)}</div>
                          <div><span className="font-medium">Class Engagement:</span> {getEvaluationLabel('classEngagement', confirmationData.evaluationData.classEngagement)}</div>
                          <div><span className="font-medium">Usage of Example:</span> {getEvaluationLabel('usageOfExample', confirmationData.evaluationData.usageOfExample)}</div>
                        </div>
                      </div>

                      {/* Content Knowledge */}
                      <div>
                        <h5 className="text-lg font-medium text-gray-800 mb-3">Content Knowledge</h5>
                        <div className="space-y-2 text-sm">
                          <div><span className="font-medium">Key Concepts Covered:</span> {getEvaluationLabel('keyConceptsCovered', confirmationData.evaluationData.keyConceptsCovered)}</div>
                          <div><span className="font-medium">Accuracy of Information:</span> {getEvaluationLabel('accuracyOfInformation', confirmationData.evaluationData.accuracyOfInformation)}</div>
                          <div><span className="font-medium">Flow of Content:</span> {getEvaluationLabel('flowOfContent', confirmationData.evaluationData.flowOfContent)}</div>
                        </div>
                      </div>

                      {/* Overall Clarity */}
                      <div>
                        <h5 className="text-lg font-medium text-gray-800 mb-3">Overall Clarity</h5>
                        <div className="space-y-2 text-sm">
                          <div><span className="font-medium">Overall Rating:</span> {confirmationData.evaluationData.overallRating || 'Not specified'}</div>
                        </div>
                      </div>

                      {/* Reattempt Needed */}
                      <div>
                        <h5 className="text-lg font-medium text-gray-800 mb-3">Reattempt Needed</h5>
                        <div className="space-y-2 text-sm">
                          <div><span className="font-medium">Reattempt Required:</span> {confirmationData.evaluationData.reattemptNeeded === null ? 'Not specified' : confirmationData.evaluationData.reattemptNeeded ? 'Yes' : 'No'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t mt-6">
                  <button
                    onClick={closeConfirmationModal}
                    className="px-6 py-3 text-base text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmSubmission}
                    className="px-8 py-3 text-base bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <LuFileText className="w-5 h-5" />
                        <span>Submit for Approval</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Evaluation Modal */}
        {showEvaluationModal && selectedOfflineDemo && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Demo Evaluation Form</h3>
                  <button
                    onClick={closeEvaluationModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <LuX className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-2">
                  {/* Candidate Details Section */}
                  <div className="bg-white border border-gray-300 rounded-lg">
                    <button
                      onClick={() => toggleSection('candidateDetails')}
                      className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-200"
                    >
                      <h4 className="text-base font-semibold text-gray-900">Candidate Details</h4>
                      <span className={`transform transition-transform ${expandedSections.candidateDetails ? 'rotate-180' : ''}`}>
                        <LuChevronDown className="w-4 h-4" />
                      </span>
                    </button>
                    {expandedSections.candidateDetails && (
                      <div className="p-4">
                        <div className="grid grid-cols-6 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Id</label>
                            <input
                              type="text"
                              value={evaluationData.candidateId}
                              onChange={(e) => setEvaluationData(prev => ({ ...prev, candidateId: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                              placeholder="fetch the trainee data from users table"
                              readOnly
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Demo</label>
                            <input
                              type="text"
                              value={evaluationData.demoTitle}
                              onChange={(e) => setEvaluationData(prev => ({ ...prev, demoTitle: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                              placeholder="add manually"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Taken BY</label>
                            <input
                              type="text"
                              value={evaluationData.takenBy}
                              onChange={(e) => setEvaluationData(prev => ({ ...prev, takenBy: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                              placeholder="add manually"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                            <input
                              type="date"
                              value={evaluationData.date ? moment(evaluationData.date).format('YYYY-MM-DD') : ''}
                              onChange={(e) => setEvaluationData(prev => ({ ...prev, date: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Track</label>
                            <input
                              type="text"
                              value={evaluationData.track}
                              onChange={(e) => setEvaluationData(prev => ({ ...prev, track: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                              placeholder="add manually"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Topic</label>
                            <input
                              type="text"
                              value={evaluationData.topic}
                              onChange={(e) => setEvaluationData(prev => ({ ...prev, topic: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                              placeholder="add manually"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Preparedness Section */}
                  <div className="bg-white border border-gray-300 rounded-lg">
                    <button
                      onClick={() => toggleSection('preparedness')}
                      className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-200"
                    >
                      <h4 className="text-base font-semibold text-gray-900">Preparedness</h4>
                      <span className={`transform transition-transform ${expandedSections.preparedness ? 'rotate-180' : ''}`}>
                        <LuChevronDown className="w-4 h-4" />
                      </span>
                    </button>
                    {expandedSections.preparedness && (
                      <div className="p-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Slide Usage</label>
                            <select
                              value={evaluationData.slideUsage}
                              onChange={(e) => setEvaluationData(prev => ({ ...prev, slideUsage: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select</option>
                              <option value="excellent">Excellent - Fully Followed</option>
                              <option value="good">Good - Partially Used</option>
                              <option value="poor">Poor - Not Used</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Reference Video Watched</label>
                            <select
                              value={evaluationData.referenceVideoWatched}
                              onChange={(e) => setEvaluationData(prev => ({ ...prev, referenceVideoWatched: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select</option>
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                              <option value="partially">Partially Watched</option>
                              <option value="not-available">Video not available</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Content Familiarity</label>
                            <select
                              value={evaluationData.contentFamiliarity}
                              onChange={(e) => setEvaluationData(prev => ({ ...prev, contentFamiliarity: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select</option>
                              <option value="excellent">Excellent - Confident with the concepts</option>
                              <option value="fair">Fair - Partial, not clear with some concepts</option>
                              <option value="poor">Poor - Not confident, ambiguous</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Delivery Section */}
                  <div className="bg-white border border-gray-300 rounded-lg">
                    <button
                      onClick={() => toggleSection('delivery')}
                      className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-200"
                    >
                      <h4 className="text-base font-semibold text-gray-900">Delivery</h4>
                      <span className={`transform transition-transform ${expandedSections.delivery ? 'rotate-180' : ''}`}>
                        <LuChevronDown className="w-4 h-4" />
                      </span>
                    </button>
                    {expandedSections.delivery && (
                      <div className="p-4">
                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Time Management</label>
                            <select
                              value={evaluationData.timeManagement}
                              onChange={(e) => setEvaluationData(prev => ({ ...prev, timeManagement: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select</option>
                              <option value="excellent">Excellent - On Time</option>
                              <option value="needs-improvement">Needs Improvement - Exceeded</option>
                              <option value="fair">Fair - Completed Quick</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Voice Modulation</label>
                            <select
                              value={evaluationData.voiceModulation}
                              onChange={(e) => setEvaluationData(prev => ({ ...prev, voiceModulation: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select</option>
                              <option value="excellent">Excellent - Loud and clear</option>
                              <option value="fair">Fair - Monotone, needs improvement</option>
                              <option value="good">Good - Loud but no modulation</option>
                              <option value="poor">Poor - Very low</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Body Language</label>
                            <select
                              value={evaluationData.bodyLanguage}
                              onChange={(e) => setEvaluationData(prev => ({ ...prev, bodyLanguage: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select</option>
                              <option value="excellent">Excellent – Confident, open posture, great eye contact</option>
                              <option value="very-good">Very Good – Mostly confident</option>
                              <option value="fair">Fair – Minimal gestures</option>
                              <option value="poor">Poor – Closed posture</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Board Usage/Wacom</label>
                            <select
                              value={evaluationData.boardUsage}
                              onChange={(e) => setEvaluationData(prev => ({ ...prev, boardUsage: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select</option>
                              <option value="good">Good – Used wherever required</option>
                              <option value="fair">Fair – Used most of the time</option>
                              <option value="poor">Poor – Not used at all</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Hands-On Coding</label>
                            <select
                              value={evaluationData.handsOnCoding}
                              onChange={(e) => setEvaluationData(prev => ({ ...prev, handsOnCoding: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select</option>
                              <option value="excellent">Excellent – Explained step by step</option>
                              <option value="good">Good – Wrote code then explained</option>
                              <option value="fair">Fair – Tried but not confident</option>
                              <option value="poor">Poor – No hands-on coding</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content Knowledge Section */}
                  <div className="bg-white border border-gray-300 rounded-lg">
                    <button
                      onClick={() => toggleSection('contentKnowledge')}
                      className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-200"
                    >
                      <h4 className="text-base font-semibold text-gray-900">Content Knowledge</h4>
                      <span className={`transform transition-transform ${expandedSections.contentKnowledge ? 'rotate-180' : ''}`}>
                        <LuChevronDown className="w-4 h-4" />
                      </span>
                    </button>
                    {expandedSections.contentKnowledge && (
                      <div className="p-4">
                        <div className="grid grid-cols-5 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Language Clarity</label>
                            <select
                              value={evaluationData.languageClarity}
                              onChange={(e) => setEvaluationData(prev => ({ ...prev, languageClarity: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select</option>
                              <option value="excellent">Excellent – Clear, fluent, engaging</option>
                              <option value="very-good">Very Good – Mostly clear</option>
                              <option value="fair">Fair – Frequent mistakes</option>
                              <option value="poor">Poor – Unclear/confusing</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Pace of Delivery</label>
                            <select
                              value={evaluationData.paceOfDelivery}
                              onChange={(e) => setEvaluationData(prev => ({ ...prev, paceOfDelivery: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select</option>
                              <option value="excellent">Excellent – Well-paced</option>
                              <option value="very-good">Very Good – Slightly fast/slow</option>
                              <option value="fair">Fair – Too fast/slow</option>
                              <option value="poor">Poor – Very rushed or dragging</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Board Usage/Wacom</label>
                            <select
                              value={evaluationData.boardUsage}
                              onChange={(e) => setEvaluationData(prev => ({ ...prev, boardUsage: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select</option>
                              <option value="good">Good – Used wherever required</option>
                              <option value="fair">Fair – Used most of the time</option>
                              <option value="poor">Poor – Not used at all</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Hands-On Coding</label>
                            <select
                              value={evaluationData.handsOnCoding}
                              onChange={(e) => setEvaluationData(prev => ({ ...prev, handsOnCoding: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select</option>
                              <option value="excellent">Excellent – Explained step by step</option>
                              <option value="good">Good – Wrote code then explained</option>
                              <option value="fair">Fair – Tried but not confident</option>
                              <option value="poor">Poor – No hands-on coding</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Overall Clarity Section */}
                  <div className="bg-white border border-gray-300 rounded-lg">
                    <button
                      onClick={() => toggleSection('overallClarity')}
                      className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-200"
                    >
                      <h4 className="text-base font-semibold text-gray-900">Overall Clarity</h4>
                      <span className={`transform transition-transform ${expandedSections.overallClarity ? 'rotate-180' : ''}`}>
                        <LuChevronDown className="w-4 h-4" />
                      </span>
                    </button>
                    {expandedSections.overallClarity && (
                      <div className="p-4">
                        <div className="grid grid-cols-5 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Class Engagement</label>
                            <select
                              value={evaluationData.classEngagement}
                              onChange={(e) => setEvaluationData(prev => ({ ...prev, classEngagement: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select</option>
                              <option value="excellent">Excellent – Actively involves students</option>
                              <option value="good">Good – Some effort to engage</option>
                              <option value="fair">Fair – Minimal interaction</option>
                              <option value="poor">Poor – No engagement</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Usage of Example</label>
                            <select
                              value={evaluationData.usageOfExample}
                              onChange={(e) => setEvaluationData(prev => ({ ...prev, usageOfExample: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select</option>
                              <option value="excellent">Excellent – Real-world examples</option>
                              <option value="good">Good – Examples but not always relevant</option>
                              <option value="fair">Fair – Few examples, unclear</option>
                              <option value="poor">Poor – No examples</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Key Concepts Covered</label>
                            <select
                              value={evaluationData.keyConceptsCovered}
                              onChange={(e) => setEvaluationData(prev => ({ ...prev, keyConceptsCovered: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select</option>
                              <option value="excellent">Excellent – All concepts covered</option>
                              <option value="fair">Fair – Some concepts missed</option>
                              <option value="poor">Poor – Skipped many concepts</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Accuracy of Information</label>
                            <select
                              value={evaluationData.accuracyOfInformation}
                              onChange={(e) => setEvaluationData(prev => ({ ...prev, accuracyOfInformation: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select</option>
                              <option value="excellent">Excellent – Perfectly aligned</option>
                              <option value="good">Good – Covered all + few extra</option>
                              <option value="fair">Fair – Not aligned but okay</option>
                              <option value="poor">Poor – Wrong explanation</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Flow of Content / Slide Transition</label>
                            <select
                              value={evaluationData.flowOfContent}
                              onChange={(e) => setEvaluationData(prev => ({ ...prev, flowOfContent: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select</option>
                              <option value="excellent">Excellent – Seamless transitions</option>
                              <option value="good">Good – Mostly smooth</option>
                              <option value="fair">Fair – Jumps, unclear</option>
                              <option value="needs-improvement">Needs Improvement – Very confusing</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Reattempt Needed Section */}
                  <div className="bg-white border border-gray-300 rounded-lg">
                    <button
                      onClick={() => toggleSection('reattemptNeeded')}
                      className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-200"
                    >
                      <h4 className="text-base font-semibold text-gray-900">Reattempt Needed</h4>
                      <span className={`transform transition-transform ${expandedSections.reattemptNeeded ? 'rotate-180' : ''}`}>
                        <LuChevronDown className="w-4 h-4" />
                      </span>
                    </button>
                    {expandedSections.reattemptNeeded && (
                      <div className="p-4">
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="reattemptNeeded"
                              checked={evaluationData.reattemptNeeded === true}
                              onChange={(e) => setEvaluationData(prev => ({ ...prev, reattemptNeeded: true }))}
                              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                            />
                            <span className="ml-2 text-xs text-gray-700">Yes</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="reattemptNeeded"
                              checked={evaluationData.reattemptNeeded === false}
                              onChange={(e) => setEvaluationData(prev => ({ ...prev, reattemptNeeded: false }))}
                              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                            />
                            <span className="ml-2 text-xs text-gray-700">No</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
                  <button
                    onClick={closeEvaluationModal}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEvaluationSubmit}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 cursor-pointer"
                  >
                    <LuCheck className="w-4 h-4" />
                    <span>Submit Evaluation</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Demo Details Modal */}
        {showDemoDetailsModal && selectedDemoDetails && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full mx-4 max-h-[95vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedDemoDetails.type === 'offline_demo' ? 'Offline Demo Details' : 'Demo Details'}
                  </h3>
                  <div className="flex items-center space-x-3">
                    {selectedDemoDetails.status === 'pending_approval' && (
                      <button
                        onClick={handleEditToggle}
                        className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        {isEditingDemo ? 'Cancel Edit' : 'Edit Details'}
                      </button>
                    )}
                  <button
                    onClick={closeDemoDetailsModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <LuX className="w-7 h-7" />
                  </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Demo Information Section */}
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-4">Demo Information</h4>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Demo Type</label>
                        {isEditingDemo ? (
                          <select
                            value={editedDemoData.type || ''}
                            onChange={(e) => handleDemoDataChange('type', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="offline_demo">Offline Demo</option>
                            <option value="online_demo">Online Demo</option>
                          </select>
                        ) : (
                        <p className="text-base text-gray-900">
                            {selectedDemoDetails.type === 'offline_demo' ? 'Offline Demo' : 'Online Demo'}
                        </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Demo Title</label>
                        {isEditingDemo ? (
                          <input
                            type="text"
                            value={editedDemoData.title || editedDemoData.demoTitle || ''}
                            onChange={(e) => handleDemoDataChange('title', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-base text-gray-900">
                            {selectedDemoDetails.title || selectedDemoDetails.demoTitle || 'Untitled Demo'}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Trainee Name</label>
                        {isEditingDemo ? (
                          <input
                            type="text"
                            value={editedDemoData.traineeName || editedDemoData.takenBy || ''}
                            onChange={(e) => handleDemoDataChange('traineeName', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-base text-gray-900">{selectedDemoDetails.traineeName || selectedDemoDetails.takenBy || 'Unknown'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                          selectedDemoDetails.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                             selectedDemoDetails.status === 'approved' ? 'bg-green-100 text-green-800' :
                             selectedDemoDetails.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedDemoDetails.status === 'pending_approval' ? 'Pending Approval' :
                             selectedDemoDetails.status === 'approved' ? 'Approved' :
                             selectedDemoDetails.status === 'rejected' ? 'Rejected' :
                           'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Course & Track Information */}
                  <div className="bg-green-50 rounded-lg p-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-4">Course & Track Information</h4>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Course Track</label>
                        {isEditingDemo ? (
                          <input
                            type="text"
                            value={editedDemoData.track || editedDemoData.courseTag || ''}
                            onChange={(e) => handleDemoDataChange('track', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-base text-gray-900">{selectedDemoDetails.track || selectedDemoDetails.courseTag || 'Not specified'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                        {isEditingDemo ? (
                          <input
                            type="text"
                            value={editedDemoData.topic || ''}
                            onChange={(e) => handleDemoDataChange('topic', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-base text-gray-900">{selectedDemoDetails.topic || 'Not specified'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
                        <p className="text-base text-gray-900">
                          {selectedDemoDetails.createdAt ? new Date(selectedDemoDetails.createdAt).toLocaleDateString() : 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                        <p className="text-base text-gray-900">
                          {selectedDemoDetails.updatedAt ? new Date(selectedDemoDetails.updatedAt).toLocaleDateString() : 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Feedback & Description */}
                  <div className="bg-yellow-50 rounded-lg p-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-4">Feedback & Description</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {selectedDemoDetails.type === 'offline_demo' ? 'Trainer Feedback' : 'Demo Description'}
                      </label>
                      {isEditingDemo ? (
                        <textarea
                          value={editedDemoData.feedback || editedDemoData.description || ''}
                          onChange={(e) => handleDemoDataChange('feedback', e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                      <p className="text-base text-gray-900 whitespace-pre-wrap">
                          {selectedDemoDetails.feedback || selectedDemoDetails.description || 'No feedback provided'}
                      </p>
                      )}
                    </div>
                  </div>

                  {/* Evaluation Data for Offline Demos */}
                  {selectedDemoDetails.type === 'offline_demo' && selectedDemoDetails.evaluationData && (
                    <div className="bg-purple-50 rounded-lg p-6">
                      <h4 className="text-xl font-semibold text-gray-900 mb-4">Evaluation Details</h4>
                      <div className="grid grid-cols-2 gap-6">
                        {/* Candidate Details */}
                        <div>
                          <h5 className="text-lg font-medium text-gray-800 mb-3">Candidate Details</h5>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium">Demo Title:</span> 
                              {isEditingDemo ? (
                                <input
                                  type="text"
                                  value={editedDemoData.evaluationData?.demoTitle || ''}
                                  onChange={(e) => handleDemoDataChange('evaluationData', { ...editedDemoData.evaluationData, demoTitle: e.target.value })}
                                  className="ml-2 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                />
                              ) : (
                                <span className="ml-2">{selectedDemoDetails.evaluationData.demoTitle || 'Not specified'}</span>
                              )}
                            </div>
                            <div>
                              <span className="font-medium">Taken By:</span> 
                              {isEditingDemo ? (
                                <input
                                  type="text"
                                  value={editedDemoData.evaluationData?.takenBy || ''}
                                  onChange={(e) => handleDemoDataChange('evaluationData', { ...editedDemoData.evaluationData, takenBy: e.target.value })}
                                  className="ml-2 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                />
                              ) : (
                                <span className="ml-2">{selectedDemoDetails.evaluationData.takenBy || 'Not specified'}</span>
                              )}
                            </div>
                            <div>
                              <span className="font-medium">Date:</span> 
                              {isEditingDemo ? (
                                <input
                                  type="date"
                                  value={editedDemoData.evaluationData?.date || ''}
                                  onChange={(e) => handleDemoDataChange('evaluationData', { ...editedDemoData.evaluationData, date: e.target.value })}
                                  className="ml-2 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                />
                              ) : (
                                <span className="ml-2">{selectedDemoDetails.evaluationData.date || 'Not specified'}</span>
                              )}
                            </div>
                            <div>
                              <span className="font-medium">Track:</span> 
                              {isEditingDemo ? (
                                <input
                                  type="text"
                                  value={editedDemoData.evaluationData?.track || ''}
                                  onChange={(e) => handleDemoDataChange('evaluationData', { ...editedDemoData.evaluationData, track: e.target.value })}
                                  className="ml-2 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                />
                              ) : (
                                <span className="ml-2">{selectedDemoDetails.evaluationData.track || 'Not specified'}</span>
                              )}
                            </div>
                            <div>
                              <span className="font-medium">Topic:</span> 
                              {isEditingDemo ? (
                                <input
                                  type="text"
                                  value={editedDemoData.evaluationData?.topic || ''}
                                  onChange={(e) => handleDemoDataChange('evaluationData', { ...editedDemoData.evaluationData, topic: e.target.value })}
                                  className="ml-2 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                />
                              ) : (
                                <span className="ml-2">{selectedDemoDetails.evaluationData.topic || 'Not specified'}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Preparedness */}
                        <div>
                          <h5 className="text-lg font-medium text-gray-800 mb-3">Preparedness</h5>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium">Slide Usage:</span> 
                              {isEditingDemo ? (
                                <select
                                  value={editedDemoData.evaluationData?.slideUsage || ''}
                                  onChange={(e) => handleDemoDataChange('evaluationData', { ...editedDemoData.evaluationData, slideUsage: e.target.value })}
                                  className="ml-2 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="">Select</option>
                                  <option value="excellent">Excellent - Fully Followed</option>
                                  <option value="good">Good - Partially Used</option>
                                  <option value="poor">Poor - Not Used</option>
                                </select>
                              ) : (
                                <span className="ml-2">{getEvaluationLabel('slideUsage', selectedDemoDetails.evaluationData.slideUsage)}</span>
                              )}
                            </div>
                            <div>
                              <span className="font-medium">Reference Video:</span> 
                              {isEditingDemo ? (
                                <select
                                  value={editedDemoData.evaluationData?.referenceVideoWatched || ''}
                                  onChange={(e) => handleDemoDataChange('evaluationData', { ...editedDemoData.evaluationData, referenceVideoWatched: e.target.value })}
                                  className="ml-2 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="">Select</option>
                                  <option value="yes">Yes</option>
                                  <option value="no">No</option>
                                  <option value="partially">Partially Watched</option>
                                  <option value="not-available">Video not available</option>
                                </select>
                              ) : (
                                <span className="ml-2">{getEvaluationLabel('referenceVideoWatched', selectedDemoDetails.evaluationData.referenceVideoWatched)}</span>
                              )}
                            </div>
                            <div>
                              <span className="font-medium">Content Familiarity:</span> 
                              {isEditingDemo ? (
                                <select
                                  value={editedDemoData.evaluationData?.contentFamiliarity || ''}
                                  onChange={(e) => handleDemoDataChange('evaluationData', { ...editedDemoData.evaluationData, contentFamiliarity: e.target.value })}
                                  className="ml-2 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="">Select</option>
                                  <option value="excellent">Excellent - Confident with the concepts</option>
                                  <option value="fair">Fair - Partial, not clear with some concepts</option>
                                  <option value="poor">Poor - Not confident, ambiguous</option>
                                </select>
                              ) : (
                                <span className="ml-2">{getEvaluationLabel('contentFamiliarity', selectedDemoDetails.evaluationData.contentFamiliarity)}</span>
                              )}
                            </div>
                            <div>
                              <span className="font-medium">Time Management:</span> 
                              {isEditingDemo ? (
                                <select
                                  value={editedDemoData.evaluationData?.timeManagement || ''}
                                  onChange={(e) => handleDemoDataChange('evaluationData', { ...editedDemoData.evaluationData, timeManagement: e.target.value })}
                                  className="ml-2 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="">Select</option>
                                  <option value="excellent">Excellent - On Time</option>
                                  <option value="needs-improvement">Needs Improvement - Exceeded</option>
                                  <option value="fair">Fair - Completed Quick</option>
                                </select>
                              ) : (
                                <span className="ml-2">{getEvaluationLabel('timeManagement', selectedDemoDetails.evaluationData.timeManagement)}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Delivery */}
                        <div>
                          <h5 className="text-lg font-medium text-gray-800 mb-3">Delivery</h5>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium">Voice Modulation:</span> 
                              {isEditingDemo ? (
                                <select
                                  value={editedDemoData.evaluationData?.voiceModulation || ''}
                                  onChange={(e) => handleDemoDataChange('evaluationData', { ...editedDemoData.evaluationData, voiceModulation: e.target.value })}
                                  className="ml-2 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="">Select</option>
                                  <option value="excellent">Excellent - Loud and clear</option>
                                  <option value="fair">Fair - Monotone, needs improvement</option>
                                  <option value="good">Good - Loud but no modulation</option>
                                  <option value="poor">Poor - Very low</option>
                                </select>
                              ) : (
                                <span className="ml-2">{getEvaluationLabel('voiceModulation', selectedDemoDetails.evaluationData.voiceModulation)}</span>
                              )}
                            </div>
                            <div>
                              <span className="font-medium">Body Language:</span> 
                              {isEditingDemo ? (
                                <select
                                  value={editedDemoData.evaluationData?.bodyLanguage || ''}
                                  onChange={(e) => handleDemoDataChange('evaluationData', { ...editedDemoData.evaluationData, bodyLanguage: e.target.value })}
                                  className="ml-2 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="">Select</option>
                                  <option value="excellent">Excellent – Confident, open posture, great eye contact</option>
                                  <option value="very-good">Very Good – Mostly confident</option>
                                  <option value="fair">Fair – Minimal gestures</option>
                                  <option value="poor">Poor – Closed posture</option>
                                </select>
                              ) : (
                                <span className="ml-2">{getEvaluationLabel('bodyLanguage', selectedDemoDetails.evaluationData.bodyLanguage)}</span>
                              )}
                            </div>
                            <div>
                              <span className="font-medium">Language Clarity:</span> 
                              {isEditingDemo ? (
                                <select
                                  value={editedDemoData.evaluationData?.languageClarity || ''}
                                  onChange={(e) => handleDemoDataChange('evaluationData', { ...editedDemoData.evaluationData, languageClarity: e.target.value })}
                                  className="ml-2 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="">Select</option>
                                  <option value="excellent">Excellent – Clear, fluent, engaging</option>
                                  <option value="very-good">Very Good – Mostly clear</option>
                                  <option value="fair">Fair – Frequent mistakes</option>
                                  <option value="poor">Poor – Unclear/confusing</option>
                                </select>
                              ) : (
                                <span className="ml-2">{getEvaluationLabel('languageClarity', selectedDemoDetails.evaluationData.languageClarity)}</span>
                              )}
                            </div>
                            <div>
                              <span className="font-medium">Pace of Delivery:</span> 
                              {isEditingDemo ? (
                                <select
                                  value={editedDemoData.evaluationData?.paceOfDelivery || ''}
                                  onChange={(e) => handleDemoDataChange('evaluationData', { ...editedDemoData.evaluationData, paceOfDelivery: e.target.value })}
                                  className="ml-2 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="">Select</option>
                                  <option value="excellent">Excellent – Well-paced</option>
                                  <option value="very-good">Very Good – Slightly fast/slow</option>
                                  <option value="fair">Fair – Too fast/slow</option>
                                  <option value="poor">Poor – Very rushed or dragging</option>
                                </select>
                              ) : (
                                <span className="ml-2">{getEvaluationLabel('paceOfDelivery', selectedDemoDetails.evaluationData.paceOfDelivery)}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Content Knowledge */}
                        <div>
                          <h5 className="text-lg font-medium text-gray-800 mb-3">Content Knowledge</h5>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium">Key Concepts Covered:</span> 
                              {isEditingDemo ? (
                                <select
                                  value={editedDemoData.evaluationData?.keyConceptsCovered || ''}
                                  onChange={(e) => handleDemoDataChange('evaluationData', { ...editedDemoData.evaluationData, keyConceptsCovered: e.target.value })}
                                  className="ml-2 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="">Select</option>
                                  <option value="excellent">Excellent – All concepts covered</option>
                                  <option value="very-good">Very Good – Most concepts covered</option>
                                  <option value="good">Good – Good coverage</option>
                                  <option value="fair">Fair – Some concepts missed</option>
                                  <option value="poor">Poor – Many concepts missed</option>
                                </select>
                              ) : (
                                <span className="ml-2">{getEvaluationLabel('keyConceptsCovered', selectedDemoDetails.evaluationData.keyConceptsCovered)}</span>
                              )}
                          </div>
                            <div>
                              <span className="font-medium">Accuracy of Information:</span> 
                              {isEditingDemo ? (
                                <select
                                  value={editedDemoData.evaluationData?.accuracyOfInformation || ''}
                                  onChange={(e) => handleDemoDataChange('evaluationData', { ...editedDemoData.evaluationData, accuracyOfInformation: e.target.value })}
                                  className="ml-2 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="">Select</option>
                                  <option value="excellent">Excellent – Highly accurate</option>
                                  <option value="very-good">Very Good – Mostly accurate</option>
                                  <option value="good">Good – Generally accurate</option>
                                  <option value="fair">Fair – Not aligned but okay</option>
                                  <option value="poor">Poor – Inaccurate information</option>
                                </select>
                              ) : (
                                <span className="ml-2">{getEvaluationLabel('accuracyOfInformation', selectedDemoDetails.evaluationData.accuracyOfInformation)}</span>
                              )}
                        </div>
                        <div>
                              <span className="font-medium">Flow of Content:</span> 
                              {isEditingDemo ? (
                                <select
                                  value={editedDemoData.evaluationData?.flowOfContent || ''}
                                  onChange={(e) => handleDemoDataChange('evaluationData', { ...editedDemoData.evaluationData, flowOfContent: e.target.value })}
                                  className="ml-2 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="">Select</option>
                                  <option value="excellent">Excellent – Very smooth</option>
                                  <option value="very-good">Very Good – Mostly smooth</option>
                                  <option value="good">Good – Mostly smooth</option>
                                  <option value="fair">Fair – Some confusion</option>
                                  <option value="poor">Poor – Very confusing</option>
                                </select>
                              ) : (
                                <span className="ml-2">{getEvaluationLabel('flowOfContent', selectedDemoDetails.evaluationData.flowOfContent)}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Overall Rating */}
                        <div>
                          <h5 className="text-lg font-medium text-gray-800 mb-3">Overall Assessment</h5>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium">Overall Rating:</span> 
                              {isEditingDemo ? (
                                <select
                                  value={editedDemoData.evaluationData?.overallRating || ''}
                                  onChange={(e) => handleDemoDataChange('evaluationData', { ...editedDemoData.evaluationData, overallRating: e.target.value })}
                                  className="ml-2 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="">Select</option>
                                  <option value="1">1 - Poor</option>
                                  <option value="2">2 - Fair</option>
                                  <option value="3">3 - Good</option>
                                  <option value="4">4 - Very Good</option>
                                  <option value="5">5 - Excellent</option>
                                </select>
                              ) : (
                                <span className="ml-2">{selectedDemoDetails.evaluationData.overallRating || 'Not specified'}</span>
                              )}
                            </div>
                            <div>
                              <span className="font-medium">Reattempt Required:</span> 
                              {isEditingDemo ? (
                                <select
                                  value={editedDemoData.evaluationData?.reattemptNeeded === null ? '' : editedDemoData.evaluationData?.reattemptNeeded ? 'yes' : 'no'}
                                  onChange={(e) => handleDemoDataChange('evaluationData', { ...editedDemoData.evaluationData, reattemptNeeded: e.target.value === 'yes' ? true : e.target.value === 'no' ? false : null })}
                                  className="ml-2 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="">Select</option>
                                  <option value="yes">Yes</option>
                                  <option value="no">No</option>
                                </select>
                              ) : (
                                <span className="ml-2">
                                  {selectedDemoDetails.evaluationData.reattemptNeeded === null ? 'Not specified' : 
                                   selectedDemoDetails.evaluationData.reattemptNeeded ? 'Yes' : 'No'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t mt-6">
                  {isEditingDemo ? (
                    <>
                      <button
                        onClick={handleEditToggle}
                        className="px-6 py-3 text-base text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveDemoChanges}
                        className="px-6 py-3 text-base text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                      >
                        Save Changes
                      </button>
                    </>
                  ) : (
                  <button
                    onClick={closeDemoDetailsModal}
                    className="px-6 py-3 text-base text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TrainerDemoManagement;
