import React, { useState, useEffect } from 'react';
import { LuX, LuSearch, LuClock, LuUser, LuMail, LuIdCard, LuLoader } from 'react-icons/lu';
import moment from 'moment';

const TrainersPopup = ({ isOpen, onClose, trainers = [], isLoading = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTrainers, setFilteredTrainers] = useState([]);

  // Filter trainers based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTrainers(trainers);
    } else {
      const filtered = trainers.filter(trainer => 
        trainer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainer.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTrainers(filtered);
    }
  }, [searchTerm, trainers]);

  // Reset search when popup opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setFilteredTrainers(trainers);
    }
  }, [isOpen, trainers]);

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
          <h2 className="text-xl font-semibold text-gray-900">Total Trainers</h2>
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

        {/* Trainers List */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <LuLoader className="w-10 h-10 text-purple-500 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Trainers...</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">Please wait while we fetch the trainer data.</p>
            </div>
          ) : filteredTrainers.length === 0 ? (
            <div className="text-center py-8">
              <LuUser className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'No trainers found matching your search.' : 'No trainers available.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTrainers.map((trainer, index) => (
                <div key={trainer._id || index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  {/* Profile Image */}
                  <div className="flex-shrink-0">
                    {trainer.profileImageUrl ? (
                      <img
                        src={trainer.profileImageUrl}
                        alt={trainer.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                        <LuUser className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Trainer Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {trainer.name || 'Unknown Name'}
                      </h3>
                      {trainer.employeeId && (
                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                          ID: {trainer.employeeId}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1 text-xs text-gray-600 mb-1">
                      <LuMail className="w-3 h-3" />
                      <span className="truncate">{trainer.email || 'No email'}</span>
                    </div>

                    {/* Clock-in Status */}
                    <div className="flex items-center space-x-1">
                      <LuClock className="w-3 h-3 text-gray-400" />
                      {trainer.lastClockIn ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-green-600 font-medium">Clocked In</span>
                          <span className="text-xs text-gray-500">
                            at {moment(trainer.lastClockIn).format('HH:mm')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">Not clocked in</span>
                      )}
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full ${
                      trainer.lastClockIn ? 'bg-green-500' : 'bg-gray-300'
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
            Showing {filteredTrainers.length} of {trainers.length} trainers
          </p>
        </div>
      </div>
    </div>
  );
};

export default TrainersPopup;
