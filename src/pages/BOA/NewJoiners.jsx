import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { LuUserPlus, LuMail, LuPhone, LuBuilding, LuCalendar, LuCheck, LuX, LuRefreshCw, LuUsers } from 'react-icons/lu';
import { toast } from 'react-hot-toast';
import moment from 'moment';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';

const NewJoiners = () => {
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    joiningDate: moment().format('YYYY-MM-DD'),
    employeeId: '',
    genre: ''
  });
  const [recentJoiners, setRecentJoiners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [showCredentialsPopup, setShowCredentialsPopup] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState({
    username: '',
    password: ''
  });
  
  // Determine active menu based on route
  const activeMenu = location.pathname === '/boa/upload-candidate-details' 
    ? 'Upload Candidate Details' 
    : 'New Joiners';

  // Fetch recent joiners from database
  const fetchRecentJoiners = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.USERS.LIST, {
        params: { role: 'trainee' }
      });
      
      const trainees = response.data.users || response.data || [];
      
      // Get today's date for filtering (using start of day to avoid timezone issues)
      const today = moment().startOf('day');
      
      // Filter trainees who joined today
      const todayJoiners = trainees.filter(trainee => {
        const joiningDate = trainee.joiningDate || trainee.createdAt;
        const traineeDate = moment(joiningDate).startOf('day');
        
        return traineeDate.isSame(today, 'day');
      });
      
      // Format the data for display
      const formattedJoiners = todayJoiners.map(trainee => ({
        id: trainee._id,
        name: trainee.name,
        email: trainee.email,
        phone: trainee.phone || '',
        department: trainee.department || '',
        joiningDate: trainee.joiningDate ? moment(trainee.joiningDate).format('YYYY-MM-DD') : '',
        status: 'Login Created',
        createdAt: trainee.createdAt,
        employeeId: trainee.employeeId || '',
        genre: trainee.genre || ''
      }));
      
      setRecentJoiners(formattedJoiners);
    } catch (error) {
      console.error('Error fetching recent joiners:', error);
      // Fallback to empty array if API fails
      setRecentJoiners([]);
    }
  };

  useEffect(() => {
    fetchRecentJoiners();
    
    // Set up auto-refresh every 5 minutes to catch new joiners
    const interval = setInterval(() => {
      fetchRecentJoiners();
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Generate random password
  const generateRandomPassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCheckingUsername(true);
    
    // Check if username (email) already exists
    try {
      const response = await axiosInstance.get(API_PATHS.USERS.LIST, {
        params: { email: formData.email }
      });
      
      const existingUsers = response.data.users || response.data || [];
      
      if (existingUsers.length > 0) {
        toast.error('Username already found! Please use a different email address.');
        setCheckingUsername(false);
        return;
      }
    } catch (error) {
      console.error('Error checking username availability:', error);
      // If the API call fails, we'll let the backend handle the duplicate email error
      // during the actual user creation process
    }
    
    setCheckingUsername(false);
    
    // Generate credentials
    const username = formData.email; // Use email as username
    const password = generateRandomPassword();
    
    // Set generated credentials
    setGeneratedCredentials({
      username: username,
      password: password
    });
    
    // Show popup
    setShowCredentialsPopup(true);
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);

    try {
      // Create trainee account in database
      const traineeData = {
        name: formData.name,
        email: formData.email,
        password: generatedCredentials.password, // Use generated password
        role: 'trainee',
        phone: formData.phone || '',
        department: formData.department,
        employeeId: formData.employeeId || '',
        genre: formData.genre || '',
        joiningDate: formData.joiningDate,
        // Add any additional fields needed for trainee
        isActive: true,
        lastClockIn: null,
        lastClockOut: null
      };

      const response = await axiosInstance.post(API_PATHS.USERS.CREATE_USER, traineeData);

      // Add to recent joiners for display
      const newJoiner = {
        id: response.data.user?._id || Date.now(),
        name: response.data.user?.name || formData.name,
        email: response.data.user?.email || formData.email,
        phone: response.data.user?.phone || formData.phone,
        department: response.data.user?.department || formData.department,
        joiningDate: response.data.user?.joiningDate ? moment(response.data.user.joiningDate).format('YYYY-MM-DD') : formData.joiningDate,
        status: 'Login Created',
        createdAt: response.data.user?.createdAt || new Date().toISOString(),
        username: generatedCredentials.username,
        password: generatedCredentials.password,
        employeeId: response.data.user?.employeeId || formData.employeeId,
        genre: response.data.user?.genre || formData.genre
      };
      
      setRecentJoiners(prev => [newJoiner, ...prev]);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        department: '',
        joiningDate: moment().format('YYYY-MM-DD'),
        employeeId: '',
        genre: ''
      });
      
      // Close popup
      setShowCredentialsPopup(false);
      
      // Refresh the recent joiners list
      await fetchRecentJoiners();
      
      toast.success('New joiner recorded successfully! Trainee account created with generated credentials.');
    } catch (error) {
      console.error('Error creating trainee account:', error);
      console.error('Error details:', error.response?.data);
      
      let errorMessage = 'Failed to create trainee account. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        
        // Check for specific duplicate email error
        if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
          errorMessage = 'Username already found! Please use a different email address.';
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendCredentials = async (joinerId) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Credentials resent successfully!');
    } catch (error) {
      toast.error('Failed to resend credentials. Please try again.');
    }
  };

  const handleCopyCredentials = () => {
    const credentialsText = `Username: ${generatedCredentials.username}\nPassword: ${generatedCredentials.password}`;
    navigator.clipboard.writeText(credentialsText).then(() => {
      toast.success('Copied!');
    }).catch(() => {
      toast.error('Failed to copy credentials');
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Login Created':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout activeMenu={activeMenu}>
      <div className="mt-5 mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Record New Joiners</h2>

        {/* Add New Joiner Form */}
        <div className="card mb-8">
          <div className="flex items-center space-x-2 mb-6">
            <LuUserPlus className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Add New Joiner</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <LuUserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter full name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <LuMail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <LuPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employee ID
                </label>
                <div className="relative">
                  <LuUserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter employee ID"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GENRE
                </label>
                <div className="relative">
                  <LuUserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    name="genre"
                    value={formData.genre}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Genre</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department/Batch *
                </label>
                <div className="relative">
                  <LuBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Department</option>
                    <option value="IT">IT</option>
                    <option value="SDM">SDM</option>
                    <option value="SDI">SDI</option>
                    <option value="OTHERS">OTHERS</option>
                  </select>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Joining *
                </label>
                <div className="relative">
                  <LuCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    name="joiningDate"
                    value={formData.joiningDate}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setFormData({
                  name: '',
                  email: '',
                  phone: '',
                  department: '',
                  joiningDate: moment().format('YYYY-MM-DD'),
                  employeeId: '',
                  genre: ''
                })}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={submitting || checkingUsername}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {checkingUsername ? (
                  <>
                    <LuRefreshCw className="w-4 h-4 animate-spin" />
                    <span>Checking Username...</span>
                  </>
                ) : submitting ? (
                  <>
                    <LuRefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creating Login...</span>
                  </>
                ) : (
                  <>
                    <LuCheck className="w-4 h-4" />
                    <span>Generate Login</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Credentials Popup */}
        {showCredentialsPopup && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md mx-4">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Login Credentials Generated</h3>
                <button
                  onClick={() => setShowCredentialsPopup(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <LuX className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LuCheck className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    You have successfully generated login details for this user.
                  </h4>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={generatedCredentials.username}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedCredentials.username);
                          toast.success('Copied!');
                        }}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={generatedCredentials.password}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-mono"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedCredentials.password);
                          toast.success('Copied!');
                        }}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowCredentialsPopup(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFinalSubmit}
                    disabled={submitting}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {submitting ? (
                      <>
                        <LuRefreshCw className="w-4 h-4 animate-spin" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <LuCheck className="w-4 h-4" />
                        <span>Submit</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent New Joiners Table */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Today's New Joiners</h3>
              <p className="text-sm text-gray-500">
                {moment().format('MMMM DD, YYYY')}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span className="text-2xl font-bold text-blue-600">
                  {recentJoiners.length}
                </span>
                <p className="text-sm text-gray-500">
                  {recentJoiners.length === 1 ? 'joiner today' : 'joiners today'}
                </p>
              </div>
              <button
                onClick={fetchRecentJoiners}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Refresh today's joiners"
              >
                <LuRefreshCw className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">Refresh</span>
              </button>
            </div>
          </div>

          {recentJoiners.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LuUsers className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No joiners today</h4>
              <p className="text-gray-500 mb-4">
                No new trainees have joined today ({moment().format('MMMM DD, YYYY')})
              </p>
              <button
                onClick={fetchRecentJoiners}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
              >
                <LuRefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Department</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Joining Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentJoiners.map((joiner) => (
                    <tr key={joiner.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-xs">
                              {joiner.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">{joiner.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{joiner.email}</td>
                      <td className="py-3 px-4 text-gray-600">{joiner.department}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {moment(joiner.joiningDate).format('MMM DD, YYYY')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(joiner.status)}`}>
                          {joiner.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleResendCredentials(joiner.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
                        >
                          <LuRefreshCw className="w-3 h-3" />
                          <span>Resend</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NewJoiners;
