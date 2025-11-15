import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../../context/userContext';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { toast } from 'react-hot-toast';
import moment from 'moment';
import { 
  LuVideo, 
  LuCheck, 
  LuX, 
  LuClock, 
  LuStar, 
  LuCalendar,
  LuUser,
  LuFileText,
  LuDownload,
  LuUpload,
  LuMessageSquare,
  LuPencil,
  LuTrash2,
  LuTarget,
  LuPlus,
  LuMapPin
} from 'react-icons/lu';

const MasterTrainerDemoManagement = () => {
  const { user } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState('final-reviews');
  const [offlineRequests, setOfflineRequests] = useState([]);
  const [demoSessions, setDemoSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const [newFeedback, setNewFeedback] = useState({
    demoId: '',
    traineeId: '',
    technicalSkills: 0,
    presentationSkills: 0,
    communicationSkills: 0,
    creativity: 0,
    overallRating: 0,
    feedback: '',
    recommendations: ''
  });
  const [trainerApprovedDemos, setTrainerApprovedDemos] = useState([]);
  const [finalReviewDemos, setFinalReviewDemos] = useState([]);
  const [showFinalReviewModal, setShowFinalReviewModal] = useState(false);
  const [selectedFinalReviewDemo, setSelectedFinalReviewDemo] = useState(null);
  const [finalReviewData, setFinalReviewData] = useState({
    action: 'approve', // 'approve' or 'reject'
    feedback: '',
    rating: 0
  });
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState(null);
  const [showDemoDetailsModal, setShowDemoDetailsModal] = useState(false);
  const [selectedDemoDetails, setSelectedDemoDetails] = useState(null);
  const [isSubmittingFinalReview, setIsSubmittingFinalReview] = useState(false);

  useEffect(() => {
    // fetchOfflineRequests(); // Disabled - focusing on online demos
    fetchDemoSessions();
    fetchTrainerApprovedDemos();
  }, []);

  const fetchOfflineRequests = async () => {
    try {
      setIsSubmittingFinalReview(true);
      const response = await axiosInstance.get(API_PATHS.DEMO.OFFLINE_REQUESTS);
      if (response.data.success) {
        setOfflineRequests(response.data.requests);
      } else {
        // Mock data for development
        setOfflineRequests([
          {
            id: '1',
            traineeName: 'John Smith',
            traineeId: 'T001',
            department: 'Software Development',
            courseTag: 'React',
            requestedDate: new Date().toISOString(),
            preferredTime: '10:00 AM - 11:00 AM',
            location: 'Conference Room A',
            description: 'React component development demonstration',
            status: 'pending',
            priority: 'high'
          },
          {
            id: '2',
            traineeName: 'Sarah Johnson',
            traineeId: 'T002',
            department: 'Software Development',
            courseTag: 'Node.js',
            requestedDate: new Date(Date.now() + 86400000).toISOString(),
            preferredTime: '2:00 PM - 3:00 PM',
            location: 'Training Hall B',
            description: 'Node.js API development demonstration',
            status: 'pending',
            priority: 'medium'
          },
          {
            id: '3',
            traineeName: 'Mike Wilson',
            traineeId: 'T003',
            department: 'Software Development',
            courseTag: 'Full Stack',
            requestedDate: new Date(Date.now() + 172800000).toISOString(),
            preferredTime: '11:00 AM - 12:00 PM',
            location: 'Lab Room C',
            description: 'Full-stack project presentation',
            status: 'approved',
            priority: 'high'
          }
        ]);
      }
    } catch (error) {
      
      setOfflineRequests([]);
    }
  };

  const fetchDemoSessions = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.DEMO.GET_ALL);
      if (response.data.success && response.data.demos) {
        
        // Process demos to include offline demos
        const allDemos = response.data.demos.map(demo => {
          // If it's an offline demo, format it properly
          if (demo.type === 'offline_demo') {
            const formattedDemo = {
              ...demo,
              traineeName: demo.traineeName || 'Unknown Trainee',
              traineeId: demo.traineeId || demo.author_id || demo.id,
              courseTag: 'Offline Demo',
              status: demo.status || 'pending_approval',
              createdAt: demo.createdAt // Keep original createdAt, don't override
            };
            return formattedDemo;
          }
          return demo;
        });
        
        // Separate demos based on status
        const approvedDemos = allDemos.filter(demo => 
          (demo.type === 'offline_demo' && demo.status === 'approved') ||
          (demo.type !== 'offline_demo' && demo.masterTrainerStatus === 'approved')
        ).map(demo => ({
          ...demo,
          // Normalize offline demo fields for All Demos list
          traineeName: demo.traineeName || demo.name || 'Unknown Trainee',
          traineeId: demo.traineeId || demo.author_id || demo.id,
          courseTag: demo.type === 'offline_demo' ? 'Offline Demo' : (demo.courseTag || 'N/A'),
          createdAt: demo.createdAt || demo.uploadedAt || null
        }));
        
        // Pending for master trainer review includes:
        // - Offline demos pending_approval
        // - Online demos where trainer approved (trainerStatus === 'approved') but master trainer hasn't
        const pendingDemos = allDemos.filter(demo => {
          const isOfflinePending = demo.type === 'offline_demo' && demo.status === 'pending_approval';
          const isTrainerApprovedOnline = (demo.type !== 'offline_demo') && (demo.trainerStatus === 'approved') && (demo.masterTrainerStatus !== 'approved');
          return isOfflinePending || isTrainerApprovedOnline;
        });
        
        setDemoSessions(approvedDemos); // All Demos tab shows approved demos
        setFinalReviewDemos(pendingDemos); // Final Reviews tab shows items needing master trainer action
      } else {
        // Mock data for development
        const mockDemos = [
          {
            id: '1',
            traineeName: 'Emily Davis',
            traineeId: 'T004',
            courseTag: 'React',
            sessionDate: new Date().toISOString(),
            duration: '60 minutes',
            location: 'Conference Room A',
            status: 'approved',
            recordingUrl: '/recordings/demo1.mp4',
            feedback: 'Excellent presentation skills and technical knowledge',
            rating: 4.5,
            reviewedAt: new Date().toISOString()
          },
          {
            id: '2',
            traineeName: 'Alex Brown',
            traineeId: 'T005',
            courseTag: 'Node.js',
            sessionDate: new Date(Date.now() - 86400000).toISOString(),
            duration: '45 minutes',
            location: 'Training Hall B',
            status: 'approved',
            recordingUrl: '/recordings/demo2.mp4',
            feedback: 'Good understanding of backend concepts',
            rating: 4.0,
            reviewedAt: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: '3',
            traineeName: 'Priya Sharma',
            traineeId: 'dadfdf33-e6cb-405a-afd3-34473fce32be',
            courseTag: 'Offline Demo',
            type: 'offline_demo',
            status: 'pending_approval',
            createdAt: '2024-01-10T10:00:00Z',
            feedback: 'Good demonstration of offline concepts with clear explanations.',
            evaluationData: {
              demoTitle: 'React Hooks Demo',
              takenBy: 'Priya Sharma',
              date: '2024-01-10',
              track: 'Frontend Development',
              topic: 'React Hooks',
              slideUsage: 'Excellent - Fully Followed',
              referenceVideoWatched: 'Yes',
              contentFamiliarity: 'Excellent - Confident with the concepts',
              timeManagement: 'Excellent - On Time',
              voiceModulation: 'Excellent - Loud and clear',
              bodyLanguage: 'Excellent – Confident, open posture, great eye contact',
              languageClarity: 'Excellent – Clear, fluent, engaging language',
              paceOfDelivery: 'Excellent – Well-paced, easy to follow',
              boardUsage: 'Good – Used wherever required',
              handsOnCoding: 'Excellent – Explained step by step',
              classEngagement: 'Excellent – Actively involves students',
              usageOfExample: 'Excellent – Real-world examples used effectively',
              keyConceptsCovered: 'Excellent - All concepts covered',
              accuracyOfInformation: 'Excellent - Perfectly aligned',
              flowOfContent: 'Excellent – Seamless transitions, logical flow',
              overallRating: '5',
              reattemptNeeded: false
            }
          }
        ];
        
        // Separate mock demos based on status
        const approvedDemos = mockDemos.filter(demo => 
          demo.status === 'approved' || 
          (demo.type === 'offline_demo' && demo.status === 'approved')
        );
        
        const pendingDemos = mockDemos.filter(demo => 
          demo.status === 'pending_approval' || 
          (demo.type === 'offline_demo' && demo.status === 'pending_approval')
        );
        
        setDemoSessions(approvedDemos); // All Demos tab shows approved demos
        setFinalReviewDemos(pendingDemos); // Final Reviews tab shows pending demos
      }
    } catch (error) {
      
      setDemoSessions([]);
    }
  };

  const fetchTrainerApprovedDemos = async () => {
    try {
      
      // Fetch all demos and filter for trainer-approved ones
      const response = await axiosInstance.get(API_PATHS.DEMO.GET_ALL, {
        params: {
          // Don't filter by status - we want all demos to check trainerStatus
        }
      });
      
      if (response.data.success && response.data.demos) {
        
        // Filter demos that have been approved by trainers but not yet by master trainer
        const approvedDemos = response.data.demos.filter(demo => 
          demo.trainerStatus === 'approved' && demo.masterTrainerStatus !== 'approved'
        );
        
        // For demos without reviewedByName, try to fetch trainer name
        const demosWithTrainerNames = await Promise.all(approvedDemos.map(async (demo) => {
          if (!demo.reviewedByName && demo.reviewedBy) {
            try {
              // Try to fetch trainer name from the reviewedBy ID
              const trainerResponse = await axiosInstance.get(API_PATHS.USERS.GET_USER_BY_ID(demo.reviewedBy));
              if (trainerResponse.data.success) {
                demo.reviewedByName = trainerResponse.data.user.name;
              }
            } catch (error) {
              
              demo.reviewedByName = 'Unknown Trainer';
            }
          }
          return demo;
        }));
        
        setTrainerApprovedDemos(demosWithTrainerNames);
      } else {
        setTrainerApprovedDemos([]);
      }
    } catch (error) {
      
      setTrainerApprovedDemos([]);
    }
  };

  const handleRequestAction = async (requestId, action) => {
    try {
      const response = await axiosInstance.put(API_PATHS.DEMO.REVIEW_SLOT(requestId), {
        action: action // 'approve' or 'reject'
      });
      
      if (response.data.success) {
        fetchOfflineRequests();
        setShowRequestModal(false);
        setSelectedRequest(null);
      }
    } catch (error) {
      
    }
  };

  const handleFeedbackSubmit = async (sessionId) => {
    try {
      const response = await axiosInstance.post(API_PATHS.DEMO.FEEDBACK(sessionId), {
        feedback: feedback,
        rating: rating
      });
      
      if (response.data.success) {
        setFeedback('');
        setRating(0);
        fetchDemoSessions();
      }
    } catch (error) {
      
    }
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowRequestModal(true);
  };

  const closeModal = () => {
    setShowRequestModal(false);
    setSelectedRequest(null);
  };

  const openFinalReviewModal = (demo) => {
    setSelectedFinalReviewDemo(demo);
    setFinalReviewData({
      action: 'approve',
      feedback: '',
      rating: 0
    });
    setShowFinalReviewModal(true);
  };

  const closeFinalReviewModal = () => {
    setShowFinalReviewModal(false);
    setSelectedFinalReviewDemo(null);
  };

  const openVideoModal = (demo) => {
    setSelectedDemo(demo);
    setShowVideoModal(true);
  };

  const closeVideoModal = () => {
    setShowVideoModal(false);
    setSelectedDemo(null);
  };

  // Demo details functions
  const openDemoDetailsModal = (demo) => {
    // Normalize fields so the modal shows correct type and details
    const normalized = {
      ...demo,
      type: demo.type || (demo.courseTag === 'Offline Demo' ? 'offline_demo' : 'online_demo'),
      courseTag: demo.courseTag || (demo.type === 'offline_demo' ? 'Offline Demo' : demo.courseTag),
      traineeId: demo.traineeId || demo.author_id || demo.id,
      uploadedAt: demo.uploadedAt || demo.createdAt,
      demoTitle: demo.demoTitle || demo.title || 'Untitled Demo',
      description: demo.description || demo.feedback || 'No description available',
      trainerFeedback: demo.feedback || 'No feedback provided',
      rating: demo.rating || 0,
      reviewStatus: demo.status || (demo.trainerStatus === 'approved' ? 'under_review' : 'pending')
    };
    setSelectedDemoDetails(normalized);
    setShowDemoDetailsModal(true);
  };

  const closeDemoDetailsModal = () => {
    setShowDemoDetailsModal(false);
    setSelectedDemoDetails(null);
  };

  // Handle demo approval
  const handleDemoApproval = async (traineeId, demoIndex, action) => {
    try {
      if (!traineeId || demoIndex === undefined) {
        toast.error('Trainee ID or demo index not found. Cannot process approval.');
        return;
      }

      const response = await axiosInstance.put(`/api/demos/offline/${traineeId}/${demoIndex}`, {
        action: action, // 'approve' or 'reject'
        reviewedBy: user?.author_id || user?.id,
        reviewedAt: new Date().toISOString()
      });

      if (response.data.success) {
        toast.success(`Demo ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
        closeDemoDetailsModal();
        // Refresh both tabs
        fetchDemoSessions();
        fetchTrainerApprovedDemos();
      } else {
        throw new Error(response.data.message || `Failed to ${action} demo`);
      }
    } catch (error) {
      
      toast.error(`Failed to ${action} demo. Please try again.`);
    }
  };

  const handleFinalReviewSubmit = async () => {
    if (!selectedFinalReviewDemo) return;

    if (finalReviewData.action === 'approve' && finalReviewData.rating === 0) {
      toast.error('Please provide a rating for approved demos');
      return;
    }

    if (finalReviewData.action === 'reject' && !finalReviewData.feedback.trim()) {
      toast.error('Please provide feedback for rejected demos');
      return;
    }

    try {
      const reviewPayload = {
        action: finalReviewData.action,
        rating: finalReviewData.rating,
        feedback: finalReviewData.feedback,
        reviewedBy: user?.author_id || user?.id,
        reviewedAt: new Date().toISOString()
      };

      let response;
      if (selectedFinalReviewDemo.type === 'offline_demo') {
        // Use offline demo endpoint which identifies by traineeId and demoIndex
        const traineeId = selectedFinalReviewDemo.traineeId || selectedFinalReviewDemo.author_id;
        const index = selectedFinalReviewDemo.demoIndex;
        if (!traineeId || index === undefined) {
          toast.error('Missing trainee ID or demo index for offline demo.');
          return;
        }
        response = await axiosInstance.put(`/api/demos/offline/${traineeId}/${index}`, reviewPayload);
      } else {
        // Online demo path uses demo id and master-review
        const demoId = selectedFinalReviewDemo.id || selectedFinalReviewDemo.demoId;
        if (!demoId) {
          toast.error('Missing demo id.');
          return;
        }
        response = await axiosInstance.put(`${API_PATHS.DEMO.UPDATE(demoId)}/master-review`, reviewPayload);
      }

      if (response.data.success) {
        
        // Refresh data for both Final Reviews and All Demos tabs
        await Promise.all([
          fetchTrainerApprovedDemos(),
          fetchDemoSessions()
        ]);

        toast.success(`Demo ${finalReviewData.action === 'approve' ? 'approved' : 'rejected'} successfully!`);
        closeFinalReviewModal();
      } else {
        throw new Error(response.data.message || 'Failed to submit final review');
      }
    } catch (error) {
      
      toast.error('Failed to submit final review. Please try again.');
    } finally {
      setIsSubmittingFinalReview(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Fetch campus allocations
  const fetchCampusAllocations = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.ALLOCATION.GET_ALL);
      if (response.data.success) {
        setCampusAllocations(response.data.allocations);
      } else {
        // Mock data for development
        setCampusAllocations([
          {
            id: '1',
            traineeName: 'John Smith',
            traineeId: 'T001',
            campusName: 'Mumbai Campus',
            campusId: 'C001',
            startDate: '2024-02-01',
            endDate: '2024-08-01',
            status: 'active',
            notes: 'Excellent performance in React development'
          },
          {
            id: '2',
            traineeName: 'Sarah Johnson',
            traineeId: 'T002',
            campusName: 'Delhi Campus',
            campusId: 'C002',
            startDate: '2024-03-01',
            endDate: '2024-09-01',
            status: 'active',
            notes: 'Strong teaching skills and communication'
          }
        ]);
      }
    } catch (error) {
      
      // Mock data for development
      setCampusAllocations([
        {
          id: '1',
          traineeName: 'John Smith',
          traineeId: 'T001',
          campusName: 'Mumbai Campus',
          campusId: 'C001',
          startDate: '2024-02-01',
          endDate: '2024-08-01',
          status: 'active',
          notes: 'Excellent performance in React development'
        }
      ]);
    }
  };

  // Fetch observations
  const fetchObservations = async () => {
    try {
      const response = await axiosInstance.get('/api/observations');
      if (response.data.success) {
        setObservations(response.data.observations);
      } else {
        // Mock data for development
        setObservations([
          {
            id: '1',
            traineeName: 'John Smith',
            traineeId: 'T001',
            category: 'communication',
            observation: 'Excellent presentation skills and clear communication',
            rating: 4.5,
            notes: 'Very confident in explaining complex concepts',
            date: new Date().toISOString(),
            trainerName: user.name
          },
          {
            id: '2',
            traineeName: 'Sarah Johnson',
            traineeId: 'T002',
            category: 'professionalism',
            observation: 'Good punctuality and professional attitude',
            rating: 4.0,
            notes: 'Always prepared and ready for sessions',
            date: new Date(Date.now() - 86400000).toISOString(),
            trainerName: user.name
          }
        ]);
      }
    } catch (error) {
      
      // Mock data for development
      setObservations([
        {
          id: '1',
          traineeName: 'John Smith',
          traineeId: 'T001',
          category: 'communication',
          observation: 'Excellent presentation skills and clear communication',
          rating: 4.5,
          notes: 'Very confident in explaining complex concepts',
          date: new Date().toISOString(),
          trainerName: user.name
        }
      ]);
    }
  };

  // Handle request approval
  const handleApproveRequest = async (requestId) => {
    try {
      const response = await axiosInstance.put(API_PATHS.DEMO.REVIEW_SLOT(requestId), {
        status: 'approved',
        approvedBy: user.id,
        approvedAt: new Date().toISOString()
      });
      
      if (response.data.success) {
        toast.success('Request approved successfully!');
        fetchOfflineRequests();
      }
    } catch (error) {
      
      toast.error('Failed to approve request. Please try again.');
    }
  };

  // Handle request rejection
  const handleRejectRequest = async (requestId) => {
    try {
      const response = await axiosInstance.put(API_PATHS.DEMO.REVIEW_SLOT(requestId), {
        status: 'rejected',
        rejectedBy: user.id,
        rejectedAt: new Date().toISOString()
      });
      
      if (response.data.success) {
        toast.success('Request rejected successfully!');
        fetchOfflineRequests();
      }
    } catch (error) {
      
      toast.error('Failed to reject request. Please try again.');
    }
  };

  // Submit observation
  const handleSubmitObservation = async () => {
    if (!newObservation.traineeId || !newObservation.observation) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await axiosInstance.post('/api/observations', {
        ...newObservation,
        trainerId: user.id,
        trainerName: user.name,
        date: new Date().toISOString()
      });

      if (response.data.success) {
        toast.success('Observation recorded successfully!');
        setNewObservation({
          traineeId: '',
          category: 'communication',
          observation: '',
          rating: 0,
          notes: ''
        });
        setShowObservationModal(false);
        fetchObservations();
      }
    } catch (error) {
      
      toast.error('Failed to record observation. Please try again.');
    }
  };

  // Submit campus allocation
  const handleSubmitCampusAllocation = async () => {
    if (!newCampusAllocation.traineeId || !newCampusAllocation.campusId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await axiosInstance.post(API_PATHS.ALLOCATION.CREATE, {
        ...newCampusAllocation,
        allocatedBy: user.id,
        allocatedAt: new Date().toISOString()
      });

      if (response.data.success) {
        toast.success('Campus allocation created successfully!');
        setNewCampusAllocation({
          traineeId: '',
          campusId: '',
          startDate: '',
          endDate: '',
          notes: ''
        });
        setShowCampusModal(false);
        fetchCampusAllocations();
      }
    } catch (error) {
      
      toast.error('Failed to create campus allocation. Please try again.');
    }
  };

  // Submit feedback
  const handleSubmitFeedback = async () => {
    if (!newFeedback.demoId || !newFeedback.traineeId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await axiosInstance.post(API_PATHS.DEMO.FEEDBACK, {
        ...newFeedback,
        trainerId: user.id,
        trainerName: user.name,
        submittedAt: new Date().toISOString()
      });

      if (response.data.success) {
        toast.success('Feedback submitted successfully!');
        setNewFeedback({
          demoId: '',
          traineeId: '',
          technicalSkills: 0,
          presentationSkills: 0,
          communicationSkills: 0,
          creativity: 0,
          overallRating: 0,
          feedback: '',
          recommendations: ''
        });
        setShowFeedbackModal(false);
        fetchDemoSessions();
      }
    } catch (error) {
      
      toast.error('Failed to submit feedback. Please try again.');
    }
  };

  // Open modals
  const openObservationModal = (trainee = null) => {
    setSelectedTrainee(trainee);
    setNewObservation({
      traineeId: trainee?.id || '',
      category: 'communication',
      observation: '',
      rating: 0,
      notes: ''
    });
    setShowObservationModal(true);
  };

  const openCampusModal = (trainee = null) => {
    setSelectedTrainee(trainee);
    setNewCampusAllocation({
      traineeId: trainee?.id || '',
      campusId: '',
      startDate: '',
      endDate: '',
      notes: ''
    });
    setShowCampusModal(true);
  };

  const openFeedbackModal = (demo) => {
    setSelectedDemo(demo);
    setNewFeedback({
      demoId: demo.id,
      traineeId: demo.traineeId,
      technicalSkills: 0,
      presentationSkills: 0,
      communicationSkills: 0,
      creativity: 0,
      overallRating: 0,
      feedback: '',
      recommendations: ''
    });
    setShowFeedbackModal(true);
  };

  return (
    <DashboardLayout activeMenu="Demo Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-gray-900">Demo Management</h1>
              <p className="text-gray-600 mt-1">Manage offline demo requests and sessions</p>
            </div>
            <div className="flex items-center gap-2">
              <LuVideo className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab('sessions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'sessions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <LuVideo className="w-4 h-4" />
                <span>All Demos</span>
              </button>
              <button
                onClick={() => setActiveTab('feedback')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'feedback'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <LuStar className="w-4 h-4" />
                <span>Feedback & Ratings</span>
              </button>
              <button
                onClick={() => setActiveTab('final-reviews')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'final-reviews'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <LuCheck className="w-4 h-4" />
                <span>Final Reviews</span>
              </button>
            </nav>
          </div>

          <div className="p-6">

            {/* All Demos Tab */}
            {activeTab === 'sessions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">All Demos</h2>
                  <p className="text-sm text-gray-500">
                    View all demos from all trainees
                  </p>
                </div>

                {demoSessions.length > 0 ? (
                  <div className="space-y-4">
                    {demoSessions.map((session, index) => (
                      <div 
                        key={session.id || session.demoId || `demo-${index}`} 
                        onClick={() => openDemoDetailsModal(session)}
                        className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-medium text-gray-900">
                                {session.traineeName || session.name || 'Unknown Trainee'}
                              </h3>
                              <span className="text-sm text-gray-500">
                                ({session.traineeId || session.author_id || session.id || 'N/A'})
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                session.type === 'offline_demo' ? 
                                  (session.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                                   session.status === 'approved' ? 'bg-green-100 text-green-800' :
                                   session.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                   'bg-gray-100 text-gray-800') :
                                getStatusColor(session.status)
                              }`}>
                                {session.type === 'offline_demo' ? 
                                  (session.status === 'pending_approval' ? 'Pending Approval' :
                                   session.status === 'approved' ? 'Approved' :
                                   session.status === 'rejected' ? 'Rejected' :
                                   'Unknown') :
                                  session.status
                                }
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {session.type === 'offline_demo' ? 'Offline Demo' : (session.courseTag || 'N/A')}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <LuCalendar className="w-4 h-4" />
                                {session.type === 'offline_demo' ? 
                                  (() => {
                                    // Try multiple possible date fields
                                    const possibleDates = [
                                      session.createdAt,
                                      session.created_at,
                                      session.date,
                                      session.demoDate,
                                      session.submittedAt
                                    ];
                                    
                                    for (const dateValue of possibleDates) {
                                      if (dateValue) {
                                        try {
                                          const date = new Date(dateValue);
                                          if (!isNaN(date.getTime())) {
                                            return date.toLocaleDateString();
                                          }
                                        } catch (e) {
                                          }
                                      }
                                    }
                                    
                                    // Show a default date for offline demos if no date is available
                                    return 'Offline Demo';
                                  })() :
                                  (session.uploadedAt ? new Date(session.uploadedAt).toLocaleDateString() : 'N/A')
                                }
                              </span>
                              <span className="flex items-center gap-1">
                                <LuClock className="w-4 h-4" />
                                {session.type === 'offline_demo' ? 
                                  (session.createdAt ? 
                                    (() => {
                                      try {
                                        const date = new Date(session.createdAt);
                                        return date.toLocaleTimeString();
                                      } catch (e) {
                                        return 'Offline Demo';
                                      }
                                    })() : 'Offline Demo') : 
                                  (session.duration || 'N/A')
                                }
                              </span>
                              <span className="flex items-center gap-1">
                                <LuMapPin className="w-4 h-4" />
                                {session.type === 'offline_demo' ? 'Offline' : (session.location || 'N/A')}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {session.type !== 'offline_demo' && (
                              <>
                                <button className="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer">
                                  <LuDownload className="w-4 h-4" />
                                </button>
                                <button className="px-3 py-1 text-green-600 hover:text-green-800 text-sm font-medium cursor-pointer">
                                  <LuStar className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <LuVideo className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No demo sessions found</p>
                  </div>
                )}
              </div>
            )}

            {/* Feedback & Ratings Tab */}
            {activeTab === 'feedback' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Provide Feedback</h2>
                
                {demoSessions.filter(s => s.status === 'completed').length > 0 ? (
                  <div className="space-y-4">
                    {demoSessions.filter(s => s.status === 'completed').map((session, index) => (
                      <div key={session.id || session.demoId || `feedback-${index}`} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{session.traineeName}</h3>
                            <p className="text-sm text-gray-600">{session.courseTag} - {new Date(session.sessionDate).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setRating(star)}
                                className={`w-6 h-6 ${
                                  star <= rating ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                              >
                                <LuStar className="w-full h-full fill-current" />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Feedback
                            </label>
                            <textarea
                              value={feedback}
                              onChange={(e) => setFeedback(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows={3}
                              placeholder="Provide detailed feedback..."
                            />
                          </div>
                          <button
                            onClick={() => handleFeedbackSubmit(session.id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                          >
                            Submit Feedback
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <LuFileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No completed sessions to provide feedback</p>
                  </div>
                )}
              </div>
            )}

            {/* Final Reviews Tab */}
            {activeTab === 'final-reviews' && (
              <div className="space-y-6">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Final Reviews</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Review and approve demos that have been reviewed by trainers
                    </p>
                  </div>
                  {finalReviewDemos.length > 0 && (
                    <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                      <LuCheck className="w-5 h-5 text-blue-500" />
                      <span className="text-sm font-semibold text-blue-700">
                        {finalReviewDemos.length} {finalReviewDemos.length === 1 ? 'Demo' : 'Demos'} Pending
                      </span>
                    </div>
                  )}
                </div>

                {/* Statistics Cards */}
                {finalReviewDemos.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-50 rounded-xl p-5 border border-blue-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-500 mb-1">Total Pending</p>
                          <p className="text-3xl font-bold text-blue-600">{finalReviewDemos.length}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <LuClock className="w-6 h-6 text-blue-400" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-50 rounded-xl p-5 border border-yellow-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-yellow-500 mb-1">Trainer Approved</p>
                          <p className="text-3xl font-bold text-yellow-600">
                            {finalReviewDemos.filter(d => d.trainerStatus === 'approved' || d.type === 'offline_demo').length}
                          </p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-lg">
                          <LuCheck className="w-6 h-6 text-yellow-400" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-50 rounded-xl p-5 border border-purple-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-500 mb-1">Offline Demos</p>
                          <p className="text-3xl font-bold text-purple-600">
                            {finalReviewDemos.filter(d => d.type === 'offline_demo').length}
                          </p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <LuVideo className="w-6 h-6 text-purple-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Demo Cards */}
                {finalReviewDemos.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {finalReviewDemos.map((session, index) => (
                      <div 
                        key={session.id || session.demoId || `final-review-${index}`} 
                        className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden"
                      >
                        {/* Card Header */}
                        <div className="bg-gradient-to-r from-blue-100 to-blue-50 px-6 py-4 border-b border-blue-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-blue-200 rounded-lg">
                                <LuVideo className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-800 text-lg">
                                  {session.traineeName || session.name || 'Unknown Trainee'}
                                </h3>
                                <p className="text-xs text-gray-600 mt-0.5">
                                  {session.type === 'offline_demo' ? 'Offline Demo' : (session.courseTag || session.title || 'N/A')}
                                </p>
                              </div>
                            </div>
                            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                              session.type === 'offline_demo' ? 
                                (session.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                 session.status === 'approved' ? 'bg-green-100 text-green-700 border border-green-200' :
                                 session.status === 'rejected' ? 'bg-red-100 text-red-700 border border-red-200' :
                                 'bg-gray-100 text-gray-700 border border-gray-200') :
                              'bg-yellow-100 text-yellow-700 border border-yellow-200'
                            }`}>
                              {session.type === 'offline_demo' ? 
                                (session.status === 'pending_approval' ? 'Pending Approval' :
                                 session.status === 'approved' ? 'Approved' :
                                 session.status === 'rejected' ? 'Rejected' :
                                 'Unknown') :
                                'Trainer Approved'
                              }
                            </span>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-6 space-y-4">
                          {/* Trainee Info */}
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <LuUser className="w-4 h-4" />
                            <span className="font-medium">ID:</span>
                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                              {session.traineeId || session.author_id || session.id || 'N/A'}
                            </span>
                          </div>

                          {/* Trainer Feedback Section */}
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                                <LuMessageSquare className="w-4 h-4" />
                                <span>{session.type === 'offline_demo' ? 'Feedback' : 'Trainer Feedback'}</span>
                              </h4>
                              {session.reviewedByName && (
                                <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                                  by {session.reviewedByName}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-700 text-sm leading-relaxed mb-3">
                              {session.type === 'offline_demo' ? 
                                (session.feedback || 'No feedback provided') : 
                                (session.feedback || 'No feedback provided')
                              }
                            </p>
                            {session.rating > 0 && (
                              <div className="flex items-center space-x-2 pt-2 border-t border-gray-200">
                                <span className="text-sm font-medium text-gray-700">Rating:</span>
                                <div className="flex space-x-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <LuStar
                                      key={star}
                                      className={`w-4 h-4 ${
                                        star <= session.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm font-semibold text-gray-700 ml-1">
                                  {session.rating}/5
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col sm:flex-row gap-2 pt-2">
                            <button
                              onClick={() => openFinalReviewModal(session)}
                              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-green-100 text-green-700 text-sm font-semibold rounded-lg hover:bg-green-200 transition-all border border-green-200 hover:border-green-300"
                            >
                              <LuCheck className="w-4 h-4" />
                              <span>Approve / Reject</span>
                            </button>
                            <button
                              onClick={() => openDemoDetailsModal(session)}
                              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-100 text-blue-700 text-sm font-semibold rounded-lg hover:bg-blue-200 transition-all border border-blue-200 hover:border-blue-300"
                            >
                              <LuFileText className="w-4 h-4" />
                              <span>View Details</span>
                            </button>
                            {session.type !== 'offline_demo' && (
                              <button
                                onClick={() => openVideoModal(session)}
                                className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-all border border-gray-200 hover:border-gray-300"
                              >
                                <LuVideo className="w-4 h-4" />
                                <span>Video</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
                    <div className="p-4 bg-blue-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                      <LuCheck className="w-12 h-12 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No demos pending approval</h3>
                    <p className="text-gray-500 text-sm max-w-md mx-auto">
                      All demos have been reviewed or there are no demos awaiting your final approval.
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Request Details Modal */}
        {showRequestModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Request Details</h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <LuX className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Trainee Name</label>
                      <p className="text-gray-900">{selectedRequest.traineeName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Trainee ID</label>
                      <p className="text-gray-900">{selectedRequest.traineeId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Department</label>
                      <p className="text-gray-900">{selectedRequest.department}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Course Tag</label>
                      <p className="text-gray-900">{selectedRequest.courseTag}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Requested Date</label>
                      <p className="text-gray-900">{new Date(selectedRequest.requestedDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Preferred Time</label>
                      <p className="text-gray-900">{selectedRequest.preferredTime}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Location</label>
                      <p className="text-gray-900">{selectedRequest.location}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Priority</label>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedRequest.priority)}`}>
                        {selectedRequest.priority}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <p className="text-gray-900">{selectedRequest.description}</p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleRequestAction(selectedRequest.id, 'reject')}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleRequestAction(selectedRequest.id, 'approve')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Observation Modal - REMOVED */}
        {false && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Record Observation</h3>
                  <button
                    onClick={() => setShowObservationModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <LuX className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Trainee</label>
                    <select
                      value={newObservation.traineeId}
                      onChange={(e) => setNewObservation(prev => ({ ...prev, traineeId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a trainee...</option>
                      <option value="T001">John Smith (T001)</option>
                      <option value="T002">Sarah Johnson (T002)</option>
                      <option value="T003">Mike Wilson (T003)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={newObservation.category}
                      onChange={(e) => setNewObservation(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="communication">Communication Skills</option>
                      <option value="professionalism">Professionalism</option>
                      <option value="leadership">Leadership</option>
                      <option value="teamwork">Teamwork</option>
                      <option value="creativity">Creativity</option>
                      <option value="punctuality">Punctuality</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setNewObservation(prev => ({ ...prev, rating: star }))}
                          className={`p-1 ${
                            star <= newObservation.rating
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          } hover:text-yellow-400 transition-colors`}
                        >
                          <LuStar className="w-6 h-6" />
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-gray-600">
                        {newObservation.rating > 0 ? `${newObservation.rating}/5` : 'Rate this observation'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Observation</label>
                    <textarea
                      value={newObservation.observation}
                      onChange={(e) => setNewObservation(prev => ({ ...prev, observation: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="4"
                      placeholder="Describe your observation..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                    <textarea
                      value={newObservation.notes}
                      onChange={(e) => setNewObservation(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                      placeholder="Any additional notes or recommendations..."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowObservationModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitObservation}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    Record Observation
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Campus Allocation Modal - REMOVED */}
        {false && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Allocate Campus</h3>
                  <button
                    onClick={() => setShowCampusModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <LuX className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Trainee</label>
                    <select
                      value={newCampusAllocation.traineeId}
                      onChange={(e) => setNewCampusAllocation(prev => ({ ...prev, traineeId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Select a trainee...</option>
                      <option value="T001">John Smith (T001)</option>
                      <option value="T002">Sarah Johnson (T002)</option>
                      <option value="T003">Mike Wilson (T003)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Campus</label>
                    <select
                      value={newCampusAllocation.campusId}
                      onChange={(e) => setNewCampusAllocation(prev => ({ ...prev, campusId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Select a campus...</option>
                      <option value="C001">Mumbai Campus</option>
                      <option value="C002">Delhi Campus</option>
                      <option value="C003">Bangalore Campus</option>
                      <option value="C004">Chennai Campus</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={newCampusAllocation.startDate}
                        onChange={(e) => setNewCampusAllocation(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                      <input
                        type="date"
                        value={newCampusAllocation.endDate}
                        onChange={(e) => setNewCampusAllocation(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea
                      value={newCampusAllocation.notes}
                      onChange={(e) => setNewCampusAllocation(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      rows="3"
                      placeholder="Any notes about this allocation..."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowCampusModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitCampusAllocation}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
                  >
                    Allocate Campus
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Modal */}
        {showFeedbackModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Provide Feedback</h3>
                  <button
                    onClick={() => setShowFeedbackModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <LuX className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Demo Session</label>
                    <input
                      type="text"
                      value={selectedDemo?.title || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Technical Skills</label>
                      <div className="flex items-center space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setNewFeedback(prev => ({ ...prev, technicalSkills: star }))}
                            className={`p-1 ${
                              star <= newFeedback.technicalSkills
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            } hover:text-yellow-400 transition-colors`}
                          >
                            <LuStar className="w-5 h-5" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Presentation Skills</label>
                      <div className="flex items-center space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setNewFeedback(prev => ({ ...prev, presentationSkills: star }))}
                            className={`p-1 ${
                              star <= newFeedback.presentationSkills
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            } hover:text-yellow-400 transition-colors`}
                          >
                            <LuStar className="w-5 h-5" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Communication Skills</label>
                      <div className="flex items-center space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setNewFeedback(prev => ({ ...prev, communicationSkills: star }))}
                            className={`p-1 ${
                              star <= newFeedback.communicationSkills
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            } hover:text-yellow-400 transition-colors`}
                          >
                            <LuStar className="w-5 h-5" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Creativity</label>
                      <div className="flex items-center space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setNewFeedback(prev => ({ ...prev, creativity: star }))}
                            className={`p-1 ${
                              star <= newFeedback.creativity
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            } hover:text-yellow-400 transition-colors`}
                          >
                            <LuStar className="w-5 h-5" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Overall Rating</label>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setNewFeedback(prev => ({ ...prev, overallRating: star }))}
                          className={`p-1 ${
                            star <= newFeedback.overallRating
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          } hover:text-yellow-400 transition-colors`}
                        >
                          <LuStar className="w-6 h-6" />
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-gray-600">
                        {newFeedback.overallRating > 0 ? `${newFeedback.overallRating}/5` : 'Rate overall performance'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Feedback</label>
                    <textarea
                      value={newFeedback.feedback}
                      onChange={(e) => setNewFeedback(prev => ({ ...prev, feedback: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="4"
                      placeholder="Provide detailed feedback on the demo session..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Recommendations</label>
                    <textarea
                      value={newFeedback.recommendations}
                      onChange={(e) => setNewFeedback(prev => ({ ...prev, recommendations: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                      placeholder="Any recommendations for improvement..."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowFeedbackModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitFeedback}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    Submit Feedback
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Final Review Modal */}
        {showFinalReviewModal && selectedFinalReviewDemo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Final Review</h3>
                  <button
                    onClick={closeFinalReviewModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <LuX className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Demo Details</h4>
                    <p className="text-sm text-gray-600"><strong>Title:</strong> {selectedFinalReviewDemo.title}</p>
                    <p className="text-sm text-gray-600"><strong>Trainee:</strong> {selectedFinalReviewDemo.traineeName}</p>
                    <p className="text-sm text-gray-600"><strong>Course:</strong> {selectedFinalReviewDemo.courseTag}</p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Trainer Review</h4>
                    <p className="text-sm text-gray-700 mb-2">{selectedFinalReviewDemo.feedback}</p>
                    {selectedFinalReviewDemo.rating > 0 && (
                      <div className="flex items-center space-x-1">
                        <span className="text-sm text-gray-600">Rating:</span>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <LuStar
                              key={star}
                              className={`w-4 h-4 ${
                                star <= selectedFinalReviewDemo.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="approve"
                          checked={finalReviewData.action === 'approve'}
                          onChange={(e) => setFinalReviewData(prev => ({ ...prev, action: e.target.value }))}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Approve</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="reject"
                          checked={finalReviewData.action === 'reject'}
                          onChange={(e) => setFinalReviewData(prev => ({ ...prev, action: e.target.value }))}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Reject</span>
                      </label>
                    </div>
                  </div>

                  {finalReviewData.action === 'approve' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                      <div className="flex items-center space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFinalReviewData(prev => ({ ...prev, rating: star }))}
                            className={`w-8 h-8 rounded-full transition-colors ${
                              star <= finalReviewData.rating
                                ? 'text-yellow-400 bg-yellow-100'
                                : 'text-gray-300 hover:text-yellow-400'
                            }`}
                          >
                            <LuStar className="w-5 h-5" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Feedback</label>
                    <textarea
                      value={finalReviewData.feedback}
                      onChange={(e) => setFinalReviewData(prev => ({ ...prev, feedback: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Provide your final feedback..."
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={closeFinalReviewModal}
                      className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleFinalReviewSubmit}
                      disabled={isSubmittingFinalReview}
                      className={`px-4 py-2 text-white rounded-lg transition-colors ${
                        isSubmittingFinalReview ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
                      } ${
                        finalReviewData.action === 'approve'
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      {isSubmittingFinalReview
                        ? (finalReviewData.action === 'approve' ? 'Approving...' : 'Rejecting...')
                        : (finalReviewData.action === 'approve' ? 'Approve Demo' : 'Reject Demo')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Video Modal */}
        {showVideoModal && selectedDemo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Demo Video</h3>
                  <button
                    onClick={closeVideoModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <LuX className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{selectedDemo.title}</h4>
                    <p className="text-sm text-gray-600">by {selectedDemo.traineeName}</p>
                  </div>

                  <div className="bg-black rounded-lg overflow-hidden">
                    {selectedDemo.fileUrl ? (
                      <video
                        controls
                        className="w-full h-auto"
                        onError={(e) => console.error('Video error:', e)}
                      >
                        <source src={selectedDemo.fileUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <div className="flex items-center justify-center h-64 text-white">
                        <div className="text-center">
                          <LuVideo className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                          <p>Video not available</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Demo Details Modal */}
        {showDemoDetailsModal && selectedDemoDetails && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-[95vw] w-full mx-4 max-h-[95vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedDemoDetails.type === 'offline_demo' ? 'Offline Demo Details' : 'Demo Details'}
                  </h3>
                  <button
                    onClick={closeDemoDetailsModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <LuX className="w-7 h-7" />
                  </button>
                </div>

                <div className="space-y-4 overflow-x-auto">
                  {/* Section 1: Demo and Trainee Information */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-blue-600 text-white px-4 py-2">
                      <div className="grid grid-cols-8 gap-2 text-sm font-medium">
                        <div className="min-w-[100px]">Demo Type</div>
                        <div className="min-w-[120px]">Trainee Name</div>
                        <div className="min-w-[200px]">Trainee ID</div>
                        <div className="min-w-[120px]">Course Track</div>
                        <div className="min-w-[120px]">Demo Status</div>
                        <div className="min-w-[100px]">Created Date</div>
                        <div className="min-w-[100px]">Last Updated</div>
                        <div className="min-w-[80px]">Duration</div>
                      </div>
                    </div>
                    <div className="bg-white px-4 py-3">
                      <div className="grid grid-cols-8 gap-2 text-sm">
                        <div className="font-medium min-w-[100px] break-words">
                          {selectedDemoDetails.type === 'offline_demo' ? 'Offline Demo' : 'Online Demo'}
                        </div>
                        <div className="min-w-[120px] break-words">
                          {selectedDemoDetails.traineeName || selectedDemoDetails.name || 'Unknown Trainee'}
                      </div>
                        <div className="min-w-[200px] break-all text-xs">
                          {selectedDemoDetails.traineeId || selectedDemoDetails.author_id || selectedDemoDetails.id || 'N/A'}
                      </div>
                        <div className="min-w-[120px] break-words">
                          {selectedDemoDetails.courseTag || selectedDemoDetails.track || 'Not specified'}
                      </div>
                        <div className="min-w-[120px]">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                          selectedDemoDetails.type === 'offline_demo' ? 
                            (selectedDemoDetails.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                             selectedDemoDetails.status === 'approved' ? 'bg-green-100 text-green-800' :
                             selectedDemoDetails.status === 'rejected' ? 'bg-red-100 text-red-800' :
                             'bg-gray-100 text-gray-800') :
                            'bg-blue-100 text-blue-800'
                        }`}>
                          {selectedDemoDetails.type === 'offline_demo' ? 
                            (selectedDemoDetails.status === 'pending_approval' ? 'Pending Approval' :
                             selectedDemoDetails.status === 'approved' ? 'Approved' :
                             selectedDemoDetails.status === 'rejected' ? 'Rejected' :
                             'Unknown') :
                              selectedDemoDetails.status || 'Active'
                          }
                        </span>
                      </div>
                        <div className="min-w-[100px] break-words">
                          {selectedDemoDetails.type === 'offline_demo' ? 
                            (selectedDemoDetails.createdAt ? new Date(selectedDemoDetails.createdAt).toLocaleDateString() : 'N/A') :
                            (selectedDemoDetails.uploadedAt ? new Date(selectedDemoDetails.uploadedAt).toLocaleDateString() : 'N/A')
                          }
                      </div>
                        <div className="min-w-[100px] break-words">
                          {selectedDemoDetails.updatedAt ? new Date(selectedDemoDetails.updatedAt).toLocaleDateString() : 'N/A'}
                        </div>
                        <div className="min-w-[80px] break-words">
                          {selectedDemoDetails.duration || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Content and Description */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-blue-600 text-white px-4 py-2">
                      <div className="grid grid-cols-6 gap-2 text-sm font-medium">
                        <div className="min-w-[150px]">Demo Title</div>
                        <div className="min-w-[120px]">Topic</div>
                        <div className="min-w-[200px]">Description</div>
                        <div className="min-w-[250px]">Trainer Feedback</div>
                        <div className="min-w-[100px]">Rating</div>
                        <div className="min-w-[120px]">Review Status</div>
                      </div>
                    </div>
                    <div className="bg-white px-4 py-3">
                      <div className="grid grid-cols-6 gap-2 text-sm">
                        <div className="font-medium min-w-[150px] break-words">
                          {selectedDemoDetails.title || selectedDemoDetails.demoTitle || 'Untitled Demo'}
                        </div>
                        <div className="min-w-[120px] break-words">
                          {selectedDemoDetails.topic || 'Not specified'}
                        </div>
                        <div className="min-w-[200px] break-words">
                          {selectedDemoDetails.description || 'No description available'}
                        </div>
                        <div className="min-w-[250px] break-words">
                          {selectedDemoDetails.feedback || selectedDemoDetails.trainerFeedback || 'No feedback provided'}
                        </div>
                        <div className="min-w-[100px]">
                          {selectedDemoDetails.rating && selectedDemoDetails.rating > 0 ? (
                            <div className="flex items-center space-x-1">
                              <span className="font-medium">{selectedDemoDetails.rating}/5</span>
                              <div className="flex space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <LuStar
                                    key={star}
                                    className={`w-3 h-3 ${
                                      star <= selectedDemoDetails.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500">Not rated</span>
                          )}
                        </div>
                        <div className="min-w-[120px]">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                            selectedDemoDetails.trainerStatus === 'approved' ? 'bg-green-100 text-green-800' :
                            selectedDemoDetails.trainerStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedDemoDetails.trainerStatus === 'approved' ? 'Approved' :
                             selectedDemoDetails.trainerStatus === 'rejected' ? 'Rejected' :
                             'Under Review'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Evaluation Details (for offline demos) */}
                  {selectedDemoDetails.type === 'offline_demo' && selectedDemoDetails.evaluationData && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-blue-600 text-white px-4 py-2">
                      <div className="grid grid-cols-8 gap-2 text-sm font-medium">
                        <div className="min-w-[130px]">Slide Usage</div>
                        <div className="min-w-[130px]">Reference Video</div>
                        <div className="min-w-[150px]">Content Familiarity</div>
                        <div className="min-w-[130px]">Time Management</div>
                        <div className="min-w-[130px]">Voice Modulation</div>
                        <div className="min-w-[130px]">Body Language</div>
                        <div className="min-w-[130px]">Language Clarity</div>
                        <div className="min-w-[150px]">Pace of Delivery</div>
                          </div>
                        </div>
                      <div className="bg-white px-4 py-3">
                        <div className="grid grid-cols-8 gap-2 text-sm">
                          <div className="min-w-[130px] break-words">
                            {selectedDemoDetails.evaluationData.slideUsage || 'Not specified'}
                          </div>
                          <div className="min-w-[130px] break-words">
                            {selectedDemoDetails.evaluationData.referenceVideoWatched || 'Not specified'}
                        </div>
                          <div className="min-w-[150px] break-words">
                            {selectedDemoDetails.evaluationData.contentFamiliarity || 'Not specified'}
                          </div>
                          <div className="min-w-[130px] break-words">
                            {selectedDemoDetails.evaluationData.timeManagement || 'Not specified'}
                        </div>
                          <div className="min-w-[130px] break-words">
                            {selectedDemoDetails.evaluationData.voiceModulation || 'Not specified'}
                          </div>
                          <div className="min-w-[130px] break-words">
                            {selectedDemoDetails.evaluationData.bodyLanguage || 'Not specified'}
                        </div>
                          <div className="min-w-[130px] break-words">
                            {selectedDemoDetails.evaluationData.languageClarity || 'Not specified'}
                          </div>
                          <div className="min-w-[150px] break-words">
                            {selectedDemoDetails.evaluationData.paceOfDelivery || 'Not specified'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section 4: Technical Assessment */}
                  {selectedDemoDetails.type === 'offline_demo' && selectedDemoDetails.evaluationData && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-blue-600 text-white px-4 py-2">
                      <div className="grid grid-cols-8 gap-2 text-sm font-medium">
                        <div className="min-w-[130px]">Board Usage</div>
                        <div className="min-w-[140px]">Hands-On Coding</div>
                        <div className="min-w-[140px]">Class Engagement</div>
                        <div className="min-w-[150px]">Usage of Examples</div>
                        <div className="min-w-[130px]">Key Concepts</div>
                        <div className="min-w-[150px]">Information Accuracy</div>
                        <div className="min-w-[130px]">Content Flow</div>
                        <div className="min-w-[130px]">Overall Rating</div>
                          </div>
                        </div>
                      <div className="bg-white px-4 py-3">
                        <div className="grid grid-cols-8 gap-2 text-sm">
                          <div className="min-w-[130px] break-words">
                            {selectedDemoDetails.evaluationData.boardUsage || 'Not specified'}
                          </div>
                          <div className="min-w-[140px] break-words">
                            {selectedDemoDetails.evaluationData.handsOnCoding || 'Not specified'}
                          </div>
                          <div className="min-w-[140px] break-words">
                            {selectedDemoDetails.evaluationData.classEngagement || 'Not specified'}
                          </div>
                          <div className="min-w-[150px] break-words">
                            {selectedDemoDetails.evaluationData.usageOfExample || 'Not specified'}
                          </div>
                          <div className="min-w-[130px] break-words">
                            {selectedDemoDetails.evaluationData.keyConceptsCovered || 'Not specified'}
                          </div>
                          <div className="min-w-[150px] break-words">
                            {selectedDemoDetails.evaluationData.accuracyOfInformation || 'Not specified'}
                          </div>
                          <div className="min-w-[130px] break-words">
                            {selectedDemoDetails.evaluationData.flowOfContent || 'Not specified'}
                          </div>
                          <div className="min-w-[130px] break-words">
                            {selectedDemoDetails.evaluationData.overallRating || 'Not specified'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section 5: Final Assessment */}
                  {selectedDemoDetails.type === 'offline_demo' && selectedDemoDetails.evaluationData && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-blue-600 text-white px-4 py-2">
                        <div className="grid grid-cols-6 gap-2 text-sm font-medium">
                          <div className="min-w-[140px]">Reattempt Required</div>
                          <div className="min-w-[200px]">Master Trainer Review</div>
                          <div className="min-w-[140px]">Master Trainer Status</div>
                          <div className="min-w-[120px]">Review Date</div>
                          <div className="min-w-[120px]">Final Decision</div>
                          <div className="min-w-[150px]">Comments</div>
                          </div>
                        </div>
                      <div className="bg-white px-4 py-3">
                        <div className="grid grid-cols-6 gap-2 text-sm">
                          <div className="min-w-[140px] break-words">
                            {selectedDemoDetails.evaluationData.reattemptNeeded === null ? 'Not specified' : 
                             selectedDemoDetails.evaluationData.reattemptNeeded ? 'Yes' : 'No'}
                          </div>
                          <div className="min-w-[200px] break-words">
                            {selectedDemoDetails.masterTrainerReview || 'Not reviewed'}
                          </div>
                          <div className="min-w-[140px]">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                              selectedDemoDetails.masterTrainerStatus === 'approved' ? 'bg-green-100 text-green-800' :
                              selectedDemoDetails.masterTrainerStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {selectedDemoDetails.masterTrainerStatus === 'approved' ? 'Approved' :
                               selectedDemoDetails.masterTrainerStatus === 'rejected' ? 'Rejected' :
                               'Pending'}
                            </span>
                          </div>
                          <div className="min-w-[120px] break-words">
                            {selectedDemoDetails.masterTrainerReviewedAt ? 
                              new Date(selectedDemoDetails.masterTrainerReviewedAt).toLocaleDateString() : 'N/A'}
                          </div>
                          <div className="min-w-[120px] break-words">
                            {selectedDemoDetails.status === 'approved' ? 'Approved' :
                             selectedDemoDetails.status === 'rejected' ? 'Rejected' :
                             'Pending'}
                          </div>
                          <div className="min-w-[150px] break-words">
                            {selectedDemoDetails.comments || 'No comments'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t mt-6">
                  <button
                    onClick={closeDemoDetailsModal}
                    className="px-6 py-3 text-base text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  
                  {/* Show Accept/Reject buttons only for pending offline demos */}
                  {selectedDemoDetails.type === 'offline_demo' && selectedDemoDetails.status === 'pending_approval' && (
                    <>
                      <button
                        onClick={() => {
                          const traineeId = selectedDemoDetails.traineeId || selectedDemoDetails.author_id;
                          const demoIndex = selectedDemoDetails.demoIndex;
                          handleDemoApproval(traineeId, demoIndex, 'reject');
                        }}
                        className="px-6 py-3 text-base text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          const traineeId = selectedDemoDetails.traineeId || selectedDemoDetails.author_id;
                          const demoIndex = selectedDemoDetails.demoIndex;
                          handleDemoApproval(traineeId, demoIndex, 'approve');
                        }}
                        className="px-6 py-3 text-base text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
                      >
                        Accept
                      </button>
                    </>
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

export default MasterTrainerDemoManagement;
