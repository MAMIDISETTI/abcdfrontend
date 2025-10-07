import React, { useState, useContext, useEffect } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { 
  LuUpload, 
  LuDownload, 
  LuVideo, 
  LuFileText, 
  LuStar, 
  LuX, 
  LuPlus, 
  LuCalendar, 
  LuClock, 
  LuMapPin, 
  LuCheck, 
  LuEye, 
  LuUser, 
  LuMessageSquare, 
  LuPencil, 
  LuTrash2, 
  LuTarget,
  LuLoader,
  LuPlay
} from 'react-icons/lu';
import { UserContext } from '../../context/userContext';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import moment from 'moment';

const DemoManagement = () => {
  const { user } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState('online');
  const [demoUpload, setDemoUpload] = useState({
    title: '',
    description: '',
    file: null,
    type: 'online', // online, offline
    courseTag: '',
    duration: '',
    subject: ''
  });
  const [uploadedDemos, setUploadedDemos] = useState([]);
  const [demo_managements_details, setDemo_managements_details] = useState([]);
  const [offlineSlotRequests, setOfflineSlotRequests] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showSlotRequestForm, setShowSlotRequestForm] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [campusAllocation, setCampusAllocation] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [ratings, setRatings] = useState([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [traineeFeedback, setTraineeFeedback] = useState({
    demoId: '',
    rating: 0,
    comment: '',
    experience: ''
  });

  // Load data on component mount
  useEffect(() => {
    fetchDemos();
    fetchOfflineSlotRequests();
    fetchAvailableSlots();
    fetchFeedback();
    fetchRatings();
  }, []);

  // Load campus allocation when user is available
  useEffect(() => {
    if (user?.id || user?.author_id) {
      fetchCampusAllocation();
    }
  }, [user]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type for MP4
      if (file.type !== 'video/mp4') {
        toast.error('Please upload only MP4 video files');
        return;
      }
      setDemoUpload(prev => ({ ...prev, file }));
    }
  };

  const handleUpload = async () => {
    if (!demoUpload.title.trim()) {
      toast.error('Please enter a demo title');
      return;
    }

    if (!demoUpload.description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    if (demoUpload.type === 'online' && !demoUpload.file) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);

    try {
      
      // Check if backend server is running (optional health check)
      try {
        await axiosInstance.get('/api/health', { timeout: 3000 });
      } catch (healthError) {
      }
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('title', demoUpload.title);
      formData.append('description', demoUpload.description);
      formData.append('courseTag', demoUpload.courseTag);
      formData.append('type', demoUpload.type);
      formData.append('traineeId', user?.author_id || 'trainee1');
      formData.append('traineeName', user?.name || 'Trainee');
      
      if (demoUpload.file) {
        formData.append('file', demoUpload.file);
      }

      // Make API call to upload demo with increased timeout for file uploads
      const response = await axiosInstance.post(API_PATHS.DEMO.UPLOAD, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds timeout for file uploads
      });

      if (response.data.success) {
        // Add to local state with the response data
        const newDemo = {
          id: response.data.demo.id || Date.now().toString(),
          title: demoUpload.title,
          description: demoUpload.description,
          courseTag: demoUpload.courseTag,
          type: demoUpload.type,
          fileName: demoUpload.file?.name || null,
          fileUrl: response.data.demo.fileUrl || null,
          uploadedAt: new Date().toISOString(),
          status: 'under_review',
          rating: 0,
          feedback: '',
          reviewedBy: null,
          reviewedAt: null,
          masterTrainerReview: null,
          masterTrainerReviewedBy: null,
          masterTrainerReviewedAt: null,
          rejectionReason: null
        };

        setUploadedDemos(prev => [newDemo, ...prev]);
        setDemo_managements_details(prev => [newDemo, ...prev]);
        toast.success('Demo uploaded successfully! Status: Under Review');
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
      
      setDemoUpload({
        title: '',
        description: '',
        file: null,
        type: 'online',
        courseTag: ''
      });
      setShowUploadForm(false);
      setIsUploading(false);
      
    } catch (error) {
      console.error('Error uploading demo:', error);
      
      if (error.code === 'ECONNABORTED') {
        toast.error('Upload timeout. The file might be too large or the server is not responding. Please try again.');
      } else if (error.response?.status === 404) {
        toast.error('Upload endpoint not found. Please check if the server is running.');
      } else if (error.response?.status >= 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('Failed to upload demo. Please try again.');
      }
      
      // Fallback: Add to local state for development
      const newDemo = {
        id: Date.now().toString(),
        title: demoUpload.title,
        description: demoUpload.description,
        courseTag: demoUpload.courseTag,
        type: demoUpload.type,
        fileName: demoUpload.file?.name || null,
        fileUrl: demoUpload.file ? URL.createObjectURL(demoUpload.file) : null,
        uploadedAt: new Date().toISOString(),
        status: 'under_review',
        rating: 0,
        feedback: '',
        reviewedBy: null,
        reviewedAt: null,
        masterTrainerReview: null,
        masterTrainerReviewedBy: null,
        masterTrainerReviewedAt: null,
        rejectionReason: null,
        traineeId: user?.author_id || 'trainee1',
        traineeName: user?.name || 'Trainee'
      };
      
      setUploadedDemos(prev => [newDemo, ...prev]);
      setDemo_managements_details(prev => [newDemo, ...prev]);
      toast.success('Demo uploaded successfully (local storage)');
    }
    
    setIsUploading(false);
  };

  const fetchDemos = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.DEMO.GET_ALL, {
        params: { traineeId: user?.author_id || 'trainee1' }
      });
      if (response.data.success) {
        setUploadedDemos(response.data.demos);
        setDemo_managements_details(response.data.demos);
      } else {
        throw new Error('Failed to fetch demos');
      }
    } catch (error) {
      console.error('Error fetching demos:', error);
      // Set empty arrays if API fails
      setUploadedDemos([]);
      setDemo_managements_details([]);
    }
  };

  const handleDownload = (demoId) => {
    // Implement download functionality
    toast.success('Download started!');
  };

  const handleDelete = async (demoId) => {
    if (window.confirm('Are you sure you want to delete this demo?')) {
      try {
        const response = await axiosInstance.delete(API_PATHS.DEMO.DELETE(demoId), {
          params: { traineeId: user?.author_id || 'trainee1' }
        });
        if (response.data.success) {
          setUploadedDemos(prev => prev.filter(demo => demo.id !== demoId));
          setDemo_managements_details(prev => prev.filter(demo => demo.id !== demoId));
          toast.success('Demo deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting demo:', error);
        toast.error('Failed to delete demo');
      }
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

  // Mock functions for other features
  const fetchOfflineSlotRequests = async () => {
    // Mock data
    setOfflineSlotRequests([]);
  };

  const fetchAvailableSlots = async () => {
    // Mock data
    setAvailableSlots([]);
  };

  const fetchCampusAllocation = async () => {
    try {
      const traineeId = user?.id || user?.author_id;
      
      if (!traineeId) {
        setCampusAllocation(null);
        return;
      }
      
      const response = await axiosInstance.get(API_PATHS.ALLOCATION.GET_ALL, {
        params: { traineeId: traineeId }
      });

      if (response.data.success && response.data.allocations && response.data.allocations.length > 0) {
        // Get the latest allocation (most recent)
        const latestAllocation = response.data.allocations[0]; // Assuming they're sorted by date desc
        setCampusAllocation({
          campusName: latestAllocation.campusName || 'Not Specified',
          deploymentDate: latestAllocation.deploymentDate || latestAllocation.allocatedDate || new Date().toISOString(),
          status: latestAllocation.status || 'confirmed',
          notes: latestAllocation.notes || ''
        });
      } else {
        setCampusAllocation(null);
      }
    } catch (error) {
      console.error('Error fetching campus allocation:', error);
      setCampusAllocation(null);
    }
  };

  const fetchFeedback = async () => {
    // Mock data for development
    setFeedback([
      {
        id: '1',
        demoId: '1',
        demoTitle: 'React Component Development',
        trainerName: 'John Smith',
        rating: 4.5,
        feedback: 'Excellent demonstration of React concepts! Great job on explaining the lifecycle methods.',
        date: new Date().toISOString(),
        type: 'online'
      },
      {
        id: '2',
        demoId: '2',
        demoTitle: 'Teaching Practice Session',
        trainerName: 'Sarah Johnson',
        rating: 4.0,
        feedback: 'Good classroom management and student engagement. Could improve on time management.',
        date: new Date(Date.now() - 86400000).toISOString(),
        type: 'offline'
      }
    ]);
  };

  const fetchRatings = async () => {
    // Mock data for development
    setRatings([
      {
        id: '1',
        demoId: '1',
        demoTitle: 'React Component Development',
        overallRating: 4.5,
        technicalSkills: 4.0,
        presentationSkills: 5.0,
        communicationSkills: 4.5,
        creativity: 4.0,
        date: new Date().toISOString()
      }
    ]);
  };

  const handleTraineeFeedback = async () => {
    if (!traineeFeedback.demoId || traineeFeedback.rating === 0) {
      toast.error('Please select a demo and provide a rating');
      return;
    }

    try {
      // Mock API call
      toast.success('Feedback submitted successfully!');
      setTraineeFeedback({
        demoId: '',
        rating: 0,
        comment: '',
        experience: ''
      });
      setShowFeedbackModal(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    }
  };

  const openFeedbackModal = (demo) => {
    setSelectedDemo(demo);
    setTraineeFeedback({
      demoId: demo.id,
      rating: 0,
      comment: '',
      experience: ''
    });
    setShowFeedbackModal(true);
  };

  return (
    <DashboardLayout activeMenu="Demo Management">
      <div className="p-3 md:p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Demo Management</h1>
          <p className="text-gray-600">Upload demos, request offline slots, and track your progress</p>
        </div>

        {/* Campus Allocation Banner */}
        {campusAllocation ? (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <LuMapPin className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-900">Campus Allocation Confirmed</h3>
                <p className="text-green-700">
                  <strong>Campus:</strong> {campusAllocation.campusName} | 
                  <strong> Deployment Date:</strong> {moment(campusAllocation.deploymentDate).format('MMM DD, YYYY')} | 
                  <strong> Status:</strong> {campusAllocation.status}
                </p>
                {campusAllocation.notes && (
                  <p className="text-sm text-green-600 mt-1">{campusAllocation.notes}</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <LuMapPin className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-700">You don't have Campus Allocation right now</h3>
                <p className="text-gray-500">Campus allocation details will appear here once confirmed by your Master Trainer.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('online')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 cursor-pointer ${
                  activeTab === 'online'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <LuVideo className="w-4 h-4" />
                <span>Online Demos</span>
              </button>
              <button
                onClick={() => setActiveTab('offline')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 cursor-pointer ${
                  activeTab === 'offline'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <LuCalendar className="w-4 h-4" />
                <span>Offline Slots</span>
              </button>
              <button
                onClick={() => setActiveTab('feedback')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 cursor-pointer ${
                  activeTab === 'feedback'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <LuStar className="w-4 h-4" />
                <span>Feedback & Ratings</span>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Online Demos Tab */}
            {activeTab === 'online' && (
              <div className="space-y-6">
                {/* Upload Section */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <LuUpload className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Upload Online Demo</h2>
                        <p className="text-sm text-gray-500">Share your work with trainers and peers</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowUploadForm(!showUploadForm)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 cursor-pointer"
                    >
                      <LuPlus className="w-4 h-4" />
                      <span>{showUploadForm ? 'Cancel' : 'New Upload'}</span>
                    </button>
                  </div>

                  {showUploadForm && (
                    <div className="space-y-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Demo Title *</label>
                          <input
                            type="text"
                            value={demoUpload.title}
                            onChange={(e) => setDemoUpload(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter demo title"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Course Tag</label>
                          <input
                            type="text"
                            value={demoUpload.courseTag}
                            onChange={(e) => setDemoUpload(prev => ({ ...prev, courseTag: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., React, Node.js, JavaScript"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                        <textarea
                          value={demoUpload.description}
                          onChange={(e) => setDemoUpload(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows="3"
                          placeholder="Describe what your demo covers"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Upload Video File *</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                          <div className="space-y-1 text-center">
                            <LuVideo className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600">
                              <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                <span>Upload MP4 file</span>
                                <input
                                  id="file-upload"
                                  name="file-upload"
                                  type="file"
                                  accept="video/mp4"
                                  onChange={handleFileChange}
                                  className="sr-only"
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">MP4 files only, up to 100MB</p>
                          </div>
                        </div>
                        {demoUpload.file && (
                          <div className="mt-2 text-sm text-gray-600">
                            Selected: {demoUpload.file.name}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => setShowUploadForm(false)}
                          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleUpload}
                          disabled={isUploading}
                          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                            isUploading 
                              ? 'bg-blue-400 text-white cursor-not-allowed' 
                              : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                          }`}
                        >
                          {isUploading && <LuLoader className="w-4 h-4 animate-spin" />}
                          {isUploading ? 'Uploading...' : 'Upload Demo'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* My Online Demos */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <LuVideo className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">My Online Demos</h2>
                        <p className="text-sm text-gray-500">Manage your uploaded demonstrations</p>
                      </div>
                    </div>
                  </div>

                  {uploadedDemos.filter(demo => demo.type === 'online').length === 0 ? (
                    <div className="text-center py-12">
                      <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                        <LuVideo className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No online demos uploaded yet</h3>
                      <p className="text-gray-500 text-sm max-w-md mx-auto">
                        Upload your first demo to showcase your work and get feedback from trainers.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {uploadedDemos.filter(demo => demo.type === 'online').map((demo) => (
                        <div key={demo.id} className={`rounded-lg border p-4 hover:shadow-md transition-all duration-200 ${
                          demo.status === 'review_complete' || demo.status === 'approved' ? 'bg-green-50 border-green-200' :
                          demo.status === 'trainer_rejected' || demo.status === 'master_trainer_rejected' ? 'bg-red-50 border-red-200' :
                          demo.status === 'under_review' ? 'bg-yellow-50 border-yellow-200' :
                          'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className={`p-2 rounded-lg ${
                                demo.status === 'review_complete' || demo.status === 'approved' ? 'bg-green-100' :
                                demo.status === 'trainer_rejected' || demo.status === 'master_trainer_rejected' ? 'bg-red-100' :
                                demo.status === 'under_review' ? 'bg-yellow-100' :
                                'bg-blue-100'
                              }`}>
                                <LuVideo className={`w-4 h-4 ${
                                  demo.status === 'review_complete' || demo.status === 'approved' ? 'text-green-600' :
                                  demo.status === 'trainer_rejected' || demo.status === 'master_trainer_rejected' ? 'text-red-600' :
                                  demo.status === 'under_review' ? 'text-yellow-600' :
                                  'text-blue-600'
                                }`} />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 text-sm">{demo.title}</h3>
                                <p className="text-xs text-gray-500">{demo.courseTag}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                demo.status === 'review_complete' || demo.status === 'approved' ? 'bg-green-100 text-green-800' :
                                demo.status === 'trainer_rejected' ? 'bg-red-100 text-red-800' :
                                demo.status === 'master_trainer_rejected' ? 'bg-red-100 text-red-800' :
                                demo.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {demo.status === 'review_complete' || demo.status === 'approved' ? 'Approved' :
                                 demo.status === 'trainer_rejected' ? 'Rejected by Trainer' :
                                 demo.status === 'master_trainer_rejected' ? 'Rejected by Master Trainer' :
                                 demo.status === 'under_review' ? 'Under Review' :
                                 'Unknown'}
                              </span>
                              {/* Only show delete button if demo is not approved */}
                              {demo.status !== 'approved' && demo.status !== 'review_complete' && (
                                <button
                                  onClick={() => handleDelete(demo.id)}
                                  className="p-1 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                                >
                                  <LuX className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{demo.description}</p>
                          
                          {/* Status-specific information */}
                          {demo.status === 'review_complete' && (
                            <div className="mb-3 p-2 bg-green-100 rounded text-xs">
                              <p className="text-green-800 font-medium">✓ Approved by {demo.masterTrainerReviewedBy}</p>
                              {demo.feedback && (
                                <p className="text-green-700 mt-1">Feedback: {demo.feedback}</p>
                              )}
                            </div>
                          )}
                          
                          {(demo.status === 'trainer_rejected' || demo.status === 'master_trainer_rejected') && (
                            <div className="mb-3 p-2 bg-red-100 rounded text-xs">
                              <p className="text-red-800 font-medium">✗ Rejected by {demo.status === 'trainer_rejected' ? demo.reviewedBy : demo.masterTrainerReviewedBy}</p>
                              {demo.rejectionReason && (
                                <p className="text-red-700 mt-1">Reason: {demo.rejectionReason}</p>
                              )}
                            </div>
                          )}
                          
                          {demo.status === 'under_review' && (
                            <div className="mb-3 p-2 bg-yellow-100 rounded text-xs">
                              <p className="text-yellow-800 font-medium">⏳ Waiting for trainer review</p>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {new Date(demo.uploadedAt).toLocaleDateString()}
                            </span>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => openVideoModal(demo)}
                                className="p-1 text-gray-400 hover:text-green-600 transition-colors cursor-pointer"
                                title="View Video"
                              >
                                <LuPlay className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDownload(demo.id)}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                                title="Download"
                              >
                                <LuDownload className="w-4 h-4" />
                              </button>
                              {demo.rating > 0 && (
                                <div className="flex items-center space-x-1">
                                  <LuStar className="w-3 h-3 text-yellow-400" />
                                  <span className="text-xs text-gray-500">{demo.rating}</span>
                                </div>
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

            {/* Other tabs would go here */}
            {activeTab === 'offline' && (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Offline Demo Slots</h3>
                <p className="text-gray-500">Offline demo slot management coming soon...</p>
              </div>
            )}

            {activeTab === 'feedback' && (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Feedback & Ratings</h3>
                <p className="text-gray-500">Feedback and ratings system coming soon...</p>
              </div>
            )}
          </div>
        </div>

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
                            console.error('Video load error:', e);
                            console.error('Video src:', selectedVideo.fileUrl);
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
                        <span className="font-medium text-gray-600">Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                          selectedVideo.status === 'review_complete' || selectedVideo.status === 'approved' ? 'bg-green-100 text-green-800' :
                          selectedVideo.status === 'trainer_rejected' || selectedVideo.status === 'master_trainer_rejected' ? 'bg-red-100 text-red-800' :
                          selectedVideo.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedVideo.status === 'review_complete' || selectedVideo.status === 'approved' ? 'Approved' :
                           selectedVideo.status === 'trainer_rejected' ? 'Rejected by Trainer' :
                           selectedVideo.status === 'master_trainer_rejected' ? 'Rejected by Master Trainer' :
                           selectedVideo.status === 'under_review' ? 'Under Review' :
                           'Unknown'}
                        </span>
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

                  {/* Feedback Section */}
                  {selectedVideo.feedback && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Trainer Feedback</h4>
                      <p className="text-blue-800">{selectedVideo.feedback}</p>
                      {selectedVideo.rating > 0 && (
                        <div className="mt-2 flex items-center space-x-1">
                          <span className="text-sm font-medium text-blue-700">Rating:</span>
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <LuStar
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= selectedVideo.rating ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-blue-700">({selectedVideo.rating}/5)</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {selectedVideo.rejectionReason && (
                    <div className="bg-red-50 rounded-lg p-4">
                      <h4 className="font-semibold text-red-900 mb-2">Rejection Reason</h4>
                      <p className="text-red-800">{selectedVideo.rejectionReason}</p>
                    </div>
                  )}
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
      </div>
    </DashboardLayout>
  );
};

export default DemoManagement;
