import React, { useState } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-hot-toast';
import { LuRefreshCw, LuUsers, LuUserPlus, LuFileText, LuDatabase, LuLoader } from 'react-icons/lu';

const GoogleSheetsSync = () => {
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [loading, setLoading] = useState({
    users: false,
    joiners: false,
    reports: false,
    all: false,
  });

  const handleSync = async (type, sheetName = null) => {
    if (!spreadsheetId.trim()) {
      toast.error('Please enter a Spreadsheet ID');
      return;
    }

    setLoading(prev => ({ ...prev, [type]: true }));

    try {
      let endpoint = '';
      let body = { spreadsheet_id: spreadsheetId };

      switch (type) {
        case 'users':
          endpoint = '/api/sync/users';
          if (sheetName) body.sheet_name = sheetName;
          break;
        case 'joiners':
          endpoint = '/api/sync/joiners';
          if (sheetName) body.sheet_name = sheetName;
          break;
        case 'reports':
          endpoint = '/api/sync/candidate-reports';
          body.report_type = 'all';
          break;
        case 'all':
          endpoint = '/api/sync/all';
          break;
        default:
          throw new Error('Invalid sync type');
      }

      const response = await axiosInstance.post(endpoint, body);

      if (response.data.success) {
        toast.success(response.data.message || 'Sync completed successfully!');
      } else {
        toast.error(response.data.message || 'Sync failed');
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Error syncing data to Google Sheets'
      );
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const getSpreadsheetIdFromUrl = (url) => {
    try {
      const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      return match ? match[1] : '';
    } catch {
      return '';
    }
  };

  const handlePasteUrl = (e) => {
    const url = e.clipboardData.getData('text');
    const id = getSpreadsheetIdFromUrl(url);
    if (id) {
      setSpreadsheetId(id);
      toast.success('Spreadsheet ID extracted from URL');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Google Sheets Sync</h1>
          <p className="text-gray-600">
            Sync portal data to Google Sheets automatically. Make sure you've configured Google Sheets API credentials.
          </p>
        </div>

        {/* Spreadsheet ID Input */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Google Spreadsheet ID
          </label>
          <input
            type="text"
            value={spreadsheetId}
            onChange={(e) => setSpreadsheetId(e.target.value)}
            onPaste={handlePasteUrl}
            placeholder="Enter Spreadsheet ID or paste Google Sheets URL"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <p className="mt-2 text-xs text-gray-500">
            You can find the Spreadsheet ID in the URL: https://docs.google.com/spreadsheets/d/<strong>SPREADSHEET_ID</strong>/edit
          </p>
        </div>

        {/* Sync Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sync Users */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <LuUsers className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sync Users</h3>
                <p className="text-sm text-gray-500">Export all users data</p>
              </div>
            </div>
            <button
              onClick={() => handleSync('users')}
              disabled={loading.users || !spreadsheetId}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading.users ? (
                <>
                  <LuLoader className="w-4 h-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <LuRefreshCw className="w-4 h-4" />
                  Sync Users
                </>
              )}
            </button>
          </div>

          {/* Sync Joiners */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <LuUserPlus className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sync Joiners</h3>
                <p className="text-sm text-gray-500">Export all joiners data</p>
              </div>
            </div>
            <button
              onClick={() => handleSync('joiners')}
              disabled={loading.joiners || !spreadsheetId}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading.joiners ? (
                <>
                  <LuLoader className="w-4 h-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <LuRefreshCw className="w-4 h-4" />
                  Sync Joiners
                </>
              )}
            </button>
          </div>

          {/* Sync Candidate Reports */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <LuFileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sync Reports</h3>
                <p className="text-sm text-gray-500">Export candidate reports</p>
              </div>
            </div>
            <button
              onClick={() => handleSync('reports')}
              disabled={loading.reports || !spreadsheetId}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading.reports ? (
                <>
                  <LuLoader className="w-4 h-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <LuRefreshCw className="w-4 h-4" />
                  Sync Reports
                </>
              )}
            </button>
          </div>

          {/* Sync All */}
          <div className="bg-white rounded-lg shadow-sm border-2 border-purple-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <LuDatabase className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sync All Data</h3>
                <p className="text-sm text-gray-500">Export everything at once</p>
              </div>
            </div>
            <button
              onClick={() => handleSync('all')}
              disabled={loading.all || !spreadsheetId}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading.all ? (
                <>
                  <LuLoader className="w-4 h-4 animate-spin" />
                  Syncing All...
                </>
              ) : (
                <>
                  <LuRefreshCw className="w-4 h-4" />
                  Sync All
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleSheetsSync;

