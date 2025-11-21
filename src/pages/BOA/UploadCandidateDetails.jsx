import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { LuLoader, LuInfo, LuCheck, LuUpload, LuCloudUpload, LuDatabase } from 'react-icons/lu';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';

const UploadCandidateDetails = () => {
  const location = useLocation();
  const activeMenu = location.pathname === '/boa/upload-candidate-details' 
    ? 'Upload Candidate Details' 
    : 'New Joiners';

  // Bulk upload state (like Upload New Joiners Data)
  const [step, setStep] = useState(1); // 1: JSON Config, 2: Review Data, 3: Upload
  const [jsonData, setJsonData] = useState({});
  // Single Google Sheet URL (with multiple sub-sheets)
  const [googleSheetUrl, setGoogleSheetUrl] = useState(import.meta.env.VITE_CANDIDATE_REPORTS_SHEET_URL || '');
  const [reportsData, setReportsData] = useState([]);
  const [validationResult, setValidationResult] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkErrors, setBulkErrors] = useState([]);
  const [dataFromSheets, setDataFromSheets] = useState(false);



  // Bulk upload handlers (similar to Upload New Joiners Data)
  const handleJsonChange = (e) => {
    const value = e.target.value.trim();
    
    if (value === '') {
      setJsonData({});
      setBulkErrors([]);
      return;
    }
    
    try {
      const parsed = JSON.parse(value);
      setJsonData(parsed);
      setBulkErrors([]);
    } catch (error) {
      setBulkErrors(['Invalid JSON format']);
    }
  };

  const handleValidateSheets = async () => {
    if (Object.keys(jsonData).length === 0) {
      setBulkErrors(['Please provide JSON configuration']);
      return;
    }
    
    if (!jsonData.spread_sheet_name || !jsonData.data_sets_to_be_loaded) {
      setBulkErrors(['Please provide valid JSON configuration with spread_sheet_name and data_sets_to_be_loaded']);
      return;
    }

    // Check if Google Sheet URL is configured
    if (!googleSheetUrl || !googleSheetUrl.trim()) {
      setBulkErrors(['Google Sheet URL is required. Please configure VITE_CANDIDATE_REPORTS_SHEET_URL in your .env file or enter it manually.']);
      return;
    }

    setBulkLoading(true);
    setBulkErrors([]);

    try {
      const requestPayload = {
        spread_sheet_name: jsonData.spread_sheet_name,
        data_sets_to_be_loaded: jsonData.data_sets_to_be_loaded,
        google_sheet_url: googleSheetUrl.trim()
      };

      const response = await axiosInstance.post(API_PATHS.JOINERS.VALIDATE_CANDIDATE_REPORTS_SHEETS, requestPayload);

      setValidationResult(response.data);
      
      // Extract reports data from Google Sheets response
      // Backend returns: { message, data: { data: reportsData } }
      // Apps Script returns: { success: true, data: [{ author_id, learningReport, ... }] }
      let extractedData = null;
      
      console.log('Validation response:', response.data);
      
      if (response.data && response.data.data) {
        const responseData = response.data.data;
        console.log('Response data structure:', {
          type: typeof responseData,
          isArray: Array.isArray(responseData),
          hasData: !!responseData.data,
          dataType: typeof responseData.data,
          dataIsArray: Array.isArray(responseData.data),
          dataLength: responseData.data?.length
        });
        
        // Check if responseData.data exists and is an array (nested structure)
        if (responseData.data && Array.isArray(responseData.data) && responseData.data.length > 0) {
          extractedData = responseData.data;
          console.log(`Extracted ${extractedData.length} reports from responseData.data`);
        } 
        // Check if responseData itself is an array
        else if (Array.isArray(responseData) && responseData.length > 0) {
          extractedData = responseData;
          console.log(`Extracted ${extractedData.length} reports from responseData (direct array)`);
        }
        // Check if response.data is directly an array
        else if (Array.isArray(response.data) && response.data.length > 0) {
          extractedData = response.data;
          console.log(`Extracted ${extractedData.length} reports from response.data (direct array)`);
        }
      }
      
      console.log('Final extractedData:', extractedData);
      
      if (extractedData && extractedData.length > 0) {
        setReportsData(extractedData);
        setDataFromSheets(true);
        toast.success(`Data fetched from Google Sheets successfully! Found ${extractedData.length} candidate reports.`);
      } else {
        // Check if Google Sheet URL was provided
        if (!googleSheetUrl || !googleSheetUrl.trim()) {
          toast.success('Configuration validated! Please configure VITE_CANDIDATE_REPORTS_SHEET_URL in .env file to fetch data from Google Sheets.');
        } else {
          toast.success('Configuration validated! No data found in Google Sheets. You can now add candidate reports data manually.');
        }
        setReportsData([]);
        setDataFromSheets(false);
      }
      
      setStep(2);
    } catch (error) {
      console.error('Validation error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to validate Google Sheets';
      setBulkErrors([errorMessage]);
      toast.error(errorMessage);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleReportsDataChange = (e) => {
    try {
      const parsed = JSON.parse(e.target.value);
      if (Array.isArray(parsed)) {
        setReportsData(parsed);
        setBulkErrors([]);
      } else {
        setBulkErrors(['Reports data must be an array']);
      }
    } catch (error) {
      setBulkErrors(['Invalid JSON format for reports data']);
    }
  };

  // Validate all author_ids before upload
  const validateAllAuthorIds = async (reportsData) => {
    const validationErrors = [];
    const validReports = [];

    for (let i = 0; i < reportsData.length; i++) {
      const report = reportsData[i];
      if (!report.author_id) {
        validationErrors.push(`Row ${i + 1}: author_id is required`);
        continue;
      }

      try {
        const response = await axiosInstance.post(API_PATHS.JOINERS.VALIDATE_AUTHOR_ID, {
          author_id: report.author_id
        });

        if (response.data.success) {
          validReports.push(report);
        } else {
          validationErrors.push(`Row ${i + 1}: ${response.data.message}`);
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || `Row ${i + 1}: Failed to validate author_id ${report.author_id}`;
        validationErrors.push(errorMessage);
      }
    }

    return { validReports, validationErrors };
  };

  const handleBulkUpload = async () => {
    if (!reportsData.length) {
      setBulkErrors(['No candidate reports data provided']);
      return;
    }

    setBulkLoading(true);
    setBulkErrors([]);

    try {
      // First, validate all author_ids
      toast.loading('Validating author IDs...', { id: 'validating' });
      const { validReports, validationErrors } = await validateAllAuthorIds(reportsData);

      if (validationErrors.length > 0) {
        toast.dismiss('validating');
        setBulkErrors(validationErrors);
        toast.error(`${validationErrors.length} validation error(s) found. Please fix them before uploading.`);
        return;
      }

      if (validReports.length === 0) {
        toast.dismiss('validating');
        setBulkErrors(['No valid reports to upload']);
        toast.error('No valid reports to upload');
        return;
      }

      toast.dismiss('validating');
      toast.loading('Uploading reports...', { id: 'uploading' });

      const response = await axiosInstance.post(API_PATHS.JOINERS.BULK_UPLOAD_CANDIDATE_REPORTS, {
        spread_sheet_name: jsonData.spread_sheet_name,
        data_sets_to_be_loaded: jsonData.data_sets_to_be_loaded,
        google_sheet_url: googleSheetUrl.trim() || null,
        candidate_reports_data: validReports
      });

      toast.dismiss('uploading');
      toast.success(`Successfully uploaded ${response.data.createdCount} new reports and updated ${response.data.updatedCount} existing reports!`);
      
      if (response.data.errors && response.data.errors.length > 0) {
        setBulkErrors(response.data.errors);
      }
      
      setStep(1);
      setJsonData({});
      setReportsData([]);
      setValidationResult(null);
      setDataFromSheets(false);
      setBulkErrors([]);
    } catch (error) {
      toast.dismiss('validating');
      toast.dismiss('uploading');
      console.error('Upload error:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to upload candidate reports data';
      const errorDetails = error.response?.data?.errors || [];
      const errorStack = error.response?.data?.stack;
      
      // Build comprehensive error list
      const allErrors = [errorMessage];
      if (errorDetails && Array.isArray(errorDetails) && errorDetails.length > 0) {
        allErrors.push(...errorDetails);
      }
      if (errorStack && process.env.NODE_ENV === 'development') {
        allErrors.push(`Stack: ${errorStack.split('\n')[0]}`);
      }
      
      setBulkErrors(allErrors);
      toast.error(errorMessage);
    } finally {
      setBulkLoading(false);
    }
  };


  return (
    <DashboardLayout activeMenu={activeMenu}>
      <div className="mt-5 mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Candidate Details</h2>

        {/* Bulk Upload Section (like Upload New Joiners Data) */}
        <div className="card mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <LuCloudUpload className="mr-2" />
            Upload Candidate Reports from Google Sheets
          </h3>

          {step === 1 && (
            <div className="space-y-4">
              {!googleSheetUrl && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <div className="flex items-start space-x-2">
                    <LuInfo className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Google Sheet URL not configured</p>
                      <p className="mt-1">To fetch data from Google Sheets, configure <code className="bg-yellow-100 px-1 rounded">VITE_CANDIDATE_REPORTS_SHEET_URL</code> in your <code className="bg-yellow-100 px-1 rounded">.env</code> file and restart the dev server.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-start space-x-2">
                  <LuInfo className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Single Google Sheet with Multiple Sub-Sheets</p>
                    <p className="mt-1">The system will automatically detect and combine sub-sheets:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li><strong>Learning Report:</strong> DailyQuizReports, FortnightScores, CourseExamScores, OnlineDemoReports, OfflineDemoReports</li>
                      <li><strong>Attendance Report:</strong> AttendanceReport</li>
                      <li><strong>Grooming Report:</strong> GroomingReport</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  JSON Configuration
                </label>
                <textarea
                  value={Object.keys(jsonData).length === 0 ? '' : JSON.stringify(jsonData, null, 2)}
                  onChange={handleJsonChange}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder='{
  "spread_sheet_name": "Your_Spreadsheet_Name",
  "data_sets_to_be_loaded": ["Your_Dataset_Name"]
}'
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your spreadsheet configuration in JSON format. Google Sheet URL is automatically configured from environment settings.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Sheet URL (with sub-sheets)
                </label>
                <input
                  type="text"
                  value={googleSheetUrl}
                  onChange={(e) => setGoogleSheetUrl(e.target.value)}
                  placeholder="https://script.google.com/.../exec"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Google Apps Script URL for the sheet containing all sub-sheets (DailyQuizReports, FortnightScores, CourseExamScores, OnlineDemoReports, OfflineDemoReports, AttendanceReport, GroomingReport)
                </p>
              </div>

              {bulkErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <ul className="list-disc list-inside text-sm text-red-700">
                    {bulkErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={handleValidateSheets}
                disabled={bulkLoading || Object.keys(jsonData).length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {bulkLoading ? (
                  <>
                    <LuLoader className="animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <LuCheck />
                    Validate & Fetch Data
                  </>
                )}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <LuCheck className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">
                    {reportsData.length > 0 ? 'Data loaded from Google Sheets!' : 'Configuration validated successfully!'}
                  </span>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  {reportsData.length > 0 
                    ? `Found ${reportsData.length} candidate reports from your Google Sheet. Review and upload the data.`
                    : 'Spreadsheet name and datasets match. You can now add your candidate reports data.'
                  }
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Candidate Reports Data (JSON Array)
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  {reportsData.length > 0 
                    ? `Found ${reportsData.length} records from Google Sheets. Review the data below.`
                    : 'Add your candidate reports data in JSON format. Each object should contain author_id and report data.'
                  }
                </p>
                <textarea
                  value={reportsData.length > 0 ? JSON.stringify(reportsData, null, 2) : ''}
                  onChange={handleReportsDataChange}
                  rows={12}
                  readOnly={reportsData.length > 0 && dataFromSheets}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${
                    reportsData.length > 0 && dataFromSheets
                      ? 'bg-gray-50 text-gray-600 cursor-not-allowed' 
                      : reportsData.length === 0 
                        ? 'border-blue-300 bg-blue-50' 
                        : ''
                  }`}
                  placeholder='[
  {
    "author_id": "candidate-author-id-1",
    "learningReport": { ... },
    "attendanceReport": { ... },
    "groomingReport": { ... },
    "culturalReport": { ... }
  }
]'
                />
                <p className="text-xs text-gray-500 mt-1">
                  {reportsData.length > 0 && dataFromSheets
                    ? 'Data loaded from Google Sheets. Review the data and click "Upload Data" to save to database.'
                    : 'Enter an array of candidate report objects with author_id and report data. Replace the placeholder with your actual data.'
                  }
                </p>
              </div>

              {bulkErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <ul className="list-disc list-inside text-sm text-red-700">
                    {bulkErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setStep(1);
                    setReportsData([]);
                    setValidationResult(null);
                    setDataFromSheets(false);
                    setBulkErrors([]);
                  }}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Back
                </button>
                <button
                  onClick={handleBulkUpload}
                  disabled={bulkLoading || !reportsData.length}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {bulkLoading ? (
                    <>
                      <LuLoader className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <LuUpload />
                      Upload Data
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <LuDatabase className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-800 font-medium">Upload Complete</span>
                </div>
                <div className="text-sm text-blue-700 space-y-1">
                  <p><strong>Spreadsheet:</strong> {jsonData.spread_sheet_name}</p>
                  <p><strong>Datasets:</strong> {jsonData.data_sets_to_be_loaded.join(', ')}</p>
                  <p><strong>Reports Processed:</strong> {reportsData.length}</p>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
};

export default UploadCandidateDetails;

