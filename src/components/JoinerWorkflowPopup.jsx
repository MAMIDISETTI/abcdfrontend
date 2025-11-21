import React, { useState, useEffect, useContext } from 'react';
import { LuX, LuUser, LuMail, LuPhone, LuBuilding, LuCalendar, LuGraduationCap, LuCheck, LuArrowRight, LuInfo, LuUserPlus } from 'react-icons/lu';
import moment from 'moment';
import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';
import { toast } from 'react-hot-toast';
import { UserContext } from '../context/userContext';

const JoinerWorkflowPopup = ({ isOpen, onClose, joiner, joiners = [], onSuccess }) => {
  const { user: currentUser } = useContext(UserContext);
  const [currentStep, setCurrentStep] = useState(1); // 1: Details, 2: Assign, 3: Credentials, 4: Complete
  const [loading, setLoading] = useState(false);
  const [trainers, setTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [trainerTrainees, setTrainerTrainees] = useState([]);
  const [existingUser, setExistingUser] = useState(null);
  const [isAlreadyAssigned, setIsAlreadyAssigned] = useState(false);
  const [selectedTrainees, setSelectedTrainees] = useState([]);
  const [isBulkMode, setIsBulkMode] = useState(false);

  // Helpers to ensure unique lists/keys
  const getTraineeId = (t) => t?.author_id || t?._id || t?.email || t?.candidate_personal_mail_id || '';
  const dedupeById = (list) => {
    const map = new Map();
    (list || []).forEach((t) => {
      const k = getTraineeId(t) || JSON.stringify(t);
      if (!map.has(k)) map.set(k, t);
    });
    return Array.from(map.values());
  };

  // Check if joiner already has user account and assigned trainer
  useEffect(() => {
    if (isOpen && joiner) {
      checkExistingUser();
    }
  }, [isOpen, joiner]);

  // Detect bulk mode
  useEffect(() => {
    if (isOpen && joiners.length > 0) {
      setIsBulkMode(true);
      setSelectedTrainees(dedupeById(joiners));
      // Fetch trainers for bulk mode
      fetchTrainers();
      // Start at step 2 for bulk mode
      setCurrentStep(2);
    } else if (isOpen && joiner) {
      setIsBulkMode(false);
      setSelectedTrainees(dedupeById([joiner]));
      // Fetch trainers for single mode
      fetchTrainers();
      // Start at step 1 for single mode
      setCurrentStep(1);
    }
  }, [isOpen, joiner, joiners]);

  // Prevent workflow if trainee is already assigned
  useEffect(() => {
    if (isAlreadyAssigned && existingUser) {
      toast.error('This trainee is already assigned to a trainer. Reassignment is not allowed.');
      // Close the popup after showing the error
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  }, [isAlreadyAssigned, existingUser, onClose]);

  // Fetch trainers when component mounts or step changes to 2
  useEffect(() => {
    if (isOpen && currentStep === 2) {
      fetchTrainers();
    }
  }, [isOpen, currentStep]);

  const checkExistingUser = async () => {
    try {
      setLoading(true);
      
      // Try multiple email fields to find existing user
      const emailToCheck = joiner.candidate_personal_mail_id || joiner.email;
      
      // Check if user exists by email
      const response = await axiosInstance.get(`${API_PATHS.USERS.LIST}?email=${emailToCheck}`);
      const users = response.data.users || [];

      if (users.length > 0) {
        const user = users[0];
        setExistingUser(user);
        
        // Check if user already has an assigned trainer
        if (user.assignedTrainer) {
          setIsAlreadyAssigned(true);
          // Fetch trainer details
          const trainerResponse = await axiosInstance.get(`${API_PATHS.USERS.LIST}?_id=${user.assignedTrainer}`);
          const trainers = trainerResponse.data.users || [];
          if (trainers.length > 0) {
            setSelectedTrainer(trainers[0]);
          }
        } else {
        }
      } else {
      }
    } catch (error) {
      console.error('Error checking existing user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`${API_PATHS.USERS.LIST}?role=trainer`);
      setTrainers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching trainers:', error);
      toast.error('Failed to fetch trainers');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainerTrainees = async (trainerId) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`${API_PATHS.ASSIGNMENTS.GET_ALL}?trainerId=${trainerId}`);
      setTrainerTrainees(response.data.assignments || []);
    } catch (error) {
      console.error('Error fetching trainer trainees:', error);
      toast.error('Failed to fetch trainer trainees');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = (newStatus) => {
    // Just update the local state, don't save to database yet
    setCurrentStep(2);
    toast.success('Status will be updated when workflow is completed');
  };

  const handleTrainerSelect = (trainer) => {
    setSelectedTrainer(trainer);
    fetchTrainerTrainees(trainer.author_id);
  };

  const handleAssignTrainees = () => {
    if (isAlreadyAssigned) {
      toast.error('This trainee is already assigned to a trainer. Reassignment is not allowed.');
      return;
    }
    setCurrentStep(3);
  };

  const handleBulkTraineeSelect = (trainee) => {
    setSelectedTrainees(prev => {
      if (prev.some(t => t.author_id === trainee.author_id)) {
        return prev.filter(t => t.author_id !== trainee.author_id);
      } else {
        return [...prev, trainee];
      }
    });
  };

  const handleSelectAllTrainees = () => {
    if (selectedTrainees.length === joiners.length) {
      setSelectedTrainees([]);
    } else {
      setSelectedTrainees(dedupeById([...joiners]));
    }
  };

  const handleGenerateCredentials = async () => {
    try {
      setLoading(true);
      
      // Check if trainee is already assigned
      if (isAlreadyAssigned) {
        toast.error('This trainee is already assigned to a trainer. Cannot create duplicate account.');
        return;
      }
      
      // Check if current user is available
      if (!currentUser) {
        toast.error('User session expired. Please login again.');
        return;
      }
      
      if (isBulkMode) {
        // Handle bulk account creation
        const createPromises = selectedTrainees.map(async (trainee) => {
          if (!trainee) return null;
          
          // Generate random password
          const password = Math.random().toString(36).slice(-8);
          
          // Validate required fields
          const email = trainee.candidate_personal_mail_id || trainee.email;
          const name = trainee.candidate_name || trainee.name;
          
          if (!email || !name) {
            console.error('Missing required fields for trainee:', { email, name, trainee });
            toast.error(`Missing required fields for trainee: ${name || 'Unknown'}`);
            return null;
          }
          
          // Prepare user data
          const userData = {
            name: name,
            email: email,
            phone: trainee.phone_number || trainee.phone,
            department: trainee.top_department_name_as_per_darwinbox || trainee.department,
            role: 'trainee',
            employeeId: trainee.employee_id && trainee.employee_id !== 'null' ? trainee.employee_id : `EMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            genre: trainee.genre,
            joiningDate: trainee.date_of_joining ? new Date(trainee.date_of_joining).toISOString() : trainee.joiningDate ? new Date(trainee.joiningDate).toISOString() : new Date().toISOString(),
            password: password,
            
            // Fields from joiners table
            date_of_joining: trainee.date_of_joining ? new Date(trainee.date_of_joining).toISOString() : trainee.joiningDate ? new Date(trainee.joiningDate).toISOString() : new Date().toISOString(),
            candidate_name: trainee.candidate_name || trainee.name,
            phone_number: trainee.phone_number || trainee.phone,
            candidate_personal_mail_id: trainee.candidate_personal_mail_id || trainee.email,
            top_department_name_as_per_darwinbox: trainee.top_department_name_as_per_darwinbox || trainee.department,
            department_name_as_per_darwinbox: trainee.department_name_as_per_darwinbox || trainee.department,
            joining_status: trainee.joining_status || trainee.status,     
            role_type: trainee.role_type,
            role_assign: trainee.role_assign,
            qualification: trainee.qualification,
            status: 'active',
            accountCreated: true,
            accountCreatedAt: new Date().toISOString(),
            createdBy: currentUser?.author_id || null,
            // Use the same author_id from joiner
            author_id: trainee.author_id || null,
            
            // Password management
            tempPassword: password,
            passwordChanged: false,
            
            // Array fields
            onboardingChecklist: [{
              welcomeEmailSent: false,
              credentialsGenerated: true,
              accountActivated: true,
              trainingAssigned: false,
              documentsSubmitted: false
            }],
            company_allocated_details: trainee.company_allocated_details || [],
            dayPlanTasks: trainee.dayPlanTasks || [],
            fortnightExams: trainee.fortnightExams || [],
            dailyQuizzes: trainee.dailyQuizzes || [],
            courseLevelExams: trainee.courseLevelExams || []
          };
          
          // Create user account
          const userResponse = await axiosInstance.post(API_PATHS.USERS.CREATE_USER, userData);
          
          // Update joiner record
          await axiosInstance.put(API_PATHS.JOINERS.UPDATE(trainee._id), {
            status: 'active',
            accountCreated: true,
            accountCreatedAt: new Date().toISOString(),
            userId: userResponse.data.user._id
          });
          
          return { trainee, user: userResponse.data.user };
        });
        
        // Wait for all accounts to be created
        const results = await Promise.all(createPromises);
        const successfulResults = results.filter(result => result !== null);
        
        // Create assignment if trainer is selected
        if (selectedTrainer && successfulResults.length > 0) {
          try {
            const traineeIds = successfulResults.map(result => result.user.author_id);
            
            const assignmentData = {
              trainerId: selectedTrainer.author_id,
              traineeIds: traineeIds,
              effectiveDate: new Date().toISOString(),
              notes: `Bulk assignment created via Joiner Workflow`,
              instructions: `Please provide training and support to the assigned trainees.`
            };
            
            const assignmentResponse = await axiosInstance.post(API_PATHS.ASSIGNMENTS.CREATE, assignmentData);
            toast.success(`Assignment created for ${successfulResults.length} trainees!`);
          } catch (error) {
            console.error('Error creating assignment:', error);
            toast.error('Accounts created but assignment failed. Please assign manually.');
          }
        }
        
        setCurrentStep(4);
        toast.success(`${successfulResults.length} accounts created successfully!`);
        
        // Notify parent component to refresh data
        if (onSuccess) {
          onSuccess();
        }
      } else {
        // Handle single account creation
        if (!joiner) {
          toast.error('No joiner data available');
          return;
        }
        
        // Generate random password
        const password = Math.random().toString(36).slice(-8);
        
        // Validate required fields
        const email = joiner.candidate_personal_mail_id || joiner.email;
        const name = joiner.candidate_name || joiner.name;
        
        if (!email || !name) {
          console.error('Missing required fields for joiner:', { email, name, joiner });
          toast.error(`Missing required fields for joiner: ${name || 'Unknown'}`);
          return;
        }
        
        // Prepare user data with all required fields from joiners table
        const userData = {
          // Basic user fields
          name: name,
          email: email,
          phone: joiner.phone_number || joiner.phone,
          department: joiner.top_department_name_as_per_darwinbox || joiner.department,
          role: 'trainee',
          employeeId: joiner.employee_id && joiner.employee_id !== 'null' ? joiner.employee_id : `EMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          genre: joiner.genre,
          joiningDate: joiner.date_of_joining ? new Date(joiner.date_of_joining).toISOString() : joiner.joiningDate ? new Date(joiner.joiningDate).toISOString() : new Date().toISOString(),
          password: password,
          
          // Fields from joiners table - compulsory fields
          date_of_joining: joiner.date_of_joining ? new Date(joiner.date_of_joining).toISOString() : joiner.joiningDate ? new Date(joiner.joiningDate).toISOString() : new Date().toISOString(),
          candidate_name: joiner.candidate_name || joiner.name,
          phone_number: joiner.phone_number || joiner.phone,
          candidate_personal_mail_id: joiner.candidate_personal_mail_id || joiner.email,
          top_department_name_as_per_darwinbox: joiner.top_department_name_as_per_darwinbox || joiner.department,
          department_name_as_per_darwinbox: joiner.department_name_as_per_darwinbox || joiner.department,
          joining_status: joiner.joining_status || joiner.status,
          // Use the same author_id from joiner
          author_id: joiner.author_id || null,
          role_type: joiner.role_type,
          role_assign: joiner.role_assign,
          qualification: joiner.qualification,
          status: 'active', // Set to active when account is created
          accountCreated: true,
          accountCreatedAt: new Date().toISOString(),
          createdBy: currentUser?.author_id || null, // Current BOA user who is creating the account
          
          // Password management
          tempPassword: password, // Store the temporary password
          passwordChanged: false, // User hasn't changed password yet
          
          // Array fields - initialize with default values
          onboardingChecklist: joiner.onboardingChecklist || [{
            welcomeEmailSent: false,
            credentialsGenerated: true, // Set to true since we're generating credentials
            accountActivated: true, // Set to true since we're activating the account
            trainingAssigned: false,
            documentsSubmitted: false
          }],
          company_allocated_details: joiner.company_allocated_details || [],
          dayPlanTasks: joiner.dayPlanTasks || [],
          fortnightExams: joiner.fortnightExams || [],
          dailyQuizzes: joiner.dailyQuizzes || [],
          courseLevelExams: joiner.courseLevelExams || []
        };

        // Create user account
        const userResponse = await axiosInstance.post(API_PATHS.USERS.CREATE_USER, userData);

        // Update joiner record with status change and account creation
        await axiosInstance.put(API_PATHS.JOINERS.UPDATE(joiner._id), {
          status: 'active', // Update status to active when account is created
          accountCreated: true,
          accountCreatedAt: new Date().toISOString(),
          userId: userResponse.data.user._id
        });

        // Create assignment if trainer is selected
        if (selectedTrainer) {
          try {
            
            const assignmentData = {
              trainerId: selectedTrainer.author_id,
              traineeIds: [userResponse.data.user.author_id],
              effectiveDate: new Date().toISOString(),
              notes: `Assignment created via Joiner Workflow`,
              instructions: `Please provide training and support to the assigned trainee.`
            };
            
            const assignmentResponse = await axiosInstance.post(API_PATHS.ASSIGNMENTS.CREATE, assignmentData);
            toast.success('Assignment created successfully!');
          } catch (error) {
            console.error('Error creating assignment:', error);
            toast.error('Account created but assignment failed. Please assign manually.');
          }
        }

        setCurrentStep(4);
        toast.success('Account created successfully!');
        
        // Notify parent component to refresh data
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Error creating account:', error);
      toast.error('Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onSuccess();
    onClose();
  };

  if (!isOpen || (!joiner && !joiners.length)) return null;

  // If trainee is already assigned, show a warning and close
  if (isAlreadyAssigned && existingUser) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-[60]" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            Trainee Already Assigned
          </h3>
          <p className="text-gray-600 text-center mb-4">
            This trainee is already assigned to a trainer and cannot be reassigned.
          </p>
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[60]" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {currentStep === 1 && 'Joiner Details & Status Update'}
              {currentStep === 2 && 'Assign Trainees Data'}
              {currentStep === 3 && 'Credentials Generation'}
              {currentStep === 4 && 'Account Created Successfully'}
            </h2>
            <p className="text-sm text-gray-600">
              {currentStep === 1 && 'Update joiner status and proceed'}
              {currentStep === 2 && 'Review trainee assignment details'}
              {currentStep === 3 && 'Generate login credentials'}
              {currentStep === 4 && 'Account has been created successfully'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <LuX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Joiner Details & Status Update */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Joiner Details */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {isBulkMode ? `Selected Joiners (${selectedTrainees.length})` : 'Joiner Details'}
                </h3>
                
                {isBulkMode ? (
                  <div className="space-y-3">
                    {selectedTrainees.map((trainee, idx) => (
                      <div key={`${getTraineeId(trainee)}-${idx}`} className="p-4 bg-white rounded-lg border">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center space-x-3">
                            <LuUser className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-500">Name</p>
                              <p className="font-medium">{trainee.name || trainee.candidate_name}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <LuMail className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-500">Email</p>
                              <p className="font-medium">{trainee.email || trainee.candidate_personal_mail_id}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <LuPhone className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-500">Phone</p>
                              <p className="font-medium">{trainee.phone || trainee.phone_number || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <LuBuilding className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-500">Department</p>
                              <p className="font-medium">{trainee.department || trainee.top_department_name_as_per_darwinbox || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : joiner ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <LuUser className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-medium">{joiner.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <LuMail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{joiner.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <LuPhone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{joiner.phone || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <LuBuilding className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Department</p>
                        <p className="font-medium">{joiner.department || 'N/A'}</p>
                      </div>
                    </div>
                    {joiner.qualification && (
                      <div className="flex items-center space-x-3">
                        <LuGraduationCap className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Qualification</p>
                          <p className="font-medium">{joiner.qualification}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center space-x-3">
                      <LuCalendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Date of Joining</p>
                        <p className="font-medium">{moment(joiner.joiningDate).format('MMM D, YYYY')}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <LuUser className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No joiner details available</p>
                  </div>
                )}
              </div>

              {/* Status Update - Only show for single joiner mode */}
              {joiner && (
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {isBulkMode ? 'Bulk Status Update' : 'Update Status'}
                  </h3>
                  <p className="text-gray-700 mb-4">
                    {isBulkMode 
                      ? `Update status for ${selectedTrainees.length} selected joiners.`
                      : 'Update the status of this joiner.'
                    }
                  </p>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleStatusUpdate('pending')}
                      disabled={loading}
                      className="flex items-center space-x-2 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                    >
                      <LuCheck className="w-4 h-4" />
                      <span>Keep Pending</span>
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('active')}
                      disabled={loading}
                      className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <LuCheck className="w-4 h-4" />
                      <span>Set as Active</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Assign Trainees Data */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Warning if already assigned */}
              {isAlreadyAssigned && existingUser && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Trainee Already Assigned
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          This trainee is already assigned to <strong>{selectedTrainer?.name}</strong> ({selectedTrainer?.email}).
                          Reassignment is not allowed once a trainer has been assigned.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {isBulkMode ? 'Select Trainees for Assignment' : (isAlreadyAssigned ? 'Current Assignment Details' : 'Select Trainer for Assignment')}
                </h3>
                <p className="text-gray-700 mb-4">
                  {isBulkMode 
                    ? `Select which trainees to assign to the selected trainer. You can choose from ${joiners.length} available trainees.`
                    : isAlreadyAssigned 
                    ? 'This trainee is already assigned to a trainer. Assignment details are shown below.'
                    : 'Choose a trainer to assign this new trainee to. You can see their current workload below.'
                  }
                </p>

                {/* Bulk Trainee Selection */}
                {isBulkMode && selectedTrainer && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedTrainees.length === joiners.length}
                          onChange={handleSelectAllTrainees}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Select All ({selectedTrainees.length}/{joiners.length})
                        </span>
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {dedupeById(joiners).map((trainee, idx) => (
                        <div
                          key={`${getTraineeId(trainee)}-${idx}`}
                          className={`flex items-center justify-between p-3 rounded-lg border-2 transition-colors ${
                            selectedTrainees.some(t => t.author_id === trainee.author_id)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedTrainees.some(t => t.author_id === trainee.author_id)}
                              onChange={() => handleBulkTraineeSelect(trainee)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <LuUser className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{trainee.name || trainee.candidate_name}</h4>
                              <p className="text-sm text-gray-500">{trainee.email || trainee.candidate_personal_mail_id}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                              {trainee.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Trainers List - Show for both single and bulk mode */}
                {!isBulkMode || (isBulkMode && !selectedTrainer) ? (
                  <div className="space-y-3">
                    {loading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                        <p className="text-gray-500 mt-2">Loading trainers...</p>
                      </div>
                    ) : trainers.length > 0 ? (
                      trainers.map((trainer, idx) => (
                        <div
                          key={`${trainer.author_id || trainer._id || trainer.email}-${idx}`}
                          onClick={() => !isAlreadyAssigned && handleTrainerSelect(trainer)}
                          className={`p-4 rounded-lg border-2 transition-colors ${
                            isAlreadyAssigned 
                              ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                              : selectedTrainer?.author_id === trainer.author_id
                              ? 'border-green-500 bg-green-100 cursor-pointer'
                              : 'border-gray-200 bg-white hover:border-green-300 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <LuUser className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{trainer.name}</h4>
                                <p className="text-sm text-gray-500">{trainer.email}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              {isAlreadyAssigned ? (
                                <span className="text-sm text-gray-500">
                                  {selectedTrainer?.author_id === trainer.author_id ? 'Currently Assigned' : 'Not Available'}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-600">Click to select</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500">No trainers available</p>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Selected Trainer Details */}
              {selectedTrainer && (
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Trainer Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-3">
                      <LuUser className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-medium">{selectedTrainer.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <LuMail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{selectedTrainer.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Previous Trainees Count */}
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Current Workload:</strong> This trainer has {(() => {
                        const seenTrainees = new Set();
                        trainerTrainees.forEach(assignment => {
                          if (assignment.trainees && assignment.trainees.length > 0) {
                            assignment.trainees.forEach(trainee => {
                              if (trainee.author_id) {
                                seenTrainees.add(trainee.author_id);
                              }
                            });
                          }
                        });
                        return seenTrainees.size;
                      })()} previous trainees.
                    </p>
                    
                    {/* Trainees List */}
                    {trainerTrainees.length > 0 && (() => {
                      // Collect all unique trainees from all assignments
                      const allTrainees = [];
                      const seenTrainees = new Set();
                      
                      trainerTrainees.forEach(assignment => {
                        if (assignment.trainees && assignment.trainees.length > 0) {
                          assignment.trainees.forEach(trainee => {
                            if (trainee.author_id && !seenTrainees.has(trainee.author_id)) {
                              seenTrainees.add(trainee.author_id);
                              allTrainees.push({
                                ...trainee,
                                assignmentStatus: assignment.status
                              });
                            }
                          });
                        }
                      });
                      
                      return (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">Current Trainees:</p>
                          <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin">
                            {allTrainees.length > 0 ? (
                              allTrainees.map((trainee, index) => (
                                <div key={`${trainee.author_id}-${index}`} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <span className="text-sm text-gray-700">
                                    {trainee.name || 'Unknown Trainee'}
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    trainee.assignmentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                                    trainee.assignmentStatus === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {trainee.assignmentStatus}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="text-sm text-gray-700">
                                  No trainees assigned
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Step 3: Credentials Generation */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Login Credentials</h3>
                <p className="text-gray-700 mb-4">
                  {isBulkMode 
                    ? `The following credentials will be generated for ${selectedTrainees.length} selected trainees:`
                    : 'The following credentials will be generated for the new trainee account:'
                  }
                </p>
                
                {isBulkMode ? (
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <h4 className="font-medium text-gray-900 mb-3">Selected Trainees ({selectedTrainees.length})</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {selectedTrainees.map((trainee, index) => {
                          return (
                            <div key={trainee.author_id || trainee._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{trainee?.candidate_name || trainee?.name || 'Unknown'}</p>
                                  <p className="text-sm text-gray-500">{trainee?.candidate_personal_mail_id || trainee?.email || 'No email'}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : joiner ? (
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={joiner?.email || joiner?.candidate_personal_mail_id || ''}
                            readOnly
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(joiner?.email || joiner?.candidate_personal_mail_id || '');
                              toast.success('Email copied to clipboard');
                            }}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value="••••••••"
                            readOnly
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText('Generated password will be shown after creation');
                              toast.success('Password will be generated and shown after account creation');
                            }}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <LuUser className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No joiner details available</p>
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-4">Important Notes</h3>
                <ul className="space-y-2 text-yellow-700">
                  <li className="flex items-start space-x-2">
                    <LuInfo className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>These credentials will be sent to the trainees via email</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <LuInfo className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>The trainees must change their password on first login</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <LuInfo className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>Accounts will be activated immediately after creation</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 4: Account Created Successfully */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="bg-green-50 rounded-lg p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LuCheck className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Created Successfully!</h3>
                <p className="text-gray-700 mb-4">
                  The trainee account has been created and the joiner status has been updated to active.
                </p>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <p className="text-sm text-gray-600">
                    <strong>Next Steps:</strong> The trainee can now log in using their credentials and access the training platform.
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleComplete}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Complete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Action Buttons */}
        {currentStep === 1 && (
          <div className="border-t border-gray-200 bg-gray-50 p-6">
            <div className="flex justify-end">
              <button
                onClick={() => setCurrentStep(2)}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>Proceed to Assignment</span>
                <LuArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="border-t border-gray-200 bg-gray-50 p-6">
            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Status
              </button>
              <button
                onClick={handleAssignTrainees}
                disabled={!selectedTrainer || isAlreadyAssigned}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{isAlreadyAssigned ? 'Already Assigned' : 'Proceed to Credentials'}</span>
                {!isAlreadyAssigned && <LuArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="border-t border-gray-200 bg-gray-50 p-6">
            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Assignment
              </button>
              <button
                onClick={handleGenerateCredentials}
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <LuUserPlus className="w-4 h-4" />
                <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinerWorkflowPopup;
