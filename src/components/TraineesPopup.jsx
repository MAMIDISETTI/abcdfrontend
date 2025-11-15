import React, { useState, useEffect, useMemo } from 'react';
import { LuX, LuSearch, LuClock, LuUser, LuMail, LuIdCard, LuUserCheck, LuLoader } from 'react-icons/lu';
import moment from 'moment';

const TraineesPopup = ({ isOpen, onClose, trainees = [], title = "Total Trainees", showAssignmentStatus = true, isLoading = false }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter trainees based on search term - use useMemo to prevent infinite loops
  const filteredTrainees = useMemo(() => {
    if (!searchTerm.trim()) {
      return trainees;
    }
    return trainees.filter(trainee => 
      trainee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainee.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, trainees]);

  // Reset search when popup opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
        onClick={onClose}
      />
      
      {/* Popup */}
      <div className="relative w-1/4 h-full bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <LuX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="relative">
            <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Trainees List */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <LuLoader className="w-10 h-10 text-blue-500 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading {title}...</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">Please wait while we fetch the trainee data.</p>
            </div>
          ) : filteredTrainees.length === 0 ? (
            <div className="text-center py-8">
              <LuUserCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'No trainees found matching your search.' : 'No trainees available.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTrainees.map((trainee, index) => (
                <div key={trainee._id || index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  {/* Profile Image */}
                  <div className="flex-shrink-0">
                    {trainee.profileImageUrl ? (
                      <img
                        src={trainee.profileImageUrl}
                        alt={trainee.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                        <LuUserCheck className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Trainee Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">
                      {trainee.name || 'Unknown Name'}
                    </h3>
                    
                    <div className="flex items-center space-x-1 text-xs text-gray-600 mb-1">
                      <LuMail className="w-3 h-3" />
                      <span className="truncate">{trainee.email || 'No email'}</span>
                    </div>

                    {/* Department */}
                    {trainee.department && (
                      <div className="flex items-center space-x-1 text-xs text-gray-600 mb-1">
                        <LuIdCard className="w-3 h-3" />
                        <span className="truncate">{trainee.department}</span>
                      </div>
                    )}

                    {/* Clock-in Status */}
                    <div className="flex items-center space-x-1">
                      <LuClock className="w-3 h-3 text-gray-400" />
                      {trainee.lastClockIn ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-green-600 font-medium">Clocked In</span>
                          <span className="text-xs text-gray-500">
                            at {moment(trainee.lastClockIn).format('HH:mm')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">Not clocked in</span>
                      )}
                    </div>

                    {/* Assignment Status */}
                    {showAssignmentStatus && (
                      <div className="mt-1">
                        {title === "Assigned Trainees" ? (
                          // If this is from the trainer dashboard, these trainees are assigned to the current trainer
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-blue-600 font-medium">Assigned</span>
                            <span className="text-xs text-gray-500">
                              to Current Trainer
                            </span>
                          </div>
                        ) : trainee.assignedTrainer ? (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-blue-600 font-medium">Assigned</span>
                            <span className="text-xs text-gray-500">
                              to {trainee.assignedTrainer.name || 'Trainer'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-orange-600 font-medium">Unassigned</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status Indicator */}
                  <div className="flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full ${
                      trainee.lastClockIn ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            Showing {filteredTrainees.length} of {trainees.length} trainees
          </p>
        </div>
      </div>
    </div>
  );
};

export default TraineesPopup;
