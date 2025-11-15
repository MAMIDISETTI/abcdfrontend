import React, { useState, useContext, useEffect } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { 
  LuUser, 
  LuMail, 
  LuPhone, 
  LuBuilding, 
  LuCalendar, 
  LuGraduationCap,
  LuSave,
  LuPencil,
  LuLock,
  LuEye,
  LuEyeOff,
  LuMapPin,
  LuBookOpen
} from 'react-icons/lu';
import { UserContext } from '../../context/userContext';
import moment from 'moment';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';

const ProfileSettings = () => {
  const { user, updateUser } = useContext(UserContext);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || user?.phone_number || '',
    phone_number: user?.phone_number || user?.phone || '',
    department: user?.department || '',
    employeeId: user?.employeeId || '',
    genre: user?.genre || '',
    joiningDate: user?.joiningDate || user?.date_of_joining || '',
    qualification: user?.qualification || '',
    specialization: user?.specialization || '',
    state: user?.state || '',
    haveMTechPC: user?.haveMTechPC || '',
    haveMTechOD: user?.haveMTechOD || '',
    yearOfPassout: user?.yearOfPassout || '',
    role: user?.role || '',
    status: user?.status || ''
  });

  // Fetch full profile data when component loads
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setFetchingProfile(true);
        const response = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE);
        
        if (response.data) {
          const profile = response.data;
          
          // Check if employeeId is in joinerData
          const employeeIdFromJoiner = profile.joinerData?.employeeId || profile.joinerData?.employee_id;
          const finalEmployeeId = profile.employeeId || employeeIdFromJoiner || '';
          
          setProfileData({
            name: profile.name || '',
            email: profile.email || '',
            phone: profile.phone || profile.phone_number || '',
            phone_number: profile.phone_number || profile.phone || '',
            department: profile.department || '',
            employeeId: finalEmployeeId,
            genre: profile.genre || '',
            joiningDate: profile.joiningDate || profile.date_of_joining || '',
            qualification: profile.qualification || '',
            specialization: profile.specialization || '',
            state: profile.state || '',
            haveMTechPC: profile.haveMTechPC || '',
            haveMTechOD: profile.haveMTechOD || '',
            yearOfPassout: profile.yearOfPassout || '',
            role: profile.role || '',
            status: profile.status || ''
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setFetchingProfile(false);
      }
    };

    fetchProfile();
  }, []);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      
      const response = await axiosInstance.put('/api/auth/profile', profileData);
      
      if (response.data.success) {
        updateUser(response.data.user);
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      } else {
        toast.error(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      
      const response = await axiosInstance.put(API_PATHS.AUTH.CHANGE_PASSWORD, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response.data.success) {
        toast.success('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    // Re-fetch profile data to reset to original values
    try {
      const response = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE);
      if (response.data) {
        const profile = response.data;
        setProfileData({
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phone || profile.phone_number || '',
          phone_number: profile.phone_number || profile.phone || '',
          department: profile.department || '',
          employeeId: profile.employeeId || '',
          genre: profile.genre || '',
          joiningDate: profile.joiningDate || profile.date_of_joining || '',
          qualification: profile.qualification || '',
          specialization: profile.specialization || '',
          state: profile.state || '',
          haveMTechPC: profile.haveMTechPC || '',
          haveMTechOD: profile.haveMTechOD || '',
          yearOfPassout: profile.yearOfPassout || '',
          role: profile.role || '',
          status: profile.status || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
    setIsEditing(false);
  };

  return (
    <DashboardLayout activeMenu="Profile & Settings">
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-bold text-gray-900">Profile & Settings</h1>
            <p className="text-gray-600 mt-2">Manage your personal information and account settings</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Information */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <LuPencil className="w-4 h-4" />
                      <span>Edit Profile</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={loading}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <LuSave className="w-4 h-4" />
                        <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {fetchingProfile ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-gray-500">Loading profile data...</div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-6">
                      {/* Profile Picture */}
                      <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-2xl">
                            {profileData.name?.split(' ').map(n => n[0]).join('') || 'U'}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{profileData.name || 'User'}</h3>
                          <p className="text-gray-600">{profileData.role?.charAt(0).toUpperCase() + profileData.role?.slice(1) || 'Trainee'}</p>
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={profileData.name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder={isEditing ? "Enter full name" : ""}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={profileData.email}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder={isEditing ? "Enter email address" : ""}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder={isEditing ? "Enter phone number" : ""}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Department
                      </label>
                      <input
                        type="text"
                        name="department"
                        value={profileData.department}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder={isEditing ? "Enter department" : ""}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Employee ID
                      </label>
                      <input
                        type="text"
                        name="employeeId"
                        value={profileData.employeeId}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder={isEditing ? "Enter employee ID" : ""}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Qualification
                      </label>
                      <input
                        type="text"
                        name="qualification"
                        value={profileData.qualification}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder={isEditing ? "Enter qualification" : ""}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specialization
                      </label>
                      <input
                        type="text"
                        name="specialization"
                        value={profileData.specialization}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder={isEditing ? "Enter specialization" : ""}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={profileData.state}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder={isEditing ? "Enter state" : ""}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Year of Passout
                      </label>
                      <input
                        type="text"
                        name="yearOfPassout"
                        value={profileData.yearOfPassout}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder={isEditing ? "Enter year of passout" : ""}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Have M.Tech (PC)
                      </label>
                      <input
                        type="text"
                        name="haveMTechPC"
                        value={profileData.haveMTechPC}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder={isEditing ? "Yes/No" : ""}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Have M.Tech (OD)
                      </label>
                      <input
                        type="text"
                        name="haveMTechOD"
                        value={profileData.haveMTechOD}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder={isEditing ? "Yes/No" : ""}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Joining Date
                      </label>
                      <input
                        type="date"
                        name="joiningDate"
                        value={profileData.joiningDate ? moment(profileData.joiningDate).format('YYYY-MM-DD') : ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <div className="px-3 py-2 bg-gray-100 rounded-lg">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          profileData.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {profileData.status?.charAt(0).toUpperCase() + profileData.status?.slice(1) || 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                </>
                )}
              </div>
            </div>

            {/* Password Change */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Change Password</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <button
                    onClick={handleChangePassword}
                    disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <LuLock className="w-4 h-4" />
                    <span>{loading ? 'Changing...' : 'Change Password'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfileSettings;
