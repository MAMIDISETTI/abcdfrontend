import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LuLayoutDashboard, LuChevronLeft, LuSearch, LuInfo } from 'react-icons/lu';

const NotFound = () => {
  const navigate = useNavigate();

  const goHome = () => {
    navigate('/');
  };

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Icon */}
        <div className="mb-8">
          <div className="relative">
            <div className="w-32 h-32 mx-auto bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
              <LuInfo className="w-16 h-16 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">!</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
          <p className="text-gray-600 leading-relaxed">
            Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={goHome}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <LuLayoutDashboard className="w-5 h-5" />
            <span>Go to Dashboard</span>
          </button>
          
          <button
            onClick={goBack}
            className="w-full bg-white text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200 flex items-center justify-center space-x-2 border border-gray-300 hover:border-gray-400"
          >
            <LuChevronLeft className="w-5 h-5" />
            <span>Go Back</span>
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-center space-x-2 text-blue-700 mb-2">
            <LuSearch className="w-5 h-5" />
            <span className="font-medium">Need Help?</span>
          </div>
          <p className="text-sm text-blue-600">
            If you believe this is an error, please contact your administrator or check the URL for typos.
          </p>
        </div>

        {/* Fun Element */}
        <div className="mt-8">
          <div className="inline-flex items-center space-x-2 text-gray-500 text-sm">
            <span>Lost in cyberspace?</span>
            <span className="animate-bounce">🚀</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
